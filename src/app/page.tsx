"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { LibraryPresenter } from "@/presenter/library-presenter"
import { apiClient } from "@/lib/api-client"
import { PageShell } from "@/components/ui/page-shell"
import { PageHeader } from "@/components/ui/page-header"
import { StatusPill, type StatusTone } from "@/components/ui/status-pill"
import { EmptyState } from "@/components/ui/empty-state"
import type { Difficulty, DsaPattern, ProblemSummary } from "@/types"

type StatusFilter = "not_started" | "attempted" | "completed"

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

const STATUS_TONES: Record<ProblemSummary["progressStatus"], StatusTone> = {
  not_started: "neutral",
  attempted: "accent",
  solved: "success",
  mastered: "success",
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "text-success",
  medium: "text-warning",
  hard: "text-danger",
}

const PAGE_SIZE = 20

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter | "">("")
  const [page, setPage] = useState(1)

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

  useEffect(() => {
    setPage(1)
  }, [pattern, difficulty, company, query, favoritesOnly, statusFilter])

  const patterns = Object.keys(PATTERN_LABELS) as DsaPattern[]

  const filteredProblems = statusFilter
    ? problems.filter((problem) =>
        statusFilter === "completed"
          ? problem.progressStatus === "solved" || problem.progressStatus === "mastered"
          : problem.progressStatus === statusFilter
      )
    : problems

  const totalPages = Math.max(1, Math.ceil(filteredProblems.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const visibleProblems = filteredProblems.slice(pageStart, pageStart + PAGE_SIZE)

  return (
    <PageShell>
      <PageHeader title="Library" context="Browse and filter the full problem set" />

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search by title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-[44px] rounded-control border border-border bg-surface px-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
        />
        <select
          value={pattern}
          onChange={(e) => setPattern(e.target.value as DsaPattern | "")}
          className="min-h-[44px] rounded-control border border-border bg-surface px-3 text-sm text-text-1 focus:border-accent focus:outline-none"
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
          className="min-h-[44px] rounded-control border border-border bg-surface px-3 text-sm text-text-1 focus:border-accent focus:outline-none"
        >
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="min-h-[44px] rounded-control border border-border bg-surface px-3 text-sm text-text-1 focus:border-accent focus:outline-none"
        >
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter | "")}
          className="min-h-[44px] rounded-control border border-border bg-surface px-3 text-sm text-text-1 focus:border-accent focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="not_started">Not started</option>
          <option value="attempted">Attempted</option>
          <option value="completed">Completed</option>
        </select>
        <button
          type="button"
          onClick={() => setFavoritesOnly((prev) => !prev)}
          aria-pressed={favoritesOnly}
          aria-label="Show favorites only"
          className={`min-h-[44px] rounded-control border px-3 text-sm transition-colors ${
            favoritesOnly
              ? "border-accent bg-accent-soft text-accent"
              : "border-border text-text-2 hover:bg-surface-2 hover:text-text-1"
          }`}
        >
          ★ Favorites
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {loading && <p className="text-sm text-text-2">Loading problems...</p>}

      {!loading && !error && filteredProblems.length === 0 && (
        <EmptyState
          message={favoritesOnly ? "No favorited problems yet." : "No problems match these filters."}
        />
      )}

      {!loading && !error && filteredProblems.length > 0 && (
        <ul className="divide-y divide-border-soft rounded-card border border-border bg-surface">
          {visibleProblems.map((problem) => (
            <li key={problem.id} className="flex items-center">
              <button
                type="button"
                onClick={() => presenter.toggleFavorite(problem.id, !problem.favorited)}
                aria-label={problem.favorited ? "Remove from favorites" : "Add to favorites"}
                aria-pressed={problem.favorited}
                className={`flex min-h-[44px] min-w-[44px] items-center justify-center text-lg transition-colors ${
                  problem.favorited ? "text-warning" : "text-text-3 hover:text-warning"
                }`}
              >
                {problem.favorited ? "★" : "☆"}
              </button>
              <Link
                href={`/problems/${problem.id}`}
                className="flex min-h-[44px] flex-1 items-center justify-between py-3 pr-4 hover:bg-surface-2"
              >
                <div>
                  <div className="text-sm font-medium text-text-1">{problem.title}</div>
                  <div className="text-xs text-text-2">
                    {PATTERN_LABELS[problem.pattern]}
                    {problem.companies.length > 0 && ` · ${problem.companies.join(", ")}`}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-mono text-xs ${DIFFICULTY_COLORS[problem.difficulty]}`}>
                    {problem.difficulty}
                  </span>
                  <StatusPill
                    label={STATUS_LABELS[problem.progressStatus]}
                    tone={STATUS_TONES[problem.progressStatus]}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-text-2">
            Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filteredProblems.length)} of{" "}
            {filteredProblems.length} problems
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="shine-hover min-h-[44px] rounded-control border px-3 text-sm transition-[color,background-color,border-color,transform] duration-150 disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-text-3 disabled:opacity-40 enabled:border-accent/30 enabled:bg-accent-soft enabled:text-text-1 enabled:hover:border-accent/60 enabled:hover:bg-accent-soft enabled:active:scale-95"
            >
              Previous
            </button>
            <select
              value={currentPage}
              onChange={(e) => setPage(Number(e.target.value))}
              className="min-h-[44px] rounded-control border border-border bg-surface px-3 text-sm text-text-1"
              aria-label="Select page"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p}>
                  Page {p} of {totalPages}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="shine-hover min-h-[44px] rounded-control border px-3 text-sm transition-[color,background-color,border-color,transform] duration-150 disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-text-3 disabled:opacity-40 enabled:border-accent/30 enabled:bg-accent-soft enabled:text-text-1 enabled:hover:border-accent/60 enabled:hover:bg-accent-soft enabled:active:scale-95"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </PageShell>
  )
}
