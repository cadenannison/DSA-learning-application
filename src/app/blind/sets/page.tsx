"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { BlindTestSetListPresenter, type BlindTestSetListView } from "@/presenter/blind-test-set-presenter"
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
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Test Sets</h1>
        <ThemeToggle />
      </div>

      <p className="mb-4 text-sm text-muted">
        Named groups of problems for randomized blind testing. Build a set by searching the
        library, or auto-fill one from selected patterns and difficulties.
      </p>

      <Link
        href="/blind/sets/new"
        className="mb-6 inline-block rounded-md bg-accent px-4 py-2 text-sm text-white"
      >
        + New set
      </Link>

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {loading && <p className="text-sm text-muted">Loading...</p>}

      {!loading && sets.length === 0 && (
        <p className="rounded-md border border-border px-4 py-6 text-center text-sm text-muted">
          No sets yet. Create one to start randomized blind testing.
        </p>
      )}

      <ul className="divide-y divide-border rounded-md border border-border">
        {sets.map((set) => (
          <li key={set.id} className="flex items-center justify-between px-4 py-3">
            <Link href={`/blind/sets/${set.id}`} className="flex-1 hover:underline">
              <div className="font-medium">{set.name}</div>
              <div className="text-xs text-muted">
                {set.problemCount} problem{set.problemCount === 1 ? "" : "s"}
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href={`/blind/sets/${set.id}/play`}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface"
              >
                Random
              </Link>
              <button
                onClick={() => handleDelete(set.id)}
                className="text-sm text-muted hover:text-red-600 dark:hover:text-red-400"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Link href="/blind" className="mt-4 inline-block text-sm text-muted hover:text-foreground">
        &larr; Back to blind test
      </Link>
    </main>
  )
}
