import { apiClient } from "@/lib/api-client"
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
      this.view.setLessons(lessons)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to load lessons")
    } finally {
      this.view.setLoading(false)
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
