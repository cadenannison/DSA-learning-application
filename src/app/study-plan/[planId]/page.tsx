"use client"

import Link from "next/link"
import { use, useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { PageShell } from "@/components/ui/page-shell"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { StatusPill, type StatusTone } from "@/components/ui/status-pill"
import { PlanNav } from "@/components/study-plan/plan-nav"
import { StudyPlanPresenter } from "@/presenter/study-plan-presenter"
import type {
  DrillQueueEntry,
  RecommendedProblem,
  StudyPatternComplexityTier,
  StudyPlanOverview,
  TodayFocusEntry,
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
  const [expandedPatternId, setExpandedPatternId] = useState<string | null>(null)

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

      <TodayFocusCard
        focus={overview.todayFocus}
        planId={planId}
        expandedPatternId={expandedPatternId}
        onToggleExpanded={setExpandedPatternId}
        onToggleProblem={(problemId, completed) => presenter.setProblemCompleted(problemId, completed)}
      />
    </PageShell>
  )
}

/** The slimmed-down "what to actually do today" list: one row per pattern the drill queue
 * flagged, collapsed to its name/reason until expanded, then showing just the 3 recommended
 * problems (picked server-side by stage/confidence) as a checklist — instead of the old view
 * that immediately dumped every pattern's full problem list. */
function TodayFocusCard({
  focus,
  planId,
  expandedPatternId,
  onToggleExpanded,
  onToggleProblem,
}: {
  focus: TodayFocusEntry[]
  planId: string
  expandedPatternId: string | null
  onToggleExpanded: (patternId: string | null) => void
  onToggleProblem: (problemId: string, completed: boolean) => void
}) {
  if (focus.length === 0) {
    return (
      <p className="text-sm text-text-2">
        Nothing due right now. Check the Full Plan tab to browse every pattern.
      </p>
    )
  }

  return (
    <div>
      <div className="mb-2 text-xs text-text-2">Focus today ({focus.length})</div>
      <div className="flex flex-col gap-3">
        {focus.map((entry) => (
          <TodayFocusPatternGroup
            key={entry.studyPatternId}
            entry={entry}
            planId={planId}
            expanded={expandedPatternId === entry.studyPatternId}
            onToggleExpanded={() =>
              onToggleExpanded(expandedPatternId === entry.studyPatternId ? null : entry.studyPatternId)
            }
            onToggleProblem={onToggleProblem}
          />
        ))}
      </div>
    </div>
  )
}

function TodayFocusPatternGroup({
  entry,
  planId,
  expanded,
  onToggleExpanded,
  onToggleProblem,
}: {
  entry: TodayFocusEntry
  planId: string
  expanded: boolean
  onToggleExpanded: () => void
  onToggleProblem: (problemId: string, completed: boolean) => void
}) {
  const completedCount = entry.recommendedProblems.filter((p) => p.completed).length

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <button
        type="button"
        onClick={onToggleExpanded}
        className="flex min-h-[44px] w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-2"
      >
        <span className="text-xs text-text-2">{expanded ? "▾" : "▸"}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-text-1">{entry.studyPatternName}</div>
          <div className="truncate text-xs text-text-2">
            {completedCount}/{entry.recommendedProblems.length} complete
          </div>
        </div>
        <StatusPill label={DRILL_REASON_LABELS[entry.reason]} tone={DRILL_REASON_TONES[entry.reason]} />
      </button>

      {expanded && (
        <div className="border-t border-border-soft">
          {entry.recommendedProblems.map((problem) => (
            <RecommendedProblemRow
              key={problem.id}
              planId={planId}
              patternId={entry.studyPatternId}
              problem={problem}
              onToggle={(completed) => onToggleProblem(problem.id, completed)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function RecommendedProblemRow({
  planId,
  patternId,
  problem,
  onToggle,
}: {
  planId: string
  patternId: string
  problem: RecommendedProblem
  onToggle: (completed: boolean) => void
}) {
  const href = problem.linkedProblemId
    ? `/study-plan/${planId}/${patternId}/problem/${problem.id}?from=today`
    : `/study-plan/${planId}/${patternId}/practice`

  return (
    <div className="flex min-h-[44px] items-center gap-3 border-b border-border-soft px-4 py-2.5 last:border-b-0">
      <input
        type="checkbox"
        checked={problem.completed}
        onChange={(e) => onToggle(e.target.checked)}
        className="h-4 w-4 shrink-0 accent-accent"
        aria-label={`Mark ${problem.name} complete`}
      />
      <Link href={href} className="min-w-0 flex-1 truncate text-sm text-text-1 hover:underline">
        {problem.name}
      </Link>
      <span className="shrink-0 font-mono text-[11px] uppercase text-text-2">{problem.difficulty}</span>
    </div>
  )
}
