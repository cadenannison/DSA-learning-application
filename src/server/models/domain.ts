export type Difficulty = "easy" | "medium" | "hard"

/** Baseline interview-pacing estimate in minutes, by difficulty — roughly what a focused
 * attempt (read + code + test) takes, not a per-user measured average. Used to size a day's
 * study queue against dailyTimeBudgetMinutes; not stored, always recomputed from difficulty. */
const ESTIMATED_MINUTES_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 20,
  medium: 30,
  hard: 40,
}

export function estimateProblemMinutes(difficulty: Difficulty): number {
  return ESTIMATED_MINUTES_BY_DIFFICULTY[difficulty]
}

/** Flat estimate for how long working through a pattern's extended lesson takes, added once
 * (only while the lesson hasn't been started yet) on top of its remaining problem time — used
 * by the Roadmap view's time-cost projection, never stored. */
const LESSON_LENGTH_MINUTES = 45

/** Rough hours-of-work-left estimate for a pattern, used by the Roadmap view to project pace.
 * Not a measured average — sums remaining (incomplete) problems' estimateProblemMinutes plus a
 * flat lesson-length estimate if the pattern has an extended lesson not yet started. */
export function estimatePatternRemainingMinutes(pattern: StudyPattern): number {
  const problemMinutes = pattern.problems
    .filter((problem) => !problem.completed)
    .reduce((sum, problem) => sum + problem.estimatedMinutes, 0)
  const lessonMinutes =
    pattern.hasExtendedLesson && pattern.stage === "not_started" ? LESSON_LENGTH_MINUTES : 0
  return problemMinutes + lessonMinutes
}

export type DsaPattern =
  | "arrays-two-pointers"
  | "sliding-window"
  | "binary-search"
  | "linked-list"
  | "trees"
  | "bfs-dfs"
  | "heaps"
  | "backtracking"
  | "intervals"
  | "graphs"
  | "dynamic-programming"
  | "greedy"
  | "tries"
  | "stacks-queues"

export interface TestCase {
  input: unknown[]
  expected: unknown
  isHidden: boolean
  name?: string
}

export interface Problem {
  id: string
  title: string
  pattern: DsaPattern
  difficulty: Difficulty
  companies: string[]
  prompt: string
  examples: { input: string; output: string; explanation?: string }[]
  constraints: string[]
  hints: string[]
  solution: {
    approach: string
    code: string
    timeComplexity: string
    spaceComplexity: string
  }
  starterCode: string
  functionName: string
  testCases: TestCase[]
  /** Positional parameter names for functionName, e.g. ["nums", "target"] — shared across all
   * testCases since they all call the same function signature. Drives the test-case panel's
   * labeled inputs (e.g. "nums = [2,7,11,15]") instead of generic "arg1/arg2". Optional so the
   * ~117 existing problem JSON files don't need a backfill; the panel falls back to arg1, arg2… */
  paramNames?: string[]
}

export type StrippedProblem = Pick<
  Problem,
  | "id"
  | "title"
  | "prompt"
  | "examples"
  | "constraints"
  | "starterCode"
  | "functionName"
  | "paramNames"
>

export type ProgressStatus = "not_started" | "attempted" | "solved" | "mastered"

export interface ProblemSummary {
  id: string
  title: string
  pattern: DsaPattern
  difficulty: Difficulty
  companies: string[]
  progressStatus: ProgressStatus
  favorited: boolean
}

export type PracticeMode = "practice" | "blind" | "oa"

export interface AttemptRecord {
  id: string
  problemId: string
  /** Server-assigned only — ProgressService.recordAttempt stamps this; never accept a caller-supplied value. */
  timestamp: string
  passed: boolean
  hintsUsed: number
  durationMs: number
  mode: PracticeMode
}

export interface ProblemProgress {
  problemId: string
  status: ProgressStatus
  attemptCount: number
  hintsEverUsed: boolean
  lastAttemptAt: string | null
  lastSolvedAt: string | null
}

export type TestOutcomeStatus = "passed" | "wrong_answer" | "runtime_error" | "timeout"

export interface TestCaseResult {
  status: TestOutcomeStatus
  input: unknown[]
  expected: unknown
  actual: unknown
  isHidden: boolean
  stdout: string
  errorMessage: string | null
  name?: string | null
}

export interface ExecutionResult {
  allPassed: boolean
  results: TestCaseResult[]
  runtimeMs: number
}

