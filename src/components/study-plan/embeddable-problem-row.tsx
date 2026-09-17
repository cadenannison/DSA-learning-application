"use client"

import { useState } from "react"
import { EmbeddedProblemWorkbench } from "@/components/study-plan/embedded-problem-workbench"
import { StudyPlanPresenter } from "@/presenter/study-plan-presenter"
import type { StudyProblem } from "@/types"

/** A single problem row within a workbook-mode pattern. Every row expands in place the same
 * way regardless of whether the problem is embeddable — nothing routes away. Embeddable rows
 * (linkedProblemId set) render a runnable editor; everything else renders a "not embedded yet"
 * notice with the external link and the existing manual completion control. */
export function ExpandableProblemRow({
  problem,
  presenter,
}: {
  problem: StudyProblem
  presenter: StudyPlanPresenter
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-md border border-border">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2">
          <span className={`text-sm ${problem.completed ? "text-muted line-through" : ""}`}>
            {problem.name}
          </span>
          <span className="text-[10px] uppercase text-muted">
            {problem.role === "canonical_easy" ? "canonical easy" : "medium"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {problem.completed && (
            <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
              Completed
            </span>
          )}
          <span className="text-xs text-muted">{expanded ? "−" : "+"}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-3 py-3">
          {problem.linkedProblemId ? (
            <EmbeddedProblemWorkbench studyProblem={problem} presenter={presenter} />
          ) : (
            <NotEmbeddedNotice problem={problem} presenter={presenter} />
          )}
        </div>
      )}
    </div>
  )
}

function NotEmbeddedNotice({
  problem,
  presenter,
}: {
  problem: StudyProblem
  presenter: StudyPlanPresenter
}) {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs text-muted">
        Full embedded editor for this problem isn&apos;t authored yet.
      </p>
      {problem.externalUrl && (
        <a
          href={problem.externalUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-xs text-accent hover:underline"
        >
          Open on LeetCode &rarr;
        </a>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={problem.completed}
          onChange={(e) => presenter.setProblemCompleted(problem.id, e.target.checked)}
        />
        Mark complete
      </label>
    </div>
  )
}
