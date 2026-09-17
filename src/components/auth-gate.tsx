"use client"

import { useEffect, useState } from "react"
import { AuthPresenter } from "@/presenter/auth-presenter"
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
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <p className="text-sm text-muted">Loading...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-8">
        <h1 className="mb-1 text-xl font-semibold">
          {mode === "login" ? "Log in" : "Create your account"}
        </h1>
        <p className="mb-6 text-sm text-muted">
          Your Study Plan is personal to your account — progress, stage, confidence, and
          spaced-repetition scheduling are all tracked per user.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="flex flex-col gap-1 text-xs text-muted">
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground"
            />
          </label>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-accent px-3 py-2 text-sm text-white disabled:opacity-50"
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
      </main>
    )
  }

  return <>{children(user, logout)}</>
}
