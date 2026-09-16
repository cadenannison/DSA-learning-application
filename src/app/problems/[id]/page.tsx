"use client"

import Link from "next/link"
import { use, useEffect, useState } from "react"
import { PracticePresenter, type PracticeView } from "@/presenter/practice-presenter"
import { CodeEditor } from "@/components/code-editor"
import { TestResults } from "@/components/test-results"
import { ThemeToggle } from "@/components/theme-toggle"
import type { ExecutionResult, Problem } from "@/types"

export default function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [code, setCode] = useState("")
  const [revealedHints, setRevealedHints] = useState(0)

  const [presenter] = useState(() => {
    const view: PracticeView = {
      setLoading,
      setProblem: (p) => {
        setProblem(p)
        setCode(p.starterCode)
      },
      setError,
      setRunning,
      setResult,
    }
    return new PracticePresenter(view)
  })

  useEffect(() => {
    presenter.loadProblem(id)
  }, [presenter, id])

  function revealNextHint() {
    if (!problem) return
    if (revealedHints < problem.hints.length) {
      presenter.recordHintRevealed()
      setRevealedHints(revealedHints + 1)
    }
  }

  if (loading) return <main className="p-8 text-sm text-muted">Loading problem...</main>
  if (error) return <main className="p-8 text-sm text-red-600 dark:text-red-400">{error}</main>
  if (!problem) return null

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          &larr; Back to library
        </Link>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-semibold">{problem.title}</h1>
            <div className="mt-1 text-xs text-muted">
              {problem.pattern} · {problem.difficulty}
            </div>
          </div>

          <p className="whitespace-pre-wrap text-sm">{problem.prompt}</p>

          <div>
            <h2 className="mb-2 text-sm font-medium">Examples</h2>
            <ul className="space-y-2">
              {problem.examples.map((example, index) => (
                <li key={index} className="rounded-md border border-border p-3 text-xs font-mono">
                  <div>Input: {example.input}</div>
                  <div>Output: {example.output}</div>
                  {example.explanation && <div className="text-muted">{example.explanation}</div>}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium">Constraints</h2>
            <ul className="list-inside list-disc text-xs text-muted">
              {problem.constraints.map((constraint, index) => (
                <li key={index}>{constraint}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium">Hints ({revealedHints}/{problem.hints.length} revealed)</h2>
            <ul className="space-y-2">
              {problem.hints.slice(0, revealedHints).map((hint, index) => (
                <li key={index} className="rounded-md border border-border bg-surface p-2 text-xs">
                  {hint}
                </li>
              ))}
            </ul>
            {revealedHints < problem.hints.length && (
              <button
                onClick={revealNextHint}
                className="mt-2 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface"
              >
                Reveal next hint
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <CodeEditor value={code} onChange={setCode} />

          <div className="flex gap-2">
            <button
              onClick={() => presenter.run(code)}
              disabled={running}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface disabled:opacity-50"
            >
              Run tests
            </button>
            <button
              onClick={() => presenter.submitCode(code)}
              disabled={running}
              className="rounded-md bg-accent px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Submit
            </button>
          </div>

          {result && <TestResults result={result} />}
        </div>
      </div>
    </main>
  )
}
