import type { FileStudyCurriculumRepository } from "@/server/repositories/file-study-curriculum-repository"
import type { StudyPlanStore } from "@/server/interfaces/study-plan-store"
import type { ExecutionService } from "@/server/services/execution-service"
import {
  STUDY_PATTERN_STAGE_ORDER,
  type CodeSubmission,
  type DrillQueueEntry,
  type ExecutionResult,
  type MockInterviewResult,
  type StudyPattern,
  type StudyPatternStage,
  type StudyPatternWithReadiness,
  type StudyPlan,
  type StudyPlanOverview,
  type StudyPlanSettings,
  type StudyPlanSummary,
  type StudyReadiness,
  type StudyRecommendation,
  type StudySession,
  type StudyTrack,
} from "@/server/models/domain"

const STAGE_INDEX: Record<StudyPatternStage, number> = Object.fromEntries(
  STUDY_PATTERN_STAGE_ORDER.map((stage, index) => [stage, index])
) as Record<StudyPatternStage, number>

const FINAL_STAGE_INDEX = STUDY_PATTERN_STAGE_ORDER.length - 1
const DRILL_QUEUE_MIN = 2
const DRILL_QUEUE_MAX = 8
const DRILL_QUEUE_MINUTES_PER_ITEM = 15

/** ~15 minutes is roughly one focused pass at a single pattern (skim a due review + do a
 * rep), so queue length scales directly with how many pattern-sized chunks fit in today's
 * budget, clamped so it's never a useless single item nor unboundedly long. */
function computeDrillQueueSize(dailyTimeBudgetMinutes: number): number {
  const raw = Math.round(dailyTimeBudgetMinutes / DRILL_QUEUE_MINUTES_PER_ITEM)
  return Math.min(DRILL_QUEUE_MAX, Math.max(DRILL_QUEUE_MIN, raw))
}

/** Combines stage progress with self-rated confidence into one readiness signal, rather than
 * treating "stage complete" as a bare checkbox — a pattern finished through bug_tracing_done
 * but rated low-confidence should still surface as needing more work before an interview. */
function computeReadiness(stage: StudyPatternStage, confidence: number | null): StudyReadiness {
  if (stage === "not_started") return "not_started"

  const stageIndex = STAGE_INDEX[stage]
  const stageFraction = stageIndex / FINAL_STAGE_INDEX

  if (confidence === null) {
    return stageFraction >= 1 ? "developing" : "needs_work"
  }

  const score = stageFraction * 0.6 + (confidence / 5) * 0.4

  if (score >= 0.85 && stage === "bug_tracing_done") return "ready"
  if (score >= 0.5) return "developing"
  return "needs_work"
}

function withReadiness(pattern: StudyPattern): StudyPatternWithReadiness {
  return { ...pattern, readiness: computeReadiness(pattern.stage, pattern.confidence) }
}

/** Maps stage advancement + confidence into a 0-5 SM-2 quality score. A stage regression or
 * very low confidence is treated as "you didn't really know this" (quality < 3), which resets
 * the spaced-repetition interval back down rather than letting a shaky pass grow it. */
function stageAndConfidenceToQuality(
  stage: StudyPatternStage,
  confidence: number | null
): number {
  const stageFraction = STAGE_INDEX[stage] / FINAL_STAGE_INDEX
  const confidenceFraction = confidence === null ? 0.5 : confidence / 5
  return Math.round((stageFraction * 0.5 + confidenceFraction * 0.5) * 5)
}

/** Maps a mock interview result into a 0-5 SM-2 quality score — a clean solve well under time
 * is a strong review signal; a messy or unsolved one signals the pattern needs to resurface
 * soon, same as an explicit low self-rating would. */
function mockResultToQuality(solvedCleanly: boolean, constraintAddedMidSolve: boolean): number {
  if (!solvedCleanly) return 1
  return constraintAddedMidSolve ? 4 : 5
}

export class StudyPlanService {
  constructor(
    private readonly store: StudyPlanStore,
    private readonly curriculumRepository: FileStudyCurriculumRepository,
    private readonly executionService: ExecutionService
  ) {}

  /** Call once per process boot — inserts seed curriculum rows that don't already exist.
   * Idempotent, so safe to call from the container on every request path that needs it. */
  async ensureSeeded(): Promise<void> {
    const seed = await this.curriculumRepository.load()
    await this.store.ensureSeeded(seed)
  }

