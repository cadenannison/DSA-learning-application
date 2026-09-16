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
  return status === "passed" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
}

export function TestResults({ result }: { result: ExecutionResult }) {
  const passedCount = result.results.filter((r) => r.status === "passed").length

  return (
    <div className="space-y-3">
      <div className={`font-medium ${result.allPassed ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
        {passedCount} / {result.results.length} test cases passed
        {result.allPassed && " — all tests passed"}
      </div>
      <ul className="space-y-2">
        {result.results.map((testResult, index) => (
          <li key={index} className="rounded-md border border-border p-3 text-sm">
            <div className={`font-medium ${statusColor(testResult.status)}`}>
              Case {index + 1}: {statusLabel(testResult.status)}
              {testResult.isHidden && testResult.status === "passed" ? " (hidden)" : ""}
            </div>
            {!testResult.isHidden && testResult.status !== "passed" && (
              <div className="mt-1 space-y-0.5 font-mono text-xs text-muted">
                <div>input: {JSON.stringify(testResult.input)}</div>
                <div>expected: {JSON.stringify(testResult.expected)}</div>
                <div>actual: {JSON.stringify(testResult.actual)}</div>
                {testResult.errorMessage && <div>error: {testResult.errorMessage}</div>}
              </div>
            )}
            {testResult.isHidden && testResult.status !== "passed" && (
              <div className="mt-1 text-xs text-muted">Hidden test case failed.</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
