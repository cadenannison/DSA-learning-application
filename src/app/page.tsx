"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { LibraryPresenter } from "@/presenter/library-presenter"
import { ThemeToggle } from "@/components/theme-toggle"
import { apiClient } from "@/lib/api-client"
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
  const [company, setCompany] = useState<string>("")
  const [query, setQuery] = useState("")
  const [companies, setCompanies] = useState<string[]>([])
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  const [presenter] = useState(
    () =>
      new LibraryPresenter({
        setLoading,
        setProblems,
        setError,
        updateProblems: (update) => setProblems((prev) => update(prev)),
      })
  )

  useEffect(() => {
    presenter.loadProblems({
      pattern: pattern || undefined,
      difficulty: difficulty || undefined,
      company: company || undefined,
      query: query || undefined,
      favorite: favoritesOnly || undefined,
    })
  }, [presenter, pattern, difficulty, company, query, favoritesOnly])

  useEffect(() => {
    apiClient
      .listCompanies()
      .then(setCompanies)
      .catch(() => setCompanies([]))
  }, [])

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
        <select
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="rounded-md border border-border bg-transparent px-3 py-1.5 text-sm"
        >
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setFavoritesOnly((prev) => !prev)}
          aria-pressed={favoritesOnly}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            favoritesOnly
              ? "border-accent bg-accent text-white"
              : "border-border text-foreground hover:bg-surface"
          }`}
        >
          ★ Favorites
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {loading && <p className="text-sm text-muted">Loading problems...</p>}

      {!loading && !error && (
        <ul className="divide-y divide-border rounded-md border border-border">
          {problems.map((problem) => (
            <li key={problem.id} className="flex items-center">
              <button
                type="button"
                onClick={() => presenter.toggleFavorite(problem.id, !problem.favorited)}
                aria-label={problem.favorited ? "Remove from favorites" : "Add to favorites"}
                aria-pressed={problem.favorited}
                className={`px-3 py-3 text-lg transition-colors ${
                  problem.favorited ? "text-amber-500" : "text-muted hover:text-amber-500"
                }`}
              >
                {problem.favorited ? "★" : "☆"}
              </button>
              <Link
                href={`/problems/${problem.id}`}
                className="flex flex-1 items-center justify-between py-3 pr-4 hover:bg-surface"
              >
                <div>
                  <div className="font-medium">{problem.title}</div>
                  <div className="text-xs text-muted">
                    {PATTERN_LABELS[problem.pattern]}
                    {problem.companies.length > 0 && ` · ${problem.companies.join(", ")}`}
                  </div>
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
            <li className="px-4 py-6 text-center text-sm text-muted">
              {favoritesOnly ? "No favorited problems yet." : "No problems match these filters."}
            </li>
          )}
        </ul>
      )}
    </main>
  )
}
