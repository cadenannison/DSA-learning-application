"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { PYTHON_SYNTAX_REFERENCE_MARKDOWN } from "@/data/python-syntax-reference"

/** A collapsed-by-default cheatsheet of common Python syntax and stdlib functions for
 * arrays/lists, hashmaps, strings, etc. Placed right under Hints since it's the same kind of
 * on-demand scaffolding — unlike hints it never changes per problem, so there's nothing to
 * fetch or track; it's pure static reference content. */
export function PythonSyntaxReference() {
  const [expanded, setExpanded] = useState(false)

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="inline-flex min-h-[44px] items-center rounded-control border border-accent/40 bg-accent-soft px-3 text-xs font-semibold uppercase tracking-wide text-accent"
      >
        Python syntax reference
      </button>
    )
  }

  return (
    <div className="rounded-card border border-accent/40 bg-accent-soft p-4">
      <button
        onClick={() => setExpanded(false)}
        className="flex min-h-[44px] w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-wide text-accent"
      >
        Python syntax reference
        <span className="text-text-2">Hide</span>
      </button>

      <div className="mt-3 max-h-72 overflow-y-auto rounded-control border border-border bg-surface-2 p-3">
        <div className="text-sm leading-relaxed text-text-1 [&_code]:rounded [&_code]:bg-surface [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_h2]:mt-4 [&_h2]:mb-1 [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:text-text-2 [&_h2]:first:mt-0 [&_li]:ml-4 [&_ol]:list-decimal [&_p]:mb-2 [&_pre]:overflow-x-auto [&_pre]:rounded-control [&_pre]:bg-surface [&_pre]:p-2 [&_strong]:font-semibold [&_ul]:list-disc">
          <ReactMarkdown>{PYTHON_SYNTAX_REFERENCE_MARKDOWN}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
