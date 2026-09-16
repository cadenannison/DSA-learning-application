"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { LibraryPresenter } from "@/presenter/library-presenter"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Difficulty, DsaPattern, ProblemSummary } from "@/types"

const PATTERN_LABELS: Record<DsaPattern, string> = {
  "arrays-two-pointers": "Arrays / Two Pointers",
  "sliding-window": "Sliding Window",
  "binary-search": "Binary Search",
  "linked-list": "Linked List",
  trees: "Trees",
  "bfs-dfs": "BFS / DFS",
  heaps: "Heaps",
  backtracking: "Backtracking",
  intervals: "Intervals",
  graphs: "Graphs",
  "dynamic-programming": "Dynamic Programming",
  greedy: "Greedy",
  tries: "Tries",
  "stacks-queues": "Stacks / Queues",
}

const STATUS_LABELS: Record<ProblemSummary["progressStatus"], string> = {
  not_started: "Not started",
  attempted: "Attempted",
  solved: "Solved",
  mastered: "Mastered",
}

const STATUS_COLORS: Record<ProblemSummary["progressStatus"], string> = {
  not_started: "text-muted",
  attempted: "text-amber-600 dark:text-amber-400",
  solved: "text-blue-600 dark:text-blue-400",
  mastered: "text-green-600 dark:text-green-400",
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "text-green-600 dark:text-green-400",
  medium: "text-amber-600 dark:text-amber-400",
  hard: "text-red-600 dark:text-red-400",
}

export default function LibraryPage() {
  const [problems, setProblems] = useState<ProblemSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pattern, setPattern] = useState<DsaPattern | "">("")
  const [difficulty, setDifficulty] = useState<Difficulty | "">("")
  const [query, setQuery] = useState("")

  const [presenter] = useState(
    () =>
      new LibraryPresenter({
        setLoading,
        setProblems,
        setError,
      })
  )

  useEffect(() => {
    presenter.loadProblems({
      pattern: pattern || undefined,
      difficulty: difficulty || undefined,
      query: query || undefined,
    })
  }, [presenter, pattern, difficulty, query])

  const patterns = Object.keys(PATTERN_LABELS) as DsaPattern[]

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">DSA Practice</h1>
        <ThemeToggle />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search by title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-md border border-border bg-transparent px-3 py-1.5 text-sm"
        />
        <select
          value={pattern}
          onChange={(e) => setPattern(e.target.value as DsaPattern | "")}
          className="rounded-md border border-border bg-transparent px-3 py-1.5 text-sm"
        >
          <option value="">All patterns</option>
          {patterns.map((p) => (
            <option key={p} value={p}>
              {PATTERN_LABELS[p]}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty | "")}
          className="rounded-md border border-border bg-transparent px-3 py-1.5 text-sm"
        >
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <Link
          href="/blind"
          className="ml-auto rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface"
        >
          Blind Test Mode
        </Link>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {loading && <p className="text-sm text-muted">Loading problems...</p>}

      {!loading && !error && (
        <ul className="divide-y divide-border rounded-md border border-border">
          {problems.map((problem) => (
            <li key={problem.id}>
              <Link
                href={`/problems/${problem.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface"
              >
                <div>
                  <div className="font-medium">{problem.title}</div>
                  <div className="text-xs text-muted">{PATTERN_LABELS[problem.pattern]}</div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className={DIFFICULTY_COLORS[problem.difficulty]}>{problem.difficulty}</span>
                  <span className={STATUS_COLORS[problem.progressStatus]}>
                    {STATUS_LABELS[problem.progressStatus]}
                  </span>
                </div>
              </Link>
            </li>
          ))}
          {problems.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted">No problems match these filters.</li>
          )}
        </ul>
      )}
    </main>
  )
}
