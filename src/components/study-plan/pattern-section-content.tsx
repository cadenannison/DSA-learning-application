"use client"

import { BugTracingPanel } from "@/components/study-plan/bug-tracing-panel"
import { ExpandableProblemRow } from "@/components/study-plan/embeddable-problem-row"
import {
  PatternLessonSection,
  PatternWorkedExampleSection,
} from "@/components/study-plan/pattern-lesson-section"
import { EmptyState } from "@/components/ui/empty-state"
import { StudyPlanPresenter } from "@/presenter/study-plan-presenter"
import { PatternLab } from "@/components/pattern-lab"
import { PATTERNS as PATTERN_LAB_PATTERNS } from "@/components/pattern-lab/content"
import type { PatternSection } from "@/components/study-plan/pattern-page-shell"
import type { StudyPatternWithReadiness } from "@/types"

/** Patterns with a full Pattern Lab experience (Learn/Recognize It/Practice) in place of the
 * markdown lesson + worked example tabs. Maps this app's StudyPattern id to Pattern Lab's own
 * internal Pattern id (they differ for dp: "dynamic-programming" vs "dp"). */
const PATTERN_LAB_IDS: Partial<Record<string, string>> = {
  "dynamic-programming": "dp",
  graphs: "graphs",
}

/** Renders the content for a single active section of a pattern's dedicated page. Embeddable
 * problems in the Practice Problems section link out to the dedicated workbench route (see
 * ExpandableProblemRow) rather than expanding an editor in place. */
export function PatternSectionContent({
  planId,
  pattern,
  section,
  presenter,
}: {
  planId: string
  pattern: StudyPatternWithReadiness
  section: PatternSection
  presenter: StudyPlanPresenter
}) {
  const patternLabId = PATTERN_LAB_IDS[pattern.id]

  if (section === "lesson" && patternLabId) {
    return (
      <div className="h-full overflow-y-auto">
        <PatternLab patterns={PATTERN_LAB_PATTERNS} initialPatternId={patternLabId} />
      </div>
    )
  }

  if (section === "lesson" && pattern.lesson) {
    return (
      <ScrollableSection>
        <PatternLessonSection lesson={pattern.lesson} />
      </ScrollableSection>
    )
  }

  if (section === "worked-example" && pattern.lesson) {
    return (
      <ScrollableSection>
        <PatternWorkedExampleSection lesson={pattern.lesson} />
      </ScrollableSection>
    )
  }

  if (section === "concept") {
    return (
      <ScrollableSection>
        <div className="mb-4 rounded-card border border-border bg-surface p-4">
          <p className="whitespace-pre-wrap text-sm text-text-2">{pattern.conceptNotes}</p>
        </div>
      </ScrollableSection>
    )
  }

  if (section === "bug-tracing" && pattern.bugTracingExercise) {
    return (
      <ScrollableSection>
        <BugTracingPanel exercise={pattern.bugTracingExercise} visible />
      </ScrollableSection>
    )
  }

  if (section === "practice") {
    if (pattern.problems.length === 0) {
      return (
        <ScrollableSection>
          <EmptyState message="No problems assigned to this pattern yet." />
        </ScrollableSection>
      )
    }

    const remainingEstimatedMinutes = pattern.problems
      .filter((problem) => !problem.completed)
      .reduce((sum, problem) => sum + problem.estimatedMinutes, 0)

    return (
      <div className="h-full overflow-y-auto px-6 py-5">
        <div className="mx-auto max-w-4xl space-y-2">
          <div className="text-xs text-text-2">
            Remaining in this pattern: est. {remainingEstimatedMinutes} min
          </div>
          {pattern.hasExtendedLesson
            ? pattern.problems.map((problem) => (
                <ExpandableProblemRow
                  key={problem.id}
                  problem={problem}
                  presenter={presenter}
                  planId={planId}
                  patternId={pattern.id}
                />
              ))
            : pattern.problems.map((problem) => (
                <label
                  key={problem.id}
                  className="flex min-h-[44px] items-center gap-2 rounded-control border border-border px-3 text-sm hover:bg-surface-2"
                >
                  <input
                    type="checkbox"
                    checked={problem.completed}
                    onChange={(e) => presenter.setProblemCompleted(problem.id, e.target.checked)}
                  />
                  <span className={problem.completed ? "text-text-2 line-through" : "text-text-1"}>
                    {problem.name}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-text-2">
                    {problem.role === "canonical_easy" ? "canonical easy" : "medium"}
                  </span>
                  <span className="font-mono text-[10px] text-text-2">
                    est. {problem.estimatedMinutes} min
                  </span>
                </label>
              ))}
        </div>
      </div>
    )
  }

  return null
}

function ScrollableSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="mx-auto max-w-3xl">{children}</div>
    </div>
  )
}