  /** Creates a new, independently-tracked study plan for this user and seeds its default
   * state. Ensures the shared curriculum exists first (idempotent) so a brand-new deployment
   * can create a plan without a separate boot-time seed step. */
  async createPlan(userId: string, name: string): Promise<StudyPlan> {
    await this.ensureSeeded()
    return this.store.createPlan(userId, name)
  }

  async listPlans(userId: string): Promise<StudyPlanSummary[]> {
    const plans = await this.store.listPlans(userId)

    return Promise.all(
      plans.map(async (plan) => {
        const [patterns, settings] = await Promise.all([
          this.store.listPatterns(plan.id),
          this.store.getSettings(plan.id),
        ])
        const patternsWithReadiness = patterns.map(withReadiness)
        const readyOrBetterPatterns = patternsWithReadiness.filter(
          (p) => p.readiness === "ready"
        ).length

        return {
          id: plan.id,
          name: plan.name,
          createdAt: plan.createdAt,
          interviewDate: settings.interviewDate,
          dailyTimeBudgetMinutes: settings.dailyTimeBudgetMinutes,
          totalPatterns: patternsWithReadiness.length,
          readyOrBetterPatterns,
        } satisfies StudyPlanSummary
      })
    )
  }

  /** Returns the plan only if it exists and belongs to this user — the single ownership
   * check every plan-scoped API route performs before touching plan-scoped data. */
  async getPlanForUser(userId: string, planId: string): Promise<StudyPlan | null> {
    const plan = await this.store.getPlan(planId)
    return plan && plan.userId === userId ? plan : null
  }

  async deletePlan(userId: string, planId: string): Promise<void> {
    const plan = await this.getPlanForUser(userId, planId)
    if (!plan) return
    await this.store.deletePlan(planId)
  }

  async getOverview(planId: string): Promise<StudyPlanOverview> {
    const [tracks, patterns, settings] = await Promise.all([
      this.store.listTracks(),
      this.store.listPatterns(planId),
      this.store.getSettings(planId),
    ])

    const patternsWithReadiness = patterns.map(withReadiness)
    const recommendation = this.computeRecommendation(patternsWithReadiness, settings)
    const drillQueueSize = computeDrillQueueSize(settings.dailyTimeBudgetMinutes)
    const drillQueue = this.computeDrillQueue(patternsWithReadiness, drillQueueSize)
    const overallProgress = this.computeOverallProgress(tracks, patternsWithReadiness)

    return {
      settings,
      tracks,
      patterns: patternsWithReadiness,
      recommendation,
      drillQueue,
      overallProgress,
    }
  }

  async updatePattern(
    planId: string,
    id: string,
    update: { stage?: StudyPatternStage; confidence?: number | null; notes?: string }
  ): Promise<StudyPattern | null> {
    const updated = await this.store.updatePattern(planId, id, update)
    if (!updated) return null

    // A stage change or confidence rating is a "review event" — reschedule this pattern's
    // spaced-repetition due date. A bare notes-only edit is not a review signal, so skip it.
    if (update.stage !== undefined || update.confidence !== undefined) {
      const quality = stageAndConfidenceToQuality(updated.stage, updated.confidence)
      return this.store.recordPatternReview(planId, id, quality)
    }

    return updated
  }

  async updateProblem(
    planId: string,
    id: string,
    update: {
      completed?: boolean
      timeTakenMinutes?: number | null
      constraintAddedMidSolve?: boolean | null
    }
  ): Promise<StudyPattern | null> {
    const updated = await this.store.updateProblem(planId, id, update)
    if (!updated) return null

    // Stage auto-advance is a recompute over problems[].completed regardless of how
    // completion was set — manual checkbox (here) or an embedded passing submit — so a
    // manually-completed problem must trigger the same recompute submitEmbeddedProblem does.
    if (update.completed === true) {
      await this.maybeAutoAdvanceStage(planId, updated.id)
      return this.store.getPattern(planId, updated.id)
    }

    return updated
  }

  async updateSettings(
    planId: string,
    update: Partial<StudyPlanSettings>
  ): Promise<StudyPlanSettings> {
    return this.store.updateSettings(planId, update)
  }

