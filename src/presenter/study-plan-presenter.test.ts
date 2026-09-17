import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "@/lib/api-client"
import { StudyPlanPresenter, type StudyPlanView } from "@/presenter/study-plan-presenter"
import { recordedField } from "@/presenter/test-support"
import type {
  ExecutionResult,
  MockInterviewResult,
  ReadinessChecklistOverview,
  RoadmapOverview,
  Skill,
  StudyPattern,
  StudyPlanOverview,
  StudyPlanSettings,
  StudySession,
  SubmitStudyProblemResponse,
} from "@/types"

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    getStudyPlanOverview: vi.fn(),
    updateStudyPattern: vi.fn(),
    updateStudyProblem: vi.fn(),
    updateStudyPlanSettings: vi.fn(),
    logStudySession: vi.fn(),
    logMockInterviewResult: vi.fn(),
    execute: vi.fn(),
    submitStudyProblem: vi.fn(),
    logProblemSession: vi.fn(),
    getRoadmap: vi.fn(),
    getSkills: vi.fn(),
    updateSkill: vi.fn(),
    getReadinessChecklist: vi.fn(),
    updateReadinessChecklistItem: vi.fn(),
  },
}))

function makeView() {
  const loading = recordedField<boolean>()
  const overview = recordedField<StudyPlanOverview>()
  const errors = recordedField<string | null>()
  const view: StudyPlanView = {
    setLoading: (v) => loading.push(v),
    setOverview: (v) => overview.push(v),
    setError: (v) => errors.push(v),
  }
  return { view, loading, overview, errors }
}

const planId = "plan-1"
const overview = { patterns: [] } as unknown as StudyPlanOverview
const studyPattern = { id: "graphs" } as unknown as StudyPattern

function resetMocks() {
  for (const fn of Object.values(apiClient)) {
    if (typeof fn === "function" && "mockReset" in fn) (fn as unknown as { mockReset(): void }).mockReset()
  }
}

