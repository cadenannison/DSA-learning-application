"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
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

const PATTERNS = Object.keys(PATTERN_LABELS) as DsaPattern[]
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"]

type Mode = "search" | "criteria"

export default function NewBlindTestSetPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [mode, setMode] = useState<Mode>("search")

  const [query, setQuery] = useState("")
  const [problems, setProblems] = useState<ProblemSummary[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [selectedPatterns, setSelectedPatterns] = useState<Set<DsaPattern>>(new Set())
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<Difficulty>>(new Set())

  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mode !== "search") return
    apiClient
      .listProblems({ query: query || undefined })
      .then(setProblems)
      .catch(() => setProblems([]))
  }, [mode, query])

  function toggleId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function togglePattern(pattern: DsaPattern) {
    setSelectedPatterns((prev) => {
      const next = new Set(prev)
      if (next.has(pattern)) next.delete(pattern)
      else next.add(pattern)
      return next
    })
  }

  function toggleDifficulty(difficulty: Difficulty) {
    setSelectedDifficulties((prev) => {
      const next = new Set(prev)
      if (next.has(difficulty)) next.delete(difficulty)
      else next.add(difficulty)
      return next
    })
  }

  async function handleCreate() {
    if (!name.trim()) {
      setError("Give this set a name")
      return
    }

    setCreating(true)
    setError(null)

    try {
      const set =
        mode === "search"
          ? await apiClient.createBlindTestSet({ name, problemIds: Array.from(selectedIds) })
          : await apiClient.createBlindTestSet({
              name,
              filter: {
                patterns: selectedPatterns.size > 0 ? Array.from(selectedPatterns) : undefined,
                difficulties:
                  selectedDifficulties.size > 0 ? Array.from(selectedDifficulties) : undefined,
              },
            })

      router.push(`/blind/sets/${set.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create set")
      setCreating(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New Test Set</h1>
        <ThemeToggle />
      </div>

      <input
        type="text"
        placeholder="Set name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-4 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
      />

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setMode("search")}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            mode === "search" ? "border-accent bg-accent/10" : "border-border hover:bg-surface"
          }`}
        >
          Search &amp; add
        </button>
        <button
          onClick={() => setMode("criteria")}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            mode === "criteria" ? "border-accent bg-accent/10" : "border-border hover:bg-surface"
          }`}
        >
          By pattern / difficulty
        </button>
      </div>

      {mode === "search" && (
        <div>
          <input
            type="text"
            placeholder="Search by title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mb-3 w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm"
          />

          <p className="mb-2 text-xs text-muted">{selectedIds.size} selected</p>

          <ul className="max-h-96 divide-y divide-border overflow-y-auto rounded-md border border-border">
            {problems.map((problem) => (
              <li key={problem.id}>
                <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(problem.id)}
                    onChange={() => toggleId(problem.id)}
                  />
                  <div>
                    <div>{problem.title}</div>
                    <div className="text-xs text-muted">
                      {PATTERN_LABELS[problem.pattern]} · {problem.difficulty}
                    </div>
                  </div>
                </label>
              </li>
            ))}
            {problems.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-muted">No problems match.</li>
            )}
          </ul>
        </div>
      )}

      {mode === "criteria" && (
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 text-sm font-medium">Patterns</h2>
            <div className="flex flex-wrap gap-2">
              {PATTERNS.map((pattern) => (
                <button
                  key={pattern}
                  onClick={() => togglePattern(pattern)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    selectedPatterns.has(pattern)
                      ? "border-accent bg-accent/10"
                      : "border-border hover:bg-surface"
                  }`}
                >
                  {PATTERN_LABELS[pattern]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium">Difficulties</h2>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => toggleDifficulty(difficulty)}
                  className={`rounded-full border px-3 py-1 text-xs capitalize ${
                    selectedDifficulties.has(difficulty)
                      ? "border-accent bg-accent/10"
                      : "border-border hover:bg-surface"
                  }`}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted">
            Leave a group empty to match all values for that field. Every problem matching any
            selected pattern <em>and</em> any selected difficulty is added.
          </p>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={creating}
        className="mt-6 rounded-md bg-accent px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {creating ? "Creating..." : "Create set"}
      </button>

      <Link
        href="/blind/sets"
        className="mt-4 block text-sm text-muted hover:text-foreground"
      >
        &larr; Back to test sets
      </Link>
    </main>
  )
}
