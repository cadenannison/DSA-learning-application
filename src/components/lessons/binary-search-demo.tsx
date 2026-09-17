"use client"

import { StepControls, useSteps } from "@/components/lessons/step-controls"

const ARRAY = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91]
const TARGET = 23

interface Step {
  lo: number
  hi: number
  mid: number | null
  description: string
  found: boolean
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  let lo = 0
  let hi = ARRAY.length - 1

  steps.push({
    lo,
    hi,
    mid: null,
    description: `Start with lo = ${lo}, hi = ${hi}. Looking for ${TARGET}.`,
    found: false,
  })

  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2)
    const value = ARRAY[mid]

    if (value === TARGET) {
      steps.push({
        lo,
        hi,
        mid,
        description: `mid = ${mid}, nums[mid] = ${value}. That's the target — found it!`,
        found: true,
      })
      break
    } else if (value < TARGET) {
      steps.push({
        lo,
        hi,
        mid,
        description: `mid = ${mid}, nums[mid] = ${value} < ${TARGET}. Target must be to the right — move lo to ${mid + 1}.`,
        found: false,
      })
      lo = mid + 1
    } else {
      steps.push({
        lo,
        hi,
        mid,
        description: `mid = ${mid}, nums[mid] = ${value} > ${TARGET}. Target must be to the left — move hi to ${mid - 1}.`,
        found: false,
      })
      hi = mid - 1
    }
  }

  return steps
}

const STEPS = buildSteps()

export function BinarySearchDemo() {
  const { stepIndex, playing, next, prev, reset, togglePlay } = useSteps(STEPS.length)
  const step = STEPS[stepIndex]

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <div className="text-xs text-muted">
        Scenario: find {TARGET} in a sorted array.
      </div>

      <div className="flex flex-wrap items-end justify-center gap-2 py-4">
        {ARRAY.map((value, index) => {
          const inRange = index >= step.lo && index <= step.hi
          const isMid = index === step.mid

          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <div className="h-5 text-xs font-medium">
                {isMid && (
                  <span className={step.found ? "text-green-600 dark:text-green-400" : "text-accent"}>
                    mid
                  </span>
                )}
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-md border text-sm font-mono transition-colors ${
                  step.found && isMid
                    ? "border-green-500 bg-green-500/20"
                    : isMid
                      ? "border-accent bg-accent/10"
                      : inRange
                        ? "border-border bg-surface"
                        : "border-border opacity-30"
                }`}
              >
                {value}
              </div>
              <div className="text-[10px] text-muted">{index}</div>
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
