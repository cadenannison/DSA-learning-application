"use client"

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { CodeEditor } from "@/components/code-editor"
import { PythonSyntaxReference } from "@/components/python-syntax-reference"
import { ResetCodeButton } from "@/components/reset-code-button"
import { TestCasePanel } from "@/components/test-case-panel"
import { TestResults } from "@/components/test-results"
import type { ExecutionResult, Problem, TestCaseResult } from "@/types"

function HorizontalResizeHandle() {
  return (
    <PanelResizeHandle className="group relative w-2 shrink-0 cursor-col-resize bg-transparent">
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors group-hover:bg-accent group-data-[resize-handle-active]:bg-accent" />
    </PanelResizeHandle>
  )
}

function VerticalResizeHandle() {
  return (
    <PanelResizeHandle className="group relative h-2 shrink-0 cursor-row-resize bg-transparent">
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border transition-colors group-hover:bg-accent group-data-[resize-handle-active]:bg-accent" />
    </PanelResizeHandle>
  )
}

/** Shared three-pane problem-solving layout: prompt/constraints/hints on the left, the code
 * editor top-right, and an interactive test-case viewer + results bottom-right. Used by both
 * the library's /problems/[id] page and the study-plan workbook's problem route, which differ
 * only in their header chrome and in what happens on submit (generic progress recording vs.
 * study-problem completion) — everything about the actual solving experience is identical, so
 * it lives here once. Panes are independently resizable via react-resizable-panels. */
export function ProblemWorkbenchView({
  problem,
  code,
  onChangeCode,
  running,
  result,
  caseResults,
  onRun,
  onRunCase,
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
  /** Per-test-case results, keyed by index into problem.testCases — populated from either a
   * full "Run tests" pass or an individual "Run this case" click. */
  caseResults: Record<number, TestCaseResult>
  onRun: () => void
  onRunCase: (index: number) => void
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
    <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
      <Panel defaultSize={35} minSize={20}>
        <div className="h-full space-y-4 overflow-y-auto p-6">
          <div>
            <h1 className="font-display text-xl font-semibold text-text-1">{problem.title}</h1>
            <div className="mt-1 font-mono text-xs text-text-2">
              {problem.pattern} · {problem.difficulty}
            </div>
          </div>

          <p className="whitespace-pre-wrap text-sm text-text-1">{problem.prompt}</p>

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
      </Panel>

      <HorizontalResizeHandle />

      <Panel defaultSize={65} minSize={30}>
        <PanelGroup direction="vertical">
          <Panel defaultSize={60} minSize={20}>
            <div className="flex h-full flex-col gap-3 p-6">
              <div className="min-h-0 flex-1">
                <CodeEditor value={code} onChange={onChangeCode} height="100%" />
              </div>

              <div className="flex shrink-0 gap-2">
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
            </div>
          </Panel>

          <VerticalResizeHandle />

          <Panel defaultSize={40} minSize={20}>
            <div className="flex h-full flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-hidden">
                <TestCasePanel
                  testCases={problem.testCases}
                  paramNames={problem.paramNames}
                  onRunCase={onRunCase}
                  running={running}
                  caseResults={caseResults}
                />
              </div>

              {result && (
                <div className="shrink-0 space-y-4 overflow-y-auto border-t border-border p-4">
                  <TestResults result={result} />
                  {afterResult}
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  )
}
