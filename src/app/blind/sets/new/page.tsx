"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { PageShell } from "@/components/ui/page-shell"
import { PageHeader } from "@/components/ui/page-header"
import { Tabs } from "@/components/ui/tabs"
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
    <PageShell>
      <PageHeader title="New Test Set" />

      <input
        type="text"
        placeholder="Set name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-4 min-h-[44px] w-full rounded-control border border-border bg-surface px-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
      />

      <Tabs
        className="mb-4"
        tabs={[
          { value: "search", label: "Search & add" },
          { value: "criteria", label: "By pattern / difficulty" },
        ]}
        active={mode}
        onChange={setMode}
      />

      {mode === "search" && (
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search by title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mb-3 min-h-[44px] w-full rounded-control border border-border bg-surface px-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
          />

          <p className="mb-2 text-xs text-text-2">{selectedIds.size} selected</p>

          <ul className="max-h-96 overflow-y-auto rounded-card border border-border bg-surface">
            {problems.map((problem) => (
              <li key={problem.id} className="border-b border-border-soft last:border-b-0">
                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(problem.id)}
                    onChange={() => toggleId(problem.id)}
                  />
                  <div>
                    <div className="text-text-1">{problem.title}</div>
                    <div className="text-xs text-text-2">
                      {PATTERN_LABELS[problem.pattern]} · {problem.difficulty}
                    </div>
                  </div>
                </label>
              </li>
            ))}
            {problems.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-text-2">No problems match.</li>
            )}
          </ul>
        </div>
      )}

      {mode === "criteria" && (
        <div className="mt-4 space-y-4">
          <div>
            <h2 className="mb-2 text-sm font-medium text-text-1">Patterns</h2>
            <div className="flex flex-wrap gap-2">
              {PATTERNS.map((pattern) => (
                <button
                  key={pattern}
                  onClick={() => togglePattern(pattern)}
                  className={`rounded-chip border px-3 py-1.5 text-xs ${
                    selectedPatterns.has(pattern)
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border text-text-2 hover:bg-surface-2"
                  }`}
                >
                  {PATTERN_LABELS[pattern]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium text-text-1">Difficulties</h2>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => toggleDifficulty(difficulty)}
                  className={`rounded-chip border px-3 py-1.5 text-xs capitalize ${
                    selectedDifficulties.has(difficulty)
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border text-text-2 hover:bg-surface-2"
                  }`}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-text-2">
            Leave a group empty to match all values for that field. Every problem matching any
            selected pattern <em>and</em> any selected difficulty is added.
          </p>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={creating}
        className="mt-6 min-h-[44px] rounded-control bg-accent px-4 text-sm font-semibold text-bg disabled:opacity-50"
      >
        {creating ? "Creating..." : "Create set"}
      </button>
    </PageShell>
  )
}
