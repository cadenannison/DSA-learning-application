import { apiClient, type ProblemFilter } from "@/lib/api-client"
import type { ProblemSummary } from "@/types"

export interface LibraryView {
  setLoading(loading: boolean): void
  setProblems(problems: ProblemSummary[]): void
  setError(message: string | null): void
  updateProblems(update: (problems: ProblemSummary[]) => ProblemSummary[]): void
}

export class LibraryPresenter {
  constructor(private readonly view: LibraryView) {}

  async loadProblems(filter?: ProblemFilter): Promise<void> {
    this.view.setLoading(true)
    this.view.setError(null)

    try {
      const problems = await apiClient.listProblems(filter)
      this.view.setProblems(problems)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to load problems")
    } finally {
      this.view.setLoading(false)
    }
  }

  async toggleFavorite(problemId: string, favorited: boolean): Promise<void> {
    this.view.updateProblems((problems) =>
      problems.map((problem) => (problem.id === problemId ? { ...problem, favorited } : problem))
    )

    try {
      await apiClient.setFavorite(problemId, favorited)
    } catch (error) {
      this.view.updateProblems((problems) =>
        problems.map((problem) =>
          problem.id === problemId ? { ...problem, favorited: !favorited } : problem
        )
      )
      this.view.setError(error instanceof Error ? error.message : "Failed to update favorite")
    }
  }
}
