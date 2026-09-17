"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AuthGate } from "@/components/auth-gate"
import { ProfilePresenter, type ProfileData } from "@/presenter/profile-presenter"
import { PageShell } from "@/components/ui/page-shell"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusPill, type StatusTone } from "@/components/ui/status-pill"
import type { MockInterviewResult, StudyPatternWithReadiness, User } from "@/types"

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
