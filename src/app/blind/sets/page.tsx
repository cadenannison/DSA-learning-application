"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { BlindTestSetListPresenter, type BlindTestSetListView } from "@/presenter/blind-test-set-presenter"
import { PageShell } from "@/components/ui/page-shell"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import type { BlindTestSetSummary } from "@/types"

export default function BlindTestSetsPage() {
  const [sets, setSets] = useState<BlindTestSetSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [presenter] = useState(() => {
    const view: BlindTestSetListView = { setLoading, setSets, setError }
    return new BlindTestSetListPresenter(view)
  })

  useEffect(() => {
    presenter.loadSets()
  }, [presenter])

  async function handleDelete(id: string) {
    if (!confirm("Delete this set?")) return
    await presenter.deleteSet(id)
  }

  return (
    <PageShell>
      <PageHeader
        title="Test Sets"
        context="Named groups of problems for randomized blind testing"
        action={
          <Link
            href="/blind/sets/new"
            className="flex min-h-[44px] items-center rounded-control bg-accent px-4 text-sm font-semibold text-bg"
          >
            + New set
          </Link>
        }
      />

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}
      {loading && <p className="text-sm text-text-2">Loading...</p>}

      {!loading && sets.length === 0 && (
        <EmptyState message="No sets yet. Create one to start randomized blind testing." />
      )}

      {!loading && sets.length > 0 && (
        <ul className="overflow-hidden rounded-card border border-border bg-surface">
          {sets.map((set) => (
            <li
              key={set.id}
              className="flex min-h-[44px] items-center justify-between border-b border-border-soft px-4 py-3 last:border-b-0"
            >
              <Link href={`/blind/sets/${set.id}`} className="flex-1 hover:underline">
                <div className="text-sm font-medium text-text-1">{set.name}</div>
                <div className="text-xs text-text-2">
                  {set.problemCount} problem{set.problemCount === 1 ? "" : "s"}
                </div>
              </Link>
              <div className="flex items-center gap-3">
                <Link
                  href={`/blind/sets/${set.id}/play`}
                  className="flex min-h-[44px] items-center rounded-control border border-border px-3 text-sm text-text-2 hover:bg-surface-2 hover:text-text-1"
                >
                  Random
                </Link>
                <button
                  onClick={() => handleDelete(set.id)}
                  className="text-sm text-text-2 hover:text-danger"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  )
}
