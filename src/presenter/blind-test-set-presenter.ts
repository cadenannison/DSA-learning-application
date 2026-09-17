import { apiClient } from "@/lib/api-client"
import type { BlindTestSet, BlindTestSetFilter, BlindTestSetSummary } from "@/types"

export interface BlindTestSetListView {
  setLoading(loading: boolean): void
  setSets(sets: BlindTestSetSummary[]): void
  setError(message: string | null): void
}

export class BlindTestSetListPresenter {
  constructor(private readonly view: BlindTestSetListView) {}

  async loadSets(): Promise<void> {
    this.view.setLoading(true)
    this.view.setError(null)

    try {
      const sets = await apiClient.listBlindTestSets()
      this.view.setSets(sets)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to load sets")
    } finally {
      this.view.setLoading(false)
    }
  }

  async createSet(input: {
    name: string
    problemIds?: string[]
    filter?: BlindTestSetFilter
  }): Promise<BlindTestSet | null> {
    try {
      return await apiClient.createBlindTestSet(input)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to create set")
      return null
    }
  }

  async deleteSet(id: string): Promise<void> {
    try {
      await apiClient.deleteBlindTestSet(id)
      await this.loadSets()
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to delete set")
    }
  }
}

export interface BlindTestSetDetailView {
  setLoading(loading: boolean): void
  setSet(set: BlindTestSet | null): void
  setError(message: string | null): void
}

export class BlindTestSetDetailPresenter {
  constructor(private readonly view: BlindTestSetDetailView) {}

  async loadSet(id: string): Promise<void> {
    this.view.setLoading(true)
    this.view.setError(null)

    try {
      const set = await apiClient.getBlindTestSet(id)
      this.view.setSet(set)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to load set")
    } finally {
      this.view.setLoading(false)
    }
  }

  async addProblems(id: string, problemIds: string[]): Promise<void> {
    try {
      const set = await apiClient.addProblemsToSet(id, problemIds)
      this.view.setSet(set)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to add problems")
    }
  }

  async addByFilter(id: string, filter: BlindTestSetFilter): Promise<void> {
    try {
      const set = await apiClient.addProblemsToSetByFilter(id, filter)
      this.view.setSet(set)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to add problems")
    }
  }

  async removeProblem(id: string, problemId: string): Promise<void> {
    try {
      const set = await apiClient.removeProblemFromSet(id, problemId)
      this.view.setSet(set)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to remove problem")
    }
  }
}
