"use client"

import Link from "next/link"
import { use, useEffect, useState } from "react"
import { PatternLessonPresenter } from "@/presenter/pattern-lesson-presenter"
import { ThemeToggle } from "@/components/theme-toggle"
import { PageShell } from "@/components/ui/page-shell"
import { PatternLab } from "@/components/pattern-lab"
import { PATTERNS as PATTERN_LAB_PATTERNS } from "@/components/pattern-lab/content"
import type { DsaPattern, PatternLesson, ProblemSummary } from "@/types"

const DIFFICULTY_COLORS: Record<ProblemSummary["difficulty"], string> = {
  easy: "text-success",
  medium: "text-warning",
  hard: "text-danger",
}

/** Maps this app's DsaPattern id to Pattern Lab's own internal Pattern id — they differ for dp
 * ("dynamic-programming" vs "dp") and two pointers ("arrays-two-pointers" vs "two-pointers").
 * All 14 patterns now have Pattern Lab content (see src/components/pattern-lab/content). */
const PATTERN_LAB_IDS: Record<DsaPattern, string> = {
  "arrays-two-pointers": "two-pointers",
  "sliding-window": "sliding-window",
  "binary-search": "binary-search",
  "linked-list": "linked-list",
  trees: "trees",
  "bfs-dfs": "bfs-dfs",
  heaps: "heaps",
  backtracking: "backtracking",
  intervals: "intervals",
  graphs: "graphs",
  "dynamic-programming": "dp",
  greedy: "greedy",
  tries: "tries",
  "stacks-queues": "stacks-queues",
}

export default function PatternLessonPage({ params }: { params: Promise<{ pattern: string }> }) {
  const { pattern } = use(params)

  const [lesson, setLesson] = useState<PatternLesson | null>(null)
  const [relatedProblems, setRelatedProblems] = useState<ProblemSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [presenter] = useState(
    () =>
      new PatternLessonPresenter({
        setLoading,
        setLesson,
        setRelatedProblems,
        setError,
      })
  )

  useEffect(() => {
    presenter.loadLesson(pattern as DsaPattern)
  }, [presenter, pattern])

  if (loading) return <PageShell><p className="text-sm text-text-2">Loading lesson...</p></PageShell>
  if (error) return <PageShell><p className="text-sm text-danger">{error}</p></PageShell>
  if (!lesson) return null

  return (
    <PageShell>
      <div className="mb-4 flex items-center justify-between">
        <Link href="/patterns" className="text-sm text-text-2 hover:text-text-1">
          &larr; Back to patterns
        </Link>
        <ThemeToggle />
      </div>

      <h1 className="font-display text-2xl font-semibold text-text-1">{lesson.title}</h1>
      <p className="mt-1 text-sm text-text-2">{lesson.summary}</p>

      <div className="mt-3 flex gap-4 font-mono text-xs text-text-2">
        <span>Time: {lesson.timeComplexity}</span>
        <span>Space: {lesson.spaceComplexity}</span>
      </div>

      <div className="mt-6">
        <PatternLab patterns={PATTERN_LAB_PATTERNS} initialPatternId={PATTERN_LAB_IDS[lesson.pattern]} />
      </div>

      {relatedProblems.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-text-1">Practice problems</h2>
          <ul className="overflow-hidden rounded-card border border-border bg-surface">
            {relatedProblems.map((problem) => (
              <li key={problem.id} className="border-b border-border-soft last:border-b-0">
                <Link
                  href={`/problems/${problem.id}`}
                  className="flex min-h-[44px] items-center justify-between px-4 py-3 hover:bg-surface-2"
                >
                  <span className="text-sm font-medium text-text-1">{problem.title}</span>
                  <span className={`font-mono text-xs ${DIFFICULTY_COLORS[problem.difficulty]}`}>
                    {problem.difficulty}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PageShell>
  )
}
