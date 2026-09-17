import type {
  MockInterviewResult,
  PatternResource,
  Skill,
  StudyPattern,
  StudyPatternStage,
  StudyPlan,
  StudyPlanSettings,
  StudyProblem,
  StudySession,
  StudyTrack,
} from "@/server/models/domain"

/** A single seed pattern + its problems, as read from the curriculum JSON file. Distinct from
 * the domain `StudyPattern` because seed data has no per-user stage/confidence/notes/
 * completion/spaced-repetition state yet — those only exist once a user has rows in SQLite. */
export interface StudyPatternSeed {
  id: string
  trackId: StudyTrack["id"]
  name: string
  priorityRank: number
  likelihoodWeight: number
  complexityTier: StudyPattern["complexityTier"]
  conceptNotes: string
  problems: {
    name: string
    difficulty: StudyPattern["problems"][number]["difficulty"]
    role: StudyPattern["problems"][number]["role"]
    externalUrl?: string | null
    /** Main-library Problem.id, when authored. Omitted/undefined = not embeddable. */
    linkedProblemId?: string | null
  }[]
  /** Present only for patterns curriculum data ships extended content for. */
  lesson?: StudyPattern["lesson"]
  bugTracingExercise?: StudyPattern["bugTracingExercise"]
  /** Curated external explainers (2-4). Omitted/empty = not seeded yet — surfaced as a visible
   * gap in the UI rather than hidden. */
  resources?: PatternResource[]
}

/** A single seed skill, as read from the curriculum JSON file. Distinct from the domain `Skill`
 * because seed data has no per-plan done/lastVerifiedAt state yet. */
export interface SkillSeed {
  id: string
  name: string
  description: string
  patternIds: string[]
}

export interface StudyCurriculumSeed {
  tracks: StudyTrack[]
  patterns: StudyPatternSeed[]
  skills: SkillSeed[]
  globalCoachingNotes: string[]
  referenceLinks: { label: string; url: string }[]
}

export interface StudyPlanStore {
  /** Idempotent — inserts shared curriculum rows (tracks/patterns/problems) that don't
   * already exist by id. Holds no per-plan progress, so safe to call on every boot. */
  ensureSeeded(seed: StudyCurriculumSeed): Promise<void>

  /** Creates a new study plan owned by the given user and seeds default state rows (one per
   * curriculum pattern/problem, plus default settings) for it. This is the only seeding
   * trigger — unlike the old single-plan model, there's no per-login backfill. */
  createPlan(userId: string, name: string): Promise<StudyPlan>
  listPlans(userId: string): Promise<StudyPlan[]>
  /** Used to authorize a request against a plan id — callers check `.userId` themselves. */
  getPlan(planId: string): Promise<StudyPlan | null>
  deletePlan(planId: string): Promise<void>

  /** Marks the given plan as this user's active plan and clears the flag on every other plan
   * they own, atomically. `planId: null` clears the active plan entirely (e.g. it was deleted). */
  setActivePlan(userId: string, planId: string | null): Promise<void>

  listTracks(): Promise<StudyTrack[]>
  listPatterns(planId: string): Promise<StudyPattern[]>
  getPattern(planId: string, id: string): Promise<StudyPattern | null>

  /** Reads a single study problem row (shared template + this plan's state) without needing
   * its parent pattern id up front. Returns null if the id doesn't exist. */
  getProblem(planId: string, id: string): Promise<StudyProblem | null>

  updatePattern(
    planId: string,
    id: string,
    update: { stage?: StudyPatternStage; confidence?: number | null; notes?: string }
  ): Promise<StudyPattern | null>

  /** Sets this plan's personalized priority/likelihood override for a pattern (see
   * StudyPattern.personalizedPriorityRank) — set by the AI builder from company/role/background
   * context. `null` clears an override, falling back to the pattern's global seed values. */
  setPatternPriorityOverride(
    planId: string,
    id: string,
    override: { personalizedPriorityRank?: number | null; personalizedLikelihoodWeight?: number | null }
  ): Promise<StudyPattern | null>

  /** SM-2-lite reschedule for this plan's pattern, given a 0-5 review quality score. */
  recordPatternReview(
    planId: string,
    id: string,
    qualityScore: number
  ): Promise<StudyPattern | null>

  updateProblem(
    planId: string,
    id: string,
    update: {
      completed?: boolean
      timeTakenMinutes?: number | null
      constraintAddedMidSolve?: boolean | null
    }
  ): Promise<StudyPattern | null>

  getSettings(planId: string): Promise<StudyPlanSettings>
  updateSettings(planId: string, update: Partial<StudyPlanSettings>): Promise<StudyPlanSettings>

  createStudySession(planId: string, session: Omit<StudySession, "id">): Promise<StudySession>
  listSessions(planId: string): Promise<StudySession[]>

  createMockInterviewResult(
    planId: string,
    result: Omit<MockInterviewResult, "id">
  ): Promise<MockInterviewResult>
  listMockInterviewResults(planId: string): Promise<MockInterviewResult[]>

  /** Append-only log of embedded-problem study time, one row per submit (pass or fail) or per
   * collapse-without-submitting. Never updated or deleted. `passed` is null for a collapse
   * with no submission. */
  recordProblemSession(
    planId: string,
    session: {
      studyProblemId: string
      startedAt: string
      endedAt: string
      minutesSpent: number
      passed: boolean | null
      source: string
    }
  ): Promise<void>

  /** Finds every (plan, study problem) pair whose study_problem_extensions row points at this
   * main-library Problem id — the cross-app progress hook's lookup: when that Problem is solved
   * anywhere (Practice/Blind/OA), every matching StudyProblem across every plan should be
   * marked completed. Empty for problems with no study-plan linkage (the common case). */
  listStudyProblemsByLinkedProblemId(
    problemId: string
  ): Promise<{ planId: string; studyProblemId: string; studyPatternId: string }[]>

  listSkills(planId: string): Promise<Skill[]>
  updateSkill(planId: string, skillId: string, update: { done: boolean }): Promise<Skill | null>

  getReadinessChecklistState(
    planId: string
  ): Promise<{ itemId: string; checked: boolean; triState: string | null; note: string }[]>
  updateReadinessChecklistItem(
    planId: string,
    itemId: string,
    update: { checked?: boolean; triState?: string; note?: string }
  ): Promise<void>
}
