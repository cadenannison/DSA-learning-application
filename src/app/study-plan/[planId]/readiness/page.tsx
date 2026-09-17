"use client"

import { use, useEffect, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { PlanNav } from "@/components/study-plan/plan-nav"
import { PageShell } from "@/components/ui/page-shell"
import { PageHeader } from "@/components/ui/page-header"
import { ProgressBar } from "@/components/ui/progress-bar"
import { StatusPill, type StatusTone } from "@/components/ui/status-pill"
import { StudyPlanPresenter } from "@/presenter/study-plan-presenter"
import type { ReadinessChecklistItem, ReadinessChecklistOverview, ReadinessTriState, User } from "@/types"

const TRI_STATE_LABELS: Record<ReadinessTriState, string> = {
  not_applicable: "Not applicable yet",
  needs_review: "Needs review",
  confirmed: "Confirmed",
}

const TRI_STATE_TONES: Record<ReadinessTriState, StatusTone> = {
  not_applicable: "neutral",
  needs_review: "warning",
  confirmed: "success",
}

export default function ReadinessPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params)
  return <AuthGate>{(user, logout) => <ReadinessContent planId={planId} user={user} logout={logout} />}</AuthGate>
}

function ReadinessContent({ planId, user, logout }: { planId: string; user: User; logout: () => void }) {
  const [checklist, setChecklist] = useState<ReadinessChecklistOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [presenter] = useState(
    () => new StudyPlanPresenter(planId, { setLoading: () => {}, setOverview: () => {}, setError: () => {} })
  )

  function load() {
    setLoading(true)
    presenter
      .loadReadinessChecklist()
      .then(setChecklist)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load readiness checklist"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presenter])

  async function toggleManual(itemId: string, checked: boolean) {
    const updated = await presenter.setReadinessChecklistItem(itemId, { checked })
    setChecklist(updated)
  }

  async function setTriState(itemId: string, triState: ReadinessTriState) {
    const updated = await presenter.setReadinessChecklistItem(itemId, { triState })
    setChecklist(updated)
  }

  if (loading && !checklist) {
    return (
      <PageShell>
        <p className="text-sm text-text-2">Loading readiness checklist...</p>
      </PageShell>
    )
  }

  if (error || !checklist) {
    return (
      <PageShell>
        <p className="text-sm text-danger">{error ?? "Failed to load"}</p>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader
        title="Readiness Checklist"
        action={
          <div className="flex items-center gap-3 whitespace-nowrap">
            <span className="text-xs text-text-2">{user.username}</span>
            <button onClick={logout} className="text-xs whitespace-nowrap text-accent hover:underline">
              Log out
            </button>
          </div>
        }
      />

      <PlanNav planId={planId} active="readiness" />

      <div className="space-y-6">
        <ChecklistSection
          title="OA Readiness"
          items={checklist.oaItems}
          completionFraction={checklist.oaCompletionFraction}
          onToggleManual={toggleManual}
          onSetTriState={setTriState}
        />
        <ChecklistSection
          title="Technical Interview Readiness"
          items={checklist.technicalItems}
          completionFraction={checklist.technicalCompletionFraction}
          onToggleManual={toggleManual}
          onSetTriState={setTriState}
        />
      </div>
    </PageShell>
  )
}

function ChecklistSection({
  title,
  items,
  completionFraction,
  onToggleManual,
  onSetTriState,
}: {
  title: string
  items: ReadinessChecklistItem[]
  completionFraction: number
  onToggleManual: (itemId: string, checked: boolean) => void
  onSetTriState: (itemId: string, triState: ReadinessTriState) => void
}) {
  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-1">{title}</h2>
        <span className="font-mono text-xs text-text-2">{Math.round(completionFraction * 100)}%</span>
      </div>
      <ProgressBar value={completionFraction * 100} complete={completionFraction >= 1} className="mb-4" />
      <div className="space-y-2">
        {items.map((item) => (
          <ChecklistRow
            key={item.id}
            item={item}
            onToggleManual={onToggleManual}
            onSetTriState={onSetTriState}
          />
        ))}
      </div>
    </section>
  )
}

function ChecklistRow({
  item,
  onToggleManual,
  onSetTriState,
}: {
  item: ReadinessChecklistItem
  onToggleManual: (itemId: string, checked: boolean) => void
  onSetTriState: (itemId: string, triState: ReadinessTriState) => void
}) {
  if (item.source === "tri_state") {
    const triState = item.triState ?? "not_applicable"
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-control px-2 py-1.5 text-sm">
        <span className="flex-1 text-text-1">{item.label}</span>
        <div className="flex gap-1.5">
          {(Object.keys(TRI_STATE_LABELS) as ReadinessTriState[]).map((option) => (
            <button
              key={option}
              onClick={() => onSetTriState(item.id, option)}
              className={
                triState === option
                  ? ""
                  : "opacity-50 transition-opacity hover:opacity-100"
              }
            >
              <StatusPill label={TRI_STATE_LABELS[option]} tone={TRI_STATE_TONES[option]} />
            </button>
          ))}
        </div>
      </div>
    )
  }

  const isDerived = item.source === "derived"

  return (
    <label
      className={`flex items-center gap-2 rounded-control px-2 py-1.5 text-sm ${
        isDerived ? "" : "hover:bg-surface-2"
      }`}
    >
      <input
        type="checkbox"
        checked={item.checked}
        disabled={isDerived}
        onChange={(e) => onToggleManual(item.id, e.target.checked)}
      />
      <span className={`flex-1 ${item.checked ? "text-text-2 line-through" : "text-text-1"}`}>
        {item.label}
      </span>
      {isDerived && <StatusPill label="Auto-tracked" tone="neutral" />}
    </label>
  )
}
