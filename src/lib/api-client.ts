import type {
  AttemptRecord,
  BlindTestSet,
  BlindTestSetFilter,
  BlindTestSetSummary,
  CodeSubmission,
  DailyActivityOverview,
  Difficulty,
  DsaPattern,
  ExecutionResult,
  MockInterviewResult,
  OASession,
  OASessionConfig,
  OASessionSummary,
  PatternLesson,
  PatternLessonSummary,
  PracticeMode,
  Problem,
  ProblemProgress,
  ProblemSummary,
  ProfileStatsOverview,
  StrippedProblem,
  StudyPattern,
  StudyPatternStage,
  StudyPlan,
  StudyPlanOverview,
  StudyPlanSettings,
  StudyPlanSummary,
  StudySession,
  SubmitStudyProblemResponse,
  ThemePreference,
  User,
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
  company?: string
  query?: string
  favorite?: boolean
}

export const apiClient = {
  async register(username: string, password: string): Promise<User> {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    return handle<User>(response)
  },

  async login(username: string, password: string): Promise<User> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    return handle<User>(response)
  },

  async logout(): Promise<void> {
    const response = await fetch("/api/auth/logout", { method: "POST" })
    await handle<{ ok: boolean }>(response)
  },

  async getCurrentUser(): Promise<User | null> {
    const response = await fetch("/api/auth/me")
    if (response.status === 401) return null
    return handle<User>(response)
  },

  async getProfileStats(): Promise<ProfileStatsOverview | null> {
    const response = await fetch("/api/profile/stats")
    if (response.status === 401) return null
    return handle<ProfileStatsOverview>(response)
  },

  async getDailyActivity(days = 14): Promise<DailyActivityOverview | null> {
    const response = await fetch(`/api/profile/daily-activity?days=${days}`)
    if (response.status === 401) return null
    return handle<DailyActivityOverview>(response)
  },

  async listProblems(filter?: ProblemFilter): Promise<ProblemSummary[]> {
    const params = new URLSearchParams()
    if (filter?.pattern) params.set("pattern", filter.pattern)
    if (filter?.difficulty) params.set("difficulty", filter.difficulty)
    if (filter?.company) params.set("company", filter.company)
    if (filter?.query) params.set("query", filter.query)
    if (filter?.favorite !== undefined) params.set("favorite", String(filter.favorite))

    const response = await fetch(`/api/problems?${params.toString()}`)
    return handle<ProblemSummary[]>(response)
  },

  async setFavorite(problemId: string, favorited: boolean): Promise<void> {
    const response = await fetch(`/api/problems/${problemId}/favorite`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorited }),
    })
    await handle<{ favorited: boolean }>(response)
  },

  async listCompanies(): Promise<string[]> {
    const response = await fetch("/api/companies")
    return handle<string[]>(response)
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
    code?: string
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

  async startOASession(config: OASessionConfig): Promise<OASession> {
    const response = await fetch("/api/oa/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    })
    return handle<OASession>(response)
  },

  async getOASession(sessionId: string): Promise<OASession> {
    const response = await fetch(`/api/oa/session/${sessionId}`)
    return handle<OASession>(response)
  },

  async saveOAProgress(sessionId: string, problemId: string, code: string): Promise<OASession> {
    const response = await fetch(`/api/oa/session/${sessionId}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId, code }),
    })
    return handle<OASession>(response)
  },

  async submitOAProblem(
    sessionId: string,
    problemId: string,
    submission: CodeSubmission
  ): Promise<OASession> {
    const response = await fetch(`/api/oa/session/${sessionId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId, submission }),
    })
    return handle<OASession>(response)
  },

  async endOASession(sessionId: string): Promise<OASessionSummary> {
    const response = await fetch(`/api/oa/session/${sessionId}/end`, {
      method: "POST",
    })
    return handle<OASessionSummary>(response)
  },

  async listBlindTestSets(): Promise<BlindTestSetSummary[]> {
    const response = await fetch("/api/blind/sets")
    return handle<BlindTestSetSummary[]>(response)
  },

  async getBlindTestSet(id: string): Promise<BlindTestSet> {
    const response = await fetch(`/api/blind/sets/${id}`)
    return handle<BlindTestSet>(response)
  },

  async createBlindTestSet(input: {
    name: string
    problemIds?: string[]
    filter?: BlindTestSetFilter
  }): Promise<BlindTestSet> {
    const response = await fetch("/api/blind/sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    return handle<BlindTestSet>(response)
  },

  async addProblemsToSet(id: string, problemIds: string[]): Promise<BlindTestSet> {
    const response = await fetch(`/api/blind/sets/${id}/problems`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemIds }),
    })
    return handle<BlindTestSet>(response)
  },

  async addProblemsToSetByFilter(id: string, filter: BlindTestSetFilter): Promise<BlindTestSet> {
    const response = await fetch(`/api/blind/sets/${id}/problems`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filter }),
    })
    return handle<BlindTestSet>(response)
  },

  async removeProblemFromSet(id: string, problemId: string): Promise<BlindTestSet> {
    const response = await fetch(`/api/blind/sets/${id}/problems/${problemId}`, {
      method: "DELETE",
    })
    return handle<BlindTestSet>(response)
  },

  async deleteBlindTestSet(id: string): Promise<void> {
    const response = await fetch(`/api/blind/sets/${id}`, { method: "DELETE" })
    await handle<{ ok: boolean }>(response)
  },

  async getRandomProblemFromSet(id: string): Promise<StrippedProblem> {
    const response = await fetch(`/api/blind/sets/${id}/random`)
    return handle<StrippedProblem>(response)
  },

  async listLessons(): Promise<PatternLessonSummary[]> {
    const response = await fetch("/api/lessons")
    return handle<PatternLessonSummary[]>(response)
  },

  async getLesson(pattern: DsaPattern): Promise<PatternLesson> {
    const response = await fetch(`/api/lessons/${pattern}`)
    return handle<PatternLesson>(response)
  },

  async listStudyPlans(): Promise<StudyPlanSummary[]> {
    const response = await fetch("/api/study-plans")
    return handle<StudyPlanSummary[]>(response)
  },

  async createStudyPlan(name: string): Promise<StudyPlan> {
    const response = await fetch("/api/study-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    return handle<StudyPlan>(response)
  },

  async deleteStudyPlan(id: string): Promise<void> {
    const response = await fetch(`/api/study-plans/${id}`, { method: "DELETE" })
    await handle<{ ok: boolean }>(response)
  },

  async getStudyPlanOverview(planId: string): Promise<StudyPlanOverview> {
    const response = await fetch(`/api/study-plan/${planId}`)
    return handle<StudyPlanOverview>(response)
  },

  async updateStudyPattern(
    planId: string,
    id: string,
    update: { stage?: StudyPatternStage; confidence?: number | null; notes?: string }
  ): Promise<StudyPattern> {
    const response = await fetch(`/api/study-plan/${planId}/patterns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    })
    return handle<StudyPattern>(response)
  },

  async updateStudyProblem(
    planId: string,
    id: string,
    update: {
      completed?: boolean
      timeTakenMinutes?: number | null
      constraintAddedMidSolve?: boolean | null
    }
  ): Promise<StudyPattern> {
    const response = await fetch(`/api/study-plan/${planId}/problems/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    })
    return handle<StudyPattern>(response)
  },

  async updateStudyPlanSettings(
    planId: string,
    update: Partial<StudyPlanSettings>
  ): Promise<StudyPlanSettings> {
    const response = await fetch(`/api/study-plan/${planId}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    })
    return handle<StudyPlanSettings>(response)
  },

  async listStudySessions(planId: string): Promise<StudySession[]> {
    const response = await fetch(`/api/study-plan/${planId}/sessions`)
    return handle<StudySession[]>(response)
  },

  async logStudySession(
    planId: string,
    input: {
      date: string
      minutesSpent: number
      studyPatternIds: string[]
      stickingPoint?: string
      planForNextSession?: string
    }
  ): Promise<StudySession> {
    const response = await fetch(`/api/study-plan/${planId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    return handle<StudySession>(response)
  },

  async listMockInterviewResults(planId: string): Promise<MockInterviewResult[]> {
    const response = await fetch(`/api/study-plan/${planId}/mock-interviews`)
    return handle<MockInterviewResult[]>(response)
  },

  async logMockInterviewResult(
    planId: string,
    input: {
      date: string
      studyProblemId?: string | null
      studyPatternId?: string | null
      problemName: string
      timeTakenMinutes: number
      solvedCleanly: boolean
      constraintAddedMidSolve?: boolean
      notes?: string
    }
  ): Promise<MockInterviewResult> {
    const response = await fetch(`/api/study-plan/${planId}/mock-interviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    return handle<MockInterviewResult>(response)
  },

  async submitStudyProblem(
    planId: string,
    id: string,
    submission: CodeSubmission,
    timeTakenMinutes: number
  ): Promise<SubmitStudyProblemResponse> {
    const response = await fetch(`/api/study-plan/${planId}/problems/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submission, timeTakenMinutes }),
    })
    return handle<SubmitStudyProblemResponse>(response)
  },

  async logProblemSession(planId: string, id: string, minutesSpent: number): Promise<void> {
    const response = await fetch(`/api/study-plan/${planId}/problems/${id}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutesSpent }),
    })
    await handle<{ ok: boolean }>(response)
  },
}
