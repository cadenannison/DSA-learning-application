"use client"

import Link from "next/link"
import { use, useEffect, useState } from "react"
import { PracticePresenter, type PracticeView } from "@/presenter/practice-presenter"
import { ProblemWorkbenchView } from "@/components/problem-workbench-view"
import { useActiveTime } from "@/lib/use-active-time"
import { usePersistedCode } from "@/lib/use-persisted-code"
import type { ExecutionResult, Problem, TestCaseResult } from "@/types"

export default function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [caseResults, setCaseResults] = useState<Record<number, TestCaseResult>>({})
  const [revealedHints, setRevealedHints] = useState(0)
  const [code, setCode] = usePersistedCode(problem?.id ?? null, problem?.starterCode ?? "")
  // resetKey falls back to "loading" while the problem hasn't arrived yet so the hook always
  // has a stable key to mount with; it re-keys (and the clock resets) once the real id lands.
  const { elapsedMs } = useActiveTime(problem?.id ?? "loading")

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

  async function handleRun() {
    await presenter.run(code)
    setCaseResults({})
  }

  async function handleRunCase(index: number) {
    const execution = await presenter.runCode(code, [index])
    const caseResult = execution.results[0]
    if (caseResult) {
      setCaseResults((prev) => ({ ...prev, [index]: caseResult }))
    }
  }

  function handleResetCase(index: number) {
    setCaseResults((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
    setResult(null)
  }

  // Merge the last full-run result's per-case outcomes with any individually-run cases —
  // an individual "Run this case" click should reflect immediately without waiting on the
  // full ExecutionResult, and a fresh "Run tests" pass should supersede it (handleRun clears
  // caseResults first, so a stale single-case badge never survives a full rerun).
  const mergedCaseResults = result
    ? { ...Object.fromEntries(result.results.map((r, i) => [i, r])), ...caseResults }
    : caseResults

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

      <ProblemWorkbenchView
        problem={problem}
        code={code}
        onChangeCode={setCode}
        running={running}
        result={result}
        caseResults={mergedCaseResults}
        onRun={handleRun}
        onRunCase={handleRunCase}
        onResetCase={handleResetCase}
        onSubmit={() => presenter.submitCode(code, elapsedMs())}
        onResetCode={() => setCode(problem.starterCode)}
        revealedHints={revealedHints}
        onRevealNextHint={revealNextHint}
      />
    </div>
  )
}
