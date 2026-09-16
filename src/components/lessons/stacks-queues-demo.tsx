"use client"

import { StepControls, useSteps } from "@/components/lessons/step-controls"

const INPUT = "{[()]}"

const PAIRS: Record<string, string> = { ")": "(", "]": "[", "}": "{" }
const OPENERS = new Set(["(", "[", "{"])

interface Step {
  index: number
  stack: string[]
  valid: boolean | null
  description: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const stack: string[] = []

  steps.push({
    index: -1,
    stack: [],
    valid: null,
    description: `Scan "${INPUT}" left to right with an empty stack.`,
  })

  for (let i = 0; i < INPUT.length; i++) {
    const ch = INPUT[i]

    if (OPENERS.has(ch)) {
      stack.push(ch)
      steps.push({
        index: i,
        stack: [...stack],
        valid: null,
        description: `'${ch}' is an opening bracket — push it onto the stack.`,
      })
    } else {
      const top = stack[stack.length - 1]
      if (top === PAIRS[ch]) {
        stack.pop()
        steps.push({
          index: i,
          stack: [...stack],
          valid: null,
          description: `'${ch}' matches the top of the stack ('${top}') — pop it.`,
        })
      } else {
        steps.push({
          index: i,
          stack: [...stack],
          valid: false,
          description: `'${ch}' does not match the top of the stack — invalid.`,
        })
        return steps
      }
    }
  }

  const valid = stack.length === 0
  steps.push({
    index: INPUT.length - 1,
    stack: [...stack],
    valid,
    description: valid
      ? "Done. Stack is empty — every bracket was matched. Valid!"
      : `Done scanning, but the stack still has ${stack.length} unmatched opener(s) — invalid.`,
  })

  return steps
}

const STEPS = buildSteps()

export function StacksQueuesDemo() {
  const { stepIndex, playing, next, prev, reset, togglePlay } = useSteps(STEPS.length)
  const step = STEPS[stepIndex]

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <div className="text-xs text-muted">Scenario: check whether &quot;{INPUT}&quot; has balanced brackets.</div>

      <div className="flex flex-wrap items-center justify-center gap-2 py-2">
        {INPUT.split("").map((ch, index) => {
          const isCurrent = index === step.index
          return (
            <div
              key={index}
              className={`flex h-10 w-10 items-center justify-center rounded-md border text-base font-mono transition-colors ${
                isCurrent
                  ? step.valid === false
                    ? "border-red-500 bg-red-500/20"
                    : "border-accent bg-accent/10"
                  : "border-border"
              }`}
            >
              {ch}
            </div>
          )
        })}
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="text-[10px] font-medium text-muted">Stack (top on the right)</div>
        <div className="flex min-h-12 items-center gap-1 rounded-md border border-dashed border-border px-3 py-2">
          {step.stack.length === 0 && <span className="text-xs text-muted">empty</span>}
          {step.stack.map((ch, i) => (
            <div
              key={i}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface font-mono text-sm"
            >
              {ch}
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
