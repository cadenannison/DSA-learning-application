import { apiClient } from "@/lib/api-client"
import type { ProfileStatsOverview, StudyPlanOverview, StudyPlanSummary } from "@/types"

export interface DashboardData {
  plan: StudyPlanSummary
  overview: StudyPlanOverview
  stats: ProfileStatsOverview | null
  totalLibraryProblems: number
}

export interface DashboardView {
  setLoading(loading: boolean): void
  setData(data: DashboardData | null): void
  setError(message: string | null): void
}

/** Loads everything the Dashboard needs in one pass: the user's most-recently-created study
 * plan (the app doesn't have a concept of a single "active" plan yet, so "most recent" is the
 * stand-in), that plan's overview (drill queue, tier progress, patterns), profile stats
 * (streak, problems completed), and the total library size for the "X / total" stat. Returns
 * null data (not an error) when the user has no study plan yet, since that's a normal empty
 * state rather than a failure. */
export class DashboardPresenter {
  constructor(private readonly view: DashboardView) {}

  async load(): Promise<void> {
    this.view.setLoading(true)
    this.view.setError(null)

    try {
      const [plans, stats, allProblems] = await Promise.all([
        apiClient.listStudyPlans(),
        apiClient.getProfileStats(),
        apiClient.listProblems(),
      ])

      const plan = plans[0] ?? null
      if (!plan) {
        this.view.setData(null)
        return
      }

      const overview = await apiClient.getStudyPlanOverview(plan.id)

      this.view.setData({
        plan,
        overview,
        stats,
        totalLibraryProblems: allProblems.length,
      })
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to load dashboard")
    } finally {
      this.view.setLoading(false)
    }
  }
}
