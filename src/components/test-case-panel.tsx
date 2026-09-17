"use client"

import { useState } from "react"
import { CheckIcon, XIcon, statusColor, statusLabel } from "@/components/test-result-badge"
import type { TestCase, TestCaseResult } from "@/types"

function formatValue(value: unknown): string {
  return JSON.stringify(value)
}

/** Tabbed viewer for a problem's visible test cases — shows each case's labeled inputs (e.g.
 * "nums = [2,7,11,15]", "target = 9") and lets the user run that one case independently of the
 * full "Run tests" suite. Hidden test cases are never shown as tabs, matching TestResults'
 * existing hidden-case redaction. */
export function TestCasePanel({
  testCases,
  paramNames,
  onRunCase,
  running,
  caseResults,
}: {
  testCases: TestCase[]
  paramNames?: string[]
  onRunCase: (index: number) => void
  running: boolean
  /** Keyed by index into the original (unfiltered) testCases array. */
  caseResults: Record<number, TestCaseResult>
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
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap gap-1 border-b border-border px-3 pb-2 pt-3">
        {visibleCases.map(({ index }, tabPosition) => {
          const result = caseResults[index]
          const isActive = tabPosition === selected
          return (
            <button
              key={index}
              onClick={() => setSelected(tabPosition)}
              className={`flex min-h-[32px] items-center gap-1.5 rounded-control px-3 text-xs font-medium ${
                isActive
                  ? "bg-surface-2 text-text-1"
                  : "text-text-2 hover:bg-surface-2 hover:text-text-1"
              }`}
            >
              Case {tabPosition + 1}
              {result && (
                <span className={statusColor(result.status)}>
                  {result.status === "passed" ? <CheckIcon /> : <XIcon />}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {(paramNames ?? active.testCase.input.map((_, i) => `arg${i + 1}`)).map((name, i) => (
          <div key={name + i}>
            <div className="mb-1 text-xs text-text-2">{name} =</div>
            <div className="rounded-card border border-border bg-surface px-3 py-2 font-mono text-xs text-text-1">
              {formatValue(active.testCase.input[i])}
            </div>
          </div>
        ))}

        {activeResult && (
          <div
            className={`rounded-[9px] border px-3 py-2.5 text-sm ${
              activeResult.status === "passed"
                ? "border-success/25 bg-success-soft"
                : "border-border-soft bg-surface"
            }`}
          >
            <div className={`flex items-center gap-2 font-medium ${statusColor(activeResult.status)}`}>
              {activeResult.status === "passed" ? <CheckIcon /> : <XIcon />}
              <span>{statusLabel(activeResult.status)}</span>
            </div>
            {activeResult.status !== "passed" && (
              <div className="mt-1.5 space-y-0.5 font-mono text-xs text-text-2">
                <div>expected: {formatValue(activeResult.expected)}</div>
                <div>actual: {formatValue(activeResult.actual)}</div>
                {activeResult.errorMessage && <div>error: {activeResult.errorMessage}</div>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <button
          onClick={() => onRunCase(active.index)}
          disabled={running}
          className="min-h-[36px] w-full rounded-control border border-border text-xs font-medium text-text-2 hover:bg-surface-2 hover:text-text-1 disabled:opacity-50"
        >
          Run this case
        </button>
      </div>
    </div>
  )
}
