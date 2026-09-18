"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AuthGate } from "@/components/auth-gate"
import { ProfilePresenter, type ProfileData } from "@/presenter/profile-presenter"
import { PageShell } from "@/components/ui/page-shell"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusPill, type StatusTone } from "@/components/ui/status-pill"
import type {
  Difficulty,
  MockInterviewResult,
  OASessionHistoryEntry,
  SolvedProblemEntry,
  StudyPatternWithReadiness,
  User,
} from "@/types"

export default function ProfileStatsPage() {
  return <AuthGate>{(user) => <ProfileContent user={user} />}</AuthGate>
}

function ProfileContent({ user }: { user: User }) {
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [presenter] = useState(() => new ProfilePresenter({ setLoading, setData, setError }))

  useEffect(() => {
    presenter.load()
  }, [presenter])

  return (
    <PageShell>
      <PageHeader
        title="Stats"
        context="Session history, consistency, and mock interview log"
        action={
          <Link href="/profile" className="text-xs whitespace-nowrap text-accent hover:underline">
            ← {user.username}&rsquo;s settings
          </Link>
        }
      />

      {loading && !data && <p className="text-sm text-text-2">Loading stats...</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      {data && !data.stats?.totalAttempts && (
        <EmptyState message="No activity yet — solve a problem in Practice, Workbook, or Mock Interview mode to start building your stats." />
      )}

      {data && !!data.stats?.totalAttempts && <ProgressGrid data={data} />}
    </PageShell>
  )
}

function ProgressGrid({ data }: { data: ProfileData }) {
  return (
    <div className="grid flex-1 grid-cols-2 gap-5">
      <ActivityChartCard data={data} />
      <ConsistencyCard data={data} />
      <MasteryCard patterns={data.patterns} />
      <MockInterviewLogCard results={data.mockInterviewResults} />
      <OAMetricsCard data={data} />
      <SolvedByCategoryCard entries={data.solvedProblems} />
      <SolvedProblemsCard entries={data.solvedProblems} />
      <OASessionHistoryCard entries={data.oaHistory} />
    </div>
  )
}

function OAMetricsCard({ data }: { data: ProfileData }) {
  const metrics = data.stats?.oaMetrics ?? {
    sessionsCompleted: 0,
    problemsSolved: 0,
    totalTimeMs: 0,
    totalPoints: 0,
  }

  const tiles: { label: string; value: string }[] = [
    { label: "Sessions completed", value: String(metrics.sessionsCompleted) },
    { label: "Problems solved", value: String(metrics.problemsSolved) },
    { label: "Total time", value: formatDuration(metrics.totalTimeMs) },
    { label: "Total points", value: String(metrics.totalPoints) },
  ]

  return (
    <div className="rounded-card border border-border bg-surface p-[22px_24px]">
      <h2 className="mb-4 font-display text-[15.5px] font-semibold text-text-1">
        Mock OA metrics
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {tiles.map((tile) => (
          <div key={tile.label}>
            <div className="font-mono text-[22px] font-semibold text-text-1">{tile.value}</div>
            <div className="text-xs text-text-2">{tile.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OASessionHistoryCard({ entries }: { entries: OASessionHistoryEntry[] }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const sorted = useMemo(
    () => [...entries].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()),
    [entries]
  )

  const toggle = (sessionId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }

  return (
    <div className="col-span-2 rounded-card border border-border bg-surface p-[22px_24px]">
      <h2 className="mb-4 font-display text-[15.5px] font-semibold text-text-1">
        Mock OAs completed
      </h2>

      {sorted.length === 0 ? (
        <EmptyState message="No Mock OA sessions completed yet — finish one in Mock OA mode to see it here." />
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="pb-2.5 text-left text-[11.5px] font-medium uppercase tracking-wide text-text-3">
                Date
              </th>
              <th className="pb-2.5 text-left text-[11.5px] font-medium uppercase tracking-wide text-text-3">
                Passed
              </th>
              <th className="pb-2.5 text-left text-[11.5px] font-medium uppercase tracking-wide text-text-3">
                Total time
              </th>
              <th className="pb-2.5 text-left text-[11.5px] font-medium uppercase tracking-wide text-text-3">
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry) => {
              const expanded = expandedIds.has(entry.sessionId)
              return (
                <Fragment key={entry.sessionId}>
                  <tr
                    onClick={() => toggle(entry.sessionId)}
                    className="cursor-pointer select-none"
                  >
                    <td className="border-t border-border-soft py-2.5 text-[13.5px] text-text-1">
                      {new Date(entry.completedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="border-t border-border-soft py-2.5 text-[13.5px] text-text-1">
                      {entry.problemsPassed}/{entry.problemsTotal}
                    </td>
                    <td className="border-t border-border-soft py-2.5 text-[13.5px] text-text-1">
                      {formatDuration(entry.totalTimeMs)}
                    </td>
                    <td className="border-t border-border-soft py-2.5 text-[13.5px] text-text-1">
                      {entry.totalPoints}
                    </td>
                  </tr>
                  {expanded && (
                    <tr>
                      <td colSpan={4} className="border-t border-border-soft bg-surface-2 p-3">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className="pb-2 text-left text-[11px] font-medium uppercase tracking-wide text-text-3">
                                Problem
                              </th>
                              <th className="pb-2 text-left text-[11px] font-medium uppercase tracking-wide text-text-3">
                                Difficulty
                              </th>
                              <th className="pb-2 text-left text-[11px] font-medium uppercase tracking-wide text-text-3">
                                Time
                              </th>
                              <th className="pb-2 text-left text-[11px] font-medium uppercase tracking-wide text-text-3">
                                Points
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {entry.problems.map((problem, index) => (
                              <tr key={`${problem.problemId}-${index}`}>
                                <td className="max-w-[240px] truncate py-1.5 text-[13px] text-text-1">
                                  {problem.problemName}
                                </td>
                                <td className="py-1.5">
                                  {problem.difficulty ? (
                                    <StatusPill
                                      label={problem.difficulty}
                                      tone={DIFFICULTY_TONES[problem.difficulty]}
                                    />
                                  ) : (
                                    <span className="text-[13px] text-text-3">—</span>
                                  )}
                                </td>
                                <td className="py-1.5 text-[13px] text-text-1">
                                  {formatDuration(problem.durationMs)}
                                </td>
                                <td className="py-1.5 text-[13px] text-text-1">{problem.points}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

function ActivityChartCard({ data }: { data: ProfileData }) {
  const days = data.dailyActivity?.days ?? []
  const total = days.reduce((sum, d) => sum + d.solvedCount, 0)

  const { pathD, areaD, width, height } = useMemo(() => {
    const w = 560
    const h = 140
    if (days.length === 0) return { pathD: "", areaD: "", width: w, height: h }

    const max = Math.max(1, ...days.map((d) => d.solvedCount))
    const stepX = w / Math.max(1, days.length - 1)
    const points = days.map((d, i) => {
      const x = i * stepX
      const y = h - (d.solvedCount / max) * (h - 12) - 6
      return [x, y]
    })

    const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ")
    const area = `${line} L${w},${h} L0,${h} Z`
    return { pathD: line, areaD: area, width: w, height: h }
  }, [days])

  const labelIndexes = days.length > 0 ? [0, Math.floor(days.length / 2), days.length - 1] : []

  return (
    <div className="rounded-card border border-border bg-surface p-[22px_24px]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[15.5px] font-semibold text-text-1">
          Problems solved · last {days.length || 14} days
        </h2>
        <StatusPill label={`+${total} total`} tone="success" />
      </div>

      {days.length === 0 ? (
        <EmptyState message="Not enough activity yet to chart." />
      ) : (
        <>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
            <path d={areaD} fill="var(--accent)" opacity={0.08} />
            <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
          </svg>
          <div className="mt-2 flex justify-between font-mono text-[11px] text-text-3">
            {labelIndexes.map((i) => (
              <span key={i}>
                {new Date(`${days[i].date}T00:00:00Z`).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ConsistencyCard({ data }: { data: ProfileData }) {
  const days = data.dailyActivity?.days ?? []
  const todayKey = new Date().toISOString().slice(0, 10)
  const max = Math.max(1, ...days.map((d) => d.solvedCount))

  return (
    <div className="rounded-card border border-border bg-surface p-[22px_24px]">
      <h2 className="mb-4 font-display text-[15.5px] font-semibold text-text-1">Consistency</h2>

      {days.length === 0 ? (
        <EmptyState message="Not enough activity yet." />
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => {
              const isToday = day.date === todayKey
              const opacity = day.solvedCount === 0 ? 0 : 0.35 + 0.65 * (day.solvedCount / max)
              return (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.solvedCount} solved`}
                  className={`aspect-square rounded-[4px] ${
                    isToday ? "border border-dashed border-accent bg-accent-soft" : "bg-surface-2"
                  }`}
                  style={
                    !isToday && day.solvedCount > 0
                      ? { backgroundColor: `rgba(52, 211, 153, ${opacity})` }
                      : undefined
                  }
                />
              )
            })}
          </div>

          <div className="mt-3.5 font-mono text-[22px] font-semibold text-text-1">
            {data.stats?.currentStreakDays ?? 0}-day streak
          </div>
          <div className="text-xs text-text-2">Best: {data.stats?.longestStreakDays ?? 0} days</div>
        </>
      )}
    </div>
  )
}

function MasteryCard({ patterns }: { patterns: StudyPatternWithReadiness[] }) {
  const rows = useMemo(
    () =>
      [...patterns]
        .map((pattern) => {
          const total = pattern.problems.length
          const done = pattern.problems.filter((p) => p.completed).length
          const pct = total > 0 ? Math.round((done / total) * 100) : 0
          return { id: pattern.id, name: pattern.name, pct }
        })
        .sort((a, b) => b.pct - a.pct),
    [patterns]
  )

  return (
    <div className="rounded-card border border-border bg-surface p-[22px_24px]">
      <h2 className="mb-4 font-display text-[15.5px] font-semibold text-text-1">
        Mastery by pattern
      </h2>

      {rows.length === 0 ? (
        <EmptyState message="No patterns tracked yet." />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-3">
              <span className="w-[120px] shrink-0 truncate text-[12.5px] text-text-2">
                {row.name}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full ${row.pct >= 70 ? "bg-success" : "bg-accent"}`}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-mono text-[11.5px] text-text-2">
                {row.pct}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const RESULT_LABELS: Record<"solved" | "partial" | "timed_out", string> = {
  solved: "Solved",
  partial: "Partial",
  timed_out: "Timed out",
}

const RESULT_TONES: Record<"solved" | "partial" | "timed_out", StatusTone> = {
  solved: "success",
  partial: "warning",
  timed_out: "danger",
}

function classifyResult(result: MockInterviewResult): "solved" | "partial" | "timed_out" {
  if (result.solvedCleanly) return "solved"
  if (result.constraintAddedMidSolve) return "partial"
  return "timed_out"
}

function MockInterviewLogCard({ results }: { results: MockInterviewResult[] }) {
  const sorted = useMemo(
    () => [...results].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [results]
  )

  return (
    <div className="rounded-card border border-border bg-surface p-[22px_24px]">
      <h2 className="mb-4 font-display text-[15.5px] font-semibold text-text-1">
        Mock interview log
      </h2>

      {sorted.length === 0 ? (
        <EmptyState message="No mock interviews logged yet." />
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="pb-2.5 text-left text-[11.5px] font-medium uppercase tracking-wide text-text-3">
                Date
              </th>
              <th className="pb-2.5 text-left text-[11.5px] font-medium uppercase tracking-wide text-text-3">
                Pattern
              </th>
              <th className="pb-2.5 text-left text-[11.5px] font-medium uppercase tracking-wide text-text-3">
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((result) => {
              const outcome = classifyResult(result)
              return (
                <tr key={result.id}>
                  <td className="border-t border-border-soft py-2.5 text-[13.5px] text-text-1">
                    {new Date(result.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="border-t border-border-soft py-2.5 text-[13.5px] text-text-1">
                    {result.problemName}
                  </td>
                  <td className="border-t border-border-soft py-2.5">
                    <StatusPill label={RESULT_LABELS[outcome]} tone={RESULT_TONES[outcome]} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

const DIFFICULTY_TONES: Record<Difficulty, StatusTone> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
}

const SOLVED_PROBLEMS_LIMIT = 20

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

function SolvedProblemsCard({ entries }: { entries: SolvedProblemEntry[] }) {
  const sorted = useMemo(
    () =>
      [...entries]
        .sort((a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime())
        .slice(0, SOLVED_PROBLEMS_LIMIT),
    [entries]
  )

  return (
    <div className="col-span-2 rounded-card border border-border bg-surface p-[22px_24px]">
      <h2 className="mb-4 font-display text-[15.5px] font-semibold text-text-1">
        Solved problems
      </h2>

      {sorted.length === 0 ? (
        <EmptyState message="No solved problems yet — solve one in Practice or the Workbook to see it here." />
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="pb-2.5 text-left text-[11.5px] font-medium uppercase tracking-wide text-text-3">
                Date
              </th>
              <th className="pb-2.5 text-left text-[11.5px] font-medium uppercase tracking-wide text-text-3">
                Problem
              </th>
              <th className="pb-2.5 text-left text-[11.5px] font-medium uppercase tracking-wide text-text-3">
                Difficulty
              </th>
              <th className="pb-2.5 text-left text-[11.5px] font-medium uppercase tracking-wide text-text-3">
                Time
              </th>
              <th className="pb-2.5 text-left text-[11.5px] font-medium uppercase tracking-wide text-text-3">
                Lines
              </th>
              <th className="pb-2.5 text-left text-[11.5px] font-medium uppercase tracking-wide text-text-3">
                Tests
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, index) => (
              <tr key={`${entry.problemId}-${entry.solvedAt}-${index}`}>
                <td className="border-t border-border-soft py-2.5 text-[13.5px] text-text-1">
                  {new Date(entry.solvedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="max-w-[280px] truncate border-t border-border-soft py-2.5 text-[13.5px] text-text-1">
                  {entry.problemName}
                </td>
                <td className="border-t border-border-soft py-2.5">
                  {entry.difficulty ? (
                    <StatusPill
                      label={entry.difficulty}
                      tone={DIFFICULTY_TONES[entry.difficulty]}
                    />
                  ) : (
                    <span className="text-[13.5px] text-text-3">—</span>
                  )}
                </td>
                <td className="border-t border-border-soft py-2.5 text-[13.5px] text-text-1">
                  {formatDuration(entry.durationMs)}
                </td>
                <td className="border-t border-border-soft py-2.5 text-[13.5px] text-text-1">
                  {entry.linesOfCode}
                </td>
                <td className="border-t border-border-soft py-2.5 text-[13.5px] text-text-1">
                  {entry.testsPassed !== null && entry.testsTotal !== null
                    ? `${entry.testsPassed}/${entry.testsTotal}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

type CategoryBreakdown = "pattern" | "company" | "difficulty"

const CATEGORY_BREAKDOWN_LABELS: Record<CategoryBreakdown, string> = {
  pattern: "Pattern",
  company: "Company",
  difficulty: "Difficulty",
}

/** Cycled through in order for each slice — the four theme tones first (matching the rest of
 * the page's palette), then a handful of extra fixed hues since a "by pattern" breakdown can
 * have more categories (14 DsaPatterns) than the theme defines named colors for. */
const PIE_SLICE_COLORS = [
  "var(--accent)",
  "var(--success)",
  "var(--warning)",
  "var(--danger)",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#14b8a6",
  "#6366f1",
  "#eab308",
  "#e11d48",
  "#0ea5e9",
]

function categoryKeysForEntry(entry: SolvedProblemEntry, breakdown: CategoryBreakdown): string[] {
  if (breakdown === "pattern") return entry.pattern ? [entry.pattern] : []
  if (breakdown === "difficulty") return entry.difficulty ? [entry.difficulty] : []
  // Company: an entry can list 0-N companies — tally it once per company rather than picking
  // just one, so a problem tagged both "Google" and "Meta" contributes a count to each slice.
  return entry.companies
}

/** Hand-rolled SVG donut chart using the classic stacked-circles trick (overlapping
 * <circle> elements, each with a stroke-dasharray covering only its own share of the
 * circumference and a stroke-dashoffset rotating it into place) rather than computing arc
 * paths — plenty for a small stats-page chart and avoids a charting dependency this codebase
 * doesn't otherwise have. */
function DonutChart({ slices }: { slices: { label: string; count: number; color: string }[] }) {
  const size = 160
  const strokeWidth = 26
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const total = slices.reduce((sum, s) => sum + s.count, 0)

  // Precomputed (rather than mutating a running offset inside the .map below) so each slice's
  // rotation is a pure function of the slices before it — no render-time mutation.
  const cumulativeOffsets: number[] = []
  slices.reduce((offset, slice) => {
    cumulativeOffsets.push(offset)
    const dash = total > 0 ? (slice.count / total) * circumference : 0
    return offset + dash
  }, 0)

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--surface-2)"
        strokeWidth={strokeWidth}
      />
      {slices.map((slice, index) => {
        const fraction = total > 0 ? slice.count / total : 0
        const dash = fraction * circumference
        const dashArray = `${dash} ${circumference - dash}`
        const dashOffset = -cumulativeOffsets[index]
        return (
          <circle
            key={slice.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )
      })}
    </svg>
  )
}

function SolvedByCategoryCard({ entries }: { entries: SolvedProblemEntry[] }) {
  const [breakdown, setBreakdown] = useState<CategoryBreakdown>("pattern")

  const slices = useMemo(() => {
    const counts = new Map<string, number>()
    for (const entry of entries) {
      for (const key of categoryKeysForEntry(entry, breakdown)) {
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count], index) => ({
        label,
        count,
        color: PIE_SLICE_COLORS[index % PIE_SLICE_COLORS.length],
      }))
  }, [entries, breakdown])

  const total = slices.reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="rounded-card border border-border bg-surface p-[22px_24px]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-[15.5px] font-semibold text-text-1">
          Solved by {CATEGORY_BREAKDOWN_LABELS[breakdown].toLowerCase()}
        </h2>
        <div className="flex gap-1">
          {(Object.keys(CATEGORY_BREAKDOWN_LABELS) as CategoryBreakdown[]).map((option) => (
            <button
              key={option}
              onClick={() => setBreakdown(option)}
              className={`min-h-[28px] rounded-control border px-2.5 text-[11.5px] font-medium ${
                breakdown === option
                  ? "border-accent bg-accent-soft text-text-1"
                  : "border-border text-text-2 hover:bg-surface-2 hover:text-text-1"
              }`}
            >
              {CATEGORY_BREAKDOWN_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <EmptyState message="No solved problems with category data yet." />
      ) : (
        <div className="flex items-center gap-6">
          <DonutChart slices={slices} />
          <ul className="min-w-0 flex-1 space-y-1.5">
            {slices.map((slice) => (
              <li key={slice.label} className="flex items-center gap-2 text-[12.5px]">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="min-w-0 flex-1 truncate text-text-1">{slice.label}</span>
                <span className="shrink-0 font-mono text-text-2">{slice.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
