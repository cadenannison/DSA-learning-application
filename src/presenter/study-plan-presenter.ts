import { apiClient } from "@/lib/api-client"
import type {
  CodeSubmission,
  ExecutionResult,
  MockInterviewResult,
  ReadinessChecklistOverview,
  ReadinessTriState,
  RoadmapOverview,
  Skill,
  StudyPatternStage,
  StudyPlanOverview,
  StudyPlanSettings,
  StudySession,
} from "@/types"

export interface StudyPlanView {
  setLoading(loading: boolean): void
  setOverview(overview: StudyPlanOverview): void
  setError(message: string | null): void
}

export class StudyPlanPresenter {
  constructor(
    private readonly planId: string,
    private readonly view: StudyPlanView
  ) {}

  async load(): Promise<void> {
    this.view.setLoading(true)
    this.view.setError(null)

    try {
      const overview = await apiClient.getStudyPlanOverview(this.planId)
      this.view.setOverview(overview)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to load study plan")
    } finally {
      this.view.setLoading(false)
    }
  }

  async setPatternStage(id: string, stage: StudyPatternStage): Promise<void> {
    await apiClient.updateStudyPattern(this.planId, id, { stage })
    await this.load()
  }

  async setPatternConfidence(id: string, confidence: number | null): Promise<void> {
    await apiClient.updateStudyPattern(this.planId, id, { confidence })
    await this.load()
  }

  async setPatternNotes(id: string, notes: string): Promise<void> {
    await apiClient.updateStudyPattern(this.planId, id, { notes })
    await this.load()
  }

  async setProblemCompleted(id: string, completed: boolean): Promise<void> {
    await apiClient.updateStudyProblem(this.planId, id, { completed })
    await this.load()
  }

  async setSettings(update: Partial<StudyPlanSettings>): Promise<void> {
    await apiClient.updateStudyPlanSettings(this.planId, update)
    await this.load()
  }

  async logSession(input: {
    date: string
    minutesSpent: number
    studyPatternIds: string[]
    stickingPoint?: string
    planForNextSession?: string
  }): Promise<StudySession> {
    const session = await apiClient.logStudySession(this.planId, input)
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
    const result = await apiClient.logMockInterviewResult(this.planId, input)
    await this.load()
    return result
  }

  /** Runs code against an embedded study-plan problem without recording anything — mirrors
   * the practice page's "Run" button, which never touches progress/session state. Passing
   * testCaseIndices runs only those test cases (e.g. a single "Run this case" click) instead
   * of the full suite. */
  async runEmbeddedProblem(
    linkedProblemId: string,
    submission: CodeSubmission,
    testCaseIndices?: number[]
  ): Promise<ExecutionResult> {
    return apiClient.execute(linkedProblemId, submission, "practice", testCaseIndices)
  }

  /** Submits code against an embedded study-plan problem. Always logs a session row
   * server-side (pass or fail); only a pass marks the problem completed and may auto-advance
   * the pattern's stage — both handled atomically server-side. Refetches the full overview
   * afterward since a pass can change pattern stage/readiness/drill-queue placement.
   *
   * `stats` (active-time duration + lines of code) feeds the same lifetime profile-stats
   * event the main practice flow records, not this service's own session/completion logic, so
   * it never affects pass/fail or stage-advance behavior. Test-case pass/fail counts aren't
   * included here — the client can't know them until this call executes the code server-side,
   * so the route derives them itself from the returned execution result. */
  async submitEmbeddedProblem(
    id: string,
    submission: CodeSubmission,
    timeTakenMinutes: number,
    stats: { durationMs: number; linesOfCode: number }
  ): Promise<ExecutionResult> {
    const result = await apiClient.submitStudyProblem(this.planId, id, submission, timeTakenMinutes, stats)
    await this.load()
    return result.execution
  }

  /** Logs time spent on a problem that was expanded but never submitted. No visible state
   * changes from this call, so skip the full-overview refetch every other mutating method
   * here does. */
  async logProblemTimeOnCollapse(id: string, minutes: number): Promise<void> {
    await apiClient.logProblemSession(this.planId, id, minutes)
  }

  /** Read-only and computed fresh server-side each call — no shared overview state to
   * refetch, so this doesn't touch this.load(). */
  async loadRoadmap(): Promise<RoadmapOverview> {
    return apiClient.getRoadmap(this.planId)
  }

  async loadSkills(): Promise<Skill[]> {
    return apiClient.getSkills(this.planId)
  }

  async setSkillDone(skillId: string, done: boolean): Promise<Skill> {
    return apiClient.updateSkill(this.planId, skillId, done)
  }

  async loadReadinessChecklist(): Promise<ReadinessChecklistOverview> {
    return apiClient.getReadinessChecklist(this.planId)
  }

  async setReadinessChecklistItem(
    itemId: string,
    update: { checked?: boolean; triState?: ReadinessTriState; note?: string }
  ): Promise<ReadinessChecklistOverview> {
    return apiClient.updateReadinessChecklistItem(this.planId, itemId, update)
  }
}
