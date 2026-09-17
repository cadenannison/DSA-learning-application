import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "@/lib/api-client"
import {
  PatternListPresenter,
  type PatternListView,
  PatternLessonPresenter,
  type PatternLessonView,
} from "@/presenter/pattern-lesson-presenter"
import { recordedField } from "@/presenter/test-support"
import type { PatternLesson, PatternLessonSummary, ProblemSummary, StudyPlanOverview, StudyPlanSummary } from "@/types"

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    listLessons: vi.fn(),
    listStudyPlans: vi.fn(),
    getStudyPlanOverview: vi.fn(),
    getLesson: vi.fn(),
    listProblems: vi.fn(),
  },
}))

function makeListView() {
  const loading = recordedField<boolean>()
  const lessons = recordedField<PatternLessonSummary[]>()
  const errors = recordedField<string | null>()
  const view: PatternListView = {
    setLoading: (v) => loading.push(v),
    setLessons: (v) => lessons.push(v),
    setError: (v) => errors.push(v),
  }
  return { view, loading, lessons, errors }
}

function makeLessonView() {
  const loading = recordedField<boolean>()
  const lesson = recordedField<PatternLesson>()
  const relatedProblems = recordedField<ProblemSummary[]>()
  const errors = recordedField<string | null>()
  const view: PatternLessonView = {
    setLoading: (v) => loading.push(v),
    setLesson: (v) => lesson.push(v),
    setRelatedProblems: (v) => relatedProblems.push(v),
    setError: (v) => errors.push(v),
  }
  return { view, loading, lesson, relatedProblems, errors }
}

function lessonSummary(pattern: string, title: string): PatternLessonSummary {
  return { pattern, title } as unknown as PatternLessonSummary
}

describe("PatternListPresenter", () => {
  beforeEach(() => {
    vi.mocked(apiClient.listLessons).mockReset()
    vi.mocked(apiClient.listStudyPlans).mockReset()
    vi.mocked(apiClient.getStudyPlanOverview).mockReset()
  })

  it("loads lessons sorted alphabetically when there is no study plan", async () => {
    vi.mocked(apiClient.listLessons).mockResolvedValue([
      lessonSummary("graphs", "Graphs"),
      lessonSummary("dynamic-programming", "Dynamic Programming"),
    ])
    vi.mocked(apiClient.listStudyPlans).mockResolvedValue([])
    const { view, lessons, loading, errors } = makeListView()

    await new PatternListPresenter(view).loadLessons()

    expect(lessons.current?.map((l) => l.pattern)).toEqual(["dynamic-programming", "graphs"])
    expect(loading.calls).toEqual([true, false])
    expect(errors.calls).toEqual([null])
  })

  it("bubbles lessons flagged high-priority by the most recent study plan to the top", async () => {
    vi.mocked(apiClient.listLessons).mockResolvedValue([
      lessonSummary("graphs", "Graphs"),
      lessonSummary("dynamic-programming", "Dynamic Programming"),
    ])
    vi.mocked(apiClient.listStudyPlans).mockResolvedValue([
      { id: "plan-1", createdAt: "2026-01-01T00:00:00.000Z" } as StudyPlanSummary,
    ])
    vi.mocked(apiClient.getStudyPlanOverview).mockResolvedValue({
      patterns: [
        { id: "graphs", priorityRank: 5 },
        { id: "dynamic-programming", priorityRank: 1 },
      ],
    } as unknown as StudyPlanOverview)
    const { view, lessons } = makeListView()

    await new PatternListPresenter(view).loadLessons()

    expect(apiClient.getStudyPlanOverview).toHaveBeenCalledWith("plan-1")
    expect(lessons.current?.map((l) => l.pattern)).toEqual(["dynamic-programming", "graphs"])
  })

  it("falls back to no reordering when the overview fails to load", async () => {
    vi.mocked(apiClient.listLessons).mockResolvedValue([lessonSummary("graphs", "Graphs")])
    vi.mocked(apiClient.listStudyPlans).mockRejectedValue(new Error("network down"))
    const { view, lessons, errors } = makeListView()

    await new PatternListPresenter(view).loadLessons()

    expect(lessons.current?.map((l) => l.pattern)).toEqual(["graphs"])
    expect(errors.calls).toEqual([null])
  })

  it("sets an error when loading lessons themselves fails", async () => {
    vi.mocked(apiClient.listLessons).mockRejectedValue(new Error("network down"))
    const { view, errors } = makeListView()

    await new PatternListPresenter(view).loadLessons()

    expect(errors.calls).toEqual([null, "network down"])
  })
})

describe("PatternLessonPresenter", () => {
  beforeEach(() => {
    vi.mocked(apiClient.getLesson).mockReset()
    vi.mocked(apiClient.listProblems).mockReset()
  })

  it("loads a lesson and filters related problems to relatedProblemIds", async () => {
    const lesson = { pattern: "graphs", relatedProblemIds: ["course-schedule"] } as unknown as PatternLesson
    vi.mocked(apiClient.getLesson).mockResolvedValue(lesson)
    vi.mocked(apiClient.listProblems).mockResolvedValue([
      { id: "course-schedule" },
      { id: "clone-graph" },
    ] as ProblemSummary[])
    const { view, lesson: seenLesson, relatedProblems } = makeLessonView()

    await new PatternLessonPresenter(view).loadLesson("graphs")

    expect(apiClient.listProblems).toHaveBeenCalledWith({ pattern: "graphs" })
    expect(seenLesson.current).toEqual(lesson)
    expect(relatedProblems.current?.map((p) => p.id)).toEqual(["course-schedule"])
  })

  it("sets an error when loading a lesson fails", async () => {
    vi.mocked(apiClient.getLesson).mockRejectedValue(new Error("not found"))
    const { view, errors } = makeLessonView()

    await new PatternLessonPresenter(view).loadLesson("graphs")

    expect(errors.calls).toEqual([null, "not found"])
  })
})
