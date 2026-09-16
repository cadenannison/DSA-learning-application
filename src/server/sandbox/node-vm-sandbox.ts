import { Worker } from "node:worker_threads"
import type { CodeSandbox } from "@/server/interfaces/code-sandbox"
import type { CodeSubmission, ExecutionResult, TestCase, TestCaseResult } from "@/server/models/domain"
import { deepEqual } from "@/server/sandbox/deep-equal"

const DEFAULT_TIMEOUT_MS = Number(process.env.DSA_SANDBOX_TIMEOUT_MS ?? 5000)

// The worker body below is handed to `new Worker(src, { eval: true })` as a plain string
// rather than loaded from a `.ts` file path, because Next.js's bundler never sees files
// loaded through worker_threads' own module resolution — a file-path worker would ship
// untranspiled TS at runtime. Keeping it self-contained also means it needs no imports
// beyond the `node:vm` builtin.
//
// Why a worker thread at all, and not just `vm`'s own `timeout` option: `vm.Script.runInContext`
// with `{ timeout }` only bounds *synchronous* execution. A submission that returns a pending
// Promise (e.g. `async function f(){ while(true){ await Promise.resolve() } }`) returns control
// to the host almost immediately, so the timed call never trips — the promise's continuations
// then spin forever as microtasks, which also starves the host's own timer queue, so a plain
// `Promise.race` against `setTimeout` in the same thread never fires either. Running the
// submission in a worker thread lets the parent enforce a wall-clock deadline via
// `worker.terminate()`, which is a V8-isolate-level operation the starved worker can't block.
const WORKER_SOURCE = `
const vm = require("node:vm");
const { parentPort, workerData } = require("node:worker_threads");

function getErrorMessage(error) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return String(error);
}

function isThenable(value) {
  return (
    !!value &&
    (typeof value === "object" || typeof value === "function") &&
    typeof value.then === "function"
  );
}

function isIterator(value) {
  return (
    !!value &&
    typeof value === "object" &&
    typeof value.next === "function" &&
    typeof value.then !== "function"
  );
}

const deepEqual = ${deepEqual.toString()};

async function runOne(context, functionName, testCase, timeoutMs) {
  context.__input = testCase.input;

  try {
    const script = new vm.Script(functionName + "(...__input)", { filename: "invocation.js" });
    let actual = script.runInContext(context, { timeout: timeoutMs });

    if (isIterator(actual)) {
      throw new Error(
        '"' + functionName + '" returned a generator/iterator instead of a value — return an array or a resolved value'
      );
    }

    if (isThenable(actual)) {
      actual = await actual;
    }

    if (isIterator(actual)) {
      throw new Error(
        '"' + functionName + '" resolved to a generator/iterator instead of a value — return an array or a resolved value'
      );
    }

    const passed = deepEqual(actual, testCase.expected);

    return {
      status: passed ? "passed" : "wrong_answer",
      input: testCase.input,
      expected: testCase.expected,
      actual,
      isHidden: testCase.isHidden,
      stdout: "",
      errorMessage: null,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    const isTimeout = message.includes("Script execution timed out");
    const status = isTimeout ? "timeout" : "runtime_error";

    return {
      status,
      input: testCase.input,
      expected: testCase.expected,
      actual: undefined,
      isHidden: testCase.isHidden,
      stdout: "",
      errorMessage: message,
    };
  }
}

async function main() {
  const { submission, testCases, timeoutMs } = workerData;
  const start = performance.now();
  const context = vm.createContext({ console: { log: () => {}, error: () => {} } });

  let compileError = null;

  try {
    const definitionScript = new vm.Script(submission.code, { filename: "submission.js" });
    definitionScript.runInContext(context, { timeout: timeoutMs });

    const fnType = vm.runInContext("typeof " + submission.functionName, context);
    if (fnType !== "function") {
      throw new Error('"' + submission.functionName + '" is not defined as a function');
    }
  } catch (error) {
    const message = getErrorMessage(error);
    compileError = {
      status: message.includes("Script execution timed out") ? "timeout" : "runtime_error",
      input: [],
      expected: undefined,
      actual: undefined,
      isHidden: false,
      stdout: "",
      errorMessage: message,
    };
  }

  if (compileError) {
    parentPort.postMessage({
      allPassed: false,
      results: testCases.map(() => compileError),
      runtimeMs: performance.now() - start,
    });
    return;
  }

  const results = [];
  for (const testCase of testCases) {
    results.push(await runOne(context, submission.functionName, testCase, timeoutMs));
  }

  parentPort.postMessage({
    allPassed: results.every((result) => result.status === "passed"),
    results,
    runtimeMs: performance.now() - start,
  });
}

main().catch((error) => {
  parentPort.postMessage({ workerFatalError: getErrorMessage(error) });
});
`

function timeoutResult(testCases: TestCase[], runtimeMs: number): ExecutionResult {
  const result: TestCaseResult = {
    status: "timeout",
    input: [],
    expected: undefined,
    actual: undefined,
    isHidden: false,
    stdout: "",
    errorMessage: "Execution exceeded the wall-clock time limit",
  }

  return {
    allPassed: false,
    results: testCases.map(() => result),
    runtimeMs,
  }
}

function errorResult(testCases: TestCase[], runtimeMs: number, message: string): ExecutionResult {
  const result: TestCaseResult = {
    status: "runtime_error",
    input: [],
    expected: undefined,
    actual: undefined,
    isHidden: false,
    stdout: "",
    errorMessage: message,
  }

  return {
    allPassed: false,
    results: testCases.map(() => result),
    runtimeMs,
  }
}

export class NodeVmSandbox implements CodeSandbox {
  constructor(private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS) {}

  async run(submission: CodeSubmission, testCases: TestCase[]): Promise<ExecutionResult> {
    const start = performance.now()

    // The worker gets the same per-vm-call timeoutMs so a synchronous busy-loop is still
    // caught cheaply by vm's own mechanism; the outer deadline below is what catches
    // everything vm's timeout can't (async/microtask spins, undrained generators, etc.)
    // and is enforced by *this* thread's event loop, which the submission never touches.
    const deadlineMs = this.timeoutMs * (testCases.length + 1) + 1000

    return new Promise<ExecutionResult>((resolve) => {
      const worker = new Worker(WORKER_SOURCE, {
        eval: true,
        workerData: { submission, testCases, timeoutMs: this.timeoutMs },
      })

      let settled = false

      const finish = (result: ExecutionResult) => {
        if (settled) return
        settled = true
        clearTimeout(deadlineTimer)
        worker.removeAllListeners()
        void worker.terminate()
        resolve(result)
      }

      const deadlineTimer = setTimeout(() => {
        finish(timeoutResult(testCases, performance.now() - start))
      }, deadlineMs)

      worker.on("message", (message: ExecutionResult | { workerFatalError: string }) => {
        if ("workerFatalError" in message) {
          finish(errorResult(testCases, performance.now() - start, message.workerFatalError))
          return
        }
        finish(message)
      })

      worker.on("error", (error) => {
        finish(errorResult(testCases, performance.now() - start, error.message))
      })

      worker.on("exit", (code) => {
        if (code !== 0) {
          finish(errorResult(testCases, performance.now() - start, `Sandbox worker exited with code ${code}`))
        }
      })
    })
  }
}
