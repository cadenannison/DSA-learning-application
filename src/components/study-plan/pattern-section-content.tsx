"use client"

import { BugTracingPanel } from "@/components/study-plan/bug-tracing-panel"
import { ExpandableProblemRow } from "@/components/study-plan/embeddable-problem-row"
import {
  PatternLessonSection,
  PatternWorkedExampleSection,
} from "@/components/study-plan/pattern-lesson-section"
import { EmptyState } from "@/components/ui/empty-state"
import { StudyPlanPresenter } from "@/presenter/study-plan-presenter"
import type { PatternSection } from "@/components/study-plan/pattern-page-shell"
import type { StudyPatternWithReadiness } from "@/types"

/** Renders the content for a single active section of a pattern's dedicated page. Each section
 * mounts/unmounts as the user navigates between routes, which is what lets
 * EmbeddedProblemWorkbench's expand/collapse timer keep firing correctly (see that component) —
 * leaving the Practice Problems section unmounts any expanded problem row exactly the same way
 * collapsing it in place used to. */
export function PatternSectionContent({
  pattern,
  section,
  presenter,
}: {
  pattern: StudyPatternWithReadiness
  section: PatternSection
  presenter: StudyPlanPresenter
}) {
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

    return (
      <div className="h-full overflow-y-auto px-6 py-5">
        <div className="mx-auto max-w-4xl space-y-2">
          {pattern.hasExtendedLesson
            ? pattern.problems.map((problem) => (
                <ExpandableProblemRow key={problem.id} problem={problem} presenter={presenter} />
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
