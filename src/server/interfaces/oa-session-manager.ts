import type { CodeSubmission, OASession, OASessionConfig, OASessionSummary } from "@/server/models/domain"

export interface OASessionManager {
  startSession(config: OASessionConfig): Promise<OASession>
  getSession(sessionId: string): Promise<OASession | null>
  saveProgress(sessionId: string, problemId: string, code: string): Promise<OASession>
  submitProblem(sessionId: string, problemId: string, submission: CodeSubmission): Promise<OASession>
  endSession(sessionId: string): Promise<OASessionSummary>
}
