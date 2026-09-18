"use client"

import { useEffect, useRef, useState } from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { CodeEditor } from "@/components/code-editor"
import { PythonSyntaxReference } from "@/components/python-syntax-reference"
import { ResetCodeButton } from "@/components/reset-code-button"
import { SubmitToast } from "@/components/ui/submit-toast"
import { TestCasePanel } from "@/components/test-case-panel"
import { TestResults } from "@/components/test-results"
import type { ExecutionResult, Problem, TestCaseResult } from "@/types"

function HorizontalResizeHandle() {
  return (
    <PanelResizeHandle className="group relative w-3 shrink-0 cursor-col-resize bg-transparent">
      <div className="absolute inset-y-0 left-1/2 w-1.5 -translate-x-1/2 rounded-full bg-border transition-colors group-hover:bg-accent group-data-[resize-handle-active]:bg-accent" />
    </PanelResizeHandle>
  )
}

function VerticalResizeHandle() {
  return (
    <PanelResizeHandle className="group relative h-3 shrink-0 cursor-row-resize bg-transparent">
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-border transition-colors group-hover:bg-accent group-data-[resize-handle-active]:bg-accent" />
    </PanelResizeHandle>
  )
}

const FONT_SCALE_MIN = 0.7
const FONT_SCALE_MAX = 2
const FONT_SCALE_STEP = 0.1

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
  onResetCase,
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
  /** Clears a single case's run result, returning it to its initial, un-run state. */
  onResetCase: (index: number) => void
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
  const [fontScale, setFontScale] = useState(1)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastKey, setToastKey] = useState(0)

  // Tags the *next* result/caseResults prop change with which action caused it, since the
  // workbench only receives the resulting data, not which button was pressed. The wrapped
  // handlers below stash the intent just before calling through to the parent's async handler;
  // the effect reads and clears it once the resulting props actually arrive.
  const pendingActionRef = useRef<"run" | "submit" | { runCaseIndex: number } | null>(null)
  const prevResultRef = useRef<ExecutionResult | null>(null)

  function fireToast(message: string) {
    setToastMessage(message)
    setToastKey((key) => key + 1)
  }

  useEffect(() => {
    const action = pendingActionRef.current
    pendingActionRef.current = null
    const previousResult = prevResultRef.current
    prevResultRef.current = result

    let message: string | null = null
    if (action === "submit") {
      if (result?.allPassed) message = "Submitted — solved!"
    } else if (action === "run") {
      // One toast per "Run tests" batch if at least one case in it passed — not one per case,
      // so a run where all 5 cases pass still only shows a single toast.
      if (result && result !== previousResult && result.results.some((r) => r.status === "passed")) {
        message = "Test case passed!"
      }
    } else if (action && typeof action === "object" && "runCaseIndex" in action) {
      if (caseResults[action.runCaseIndex]?.status === "passed") {
        message = "Test case passed!"
      }
    }

    // Deferred a tick rather than called synchronously in the effect body — this is a state
    // update driven by a prop change (a run/submit action just completing), not a plain
    // render-time side effect, so it's scheduled just outside the effect's own render pass.
    if (message) {
      const toastText = message
      queueMicrotask(() => fireToast(toastText))
    }
  }, [result, caseResults])

  function handleRun() {
    pendingActionRef.current = "run"
    onRun()
  }

  function handleRunCase(index: number) {
    pendingActionRef.current = { runCaseIndex: index }
    onRunCase(index)
  }

  function handleSubmit() {
    pendingActionRef.current = "submit"
    onSubmit()
  }

  function adjustFontScale(delta: number) {
    setFontScale((prev) => {
      const next = Math.round((prev + delta) * 100) / 100
      return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, next))
    })
  }

  return (
    <>
      <SubmitToast message={toastMessage} toastKey={toastKey} />
      <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        <Panel defaultSize={35} minSize={20}>
          <div className="h-full space-y-4 overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-xl font-semibold text-text-1">{problem.title}</h1>
                <div className="mt-1 font-mono text-xs text-text-2">
                  {problem.pattern} · {problem.difficulty}
                </div>
              </div>
              <ResetCodeButton onReset={onResetCode} />
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
                    {example.explanation && (
                      <div className="mt-1 font-sans text-text-2">{example.explanation}</div>
                    )}
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
        </Panel>

        <HorizontalResizeHandle />

        <Panel defaultSize={65} minSize={30}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={65} minSize={20} maxSize={85}>
              <div className="flex h-full min-h-0 flex-col overflow-hidden p-6">
                <div className="min-h-0 flex-1 overflow-hidden">
                  <CodeEditor value={code} onChange={onChangeCode} height="100%" fontScale={fontScale} />
                </div>
              </div>
            </Panel>

            <VerticalResizeHandle />

            <Panel defaultSize={35} minSize={15}>
              <div className="flex h-full flex-col overflow-hidden">
                <div className="flex shrink-0 items-center gap-2 border-b border-border p-4">
                  <button
                    onClick={handleRun}
                    disabled={running}
                    className="min-h-[44px] rounded-control border border-border px-4 text-sm text-text-2 hover:bg-surface-2 hover:text-text-1 disabled:opacity-50"
                  >
                    Run tests
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={running}
                    className="min-h-[44px] rounded-control bg-accent px-4 text-sm font-semibold text-bg disabled:opacity-50"
                  >
                    {submitLabel}
                  </button>

                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-xs text-text-2">Editor size</span>
                    <button
                      onClick={() => adjustFontScale(-FONT_SCALE_STEP)}
                      disabled={fontScale <= FONT_SCALE_MIN}
                      aria-label="Decrease editor text size"
                      className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-control border border-border text-sm text-text-2 hover:bg-surface-2 hover:text-text-1 disabled:opacity-50"
                    >
                      −
                    </button>
                    <button
                      onClick={() => adjustFontScale(FONT_SCALE_STEP)}
                      disabled={fontScale >= FONT_SCALE_MAX}
                      aria-label="Increase editor text size"
                      className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-control border border-border text-sm text-text-2 hover:bg-surface-2 hover:text-text-1 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  <TestCasePanel
                    testCases={problem.testCases}
                    paramNames={problem.paramNames}
                    onRunCase={handleRunCase}
                    onResetCase={onResetCase}
                    running={running}
                    caseResults={caseResults}
                  />

                  {result && (
                    <div className="space-y-4 border-t border-border p-4">
                      <TestResults result={result} />
                      {afterResult}
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </>
  )
}
