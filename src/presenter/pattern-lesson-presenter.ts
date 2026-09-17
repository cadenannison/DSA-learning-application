import { apiClient } from "@/lib/api-client"
import { lessonPriorityRanks } from "@/lib/study-plan-ordering"
import type { DsaPattern, PatternLesson, PatternLessonSummary, ProblemSummary } from "@/types"

export interface PatternListView {
  setLoading(loading: boolean): void
  setLessons(lessons: PatternLessonSummary[]): void
  setError(message: string | null): void
}

export class PatternListPresenter {
  constructor(private readonly view: PatternListView) {}

  async loadLessons(): Promise<void> {
    this.view.setLoading(true)
    this.view.setError(null)

    try {
      const lessons = await apiClient.listLessons()
      const priorityRanks = await this.loadPriorityRanks()

      const sorted = [...lessons].sort((a, b) => {
        const rankA = priorityRanks[a.pattern] ?? Number.POSITIVE_INFINITY
        const rankB = priorityRanks[b.pattern] ?? Number.POSITIVE_INFINITY
        if (rankA !== rankB) return rankA - rankB
        return a.title.localeCompare(b.title)
      })

      this.view.setLessons(sorted)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to load lessons")
    } finally {
      this.view.setLoading(false)
    }
  }

  /** Bubbles lessons for patterns the user's most recently created study plan flags as
   * high-priority to the top of the list. Falls back to no reordering (empty map) if the
   * user has no study plans yet or the overview fails to load. */
  private async loadPriorityRanks(): Promise<Partial<Record<DsaPattern, number>>> {
    try {
      const plans = await apiClient.listStudyPlans()
      if (plans.length === 0) return {}

      const mostRecentPlan = [...plans].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]

      const overview = await apiClient.getStudyPlanOverview(mostRecentPlan.id)
      return lessonPriorityRanks(overview)
    } catch {
      return {}
    }
  }
}

export interface PatternLessonView {
  setLoading(loading: boolean): void
  setLesson(lesson: PatternLesson): void
  setRelatedProblems(problems: ProblemSummary[]): void
  setError(message: string | null): void
}

export class PatternLessonPresenter {
  constructor(private readonly view: PatternLessonView) {}

  async loadLesson(pattern: DsaPattern): Promise<void> {
    this.view.setLoading(true)
    this.view.setError(null)

    try {
      const lesson = await apiClient.getLesson(pattern)
      this.view.setLesson(lesson)

      const relatedIds = new Set(lesson.relatedProblemIds)
      const patternProblems = await apiClient.listProblems({ pattern })
      this.view.setRelatedProblems(patternProblems.filter((problem) => relatedIds.has(problem.id)))
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to load lesson")
    } finally {
      this.view.setLoading(false)
    }
  }
}
