export type Difficulty = "easy" | "medium" | "hard"

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
}

export interface ExecutionResult {
  allPassed: boolean
  results: TestCaseResult[]
  runtimeMs: number
}

export interface CodeSubmission {
  code: string
  functionName: string
  language: "javascript"
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
