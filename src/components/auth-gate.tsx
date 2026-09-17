"use client"

import { useEffect, useState } from "react"
import { AuthPresenter } from "@/presenter/auth-presenter"
import { PageShell } from "@/components/ui/page-shell"
import type { User } from "@/types"

interface AuthGateProps {
  children: (user: User, logout: () => void) => React.ReactNode
}

/** Gates a page behind a logged-in user — each account gets its own Study Plan progress, so
 * a friend can create their own account and get a fresh copy of the same shared curriculum
 * rather than seeing (or overwriting) someone else's. Not global app-wide auth: other
 * features (Library, Blind Test, Mock OA) stay single-shared, per the deliberately scoped
 * migration — only Study Plan is per-user for now. */
export function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"login" | "register">("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [presenter] = useState(() => new AuthPresenter({ setLoading, setUser, setError }))

  useEffect(() => {
    presenter.loadCurrentUser()
  }, [presenter])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (mode === "login") {
        await presenter.login(username, password)
      } else {
        await presenter.register(username, password)
      }
    } catch {
      // error already surfaced via presenter.setError
    } finally {
      setSubmitting(false)
    }
  }

  function logout() {
    presenter.logout()
  }

  if (loading) {
    return (
      <PageShell>
        <p className="text-sm text-text-2">Loading...</p>
      </PageShell>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col justify-center px-12 py-10">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="mb-1 font-display text-xl font-semibold text-text-1">
            {mode === "login" ? "Log in" : "Create your account"}
          </h1>
          <p className="mb-6 text-sm text-text-2">
            Your Study Plan is personal to your account — progress, stage, confidence, and
            spaced-repetition scheduling are all tracked per user.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="flex flex-col gap-1 text-xs text-text-2">
              Username
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="min-h-[44px] rounded-control border border-border bg-surface px-3 text-sm text-text-1 focus:border-accent focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-text-2">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="min-h-[44px] rounded-control border border-border bg-surface px-3 text-sm text-text-1 focus:border-accent focus:outline-none"
              />
            </label>

            {error && <p className="text-sm text-danger">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] w-full rounded-control bg-accent px-3 text-sm font-semibold text-bg disabled:opacity-50"
            >
              {mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>

          <button
            onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
            className="mt-4 text-xs text-accent hover:underline"
          >
            {mode === "login" ? "Need an account? Create one" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    )
  }

  return <>{children(user, logout)}</>
}
