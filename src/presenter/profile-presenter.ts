import { apiClient } from "@/lib/api-client"
import type {
  DailyActivityOverview,
  MockInterviewResult,
  OASessionHistoryEntry,
  ProfileStatsOverview,
  SolvedProblemEntry,
  StudyPatternWithReadiness,
} from "@/types"

export interface ProfileData {
  stats: ProfileStatsOverview | null
  dailyActivity: DailyActivityOverview | null
  patterns: StudyPatternWithReadiness[]
  mockInterviewResults: MockInterviewResult[]
  solvedProblems: SolvedProblemEntry[]
  oaHistory: OASessionHistoryEntry[]
}

export interface ProfileView {
  setLoading(loading: boolean): void
  setData(data: ProfileData): void
  setError(message: string | null): void
}

/** Progress page data: account-wide stats/daily-activity plus, when a study plan exists,
 * that plan's pattern mastery and mock interview log. Same "most-recently-created plan"
 * stand-in as DashboardPresenter — the app has no concept of a single "active" plan yet. */
export class ProfilePresenter {
  constructor(private readonly view: ProfileView) {}

  async load(): Promise<void> {
    this.view.setLoading(true)
    this.view.setError(null)

    try {
      const [stats, dailyActivity, solvedProblems, oaHistory, plans] = await Promise.all([
        apiClient.getProfileStats(),
        apiClient.getDailyActivity(14),
        apiClient.getSolvedProblems(),
        apiClient.getOAHistory(),
        apiClient.listStudyPlans(),
      ])

      const plan = plans[0] ?? null
      if (!plan) {
        this.view.setData({
          stats,
          dailyActivity,
          patterns: [],
          mockInterviewResults: [],
          solvedProblems: solvedProblems ?? [],
          oaHistory: oaHistory ?? [],
        })
        return
      }

      const [overview, mockInterviewResults] = await Promise.all([
        apiClient.getStudyPlanOverview(plan.id),
        apiClient.listMockInterviewResults(plan.id),
      ])

      this.view.setData({
        stats,
        dailyActivity,
        patterns: overview.patterns,
        mockInterviewResults,
        solvedProblems: solvedProblems ?? [],
        oaHistory: oaHistory ?? [],
      })
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to load stats")
    } finally {
      this.view.setLoading(false)
    }
  }
}
