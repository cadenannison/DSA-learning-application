import type {
  AttemptRecord,
  CodeSubmission,
  Difficulty,
  DsaPattern,
  ExecutionResult,
  PracticeMode,
  Problem,
  ProblemProgress,
  ProblemSummary,
  StrippedProblem,
  ThemePreference,
} from "@/types"

export class ApiClientError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
  }
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiClientError(body.error ?? response.statusText, response.status)
  }
  return response.json() as Promise<T>
}

export interface ProblemFilter {
  pattern?: DsaPattern
  difficulty?: Difficulty
  query?: string
}

export const apiClient = {
  async listProblems(filter?: ProblemFilter): Promise<ProblemSummary[]> {
    const params = new URLSearchParams()
    if (filter?.pattern) params.set("pattern", filter.pattern)
    if (filter?.difficulty) params.set("difficulty", filter.difficulty)
    if (filter?.query) params.set("query", filter.query)

    const response = await fetch(`/api/problems?${params.toString()}`)
    return handle<ProblemSummary[]>(response)
  },

  async getProblem(id: string): Promise<Problem> {
    const response = await fetch(`/api/problems/${id}`)
    return handle<Problem>(response)
  },

  async getBlindProblem(id: string): Promise<StrippedProblem> {
    const response = await fetch(`/api/blind/${id}`)
    return handle<StrippedProblem>(response)
  },

  async execute(
    problemId: string,
    submission: CodeSubmission,
    mode: PracticeMode
  ): Promise<ExecutionResult> {
    const response = await fetch("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId, submission, mode }),
    })
    return handle<ExecutionResult>(response)
  },

  async recordAttempt(input: {
    problemId: string
    passed: boolean
    hintsUsed: number
    durationMs: number
    mode: PracticeMode
  }): Promise<AttemptRecord> {
    const response = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    return handle<AttemptRecord>(response)
  },

  async listProgress(): Promise<ProblemProgress[]> {
    const response = await fetch("/api/progress")
    return handle<ProblemProgress[]>(response)
  },

  async getTheme(): Promise<ThemePreference> {
    const response = await fetch("/api/preferences")
    const data = await handle<{ theme: ThemePreference }>(response)
    return data.theme
  },

  async setTheme(theme: ThemePreference): Promise<void> {
    const response = await fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme }),
    })
    await handle<{ theme: ThemePreference }>(response)
  },
}
