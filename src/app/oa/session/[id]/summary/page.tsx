"use client"

import Link from "next/link"
import { use, useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import type { OASessionSummary } from "@/types"

const STATUS_LABELS: Record<OASessionSummary["perProblem"][number]["status"], string> = {
  unanswered: "Unanswered",
  in_progress: "In progress",
  passed: "Passed",
  failed: "Failed",
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}

export default function OASessionSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [summary, setSummary] = useState<OASessionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // endSession is idempotent from the caller's perspective here — the session was already
    // ended by the in-session page (or expired) before navigating here; calling it again just
    // returns the same terminal summary rather than mutating state twice.
    apiClient
      .endOASession(id)
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load summary"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <main className="p-8 text-sm text-muted">Loading summary...</main>
  if (error) return <main className="p-8 text-sm text-red-600 dark:text-red-400">{error}</main>
  if (!summary) return null

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold">Session Summary</h1>
      <p className="mt-1 text-sm text-muted">
        Status: <span className="font-medium text-foreground">{summary.status}</span>
      </p>

      <div className="mt-6 rounded-md border border-border p-4">
        <div className="text-lg font-semibold">
          {summary.problemsPassed} / {summary.problemsTotal} problems passed
        </div>
      </div>

      <ul className="mt-4 divide-y divide-border rounded-md border border-border">
        {summary.perProblem.map((p, index) => (
          <li key={p.problemId} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>Problem {index + 1}</span>
            <span className="flex items-center gap-4">
              <span className="text-xs text-muted">{formatDuration(p.timeSpentMs)}</span>
              <span
                className={
                  p.status === "passed"
                    ? "text-green-600 dark:text-green-400"
                    : p.status === "failed"
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted"
                }
              >
                {STATUS_LABELS[p.status]}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex gap-3">
        <Link href="/oa" className="rounded-md bg-accent px-4 py-2 text-sm text-white">
          Start another session
        </Link>
        <Link href="/" className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface">
          Back to library
        </Link>
      </div>
    </main>
  )
}
