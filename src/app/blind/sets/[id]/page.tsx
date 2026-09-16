"use client"

import Link from "next/link"
import { use, useEffect, useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { apiClient } from "@/lib/api-client"
import {
  BlindTestSetDetailPresenter,
  type BlindTestSetDetailView,
} from "@/presenter/blind-test-set-presenter"
import type { BlindTestSet, ProblemSummary } from "@/types"

export default function BlindTestSetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [set, setSet] = useState<BlindTestSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [titles, setTitles] = useState<Map<string, string>>(new Map())

  const [query, setQuery] = useState("")
  const [candidates, setCandidates] = useState<ProblemSummary[]>([])

  const [presenter] = useState(() => {
    const view: BlindTestSetDetailView = { setLoading, setSet, setError }
    return new BlindTestSetDetailPresenter(view)
  })

  useEffect(() => {
    presenter.loadSet(id)
  }, [presenter, id])

  useEffect(() => {
    apiClient
      .listProblems()
      .then((problems) => setTitles(new Map(problems.map((p) => [p.id, p.title]))))
      .catch(() => setTitles(new Map()))
  }, [])

  useEffect(() => {
    if (!query) return

    let cancelled = false
    apiClient
      .listProblems({ query })
      .then((results) => {
        if (!cancelled) setCandidates(results)
      })
      .catch(() => {
        if (!cancelled) setCandidates([])
      })

    return () => {
      cancelled = true
    }
  }, [query])

  if (loading) return <main className="p-8 text-sm text-muted">Loading set...</main>
  if (error) return <main className="p-8 text-sm text-red-600 dark:text-red-400">{error}</main>
  if (!set) return null

  const memberIds = new Set(set.problemIds)

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{set.name}</h1>
        <ThemeToggle />
      </div>

      <Link
        href={`/blind/sets/${set.id}/play`}
        className="mb-6 inline-block rounded-md bg-accent px-4 py-2 text-sm text-white"
      >
        Start random problem
      </Link>

      <h2 className="mb-2 text-sm font-medium">
        Problems ({set.problemIds.length})
      </h2>
      <ul className="mb-6 divide-y divide-border rounded-md border border-border">
        {set.problemIds.map((problemId) => (
          <li key={problemId} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span>{titles.get(problemId) ?? problemId}</span>
            <button
              onClick={() => presenter.removeProblem(set.id, problemId)}
              className="text-xs text-muted hover:text-red-600 dark:hover:text-red-400"
            >
              Remove
            </button>
          </li>
        ))}
        {set.problemIds.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-muted">No problems in this set yet.</li>
        )}
      </ul>

      <h2 className="mb-2 text-sm font-medium">Add problems</h2>
      <input
        type="text"
        placeholder="Search by title..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-3 w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm"
      />
      {query && candidates.length > 0 && (
        <ul className="mb-6 max-h-64 divide-y divide-border overflow-y-auto rounded-md border border-border">
          {candidates
            .filter((problem) => !memberIds.has(problem.id))
            .map((problem) => (
              <li key={problem.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>{problem.title}</span>
                <button
                  onClick={() => presenter.addProblems(set.id, [problem.id])}
                  className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface"
                >
                  Add
                </button>
              </li>
            ))}
        </ul>
      )}

      <Link href="/blind/sets" className="text-sm text-muted hover:text-foreground">
        &larr; Back to test sets
      </Link>
    </main>
  )
}
