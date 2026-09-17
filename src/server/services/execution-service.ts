import type { CodeSandbox } from "@/server/interfaces/code-sandbox"
import type { ProblemRepository } from "@/server/interfaces/problem-repository"
import type { CodeSubmission, ExecutionResult, PracticeMode, TestCase } from "@/server/models/domain"

export class ExecutionService {
  constructor(
    private readonly sandbox: CodeSandbox,
    private readonly problemRepository: ProblemRepository
  ) {}

  // `mode` is accepted so the signature reflects that practice/blind isolation is a real
  // concern for this call, not silently dropped — but it isn't branched on today because
  // ExecutionResult/TestCaseResult have no fields that could leak problem metadata (see
  // executionResultSchema in models/schemas.ts, enforced at the route boundary). If a future
  // field addition needs mode-aware stripping, this is where that branch goes.
  async execute(
    problemId: string,
    submission: CodeSubmission,
    mode: PracticeMode,
    testCaseIndices?: number[]
  ): Promise<ExecutionResult> {
    void mode

    const problem = await this.problemRepository.getById(problemId)
    if (!problem) {
      throw new Error(`Unknown problem: ${problemId}`)
    }

    // Indices are resolved against the server's own problem.testCases, never against
    // anything client-supplied, so a single-case "Run this case" request can't be used to
    // smuggle in arbitrary test data.
    const testCases = testCaseIndices
      ? testCaseIndices
          .map((index) => problem.testCases[index])
          .filter((testCase): testCase is TestCase => testCase != null)
      : problem.testCases

    return this.sandbox.run(submission, testCases)
  }
}
