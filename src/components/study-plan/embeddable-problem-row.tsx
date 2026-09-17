"use client"

import { useState } from "react"
import { EmbeddedProblemWorkbench } from "@/components/study-plan/embedded-problem-workbench"
import { StatusPill } from "@/components/ui/status-pill"
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
    <div className={`rounded-[12px] border ${expanded ? "border-border" : "border-border-soft"} bg-surface`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex min-h-[44px] w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className={`text-sm font-medium ${problem.completed ? "text-text-3 line-through" : "text-text-1"}`}>
            {problem.name}
          </span>
          <span className="rounded-chip border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-2">
            {problem.role === "canonical_easy" ? "canonical easy" : "medium"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {problem.completed && <StatusPill label="Completed" tone="success" />}
          <span className="text-xs text-text-2">{expanded ? "−" : "+"}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border-soft px-4 py-4">
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
    <div className="space-y-3 text-sm text-text-1">
      <p className="text-xs text-text-2">
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
