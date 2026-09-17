"use client"

import { useEffect, useState } from "react"

export function useSteps(stepCount: number) {
  const [stepIndex, setStepIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const atEnd = stepIndex >= stepCount - 1

  useEffect(() => {
    if (!playing || atEnd) return

    const timer = setTimeout(() => setStepIndex((index) => index + 1), 900)
    return () => clearTimeout(timer)
  }, [playing, atEnd, stepIndex])

  return {
    stepIndex,
    playing: playing && !atEnd,
    next: () => setStepIndex((index) => Math.min(index + 1, stepCount - 1)),
    prev: () => setStepIndex((index) => Math.max(index - 1, 0)),
    reset: () => {
      setPlaying(false)
      setStepIndex(0)
    },
    togglePlay: () => setPlaying((value) => !value),
  }
}

interface StepControlsProps {
  stepIndex: number
  stepCount: number
  playing: boolean
  onNext: () => void
  onPrev: () => void
  onReset: () => void
  onTogglePlay: () => void
}

export function StepControls({
  stepIndex,
  stepCount,
  playing,
  onNext,
  onPrev,
  onReset,
  onTogglePlay,
}: StepControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onPrev}
        disabled={stepIndex === 0}
        className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface disabled:opacity-40"
      >
        &larr; Prev
      </button>
      <button
        type="button"
        onClick={onTogglePlay}
        className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface"
      >
        {playing ? "Pause" : "Play"}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={stepIndex === stepCount - 1}
        className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface disabled:opacity-40"
      >
        Next &rarr;
      </button>
      <button
        type="button"
        onClick={onReset}
        className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface"
      >
        Reset
      </button>
      <span className="ml-auto text-xs text-muted">
        Step {stepIndex + 1} of {stepCount}
      </span>
    </div>
  )
}
