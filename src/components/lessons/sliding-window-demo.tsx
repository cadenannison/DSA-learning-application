"use client"

import { StepControls, useSteps } from "@/components/lessons/step-controls"

const ARRAY = [2, 1, 5, 2, 3, 2]
const TARGET_SUM = 7

interface Step {
  start: number
  end: number
  sum: number
  description: string
  bestLength: number | null
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  let start = 0
  let sum = 0
  let bestLength: number | null = null

  for (let end = 0; end < ARRAY.length; end++) {
    sum += ARRAY[end]
    steps.push({
      start,
      end,
      sum,
      bestLength,
      description: `Add nums[${end}] = ${ARRAY[end]} to the window. Window is [${start}, ${end}], sum = ${sum}.`,
    })

    while (sum >= TARGET_SUM) {
      const length = end - start + 1
      if (bestLength === null || length < bestLength) {
        bestLength = length
      }
      steps.push({
        start,
        end,
        sum,
        bestLength,
        description: `Sum ${sum} >= target ${TARGET_SUM}. Window length ${length}${
          bestLength === length ? " is the new best" : ""
        }. Shrink from the left: remove nums[${start}] = ${ARRAY[start]}.`,
      })
      sum -= ARRAY[start]
      start += 1
    }
  }

  steps.push({
    start,
    end: ARRAY.length - 1,
    sum,
    bestLength,
    description: `Done. Smallest window with sum >= ${TARGET_SUM} has length ${bestLength}.`,
  })

  return steps
}

const STEPS = buildSteps()

export function SlidingWindowDemo() {
  const { stepIndex, playing, next, prev, reset, togglePlay } = useSteps(STEPS.length)
  const step = STEPS[stepIndex]

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <div className="text-xs text-muted">
        Scenario: smallest contiguous subarray with sum &ge; {TARGET_SUM}.
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 py-4">
        {ARRAY.map((value, index) => {
          const inWindow = index >= step.start && index <= step.end

          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-md border text-sm font-mono transition-colors ${
                  inWindow ? "border-accent bg-accent/10" : "border-border"
                }`}
              >
                {value}
              </div>
              <div className="text-[10px] text-muted">{index}</div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-center gap-6 text-xs text-muted">
        <span>Window sum: {step.sum}</span>
        <span>Best length so far: {step.bestLength ?? "—"}</span>
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
