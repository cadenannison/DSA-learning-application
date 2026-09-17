import type { ExecutionResult } from "@/types"

function statusLabel(status: string): string {
  switch (status) {
    case "passed":
      return "Passed"
    case "wrong_answer":
      return "Wrong answer"
    case "runtime_error":
      return "Runtime error"
    case "timeout":
      return "Timed out"
    default:
      return status
  }
}

function statusColor(status: string): string {
  return status === "passed" ? "text-success" : "text-danger"
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5 shrink-0">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5 shrink-0">
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TestResults({ result }: { result: ExecutionResult }) {
  const passedCount = result.results.filter((r) => r.status === "passed").length

  return (
    <div className="space-y-3">
      <div className="text-[12.5px] font-semibold uppercase tracking-wide text-text-2">
        Test results
      </div>
      <div className={`font-mono text-sm font-medium ${result.allPassed ? "text-success" : "text-text-1"}`}>
        {passedCount} / {result.results.length} test cases passed
        {result.allPassed && " — all tests passed"}
      </div>
      <ul className="space-y-2">
        {result.results.map((testResult, index) => {
          const passed = testResult.status === "passed"
          return (
            <li
              key={index}
              className={`rounded-[9px] border px-3 py-2.5 text-sm ${
                passed ? "border-success/25 bg-success-soft" : "border-border-soft bg-surface"
              }`}
            >
              <div className={`flex items-center gap-2 font-medium ${statusColor(testResult.status)}`}>
                {passed ? <CheckIcon /> : <XIcon />}
                <span>
                  Case {index + 1}: {statusLabel(testResult.status)}
                  {testResult.isHidden && passed ? " (hidden)" : ""}
                </span>
              </div>
              {!testResult.isHidden && !passed && (
                <div className="mt-1.5 space-y-0.5 font-mono text-xs text-text-2">
                  <div>input: {JSON.stringify(testResult.input)}</div>
                  <div>expected: {JSON.stringify(testResult.expected)}</div>
                  <div>actual: {JSON.stringify(testResult.actual)}</div>
                  {testResult.errorMessage && <div>error: {testResult.errorMessage}</div>}
                </div>
              )}
              {testResult.isHidden && !passed && (
                <div className="mt-1.5 text-xs text-text-2">Hidden test case failed.</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
