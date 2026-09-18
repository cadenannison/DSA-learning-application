import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "@/lib/api-client"
import { StudyPlanListPresenter, type StudyPlanListView } from "@/presenter/study-plan-list-presenter"
import { recordedField } from "@/presenter/test-support"
import type { StudyPlan, StudyPlanSummary } from "@/types"

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    listStudyPlans: vi.fn(),
    createStudyPlan: vi.fn(),
    deleteStudyPlan: vi.fn(),
    setActiveStudyPlan: vi.fn(),
  },
}))

function makeView() {
  const loading = recordedField<boolean>()
  const plans = recordedField<StudyPlanSummary[]>()
  const errors = recordedField<string | null>()
  const view: StudyPlanListView = {
    setLoading: (v) => loading.push(v),
    setPlans: (v) => plans.push(v),
    setError: (v) => errors.push(v),
  }
  return { view, loading, plans, errors }
}

const planSummary = { id: "plan-1", name: "My Plan" } as StudyPlanSummary
const fullPlan = { id: "plan-1", name: "My Plan" } as unknown as StudyPlan

describe("StudyPlanListPresenter", () => {
  beforeEach(() => {
    vi.mocked(apiClient.listStudyPlans).mockReset()
    vi.mocked(apiClient.createStudyPlan).mockReset()
    vi.mocked(apiClient.deleteStudyPlan).mockReset()
    vi.mocked(apiClient.setActiveStudyPlan).mockReset()
  })

  it("loads plans and toggles loading around the call", async () => {
    vi.mocked(apiClient.listStudyPlans).mockResolvedValue([planSummary])
    const { view, plans, loading, errors } = makeView()

    await new StudyPlanListPresenter(view).loadPlans()

    expect(plans.current).toEqual([planSummary])
    expect(loading.calls).toEqual([true, false])
    expect(errors.calls).toEqual([null])
  })

  it("sets an error when loading plans fails", async () => {
    vi.mocked(apiClient.listStudyPlans).mockRejectedValue(new Error("network down"))
    const { view, errors } = makeView()

    await new StudyPlanListPresenter(view).loadPlans()

    expect(errors.calls).toEqual([null, "network down"])
  })

  it("creates a plan and returns it", async () => {
    vi.mocked(apiClient.createStudyPlan).mockResolvedValue(fullPlan)
    const { view } = makeView()

    const result = await new StudyPlanListPresenter(view).createPlan("My Plan")

    expect(apiClient.createStudyPlan).toHaveBeenCalledWith("My Plan")
    expect(result).toEqual(fullPlan)
  })

  it("returns null and sets an error when plan creation fails", async () => {
    vi.mocked(apiClient.createStudyPlan).mockRejectedValue(new Error("name taken"))
    const { view, errors } = makeView()

    const result = await new StudyPlanListPresenter(view).createPlan("My Plan")

    expect(result).toBeNull()
    expect(errors.calls).toEqual(["name taken"])
  })

  it("deletes a plan then reloads the list", async () => {
    vi.mocked(apiClient.deleteStudyPlan).mockResolvedValue(undefined)
    vi.mocked(apiClient.listStudyPlans).mockResolvedValue([])
    const { view, plans } = makeView()

    await new StudyPlanListPresenter(view).deletePlan("plan-1")

    expect(apiClient.deleteStudyPlan).toHaveBeenCalledWith("plan-1")
    expect(apiClient.listStudyPlans).toHaveBeenCalled()
    expect(plans.current).toEqual([])
  })

  it("sets an error when deleting a plan fails, without reloading", async () => {
    vi.mocked(apiClient.deleteStudyPlan).mockRejectedValue(new Error("not found"))
    const { view, errors } = makeView()

    await new StudyPlanListPresenter(view).deletePlan("plan-1")

    expect(apiClient.listStudyPlans).not.toHaveBeenCalled()
    expect(errors.calls).toEqual(["not found"])
  })

  it("sets the active plan then reloads the list", async () => {
    vi.mocked(apiClient.setActiveStudyPlan).mockResolvedValue(undefined)
    vi.mocked(apiClient.listStudyPlans).mockResolvedValue([planSummary])
    const { view, plans } = makeView()

    await new StudyPlanListPresenter(view).setActivePlan("plan-1")

    expect(apiClient.setActiveStudyPlan).toHaveBeenCalledWith("plan-1")
    expect(plans.current).toEqual([planSummary])
  })
})