  async logSession(planId: string, session: Omit<StudySession, "id">): Promise<StudySession> {
    return this.store.createStudySession(planId, session)
  }

  async listSessions(planId: string): Promise<StudySession[]> {
    return this.store.listSessions(planId)
  }

  /** Logging a mock interview result is also a review event for the pattern it targets —
   * a clean, fast solve pushes the next review further out; a messy or failed one brings it
   * back to tomorrow, same as a low self-rating would via updatePattern. */
  async logMockInterviewResult(
    planId: string,
    result: Omit<MockInterviewResult, "id">
  ): Promise<MockInterviewResult> {
    const created = await this.store.createMockInterviewResult(planId, result)

    if (result.studyPatternId) {
      const quality = mockResultToQuality(result.solvedCleanly, result.constraintAddedMidSolve)
      await this.store.recordPatternReview(planId, result.studyPatternId, quality)
    }

    return created
  }

  async listMockInterviewResults(planId: string): Promise<MockInterviewResult[]> {
    return this.store.listMockInterviewResults(planId)
  }

  /** Runs a submission against the embedded editor's linked main-library Problem, always logs
   * a study_problem_sessions row (pass or fail — this is the auto session-tracking the
   * workbook needs), and only on a pass marks the study problem completed and recomputes
   * whether the parent pattern's stage should auto-advance. Returns null if the study problem
   * doesn't exist or isn't embeddable (no linkedProblemId) — those shouldn't reach this method
   * since the UI only offers Run/Submit for embedded problems, but the route validates anyway. */
  async submitEmbeddedProblem(
    planId: string,
    studyProblemId: string,
    submission: CodeSubmission,
    timeTakenMinutes: number
  ): Promise<{ execution: ExecutionResult; pattern: StudyPattern } | null> {
    const studyProblem = await this.store.getProblem(planId, studyProblemId)
    if (!studyProblem || !studyProblem.linkedProblemId) return null

    const execution = await this.executionService.execute(
      studyProblem.linkedProblemId,
      submission,
      "practice"
    )

    const now = new Date()
    await this.store.recordProblemSession(planId, {
      studyProblemId,
      startedAt: new Date(now.getTime() - timeTakenMinutes * 60_000).toISOString(),
      endedAt: now.toISOString(),
      minutesSpent: timeTakenMinutes,
      passed: execution.allPassed,
      source: "embedded_editor",
    })

    if (execution.allPassed) {
      await this.store.updateProblem(planId, studyProblemId, {
        completed: true,
        timeTakenMinutes,
      })
      await this.maybeAutoAdvanceStage(planId, studyProblem.studyPatternId)
    }

    const pattern = await this.store.getPattern(planId, studyProblem.studyPatternId)
    return pattern ? { execution, pattern } : null
  }

  /** Logs time spent on an embedded problem that was expanded but never submitted (row
   * collapsed with no run/submit). No completion or stage-advance side effects — an abandoned
   * attempt isn't a completion signal, only a time-spent one. */
  async recordUnsubmittedSession(
    planId: string,
    studyProblemId: string,
    minutesSpent: number
  ): Promise<void> {
    const now = new Date()
    await this.store.recordProblemSession(planId, {
      studyProblemId,
      startedAt: new Date(now.getTime() - minutesSpent * 60_000).toISOString(),
      endedAt: now.toISOString(),
      minutesSpent,
      passed: null,
      source: "collapsed_without_submit",
    })
  }

  /** Recomputes stage from problems[].completed regardless of how completion was set (auto
   * via embedded submit, or manual checkbox) — a derived recompute over current state, not
   * specific to the embedded-only subset. Only ever advances forward (never demotes an
   * existing higher/manually-set stage). Reuses the public updatePattern method so an auto
   * advance gets the same spaced-repetition review-event side effect a manual stage change
   * would. */
  private async maybeAutoAdvanceStage(planId: string, studyPatternId: string): Promise<void> {
    const pattern = await this.store.getPattern(planId, studyPatternId)
    if (!pattern) return

    const canonicalEasyProblems = pattern.problems.filter((p) => p.role === "canonical_easy")
    const mediumVariantProblems = pattern.problems.filter((p) => p.role === "medium_variant")

    const canonicalEasyDone =
      canonicalEasyProblems.length > 0 && canonicalEasyProblems.every((p) => p.completed)
    const allMediumsDone =
      mediumVariantProblems.length > 0 && mediumVariantProblems.every((p) => p.completed)

    const currentIndex = STAGE_INDEX[pattern.stage]

    if (canonicalEasyDone && allMediumsDone && currentIndex < STAGE_INDEX["mediums_done"]) {
      await this.updatePattern(planId, studyPatternId, { stage: "mediums_done" })
      return
    }
    if (canonicalEasyDone && currentIndex < STAGE_INDEX["easy_done"]) {
      await this.updatePattern(planId, studyPatternId, { stage: "easy_done" })
    }
  }

