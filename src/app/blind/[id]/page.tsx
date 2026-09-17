"use client"

import Link from "next/link"
import { use, useEffect, useState } from "react"
import { BlindTestPresenter, type BlindTestView } from "@/presenter/practice-presenter"
import { CodeEditor } from "@/components/code-editor"
import { ResetCodeButton } from "@/components/reset-code-button"
import { TestResults } from "@/components/test-results"
import { ThemeToggle } from "@/components/theme-toggle"
import type { ExecutionResult, StrippedProblem } from "@/types"

export default function BlindTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [problem, setProblem] = useState<StrippedProblem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [code, setCode] = useState("")

  const [presenter] = useState(() => {
    const view: BlindTestView = {
      setLoading,
      setProblem: (p) => {
        setProblem(p)
        setCode(p.starterCode)
      },
      setError,
      setRunning,
      setResult,
    }
    return new BlindTestPresenter(view)
  })

  useEffect(() => {
    presenter.loadProblem(id)
  }, [presenter, id])

  if (loading) return <div className="flex-1 p-8 text-sm text-text-2">Loading problem...</div>
  if (error) return <div className="flex-1 p-8 text-sm text-danger">{error}</div>
  if (!problem) return null

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
        <Link href="/blind" className="text-sm text-text-2 hover:text-text-1">
          &larr; Back to blind test list
        </Link>
        <ThemeToggle />
      </div>

      <div className="border-b border-border bg-warning/10 px-6 py-2 text-xs text-warning">
        Blind Test Mode — no pattern tag, no difficulty, no hints. Solve cold.
      </div>

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        <div className="space-y-4 overflow-y-auto border-b border-border p-6 lg:border-b-0 lg:border-r">
          <h1 className="font-display text-xl font-semibold text-text-1">{problem.title}</h1>

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
            <ResetCodeButton onReset={() => setCode(problem.starterCode)} />
          </div>

          {result && <TestResults result={result} />}
        </div>
      </div>
    </div>
  )
}
