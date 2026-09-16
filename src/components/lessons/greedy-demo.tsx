"use client"

import { StepControls, useSteps } from "@/components/lessons/step-controls"

const ARRAY = [2, 3, 1, 1, 4]

interface Step {
  index: number
  farthest: number
  stuck: boolean
  description: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  let farthest = 0

  steps.push({
    index: 0,
    farthest,
    stuck: false,
    description: `Start at index 0. Farthest reachable so far: ${farthest}.`,
  })

  for (let i = 0; i < ARRAY.length; i++) {
    if (i > farthest) {
      steps.push({
        index: i,
        farthest,
        stuck: true,
        description: `Index ${i} is past the farthest reachable index (${farthest}) — we can never get here. Stuck.`,
      })
      return steps
    }

    const reach = i + ARRAY[i]
    const improved = reach > farthest

    if (improved) farthest = reach

    steps.push({
      index: i,
      farthest,
      stuck: false,
      description: `At index ${i}, nums[${i}] = ${ARRAY[i]} lets us reach index ${reach}.${
        improved ? ` That's farther than before — update farthest to ${farthest}.` : ` That's not farther than ${farthest}, no update.`
      }`,
    })
  }

  steps.push({
    index: ARRAY.length - 1,
    farthest,
    stuck: false,
    description: `Done. Farthest reachable (${farthest}) covers the last index (${ARRAY.length - 1}) — you can reach the end.`,
  })

  return steps
}

const STEPS = buildSteps()

export function GreedyDemo() {
  const { stepIndex, playing, next, prev, reset, togglePlay } = useSteps(STEPS.length)
  const step = STEPS[stepIndex]

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <div className="text-xs text-muted">
        Scenario: jump game — can you reach the last index of [{ARRAY.join(", ")}]?
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 py-4">
        {ARRAY.map((value, index) => {
          const isCurrent = index === step.index
          const reachable = index <= step.farthest
          const isFarthest = index === step.farthest

          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <div className="h-5 text-xs font-medium">
                {isCurrent && <span className="text-blue-600 dark:text-blue-400">here</span>}
                {isFarthest && !isCurrent && <span className="text-accent">farthest</span>}
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-md border text-sm font-mono transition-colors ${
                  step.stuck && isCurrent
                    ? "border-red-500 bg-red-500/20"
                    : isCurrent
                      ? "border-blue-500 bg-blue-500/10"
                      : isFarthest
                        ? "border-accent bg-accent/10"
                        : reachable
                          ? "border-green-500 bg-green-500/10"
                          : "border-border opacity-40"
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
