"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import type { BugTracingExercise } from "@/types"

/** Auto-surfaced once a pattern reaches mediums_done (the stage right before
 * bug_tracing_done) — rendered directly, not just linked, so there's nothing extra to find or
 * click through to get to it. The solution walkthrough stays collapsed by default so it still
 * functions as an exercise rather than immediately spoiling the answer. */
export function BugTracingPanel({
  exercise,
  visible,
}: {
  exercise: BugTracingExercise
  visible: boolean
}) {
  const [showSolution, setShowSolution] = useState(false)

  if (!visible) return null

  return (
    <div className="mt-4 rounded-card border border-warning/40 bg-warning/5 p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-warning">
        Bug-tracing exercise
      </h3>
      <div className="text-sm leading-relaxed text-text-1 [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_p]:mb-2 [&_pre]:overflow-x-auto [&_pre]:rounded-control [&_pre]:bg-surface-2 [&_pre]:p-3">
        <ReactMarkdown>{exercise.prompt}</ReactMarkdown>
      </div>

      {!showSolution ? (
        <button
          onClick={() => setShowSolution(true)}
          className="mt-2 min-h-[44px] rounded-control border border-border px-3 text-xs text-text-2 hover:bg-surface-2 hover:text-text-1"
        >
          Show solution walkthrough
        </button>
      ) : (
        <div className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-text-1 [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_p]:mb-2 [&_pre]:overflow-x-auto [&_pre]:rounded-control [&_pre]:bg-surface-2 [&_pre]:p-3 [&_strong]:font-semibold">
          <ReactMarkdown>{exercise.solutionWalkthroughMarkdown}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}
