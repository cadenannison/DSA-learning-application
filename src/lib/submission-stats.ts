import type { ExecutionResult, SubmissionStats } from "@/types"

/** Builds the one `SubmissionStats` shape every problem-solving surface (library practice,
 * blind test, study-plan workbook) sends alongside a submission — computed identically
 * everywhere so a new surface never has to reinvent "how do we measure this submit." */
export function buildSubmissionStats(
  code: string,
  execution: ExecutionResult,
  activeMs: number
): SubmissionStats {
  return {
    durationMs: Math.max(0, Math.round(activeMs)),
    linesOfCode: code.split("\n").length,
    testsPassed: execution.results.filter((result) => result.status === "passed").length,
    testsTotal: execution.results.length,
  }
}
