import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "@/lib/api-client"
import {
  BlindTestSetDetailPresenter,
  type BlindTestSetDetailView,
  BlindTestSetListPresenter,
  type BlindTestSetListView,
} from "@/presenter/blind-test-set-presenter"
import { recordedField } from "@/presenter/test-support"
import type { BlindTestSet, BlindTestSetSummary } from "@/types"

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    listBlindTestSets: vi.fn(),
    createBlindTestSet: vi.fn(),
    deleteBlindTestSet: vi.fn(),
    getBlindTestSet: vi.fn(),
    addProblemsToSet: vi.fn(),
    addProblemsToSetByFilter: vi.fn(),
    removeProblemFromSet: vi.fn(),
  },
}))

const setSummary = { id: "set-1", name: "My Set", problemCount: 2 } as BlindTestSetSummary
const fullSet = { id: "set-1", name: "My Set", problemIds: ["two-sum"] } as unknown as BlindTestSet

function makeListView() {
  const loading = recordedField<boolean>()
  const sets = recordedField<BlindTestSetSummary[]>()
  const errors = recordedField<string | null>()
  const view: BlindTestSetListView = {
    setLoading: (v) => loading.push(v),
    setSets: (v) => sets.push(v),
    setError: (v) => errors.push(v),
  }
  return { view, loading, sets, errors }
}

function makeDetailView() {
  const loading = recordedField<boolean>()
  const set = recordedField<BlindTestSet | null>()
  const errors = recordedField<string | null>()
  const view: BlindTestSetDetailView = {
    setLoading: (v) => loading.push(v),
    setSet: (v) => set.push(v),
    setError: (v) => errors.push(v),
  }
  return { view, loading, set, errors }
}

describe("BlindTestSetListPresenter", () => {
  beforeEach(() => {
    vi.mocked(apiClient.listBlindTestSets).mockReset()
    vi.mocked(apiClient.createBlindTestSet).mockReset()
    vi.mocked(apiClient.deleteBlindTestSet).mockReset()
  })

  it("loads sets and toggles loading around the call", async () => {
    vi.mocked(apiClient.listBlindTestSets).mockResolvedValue([setSummary])
    const { view, sets, loading, errors } = makeListView()

    await new BlindTestSetListPresenter(view).loadSets()

    expect(sets.current).toEqual([setSummary])
    expect(loading.calls).toEqual([true, false])
    expect(errors.calls).toEqual([null])
  })

  it("sets an error when loading sets fails", async () => {
    vi.mocked(apiClient.listBlindTestSets).mockRejectedValue(new Error("network down"))
    const { view, errors } = makeListView()

    await new BlindTestSetListPresenter(view).loadSets()

    expect(errors.calls).toEqual([null, "network down"])
  })

  it("creates a set and returns it", async () => {
    vi.mocked(apiClient.createBlindTestSet).mockResolvedValue(fullSet)
    const { view } = makeListView()

    const result = await new BlindTestSetListPresenter(view).createSet({ name: "My Set" })

    expect(apiClient.createBlindTestSet).toHaveBeenCalledWith({ name: "My Set" })
    expect(result).toEqual(fullSet)
  })

  it("returns null and sets an error when set creation fails", async () => {
    vi.mocked(apiClient.createBlindTestSet).mockRejectedValue(new Error("name taken"))
    const { view, errors } = makeListView()

    const result = await new BlindTestSetListPresenter(view).createSet({ name: "My Set" })

    expect(result).toBeNull()
    expect(errors.calls).toEqual(["name taken"])
  })

  it("deletes a set then reloads the list", async () => {
    vi.mocked(apiClient.deleteBlindTestSet).mockResolvedValue(undefined)
    vi.mocked(apiClient.listBlindTestSets).mockResolvedValue([])
    const { view, sets } = makeListView()

    await new BlindTestSetListPresenter(view).deleteSet("set-1")

    expect(apiClient.deleteBlindTestSet).toHaveBeenCalledWith("set-1")
    expect(apiClient.listBlindTestSets).toHaveBeenCalled()
    expect(sets.current).toEqual([])
  })

  it("sets an error when deleting a set fails, without reloading", async () => {
    vi.mocked(apiClient.deleteBlindTestSet).mockRejectedValue(new Error("not found"))
    const { view, errors } = makeListView()

    await new BlindTestSetListPresenter(view).deleteSet("set-1")

    expect(apiClient.listBlindTestSets).not.toHaveBeenCalled()
    expect(errors.calls).toEqual(["not found"])
  })
})

