"use client"

import { StepControls, useSteps } from "@/components/lessons/step-controls"

interface Node {
  id: string
  x: number
  y: number
  left: string | null
  right: string | null
}

const NODES: Record<string, Node> = {
  A: { id: "A", x: 50, y: 10, left: "B", right: "C" },
  B: { id: "B", x: 25, y: 40, left: "D", right: "E" },
  C: { id: "C", x: 75, y: 40, left: null, right: "F" },
  D: { id: "D", x: 10, y: 75, left: null, right: null },
  E: { id: "E", x: 40, y: 75, left: null, right: null },
  F: { id: "F", x: 90, y: 75, left: null, right: null },
}

const ROOT = "A"

interface Step {
  current: string
  path: string[]
  depths: Record<string, number>
  maxDepth: number
  description: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  let maxDepth = 0
  const depths: Record<string, number> = {}

  function visit(id: string, path: string[]): number {
    const depth = path.length + 1
    steps.push({
      current: id,
      path: [...path, id],
      depths: { ...depths },
      maxDepth,
      description: `Visit node ${id} at depth ${depth}.`,
    })

    const node = NODES[id]
    const leftDepth = node.left ? visit(node.left, [...path, id]) : depth
    const rightDepth = node.right ? visit(node.right, [...path, id]) : depth
    const nodeDepth = node.left || node.right ? Math.max(leftDepth, rightDepth) : depth

    depths[id] = nodeDepth
    maxDepth = Math.max(maxDepth, nodeDepth)

    steps.push({
      current: id,
      path: [...path, id],
      depths: { ...depths },
      maxDepth,
      description: `Node ${id} is a${
        !node.left && !node.right ? " leaf" : "n internal node"
      } — depth(${id}) = ${nodeDepth}. ${!node.left && !node.right ? "" : `depth = 1 + max(children's depths).`}`,
    })

    return nodeDepth
  }

  visit(ROOT, [])

  steps.push({
    current: ROOT,
    path: [ROOT],
    depths: { ...depths },
    maxDepth,
    description: `Done. Maximum depth of the tree is ${maxDepth}.`,
  })

  return steps
}

const STEPS = buildSteps()

const EDGES: [string, string][] = Object.values(NODES).flatMap((node) => {
  const edges: [string, string][] = []
  if (node.left) edges.push([node.id, node.left])
  if (node.right) edges.push([node.id, node.right])
  return edges
})

export function TreesDemo() {
  const { stepIndex, playing, next, prev, reset, togglePlay } = useSteps(STEPS.length)
  const step = STEPS[stepIndex]

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <div className="text-xs text-muted">
        Scenario: compute the maximum depth of a binary tree with post-order recursion.
      </div>

      <div className="relative h-56 w-full">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 90" preserveAspectRatio="none">
          {EDGES.map(([from, to]) => {
            const a = NODES[from]
            const b = NODES[to]
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

        {Object.values(NODES).map((node) => {
          const isCurrent = node.id === step.current
          const onPath = step.path.includes(node.id)
          const depth = step.depths[node.id]

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
                    : depth !== undefined
                      ? "border-green-500 bg-green-500/20"
                      : onPath
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-border bg-background"
                }`}
              >
                {node.id}
              </div>
              {depth !== undefined && (
                <div className="text-[10px] text-muted">d={depth}</div>
              )}
            </div>
          )
        })}
      </div>

      <div className="text-center text-xs text-muted">
        Max depth so far: <span className="font-mono">{step.maxDepth}</span>
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
