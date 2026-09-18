import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "@/lib/api-client"
import { OASessionPresenter, type OASessionView } from "@/presenter/oa-session-presenter"
import { recordedField } from "@/presenter/test-support"
import type { OASession, OASessionSummary } from "@/types"

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    startOASession: vi.fn(),
    getOASession: vi.fn(),
    saveOAProgress: vi.fn(),
    submitOAProblem: vi.fn(),
    endOASession: vi.fn(),
  },
}))

function makeView() {
  const loading = recordedField<boolean>()
  const session = recordedField<OASession>()
  const errors = recordedField<string | null>()
  const running = recordedField<boolean>()
  const view: OASessionView = {
    setLoading: (v) => loading.push(v),
    setSession: (v) => session.push(v),
    setError: (v) => errors.push(v),
    setRunning: (v) => running.push(v),
  }
  return { view, loading, session, errors, running }
}

const session = { id: "session-1", status: "in_progress", problems: [] } as unknown as OASession

describe("OASessionPresenter", () => {
  beforeEach(() => {
    vi.mocked(apiClient.startOASession).mockReset()
    vi.mocked(apiClient.getOASession).mockReset()
    vi.mocked(apiClient.saveOAProgress).mockReset()
    vi.mocked(apiClient.submitOAProblem).mockReset()
    vi.mocked(apiClient.endOASession).mockReset()
  })

  it("has no session before start/load", () => {
    const { view } = makeView()
    expect(new OASessionPresenter(view).getSession()).toBeNull()
  })

  it("starts a session and exposes it via getSession", async () => {
    vi.mocked(apiClient.startOASession).mockResolvedValue(session)
    const { view, session: seen, loading, errors } = makeView()
    const presenter = new OASessionPresenter(view)

    await presenter.start({ difficulty: "easy", problemCount: 1, timeBudgetMs: 60000 })

    expect(seen.current).toEqual(session)
    expect(presenter.getSession()).toEqual(session)
    expect(loading.calls).toEqual([true, false])
    expect(errors.calls).toEqual([null])
  })

  it("sets an error when starting a session fails", async () => {
    vi.mocked(apiClient.startOASession).mockRejectedValue(new Error("no problems available"))
    const { view, errors } = makeView()

    await new OASessionPresenter(view).start({ difficulty: "easy", problemCount: 1, timeBudgetMs: 60000 })

    expect(errors.calls).toEqual([null, "no problems available"])
  })

  it("loads an existing session", async () => {
    vi.mocked(apiClient.getOASession).mockResolvedValue(session)
    const { view, session: seen } = makeView()
    const presenter = new OASessionPresenter(view)

    await presenter.loadSession("session-1")

    expect(apiClient.getOASession).toHaveBeenCalledWith("session-1")
    expect(presenter.getSession()).toEqual(session)
    expect(seen.current).toEqual(session)
  })

  it("does nothing on saveProgress/submitProblem/endSession before a session is loaded", async () => {
    const { view } = makeView()
    const presenter = new OASessionPresenter(view)

    await presenter.saveProgress("two-sum", "code")
    await presenter.submitProblem("two-sum", "code", "twoSum")
    const summary = await presenter.endSession()

    expect(apiClient.saveOAProgress).not.toHaveBeenCalled()
    expect(apiClient.submitOAProblem).not.toHaveBeenCalled()
    expect(apiClient.endOASession).not.toHaveBeenCalled()
    expect(summary).toBeNull()
  })

  it("saves progress against the loaded session", async () => {
    vi.mocked(apiClient.getOASession).mockResolvedValue(session)
    const updated = { ...session, id: "session-1" } as OASession
    vi.mocked(apiClient.saveOAProgress).mockResolvedValue(updated)
    const { view, session: seen } = makeView()
    const presenter = new OASessionPresenter(view)
    await presenter.loadSession("session-1")

    await presenter.saveProgress("two-sum", "code")

    expect(apiClient.saveOAProgress).toHaveBeenCalledWith("session-1", "two-sum", "code")
    expect(seen.current).toEqual(updated)
  })

  it("sets an error when saving progress fails", async () => {
    vi.mocked(apiClient.getOASession).mockResolvedValue(session)
    vi.mocked(apiClient.saveOAProgress).mockRejectedValue(new Error("expired"))
    const { view, errors } = makeView()
    const presenter = new OASessionPresenter(view)
    await presenter.loadSession("session-1")

    await presenter.saveProgress("two-sum", "code")

    expect(errors.calls).toEqual([null, "expired"])
  })

  it("submits a problem, toggling running state, against the loaded session", async () => {
    vi.mocked(apiClient.getOASession).mockResolvedValue(session)
    const updated = { ...session, id: "session-1" } as OASession
    vi.mocked(apiClient.submitOAProblem).mockResolvedValue(updated)
    const { view, session: seen, running } = makeView()
    const presenter = new OASessionPresenter(view)
    await presenter.loadSession("session-1")

    await presenter.submitProblem("two-sum", "code", "twoSum")

    expect(apiClient.submitOAProblem).toHaveBeenCalledWith("session-1", "two-sum", {
      code: "code",
      functionName: "twoSum",
      language: "python",
    })
    expect(seen.current).toEqual(updated)
    expect(running.calls).toEqual([true, false])
  })

  it("sets an error when submitting a problem fails", async () => {
    vi.mocked(apiClient.getOASession).mockResolvedValue(session)
    vi.mocked(apiClient.submitOAProblem).mockRejectedValue(new Error("sandbox error"))
    const { view, errors, running } = makeView()
    const presenter = new OASessionPresenter(view)
    await presenter.loadSession("session-1")

    await presenter.submitProblem("two-sum", "code", "twoSum")

    expect(errors.calls).toEqual([null, "sandbox error"])
    expect(running.calls).toEqual([true, false])
  })

  it("ends the session and returns the summary", async () => {
    vi.mocked(apiClient.getOASession).mockResolvedValue(session)
    const summary = { sessionId: "session-1", status: "completed" } as unknown as OASessionSummary
    vi.mocked(apiClient.endOASession).mockResolvedValue(summary)
    const { view } = makeView()
    const presenter = new OASessionPresenter(view)
    await presenter.loadSession("session-1")

    const result = await presenter.endSession()

    expect(apiClient.endOASession).toHaveBeenCalledWith("session-1")
    expect(result).toEqual(summary)
  })

  it("returns null and sets an error when ending the session fails", async () => {
    vi.mocked(apiClient.getOASession).mockResolvedValue(session)
    vi.mocked(apiClient.endOASession).mockRejectedValue(new Error("failed"))
    const { view, errors } = makeView()
    const presenter = new OASessionPresenter(view)
    await presenter.loadSession("session-1")

    const result = await presenter.endSession()

    expect(result).toBeNull()
    expect(errors.calls).toEqual([null, "failed"])
  })
})