describe("BlindTestSetDetailPresenter", () => {
  beforeEach(() => {
    vi.mocked(apiClient.getBlindTestSet).mockReset()
    vi.mocked(apiClient.addProblemsToSet).mockReset()
    vi.mocked(apiClient.addProblemsToSetByFilter).mockReset()
    vi.mocked(apiClient.removeProblemFromSet).mockReset()
  })

  it("loads a set and toggles loading around the call", async () => {
    vi.mocked(apiClient.getBlindTestSet).mockResolvedValue(fullSet)
    const { view, set, loading, errors } = makeDetailView()

    await new BlindTestSetDetailPresenter(view).loadSet("set-1")

    expect(apiClient.getBlindTestSet).toHaveBeenCalledWith("set-1")
    expect(set.current).toEqual(fullSet)
    expect(loading.calls).toEqual([true, false])
    expect(errors.calls).toEqual([null])
  })

  it("sets an error when loading a set fails", async () => {
    vi.mocked(apiClient.getBlindTestSet).mockRejectedValue(new Error("not found"))
    const { view, errors } = makeDetailView()

    await new BlindTestSetDetailPresenter(view).loadSet("set-1")

    expect(errors.calls).toEqual([null, "not found"])
  })

  it("adds problems by id and updates the set", async () => {
    vi.mocked(apiClient.addProblemsToSet).mockResolvedValue(fullSet)
    const { view, set } = makeDetailView()

    await new BlindTestSetDetailPresenter(view).addProblems("set-1", ["two-sum"])

    expect(apiClient.addProblemsToSet).toHaveBeenCalledWith("set-1", ["two-sum"])
    expect(set.current).toEqual(fullSet)
  })

  it("sets an error when adding problems by id fails", async () => {
    vi.mocked(apiClient.addProblemsToSet).mockRejectedValue(new Error("failed"))
    const { view, errors } = makeDetailView()

    await new BlindTestSetDetailPresenter(view).addProblems("set-1", ["two-sum"])

    expect(errors.calls).toEqual(["failed"])
  })

  it("adds problems by filter and updates the set", async () => {
    vi.mocked(apiClient.addProblemsToSetByFilter).mockResolvedValue(fullSet)
    const { view, set } = makeDetailView()

    await new BlindTestSetDetailPresenter(view).addByFilter("set-1", { difficulties: ["easy"] })

    expect(apiClient.addProblemsToSetByFilter).toHaveBeenCalledWith("set-1", { difficulties: ["easy"] })
    expect(set.current).toEqual(fullSet)
  })

  it("removes a problem and updates the set", async () => {
    vi.mocked(apiClient.removeProblemFromSet).mockResolvedValue(fullSet)
    const { view, set } = makeDetailView()

    await new BlindTestSetDetailPresenter(view).removeProblem("set-1", "two-sum")

    expect(apiClient.removeProblemFromSet).toHaveBeenCalledWith("set-1", "two-sum")
    expect(set.current).toEqual(fullSet)
  })

  it("sets an error when removing a problem fails", async () => {
    vi.mocked(apiClient.removeProblemFromSet).mockRejectedValue(new Error("failed"))
    const { view, errors } = makeDetailView()

    await new BlindTestSetDetailPresenter(view).removeProblem("set-1", "two-sum")

    expect(errors.calls).toEqual(["failed"])
  })
})