export interface CodeSubmission {
  code: string
  functionName: string
  language: "python"
}

export type ThemePreference = "light" | "dark"

export type OASessionStatus = "in_progress" | "completed" | "expired"
export type OAProblemStatus = "unanswered" | "in_progress" | "passed" | "failed"

export interface OASessionConfig {
  difficulty: Difficulty | Partial<Record<Difficulty, number>>
  problemCount: number
  timeBudgetMs: number
}

export interface OASessionProblemState {
  problemId: string
  status: OAProblemStatus
  code: string | null
  lastSubmissionResult: ExecutionResult | null
  timeSpentMs: number
}

export interface OASession {
  id: string
  status: OASessionStatus
  startedAt: string
  deadline: string
  problems: OASessionProblemState[]
  activeProblemId: string | null
}

export interface OASessionSummary {
  sessionId: string
  status: OASessionStatus
  problemsPassed: number
  problemsTotal: number
  perProblem: { problemId: string; status: OAProblemStatus; timeSpentMs: number }[]
}

export interface BlindTestSet {
  id: string
  name: string
  createdAt: string
  problemIds: string[]
}

export interface BlindTestSetSummary {
  id: string
  name: string
  createdAt: string
  problemCount: number
}

export interface BlindTestSetFilter {
  patterns?: DsaPattern[]
  difficulties?: Difficulty[]
}

export type LessonDemoKind =
  | "two-pointers"
  | "sliding-window"
  | "binary-search"
  | "bfs-dfs"
  | "linked-list"
  | "trees"
  | "heaps"
  | "backtracking"
  | "intervals"
  | "graphs"
  | "dynamic-programming"
  | "greedy"
  | "tries"
  | "stacks-queues"
  | "none"

export interface PatternLesson {
  pattern: DsaPattern
  title: string
  summary: string
  explanation: string[]
  whenToUse: string[]
  timeComplexity: string
  spaceComplexity: string
  demoKind: LessonDemoKind
  relatedProblemIds: string[]
}

export interface PatternLessonSummary {
  pattern: DsaPattern
  title: string
  summary: string
  hasInteractiveDemo: boolean
  relatedProblemCount: number
}

// --- Auth ---

export interface User {
  id: string
  username: string
  createdAt: string
}

// --- Profile / Stats ---

/** Kept broad and open-ended on purpose — new event types can be appended here (and to the
 * `statEventTypeSchema` enum) as new features want to contribute to the profile stats without
 * needing a new table or store method each time. */
export type StatEventType = "attempt" | "oa_session_completed"

/** Append-only, per-user activity log — one row per meaningful action (a code submission, an
 * OA session ending). `ProfileStatsOverview` is always a fold over these rows, never a
 * separately-maintained counter, so it can never drift from the underlying events. Only
 * recorded while a user is logged in (see StatsService) — Practice/Blind/OA stay usable
 * logged-out, but that activity isn't attributable to a profile. */
export interface StatEvent {
  id: string
  userId: string
  type: StatEventType
  occurredAt: string
  problemId: string | null
  mode: PracticeMode | null
  passed: boolean | null
  durationMs: number
  linesOfCode: number
}

export interface ProfileStatsOverview {
  problemsCompleted: number
  totalAttempts: number
  totalLinesOfCode: number
  totalTimeSpentMs: number
  oaSessionsCompleted: number
  currentStreakDays: number
  longestStreakDays: number
  activeDays: number
  lastActiveAt: string | null
  byMode: Record<PracticeMode, { attempts: number; passed: number }>
}

export interface DailyActivityDay {
  /** YYYY-MM-DD, local-to-UTC date key — same convention as toDateKey in stats-service. */
  date: string
  solvedCount: number
}

export interface DailyActivityOverview {
  /** Oldest first, one entry per day in the requested window (zero-filled, not just active days) — a chart/heatmap can index straight into this without re-deriving the calendar. */
  days: DailyActivityDay[]
  longestStreakDays: number
}

// --- Study Plan ---

/** A user-created, independently-tracked study plan. Multiple plans can exist per user, each
 * tracking its own settings/progress against the same shared curriculum (tracks/patterns/
 * problems below are global; everything keyed by plan id is this plan's own state). */