  /** The core "what should I study today" computation: works top-down through priority_rank
   * within Technical Interview Prep, surfacing the next incomplete pattern (or next incomplete
   * stage within the first incomplete pattern) — not a flat list. OA Prep is suggested as a
   * short parallel track alongside it, since it's lower-effort and time-boxed separately. */
  private computeRecommendation(
    patterns: StudyPatternWithReadiness[],
    settings: StudyPlanSettings
  ): StudyRecommendation {
    const daysRemaining = this.computeDaysRemaining(settings.interviewDate)

    const technicalPatterns = patterns
      .filter((pattern) => pattern.trackId === "technical-interview-prep")
      .sort((a, b) => a.priorityRank - b.priorityRank)

    const oaPatterns = patterns.filter((pattern) => pattern.trackId === "oa-prep")
    const oaPrepSuggestion = this.computeOaPrepSuggestion(oaPatterns)

    const nextPattern = technicalPatterns.find((pattern) => pattern.stage !== "bug_tracing_done")

    if (!nextPattern) {
      return {
        studyPatternId: null,
        studyPatternName: null,
        trackId: null,
        nextStage: null,
        reason:
          "All Technical Interview Prep patterns are through bug-tracing. The drill queue below will keep resurfacing them via spaced repetition as review dates come due.",
        daysRemaining,
        suggestedMinutesToday: settings.dailyTimeBudgetMinutes,
        oaPrepSuggestion,
      }
    }

    const nextStage = this.computeNextStage(nextPattern.stage)
    const isUrgent = daysRemaining !== null && daysRemaining <= 3
    const tierNote =
      nextPattern.complexityTier === "complexity-ceiling"
        ? " This is flagged as the complexity ceiling of the plan — budget extra time."
        : ""

    const reason = isUrgent
      ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left — focus everything on "${nextPattern.name}" (priority #${nextPattern.priorityRank}), the highest-priority pattern that isn't fully worked through yet.${tierNote}`
      : `"${nextPattern.name}" is the highest-priority Technical Interview Prep pattern that isn't fully worked through — next step: ${this.describeStage(nextStage)}.${tierNote}`

    return {
      studyPatternId: nextPattern.id,
      studyPatternName: nextPattern.name,
      trackId: nextPattern.trackId,
      nextStage,
      reason,
      daysRemaining,
      suggestedMinutesToday: settings.dailyTimeBudgetMinutes,
      oaPrepSuggestion,
    }
  }

  /** The "workthrough book" drill queue: an adaptive, ranked sequence combining likelihood of
   * appearing, current weakness (low confidence / early stage), and spaced-repetition due
   * dates — so a high-likelihood weak pattern with an overdue review always outranks a
   * low-likelihood pattern you already feel good about, and reviews get pulled forward as the
   * interview date approaches rather than drifting on a fixed schedule. */
  private computeDrillQueue(
    patterns: StudyPatternWithReadiness[],
    size: number
  ): DrillQueueEntry[] {
    const now = Date.now()

    const scored = patterns.map((pattern) => {
      const { reason, score } = this.scorePatternForDrill(pattern, now)
      return {
        studyPatternId: pattern.id,
        studyPatternName: pattern.name,
        trackId: pattern.trackId,
        reason,
        priorityScore: score,
        likelihoodWeight: pattern.likelihoodWeight,
        readiness: pattern.readiness,
        dueAt: pattern.spacedRepetition.dueAt,
      } satisfies DrillQueueEntry
    })

    return scored.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, size)
  }

