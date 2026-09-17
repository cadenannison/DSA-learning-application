import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "@/lib/api-client"
import { DashboardPresenter, type DashboardData, type DashboardView } from "@/presenter/dashboard-presenter"
import { recordedField } from "@/presenter/test-support"
import type { ProblemSummary, ProfileStatsOverview, StudyPlanOverview, StudyPlanSummary } from "@/types"

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    listStudyPlans: vi.fn(),
    getProfileStats: vi.fn(),
    listProblems: vi.fn(),
    getStudyPlanOverview: vi.fn(),
  },
}))

function makeView() {
  const loading = recordedField<boolean>()
  const data = recordedField<DashboardData | null>()
  const errors = recordedField<string | null>()
  const view: DashboardView = {
    setLoading: (v) => loading.push(v),
    setData: (v) => data.push(v),
    setError: (v) => errors.push(v),
  }
  return { view, loading, data, errors }
}

const plan = { id: "plan-1", name: "My Plan", createdAt: "2026-01-01T00:00:00.000Z" } as StudyPlanSummary
const overview = { patterns: [] } as unknown as StudyPlanOverview
const stats = { problemsCompleted: 3 } as ProfileStatsOverview

describe("DashboardPresenter", () => {
  beforeEach(() => {
    vi.mocked(apiClient.listStudyPlans).mockReset()
    vi.mocked(apiClient.getProfileStats).mockReset()
    vi.mocked(apiClient.listProblems).mockReset()
    vi.mocked(apiClient.getStudyPlanOverview).mockReset()
  })

  it("loads the most recent plan's overview alongside stats and library size", async () => {
    vi.mocked(apiClient.listStudyPlans).mockResolvedValue([plan])
    vi.mocked(apiClient.getProfileStats).mockResolvedValue(stats)
    vi.mocked(apiClient.listProblems).mockResolvedValue([{ id: "two-sum" }, { id: "valid-anagram" }] as ProblemSummary[])
    vi.mocked(apiClient.getStudyPlanOverview).mockResolvedValue(overview)
    const { view, data, loading, errors } = makeView()

    await new DashboardPresenter(view).load()

    expect(apiClient.getStudyPlanOverview).toHaveBeenCalledWith("plan-1")
    expect(data.current).toEqual({ plan, overview, stats, totalLibraryProblems: 2 })
    expect(loading.calls).toEqual([true, false])
    expect(errors.calls).toEqual([null])
  })

  it("sets null data, not an error, when the user has no study plan", async () => {
    vi.mocked(apiClient.listStudyPlans).mockResolvedValue([])
    vi.mocked(apiClient.getProfileStats).mockResolvedValue(stats)
    vi.mocked(apiClient.listProblems).mockResolvedValue([])
    const { view, data, errors } = makeView()

    await new DashboardPresenter(view).load()

    expect(apiClient.getStudyPlanOverview).not.toHaveBeenCalled()
    expect(data.current).toBeNull()
    expect(errors.calls).toEqual([null])
  })

  it("sets an error message when a request fails", async () => {
    vi.mocked(apiClient.listStudyPlans).mockRejectedValue(new Error("network down"))
    const { view, errors } = makeView()

    await new DashboardPresenter(view).load()

    expect(errors.calls).toEqual([null, "network down"])
  })
})
