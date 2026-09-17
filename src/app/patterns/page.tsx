"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { PatternListPresenter } from "@/presenter/pattern-lesson-presenter"
import { PageShell } from "@/components/ui/page-shell"
import { PageHeader } from "@/components/ui/page-header"
import { StatusPill } from "@/components/ui/status-pill"
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
    <PageShell>
      <PageHeader
        title="Patterns"
        context="Structured walkthroughs of each DSA pattern, with small interactive visualizations"
      />

      {error && <p className="text-sm text-danger">{error}</p>}
      {loading && <p className="text-sm text-text-2">Loading patterns...</p>}

      {!loading && !error && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {lessons.map((lesson) => (
            <li key={lesson.pattern}>
              {lesson.hasInteractiveDemo ? (
                <Link
                  href={`/patterns/${lesson.pattern}`}
                  className="block h-full rounded-card border border-border bg-surface p-4 hover:bg-surface-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-text-1">{lesson.title}</div>
                    <StatusPill label="Interactive" tone="accent" />
                  </div>
                  <p className="mt-1 text-xs text-text-2">{lesson.summary}</p>
                  {lesson.relatedProblemCount > 0 && (
                    <p className="mt-2 font-mono text-[11px] text-text-2">
                      {lesson.relatedProblemCount} related problem
                      {lesson.relatedProblemCount === 1 ? "" : "s"}
                    </p>
                  )}
                </Link>
              ) : (
                <div className="h-full rounded-card border border-dashed border-border p-4 opacity-60">
                  <div className="text-sm font-medium text-text-1">{lesson.title}</div>
                  <p className="mt-1 text-xs text-text-2">Coming soon</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  )
}
