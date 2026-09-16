"use client"

import Link from "next/link"
import { use, useCallback, useEffect, useState } from "react"
import { BlindTestPresenter, type BlindTestView } from "@/presenter/practice-presenter"
import { CodeEditor } from "@/components/code-editor"
import { TestResults } from "@/components/test-results"
import { ThemeToggle } from "@/components/theme-toggle"
import type { ExecutionResult, StrippedProblem } from "@/types"

export default function BlindTestSetPlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: setId } = use(params)

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
        setResult(null)
      },
      setError,
      setRunning,
      setResult,
    }
    return new BlindTestPresenter(view)
  })

  const loadNext = useCallback(() => {
    presenter.loadRandomFromSet(setId)
  }, [presenter, setId])

  useEffect(() => {
    loadNext()
  }, [loadNext])

  if (loading) return <main className="p-8 text-sm text-muted">Loading problem...</main>
  if (error) return <main className="p-8 text-sm text-red-600 dark:text-red-400">{error}</main>
  if (!problem) return null

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/blind/sets/${setId}`} className="text-sm text-muted hover:text-foreground">
          &larr; Back to set
        </Link>
        <ThemeToggle />
      </div>

      <div className="mb-4 flex items-center justify-between rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
        <span>Blind Test Mode — random problem from this set. No pattern, no difficulty, no hints.</span>
        <button onClick={loadNext} className="ml-4 shrink-0 underline">
          Shuffle
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">{problem.title}</h1>

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
