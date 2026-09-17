"use client"

import Link from "next/link"
import { useState } from "react"
import { StatusPill } from "@/components/ui/status-pill"
import { StudyPlanPresenter } from "@/presenter/study-plan-presenter"
import type { StudyProblem } from "@/types"

/** A single problem row within a workbook-mode pattern. Embeddable rows (linkedProblemId set)
 * link out to the dedicated full-page workbench route (same layout as the library's
 * /problems/[id] page — see ProblemWorkbenchView) rather than expanding an editor in place, so
 * solving a workbook problem looks and feels identical to solving a library one; Back/Submit on
 * that page return here. Non-embeddable rows have no editor to route to, so they keep the old
 * expand-in-place behavior for the external link + manual completion control. */
export function ExpandableProblemRow({
  problem,
  presenter,
  planId,
  patternId,
}: {
  problem: StudyProblem
  presenter: StudyPlanPresenter
  planId: string
  patternId: string
}) {
  const [expanded, setExpanded] = useState(false)

  if (problem.linkedProblemId) {
    return (
      <Link
        href={`/study-plan/${planId}/${patternId}/problem/${problem.id}`}
        className="flex min-h-[44px] items-center justify-between gap-3 rounded-[12px] border border-border-soft bg-surface px-4 py-3 hover:border-border"
      >
        <div className="flex items-center gap-2.5">
          <span className={`text-sm font-medium ${problem.completed ? "text-text-3 line-through" : "text-text-1"}`}>
            {problem.name}
          </span>
          <span className="rounded-chip border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-2">
            {problem.role === "canonical_easy" ? "canonical easy" : "medium"}
          </span>
          <span className="font-mono text-[11px] text-text-2">est. {problem.estimatedMinutes} min</span>
        </div>
        {problem.completed && <StatusPill label="Completed" tone="success" />}
      </Link>
    )
  }

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
          <span className="font-mono text-[11px] text-text-2">est. {problem.estimatedMinutes} min</span>
        </div>
        <div className="flex items-center gap-2">
          {problem.completed && <StatusPill label="Completed" tone="success" />}
          <span className="text-xs text-text-2">{expanded ? "−" : "+"}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border-soft px-4 py-4">
          <NotEmbeddedNotice problem={problem} presenter={presenter} />
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
