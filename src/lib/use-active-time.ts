import { useEffect, useRef } from "react"

/** Tracks wall-clock milliseconds spent on the current page while its tab is actually visible
 * — accumulates while focused, freezes while backgrounded (switched tabs, minimized), and
 * resumes on return. `elapsedMs()` reads the running total at any point (e.g. right before a
 * submit) without stopping the clock. Resets whenever `resetKey` changes, so a workbench that
 * stays mounted across different problems (same route, new problem id) starts a fresh clock
 * per problem instead of carrying over time from the previous one. */
export function useActiveTime(resetKey: string) {
  const accumulatedMsRef = useRef(0)
  const segmentStartRef = useRef<number | null>(null)

  useEffect(() => {
    accumulatedMsRef.current = 0
    segmentStartRef.current = document.visibilityState === "visible" ? performance.now() : null

    function handleVisibilityChange() {
      const now = performance.now()
      if (document.visibilityState === "visible") {
        segmentStartRef.current = now
      } else if (segmentStartRef.current !== null) {
        accumulatedMsRef.current += now - segmentStartRef.current
        segmentStartRef.current = null
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [resetKey])

  function elapsedMs(): number {
    const now = performance.now()
    const openSegment = segmentStartRef.current !== null ? now - segmentStartRef.current : 0
    return Math.round(accumulatedMsRef.current + openSegment)
  }

  return { elapsedMs }
}
