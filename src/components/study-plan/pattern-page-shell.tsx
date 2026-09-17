"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { StatusPill, type StatusTone } from "@/components/ui/status-pill"
import { Tabs } from "@/components/ui/tabs"
import { StudyPlanPresenter } from "@/presenter/study-plan-presenter"
import type { StudyPatternStage, StudyPatternWithReadiness } from "@/types"

const STAGE_LABELS: Record<StudyPatternStage, string> = {
  not_started: "Not started",
  concept: "Concept read",
  easy_done: "Easy done",
  mediums_done: "Mediums done",
  bug_tracing_done: "Bug-tracing done",
}

const STAGE_ORDER: StudyPatternStage[] = [
  "not_started",
  "concept",
  "easy_done",
  "mediums_done",
  "bug_tracing_done",
]

const TIER_TONES: Record<string, StatusTone> = {
  core: "accent",
  important: "neutral",
  "complexity-ceiling": "danger",
  stretch: "neutral",
}

const TIER_LABELS: Record<string, string> = {
  core: "Core",
  important: "Important",
  "complexity-ceiling": "Complexity ceiling",
  stretch: "Stretch",
}

export type PatternSection = "lesson" | "worked-example" | "practice" | "bug-tracing" | "concept"

export function bugTracingUnlocked(pattern: StudyPatternWithReadiness): boolean {
  return STAGE_ORDER.indexOf(pattern.stage) >= STAGE_ORDER.indexOf("mediums_done")
}

/** Sections available for a given pattern, in tab display order. Patterns without an extended
 * lesson collapse to Concept + Practice Problems; Bug Tracing is hidden entirely until the
 * pattern reaches mediums_done, per the same gating the old inline card used. */
export function availableSections(pattern: StudyPatternWithReadiness): PatternSection[] {
  const sections: PatternSection[] = pattern.hasExtendedLesson
    ? ["lesson", "worked-example", "practice"]
    : ["concept", "practice"]

  if (pattern.hasExtendedLesson && pattern.bugTracingExercise && bugTracingUnlocked(pattern)) {
    sections.push("bug-tracing")
  }

  return sections
}

const SECTION_LABELS: Record<PatternSection, string> = {
  lesson: "Concept",
  "worked-example": "Worked Example",
  practice: "Practice Problems",
  "bug-tracing": "Bug Tracing",
  concept: "Concept",
}

export function defaultSectionFor(_pattern: StudyPatternWithReadiness): PatternSection {
  return "practice"
}

/** Full-bleed workbench chrome for a pattern's dedicated page (no sidebar — see ShellFrame's
 * workbench route matching): a top strip with breadcrumb, pattern name, tier/stage pills, and
 * stage/confidence controls, then section tabs, then whatever the caller renders as children
 * keyed by route segment. Section content itself navigates via real route changes (each tab a
 * Link-driven route), not client-only tab state — see the section page for why. */
export function PatternPageShell({
  planId,
  pattern,
  activeSection,
  prev,
  next,
  presenter,
  children,
}: {
  planId: string
  pattern: StudyPatternWithReadiness
  activeSection: PatternSection
  prev: StudyPatternWithReadiness | null
  next: StudyPatternWithReadiness | null
  presenter: StudyPlanPresenter
  children: React.ReactNode
}) {
  const [notes, setNotes] = useState(pattern.notes)
  const [notesOpen, setNotesOpen] = useState(false)
  const sections = availableSections(pattern)
  const router = useRouter()

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href={`/study-plan/${planId}/board`}
            className="shrink-0 text-[13px] text-text-2 hover:text-text-1"
          >
            &larr; Study Plan
          </Link>
          <span className="h-4 w-px shrink-0 bg-border" aria-hidden />
          <span className="truncate text-[13.5px] font-semibold text-text-1">
            #{pattern.priorityRank} {pattern.name}
          </span>
          <StatusPill label={TIER_LABELS[pattern.complexityTier]} tone={TIER_TONES[pattern.complexityTier]} />
          <span className="hidden shrink-0 rounded-chip border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] uppercase text-text-2 sm:inline">
            {STAGE_LABELS[pattern.stage]}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3.5 text-[13px]">
          {prev ? (
            <Link
              href={`/study-plan/${planId}/${prev.id}/${defaultSectionFor(prev)}`}
              className="text-text-2 hover:text-text-1"
            >
              &larr; {prev.name}
            </Link>
          ) : (
            <span className="text-text-3 opacity-50">&larr; Prev</span>
          )}
          {next ? (
            <Link
              href={`/study-plan/${planId}/${next.id}/${defaultSectionFor(next)}`}
              className="text-text-2 hover:text-text-1"
            >
              {next.name} &rarr;
            </Link>
          ) : (
            <span className="text-text-3 opacity-50">Next &rarr;</span>
          )}
          <button
            onClick={() => setNotesOpen((v) => !v)}
            className="rounded-[8px] border border-border px-3 py-1.5 text-[13px] text-text-2 hover:bg-surface-2 hover:text-text-1"
          >
            Notes
          </button>
        </div>
      </div>

      {notesOpen && (
        <div className="flex shrink-0 flex-wrap items-start gap-4 border-b border-border bg-surface px-6 py-3">
          <label className="flex items-center gap-2 text-xs text-text-2">
            Stage
            <select
              value={pattern.stage}
              onChange={(e) => presenter.setPatternStage(pattern.id, e.target.value as StudyPatternStage)}
              className="min-h-[36px] rounded-control border border-border bg-surface-2 px-2 text-sm text-text-1"
            >
              {STAGE_ORDER.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs text-text-2">
            Confidence
            <select
              value={pattern.confidence ?? ""}
              onChange={(e) =>
                presenter.setPatternConfidence(
                  pattern.id,
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
              className="min-h-[36px] rounded-control border border-border bg-surface-2 px-2 text-sm text-text-1"
            >
              <option value="">Unrated</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-[240px] flex-1 flex-col gap-1 text-xs text-text-2">
            Notes (bugs found, misconceptions, etc.)
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => presenter.setPatternNotes(pattern.id, notes)}
              rows={2}
              className="rounded-control border border-border bg-surface-2 px-2 py-1 text-sm text-text-1"
            />
          </label>
        </div>
      )}

      <div className="shrink-0 border-b border-border px-6">
        <Tabs
          tabs={sections.map((section) => ({ value: section, label: SECTION_LABELS[section] }))}
          active={activeSection}
          onChange={(section) => router.push(`/study-plan/${planId}/${pattern.id}/${section}`)}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
