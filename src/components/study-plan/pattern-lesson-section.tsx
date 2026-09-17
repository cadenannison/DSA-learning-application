import ReactMarkdown from "react-markdown"
import type { ExtendedLesson } from "@/types"

function MarkdownBlock({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed [&_code]:rounded [&_code]:bg-surface [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_h1]:mt-3 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:text-sm [&_h2]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_p]:mb-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-surface [&_pre]:p-3 [&_strong]:font-semibold [&_ul]:list-disc">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}

/** Renders the "textbook chapter" lesson content for a high-priority pattern: core idea,
 * worked example, variations, signal phrases, common mistakes, and complexity — in that order,
 * ahead of the practice problem list. Only rendered when pattern.hasExtendedLesson. */
export function PatternLessonSection({ lesson }: { lesson: ExtendedLesson }) {
  return (
    <div className="mb-4 space-y-4 rounded-md border border-accent/30 bg-accent/5 p-4">
      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
          Core idea
        </h3>
        <MarkdownBlock content={lesson.coreIdeaMarkdown} />
      </div>

      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
          Worked example
        </h3>
        <MarkdownBlock content={lesson.workedExampleMarkdown} />
      </div>

      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
          Common variations
        </h3>
        <MarkdownBlock content={lesson.variationsMarkdown} />
      </div>

      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
          Signal phrases
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {lesson.signalPhrases.map((phrase, index) => (
            <span
              key={index}
              className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs"
            >
              {phrase}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
          Common mistakes &amp; edge cases
        </h3>
        <MarkdownBlock content={lesson.commonMistakesMarkdown} />
      </div>

      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
          Time &amp; space complexity
        </h3>
        <MarkdownBlock content={lesson.complexityMarkdown} />
      </div>
    </div>
  )
}
