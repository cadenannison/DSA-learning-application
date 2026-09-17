"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { PageShell } from "@/components/ui/page-shell"
import { StatCard } from "@/components/ui/stat-card"
import { StatusPill } from "@/components/ui/status-pill"
import { ProgressBar } from "@/components/ui/progress-bar"
import { EmptyState } from "@/components/ui/empty-state"
import { DashboardPresenter, type DashboardData } from "@/presenter/dashboard-presenter"
import type { StudyPatternWithReadiness, StudyTrackId, User } from "@/types"

const TRACK_LABELS: Record<StudyTrackId, string> = {
  "oa-prep": "OA Prep",
  "technical-interview-prep": "Technical Interview Prep",
}

export default function DashboardPage() {
  return <AuthGate>{(user) => <DashboardContent user={user} />}</AuthGate>
}

function DashboardContent({ user }: { user: User }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [presenter] = useState(
    () => new DashboardPresenter({ setLoading, setData, setError })
  )

  useEffect(() => {
    presenter.load()
  }, [presenter])

  if (loading && !data) {
    return (
      <PageShell>
        <p className="text-sm text-text-2">Loading dashboard...</p>
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell>
        <p className="text-sm text-danger">{error}</p>
      </PageShell>
    )
  }

  if (!data) {
    return (
      <PageShell>
        <div className="mb-8">
          <h1 className="font-display text-[26px] font-semibold text-text-1">
            Welcome back, {user.username}
          </h1>
          <p className="mt-1 text-sm text-text-2">No study plan yet</p>
        </div>
        <EmptyState message="Create a study plan to see your dashboard." />
        <Link
          href="/study-plan/new"
          className="mt-4 inline-flex min-h-[44px] items-center rounded-control bg-accent px-4 text-sm font-semibold text-bg"
        >
          + New study plan
        </Link>
      </PageShell>
    )
  }

  return <DashboardBody user={user} data={data} />
}

