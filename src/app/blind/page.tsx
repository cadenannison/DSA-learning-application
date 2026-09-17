"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { PageShell } from "@/components/ui/page-shell"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import type { ProblemSummary } from "@/types"

export default function BlindTestListPage() {
  const [titles, setTitles] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient
      .listProblems()
      .then((problems: ProblemSummary[]) =>
        setTitles(problems.map((p) => ({ id: p.id, title: p.title })))
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageShell>
      <PageHeader
        title="Workbook"
        context="Pick a problem by name only — identify the approach yourself, as in a real interview"
      />

      <Link
        href="/blind/sets"
        className="mb-8 flex min-h-[44px] items-center justify-between rounded-card border border-accent/40 bg-accent-soft px-4 py-3 text-sm hover:bg-accent/20"
      >
        <div>
          <div className="font-medium text-text-1">Test Sets</div>
          <div className="text-xs text-text-2">
            Build named sets of problems for random blind testing
          </div>
        </div>
        <span aria-hidden className="text-accent">&rarr;</span>
      </Link>

      <h2 className="mb-2 text-sm font-medium text-text-2">All problems</h2>

      {loading && <p className="text-sm text-text-2">Loading...</p>}

      {!loading && titles.length === 0 && <EmptyState message="No problems available yet." />}

      {!loading && titles.length > 0 && (
        <ul className="overflow-hidden rounded-card border border-border bg-surface">
          {titles.map((problem) => (
            <li key={problem.id} className="border-b border-border-soft last:border-b-0">
              <Link
                href={`/blind/${problem.id}`}
                className="flex min-h-[44px] items-center px-4 py-3 text-sm text-text-1 hover:bg-surface-2"
              >
                {problem.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  )
}
