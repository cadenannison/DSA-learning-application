"use client"

import Link from "next/link"
import { use, useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { PageShell } from "@/components/ui/page-shell"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { StatusPill, type StatusTone } from "@/components/ui/status-pill"
import type { OASessionSummary } from "@/types"

const STATUS_LABELS: Record<OASessionSummary["perProblem"][number]["status"], string> = {
  unanswered: "Unanswered",
  in_progress: "In progress",
  passed: "Passed",
  failed: "Failed",
}

const STATUS_TONES: Record<OASessionSummary["perProblem"][number]["status"], StatusTone> = {
  unanswered: "neutral",
  in_progress: "warning",
  passed: "success",
  failed: "danger",
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

  if (loading) return <PageShell><p className="text-sm text-text-2">Loading summary...</p></PageShell>
  if (error) return <PageShell><p className="text-sm text-danger">{error}</p></PageShell>
  if (!summary) return null

  return (
    <PageShell>
      <PageHeader title="Session Summary" context={`Status: ${summary.status}`} />

      <div className="mb-6 max-w-xs">
        <StatCard label="Problems passed" value={`${summary.problemsPassed} / ${summary.problemsTotal}`} />
      </div>

      <ul className="mb-8 overflow-hidden rounded-card border border-border bg-surface">
        {summary.perProblem.map((p, index) => (
          <li
            key={p.problemId}
            className="flex min-h-[44px] items-center justify-between border-b border-border-soft px-4 py-3 text-sm last:border-b-0"
          >
            <span className="text-text-1">Problem {index + 1}</span>
            <span className="flex items-center gap-4">
              <span className="font-mono text-xs text-text-2">{formatDuration(p.timeSpentMs)}</span>
              <StatusPill label={STATUS_LABELS[p.status]} tone={STATUS_TONES[p.status]} />
            </span>
          </li>
        ))}
      </ul>

      <div className="flex gap-3">
        <Link
          href="/oa"
          className="flex min-h-[44px] items-center rounded-control bg-accent px-4 text-sm font-semibold text-bg"
        >
          Start another session
        </Link>
        <Link
          href="/"
          className="flex min-h-[44px] items-center rounded-control border border-border px-4 text-sm text-text-2 hover:bg-surface-2 hover:text-text-1"
        >
          Back to library
        </Link>
      </div>
    </PageShell>
  )
}
