"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { ThemeToggle } from "@/components/theme-toggle"
import { StudyPlanListPresenter, type StudyPlanListView } from "@/presenter/study-plan-list-presenter"
import { PageShell } from "@/components/ui/page-shell"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { RowListItem } from "@/components/ui/row-list-item"
import type { StudyPlanSummary, User } from "@/types"

export default function StudyPlanListPage() {
  return <AuthGate>{(user, logout) => <StudyPlanListContent user={user} logout={logout} />}</AuthGate>
}

function StudyPlanListContent({ user, logout }: { user: User; logout: () => void }) {
  const [plans, setPlans] = useState<StudyPlanSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [presenter] = useState(() => {
    const view: StudyPlanListView = { setLoading, setPlans, setError }
    return new StudyPlanListPresenter(view)
  })

  useEffect(() => {
    presenter.loadPlans()
  }, [presenter])

  async function handleDelete(id: string) {
    if (!confirm("Delete this study plan? All progress on it will be lost.")) return
    await presenter.deletePlan(id)
  }

  return (
    <PageShell>
      <PageHeader
        title="Study Plans"
        context="Independently-tracked prep plans, each with its own progress and schedule"
        action={
          <div className="flex items-center gap-3 whitespace-nowrap">
            <span className="text-xs text-text-2">{user.username}</span>
            <button onClick={logout} className="text-xs whitespace-nowrap text-accent hover:underline">
              Log out
            </button>
            <ThemeToggle />
            <Link
              href="/study-plan/new"
              className="flex min-h-[44px] items-center rounded-control bg-accent px-4 text-sm font-semibold text-bg"
            >
              + New plan
            </Link>
          </div>
        }
      />

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}
      {loading && <p className="text-sm text-text-2">Loading...</p>}

      {!loading && plans.length === 0 && (
        <EmptyState message="No study plans yet. Create one to start tracking your prep." />
      )}

      {!loading && plans.length > 0 && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {plans.map((plan) => (
            <RowListItem
              key={plan.id}
              href={`/study-plan/${plan.id}`}
              title={plan.name}
              subtitle={summaryLine(plan)}
              trailing={
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete(plan.id)
                  }}
                  className="text-sm text-text-2 hover:text-danger"
                >
                  Delete
                </button>
              }
            />
          ))}
        </div>
      )}
    </PageShell>
  )
}

function summaryLine(plan: StudyPlanSummary): string {
  const readyLine = `${plan.readyOrBetterPatterns}/${plan.totalPatterns} patterns ready`
  if (!plan.interviewDate) return readyLine

  const date = new Date(plan.interviewDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
  return `${readyLine} · Interview ${date}`
}
