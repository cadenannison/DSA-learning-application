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
  progressStatus: ProgressStatus
}

export type PracticeMode = "practice" | "blind"

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
