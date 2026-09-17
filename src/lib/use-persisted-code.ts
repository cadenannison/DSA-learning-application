import { useState } from "react"

const STORAGE_PREFIX = "dsa-practice-code:"

function readDraft(problemId: string): string | null {
  try {
    return localStorage.getItem(STORAGE_PREFIX + problemId)
  } catch {
    return null
  }
}

function writeDraft(problemId: string, code: string) {
  try {
    localStorage.setItem(STORAGE_PREFIX + problemId, code)
  } catch {
    // best-effort — private browsing / storage quota shouldn't break editing
  }
}

/** Keeps a per-problem code draft in localStorage so an accidental refresh or navigating away
 * mid-solve doesn't lose progress. `starterCode` seeds the draft the first time a problem is
 * opened; after that, whatever the user typed wins on every subsequent visit, even across
 * sessions — same per-viewer-convenience convention as the theme toggle.
 *
 * Re-seeds during render (not an effect) when `problemId` changes, following React's
 * documented "adjusting state when a prop changes" pattern — avoids the extra render an
 * effect-based setState would cause. */
export function usePersistedCode(
  problemId: string | null,
  starterCode: string
): [string, (value: string) => void] {
  const [code, setCode] = useState("")
  const [loadedForProblemId, setLoadedForProblemId] = useState<string | null>(null)

  if (problemId && loadedForProblemId !== problemId) {
    setLoadedForProblemId(problemId)
    const draft = readDraft(problemId)
    setCode(draft ?? starterCode)
  }

  function updateCode(value: string) {
    setCode(value)
    if (problemId && loadedForProblemId === problemId) {
      writeDraft(problemId, value)
    }
  }

  return [code, updateCode]
}
