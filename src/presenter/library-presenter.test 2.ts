import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "@/lib/api-client"
import { LibraryPresenter, type LibraryView } from "@/presenter/library-presenter"
import { recordedField } from "@/presenter/test-support"
import type { ProblemSummary } from "@/types"

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    listProblems: vi.fn(),
    setFavorite: vi.fn(),
  },
}))

function makeView() {
  const loading = recordedField<boolean>()
  const problems = recordedField<ProblemSummary[]>()
  const errors = recordedField<string | null>()
  const view: LibraryView = {
    setLoading: (v) => loading.push(v),
    setProblems: (v) => problems.push(v),
    setError: (v) => errors.push(v),
    updateProblems: (update) => problems.push(update(problems.current ?? [])),
  }
  return { view, loading, problems, errors }
}

function problem(overrides: Partial<ProblemSummary> = {}): ProblemSummary {
  return {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "easy",
    pattern: "arrays-two-pointers",
    favorited: false,
    progressStatus: "not_started",
    ...overrides,
  } as ProblemSummary
}

describe("LibraryPresenter", () => {
  beforeEach(() => {
    vi.mocked(apiClient.listProblems).mockReset()
    vi.mocked(apiClient.setFavorite).mockReset()
  })

  it("loads problems and reports loading state around the call", async () => {
    const problems = [problem()]
    vi.mocked(apiClient.listProblems).mockResolvedValue(problems)
    const { view, loading, problems: seenProblems, errors } = makeView()

    await new LibraryPresenter(view).loadProblems({ difficulty: "easy" })

    expect(apiClient.listProblems).toHaveBeenCalledWith({ difficulty: "easy" })
    expect(seenProblems.current).toEqual(problems)
    expect(loading.calls).toEqual([true, false])
    expect(errors.calls).toEqual([null])
  })

  it("sets an error message when loading fails", async () => {
    vi.mocked(apiClient.listProblems).mockRejectedValue(new Error("network down"))
    const { view, loading, errors } = makeView()

    await new LibraryPresenter(view).loadProblems()

    expect(errors.calls).toEqual([null, "network down"])
    expect(loading.calls).toEqual([true, false])
  })

  it("optimistically toggles favorite and keeps it on success", async () => {
    vi.mocked(apiClient.setFavorite).mockResolvedValue(undefined)
    const { view, problems } = makeView()
    problems.push([problem({ id: "two-sum", favorited: false })])

    await new LibraryPresenter(view).toggleFavorite("two-sum", true)

    expect(apiClient.setFavorite).toHaveBeenCalledWith("two-sum", true)
    expect(problems.current?.[0].favorited).toBe(true)
  })

  it("reverts the optimistic favorite update when the request fails", async () => {
    vi.mocked(apiClient.setFavorite).mockRejectedValue(new Error("failed"))
    const { view, problems, errors } = makeView()
    problems.push([problem({ id: "two-sum", favorited: false })])

    await new LibraryPresenter(view).toggleFavorite("two-sum", true)

    expect(problems.current?.[0].favorited).toBe(false)
    expect(errors.calls).toEqual(["failed"])
  })
})
