"use client"

import { useState } from "react"
import { StepControls, useSteps } from "@/components/lessons/step-controls"

interface Node {
  id: string
  x: number
  y: number
}

const NODES: Node[] = [
  { id: "A", x: 50, y: 10 },
  { id: "B", x: 20, y: 40 },
  { id: "C", x: 80, y: 40 },
  { id: "D", x: 5, y: 75 },
  { id: "E", x: 35, y: 75 },
  { id: "F", x: 65, y: 75 },
  { id: "G", x: 95, y: 75 },
]

const ADJACENCY: Record<string, string[]> = {
  A: ["B", "C"],
  B: ["A", "D", "E"],
  C: ["A", "F", "G"],
  D: ["B"],
  E: ["B"],
  F: ["C"],
  G: ["C"],
}

const EDGES: [string, string][] = [
  ["A", "B"],
  ["A", "C"],
  ["B", "D"],
  ["B", "E"],
  ["C", "F"],
  ["C", "G"],
]

const START = "A"

interface Step {
  current: string | null
  visited: string[]
  frontier: string[]
  description: string
}

function buildBfsSteps(): Step[] {
  const steps: Step[] = []
  const visited: string[] = [START]
  const queue: string[] = [START]

  steps.push({
    current: null,
    visited: [...visited],
    frontier: [...queue],
    description: `Enqueue the start node ${START}.`,
  })

  while (queue.length > 0) {
    const current = queue.shift()!
    steps.push({
      current,
      visited: [...visited],
      frontier: [...queue],
      description: `Dequeue ${current} and visit it.`,
    })

    for (const neighbor of ADJACENCY[current]) {
      if (!visited.includes(neighbor)) {
        visited.push(neighbor)
        queue.push(neighbor)
        steps.push({
          current,
          visited: [...visited],
          frontier: [...queue],
          description: `${neighbor} is unvisited — mark it visited and enqueue it.`,
        })
      }
    }
  }

  steps.push({
    current: null,
    visited: [...visited],
    frontier: [],
    description: "Queue is empty. BFS complete — visited every reachable node level by level.",
  })

  return steps
}

function buildDfsSteps(): Step[] {
  const steps: Step[] = []
  const visited: string[] = []
  const stack: string[] = [START]

  steps.push({
    current: null,
    visited: [],
    frontier: [...stack],
    description: `Push the start node ${START} onto the stack.`,
  })

  while (stack.length > 0) {
    const current = stack.pop()!
    if (visited.includes(current)) continue

    visited.push(current)
    steps.push({
      current,
      visited: [...visited],
      frontier: [...stack],
      description: `Pop ${current} and visit it.`,
    })

    const neighbors = ADJACENCY[current].filter((n) => !visited.includes(n))
    for (const neighbor of neighbors) {
      stack.push(neighbor)
    }
    if (neighbors.length > 0) {
      steps.push({
        current,
        visited: [...visited],
        frontier: [...stack],
        description: `Push unvisited neighbors of ${current}: ${neighbors.join(", ")}.`,
      })
    }
  }

  steps.push({
    current: null,
    visited: [...visited],
    frontier: [],
    description: "Stack is empty. DFS complete — visited every reachable node by diving deep first.",
  })

  return steps
}

const BFS_STEPS = buildBfsSteps()
const DFS_STEPS = buildDfsSteps()

export function BfsDfsDemo() {
  const [mode, setMode] = useState<"bfs" | "dfs">("bfs")
  const steps = mode === "bfs" ? BFS_STEPS : DFS_STEPS
  const { stepIndex, playing, next, prev, reset, togglePlay } = useSteps(steps.length)
  const step = steps[Math.min(stepIndex, steps.length - 1)]

  function switchMode(next: "bfs" | "dfs") {
    setMode(next)
    reset()
  }

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted">Scenario: traverse the same graph from {START}.</div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => switchMode("bfs")}
            className={`rounded-md border px-3 py-1 text-xs ${
              mode === "bfs" ? "border-accent bg-accent text-white" : "border-border hover:bg-surface"
            }`}
          >
            BFS (queue)
          </button>
          <button
            type="button"
            onClick={() => switchMode("dfs")}
            className={`rounded-md border px-3 py-1 text-xs ${
              mode === "dfs" ? "border-accent bg-accent text-white" : "border-border hover:bg-surface"
            }`}
          >
            DFS (stack)
          </button>
        </div>
      </div>

      <div className="relative h-56 w-full">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 90" preserveAspectRatio="none">
          {EDGES.map(([from, to]) => {
            const a = NODES.find((n) => n.id === from)!
            const b = NODES.find((n) => n.id === to)!
            return (
              <line
                key={`${from}-${to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--color-border)"
                strokeWidth={0.6}
              />
            )
          })}
        </svg>

        {NODES.map((node) => {
          const isCurrent = node.id === step.current
          const isVisited = step.visited.includes(node.id)
          const isFrontier = step.frontier.includes(node.id)

          return (
            <div
              key={node.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-mono transition-colors ${
                  isCurrent
                    ? "border-accent bg-accent text-white"
                    : isVisited
                      ? "border-green-500 bg-green-500/20"
                      : isFrontier
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-border bg-background"
                }`}
              >
                {node.id}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-4 text-xs text-muted">
        <span>Visited: {step.visited.join(", ") || "—"}</span>
        <span>{mode === "bfs" ? "Queue" : "Stack"}: {step.frontier.join(", ") || "—"}</span>
      </div>

      <p className="text-sm">{step.description}</p>

      <StepControls
        stepIndex={stepIndex}
        stepCount={steps.length}
        playing={playing}
        onNext={next}
        onPrev={prev}
        onReset={reset}
        onTogglePlay={togglePlay}
      />
    </div>
  )
}
