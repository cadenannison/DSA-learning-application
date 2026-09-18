import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "@/lib/api-client"
import {
  BlindTestPresenter,
  type BlindTestView,
  PracticePresenter,
  type PracticeView,
} from "@/presenter/practice-presenter"
import { recordedField } from "@/presenter/test-support"
import type { AttemptRecord, ExecutionResult, Problem, StrippedProblem } from "@/types"

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    getProblem: vi.fn(),
    getBlindProblem: vi.fn(),
    getRandomProblemFromSet: vi.fn(),
    execute: vi.fn(),
    recordAttempt: vi.fn(),
  },
}))

const problem = { id: "two-sum", functionName: "twoSum", title: "Two Sum" } as unknown as Problem
const strippedProblem = { id: "two-sum", functionName: "twoSum", title: "Two Sum" } as unknown as StrippedProblem
const passingResult = { allPassed: true, results: [], runtimeMs: 5 } as ExecutionResult
const failingResult = { allPassed: false, results: [], runtimeMs: 5 } as ExecutionResult
const attemptRecord = { id: "attempt-1" } as unknown as AttemptRecord

function makePracticeView() {
  const loading = recordedField<boolean>()
  const problem = recordedField<Problem>()
  const errors = recordedField<string | null>()
  const running = recordedField<boolean>()
  const result = recordedField<ExecutionResult | null>()
  const view: PracticeView = {
    setLoading: (v) => loading.push(v),
    setProblem: (v) => problem.push(v),
    setError: (v) => errors.push(v),
    setRunning: (v) => running.push(v),
    setResult: (v) => result.push(v),
  }
  return { view, loading, problem, errors, running, result }
}

function makeBlindView() {
  const loading = recordedField<boolean>()
  const problem = recordedField<StrippedProblem>()
  const errors = recordedField<string | null>()
  const running = recordedField<boolean>()
  const result = recordedField<ExecutionResult | null>()
  const view: BlindTestView = {
    setLoading: (v) => loading.push(v),
    setProblem: (v) => problem.push(v),
    setError: (v) => errors.push(v),
    setRunning: (v) => running.push(v),
    setResult: (v) => result.push(v),
  }
  return { view, loading, problem, errors, running, result }
}

describe("PracticePresenter", () => {
  beforeEach(() => {
    vi.mocked(apiClient.getProblem).mockReset()
    vi.mocked(apiClient.execute).mockReset()
    vi.mocked(apiClient.recordAttempt).mockReset()
  })

  it("loads a problem", async () => {
    vi.mocked(apiClient.getProblem).mockResolvedValue(problem)
    const { view, problem: seen, loading, errors } = makePracticeView()

    await new PracticePresenter(view).loadProblem("two-sum")

    expect(apiClient.getProblem).toHaveBeenCalledWith("two-sum")
    expect(seen.current).toEqual(problem)
    expect(loading.calls).toEqual([true, false])
    expect(errors.calls).toEqual([null])
  })

  it("sets an error when loading a problem fails", async () => {
    vi.mocked(apiClient.getProblem).mockRejectedValue(new Error("not found"))
    const { view, errors } = makePracticeView()

    await new PracticePresenter(view).loadProblem("missing")

    expect(errors.calls).toEqual([null, "not found"])
  })

  it("sets an error instead of throwing when running before a problem is loaded", async () => {
    const { view, errors } = makePracticeView()

    await new PracticePresenter(view).run("code")

    expect(errors.calls).toEqual(["No problem loaded"])
  })

  it("runs code against the loaded problem and sets the result", async () => {
    vi.mocked(apiClient.getProblem).mockResolvedValue(problem)
    vi.mocked(apiClient.execute).mockResolvedValue(passingResult)
    const { view, result, running } = makePracticeView()
    const presenter = new PracticePresenter(view)
    await presenter.loadProblem("two-sum")

    await presenter.run("def twoSum(): pass", [0])

    expect(apiClient.execute).toHaveBeenCalledWith(
      "two-sum",
      { code: "def twoSum(): pass", functionName: "twoSum", language: "python" },
      "practice",
      [0]
    )
    expect(result.current).toEqual(passingResult)
    expect(running.calls).toEqual([true, false])
  })

  it("sets an error when running code fails", async () => {
    vi.mocked(apiClient.getProblem).mockResolvedValue(problem)
    vi.mocked(apiClient.execute).mockRejectedValue(new Error("sandbox error"))
    const { view, errors } = makePracticeView()
    const presenter = new PracticePresenter(view)
    await presenter.loadProblem("two-sum")

    await presenter.run("bad code")

    expect(errors.calls).toEqual([null, "sandbox error"])
  })

  it("submits code, records the attempt with accumulated hint count, and sets the result", async () => {
    vi.mocked(apiClient.getProblem).mockResolvedValue(problem)
    vi.mocked(apiClient.execute).mockResolvedValue(failingResult)
    vi.mocked(apiClient.recordAttempt).mockResolvedValue(attemptRecord)
    const { view, result } = makePracticeView()
    const presenter = new PracticePresenter(view)
    await presenter.loadProblem("two-sum")
    presenter.recordHintRevealed()
    presenter.recordHintRevealed()

    await presenter.submitCode("def twoSum(): pass")

    expect(apiClient.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        problemId: "two-sum",
        passed: false,
        hintsUsed: 2,
        mode: "practice",
        stats: expect.objectContaining({ linesOfCode: 1, testsPassed: 0, testsTotal: 0 }),
      })
    )
    expect(result.current).toEqual(failingResult)
  })
})

describe("BlindTestPresenter", () => {
  beforeEach(() => {
    vi.mocked(apiClient.getBlindProblem).mockReset()
    vi.mocked(apiClient.getRandomProblemFromSet).mockReset()
    vi.mocked(apiClient.execute).mockReset()
    vi.mocked(apiClient.recordAttempt).mockReset()
  })

  it("loads a stripped problem by id", async () => {
    vi.mocked(apiClient.getBlindProblem).mockResolvedValue(strippedProblem)
    const { view, problem: seen } = makeBlindView()

    await new BlindTestPresenter(view).loadProblem("two-sum")

    expect(apiClient.getBlindProblem).toHaveBeenCalledWith("two-sum")
    expect(seen.current).toEqual(strippedProblem)
  })

  it("loads a random stripped problem from a set", async () => {
    vi.mocked(apiClient.getRandomProblemFromSet).mockResolvedValue(strippedProblem)
    const { view, problem: seen } = makeBlindView()

    await new BlindTestPresenter(view).loadRandomFromSet("set-1")

    expect(apiClient.getRandomProblemFromSet).toHaveBeenCalledWith("set-1")
    expect(seen.current).toEqual(strippedProblem)
  })

  it("submits code tagged with blind mode", async () => {
    vi.mocked(apiClient.getBlindProblem).mockResolvedValue(strippedProblem)
    vi.mocked(apiClient.execute).mockResolvedValue(passingResult)
    vi.mocked(apiClient.recordAttempt).mockResolvedValue(attemptRecord)
    const { view } = makeBlindView()
    const presenter = new BlindTestPresenter(view)
    await presenter.loadProblem("two-sum")

    await presenter.submitCode("def twoSum(): pass")

    expect(apiClient.execute).toHaveBeenCalledWith(
      "two-sum",
      { code: "def twoSum(): pass", functionName: "twoSum", language: "python" },
      "blind",
      undefined
    )
    expect(apiClient.recordAttempt).toHaveBeenCalledWith(expect.objectContaining({ mode: "blind" }))
  })
})
