"use client"

import Link from "next/link"
import { use, useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { StudyPlanPresenter } from "@/presenter/study-plan-presenter"
import { sortedPatternsByTrack } from "@/lib/study-plan-ordering"
import { defaultSectionFor } from "@/components/study-plan/pattern-page-shell"
import { PlanNav } from "@/components/study-plan/plan-nav"
import { PageShell } from "@/components/ui/page-shell"
import { PageHeader } from "@/components/ui/page-header"
import { StatusPill, type StatusTone } from "@/components/ui/status-pill"
import { ProgressBar } from "@/components/ui/progress-bar"
import { Tabs } from "@/components/ui/tabs"
import type {
  StudyPatternStage,
  StudyPatternWithReadiness,
  StudyPlanOverview,
  StudyReadiness,
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

const STAGE_ORDER: StudyPatternStage[] = [
  "not_started",
  "concept",
  "easy_done",
  "mediums_done",
  "bug_tracing_done",
]

// Spec's Study Plan list uses a 3-state status pill (LEARNING / NOT STARTED / MASTERED)
// rather than the 4-state StudyReadiness the data model tracks; needs_work/developing both
// read as "in progress" at this list's zoom level, with the finer distinction still visible
// via the per-pattern stage label shown alongside it.
const READINESS_TONES: Record<StudyReadiness, StatusTone> = {
  not_started: "neutral",
  needs_work: "accent",
  developing: "accent",
  ready: "success",
}

const READINESS_LABELS: Record<StudyReadiness, string> = {
  not_started: "Not started",
  needs_work: "Learning",
  developing: "Learning",
  ready: "Mastered",
}

const TIER_LABELS: Record<string, string> = {
  core: "Core",
  important: "Important",
  "complexity-ceiling": "Complexity ceiling",
  stretch: "Stretch",
}

export default function StudyPlanBoardPage({
  params,
}: {
  params: Promise<{ planId: string }>
}) {
  const { planId } = use(params)
  return <AuthGate>{(user, logout) => <BoardContent planId={planId} user={user} logout={logout} />}</AuthGate>
}

function BoardContent({ planId, user, logout }: { planId: string; user: User; logout: () => void }) {
  const [overview, setOverview] = useState<StudyPlanOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [showMockForm, setShowMockForm] = useState(false)
  const [activeTrack, setActiveTrack] = useState<StudyTrackId>("technical-interview-prep")

  const [presenter] = useState(
    () => new StudyPlanPresenter(planId, { setLoading, setOverview, setError })
  )

  useEffect(() => {
    presenter.load()
  }, [presenter])

  const { technicalPatterns, oaPatterns } = useMemo(
    () =>
      overview
        ? sortedPatternsByTrack(overview)
        : { technicalPatterns: [], oaPatterns: [] },
    [overview]
  )

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

  const oaTrack = overview.tracks.find((t) => t.id === "oa-prep")
  const technicalTrack = overview.tracks.find((t) => t.id === "technical-interview-prep")
  const oaProgress = overview.overallProgress.find((p) => p.trackId === "oa-prep")
  const technicalProgress = overview.overallProgress.find(
    (p) => p.trackId === "technical-interview-prep"
  )

  return (
    <PageShell>
      <PageHeader
        title="Full Plan"
        action={
          <div className="flex items-center gap-3 whitespace-nowrap">
            <span className="text-xs text-text-2">{user.username}</span>
            <button onClick={logout} className="text-xs whitespace-nowrap text-accent hover:underline">
              Log out
            </button>
          </div>
        }
      />

      <PlanNav planId={planId} active="board" />

      <SettingsBar overview={overview} presenter={presenter} />

      <RecommendationCard overview={overview} />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ProgressCard
          title="Technical Interview Prep"
          total={technicalProgress?.totalPatterns ?? 0}
          ready={technicalProgress?.readyOrBetter ?? 0}
          avgStageIndex={technicalProgress?.averageStageIndex ?? 0}
        />
        <ProgressCard
          title="OA Prep"
          total={oaProgress?.totalPatterns ?? 0}
          ready={oaProgress?.readyOrBetter ?? 0}
          avgStageIndex={oaProgress?.averageStageIndex ?? 0}
        />
      </div>

      <CoachingNotes />

      <div className="mb-8 flex gap-2">
        <button
          onClick={() => setShowSessionForm((v) => !v)}
          className="min-h-[44px] rounded-control border border-border px-3 text-sm text-text-2 hover:bg-surface-2 hover:text-text-1"
        >
          Log study session
        </button>
        <button
          onClick={() => setShowMockForm((v) => !v)}
          className="min-h-[44px] rounded-control border border-border px-3 text-sm text-text-2 hover:bg-surface-2 hover:text-text-1"
        >
          Log mock interview
        </button>
      </div>

      {showSessionForm && (
        <StudySessionForm
          patterns={overview.patterns}
          presenter={presenter}
          onDone={() => setShowSessionForm(false)}
        />
      )}

      {showMockForm && (
        <MockInterviewForm
          patterns={overview.patterns}
          presenter={presenter}
          onDone={() => setShowMockForm(false)}
        />
      )}

      <Tabs
        className="mb-5"
        variant="pill"
        tabs={[
          { value: "oa-prep", label: "OA Prep" },
          { value: "technical-interview-prep", label: "Technical Interview Prep" },
        ]}
        active={activeTrack}
        onChange={setActiveTrack}
      />

      {activeTrack === "technical-interview-prep" ? (
        <section className="mb-8">
          <p className="mb-3 text-sm text-text-2">{technicalTrack?.description}</p>
          <div className="space-y-2.5">
            {technicalPatterns.map((pattern) => (
              <PatternRow key={pattern.id} planId={planId} pattern={pattern} />
            ))}
          </div>
        </section>
      ) : (
        <section className="mb-8">
          <p className="mb-1 text-sm text-text-2">{oaTrack?.description}</p>
          {oaTrack?.coachingNote && (
            <p className="mb-3 rounded-control border border-border bg-surface p-3 text-xs text-text-2">
              {oaTrack.coachingNote}
            </p>
          )}
          <div className="space-y-2.5">
            {oaPatterns.map((pattern) => (
              <PatternRow key={pattern.id} planId={planId} pattern={pattern} />
            ))}
          </div>
        </section>
      )}
    </PageShell>
  )
}

function SettingsBar({
  overview,
  presenter,
}: {
  overview: StudyPlanOverview
  presenter: StudyPlanPresenter
}) {
  const [interviewDate, setInterviewDate] = useState(
    overview.settings.interviewDate?.slice(0, 10) ?? ""
  )
  const [dailyMinutes, setDailyMinutes] = useState(
    String(overview.settings.dailyTimeBudgetMinutes)
  )

  return (
    <div className="mb-6 flex flex-wrap items-end gap-4 rounded-card border border-border bg-surface p-4">
      <label className="flex flex-col gap-1 text-xs text-text-2">
        Interview date
        <input
          type="date"
          value={interviewDate}
          onChange={(e) => setInterviewDate(e.target.value)}
          onBlur={() =>
            presenter.setSettings({
              interviewDate: interviewDate ? new Date(interviewDate).toISOString() : null,
            })
          }
          className="min-h-[44px] rounded-control border border-border bg-surface-2 px-2 text-sm text-text-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-text-2">
        Daily time budget (minutes)
        <input
          type="number"
          min={1}
          value={dailyMinutes}
          onChange={(e) => setDailyMinutes(e.target.value)}
          onBlur={() => {
            const value = Number(dailyMinutes)
            if (Number.isFinite(value) && value > 0) {
              presenter.setSettings({ dailyTimeBudgetMinutes: Math.round(value) })
            }
          }}
          className="min-h-[44px] w-32 rounded-control border border-border bg-surface-2 px-2 text-sm text-text-1"
        />
      </label>
      {overview.recommendation.daysRemaining !== null && (
        <div className="text-sm text-text-2">
          <span className="font-mono font-medium text-text-1">
            {overview.recommendation.daysRemaining}
          </span>{" "}
          day{overview.recommendation.daysRemaining === 1 ? "" : "s"} remaining
        </div>
      )}
    </div>
  )
}

function RecommendationCard({ overview }: { overview: StudyPlanOverview }) {
  const rec = overview.recommendation

  return (
    <div className="mb-6 rounded-card border border-accent/40 bg-accent-soft p-4">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-accent">
        What to study today
      </div>
      <p className="text-sm text-text-1">{rec.reason}</p>
      {rec.oaPrepSuggestion && <p className="mt-2 text-sm text-text-2">{rec.oaPrepSuggestion}</p>}
      <p className="mt-2 text-xs text-text-2">
        Suggested budget today: {rec.suggestedMinutesToday} minutes · drill queue est.{" "}
        {rec.drillQueueEstimatedMinutes} minutes
      </p>
    </div>
  )
}

function ProgressCard({
  title,
  total,
  ready,
  avgStageIndex,
}: {
  title: string
  total: number
  ready: number
  avgStageIndex: number
}) {
  const pct = STAGE_ORDER.length <= 1 ? 0 : (avgStageIndex / (STAGE_ORDER.length - 1)) * 100

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-text-1">{title}</span>
        <span className="font-mono text-xs text-text-2">
          {ready}/{total} ready
        </span>
      </div>
      <ProgressBar value={pct} complete={pct >= 100} />
    </div>
  )
}

function CoachingNotes() {
  return (
    <div className="mb-6 rounded-card border border-border bg-surface p-4 text-sm">
      <div className="mb-2 font-medium text-text-1">Coaching notes</div>
      <ul className="mb-3 list-disc space-y-1 pl-5 text-text-2">
        <li>
          Default to the most obvious brute-force solution first, say it out loud, then iterate
          toward something better — the iterative process is what&apos;s valued, more than
          jumping straight to optimal.
        </li>
        <li>No REST API / system-design questions at this stage.</li>
      </ul>
      <div className="flex flex-wrap gap-3 text-xs">
        <a
          href="https://www.google.com/about/careers/applications/interview-tips/"
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          Google interview tips (incl. mock interview videos)
        </a>
        <a
          href="https://github.com/snehasishroy/leetcode-companywise-interview-questions/tree/master/google"
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          Frequency-ranked Google questions
        </a>
      </div>
    </div>
  )
}

function PatternRow({ planId, pattern }: { planId: string; pattern: StudyPatternWithReadiness }) {
  const total = pattern.problems.length
  const done = pattern.problems.filter((p) => p.completed).length
  const pct = total > 0 ? (done / total) * 100 : 0
  const isTopPriority = pattern.priorityRank <= 2
  const subtitle = [
    pattern.complexityTier === "complexity-ceiling" ? "Highest complexity ceiling" : TIER_LABELS[pattern.complexityTier],
    `${total} problem${total === 1 ? "" : "s"}`,
    pattern.hasExtendedLesson ? "extended lesson" : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <Link
      href={`/study-plan/${planId}/${pattern.id}/${defaultSectionFor(pattern)}`}
      className={`flex items-center gap-4 rounded-[12px] border px-[18px] py-4 transition-colors hover:border-border ${
        isTopPriority ? "border-accent-soft" : "border-border-soft"
      }`}
    >
      <span
        className={`flex w-[34px] shrink-0 items-center justify-center rounded-chip py-0.5 font-mono text-[11px] ${
          isTopPriority ? "bg-accent-soft text-accent" : "bg-surface-2 text-text-2"
        }`}
      >
        {String(pattern.priorityRank).padStart(2, "0")}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold text-text-1">{pattern.name}</span>
          {isTopPriority && <StatusPill label="Top priority" tone="warning" />}
        </div>
        <div className="mt-0.5 truncate text-[12.5px] text-text-2">{subtitle}</div>
      </div>

      <div className="w-[120px] shrink-0">
        <div className="mb-1.5 flex items-center justify-between text-[11.5px] text-text-2">
          <span>{STAGE_LABELS[pattern.stage]}</span>
          <span className="font-mono">
            {done}/{total}
          </span>
        </div>
        <ProgressBar value={pct} complete={pattern.readiness === "ready"} />
      </div>

      <StatusPill label={READINESS_LABELS[pattern.readiness]} tone={READINESS_TONES[pattern.readiness]} />
    </Link>
  )
}

function StudySessionForm({
  patterns,
  presenter,
  onDone,
}: {
  patterns: StudyPatternWithReadiness[]
  presenter: StudyPlanPresenter
  onDone: () => void
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [minutes, setMinutes] = useState("30")
  const [selectedPatternIds, setSelectedPatternIds] = useState<Set<string>>(new Set())
  const [stickingPoint, setStickingPoint] = useState("")
  const [plan, setPlan] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function togglePattern(id: string) {
    setSelectedPatternIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function submit() {
    setSubmitting(true)
    try {
      await presenter.logSession({
        date: new Date(date).toISOString(),
        minutesSpent: Number(minutes) || 0,
        studyPatternIds: Array.from(selectedPatternIds),
        stickingPoint,
        planForNextSession: plan,
      })
      onDone()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mb-6 rounded-card border border-border bg-surface p-4">
      <div className="mb-3 text-sm font-medium text-text-1">Log study session</div>
      <div className="mb-3 flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs text-text-2">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="min-h-[44px] rounded-control border border-border bg-surface-2 px-2 text-sm text-text-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-2">
          Minutes spent
          <input
            type="number"
            min={0}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="min-h-[44px] w-28 rounded-control border border-border bg-surface-2 px-2 text-sm text-text-1"
          />
        </label>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {patterns.map((p) => (
          <button
            key={p.id}
            onClick={() => togglePattern(p.id)}
            className={`rounded-chip border px-2 py-1 text-xs ${
              selectedPatternIds.has(p.id)
                ? "border-accent bg-accent-soft text-accent"
                : "border-border text-text-2 hover:bg-surface-2"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <label className="mb-3 flex flex-col gap-1 text-xs text-text-2">
        Sticking point
        <input
          type="text"
          value={stickingPoint}
          onChange={(e) => setStickingPoint(e.target.value)}
          className="min-h-[44px] rounded-control border border-border bg-surface-2 px-2 text-sm text-text-1"
        />
      </label>

      <label className="mb-3 flex flex-col gap-1 text-xs text-text-2">
        Plan for next session
        <input
          type="text"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="min-h-[44px] rounded-control border border-border bg-surface-2 px-2 text-sm text-text-1"
        />
      </label>

      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={submitting}
          className="min-h-[44px] rounded-control bg-accent px-3 text-sm font-semibold text-bg disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={onDone}
          className="min-h-[44px] rounded-control border border-border px-3 text-sm text-text-2 hover:bg-surface-2"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function MockInterviewForm({
  patterns,
  presenter,
  onDone,
}: {
  patterns: StudyPatternWithReadiness[]
  presenter: StudyPlanPresenter
  onDone: () => void
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [problemName, setProblemName] = useState("")
  const [patternId, setPatternId] = useState<string>("")
  const [minutes, setMinutes] = useState("30")
  const [solvedCleanly, setSolvedCleanly] = useState(true)
  const [constraintAdded, setConstraintAdded] = useState(false)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!problemName.trim()) return

    setSubmitting(true)
    try {
      await presenter.logMockInterviewResult({
        date: new Date(date).toISOString(),
        studyPatternId: patternId || null,
        problemName,
        timeTakenMinutes: Number(minutes) || 0,
        solvedCleanly,
        constraintAddedMidSolve: constraintAdded,
        notes,
      })
      onDone()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mb-6 rounded-card border border-border bg-surface p-4">
      <div className="mb-3 text-sm font-medium text-text-1">Log timed mock interview result</div>

      <div className="mb-3 flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs text-text-2">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="min-h-[44px] rounded-control border border-border bg-surface-2 px-2 text-sm text-text-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-2">
          Problem
          <input
            type="text"
            value={problemName}
            onChange={(e) => setProblemName(e.target.value)}
            placeholder="e.g. Course Schedule"
            className="min-h-[44px] rounded-control border border-border bg-surface-2 px-2 text-sm text-text-1 placeholder:text-text-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-2">
          Pattern
          <select
            value={patternId}
            onChange={(e) => setPatternId(e.target.value)}
            className="min-h-[44px] rounded-control border border-border bg-surface-2 px-2 text-sm text-text-1"
          >
            <option value="">(none)</option>
            {patterns.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-2">
          Time taken (min)
          <input
            type="number"
            min={0}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="min-h-[44px] w-28 rounded-control border border-border bg-surface-2 px-2 text-sm text-text-1"
          />
        </label>
      </div>

      <div className="mb-3 flex flex-wrap gap-4 text-sm text-text-1">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={solvedCleanly}
            onChange={(e) => setSolvedCleanly(e.target.checked)}
          />
          Solved cleanly
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={constraintAdded}
            onChange={(e) => setConstraintAdded(e.target.checked)}
          />
          Constraint added mid-solve
        </label>
      </div>

      <label className="mb-3 flex flex-col gap-1 text-xs text-text-2">
        Notes
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[44px] rounded-control border border-border bg-surface-2 px-2 text-sm text-text-1"
        />
      </label>

      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={submitting}
          className="min-h-[44px] rounded-control bg-accent px-3 text-sm font-semibold text-bg disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={onDone}
          className="min-h-[44px] rounded-control border border-border px-3 text-sm text-text-2 hover:bg-surface-2"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
