"use client"

import Link from "next/link"
import { use, useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { PageShell } from "@/components/ui/page-shell"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { StatusPill, type StatusTone } from "@/components/ui/status-pill"
import { RowListItem } from "@/components/ui/row-list-item"
import { PlanNav } from "@/components/study-plan/plan-nav"
import { StudyPlanPresenter } from "@/presenter/study-plan-presenter"
import type {
  DrillQueueEntry,
  StudyPatternComplexityTier,
  StudyPlanOverview,
  User,
} from "@/types"

export default function StudyPlanTodayPage({
  params,
}: {
  params: Promise<{ planId: string }>
}) {
  const { planId } = use(params)
  return <AuthGate>{(user, logout) => <TodayContent planId={planId} user={user} logout={logout} />}</AuthGate>
}

const DRILL_REASON_LABELS: Record<DrillQueueEntry["reason"], string> = {
  overdue_review: "Overdue review",
  never_reviewed: "Not yet drilled",
  high_likelihood_low_confidence: "Likely + weak",
  scheduled: "Scheduled",
}

const DRILL_REASON_TONES: Record<DrillQueueEntry["reason"], StatusTone> = {
  overdue_review: "danger",
  never_reviewed: "accent",
  high_likelihood_low_confidence: "warning",
  scheduled: "neutral",
}

const TIER_LABELS: Record<StudyPatternComplexityTier, string> = {
  core: "core",
  important: "important",
  "complexity-ceiling": "ceiling",
  stretch: "stretch",
}

const TIER_ORDER: StudyPatternComplexityTier[] = ["core", "important", "complexity-ceiling", "stretch"]

function TodayContent({
  planId,
  user,
  logout,
}: {
  planId: string
  user: User
  logout: () => void
}) {
  const [overview, setOverview] = useState<StudyPlanOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [presenter] = useState(
    () => new StudyPlanPresenter(planId, { setLoading, setOverview, setError })
  )

  useEffect(() => {
    presenter.load()
  }, [presenter])

  const problemMix = useMemo(() => {
    if (!overview) return ""
    const counts = new Map<StudyPatternComplexityTier, number>()
    for (const pattern of overview.patterns) {
      counts.set(pattern.complexityTier, (counts.get(pattern.complexityTier) ?? 0) + 1)
    }
    return TIER_ORDER.filter((tier) => counts.get(tier))
      .map((tier) => `${counts.get(tier)} ${TIER_LABELS[tier]}`)
      .join(" / ")
  }, [overview])

  if (loading && !overview) {
    return (
      <PageShell>
        <p className="text-sm text-text-2">Loading study plan...</p>
      </PageShell>
    )
  }

  if (error || !overview) {
    return (
      <PageShell>
        <p className="text-sm text-danger">{error ?? "Failed to load"}</p>
      </PageShell>
    )
  }

  const daysRemaining = overview.recommendation.daysRemaining
  const urgencyTone: StatusTone =
    daysRemaining === null ? "neutral" : daysRemaining <= 3 ? "danger" : daysRemaining <= 7 ? "warning" : "accent"

  return (
    <PageShell>
      <PageHeader
        title="Today"
        action={
          <div className="flex items-center gap-3 whitespace-nowrap">
            <span className="text-xs text-text-2">{user.username}</span>
            <button onClick={logout} className="text-xs whitespace-nowrap text-accent hover:underline">
              Log out
            </button>
          </div>
        }
      />

      <PlanNav planId={planId} active="today" />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Interview Date"
          value={
            overview.settings.interviewDate
              ? new Date(overview.settings.interviewDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : "Not set"
          }
          pill={
            daysRemaining !== null && (
              <StatusPill label={`${daysRemaining}d left`} tone={urgencyTone} />
            )
          }
        />
        <StatCard label="Daily Budget" value={`${overview.settings.dailyTimeBudgetMinutes} min`} />
        <StatCard label="Problem Mix" value={problemMix || "—"} />
      </div>

      <DrillQueueCard
        queue={overview.drillQueue}
        planId={planId}
        dailyTimeBudgetMinutes={overview.settings.dailyTimeBudgetMinutes}
      />
    </PageShell>
  )
}

function DrillQueueCard({
  queue,
  planId,
  dailyTimeBudgetMinutes,
}: {
  queue: DrillQueueEntry[]
  planId: string
  dailyTimeBudgetMinutes: number
}) {
  if (queue.length === 0) {
    return (
      <p className="text-sm text-text-2">
        Nothing due right now. Check the Full Plan tab to browse every pattern.
      </p>
    )
  }

  const totalEstimatedMinutes = queue.reduce((sum, entry) => sum + entry.estimatedMinutes, 0)
  const overBudget = totalEstimatedMinutes > dailyTimeBudgetMinutes

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-text-2">
        <span>Today&apos;s drill queue</span>
        <span className={`font-mono ${overBudget ? "text-warning" : "text-text-2"}`}>
          est. {totalEstimatedMinutes} / {dailyTimeBudgetMinutes} min
        </span>
      </div>
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        {queue.map((entry, index) => (
          <RowListItem
            key={entry.studyPatternId}
            href={`/study-plan/${planId}/${entry.studyPatternId}/${defaultSectionForId()}`}
            rank={index + 1}
            title={entry.studyPatternName}
            subtitle={`${Math.round(entry.likelihoodWeight * 100)}% likely to appear · est. ${entry.estimatedMinutes} min`}
            trailing={<StatusPill label={DRILL_REASON_LABELS[entry.reason]} tone={DRILL_REASON_TONES[entry.reason]} />}
          />
        ))}
      </div>
    </div>
  )
}

/** Drill queue entries only carry an id/name, not the full pattern, so the default section
 * ("practice") is inlined here rather than importing the pattern-shaped defaultSectionFor. */
function defaultSectionForId(): string {
  return "practice"
}
