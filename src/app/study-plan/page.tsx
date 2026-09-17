"use client"

import { useEffect, useMemo, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { ThemeToggle } from "@/components/theme-toggle"
import { BugTracingPanel } from "@/components/study-plan/bug-tracing-panel"
import { ExpandableProblemRow } from "@/components/study-plan/embeddable-problem-row"
import { PatternLessonSection } from "@/components/study-plan/pattern-lesson-section"
import { StudyPlanPresenter } from "@/presenter/study-plan-presenter"
import type {
  DrillQueueEntry,
  StudyPatternStage,
  StudyPatternWithReadiness,
  StudyPlanOverview,
  StudyReadiness,
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

const READINESS_STYLES: Record<StudyReadiness, string> = {
  not_started: "bg-border text-muted",
  needs_work: "bg-red-500/10 text-red-600 dark:text-red-400",
  developing: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  ready: "bg-green-500/10 text-green-600 dark:text-green-400",
}

const READINESS_LABELS: Record<StudyReadiness, string> = {
  not_started: "Not started",
  needs_work: "Needs work",
  developing: "Developing",
  ready: "Ready",
}

const TIER_STYLES: Record<string, string> = {
  core: "bg-accent/10 text-accent",
  important: "bg-border text-muted",
  "complexity-ceiling": "bg-red-500/10 text-red-600 dark:text-red-400",
  stretch: "bg-border text-muted",
}

const TIER_LABELS: Record<string, string> = {
  core: "Core",
  important: "Important",
  "complexity-ceiling": "Complexity ceiling",
  stretch: "Stretch",
}

export default function StudyPlanPage() {
  return <AuthGate>{(user, logout) => <StudyPlanContent user={user} logout={logout} />}</AuthGate>
}

function StudyPlanContent({ user, logout }: { user: User; logout: () => void }) {
  const [overview, setOverview] = useState<StudyPlanOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [showMockForm, setShowMockForm] = useState(false)

  const [presenter] = useState(
    () => new StudyPlanPresenter({ setLoading, setOverview, setError })
  )

  useEffect(() => {
    presenter.load()
  }, [presenter])

  const technicalPatterns = useMemo(
    () =>
      (overview?.patterns ?? [])
        .filter((p) => p.trackId === "technical-interview-prep")
        .sort((a, b) => a.priorityRank - b.priorityRank),
    [overview]
  )

  const oaPatterns = useMemo(
    () =>
      (overview?.patterns ?? [])
        .filter((p) => p.trackId === "oa-prep")
        .sort((a, b) => a.priorityRank - b.priorityRank),
    [overview]
  )

  if (loading && !overview) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <p className="text-sm text-muted">Loading study plan...</p>
      </main>
    )
  }

  if (error || !overview) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <p className="text-sm text-red-600 dark:text-red-400">{error ?? "Failed to load"}</p>
      </main>
    )
  }

  const oaTrack = overview.tracks.find((t) => t.id === "oa-prep")
  const technicalTrack = overview.tracks.find((t) => t.id === "technical-interview-prep")
  const oaProgress = overview.overallProgress.find((p) => p.trackId === "oa-prep")
  const technicalProgress = overview.overallProgress.find(
    (p) => p.trackId === "technical-interview-prep"
  )

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Study Plan</h1>
          <p className="mt-1 text-sm text-muted">
            Personalized prep tracker for Google SWE intern technical interviews.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">{user.username}</span>
          <button onClick={logout} className="text-xs text-accent hover:underline">
            Log out
          </button>
          <ThemeToggle />
        </div>
      </div>

      <SettingsBar overview={overview} presenter={presenter} />

      <RecommendationCard overview={overview} />

      <DrillQueueCard queue={overview.drillQueue} />

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
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface"
        >
          Log study session
        </button>
        <button
          onClick={() => setShowMockForm((v) => !v)}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface"
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

      <section className="mb-8">
        <h2 className="mb-1 text-lg font-semibold">{technicalTrack?.name}</h2>
        <p className="mb-3 text-sm text-muted">{technicalTrack?.description}</p>
        <div className="space-y-2">
          {technicalPatterns.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              expanded={expandedId === pattern.id}
              onToggleExpand={() =>
                setExpandedId((id) => (id === pattern.id ? null : pattern.id))
              }
              presenter={presenter}
            />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-1 text-lg font-semibold">{oaTrack?.name}</h2>
        <p className="mb-1 text-sm text-muted">{oaTrack?.description}</p>
        {oaTrack?.coachingNote && (
          <p className="mb-3 rounded-md border border-border bg-surface p-3 text-xs text-muted">
            {oaTrack.coachingNote}
          </p>
        )}
        <div className="space-y-2">
          {oaPatterns.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              expanded={expandedId === pattern.id}
              onToggleExpand={() =>
                setExpandedId((id) => (id === pattern.id ? null : pattern.id))
              }
              presenter={presenter}
            />
          ))}
        </div>
      </section>
    </main>
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
    <div className="mb-6 flex flex-wrap items-end gap-4 rounded-md border border-border bg-surface p-4">
      <label className="flex flex-col gap-1 text-xs text-muted">
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
          className="rounded-md border border-border bg-transparent px-2 py-1 text-sm text-foreground"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
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
          className="w-32 rounded-md border border-border bg-transparent px-2 py-1 text-sm text-foreground"
        />
      </label>
      {overview.recommendation.daysRemaining !== null && (
        <div className="text-sm text-muted">
          <span className="font-medium text-foreground">
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
    <div className="mb-6 rounded-md border border-accent/40 bg-accent/5 p-4">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-accent">
        What to study today
      </div>
      <p className="text-sm">{rec.reason}</p>
      {rec.oaPrepSuggestion && (
        <p className="mt-2 text-sm text-muted">{rec.oaPrepSuggestion}</p>
      )}
      <p className="mt-2 text-xs text-muted">
        Suggested budget today: {rec.suggestedMinutesToday} minutes
      </p>
    </div>
  )
}

