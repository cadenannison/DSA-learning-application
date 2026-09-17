"use client"

import { BugTracingPanel } from "@/components/study-plan/bug-tracing-panel"
import { ExpandableProblemRow } from "@/components/study-plan/embeddable-problem-row"
import {
  PatternLessonSection,
  PatternWorkedExampleSection,
} from "@/components/study-plan/pattern-lesson-section"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusPill } from "@/components/ui/status-pill"
import { StudyPlanPresenter } from "@/presenter/study-plan-presenter"
import { PatternLab } from "@/components/pattern-lab"
import { PATTERNS as PATTERN_LAB_PATTERNS } from "@/components/pattern-lab/content"
import type { PatternSection } from "@/components/study-plan/pattern-page-shell"
import type { PatternResource, Skill, StudyPatternWithReadiness } from "@/types"

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
        <ResourcesCard resources={pattern.resources} />
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
          <SkillsCard skills={pattern.skills} presenter={presenter} />
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

/** Skills linked to this pattern, shown alongside its problems — mastering the skill is
 * visibly part of "finishing" the pattern, not a separate afterthought. */
function SkillsCard({ skills, presenter }: { skills: Skill[]; presenter: StudyPlanPresenter }) {
  if (skills.length === 0) return null

  return (
    <div className="mb-2 rounded-card border border-border bg-surface p-4">
      <div className="mb-2 text-sm font-medium text-text-1">Skills</div>
      <div className="space-y-2">
        {skills.map((skill) => (
          <label
            key={skill.id}
            className="flex items-start gap-2 rounded-control px-2 py-1.5 text-sm hover:bg-surface-2"
          >
            <input
              type="checkbox"
              className="mt-0.5"
              checked={skill.done}
              onChange={(e) => presenter.setSkillDone(skill.id, e.target.checked)}
            />
            <span className="flex-1">
              <span className={skill.done ? "text-text-2 line-through" : "text-text-1"}>
                {skill.name}
              </span>
              {skill.done && skill.lastVerifiedAt && (
                <span className="ml-2 font-mono text-[10px] text-text-2">
                  verified {new Date(skill.lastVerifiedAt).toLocaleDateString()}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

const RESOURCE_TYPE_LABELS: Record<PatternResource["type"], string> = {
  video: "Video",
  article: "Article",
  visualization: "Visualization",
}

function ResourcesCard({ resources }: { resources: PatternResource[] }) {
  if (resources.length === 0) {
    return <EmptyState message="No curated resources yet for this pattern." />
  }

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="mb-2 text-sm font-medium text-text-1">Resources</div>
      <div className="flex flex-wrap gap-2">
        {resources.map((resource) => (
          <a
            key={resource.url}
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-chip border border-border px-2.5 py-1.5 text-xs text-text-1 hover:bg-surface-2"
          >
            <StatusPill label={RESOURCE_TYPE_LABELS[resource.type]} tone="accent" />
            {resource.title}
          </a>
        ))}
      </div>
    </div>
  )
}
