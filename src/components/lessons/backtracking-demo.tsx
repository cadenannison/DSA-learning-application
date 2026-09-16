"use client"

import { StepControls, useSteps } from "@/components/lessons/step-controls"

const ELEMENTS = [1, 2, 3]

interface Step {
  index: number
  path: number[]
  action: "consider" | "include" | "exclude" | "record" | "undo"
  results: number[][]
  description: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const results: number[][] = []
  const path: number[] = []

  function backtrack(index: number) {
    if (index === ELEMENTS.length) {
      results.push([...path])
      steps.push({
        index,
        path: [...path],
        action: "record",
        results: [...results],
        description: `Reached the end — record the current subset [${path.join(", ")}].`,
      })
      return
    }

    const value = ELEMENTS[index]
    steps.push({
      index,
      path: [...path],
      action: "consider",
      results: [...results],
      description: `Consider element ${value}: include it, or skip it.`,
    })

    path.push(value)
    steps.push({
      index,
      path: [...path],
      action: "include",
      results: [...results],
      description: `Include ${value} — path is now [${path.join(", ")}]. Recurse on the rest.`,
    })
    backtrack(index + 1)
    path.pop()
    steps.push({
      index,
      path: [...path],
      action: "undo",
      results: [...results],
      description: `Backtrack: remove ${value} from the path before trying the other branch.`,
    })

    steps.push({
      index,
      path: [...path],
      action: "exclude",
      results: [...results],
      description: `Exclude ${value} — path stays [${path.join(", ") || "empty"}]. Recurse on the rest.`,
    })
    backtrack(index + 1)
  }

  backtrack(0)

  steps.push({
    index: ELEMENTS.length,
    path: [],
    action: "record",
    results: [...results],
    description: `Done. Found all ${results.length} subsets of [${ELEMENTS.join(", ")}].`,
  })

  return steps
}

const STEPS = buildSteps()

export function BacktrackingDemo() {
  const { stepIndex, playing, next, prev, reset, togglePlay } = useSteps(STEPS.length)
  const step = STEPS[stepIndex]

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <div className="text-xs text-muted">
        Scenario: generate all subsets of [{ELEMENTS.join(", ")}] by including or excluding each element.
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 py-4">
        {ELEMENTS.map((value, index) => {
          const inPath = step.path.includes(value)
          const isCurrent = index === step.index

          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <div className="h-5 text-xs font-medium">
                {isCurrent && <span className="text-accent">current</span>}
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-md border text-sm font-mono transition-colors ${
                  inPath
                    ? "border-green-500 bg-green-500/20"
                    : isCurrent
                      ? "border-accent bg-accent/10"
                      : "border-border"
                }`}
              >
                {value}
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-center text-xs text-muted">
        Current path: <span className="font-mono">[{step.path.join(", ")}]</span>
      </div>

      <div className="rounded-md border border-border bg-surface p-3">
        <div className="mb-1 text-xs font-medium text-muted">
          Subsets found so far ({step.results.length}):
        </div>
        <div className="flex flex-wrap gap-1.5">
          {step.results.map((subset, i) => (
            <span
              key={i}
              className="rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[11px]"
            >
              [{subset.join(", ")}]
            </span>
          ))}
          {step.results.length === 0 && <span className="text-xs text-muted">none yet</span>}
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
