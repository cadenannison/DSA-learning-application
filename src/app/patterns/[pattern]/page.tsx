"use client"

import Link from "next/link"
import { use, useEffect, useState } from "react"
import { PatternLessonPresenter } from "@/presenter/pattern-lesson-presenter"
import { ThemeToggle } from "@/components/theme-toggle"
import { PageShell } from "@/components/ui/page-shell"
import { BinarySearchDemo } from "@/components/lessons/binary-search-demo"
import { BfsDfsDemo } from "@/components/lessons/bfs-dfs-demo"
import { SlidingWindowDemo } from "@/components/lessons/sliding-window-demo"
import { TwoPointersDemo } from "@/components/lessons/two-pointers-demo"
import { LinkedListDemo } from "@/components/lessons/linked-list-demo"
import { TreesDemo } from "@/components/lessons/trees-demo"
import { HeapsDemo } from "@/components/lessons/heaps-demo"
import { BacktrackingDemo } from "@/components/lessons/backtracking-demo"
import { IntervalsDemo } from "@/components/lessons/intervals-demo"
import { GraphsDemo } from "@/components/lessons/graphs-demo"
import { DynamicProgrammingDemo } from "@/components/lessons/dynamic-programming-demo"
import { GreedyDemo } from "@/components/lessons/greedy-demo"
import { TriesDemo } from "@/components/lessons/tries-demo"
import { StacksQueuesDemo } from "@/components/lessons/stacks-queues-demo"
import type { DsaPattern, PatternLesson, ProblemSummary } from "@/types"

const DIFFICULTY_COLORS: Record<ProblemSummary["difficulty"], string> = {
  easy: "text-success",
  medium: "text-warning",
  hard: "text-danger",
}

function Demo({ lesson }: { lesson: PatternLesson }) {
  switch (lesson.demoKind) {
    case "two-pointers":
      return <TwoPointersDemo />
    case "sliding-window":
      return <SlidingWindowDemo />
    case "binary-search":
      return <BinarySearchDemo />
    case "bfs-dfs":
      return <BfsDfsDemo />
    case "linked-list":
      return <LinkedListDemo />
    case "trees":
      return <TreesDemo />
    case "heaps":
      return <HeapsDemo />
    case "backtracking":
      return <BacktrackingDemo />
    case "intervals":
      return <IntervalsDemo />
    case "graphs":
      return <GraphsDemo />
    case "dynamic-programming":
      return <DynamicProgrammingDemo />
    case "greedy":
      return <GreedyDemo />
    case "tries":
      return <TriesDemo />
    case "stacks-queues":
      return <StacksQueuesDemo />
    default:
      return null
  }
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

      <div className="mt-6 space-y-3 text-sm leading-relaxed text-text-1">
        {lesson.explanation.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-text-1">When to use it</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-text-2">
          {lesson.whenToUse.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      {lesson.demoKind !== "none" && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-text-1">Try it</h2>
          <Demo lesson={lesson} />
        </div>
      )}

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