export interface StudyPlan {
  id: string
  userId: string
  name: string
  createdAt: string
  /** True for the one plan (per user) shown on the main dashboard / used as the default
   * destination for "resume studying" style shortcuts. At most one plan per user has this
   * set — see StudyPlanService.setActivePlan. */
  isActive: boolean
}

/** Cheap, pre-aggregated stats for the plan list page — avoids the list view needing to
 * compute a full StudyPlanOverview (recommendation/drill-queue/readiness) per plan. */
export interface StudyPlanSummary {
  id: string
  name: string
  createdAt: string
  isActive: boolean
  interviewDate: string | null
  dailyTimeBudgetMinutes: number
  targetCompany: string | null
  targetRole: string | null
  totalPatterns: number
  readyOrBetterPatterns: number
}

export type StudyTrackId = "oa-prep" | "technical-interview-prep"

export type StudyPatternComplexityTier = "core" | "important" | "complexity-ceiling" | "stretch"

export type StudyPatternStage =
  | "not_started"
  | "concept"
  | "easy_done"
  | "mediums_done"
  | "bug_tracing_done"

export const STUDY_PATTERN_STAGE_ORDER: StudyPatternStage[] = [
  "not_started",
  "concept",
  "easy_done",
  "mediums_done",
  "bug_tracing_done",
]

export interface StudyTrack {
  id: StudyTrackId
  name: string
  description: string
  coachingNote: string | null
}

export type StudyProblemRole = "canonical_easy" | "medium_variant"

export interface StudyProblem {
  id: string
  studyPatternId: string
  name: string
  difficulty: Difficulty
  role: StudyProblemRole
  externalUrl: string | null
  completed: boolean
  timeTakenMinutes: number | null
  constraintAddedMidSolve: boolean | null
  /** Main-library Problem.id this study-plan row is backed by, or null if not authored yet.
   * Drives whether the workbook renders an embedded, runnable editor (fetching the Problem by
   * this id) vs. an external-link "not embedded yet" notice. */
  linkedProblemId: string | null
  /** Derived server-side from difficulty (see estimateProblemMinutes in StudyPlanService), not
   * stored: a baseline interview-pacing estimate used to build the daily time budget. Not a
   * measured average — just enough to size a day's queue against dailyTimeBudgetMinutes. */
  estimatedMinutes: number
}

/** Rich per-pattern lesson content, authored only for patterns where hasExtendedLesson is
 * true. Markdown strings render as rich text on the client. Distinct from PatternLesson (the
 * separate DsaPattern-keyed lesson-library feature) — this is study-plan-specific and keyed
 * by StudyPattern.id. */
export interface ExtendedLesson {
  coreIdeaMarkdown: string
  workedExampleMarkdown: string
  variationsMarkdown: string
  signalPhrases: string[]
  commonMistakesMarkdown: string
  complexityMarkdown: string
}

export interface BugTracingExercise {
  prompt: string
  solutionWalkthroughMarkdown: string
}

/** A discrete, testable competency — distinct from "did I solve N problems." Self-assessed
 * done/not-done, optionally tied to one or more patterns (empty patternIds = global, e.g.
 * general interview-communication skills not scoped to one topic). Shared curriculum data
 * (seeded once, like StudyPattern), with per-plan done/lastVerifiedAt state layered on top. */
export interface Skill {
  id: string
  name: string
  description: string
  patternIds: string[]
  done: boolean
  lastVerifiedAt: string | null
}

export type ResourceType = "video" | "article" | "visualization"

/** A curated external explainer for a pattern (NeetCode video, visualgo.net visualization,
 * etc.) — a short, trusted list (2-4), not a link dump. Shared curriculum data. */
export interface PatternResource {
  title: string
  url: string
  type: ResourceType
}

