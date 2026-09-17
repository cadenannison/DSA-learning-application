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
}

export type StrippedProblem = Pick<
  Problem,
  "id" | "title" | "prompt" | "examples" | "constraints" | "starterCode" | "functionName"
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
  name?: string
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
}

/** Cheap, pre-aggregated stats for the plan list page — avoids the list view needing to
 * compute a full StudyPlanOverview (recommendation/drill-queue/readiness) per plan. */
export interface StudyPlanSummary {
  id: string
  name: string
  createdAt: string
  interviewDate: string | null
  dailyTimeBudgetMinutes: number
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

export interface StudyPattern {
  id: string
  trackId: StudyTrackId
  name: string
  priorityRank: number
  /** Independent of priorityRank: how likely this pattern is to actually appear in the
   * interview (0-1), vs. priorityRank which is "what order to learn things in." Graphs is
   * seeded at 0.95 per direct report; most others are inferred, lower-confidence estimates. */
  likelihoodWeight: number
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

export interface StudyPlanOverview {
  settings: StudyPlanSettings
  tracks: StudyTrack[]
  patterns: StudyPatternWithReadiness[]
  recommendation: StudyRecommendation
  drillQueue: DrillQueueEntry[]
  overallProgress: {
    trackId: StudyTrackId
    totalPatterns: number
    readyOrBetter: number
    averageStageIndex: number
  }[]
}