function DashboardBody({ user, data }: { user: User; data: DashboardData }) {
  const { plan, overview, stats, totalLibraryProblems } = data

  const createdAt = new Date(plan.createdAt).getTime()
  const currentWeek = Math.max(1, Math.ceil((Date.now() - createdAt) / (7 * 24 * 60 * 60 * 1000)))

  const primaryTrackId: StudyTrackId =
    overview.recommendation.trackId ?? overview.tracks[0]?.id ?? "technical-interview-prep"

  const readinessScore = useMemo(() => {
    if (overview.overallProgress.length === 0) return 0
    const total = overview.overallProgress.reduce((sum, t) => sum + t.totalPatterns, 0)
    const ready = overview.overallProgress.reduce((sum, t) => sum + t.readyOrBetter, 0)
    if (total === 0) return 0
    return Math.round((ready / total) * 100)
  }, [overview.overallProgress])

  const problemsSolved = stats?.problemsCompleted ?? 0

  const priorityPatterns = useMemo(
    () =>
      [...overview.patterns].sort((a, b) => a.priorityRank - b.priorityRank).slice(0, 4),
    [overview.patterns]
  )

  const todaysPlanEntries = overview.drillQueue.slice(0, 3)

  const daysRemaining = overview.recommendation.daysRemaining

  return (
    <PageShell>
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold text-text-1">
            Welcome back, {user.username}
          </h1>
          <p className="mt-1 text-sm text-text-2">
            {TRACK_LABELS[primaryTrackId]} · Week {currentWeek}
          </p>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="flex h-[38px] w-[340px] items-center gap-2 rounded-[9px] border border-border bg-surface px-3">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-[15px] w-[15px] shrink-0 text-text-3"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search problems, patterns…"
              className="w-full bg-transparent text-[13px] text-text-1 placeholder:text-text-3 focus:outline-none"
            />
          </div>
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[9px] bg-accent-soft font-display text-sm font-bold text-accent">
            {user.username.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="mb-7 grid grid-cols-4 gap-4">
        <StatCard
          label="Current streak"
          value={stats?.currentStreakDays ?? 0}
          pill={
            (stats?.currentStreakDays ?? 0) > 0 ? (
              <StatusPill label="Active" tone="warning" />
            ) : undefined
          }
        />
        <StatCard
          label="Problems solved"
          value={
            <>
              {problemsSolved} <UnitSuffix>/ {totalLibraryProblems}</UnitSuffix>
            </>
          }
        />
        <StatCard
          label="Readiness score"
          value={<span className="text-success">{readinessScore}%</span>}
        />
        <StatCard
          label="Interview loop"
          value={
            <>
              {daysRemaining ?? "—"} <UnitSuffix>days left</UnitSuffix>
            </>
          }
        />
      </div>

      <div className="grid flex-1 grid-cols-[1.3fr_1fr] gap-5">
        <TodaysPlanCard
          planId={plan.id}
          entries={todaysPlanEntries}
          totalCount={overview.drillQueue.length}
        />

        <div className="flex flex-col gap-5">
          <TrackProgressCard overview={overview} />
          <PriorityPatternsCard patterns={priorityPatterns} />
        </div>
      </div>
    </PageShell>
  )
}

function UnitSuffix({ children }: { children: React.ReactNode }) {
  return <span className="font-sans text-sm font-normal text-text-2">{children}</span>
}

function TodaysPlanCard({
  planId,
  entries,
  totalCount,
}: {
  planId: string
  entries: DashboardData["overview"]["drillQueue"]
  totalCount: number
}) {
  const estMinutes = totalCount * 25

  return (
    <div className="flex flex-col gap-3.5 rounded-card border border-border bg-surface p-[22px_24px]">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-text-1">Today&apos;s plan</h2>
        <span className="text-[12.5px] text-text-2">
          {totalCount} items · ~{Math.floor(estMinutes / 60)}h {estMinutes % 60}m
        </span>
      </div>

      {entries.length === 0 ? (
        <EmptyState message="Nothing due right now. Check the Study Plan tab to browse every pattern." />
      ) : (
        entries.map((entry, index) => (
          <Link
            key={entry.studyPatternId}
            href={`/study-plan/${planId}/${entry.studyPatternId}/practice`}
            className={`flex items-center gap-3.5 rounded-[10px] p-3.5 transition-colors ${
              index === 0
                ? "bg-surface-2 border border-border-soft"
                : "border border-border-soft hover:bg-surface-2"
            }`}
          >
            {index === 0 ? (
              <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-accent-soft text-accent">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                  <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
                </svg>
              </span>
            ) : (
              <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] border border-border-soft font-mono text-[11px] text-text-2">
                {String(index + 1).padStart(2, "0")}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text-1">
                {entry.studyPatternName}
              </div>
              <div className="mt-0.5 truncate text-[12.5px] text-text-2">
                {TRACK_LABELS[entry.trackId]} · {Math.round(entry.likelihoodWeight * 100)}% likely
              </div>
            </div>
            <StatusPill
              label={index === 0 ? "In progress" : "Not started"}
              tone={index === 0 ? "accent" : "neutral"}
            />
          </Link>
        ))
      )}

      {entries.length > 0 && (
        <Link
          href={`/study-plan/${planId}`}
          className="mt-auto flex min-h-[40px] w-fit items-center gap-2 rounded-[9px] bg-accent px-4 text-[13.5px] font-semibold text-bg"
        >
          Resume lesson
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
  )
}

function TrackProgressCard({ overview }: { overview: DashboardData["overview"] }) {
  return (
    <div className="rounded-card border border-border bg-surface p-[22px_24px]">
      <h2 className="mb-3.5 font-display text-base font-semibold text-text-1">Track progress</h2>
      <div className="space-y-3.5">
        {overview.overallProgress.map((track) => (
          <div key={track.trackId}>
            <div className="mb-1.5 flex items-center justify-between text-[13px]">
              <span className="text-text-1">{TRACK_LABELS[track.trackId]}</span>
              <span className="font-mono text-text-2">
                {track.readyOrBetter} / {track.totalPatterns}
              </span>
            </div>
            <ProgressBar
              value={track.readyOrBetter}
              max={track.totalPatterns}
              complete={track.readyOrBetter >= track.totalPatterns * 0.75}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function PriorityPatternsCard({ patterns }: { patterns: StudyPatternWithReadiness[] }) {
  return (
    <div className="flex-1 rounded-card border border-border bg-surface p-[22px_24px]">
      <h2 className="mb-3.5 font-display text-base font-semibold text-text-1">
        Priority patterns
      </h2>
      <div className="space-y-2.5">
        {patterns.map((pattern, index) => {
          const total = pattern.problems.length
          const done = pattern.problems.filter((p) => p.completed).length
          const pct = total > 0 ? (done / total) * 100 : 0
          const zeroProgress = done === 0

          return (
            <div key={pattern.id} className="flex items-center gap-2.5">
              <span className="w-3.5 shrink-0 font-mono text-[11px] text-text-3">
                {index + 1}
              </span>
              <span
                className={`flex-1 truncate text-[13px] ${
                  zeroProgress ? "text-text-2" : "text-text-1"
                }`}
              >
                {pattern.name}
              </span>
              <div className="h-[5px] w-[70px] shrink-0 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
