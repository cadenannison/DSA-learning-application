import vm from "node:vm"
import type { CodeSandbox } from "@/server/interfaces/code-sandbox"
import type {
  CodeSubmission,
  ExecutionResult,
  TestCase,
  TestCaseResult,
  TestOutcomeStatus,
} from "@/server/models/domain"

const DEFAULT_TIMEOUT_MS = Number(process.env.DSA_SANDBOX_TIMEOUT_MS ?? 5000)

// vm throws errors from a different realm, so `error instanceof Error` is unreliable here.
function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message)
  }
  return String(error)
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== typeof b) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((value, index) => deepEqual(value, b[index]))
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    if (aKeys.length !== bKeys.length) return false
    return aKeys.every((key) =>
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    )
  }
  return false
}

function runOne(
  context: vm.Context,
  functionName: string,
  testCase: TestCase,
  timeoutMs: number
): TestCaseResult {
  context.__input = testCase.input

  try {
    const script = new vm.Script(`${functionName}(...__input)`, { filename: "invocation.js" })
    const actual = script.runInContext(context, { timeout: timeoutMs })
    const passed = deepEqual(actual, testCase.expected)

    return {
      status: passed ? "passed" : "wrong_answer",
      input: testCase.input,
      expected: testCase.expected,
      actual,
      isHidden: testCase.isHidden,
      stdout: "",
      errorMessage: null,
    }
  } catch (error) {
    const message = getErrorMessage(error)
    const isTimeout = message.includes("Script execution timed out")
    const status: TestOutcomeStatus = isTimeout ? "timeout" : "runtime_error"

    return {
      status,
      input: testCase.input,
      expected: testCase.expected,
      actual: undefined,
      isHidden: testCase.isHidden,
      stdout: "",
      errorMessage: message,
    }
  }
}

export class NodeVmSandbox implements CodeSandbox {
  constructor(private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS) {}

  async run(submission: CodeSubmission, testCases: TestCase[]): Promise<ExecutionResult> {
    const start = performance.now()
    const context = vm.createContext({ console: { log: () => {}, error: () => {} } })

    let compileError: TestCaseResult | null = null

    try {
      const definitionScript = new vm.Script(submission.code, { filename: "submission.js" })
      definitionScript.runInContext(context, { timeout: this.timeoutMs })

      const fnType = vm.runInContext(`typeof ${submission.functionName}`, context)
      if (fnType !== "function") {
        throw new Error(`"${submission.functionName}" is not defined as a function`)
      }
    } catch (error) {
      const message = getErrorMessage(error)
      compileError = {
        status: message.includes("Script execution timed out") ? "timeout" : "runtime_error",
        input: [],
        expected: undefined,
        actual: undefined,
        isHidden: false,
        stdout: "",
        errorMessage: message,
      }
    }

    if (compileError) {
      return {
        allPassed: false,
        results: testCases.map(() => compileError as TestCaseResult),
        runtimeMs: performance.now() - start,
      }
    }

    const results = testCases.map((testCase) =>
      runOne(context, submission.functionName, testCase, this.timeoutMs)
    )

    return {
      allPassed: results.every((result) => result.status === "passed"),
      results,
      runtimeMs: performance.now() - start,
    }
  }
}
