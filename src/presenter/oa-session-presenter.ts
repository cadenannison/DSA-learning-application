import { apiClient } from "@/lib/api-client"
import type { OASession, OASessionConfig, OASessionSummary } from "@/types"

export interface OASessionView {
  setLoading(loading: boolean): void
  setSession(session: OASession): void
  setError(message: string | null): void
  setRunning(running: boolean): void
}

/** React-free session/timer view logic for Mock OA Mode. Holds no timer of its own — the
 * countdown is rendered from `session.deadline` by the page, which re-renders on an interval;
 * this presenter only drives the network calls and pushes the resulting OASession into the
 * view, same shape as PracticePresenter/BlindTestPresenter. */
export class OASessionPresenter {
  private session: OASession | null = null

  constructor(private readonly view: OASessionView) {}

  getSession(): OASession | null {
    return this.session
  }

  async start(config: OASessionConfig): Promise<void> {
    this.view.setLoading(true)
    this.view.setError(null)

    try {
      const session = await apiClient.startOASession(config)
      this.session = session
      this.view.setSession(session)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to start session")
    } finally {
      this.view.setLoading(false)
    }
  }

  async loadSession(sessionId: string): Promise<void> {
    this.view.setLoading(true)
    this.view.setError(null)

    try {
      const session = await apiClient.getOASession(sessionId)
      this.session = session
      this.view.setSession(session)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to load session")
    } finally {
      this.view.setLoading(false)
    }
  }

  async saveProgress(problemId: string, code: string): Promise<void> {
    if (!this.session) return

    try {
      const session = await apiClient.saveOAProgress(this.session.id, problemId, code)
      this.session = session
      this.view.setSession(session)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to save progress")
    }
  }

  async submitProblem(problemId: string, code: string, functionName: string): Promise<void> {
    if (!this.session) return

    this.view.setRunning(true)
    try {
      const session = await apiClient.submitOAProblem(this.session.id, problemId, {
        code,
        functionName,
        language: "javascript",
      })
      this.session = session
      this.view.setSession(session)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Submission failed")
    } finally {
      this.view.setRunning(false)
    }
  }

  async endSession(): Promise<OASessionSummary | null> {
    if (!this.session) return null

    try {
      return await apiClient.endOASession(this.session.id)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to end session")
      return null
    }
  }
}
