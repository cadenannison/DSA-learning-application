import { apiClient } from "@/lib/api-client"
import type {
  CodeSubmission,
  ExecutionResult,
  MockInterviewResult,
  StudyPatternStage,
  StudyPlanOverview,
  StudySession,
} from "@/types"

export interface StudyPlanView {
  setLoading(loading: boolean): void
  setOverview(overview: StudyPlanOverview): void
  setError(message: string | null): void
}

export class StudyPlanPresenter {
  constructor(private readonly view: StudyPlanView) {}

  async load(): Promise<void> {
    this.view.setLoading(true)
    this.view.setError(null)

    try {
      const overview = await apiClient.getStudyPlanOverview()
      this.view.setOverview(overview)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to load study plan")
    } finally {
      this.view.setLoading(false)
    }
  }

  async setPatternStage(id: string, stage: StudyPatternStage): Promise<void> {
    await apiClient.updateStudyPattern(id, { stage })
    await this.load()
  }

  async setPatternConfidence(id: string, confidence: number | null): Promise<void> {
    await apiClient.updateStudyPattern(id, { confidence })
    await this.load()
  }

  async setPatternNotes(id: string, notes: string): Promise<void> {
    await apiClient.updateStudyPattern(id, { notes })
    await this.load()
  }

  async setProblemCompleted(id: string, completed: boolean): Promise<void> {
    await apiClient.updateStudyProblem(id, { completed })
    await this.load()
  }

  async setSettings(update: { interviewDate?: string | null; dailyTimeBudgetMinutes?: number }): Promise<void> {
    await apiClient.updateStudyPlanSettings(update)
    await this.load()
  }

  async logSession(input: {
    date: string
    minutesSpent: number
    studyPatternIds: string[]
    stickingPoint?: string
    planForNextSession?: string
  }): Promise<StudySession> {
    const session = await apiClient.logStudySession(input)
    await this.load()
    return session
  }

  async logMockInterviewResult(input: {
    date: string
    studyProblemId?: string | null
    studyPatternId?: string | null
    problemName: string
    timeTakenMinutes: number
    solvedCleanly: boolean
    constraintAddedMidSolve?: boolean
    notes?: string
  }): Promise<MockInterviewResult> {
    const result = await apiClient.logMockInterviewResult(input)
    await this.load()
    return result
  }

  /** Runs code against an embedded study-plan problem without recording anything — mirrors
   * the practice page's "Run" button, which never touches progress/session state. */
  async runEmbeddedProblem(
    linkedProblemId: string,
    submission: CodeSubmission
  ): Promise<ExecutionResult> {
    return apiClient.execute(linkedProblemId, submission, "practice")
  }

  /** Submits code against an embedded study-plan problem. Always logs a session row
   * server-side (pass or fail); only a pass marks the problem completed and may auto-advance
   * the pattern's stage — both handled atomically server-side. Refetches the full overview
   * afterward since a pass can change pattern stage/readiness/drill-queue placement. */
  async submitEmbeddedProblem(
    id: string,
    submission: CodeSubmission,
    timeTakenMinutes: number
  ): Promise<ExecutionResult> {
    const result = await apiClient.submitStudyProblem(id, submission, timeTakenMinutes)
    await this.load()
    return result.execution
  }

  /** Logs time spent on a problem that was expanded but never submitted. No visible state
   * changes from this call, so skip the full-overview refetch every other mutating method
   * here does. */
  async logProblemTimeOnCollapse(id: string, minutes: number): Promise<void> {
    await apiClient.logProblemSession(id, minutes)
  }
}
