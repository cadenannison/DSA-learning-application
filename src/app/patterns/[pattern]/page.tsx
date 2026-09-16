"use client"

import Link from "next/link"
import { use, useEffect, useState } from "react"
import { PatternLessonPresenter } from "@/presenter/pattern-lesson-presenter"
import { ThemeToggle } from "@/components/theme-toggle"
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
  easy: "text-green-600 dark:text-green-400",
  medium: "text-amber-600 dark:text-amber-400",
  hard: "text-red-600 dark:text-red-400",
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

  if (loading) return <main className="p-8 text-sm text-muted">Loading lesson...</main>
  if (error) return <main className="p-8 text-sm text-red-600 dark:text-red-400">{error}</main>
  if (!lesson) return null

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/patterns" className="text-sm text-muted hover:text-foreground">
          &larr; Back to patterns
        </Link>
        <ThemeToggle />
      </div>

      <h1 className="text-2xl font-semibold">{lesson.title}</h1>
      <p className="mt-1 text-sm text-muted">{lesson.summary}</p>

      <div className="mt-3 flex gap-4 text-xs text-muted">
        <span>Time: {lesson.timeComplexity}</span>
        <span>Space: {lesson.spaceComplexity}</span>
      </div>

      <div className="mt-6 space-y-3 text-sm leading-relaxed">
        {lesson.explanation.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-medium">When to use it</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted">
          {lesson.whenToUse.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      {lesson.demoKind !== "none" && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium">Try it</h2>
          <Demo lesson={lesson} />
        </div>
      )}

      {relatedProblems.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium">Practice problems</h2>
          <ul className="divide-y divide-border rounded-md border border-border">
            {relatedProblems.map((problem) => (
              <li key={problem.id}>
                <Link
                  href={`/problems/${problem.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-surface"
                >
                  <span className="font-medium">{problem.title}</span>
                  <span className={`text-sm ${DIFFICULTY_COLORS[problem.difficulty]}`}>
                    {problem.difficulty}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  )
}
