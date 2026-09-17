import type { TestOutcomeStatus } from "@/types"

export function statusLabel(status: TestOutcomeStatus): string {
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

export function statusColor(status: TestOutcomeStatus): string {
  return status === "passed" ? "text-success" : "text-danger"
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5 shrink-0">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5 shrink-0">
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