const DRILL_REASON_LABELS: Record<DrillQueueEntry["reason"], string> = {
  overdue_review: "Overdue review",
  never_reviewed: "Not yet drilled",
  high_likelihood_low_confidence: "Likely + weak",
  scheduled: "Scheduled",
}

const DRILL_REASON_STYLES: Record<DrillQueueEntry["reason"], string> = {
  overdue_review: "bg-red-500/10 text-red-600 dark:text-red-400",
  never_reviewed: "bg-accent/10 text-accent",
  high_likelihood_low_confidence: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  scheduled: "bg-border text-muted",
}

function DrillQueueCard({ queue }: { queue: DrillQueueEntry[] }) {
  if (queue.length === 0) return null

  return (
    <div className="mb-6 rounded-md border border-border p-4">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-sm font-medium">Today&apos;s drill queue</div>
        <span className="text-xs text-muted">
          Ranked by likelihood to appear + how weak you are on it + spaced-repetition due date
        </span>
      </div>
      <p className="mb-3 text-xs text-muted">
        This is the workthrough sequence — it adapts as you log stages, confidence, and mock
        interview results, and pulls reviews forward as your interview date gets closer.
      </p>
      <ol className="space-y-1.5">
        {queue.map((entry, index) => (
          <li
            key={entry.studyPatternId}
            className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-surface"
          >
            <div className="flex items-center gap-2">
              <span className="w-4 text-xs text-muted">{index + 1}</span>
              <span className="font-medium">{entry.studyPatternName}</span>
              <span className="text-[10px] text-muted">
                {Math.round(entry.likelihoodWeight * 100)}% likely
              </span>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${DRILL_REASON_STYLES[entry.reason]}`}>
              {DRILL_REASON_LABELS[entry.reason]}
            </span>
          </li>
        ))}
      </ol>
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
    <div className="rounded-md border border-border p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted">
          {ready}/{total} ready
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function CoachingNotes() {
  return (
    <div className="mb-6 rounded-md border border-border bg-surface p-4 text-sm">
      <div className="mb-2 font-medium">Coaching notes</div>
      <ul className="mb-3 list-disc space-y-1 pl-5 text-muted">
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

function PatternCard({
  pattern,
  expanded,
  onToggleExpand,
  presenter,
}: {
  pattern: StudyPatternWithReadiness
  expanded: boolean
  onToggleExpand: () => void
  presenter: StudyPlanPresenter
}) {
  const [notes, setNotes] = useState(pattern.notes)

  return (
    <div className="rounded-md border border-border">
      <button
        onClick={onToggleExpand}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            #{pattern.priorityRank} {pattern.name}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TIER_STYLES[pattern.complexityTier]}`}>
            {TIER_LABELS[pattern.complexityTier]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${READINESS_STYLES[pattern.readiness]}`}>
            {READINESS_LABELS[pattern.readiness]}
          </span>
          <span className="text-xs text-muted">{STAGE_LABELS[pattern.stage]}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3">
          {pattern.hasExtendedLesson && pattern.lesson ? (
            <PatternLessonSection lesson={pattern.lesson} />
          ) : (
            <p className="mb-3 whitespace-pre-wrap text-sm text-muted">{pattern.conceptNotes}</p>
          )}

          <div className="mb-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-muted">
              Stage
              <select
                value={pattern.stage}
                onChange={(e) =>
                  presenter.setPatternStage(pattern.id, e.target.value as StudyPatternStage)
                }
                className="rounded-md border border-border bg-transparent px-2 py-1 text-sm text-foreground"
              >
                {STAGE_ORDER.map((stage) => (
                  <option key={stage} value={stage}>
                    {STAGE_LABELS[stage]}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-xs text-muted">
              Confidence
              <select
                value={pattern.confidence ?? ""}
                onChange={(e) =>
                  presenter.setPatternConfidence(
                    pattern.id,
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
                className="rounded-md border border-border bg-transparent px-2 py-1 text-sm text-foreground"
              >
                <option value="">Unrated</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {pattern.problems.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {pattern.hasExtendedLesson
                ? pattern.problems.map((problem) => (
                    <ExpandableProblemRow
                      key={problem.id}
                      problem={problem}
                      presenter={presenter}
                    />
                  ))
                : pattern.problems.map((problem) => (
                    <label
                      key={problem.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-surface"
                    >
                      <input
                        type="checkbox"
                        checked={problem.completed}
                        onChange={(e) =>
                          presenter.setProblemCompleted(problem.id, e.target.checked)
                        }
                      />
                      <span className={problem.completed ? "line-through text-muted" : ""}>
                        {problem.name}
                      </span>
                      <span className="text-[10px] uppercase text-muted">
                        {problem.role === "canonical_easy" ? "canonical easy" : "medium"}
                      </span>
                    </label>
                  ))}
            </div>
          )}

          {pattern.hasExtendedLesson && pattern.bugTracingExercise && (
            <BugTracingPanel
              exercise={pattern.bugTracingExercise}
              visible={STAGE_ORDER.indexOf(pattern.stage) >= STAGE_ORDER.indexOf("mediums_done")}
            />
          )}

          <label className="mt-3 flex flex-col gap-1 text-xs text-muted">
            Notes (bugs found, misconceptions, etc.)
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => presenter.setPatternNotes(pattern.id, notes)}
              rows={2}
              className="rounded-md border border-border bg-transparent px-2 py-1 text-sm text-foreground"
            />
          </label>
        </div>
      )}
    </div>
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
    <div className="mb-6 rounded-md border border-border p-4">
      <div className="mb-3 text-sm font-medium">Log study session</div>
      <div className="mb-3 flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-border bg-transparent px-2 py-1 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Minutes spent
          <input
            type="number"
            min={0}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-28 rounded-md border border-border bg-transparent px-2 py-1 text-sm text-foreground"
          />
        </label>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {patterns.map((p) => (
          <button
            key={p.id}
            onClick={() => togglePattern(p.id)}
            className={`rounded-full border px-2 py-0.5 text-xs ${
              selectedPatternIds.has(p.id)
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:bg-surface"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <label className="mb-3 flex flex-col gap-1 text-xs text-muted">
        Sticking point
        <input
          type="text"
          value={stickingPoint}
          onChange={(e) => setStickingPoint(e.target.value)}
          className="rounded-md border border-border bg-transparent px-2 py-1 text-sm text-foreground"
        />
      </label>

      <label className="mb-3 flex flex-col gap-1 text-xs text-muted">
        Plan for next session
        <input
          type="text"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="rounded-md border border-border bg-transparent px-2 py-1 text-sm text-foreground"
        />
      </label>

      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={submitting}
          className="rounded-md bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          Save
        </button>
        <button onClick={onDone} className="rounded-md border border-border px-3 py-1.5 text-sm">
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
    <div className="mb-6 rounded-md border border-border p-4">
      <div className="mb-3 text-sm font-medium">Log timed mock interview result</div>

      <div className="mb-3 flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-border bg-transparent px-2 py-1 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Problem
          <input
            type="text"
            value={problemName}
            onChange={(e) => setProblemName(e.target.value)}
            placeholder="e.g. Course Schedule"
            className="rounded-md border border-border bg-transparent px-2 py-1 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Pattern
          <select
            value={patternId}
            onChange={(e) => setPatternId(e.target.value)}
            className="rounded-md border border-border bg-transparent px-2 py-1 text-sm text-foreground"
          >
            <option value="">(none)</option>
            {patterns.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Time taken (min)
          <input
            type="number"
            min={0}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-28 rounded-md border border-border bg-transparent px-2 py-1 text-sm text-foreground"
          />
        </label>
      </div>

      <div className="mb-3 flex flex-wrap gap-4 text-sm">
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

      <label className="mb-3 flex flex-col gap-1 text-xs text-muted">
        Notes
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-md border border-border bg-transparent px-2 py-1 text-sm text-foreground"
        />
      </label>

      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={submitting}
          className="rounded-md bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          Save
        </button>
        <button onClick={onDone} className="rounded-md border border-border px-3 py-1.5 text-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}
