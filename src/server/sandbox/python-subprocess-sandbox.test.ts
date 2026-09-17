import { describe, expect, it } from "vitest"
import { PythonSubprocessSandbox } from "@/server/sandbox/python-subprocess-sandbox"
import type { TestCase } from "@/server/models/domain"

const TIMEOUT_MS = 1000

function testCase(input: unknown[], expected: unknown): TestCase {
  return { input, expected, isHidden: false }
}

describe("PythonSubprocessSandbox", () => {
  it("passes a correct submission", async () => {
    const sandbox = new PythonSubprocessSandbox(TIMEOUT_MS)
    const result = await sandbox.run(
      { code: "def add(a, b):\n    return a + b\n", functionName: "add", language: "python" },
      [testCase([1, 2], 3), testCase([2, 2], 4)]
    )

    expect(result.allPassed).toBe(true)
    expect(result.results.map((r) => r.status)).toEqual(["passed", "passed"])
  })

  it("reports wrong_answer for an incorrect submission", async () => {
    const sandbox = new PythonSubprocessSandbox(TIMEOUT_MS)
    const result = await sandbox.run(
      { code: "def add(a, b):\n    return a - b\n", functionName: "add", language: "python" },
      [testCase([1, 2], 3)]
    )

    expect(result.allPassed).toBe(false)
    expect(result.results[0].status).toBe("wrong_answer")
  })

  it("reports a runtime error for an exception raised during execution", async () => {
    const sandbox = new PythonSubprocessSandbox(TIMEOUT_MS)
    const result = await sandbox.run(
      { code: "def f(x):\n    return 1 / 0\n", functionName: "f", language: "python" },
      [testCase([1], null)]
    )

    expect(result.allPassed).toBe(false)
    expect(result.results[0].status).toBe("runtime_error")
    expect(result.results[0].errorMessage).toContain("ZeroDivisionError")
  })

  it("reports a runtime error (not a crash) for a syntax error in submitted code", async () => {
    const sandbox = new PythonSubprocessSandbox(TIMEOUT_MS)
    const result = await sandbox.run(
      { code: "def f(:\n    pass", functionName: "f", language: "python" },
      [testCase([], null)]
    )

    expect(result.allPassed).toBe(false)
    expect(result.results[0].status).toBe("runtime_error")
    expect(result.results[0].errorMessage).toContain("SyntaxError")
  })

  it("times out a synchronous infinite loop within roughly the configured timeout", async () => {
    const sandbox = new PythonSubprocessSandbox(TIMEOUT_MS)
    const start = performance.now()

    const result = await sandbox.run(
      { code: "def f():\n    while True:\n        pass\n", functionName: "f", language: "python" },
      [testCase([], null)]
    )

    const elapsed = performance.now() - start

    expect(result.allPassed).toBe(false)
    expect(result.results[0].status).toBe("timeout")
    expect(elapsed).toBeLessThan(TIMEOUT_MS * 10)
  }, 15000)

  // Python analog of the Node sandbox's async-microtask-spin test: a submission that spawns a
  // *non-daemon* thread and returns immediately still leaves the interpreter process alive
  // (Python won't exit while a non-daemon thread is running), which is exactly the "returns
  // control but never actually yields" failure mode — only a wall-clock process-group kill
  // catches it, since the returned value is never produced.
  it("bounds a submission that spawns a non-daemon background thread and never returns", async () => {
    const sandbox = new PythonSubprocessSandbox(TIMEOUT_MS)
    const start = performance.now()

    const result = await sandbox.run(
      {
        code: [
          "import threading",
          "",
          "def f():",
          "    def spin():",
          "        while True:",
          "            pass",
          "    t = threading.Thread(target=spin, daemon=False)",
          "    t.start()",
          "    t.join()",
          "    return 1",
          "",
        ].join("\n"),
        functionName: "f",
        language: "python",
      },
      [testCase([], 1)]
    )

    const elapsed = performance.now() - start

    expect(result.allPassed).toBe(false)
    expect(result.results[0].status).toBe("timeout")
    expect(elapsed).toBeLessThan(TIMEOUT_MS * 10)
  }, 15000)

  it("reports a compile-time error when the function is not defined", async () => {
    const sandbox = new PythonSubprocessSandbox(TIMEOUT_MS)
    const result = await sandbox.run(
      { code: "not_a_function = 1\n", functionName: "f", language: "python" },
      [testCase([], null)]
    )

    expect(result.allPassed).toBe(false)
    expect(result.results[0].status).toBe("runtime_error")
  })
})
