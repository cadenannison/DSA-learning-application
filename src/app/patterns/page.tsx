"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { PatternListPresenter } from "@/presenter/pattern-lesson-presenter"
import { ThemeToggle } from "@/components/theme-toggle"
import type { PatternLessonSummary } from "@/types"

export default function PatternsPage() {
  const [lessons, setLessons] = useState<PatternLessonSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [presenter] = useState(
    () =>
      new PatternListPresenter({
        setLoading,
        setLessons,
        setError,
      })
  )

  useEffect(() => {
    presenter.loadLessons()
  }, [presenter])

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Learning Patterns</h1>
          <p className="mt-1 text-sm text-muted">
            Structured walkthroughs of each DSA pattern, with small interactive visualizations.
          </p>
        </div>
        <ThemeToggle />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {loading && <p className="text-sm text-muted">Loading patterns...</p>}

      {!loading && !error && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {lessons.map((lesson) => (
            <li key={lesson.pattern}>
              {lesson.hasInteractiveDemo ? (
                <Link
                  href={`/patterns/${lesson.pattern}`}
                  className="block h-full rounded-md border border-border p-4 hover:bg-surface"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{lesson.title}</div>
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                      Interactive
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{lesson.summary}</p>
                  {lesson.relatedProblemCount > 0 && (
                    <p className="mt-2 text-[11px] text-muted">
                      {lesson.relatedProblemCount} related problem
                      {lesson.relatedProblemCount === 1 ? "" : "s"}
                    </p>
                  )}
                </Link>
              ) : (
                <div className="h-full rounded-md border border-dashed border-border p-4 opacity-60">
                  <div className="font-medium">{lesson.title}</div>
                  <p className="mt-1 text-xs text-muted">Coming soon</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
