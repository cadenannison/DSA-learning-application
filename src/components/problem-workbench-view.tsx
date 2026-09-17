"use client"

import { CodeEditor } from "@/components/code-editor"
import { PythonSyntaxReference } from "@/components/python-syntax-reference"
import { ResetCodeButton } from "@/components/reset-code-button"
import { TestResults } from "@/components/test-results"
import type { ExecutionResult, Problem } from "@/types"

/** Shared two-pane problem-solving layout: prompt/examples/constraints/hints on the left,
 * editor + Run/Submit + results on the right. Used by both the library's /problems/[id] page
 * and the study-plan workbook's problem route, which differ only in their header chrome and in
 * what happens on submit (generic progress recording vs. study-problem completion) — everything
 * about the actual solving experience is identical, so it lives here once. */
export function ProblemWorkbenchView({
  problem,
  code,
  onChangeCode,
  running,
  result,
  onRun,
  onSubmit,
  onResetCode,
  submitLabel = "Submit",
  revealedHints,
  onRevealNextHint,
  afterResult,
}: {
  problem: Problem
  code: string
  onChangeCode: (value: string) => void
  running: boolean
  result: ExecutionResult | null
  onRun: () => void
  onSubmit: () => void
  onResetCode: () => void
  submitLabel?: string
  revealedHints: number
  onRevealNextHint: () => void
  /** Rendered directly under TestResults once a result exists — e.g. the workbook route's
   * explicit "Back to Workbook" CTA, so the user reads their result before choosing to leave
   * rather than being auto-redirected away from it. */
  afterResult?: React.ReactNode
}) {
  return (
    <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
      <div className="space-y-4 overflow-y-auto border-b border-border p-6 lg:border-b-0 lg:border-r">
        <div>
          <h1 className="font-display text-xl font-semibold text-text-1">{problem.title}</h1>
          <div className="mt-1 font-mono text-xs text-text-2">
            {problem.pattern} · {problem.difficulty}
          </div>
        </div>

        <p className="whitespace-pre-wrap text-sm text-text-1">{problem.prompt}</p>

        <div>
          <h2 className="mb-2 text-sm font-medium text-text-1">Examples</h2>
          <ul className="space-y-2">
            {problem.examples.map((example, index) => (
              <li
                key={index}
                className="rounded-card border border-border bg-surface p-3 font-mono text-xs text-text-1"
              >
                <div>Input: {example.input}</div>
                <div>Output: {example.output}</div>
                {example.explanation && <div className="text-text-2">{example.explanation}</div>}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-text-1">Constraints</h2>
          <ul className="list-inside list-disc text-xs text-text-2">
            {problem.constraints.map((constraint, index) => (
              <li key={index}>{constraint}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-text-1">
            Hints ({revealedHints}/{problem.hints.length} revealed)
          </h2>
          <ul className="space-y-2">
            {problem.hints.slice(0, revealedHints).map((hint, index) => (
              <li
                key={index}
                className="rounded-card border border-border bg-surface p-2 text-xs text-text-1"
              >
                {hint}
              </li>
            ))}
          </ul>
          {revealedHints < problem.hints.length && (
            <button
              onClick={onRevealNextHint}
              className="mt-2 min-h-[44px] rounded-control border border-border px-3 text-xs text-text-2 hover:bg-surface-2 hover:text-text-1"
            >
              Reveal next hint
            </button>
          )}
        </div>

        <PythonSyntaxReference />
      </div>

      <div className="flex flex-col space-y-4 overflow-y-auto p-6">
        <CodeEditor value={code} onChange={onChangeCode} height="420px" />

        <div className="flex gap-2">
          <button
            onClick={onRun}
            disabled={running}
            className="min-h-[44px] rounded-control border border-border px-4 text-sm text-text-2 hover:bg-surface-2 hover:text-text-1 disabled:opacity-50"
          >
            Run tests
          </button>
          <button
            onClick={onSubmit}
            disabled={running}
            className="min-h-[44px] rounded-control bg-accent px-4 text-sm font-semibold text-bg disabled:opacity-50"
          >
            {submitLabel}
          </button>
          <ResetCodeButton onReset={onResetCode} />
        </div>

        {result && (
          <>
            <TestResults result={result} />
            {afterResult}
          </>
        )}
      </div>
    </div>
  )
}
