"use client"

import { StepControls, useSteps } from "@/components/lessons/step-controls"

const ARRAY = [-2, 1, -3, 4, -1, 2, 1, -5, 4]

interface Step {
  index: number
  currentSum: number
  bestSum: number
  bestStart: number
  bestEnd: number
  currentStart: number
  restarted: boolean
  description: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  let currentSum = ARRAY[0]
  let bestSum = ARRAY[0]
  let currentStart = 0
  let bestStart = 0
  let bestEnd = 0

  steps.push({
    index: 0,
    currentSum,
    bestSum,
    bestStart,
    bestEnd,
    currentStart,
    restarted: false,
    description: `Start with best-ending-here = nums[0] = ${ARRAY[0]}. Best sum so far is ${bestSum}.`,
  })

  for (let i = 1; i < ARRAY.length; i++) {
    const extend = currentSum + ARRAY[i]
    const restart = ARRAY[i]
    const restarted = restart > extend

    currentSum = restarted ? restart : extend
    currentStart = restarted ? i : currentStart

    const description = restarted
      ? `nums[${i}] = ${ARRAY[i]}. Extending the previous run (${extend}) is worse than starting fresh here (${restart}) — restart the window at index ${i}.`
      : `nums[${i}] = ${ARRAY[i]}. Extending the previous run (${extend}) beats starting fresh (${restart}) — extend the window.`

    steps.push({
      index: i,
      currentSum,
      bestSum,
      bestStart,
      bestEnd,
      currentStart,
      restarted,
      description,
    })

    if (currentSum > bestSum) {
      bestSum = currentSum
      bestStart = currentStart
      bestEnd = i
      steps.push({
        index: i,
        currentSum,
        bestSum,
        bestStart,
        bestEnd,
        currentStart,
        restarted,
        description: `New best sum: ${bestSum}, from index ${bestStart} to ${bestEnd}.`,
      })
    }
  }

  steps.push({
    index: ARRAY.length - 1,
    currentSum,
    bestSum,
    bestStart,
    bestEnd,
    currentStart,
    restarted: false,
    description: `Done. Maximum subarray sum is ${bestSum}, from index ${bestStart} to ${bestEnd}.`,
  })

  return steps
}

const STEPS = buildSteps()

export function DynamicProgrammingDemo() {
  const { stepIndex, playing, next, prev, reset, togglePlay } = useSteps(STEPS.length)
  const step = STEPS[stepIndex]

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <div className="text-xs text-muted">
        Scenario: maximum subarray sum (Kadane&apos;s algorithm) over [{ARRAY.join(", ")}].
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 py-4">
        {ARRAY.map((value, index) => {
          const inCurrentRun = index >= step.currentStart && index <= step.index
          const inBestRun = index >= step.bestStart && index <= step.bestEnd

          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-md border text-sm font-mono transition-colors ${
                  inBestRun
                    ? "border-green-500 bg-green-500/20"
                    : inCurrentRun
                      ? "border-accent bg-accent/10"
                      : "border-border"
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
        <span>Current run sum: {step.currentSum}</span>
        <span>Best sum so far: {step.bestSum}</span>
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