describe("StudyPlanPresenter", () => {
  beforeEach(resetMocks)

  it("loads the overview for the given plan", async () => {
    vi.mocked(apiClient.getStudyPlanOverview).mockResolvedValue(overview)
    const { view, overview: seen, loading, errors } = makeView()

    await new StudyPlanPresenter(planId, view).load()

    expect(apiClient.getStudyPlanOverview).toHaveBeenCalledWith(planId)
    expect(seen.current).toEqual(overview)
    expect(loading.calls).toEqual([true, false])
    expect(errors.calls).toEqual([null])
  })

  it("sets an error when loading the overview fails", async () => {
    vi.mocked(apiClient.getStudyPlanOverview).mockRejectedValue(new Error("not found"))
    const { view, errors } = makeView()

    await new StudyPlanPresenter(planId, view).load()

    expect(errors.calls).toEqual([null, "not found"])
  })

  it("updates a pattern's stage then reloads the overview", async () => {
    vi.mocked(apiClient.updateStudyPattern).mockResolvedValue(studyPattern)
    vi.mocked(apiClient.getStudyPlanOverview).mockResolvedValue(overview)
    const { view, overview: seen } = makeView()

    await new StudyPlanPresenter(planId, view).setPatternStage("graphs", "concept")

    expect(apiClient.updateStudyPattern).toHaveBeenCalledWith(planId, "graphs", { stage: "concept" })
    expect(apiClient.getStudyPlanOverview).toHaveBeenCalledWith(planId)
    expect(seen.current).toEqual(overview)
  })

  it("updates a pattern's confidence then reloads", async () => {
    vi.mocked(apiClient.updateStudyPattern).mockResolvedValue(studyPattern)
    vi.mocked(apiClient.getStudyPlanOverview).mockResolvedValue(overview)
    const { view } = makeView()

    await new StudyPlanPresenter(planId, view).setPatternConfidence("graphs", 4)

    expect(apiClient.updateStudyPattern).toHaveBeenCalledWith(planId, "graphs", { confidence: 4 })
  })

  it("updates a pattern's notes then reloads", async () => {
    vi.mocked(apiClient.updateStudyPattern).mockResolvedValue(studyPattern)
    vi.mocked(apiClient.getStudyPlanOverview).mockResolvedValue(overview)
    const { view } = makeView()

    await new StudyPlanPresenter(planId, view).setPatternNotes("graphs", "review BFS again")

    expect(apiClient.updateStudyPattern).toHaveBeenCalledWith(planId, "graphs", {
      notes: "review BFS again",
    })
  })

  it("marks a problem completed then reloads", async () => {
    vi.mocked(apiClient.updateStudyProblem).mockResolvedValue(studyPattern)
    vi.mocked(apiClient.getStudyPlanOverview).mockResolvedValue(overview)
    const { view } = makeView()

    await new StudyPlanPresenter(planId, view).setProblemCompleted("sp-1", true)

    expect(apiClient.updateStudyProblem).toHaveBeenCalledWith(planId, "sp-1", { completed: true })
  })

  it("updates settings then reloads", async () => {
    vi.mocked(apiClient.updateStudyPlanSettings).mockResolvedValue({} as StudyPlanSettings)
    vi.mocked(apiClient.getStudyPlanOverview).mockResolvedValue(overview)
    const { view } = makeView()

    await new StudyPlanPresenter(planId, view).setSettings({ dailyTimeBudgetMinutes: 45 })

    expect(apiClient.updateStudyPlanSettings).toHaveBeenCalledWith(planId, {
      dailyTimeBudgetMinutes: 45,
    })
  })

  it("logs a study session, reloads, and returns the session", async () => {
    const session = { id: "session-1" } as unknown as StudySession
    vi.mocked(apiClient.logStudySession).mockResolvedValue(session)
    vi.mocked(apiClient.getStudyPlanOverview).mockResolvedValue(overview)
    const { view } = makeView()
    const input = { date: "2026-01-01", minutesSpent: 30, studyPatternIds: ["graphs"] }

    const result = await new StudyPlanPresenter(planId, view).logSession(input)

    expect(apiClient.logStudySession).toHaveBeenCalledWith(planId, input)
    expect(apiClient.getStudyPlanOverview).toHaveBeenCalledWith(planId)
    expect(result).toEqual(session)
  })

  it("logs a mock interview result, reloads, and returns the result", async () => {
    const mockResult = { id: "mi-1" } as unknown as MockInterviewResult
    vi.mocked(apiClient.logMockInterviewResult).mockResolvedValue(mockResult)
    vi.mocked(apiClient.getStudyPlanOverview).mockResolvedValue(overview)
    const { view } = makeView()
    const input = {
      date: "2026-01-01",
      problemName: "Course Schedule",
      timeTakenMinutes: 25,
      solvedCleanly: true,
    }

    const result = await new StudyPlanPresenter(planId, view).logMockInterviewResult(input)

    expect(apiClient.logMockInterviewResult).toHaveBeenCalledWith(planId, input)
    expect(result).toEqual(mockResult)
  })

  it("runs an embedded problem without recording anything or reloading", async () => {
    const execResult = { allPassed: true, results: [], runtimeMs: 5 } as ExecutionResult
    vi.mocked(apiClient.execute).mockResolvedValue(execResult)
    const { view } = makeView()
    const submission = { code: "code", functionName: "courseSchedule", language: "python" as const }

    const result = await new StudyPlanPresenter(planId, view).runEmbeddedProblem(
      "course-schedule",
      submission,
      [0]
    )

    expect(apiClient.execute).toHaveBeenCalledWith("course-schedule", submission, "practice", [0])
    expect(apiClient.getStudyPlanOverview).not.toHaveBeenCalled()
    expect(result).toEqual(execResult)
  })

  it("submits an embedded problem, reloads, and returns the execution result", async () => {
    const execResult = { allPassed: true, results: [], runtimeMs: 5 } as ExecutionResult
    const response = { execution: execResult } as unknown as SubmitStudyProblemResponse
    vi.mocked(apiClient.submitStudyProblem).mockResolvedValue(response)
    vi.mocked(apiClient.getStudyPlanOverview).mockResolvedValue(overview)
    const { view } = makeView()
    const submission = { code: "code", functionName: "courseSchedule", language: "python" as const }

    const result = await new StudyPlanPresenter(planId, view).submitEmbeddedProblem(
      "sp-1",
      submission,
      12
    )

    expect(apiClient.submitStudyProblem).toHaveBeenCalledWith(planId, "sp-1", submission, 12)
    expect(apiClient.getStudyPlanOverview).toHaveBeenCalledWith(planId)
    expect(result).toEqual(execResult)
  })

  it("logs time on collapse without reloading", async () => {
    vi.mocked(apiClient.logProblemSession).mockResolvedValue(undefined)
    const { view } = makeView()

    await new StudyPlanPresenter(planId, view).logProblemTimeOnCollapse("sp-1", 5)

    expect(apiClient.logProblemSession).toHaveBeenCalledWith(planId, "sp-1", 5)
    expect(apiClient.getStudyPlanOverview).not.toHaveBeenCalled()
  })

  it("loads the roadmap without reloading the overview", async () => {
    const roadmap = { items: [] } as unknown as RoadmapOverview
    vi.mocked(apiClient.getRoadmap).mockResolvedValue(roadmap)
    const { view } = makeView()

    const result = await new StudyPlanPresenter(planId, view).loadRoadmap()

    expect(apiClient.getRoadmap).toHaveBeenCalledWith(planId)
    expect(apiClient.getStudyPlanOverview).not.toHaveBeenCalled()
    expect(result).toEqual(roadmap)
  })

  it("loads skills without reloading the overview", async () => {
    const skills = [{ id: "skill-1" }] as unknown as Skill[]
    vi.mocked(apiClient.getSkills).mockResolvedValue(skills)
    const { view } = makeView()

    const result = await new StudyPlanPresenter(planId, view).loadSkills()

    expect(apiClient.getSkills).toHaveBeenCalledWith(planId)
    expect(result).toEqual(skills)
  })

  it("sets a skill done without reloading the overview", async () => {
    const skill = { id: "skill-1", done: true } as unknown as Skill
    vi.mocked(apiClient.updateSkill).mockResolvedValue(skill)
    const { view } = makeView()

    const result = await new StudyPlanPresenter(planId, view).setSkillDone("skill-1", true)

    expect(apiClient.updateSkill).toHaveBeenCalledWith(planId, "skill-1", true)
    expect(result).toEqual(skill)
  })

  it("loads the readiness checklist without reloading the overview", async () => {
    const checklist = { items: [] } as unknown as ReadinessChecklistOverview
    vi.mocked(apiClient.getReadinessChecklist).mockResolvedValue(checklist)
    const { view } = makeView()

    const result = await new StudyPlanPresenter(planId, view).loadReadinessChecklist()

    expect(apiClient.getReadinessChecklist).toHaveBeenCalledWith(planId)
    expect(result).toEqual(checklist)
  })

  it("updates a readiness checklist item without reloading the overview", async () => {
    const checklist = { items: [] } as unknown as ReadinessChecklistOverview
    vi.mocked(apiClient.updateReadinessChecklistItem).mockResolvedValue(checklist)
    const { view } = makeView()

    const result = await new StudyPlanPresenter(planId, view).setReadinessChecklistItem("item-1", {
      checked: true,
    })

    expect(apiClient.updateReadinessChecklistItem).toHaveBeenCalledWith(planId, "item-1", {
      checked: true,
    })
    expect(result).toEqual(checklist)
  })
})
