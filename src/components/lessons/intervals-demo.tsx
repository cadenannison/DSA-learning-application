"use client"

import { StepControls, useSteps } from "@/components/lessons/step-controls"

const INTERVALS: [number, number][] = [
  [1, 3],
  [2, 6],
  [8, 10],
  [15, 18],
]

const SORTED = [...INTERVALS].sort((a, b) => a[0] - b[0])
const MIN = Math.min(...INTERVALS.map(([s]) => s))
const MAX = Math.max(...INTERVALS.map(([, e]) => e))

interface Step {
  index: number
  merged: [number, number][]
  current: [number, number] | null
  description: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const merged: [number, number][] = []

  steps.push({
    index: -1,
    merged: [],
    current: null,
    description: `Sort intervals by start: ${SORTED.map(([s, e]) => `[${s}, ${e}]`).join(", ")}.`,
  })

  for (let i = 0; i < SORTED.length; i++) {
    const [start, end] = SORTED[i]
    const last = merged[merged.length - 1]

    if (!last || start > last[1]) {
      merged.push([start, end])
      steps.push({
        index: i,
        merged: merged.map((iv) => [...iv] as [number, number]),
        current: [start, end],
        description:
          !last
            ? `Take [${start}, ${end}] as the first merged interval.`
            : `[${start}, ${end}] starts after the last merged interval ends (${last[1]}) — no overlap. Add it as a new interval.`,
      })
    } else {
      const newEnd = Math.max(last[1], end)
      steps.push({
        index: i,
        merged: merged.map((iv) => [...iv] as [number, number]),
        current: [start, end],
        description: `[${start}, ${end}] overlaps the last merged interval (starts at ${start} <= ${last[1]}) — extend its end to max(${last[1]}, ${end}) = ${newEnd}.`,
      })
      last[1] = newEnd
      steps.push({
        index: i,
        merged: merged.map((iv) => [...iv] as [number, number]),
        current: [start, end],
        description: `Merged interval is now [${last[0]}, ${last[1]}].`,
      })
    }
  }

  steps.push({
    index: SORTED.length,
    merged: merged.map((iv) => [...iv] as [number, number]),
    current: null,
    description: `Done. Merged result: ${merged.map(([s, e]) => `[${s}, ${e}]`).join(", ")}.`,
  })

  return steps
}

const STEPS = buildSteps()

function toPercent(value: number) {
  return ((value - MIN) / (MAX - MIN)) * 100
}

export function IntervalsDemo() {
  const { stepIndex, playing, next, prev, reset, togglePlay } = useSteps(STEPS.length)
  const step = STEPS[stepIndex]

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <div className="text-xs text-muted">
        Scenario: merge all overlapping intervals in {INTERVALS.map(([s, e]) => `[${s}, ${e}]`).join(", ")}.
      </div>

      <div className="space-y-2 py-2">
        <div className="text-[10px] font-medium text-muted">Sorted input</div>
        <div className="relative h-8">
          {SORTED.map(([start, end], i) => {
            const isCurrent = i === step.index
            return (
              <div
                key={i}
                className={`absolute top-0 flex h-7 items-center justify-center rounded-md border text-[10px] font-mono transition-colors ${
                  isCurrent ? "border-accent bg-accent/10" : "border-border bg-background"
                }`}
                style={{
                  left: `${toPercent(start)}%`,
                  width: `${toPercent(end) - toPercent(start)}%`,
                }}
              >
                {start}-{end}
              </div>
            )
          })}
        </div>

        <div className="text-[10px] font-medium text-muted">Merged output</div>
        <div className="relative h-8">
          {step.merged.map(([start, end], i) => (
            <div
              key={i}
              className="absolute top-0 flex h-7 items-center justify-center rounded-md border border-green-500 bg-green-500/20 text-[10px] font-mono"
              style={{
                left: `${toPercent(start)}%`,
                width: `${toPercent(end) - toPercent(start)}%`,
              }}
            >
              {start}-{end}
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm">{step.description}</p>

      <StepControls
        stepIndex={stepIndex}
        stepCount={STEPS.length}
        playing={playing}
        onNext={next}
        onPrev={prev}
        onReset={reset}
        onTogglePlay={togglePlay}
      />
    </div>
  )
}
