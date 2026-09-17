"use client"

import { StepControls, useSteps } from "@/components/lessons/step-controls"

interface Node {
  id: string
  x: number
  y: number
}

// Directed edges represent "prerequisite -> course" (course-schedule style)
const NODES: Node[] = [
  { id: "A", x: 15, y: 15 },
  { id: "B", x: 50, y: 15 },
  { id: "C", x: 85, y: 15 },
  { id: "D", x: 30, y: 55 },
  { id: "E", x: 70, y: 55 },
  { id: "F", x: 50, y: 90 },
]

const EDGES: [string, string][] = [
  ["A", "D"],
  ["B", "D"],
  ["B", "E"],
  ["C", "E"],
  ["D", "F"],
  ["E", "F"],
]

const ADJACENCY: Record<string, string[]> = {}
const IN_DEGREE: Record<string, number> = {}
for (const node of NODES) {
  ADJACENCY[node.id] = []
  IN_DEGREE[node.id] = 0
}
for (const [from, to] of EDGES) {
  ADJACENCY[from].push(to)
  IN_DEGREE[to] += 1
}

interface Step {
  inDegree: Record<string, number>
  queue: string[]
  order: string[]
  current: string | null
  description: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const inDegree = { ...IN_DEGREE }
  const order: string[] = []
  const queue: string[] = NODES.filter((n) => inDegree[n.id] === 0).map((n) => n.id)

  steps.push({
    inDegree: { ...inDegree },
    queue: [...queue],
    order: [...order],
    current: null,
    description: `Compute in-degrees and enqueue every node with in-degree 0: ${queue.join(", ")}.`,
  })

  while (queue.length > 0) {
    const current = queue.shift()!
    order.push(current)
    steps.push({
      inDegree: { ...inDegree },
      queue: [...queue],
      order: [...order],
      current,
      description: `Dequeue ${current} and add it to the order.`,
    })

    for (const neighbor of ADJACENCY[current]) {
      inDegree[neighbor] -= 1
      const becameZero = inDegree[neighbor] === 0
      if (becameZero) queue.push(neighbor)
      steps.push({
        inDegree: { ...inDegree },
        queue: [...queue],
        order: [...order],
        current,
        description: `Decrement in-degree of ${neighbor} to ${inDegree[neighbor]}${
          becameZero ? ` — it's now 0, enqueue it.` : "."
        }`,
      })
    }
  }

  const hasCycle = order.length !== NODES.length
  steps.push({
    inDegree: { ...inDegree },
    queue: [],
    order: [...order],
    current: null,
    description: hasCycle
      ? "Queue is empty but not every node was ordered — a cycle exists, so no valid ordering is possible."
      : `Done. Valid topological order: ${order.join(" -> ")}.`,
  })

  return steps
}

const STEPS = buildSteps()

export function GraphsDemo() {
  const { stepIndex, playing, next, prev, reset, togglePlay } = useSteps(STEPS.length)
  const step = STEPS[stepIndex]

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <div className="text-xs text-muted">
        Scenario: topological sort (Kahn&apos;s algorithm) — like ordering courses by prerequisite.
      </div>

      <div className="relative h-56 w-full">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--color-border)" />
            </marker>
          </defs>
          {EDGES.map(([from, to]) => {
            const a = NODES.find((n) => n.id === from)!
            const b = NODES.find((n) => n.id === to)!
            const dx = b.x - a.x
            const dy = b.y - a.y
            const len = Math.sqrt(dx * dx + dy * dy)
            const shrink = 6
            const x2 = b.x - (dx / len) * shrink
            const y2 = b.y - (dy / len) * shrink
            return (
              <line
                key={`${from}-${to}`}
                x1={a.x}
                y1={a.y}
                x2={x2}
                y2={y2}
                stroke="var(--color-border)"
                strokeWidth={0.6}
                markerEnd="url(#arrow)"
              />
            )
          })}
        </svg>

        {NODES.map((node) => {
          const isCurrent = node.id === step.current
          const isOrdered = step.order.includes(node.id)
          const isQueued = step.queue.includes(node.id)

          return (
            <div
              key={node.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-mono transition-colors ${
                  isCurrent
                    ? "border-accent bg-accent text-white"
                    : isOrdered
                      ? "border-green-500 bg-green-500/20"
                      : isQueued
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-border bg-background"
                }`}
              >
                {node.id}
              </div>
              <div className="text-[10px] text-muted">in={step.inDegree[node.id]}</div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-4 text-xs text-muted">
        <span>Queue: {step.queue.join(", ") || "—"}</span>
        <span>Order: {step.order.join(", ") || "—"}</span>
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
