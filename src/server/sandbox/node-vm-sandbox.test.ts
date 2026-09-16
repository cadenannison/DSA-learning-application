import { describe, expect, it } from "vitest"
import { NodeVmSandbox } from "@/server/sandbox/node-vm-sandbox"
import type { TestCase } from "@/server/models/domain"

const TIMEOUT_MS = 200

function testCase(input: unknown[], expected: unknown): TestCase {
  return { input, expected, isHidden: false }
}

describe("NodeVmSandbox", () => {
  it("passes a correct submission", async () => {
    const sandbox = new NodeVmSandbox(TIMEOUT_MS)
    const result = await sandbox.run(
      { code: "function add(a, b) { return a + b; }", functionName: "add", language: "javascript" },
      [testCase([1, 2], 3), testCase([2, 2], 4)]
    )

    expect(result.allPassed).toBe(true)
    expect(result.results.map((r) => r.status)).toEqual(["passed", "passed"])
  })

  it("reports wrong_answer for an incorrect submission", async () => {
    const sandbox = new NodeVmSandbox(TIMEOUT_MS)
    const result = await sandbox.run(
      { code: "function add(a, b) { return a - b; }", functionName: "add", language: "javascript" },
      [testCase([1, 2], 3)]
    )

    expect(result.allPassed).toBe(false)
    expect(result.results[0].status).toBe("wrong_answer")
  })

  it("times out a synchronous infinite loop within roughly the configured timeout", async () => {
    const sandbox = new NodeVmSandbox(TIMEOUT_MS)
    const start = performance.now()

    const result = await sandbox.run(
      {
        code: "function f() { while (true) {} }",
        functionName: "f",
        language: "javascript",
      },
      [testCase([], null)]
    )

    const elapsed = performance.now() - start

    expect(result.allPassed).toBe(false)
    expect(result.results[0].status).toBe("timeout")
    // Generous upper bound — bounds wall-clock time, doesn't need to be tight.
    expect(elapsed).toBeLessThan(TIMEOUT_MS * 10)
  }, 15000)

  it("bounds an async infinite-microtask-loop submission within wall-clock time instead of hanging", async () => {
    const sandbox = new NodeVmSandbox(TIMEOUT_MS)
    const start = performance.now()

    const result = await sandbox.run(
      {
        code: `
          async function f() {
            while (true) {
              await Promise.resolve();
            }
          }
        `,
        functionName: "f",
        language: "javascript",
      },
      [testCase([], null)]
    )

    const elapsed = performance.now() - start

    expect(result.allPassed).toBe(false)
    expect(result.results[0].status).toBe("timeout")
    expect(elapsed).toBeLessThan(TIMEOUT_MS * 10)
  }, 15000)

  it("does not hang on an unconsumed infinite generator and does not report wrong_answer", async () => {
    const sandbox = new NodeVmSandbox(TIMEOUT_MS)
    const start = performance.now()

    const result = await sandbox.run(
      {
        code: `
          function* f() {
            while (true) yield 1;
          }
        `,
        functionName: "f",
        language: "javascript",
      },
      [testCase([], [1, 1, 1])]
    )

    const elapsed = performance.now() - start

    expect(result.allPassed).toBe(false)
    expect(result.results[0].status).not.toBe("wrong_answer")
    expect(elapsed).toBeLessThan(TIMEOUT_MS * 10)
  }, 15000)

  it("reports a compile-time error when the function is not defined", async () => {
    const sandbox = new NodeVmSandbox(TIMEOUT_MS)
    const result = await sandbox.run(
      { code: "const notAFunction = 1;", functionName: "f", language: "javascript" },
      [testCase([], null)]
    )

    expect(result.allPassed).toBe(false)
    expect(result.results[0].status).toBe("runtime_error")
  })
})
