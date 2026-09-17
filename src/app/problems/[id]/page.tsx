"use client"

import Link from "next/link"
import { use, useEffect, useState } from "react"
import { PracticePresenter, type PracticeView } from "@/presenter/practice-presenter"
import { CodeEditor } from "@/components/code-editor"
import { PythonSyntaxReference } from "@/components/python-syntax-reference"
import { TestResults } from "@/components/test-results"
import { usePersistedCode } from "@/lib/use-persisted-code"
import type { ExecutionResult, Problem } from "@/types"

export default function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [revealedHints, setRevealedHints] = useState(0)
  const [code, setCode] = usePersistedCode(problem?.id ?? null, problem?.starterCode ?? "")

  const [presenter] = useState(() => {
    const view: PracticeView = {
      setLoading,
      setProblem,
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

  if (loading) return <div className="flex-1 p-8 text-sm text-text-2">Loading problem...</div>
  if (error) return <div className="flex-1 p-8 text-sm text-danger">{error}</div>
  if (!problem) return null

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex h-12 shrink-0 items-center border-b border-border bg-surface px-6">
        <Link href="/" className="text-sm text-text-2 hover:text-text-1">
          &larr; Back to library
        </Link>
      </div>

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        <div className="space-y-4 overflow-y-auto border-b border-border p-6 lg:border-b-0 lg:border-r">
          <div>
            <h1 className="font-display text-xl font-semibold text-text-1">{problem.title}</h1>
            <div className="mt-1 font-mono text-xs text-text-2">
              {problem.pattern} · {problem.difficulty}
            </div>
          </div>

          <p className="whitespace-pre-wrap text-sm text-text-1">{problem.prompt}</p>

          <div>
            <h2 className="mb-2 text-sm font-medium text-text-1">Examples</h2>
            <ul className="space-y-2">
              {problem.examples.map((example, index) => (
                <li
                  key={index}
                  className="rounded-card border border-border bg-surface p-3 font-mono text-xs text-text-1"
                >
                  <div>Input: {example.input}</div>
                  <div>Output: {example.output}</div>
                  {example.explanation && <div className="text-text-2">{example.explanation}</div>}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium text-text-1">Constraints</h2>
            <ul className="list-inside list-disc text-xs text-text-2">
              {problem.constraints.map((constraint, index) => (
                <li key={index}>{constraint}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium text-text-1">
              Hints ({revealedHints}/{problem.hints.length} revealed)
            </h2>
            <ul className="space-y-2">
              {problem.hints.slice(0, revealedHints).map((hint, index) => (
                <li
                  key={index}
                  className="rounded-card border border-border bg-surface p-2 text-xs text-text-1"
                >
                  {hint}
                </li>
              ))}
            </ul>
            {revealedHints < problem.hints.length && (
              <button
                onClick={revealNextHint}
                className="mt-2 min-h-[44px] rounded-control border border-border px-3 text-xs text-text-2 hover:bg-surface-2 hover:text-text-1"
              >
                Reveal next hint
              </button>
            )}
          </div>

          <PythonSyntaxReference />
        </div>

        <div className="flex flex-col space-y-4 overflow-y-auto p-6">
          <CodeEditor value={code} onChange={setCode} height="420px" />

          <div className="flex gap-2">
            <button
              onClick={() => presenter.run(code)}
              disabled={running}
              className="min-h-[44px] rounded-control border border-border px-4 text-sm text-text-2 hover:bg-surface-2 hover:text-text-1 disabled:opacity-50"
            >
              Run tests
            </button>
            <button
              onClick={() => presenter.submitCode(code)}
              disabled={running}
              className="min-h-[44px] rounded-control bg-accent px-4 text-sm font-semibold text-bg disabled:opacity-50"
            >
              Submit
            </button>
          </div>

          {result && <TestResults result={result} />}
        </div>
      </div>
    </div>
  )
}
