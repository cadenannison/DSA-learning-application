import type { ExecutionResult } from "@/server/models/domain"

/**
 * Strips input/expected/actual off hidden test case results before they reach a client —
 * every mode (Practice, Blind Test, Mock OA) hides hidden-case details the same way, so this
 * is shared rather than duplicated per route/service. Only `status`/`isHidden`/`stdout`/
 * `errorMessage` survive for a hidden case; a visible case passes through unchanged.
 */
export function toClientExecutionResult(result: ExecutionResult): ExecutionResult {
  return {
    ...result,
    results: result.results.map((testResult) =>
      testResult.isHidden
        ? { ...testResult, input: [], expected: undefined, actual: undefined }
        : testResult
    ),
  }
}

/** Test-case pass count derived the same way for every submit flow that records stats
 * (Practice, Blind Test, Mock OA, study-plan workbook) — shared so "how many cases passed"
 * is never computed ad hoc per route. */
export function tallyTestCases(result: ExecutionResult): { testsPassed: number; testsTotal: number } {
  return {
    testsPassed: result.results.filter((testResult) => testResult.status === "passed").length,
    testsTotal: result.results.length,
  }
}
