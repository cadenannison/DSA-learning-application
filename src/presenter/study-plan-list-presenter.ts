import { apiClient } from "@/lib/api-client"
import type { StudyPlan, StudyPlanSummary } from "@/types"

export interface StudyPlanListView {
  setLoading(loading: boolean): void
  setPlans(plans: StudyPlanSummary[]): void
  setError(message: string | null): void
}

export class StudyPlanListPresenter {
  constructor(private readonly view: StudyPlanListView) {}

  async loadPlans(): Promise<void> {
    this.view.setLoading(true)
    this.view.setError(null)

    try {
      const plans = await apiClient.listStudyPlans()
      this.view.setPlans(plans)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to load study plans")
    } finally {
      this.view.setLoading(false)
    }
  }

  async createPlan(name: string): Promise<StudyPlan | null> {
    try {
      return await apiClient.createStudyPlan(name)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to create study plan")
      return null
    }
  }

  async deletePlan(id: string): Promise<void> {
    try {
      await apiClient.deleteStudyPlan(id)
      await this.loadPlans()
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to delete study plan")
    }
  }

  async setActivePlan(id: string): Promise<void> {
    try {
      await apiClient.setActiveStudyPlan(id)
      await this.loadPlans()
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to set active study plan")
    }
  }
}
