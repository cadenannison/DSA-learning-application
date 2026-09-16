"use client"

import { StepControls, useSteps } from "@/components/lessons/step-controls"

const VALUES = [1, 2, 3, 4, 5]

interface Step {
  // next[i] is the index this node currently points to, or null for "points to null"
  next: (number | null)[]
  prev: number | null
  curr: number | null
  description: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const next: (number | null)[] = VALUES.map((_, i) => (i + 1 < VALUES.length ? i + 1 : null))

  let prev: number | null = null
  let curr: number | null = 0

  steps.push({
    next: [...next],
    prev,
    curr,
    description: `Start with prev = null and curr = head (node ${VALUES[curr]}).`,
  })

  while (curr !== null) {
    const nextNode: number | null = next[curr]
    next[curr] = prev

    steps.push({
      next: [...next],
      prev,
      curr,
      description:
        prev === null
          ? `Save curr.next, then point node ${VALUES[curr]}'s next to null (it's the new tail).`
          : `Save curr.next, then point node ${VALUES[curr]}'s next back to node ${VALUES[prev]}.`,
    })

    prev = curr
    curr = nextNode

    steps.push({
      next: [...next],
      prev,
      curr,
      description:
        curr === null
          ? `Advance prev to node ${VALUES[prev]} and curr to null. Loop ends — prev is the new head.`
          : `Advance prev to node ${VALUES[prev]} and curr to node ${VALUES[curr]}.`,
    })
  }

  steps.push({
    next: [...next],
    prev,
    curr,
    description: `Done. The list is fully reversed; node ${VALUES[prev!]} is the new head.`,
  })

  return steps
}

const STEPS = buildSteps()

export function LinkedListDemo() {
  const { stepIndex, playing, next, prev, reset, togglePlay } = useSteps(STEPS.length)
  const step = STEPS[stepIndex]

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <div className="text-xs text-muted">Scenario: reverse a singly linked list in place.</div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 py-4">
        {VALUES.map((value, index) => {
          const isPrev = index === step.prev
          const isCurr = index === step.curr
          const target = step.next[index]

          return (
            <div key={index} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-5 gap-1 text-xs font-medium">
                  {isPrev && <span className="text-purple-600 dark:text-purple-400">prev</span>}
                  {isCurr && <span className="text-blue-600 dark:text-blue-400">curr</span>}
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-md border text-sm font-mono transition-colors ${
                    isCurr
                      ? "border-blue-500 bg-blue-500/10"
                      : isPrev
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-border"
                  }`}
                >
                  {value}
                </div>
                <div className="text-[10px] text-muted">
                  next &rarr; {target === null ? "null" : VALUES[target]}
                </div>
              </div>
              {index < VALUES.length - 1 && <span className="text-muted">&hellip;</span>}
            </div>
          )
        })}
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