export interface StudyPattern {
  id: string
  trackId: StudyTrackId
  name: string
  priorityRank: number
  /** Independent of priorityRank: how likely this pattern is to actually appear in the
   * interview (0-1), vs. priorityRank which is "what order to learn things in." Graphs is
   * seeded at 0.95 per direct report; most others are inferred, lower-confidence estimates. */
  likelihoodWeight: number
  /** Per-plan override of priorityRank, set by the AI builder from company/role/background
   * context (e.g. graphs ranked earlier for a plan targeting a company known to favor them).
   * Null until a plan has been personalized. When present, roadmap ordering and drill-queue
   * scoring use this instead of the global priorityRank/likelihoodWeight for this plan. */
  personalizedPriorityRank: number | null
  /** Per-plan override of likelihoodWeight — see personalizedPriorityRank. */
  personalizedLikelihoodWeight: number | null
  conceptNotes: string
  complexityTier: StudyPatternComplexityTier
  stage: StudyPatternStage
  confidence: number | null
  notes: string
  problems: StudyProblem[]
  spacedRepetition: SpacedRepetitionState
  /** Derived server-side from priorityRank/trackId (see StudyPlanService), not stored. True
   * for the highest-priority patterns in Technical Interview Prep, which get the full
   * lesson -> worked example -> practice workbook treatment instead of the lightweight format. */
  hasExtendedLesson: boolean
  /** Present only when hasExtendedLesson; null otherwise. */
  lesson: ExtendedLesson | null
  /** Populated only where curriculum data supplies it. Surfaced automatically once stage
   * reaches "mediums_done" (the stage right before bug_tracing_done). */
  bugTracingExercise: BugTracingExercise | null
  /** Skills whose patternIds include this pattern's id, with this plan's done/lastVerifiedAt
   * state attached. Mastering these is visibly part of "finishing" the pattern, alongside
   * problems — not a separate afterthought. */
  skills: Skill[]
  /** Curated external explainers for this pattern. Empty until seeded — absence is meant to be
   * visible in the UI (flags which patterns still need resources added) rather than hidden. */
  resources: PatternResource[]
}

/** SM-2-lite scheduling state, one per (user, pattern). Advanced on every "review event" —
 * a stage change, a confidence rating, or a mock interview result touching this pattern —
 * never on a bare page view. `dueAt` is what the drill queue sorts by. */
export interface SpacedRepetitionState {
  easeFactor: number
  intervalDays: number
  dueAt: string | null
  lastReviewedAt: string | null
  reviewCount: number
}

export interface StudySession {
  id: string
  date: string
  minutesSpent: number
  studyPatternIds: string[]
  stickingPoint: string
  planForNextSession: string
}

export interface MockInterviewResult {
  id: string
  date: string
  studyProblemId: string | null
  studyPatternId: string | null
  problemName: string
  timeTakenMinutes: number
  solvedCleanly: boolean
  constraintAddedMidSolve: boolean
  notes: string
}

/** Combines stage completion + self-rated confidence into one signal, rather than a bare
 * checkbox — a pattern can be "mediums_done" but low-confidence, which should still surface
 * as needing more work. */
export type StudyReadiness = "not_started" | "needs_work" | "developing" | "ready"

export interface StudyPatternWithReadiness extends StudyPattern {
  readiness: StudyReadiness
}

export interface StudyPlanSettings {
  interviewDate: string | null
  dailyTimeBudgetMinutes: number
  /** Free-text personalization context, set by the AI builder (or manually) and surfaced back
   * to the user on the plan — not parsed structurally, but included as context in any future
   * AI regeneration/refinement pass. */
  targetCompany: string | null
  targetRole: string | null
  background: string | null
}

export interface StudyRecommendation {
  studyPatternId: string | null
  studyPatternName: string | null
  trackId: StudyTrackId | null
  nextStage: StudyPatternStage | null
  reason: string
  daysRemaining: number | null
  suggestedMinutesToday: number
  oaPrepSuggestion: string | null
  /** Sum of drillQueue[].estimatedMinutes — how much of suggestedMinutesToday the queue as
   * built actually accounts for. Purely informational: the queue itself isn't trimmed or
   * reordered to fit, so this can run over or under the budget. */
  drillQueueEstimatedMinutes: number
}

/** One entry in the "workthrough book" drill queue — the ordered, adaptive sequence the
 * Study Plan surfaces to work through today. Distinct from StudyRecommendation (a single
 * top pick with a human-readable reason): this is the full ranked queue driving the drill UI. */
export interface DrillQueueEntry {
  studyPatternId: string
  studyPatternName: string
  trackId: StudyTrackId
  reason: "overdue_review" | "never_reviewed" | "high_likelihood_low_confidence" | "scheduled"
  priorityScore: number
  likelihoodWeight: number
  readiness: StudyReadiness
  dueAt: string | null
  /** Baseline minutes budgeted for one drill pass at this pattern (see
   * DRILL_QUEUE_MINUTES_PER_ITEM) — annotates the queue against dailyTimeBudgetMinutes without
   * changing its order. */
  estimatedMinutes: number
}

