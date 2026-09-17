import { spawn } from "node:child_process"
import path from "node:path"
import type { CodeSandbox } from "@/server/interfaces/code-sandbox"
import type { CodeSubmission, ExecutionResult, TestCase, TestCaseResult } from "@/server/models/domain"

const DEFAULT_TIMEOUT_MS = Number(process.env.DSA_SANDBOX_TIMEOUT_MS ?? 5000)
const PYTHON_BIN = process.env.DSA_PYTHON_BIN ?? "python3"
const WORKER_SCRIPT_PATH = path.join(process.cwd(), "src/server/sandbox/python_worker.py")

// Same failure mode the Node sandbox's comment block describes (an infinite async/thread spin
// that never yields control back) applies here too, just in a different guise: a submission
// that spawns a background thread and returns immediately would let the *worker process* exit
// promptly, but a submission that spawns a non-daemon thread or a subprocess of its own would
// hang the worker process forever, and a plain `child.kill()` only signals the direct child —
// any grandchild process it spawned survives as an orphan. Spawning with `detached: true` puts
// the worker in its own process group, so `process.kill(-pid, "SIGKILL")` (note the negative
// pid — that's the "whole group" form) reliably kills the worker and everything it spawned.
// The parent enforces this as a wall-clock deadline via `setTimeout`, on *this* thread's event
// loop, which the worker process can never block since it's a separate OS process.
function timeoutResult(testCases: TestCase[], runtimeMs: number): ExecutionResult {
  return {
    allPassed: false,
    results: testCases.map(
      (testCase): TestCaseResult => ({
        status: "timeout",
        input: [],
        expected: undefined,
        actual: undefined,
        isHidden: false,
        stdout: "",
        errorMessage: "Execution exceeded the wall-clock time limit",
        name: testCase.name,
      })
    ),
    runtimeMs,
  }
}

function errorResult(testCases: TestCase[], runtimeMs: number, message: string): ExecutionResult {
  return {
    allPassed: false,
    results: testCases.map(
      (testCase): TestCaseResult => ({
        status: "runtime_error",
        input: [],
        expected: undefined,
        actual: undefined,
        isHidden: false,
        stdout: "",
        errorMessage: message,
        name: testCase.name,
      })
    ),
    runtimeMs,
  }
}

export class PythonSubprocessSandbox implements CodeSandbox {
  constructor(private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS) {}

  async run(submission: CodeSubmission, testCases: TestCase[]): Promise<ExecutionResult> {
    const start = performance.now()
    const deadlineMs = this.timeoutMs * (testCases.length + 1) + 1000

    return new Promise<ExecutionResult>((resolve) => {
      const child = spawn(PYTHON_BIN, [WORKER_SCRIPT_PATH], {
        detached: true,
        stdio: ["pipe", "pipe", "pipe"],
      })

      let settled = false
      let stdout = ""
      let stderr = ""

      const finish = (result: ExecutionResult) => {
        if (settled) return
        settled = true
        clearTimeout(deadlineTimer)
        child.stdout.removeAllListeners()
        child.stderr.removeAllListeners()
        child.removeAllListeners()
        if (child.pid) {
          try {
            process.kill(-child.pid, "SIGKILL")
          } catch {
            // Process group may have already exited — nothing to clean up.
          }
        }
        resolve(result)
      }

      const deadlineTimer = setTimeout(() => {
        finish(timeoutResult(testCases, performance.now() - start))
      }, deadlineMs)

      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8")
      })

      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf8")
      })

      child.on("error", (error) => {
        finish(errorResult(testCases, performance.now() - start, error.message))
      })

      child.on("exit", (code) => {
        if (settled) return

        if (code !== 0) {
          finish(
            errorResult(
              testCases,
              performance.now() - start,
              stderr.trim() || `Sandbox process exited with code ${code}`
            )
          )
          return
        }

        try {
          const parsed = JSON.parse(stdout) as ExecutionResult
          finish({ ...parsed, runtimeMs: performance.now() - start })
        } catch {
          finish(
            errorResult(
              testCases,
              performance.now() - start,
              stderr.trim() || "Sandbox process produced no parseable result"
            )
          )
        }
      })

      child.stdin.write(JSON.stringify({ submission, testCases }))
      child.stdin.end()
    })
  }
}
