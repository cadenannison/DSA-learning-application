"use client"

import Link from "next/link"
import { use, useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import {
  BlindTestSetDetailPresenter,
  type BlindTestSetDetailView,
} from "@/presenter/blind-test-set-presenter"
import { PageShell } from "@/components/ui/page-shell"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
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

  if (loading) return <PageShell><p className="text-sm text-text-2">Loading set...</p></PageShell>
  if (error) return <PageShell><p className="text-sm text-danger">{error}</p></PageShell>
  if (!set) return null

  const memberIds = new Set(set.problemIds)

  return (
    <PageShell>
      <PageHeader
        title={set.name}
        action={
          <Link
            href={`/blind/sets/${set.id}/play`}
            className="flex min-h-[44px] items-center rounded-control bg-accent px-4 text-sm font-semibold text-bg"
          >
            Start random problem
          </Link>
        }
      />

      <h2 className="mb-2 text-sm font-medium text-text-2">
        Problems ({set.problemIds.length})
      </h2>
      {set.problemIds.length === 0 ? (
        <div className="mb-8">
          <EmptyState message="No problems in this set yet." />
        </div>
      ) : (
        <ul className="mb-8 overflow-hidden rounded-card border border-border bg-surface">
          {set.problemIds.map((problemId) => (
            <li
              key={problemId}
              className="flex min-h-[44px] items-center justify-between border-b border-border-soft px-4 py-2.5 text-sm text-text-1 last:border-b-0"
            >
              <span>{titles.get(problemId) ?? problemId}</span>
              <button
                onClick={() => presenter.removeProblem(set.id, problemId)}
                className="text-xs text-text-2 hover:text-danger"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-2 text-sm font-medium text-text-2">Add problems</h2>
      <input
        type="text"
        placeholder="Search by title..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-3 min-h-[44px] w-full rounded-control border border-border bg-surface px-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
      />
      {query && candidates.length > 0 && (
        <ul className="mb-6 max-h-64 overflow-y-auto rounded-card border border-border bg-surface">
          {candidates
            .filter((problem) => !memberIds.has(problem.id))
            .map((problem) => (
              <li
                key={problem.id}
                className="flex min-h-[44px] items-center justify-between border-b border-border-soft px-4 py-2 text-sm text-text-1 last:border-b-0"
              >
                <span>{problem.title}</span>
                <button
                  onClick={() => presenter.addProblems(set.id, [problem.id])}
                  className="min-h-[36px] rounded-control border border-border px-2 text-xs text-text-2 hover:bg-surface-2 hover:text-text-1"
                >
                  Add
                </button>
              </li>
            ))}
        </ul>
      )}
    </PageShell>
  )
}
