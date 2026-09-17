import type { CodeSandbox } from "@/server/interfaces/code-sandbox"
import type { ProblemRepository } from "@/server/interfaces/problem-repository"
import type { CodeSubmission, ExecutionResult, PracticeMode } from "@/server/models/domain"

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
    mode: PracticeMode
  ): Promise<ExecutionResult> {
    void mode

    const problem = await this.problemRepository.getById(problemId)
    if (!problem) {
      throw new Error(`Unknown problem: ${problemId}`)
    }

    return this.sandbox.run(submission, problem.testCases)
  }
}