  /** Every pattern is scored on the same base scale — likelihood-to-appear combined with how
   * weak you currently are on it, weighted evenly — so a pattern you've explicitly rated as
   * weak (low confidence / early stage) can compete directly with an untouched one on the
   * same footing, rather than "never reviewed" acting as its own privileged bucket that any
   * untouched pattern automatically wins regardless of known weakness elsewhere. Only a
   * genuinely *overdue* SM-2 review gets an explicit boost on top of that shared base — a
   * pattern that's merely "not due yet" competes purely on likelihood + weakness, so a known-
   * weak pattern can still resurface early instead of waiting out its interval untouched. */
  private scorePatternForDrill(
    pattern: StudyPatternWithReadiness,
    now: number
  ): { reason: DrillQueueEntry["reason"]; score: number } {
    const { dueAt, reviewCount } = pattern.spacedRepetition

    // Weakness: inverse of readiness, expressed 0-1 so it composes with likelihood the same
    // way for every pattern regardless of stage/confidence combination.
    const weaknessScore =
      pattern.readiness === "not_started"
        ? 1
        : pattern.readiness === "needs_work"
          ? 0.85
          : pattern.readiness === "developing"
            ? 0.5
            : 0.1

    const baseScore = pattern.likelihoodWeight * 0.5 + weaknessScore * 0.5

    if (dueAt && new Date(dueAt).getTime() <= now) {
      const overdueDays = (now - new Date(dueAt).getTime()) / (24 * 60 * 60 * 1000)
      return { reason: "overdue_review", score: baseScore + 0.3 + Math.min(overdueDays / 7, 0.3) }
    }

    if (reviewCount === 0) {
      return { reason: "never_reviewed", score: baseScore }
    }

    if (pattern.likelihoodWeight >= 0.6 && weaknessScore >= 0.5) {
      return { reason: "high_likelihood_low_confidence", score: baseScore + 0.05 }
    }

    return { reason: "scheduled", score: baseScore }
  }

  private computeNextStage(currentStage: StudyPatternStage): StudyPatternStage {
    const currentIndex = STAGE_INDEX[currentStage]
    const nextIndex = Math.min(currentIndex + 1, FINAL_STAGE_INDEX)
    return STUDY_PATTERN_STAGE_ORDER[nextIndex]
  }

  private describeStage(stage: StudyPatternStage): string {
    switch (stage) {
      case "not_started":
        return "read the concept notes"
      case "concept":
        return "read the concept notes"
      case "easy_done":
        return "solve the canonical easy problem"
      case "mediums_done":
        return "work through the medium variants"
      case "bug_tracing_done":
        return "do a bug-tracing pass — read/trace someone else's (or your own past) buggy solution"
    }
  }

  private computeOaPrepSuggestion(oaPatterns: StudyPatternWithReadiness[]): string | null {
    const incomplete = oaPatterns.filter((pattern) => pattern.stage !== "bug_tracing_done")
    if (incomplete.length === 0) return null

    const next = incomplete.sort((a, b) => a.priorityRank - b.priorityRank)[0]
    return `Spend a short parallel block on OA Prep: "${next.name}" (${incomplete.length} OA topic${incomplete.length === 1 ? "" : "s"} left, kept lightweight and time-boxed).`
  }

  private computeDaysRemaining(interviewDate: string | null): number | null {
    if (!interviewDate) return null

    const target = new Date(interviewDate).getTime()
    if (Number.isNaN(target)) return null

    const now = Date.now()
    const msPerDay = 24 * 60 * 60 * 1000
    return Math.max(0, Math.ceil((target - now) / msPerDay))
  }

  private computeOverallProgress(
    tracks: StudyTrack[],
    patterns: StudyPatternWithReadiness[]
  ): StudyPlanOverview["overallProgress"] {
    return tracks.map((track) => {
      const trackPatterns = patterns.filter((pattern) => pattern.trackId === track.id)
      const readyOrBetter = trackPatterns.filter((pattern) => pattern.readiness === "ready").length
      const averageStageIndex =
        trackPatterns.length === 0
          ? 0
          : trackPatterns.reduce((sum, pattern) => sum + STAGE_INDEX[pattern.stage], 0) /
            trackPatterns.length

      return {
        trackId: track.id,
        totalPatterns: trackPatterns.length,
        readyOrBetter,
        averageStageIndex,
      }
    })
  }
}
