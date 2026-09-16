"use client"

import { StepControls, useSteps } from "@/components/lessons/step-controls"

const WORDS = ["car", "card", "care"]

interface TrieNode {
  id: string
  char: string
  children: Record<string, TrieNode>
  isWord: boolean
}

function makeNode(id: string, char: string): TrieNode {
  return { id, char, children: {}, isWord: false }
}

interface Step {
  word: string
  charIndex: number
  activeNodeId: string
  created: boolean
  finishedWord: boolean
  description: string
}

const root = makeNode("root", "")
const steps: Step[] = []
let nodeCounter = 0

for (const word of WORDS) {
  let node = root
  let path = ""
  for (let i = 0; i < word.length; i++) {
    const ch = word[i]
    path += ch
    let created = false
    if (!node.children[ch]) {
      node.children[ch] = makeNode(`n${nodeCounter++}`, ch)
      created = true
    }
    node = node.children[ch]

    steps.push({
      word,
      charIndex: i,
      activeNodeId: node.id,
      created,
      finishedWord: false,
      description: created
        ? `'${word}': no edge for '${ch}' at this node — create a new node for path "${path}".`
        : `'${word}': edge for '${ch}' already exists (shared with an earlier word) — follow it to "${path}".`,
    })
  }
  node.isWord = true
  steps.push({
    word,
    charIndex: word.length - 1,
    activeNodeId: node.id,
    created: false,
    finishedWord: true,
    description: `'${word}' fully inserted — mark this node as end-of-word.`,
  })
}

steps.push({
  word: "",
  charIndex: -1,
  activeNodeId: root.id,
  created: false,
  finishedWord: false,
  description: `Done. All ${WORDS.length} words inserted, sharing nodes for common prefixes.`,
})

const STEPS = steps

interface LaidOutNode {
  node: TrieNode
  x: number
  y: number
  parentId: string | null
}

function layoutTrie(): LaidOutNode[] {
  const result: LaidOutNode[] = []
  const depthCounters: Record<number, number> = {}

  function countLeaves(node: TrieNode): number {
    const children = Object.values(node.children)
    if (children.length === 0) return 1
    return children.reduce((sum, c) => sum + countLeaves(c), 0)
  }

  function visit(node: TrieNode, depth: number, xStart: number, xEnd: number, parentId: string | null) {
    const x = (xStart + xEnd) / 2
    const y = 10 + depth * 25
    result.push({ node, x, y, parentId })
    depthCounters[depth] = (depthCounters[depth] ?? 0) + 1

    const children = Object.values(node.children)
    if (children.length === 0) return

    const totalLeaves = children.reduce((sum, c) => sum + countLeaves(c), 0)
    let cursor = xStart
    for (const child of children) {
      const share = (countLeaves(child) / totalLeaves) * (xEnd - xStart)
      visit(child, depth + 1, cursor, cursor + share, node.id)
      cursor += share
    }
  }

  visit(root, 0, 0, 100, null)
  return result
}

const LAYOUT = layoutTrie()

export function TriesDemo() {
  const { stepIndex, playing, next, prev, reset, togglePlay } = useSteps(STEPS.length)
  const step = STEPS[stepIndex]

  const visibleIds = new Set<string>()
  for (let i = 0; i <= stepIndex; i++) {
    visibleIds.add(STEPS[i].activeNodeId)
  }
  visibleIds.add(root.id)

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <div className="text-xs text-muted">
        Scenario: insert the words {WORDS.map((w) => `"${w}"`).join(", ")} into a trie.
      </div>

      <div className="relative h-40 w-full">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 75" preserveAspectRatio="none">
          {LAYOUT.filter((n) => n.parentId && visibleIds.has(n.node.id) && visibleIds.has(n.parentId)).map(
            (n) => {
              const parent = LAYOUT.find((p) => p.node.id === n.parentId)!
              return (
                <line
                  key={n.node.id}
                  x1={parent.x}
                  y1={parent.y}
                  x2={n.x}
                  y2={n.y}
                  stroke="var(--color-border)"
                  strokeWidth={0.6}
                />
              )
            }
          )}
        </svg>

        {LAYOUT.filter((n) => visibleIds.has(n.node.id)).map(({ node, x, y }) => {
          const isActive = node.id === step.activeNodeId
          return (
            <div
              key={node.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-mono transition-colors ${
                  isActive
                    ? "border-accent bg-accent text-white"
                    : node.isWord
                      ? "border-green-500 bg-green-500/20"
                      : "border-border bg-background"
                }`}
              >
                {node.char || "•"}
              </div>
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
