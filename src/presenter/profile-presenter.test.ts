import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "@/lib/api-client"
import { ProfilePresenter, type ProfileData, type ProfileView } from "@/presenter/profile-presenter"
import { recordedField } from "@/presenter/test-support"
import type {
  DailyActivityOverview,
  MockInterviewResult,
  OASessionHistoryEntry,
  ProfileStatsOverview,
  SolvedProblemEntry,
  StudyPatternWithReadiness,
  StudyPlanOverview,
  StudyPlanSummary,
} from "@/types"

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    getProfileStats: vi.fn(),
    getDailyActivity: vi.fn(),
    getSolvedProblems: vi.fn(),
    getOAHistory: vi.fn(),
    listStudyPlans: vi.fn(),
    getStudyPlanOverview: vi.fn(),
    listMockInterviewResults: vi.fn(),
  },
}))

function makeView() {
  const loading = recordedField<boolean>()
  const data = recordedField<ProfileData>()
  const errors = recordedField<string | null>()
  const view: ProfileView = {
    setLoading: (v) => loading.push(v),
    setData: (v) => data.push(v),
    setError: (v) => errors.push(v),
  }
  return { view, loading, data, errors }
}

const stats = { problemsCompleted: 5 } as ProfileStatsOverview
const dailyActivity = { days: [] } as unknown as DailyActivityOverview
const plan = { id: "plan-1", name: "My Plan" } as StudyPlanSummary
const patterns = [{ id: "two-pointers" }] as unknown as StudyPatternWithReadiness[]
const mockInterviewResults = [{ id: "mi-1" }] as unknown as MockInterviewResult[]
const solvedProblems = [{ problemId: "p-1" }] as unknown as SolvedProblemEntry[]
const oaHistory = [{ sessionId: "oa-1" }] as unknown as OASessionHistoryEntry[]

describe("ProfilePresenter", () => {
  beforeEach(() => {
    vi.mocked(apiClient.getProfileStats).mockReset()
    vi.mocked(apiClient.getDailyActivity).mockReset()
    vi.mocked(apiClient.getSolvedProblems).mockReset()
    vi.mocked(apiClient.getOAHistory).mockReset()
    vi.mocked(apiClient.listStudyPlans).mockReset()
    vi.mocked(apiClient.getStudyPlanOverview).mockReset()
    vi.mocked(apiClient.listMockInterviewResults).mockReset()
  })

  it("loads stats, daily activity, and the most recent plan's patterns/mock results", async () => {
    vi.mocked(apiClient.getProfileStats).mockResolvedValue(stats)
    vi.mocked(apiClient.getDailyActivity).mockResolvedValue(dailyActivity)
    vi.mocked(apiClient.getSolvedProblems).mockResolvedValue(solvedProblems)
    vi.mocked(apiClient.getOAHistory).mockResolvedValue(oaHistory)
    vi.mocked(apiClient.listStudyPlans).mockResolvedValue([plan])
    vi.mocked(apiClient.getStudyPlanOverview).mockResolvedValue({ patterns } as unknown as StudyPlanOverview)
    vi.mocked(apiClient.listMockInterviewResults).mockResolvedValue(mockInterviewResults)
    const { view, data, loading, errors } = makeView()

    await new ProfilePresenter(view).load()

    expect(apiClient.getDailyActivity).toHaveBeenCalledWith(14)
    expect(apiClient.getStudyPlanOverview).toHaveBeenCalledWith("plan-1")
    expect(apiClient.listMockInterviewResults).toHaveBeenCalledWith("plan-1")
    expect(data.current).toEqual({
      stats,
      dailyActivity,
      patterns,
      mockInterviewResults,
      solvedProblems,
      oaHistory,
    })
    expect(loading.calls).toEqual([true, false])
    expect(errors.calls).toEqual([null])
  })

  it("returns empty patterns/results, not an error, when there is no study plan", async () => {
    vi.mocked(apiClient.getProfileStats).mockResolvedValue(stats)
    vi.mocked(apiClient.getDailyActivity).mockResolvedValue(dailyActivity)
    vi.mocked(apiClient.getSolvedProblems).mockResolvedValue(solvedProblems)
    vi.mocked(apiClient.getOAHistory).mockResolvedValue(oaHistory)
    vi.mocked(apiClient.listStudyPlans).mockResolvedValue([])
    const { view, data, errors } = makeView()

    await new ProfilePresenter(view).load()

    expect(apiClient.getStudyPlanOverview).not.toHaveBeenCalled()
    expect(data.current).toEqual({
      stats,
      dailyActivity,
      patterns: [],
      mockInterviewResults: [],
      solvedProblems,
      oaHistory,
    })
    expect(errors.calls).toEqual([null])
  })

  it("defaults solved problems and OA history to an empty array when logged out", async () => {
    vi.mocked(apiClient.getProfileStats).mockResolvedValue(stats)
    vi.mocked(apiClient.getDailyActivity).mockResolvedValue(dailyActivity)
    vi.mocked(apiClient.getSolvedProblems).mockResolvedValue(null)
    vi.mocked(apiClient.getOAHistory).mockResolvedValue(null)
    vi.mocked(apiClient.listStudyPlans).mockResolvedValue([])
    const { view, data } = makeView()

    await new ProfilePresenter(view).load()

    expect(data.current?.solvedProblems).toEqual([])
    expect(data.current?.oaHistory).toEqual([])
  })

  it("sets an error message when a request fails", async () => {
    vi.mocked(apiClient.getProfileStats).mockRejectedValue(new Error("network down"))
    vi.mocked(apiClient.getDailyActivity).mockResolvedValue(dailyActivity)
    vi.mocked(apiClient.getSolvedProblems).mockResolvedValue(solvedProblems)
    vi.mocked(apiClient.getOAHistory).mockResolvedValue(oaHistory)
    vi.mocked(apiClient.listStudyPlans).mockResolvedValue([])
    const { view, errors } = makeView()

    await new ProfilePresenter(view).load()

    expect(errors.calls).toEqual([null, "network down"])
  })
})
