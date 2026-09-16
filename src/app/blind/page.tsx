"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { apiClient } from "@/lib/api-client"
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
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Blind Test Mode</h1>
        <ThemeToggle />
      </div>

      <p className="mb-4 text-sm text-muted">
        Pick a problem by name only. No pattern, no difficulty, no hints — identify the approach
        yourself, as in a real interview.
      </p>

      {loading && <p className="text-sm text-muted">Loading...</p>}

      <ul className="divide-y divide-border rounded-md border border-border">
        {titles.map((problem) => (
          <li key={problem.id}>
            <Link href={`/blind/${problem.id}`} className="block px-4 py-3 hover:bg-surface">
              {problem.title}
            </Link>
          </li>
        ))}
      </ul>

      <Link href="/" className="mt-4 inline-block text-sm text-muted hover:text-foreground">
        &larr; Back to library
      </Link>
    </main>
  )
}
