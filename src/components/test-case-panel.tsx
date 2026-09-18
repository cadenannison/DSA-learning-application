"use client"

import { useState } from "react"
import { CheckIcon, XIcon, statusColor, statusLabel } from "@/components/test-result-badge"
import type { TestCase, TestCaseResult, TestOutcomeStatus } from "@/types"

function statusDotColor(status: TestOutcomeStatus): string {
  return status === "passed" ? "bg-success" : "bg-danger"
}

function formatValue(value: unknown): string {
  return JSON.stringify(value)
}

/** Viewer for a problem's visible test cases. A header strip up top holds the case selector
 * (horizontally-scrollable so it stays reachable regardless of case count, each tab carrying a
 * small pass/fail dot rather than a checkmark/X so it doesn't read as a dismiss control) plus
 * "Run this case"/"Reset" for the active one — visually secondary to the workbench's global "Run
 * tests"/"Submit" bar above it, since they act on one case rather than the whole suite. Below
 * that, the active case's labeled inputs (e.g. "nums = [2,7,11,15]", "target = 9") and expected
 * output render as muted reference data, with the run result (once present) as the highest-
 * contrast element in the panel. Hidden test cases are never shown as tabs, matching TestResults'
 * existing hidden-case redaction. Renders as normal block flow — its parent (the bottom-right
 * workbench panel) owns scrolling, so this never fights it for a second, nested scroll region. */
export function TestCasePanel({
  testCases,
  paramNames,
  onRunCase,
  running,
  caseResults,
  onResetCase,
}: {
  testCases: TestCase[]
  paramNames?: string[]
  onRunCase: (index: number) => void
  running: boolean
  /** Keyed by index into the original (unfiltered) testCases array. */
  caseResults: Record<number, TestCaseResult>
  /** Clears the run result for a single case (by its original testCases index), returning it
   * to its initial, un-run state. */
  onResetCase: (index: number) => void
}) {
  const visibleCases = testCases
    .map((testCase, index) => ({ testCase, index }))
    .filter(({ testCase }) => !testCase.isHidden)

  const [selected, setSelected] = useState(0)

  if (visibleCases.length === 0) {
    return <div className="p-4 text-xs text-text-2">No visible test cases for this problem.</div>
  }

  const active = visibleCases[Math.min(selected, visibleCases.length - 1)]
  const activeResult = caseResults[active.index]

  return (
    <div>
      <div className="border-b border-border p-3">
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {visibleCases.map(({ index }, tabPosition) => {
            const result = caseResults[index]
            const isActive = tabPosition === selected
            return (
              <button
                key={index}
                onClick={() => setSelected(tabPosition)}
                className={`flex min-h-[32px] shrink-0 items-center gap-2 rounded-control border px-3 text-xs font-medium ${
                  isActive
                    ? "border-accent bg-accent-soft text-text-1"
                    : "border-border text-text-2 hover:bg-surface-2 hover:text-text-1"
                }`}
              >
                Case {tabPosition + 1}
                {result && (
                  <span
                    aria-label={statusLabel(result.status)}
                    className={`h-1.5 w-1.5 rounded-full ${statusDotColor(result.status)}`}
                  />
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-2 flex gap-2">
          <button
            onClick={() => onRunCase(active.index)}
            disabled={running}
            className="min-h-[30px] rounded-control border border-border px-3 text-xs font-medium text-text-2 hover:bg-surface-2 hover:text-text-1 disabled:opacity-50"
          >
            Run this case
          </button>
          <button
            onClick={() => onResetCase(active.index)}
            disabled={running || !activeResult}
            className={`min-h-[30px] rounded-control border px-3 text-xs font-medium hover:bg-danger-soft hover:text-danger disabled:opacity-50 ${
              activeResult && activeResult.status !== "passed"
                ? "border-danger/40 bg-danger-soft text-danger"
                : "border-border text-danger/70"
            }`}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-3 p-3">
        {(paramNames ?? active.testCase.input.map((_, i) => `arg${i + 1}`)).map((name, i) => (
          <div key={name + i}>
            <div className="mb-1 text-xs text-text-2">{name} =</div>
            <div className="rounded-card border border-border-soft bg-surface/60 px-3 py-2 font-mono text-xs text-text-2">
              {formatValue(active.testCase.input[i])}
            </div>
          </div>
        ))}

        <div>
          <div className="mb-1 text-xs text-text-2">Expected output =</div>
          <div className="rounded-card border border-border-soft bg-surface/60 px-3 py-2 font-mono text-xs text-text-2">
            {formatValue(active.testCase.expected)}
          </div>
        </div>

        {activeResult && (
          <div
            className={`rounded-[9px] border px-3.5 py-3 text-sm ${
              activeResult.status === "passed"
                ? "border-success/25 bg-success-soft"
                : "border-danger/25 bg-danger-soft"
            }`}
          >
            <div className={`flex items-center gap-2 font-semibold ${statusColor(activeResult.status)}`}>
              {activeResult.status === "passed" ? <CheckIcon /> : <XIcon />}
              <span>{statusLabel(activeResult.status)}</span>
            </div>
            {activeResult.status !== "passed" && (
              <div className="mt-2 space-y-0.5 font-mono text-xs text-text-2">
                <div>expected: {formatValue(activeResult.expected)}</div>
                <div>actual: {formatValue(activeResult.actual)}</div>
                {activeResult.errorMessage && <div>error: {activeResult.errorMessage}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
