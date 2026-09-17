"use client"

import Link from "next/link"
import { use, useEffect, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { PlanNav } from "@/components/study-plan/plan-nav"
import { PageShell } from "@/components/ui/page-shell"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { StatusPill, type StatusTone } from "@/components/ui/status-pill"
import { StudyPlanPresenter } from "@/presenter/study-plan-presenter"
import type {
  RoadmapOverview,
  RoadmapPatternEntry,
  StudyPatternStage,
  StudyTrackId,
  User,
} from "@/types"

const STAGE_LABELS: Record<StudyPatternStage, string> = {
  not_started: "Not started",
  concept: "Concept read",
  easy_done: "Easy done",
  mediums_done: "Mediums done",
  bug_tracing_done: "Bug-tracing done",
}

const TRACK_LABELS: Record<StudyTrackId, string> = {
  "oa-prep": "OA Prep",
  "technical-interview-prep": "Technical Interview Prep",
}

export default function RoadmapPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params)
  return <AuthGate>{(user, logout) => <RoadmapContent planId={planId} user={user} logout={logout} />}</AuthGate>
}

function RoadmapContent({ planId, user, logout }: { planId: string; user: User; logout: () => void }) {
  const [roadmap, setRoadmap] = useState<RoadmapOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [presenter] = useState(
    () => new StudyPlanPresenter(planId, { setLoading: () => {}, setOverview: () => {}, setError: () => {} })
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    presenter
      .loadRoadmap()
      .then((data) => {
        if (!cancelled) setRoadmap(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load roadmap")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [presenter])

  if (loading && !roadmap) {
    return (
      <PageShell>
        <p className="text-sm text-text-2">Loading roadmap...</p>
      </PageShell>
    )
  }

  if (error || !roadmap) {
    return (
      <PageShell>
        <p className="text-sm text-danger">{error ?? "Failed to load"}</p>
      </PageShell>
    )
  }

  const paceTone: StatusTone =
    roadmap.paceDeltaDays === null
      ? "neutral"
      : roadmap.paceDeltaDays > 0
        ? "danger"
        : "success"

  return (
    <PageShell>
      <PageHeader
        title="Roadmap"
        action={
          <div className="flex items-center gap-3 whitespace-nowrap">
            <span className="text-xs text-text-2">{user.username}</span>
            <button onClick={logout} className="text-xs whitespace-nowrap text-accent hover:underline">
              Log out
            </button>
          </div>
        }
      />

      <PlanNav planId={planId} active="roadmap" />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Days Remaining"
          value={roadmap.daysRemaining !== null ? `${roadmap.daysRemaining}d` : "Not set"}
        />
        <StatCard
          label="Pace"
          value={`${roadmap.daysNeededAtCurrentPace.toFixed(1)}d needed`}
          pill={
            roadmap.paceDeltaDays !== null && (
              <StatusPill
                label={
                  roadmap.paceDeltaDays > 0
                    ? `${roadmap.paceDeltaDays.toFixed(1)}d behind`
                    : `${Math.abs(roadmap.paceDeltaDays).toFixed(1)}d ahead`
                }
                tone={paceTone}
              />
            )
          }
        />
        <StatCard label="Daily Budget" value={`${roadmap.dailyTimeBudgetMinutes} min`} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {roadmap.tracks.map((track) => (
          <section key={track.trackId}>
            <h2 className="mb-3 text-sm font-semibold text-text-1">{TRACK_LABELS[track.trackId]}</h2>
            <div className="space-y-2">
              {track.entries.map((entry) => (
                <RoadmapRow key={entry.studyPatternId} planId={planId} entry={entry} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  )
}

function RoadmapRow({ planId, entry }: { planId: string; entry: RoadmapPatternEntry }) {
  const highlightClass = entry.isCurrent
    ? "border-accent bg-accent-soft"
    : entry.isUpNext
      ? "border-accent-soft bg-surface"
      : "border-border bg-surface"

  return (
    <Link
      href={`/study-plan/${planId}/${entry.studyPatternId}/${defaultSectionForId(entry)}`}
      className={`flex items-center gap-3 rounded-card border p-3 transition-colors hover:border-accent ${highlightClass}`}
    >
      <span className="flex w-8 shrink-0 items-center justify-center rounded-chip bg-surface-2 py-0.5 font-mono text-[11px] text-text-2">
        {String(entry.priorityRank).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-text-1">{entry.studyPatternName}</span>
          {entry.isCurrent && <StatusPill label="Current" tone="accent" />}
          {entry.isUpNext && <StatusPill label="Up next" tone="neutral" />}
        </div>
        <div className="mt-0.5 text-xs text-text-2">{STAGE_LABELS[entry.stage]}</div>
      </div>
      <span className="shrink-0 font-mono text-xs text-text-2">
        ~{entry.estimatedHoursRemaining.toFixed(1)}h left
      </span>
    </Link>
  )
}

/** Roadmap entries only carry an id/name, not the full pattern, so the default section
 * ("practice") is inlined here rather than importing the pattern-shaped defaultSectionFor. */
function defaultSectionForId(_entry: RoadmapPatternEntry): string {
  return "practice"
}
