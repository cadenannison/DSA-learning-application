"use client"

import { StepControls, useSteps } from "@/components/lessons/step-controls"

const INSERT_ORDER = [5, 3, 8, 1, 9, 2]

interface Step {
  heap: number[]
  highlight: number[]
  description: string
}

function parentOf(i: number) {
  return Math.floor((i - 1) / 2)
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const heap: number[] = []

  for (const value of INSERT_ORDER) {
    heap.push(value)
    let i = heap.length - 1

    steps.push({
      heap: [...heap],
      highlight: [i],
      description: `Insert ${value} at the end of the array (index ${i}).`,
    })

    while (i > 0 && heap[parentOf(i)] > heap[i]) {
      const p = parentOf(i)
      steps.push({
        heap: [...heap],
        highlight: [i, p],
        description: `${heap[i]} < parent ${heap[p]} — swap them (min-heap property violated).`,
      })
      ;[heap[i], heap[p]] = [heap[p], heap[i]]
      i = p
      steps.push({
        heap: [...heap],
        highlight: [i],
        description: `${value} bubbled up to index ${i}.`,
      })
    }

    steps.push({
      heap: [...heap],
      highlight: [],
      description: `Heap property holds for ${value}'s position. Min is now ${heap[0]}.`,
    })
  }

  steps.push({
    heap: [...heap],
    highlight: [0],
    description: `Done. All values inserted — the minimum, ${heap[0]}, is always at the root (index 0).`,
  })

  return steps
}

const STEPS = buildSteps()

interface Pos {
  x: number
  y: number
}

function layout(count: number): Pos[] {
  const positions: Pos[] = []
  for (let i = 0; i < count; i++) {
    const level = Math.floor(Math.log2(i + 1))
    const indexInLevel = i + 1 - 2 ** level
    const slots = 2 ** level
    const x = ((indexInLevel + 0.5) / slots) * 100
    const y = 12 + level * 28
    positions.push({ x, y })
  }
  return positions
}

const MAX_POSITIONS = layout(INSERT_ORDER.length)

export function HeapsDemo() {
  const { stepIndex, playing, next, prev, reset, togglePlay } = useSteps(STEPS.length)
  const step = STEPS[stepIndex]
  const positions = MAX_POSITIONS.slice(0, step.heap.length)

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <div className="text-xs text-muted">
        Scenario: insert {INSERT_ORDER.join(", ")} into a min-heap, one at a time.
      </div>

      <div className="relative h-48 w-full">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 90" preserveAspectRatio="none">
          {positions.map((pos, i) => {
            if (i === 0) return null
            const parent = positions[parentOf(i)]
            return (
              <line
                key={i}
                x1={parent.x}
                y1={parent.y}
                x2={pos.x}
                y2={pos.y}
                stroke="var(--color-border)"
                strokeWidth={0.6}
              />
            )
          })}
        </svg>

        {step.heap.map((value, i) => {
          const pos = positions[i]
          const isHighlighted = step.highlight.includes(i)
          const isRoot = i === 0

          return (
            <div
              key={i}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-mono transition-colors ${
                  isHighlighted
                    ? "border-accent bg-accent text-white"
                    : isRoot
                      ? "border-green-500 bg-green-500/20"
                      : "border-border bg-background"
                }`}
              >
                {value}
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-center text-xs text-muted">
        Array: <span className="font-mono">[{step.heap.join(", ")}]</span>
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
