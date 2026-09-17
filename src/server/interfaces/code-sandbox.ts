import type { CodeSubmission, ExecutionResult, TestCase } from "@/server/models/domain"

export interface CodeSandbox {
  run(submission: CodeSubmission, testCases: TestCase[]): Promise<ExecutionResult>
}
