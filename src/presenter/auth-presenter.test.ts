import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "@/lib/api-client"
import { AuthPresenter, type AuthView } from "@/presenter/auth-presenter"
import { recordedField } from "@/presenter/test-support"
import type { User } from "@/types"

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    getCurrentUser: vi.fn(),
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}))

function makeView() {
  const loading = recordedField<boolean>()
  const user = recordedField<User | null>()
  const errors = recordedField<string | null>()
  const view: AuthView = {
    setLoading: (v) => loading.push(v),
    setUser: (v) => user.push(v),
    setError: (v) => errors.push(v),
  }
  return { view, loading, user, errors }
}

const testUser: User = { id: "u1", username: "caden", createdAt: "2026-01-01T00:00:00.000Z" }

describe("AuthPresenter", () => {
  beforeEach(() => {
    vi.mocked(apiClient.getCurrentUser).mockReset()
    vi.mocked(apiClient.register).mockReset()
    vi.mocked(apiClient.login).mockReset()
    vi.mocked(apiClient.logout).mockReset()
  })

  it("loads the current user and toggles loading around the call", async () => {
    vi.mocked(apiClient.getCurrentUser).mockResolvedValue(testUser)
    const { view, loading, user } = makeView()

    await new AuthPresenter(view).loadCurrentUser()

    expect(user.current).toEqual(testUser)
    expect(loading.calls).toEqual([true, false])
  })

  it("clears loading even when loadCurrentUser fails", async () => {
    vi.mocked(apiClient.getCurrentUser).mockRejectedValue(new Error("unauthorized"))
    const { view, loading } = makeView()

    await expect(new AuthPresenter(view).loadCurrentUser()).rejects.toThrow("unauthorized")

    expect(loading.calls).toEqual([true, false])
  })

  it("registers and sets the resulting user", async () => {
    vi.mocked(apiClient.register).mockResolvedValue(testUser)
    const { view, user, errors } = makeView()

    await new AuthPresenter(view).register("caden", "hunter2")

    expect(apiClient.register).toHaveBeenCalledWith("caden", "hunter2")
    expect(user.current).toEqual(testUser)
    expect(errors.calls).toEqual([null])
  })

  it("surfaces a registration error and rethrows for the caller", async () => {
    vi.mocked(apiClient.register).mockRejectedValue(new Error("username taken"))
    const { view, errors } = makeView()

    await expect(new AuthPresenter(view).register("caden", "hunter2")).rejects.toThrow(
      "username taken"
    )

    expect(errors.calls).toEqual([null, "username taken"])
  })

  it("logs in and sets the resulting user", async () => {
    vi.mocked(apiClient.login).mockResolvedValue(testUser)
    const { view, user } = makeView()

    await new AuthPresenter(view).login("caden", "hunter2")

    expect(user.current).toEqual(testUser)
  })

  it("surfaces a login error and rethrows for the caller", async () => {
    vi.mocked(apiClient.login).mockRejectedValue(new Error("bad credentials"))
    const { view, errors } = makeView()

    await expect(new AuthPresenter(view).login("caden", "wrong")).rejects.toThrow(
      "bad credentials"
    )

    expect(errors.calls).toEqual([null, "bad credentials"])
  })

  it("logs out and clears the user", async () => {
    vi.mocked(apiClient.logout).mockResolvedValue(undefined)
    const { view, user } = makeView()

    await new AuthPresenter(view).logout()

    expect(apiClient.logout).toHaveBeenCalled()
    expect(user.current).toBeNull()
  })
})
