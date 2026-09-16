import type { CodeSandbox } from "@/server/interfaces/code-sandbox"
import type { ProblemRepository } from "@/server/interfaces/problem-repository"
import type { CodeSubmission, ExecutionResult } from "@/server/models/domain"

export class ExecutionService {
  constructor(
    private readonly sandbox: CodeSandbox,
    private readonly problemRepository: ProblemRepository
  ) {}

  async execute(problemId: string, submission: CodeSubmission): Promise<ExecutionResult> {
    const problem = await this.problemRepository.getById(problemId)
    if (!problem) {
      throw new Error(`Unknown problem: ${problemId}`)
    }

    return this.sandbox.run(submission, problem.testCases)
  }
}
