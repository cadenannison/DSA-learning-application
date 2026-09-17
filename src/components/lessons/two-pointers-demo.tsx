"use client"

import { StepControls, useSteps } from "@/components/lessons/step-controls"

const ARRAY = [2, 3, 5, 8, 11, 15, 20]
const TARGET = 23

interface Step {
  left: number
  right: number
  description: string
  found: boolean
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  let left = 0
  let right = ARRAY.length - 1

  steps.push({
    left,
    right,
    description: `Start with left at index ${left} (${ARRAY[left]}) and right at index ${right} (${ARRAY[right]}). Target sum is ${TARGET}.`,
    found: false,
  })

  while (left < right) {
    const sum = ARRAY[left] + ARRAY[right]
    if (sum === TARGET) {
      steps.push({
        left,
        right,
        description: `${ARRAY[left]} + ${ARRAY[right]} = ${sum}, which equals the target. Found the pair!`,
        found: true,
      })
      break
    } else if (sum < TARGET) {
      const nextLeft = left + 1
      steps.push({
        left: nextLeft,
        right,
        description: `${ARRAY[left]} + ${ARRAY[right]} = ${sum}, too small. Move left inward to index ${nextLeft} (${ARRAY[nextLeft]}).`,
        found: false,
      })
      left = nextLeft
    } else {
      const nextRight = right - 1
      steps.push({
        left,
        right: nextRight,
        description: `${ARRAY[left]} + ${ARRAY[right]} = ${sum}, too big. Move right inward to index ${nextRight} (${ARRAY[nextRight]}).`,
        found: false,
      })
      right = nextRight
    }
  }

  return steps
}

const STEPS = buildSteps()

export function TwoPointersDemo() {
  const { stepIndex, playing, next, prev, reset, togglePlay } = useSteps(STEPS.length)
  const step = STEPS[stepIndex]

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <div className="text-xs text-muted">
        Scenario: find two numbers in a sorted array that sum to {TARGET}.
      </div>

      <div className="flex flex-wrap items-end justify-center gap-2 py-4">
        {ARRAY.map((value, index) => {
          const isLeft = index === step.left
          const isRight = index === step.right
          const isActive = isLeft || isRight

          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <div className="h-5 text-xs font-medium">
                {isLeft && <span className="text-blue-600 dark:text-blue-400">L</span>}
                {isLeft && isRight && " "}
                {isRight && <span className="text-purple-600 dark:text-purple-400">R</span>}
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-md border text-sm font-mono transition-colors ${
                  step.found && isActive
                    ? "border-green-500 bg-green-500/20"
                    : isLeft
                      ? "border-blue-500 bg-blue-500/10"
                      : isRight
                        ? "border-purple-500 bg-purple-500/10"
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