/** One problem recommended within a TodayFocusEntry — a thin projection of StudyProblem, just
 * enough to render and link to the problem without shipping the whole pattern. */
export interface RecommendedProblem {
  id: string
  name: string
  difficulty: Difficulty
  role: StudyProblemRole
  completed: boolean
  linkedProblemId: string | null
  externalUrl: string | null
}

/** The 1-3 problems worth doing right now for a single drill-queue pattern, picked by
 * computeTodayFocus from that pattern's stage/confidence: no-progress patterns get the
 * easiest/canonical problems, patterns further along or rated more confident get pulled toward
 * harder medium_variant problems. This is what "Today" actually shows, replacing the old
 * dump of every problem in the pattern with a short, always-actionable list. */
export interface TodayFocusEntry {
  studyPatternId: string
  studyPatternName: string
  trackId: StudyTrackId
  reason: DrillQueueEntry["reason"]
  recommendedProblems: RecommendedProblem[]
}

export interface StudyPlanOverview {
  settings: StudyPlanSettings
  tracks: StudyTrack[]
  patterns: StudyPatternWithReadiness[]
  recommendation: StudyRecommendation
  drillQueue: DrillQueueEntry[]
  todayFocus: TodayFocusEntry[]
  overallProgress: {
    trackId: StudyTrackId
    totalPatterns: number
    readyOrBetter: number
    averageStageIndex: number
  }[]
}

/** One pattern's line in the Roadmap view — priority order plus a rough time-cost estimate.
 * estimatedHoursRemaining excludes already-completed work, so the roadmap reflects what's left
 * to do, not the pattern's total size. */
export interface RoadmapPatternEntry {
  studyPatternId: string
  studyPatternName: string
  trackId: StudyTrackId
  priorityRank: number
  /** True when priorityRank above is this plan's AI-set personalized override rather than the
   * static curriculum-wide rank — lets the UI badge "reprioritized for your plan." */
  isPersonalized: boolean
  stage: StudyPatternStage
  readiness: StudyReadiness
  estimatedHoursRemaining: number
  /** The next incomplete pattern in this track, by priorityRank — same pick computeRecommendation
   * makes for Technical Interview Prep. */
  isCurrent: boolean
  /** The 2-3 incomplete patterns immediately after the current one, in priorityRank order. */
  isUpNext: boolean
}

export interface RoadmapOverview {
  interviewDate: string | null
  daysRemaining: number | null
  dailyTimeBudgetMinutes: number
  /** Sum of estimatedHoursRemaining across every incomplete pattern in both tracks, divided by
   * dailyTimeBudgetMinutes/60 — "at this daily pace, how many days of work are left." */
  daysNeededAtCurrentPace: number
  /** daysNeededAtCurrentPace - daysRemaining. Negative means ahead of pace, positive means
   * behind. Null when no interview date is set (there's nothing to compare against). */
  paceDeltaDays: number | null
  tracks: {
    trackId: StudyTrackId
    entries: RoadmapPatternEntry[]
  }[]
}

/** Where a Readiness Checklist item's checked state comes from: "manual" is a plain per-plan
 * toggle with no underlying signal (e.g. "reviewed Google's tips page"); "derived" is always
 * recomputed fresh from Skills/mock-interview data and can't be directly edited; "tri_state" is
 * the one special-cased item that isn't a boolean at all (see ReadinessTriState). */
export type ReadinessSource = "manual" | "derived" | "tri_state"

/** "not_applicable" (default, nothing to review yet) / "needs_review" (received, not yet
 * checked against) / "confirmed" (reviewed, no gaps found) — for the one checklist item that
 * depends on something that may not have happened yet (Google's post-OA topic list). */
export type ReadinessTriState = "not_applicable" | "needs_review" | "confirmed"

export interface ReadinessChecklistItem {
  id: string
  section: "oa" | "technical"
  label: string
  source: ReadinessSource
  /** For the one tri_state item, this mirrors triState === "confirmed" so generic
   * completion-fraction math still works uniformly across all items. */
  checked: boolean
  /** Non-null only for the one tri_state item; null for every manual/derived item. */
  triState: ReadinessTriState | null
  note: string | null
}

export interface ReadinessChecklistOverview {
  oaItems: ReadinessChecklistItem[]
  technicalItems: ReadinessChecklistItem[]
  oaCompletionFraction: number
  technicalCompletionFraction: number
}
