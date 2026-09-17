"use client"

import { useEffect, useRef, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { CodeEditor } from "@/components/code-editor"
import { TestResults } from "@/components/test-results"
import { StudyPlanPresenter } from "@/presenter/study-plan-presenter"
import type { ExecutionResult, Problem, StudyProblem } from "@/types"

/** Embedded, runnable editor for a study-plan problem backed by a main-library Problem
 * (problem.linkedProblemId). Owns its own expand-to-collapse timer: starts on mount (i.e. on
 * expand), and on unmount (i.e. on collapse) logs whatever time wasn't already accounted for
 * by a submit, via presenter.logProblemTimeOnCollapse — see the parent row's collapse
 * handling in embeddable-problem-row.tsx. */
export function EmbeddedProblemWorkbench({
  studyProblem,
  presenter,
}: {
  studyProblem: StudyProblem
  presenter: StudyPlanPresenter
}) {
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ExecutionResult | null>(null)

  const startedAtRef = useRef<number | null>(null)
  const submittedRef = useRef(false)

  useEffect(() => {
    startedAtRef.current = performance.now()
  }, [])

  useEffect(() => {
    let cancelled = false

    apiClient
      .getProblem(studyProblem.linkedProblemId!)
      .then((p) => {
        if (cancelled) return
        setProblem(p)
        setCode(p.starterCode)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load problem")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [studyProblem.linkedProblemId])

  useEffect(() => {
    const studyProblemId = studyProblem.id
    return () => {
      const startedAt = startedAtRef.current ?? performance.now()
      const elapsedMinutes = Math.round((performance.now() - startedAt) / 60_000)
      if (!submittedRef.current && elapsedMinutes >= 1) {
        presenter.logProblemTimeOnCollapse(studyProblemId, elapsedMinutes)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyProblem.id])

  async function handleRun() {
    if (!problem) return
    setRunning(true)
    try {
      const execution = await presenter.runEmbeddedProblem(problem.id, {
        code,
        functionName: problem.functionName,
        language: "javascript",
      })
      setResult(execution)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run code")
    } finally {
      setRunning(false)
    }
  }

  async function handleSubmit() {
    if (!problem) return
    setRunning(true)
    try {
      const startedAt = startedAtRef.current ?? performance.now()
      const elapsedMinutes = Math.round((performance.now() - startedAt) / 60_000)
      const execution = await presenter.submitEmbeddedProblem(
        studyProblem.id,
        { code, functionName: problem.functionName, language: "javascript" },
        Math.max(0, elapsedMinutes)
      )
      submittedRef.current = true
      setResult(execution)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit code")
    } finally {
      setRunning(false)
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading problem...</p>
  if (error) return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
  if (!problem) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="whitespace-pre-wrap text-sm">{problem.prompt}</p>

          <div>
            <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
              Examples
            </h4>
            <ul className="space-y-1.5">
              {problem.examples.map((example, index) => (
                <li
                  key={index}
                  className="rounded-md border border-border p-2 text-xs font-mono"
                >
                  <div>Input: {example.input}</div>
                  <div>Output: {example.output}</div>
                  {example.explanation && (
                    <div className="text-muted">{example.explanation}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
              Constraints
            </h4>
            <ul className="list-inside list-disc text-xs text-muted">
              {problem.constraints.map((constraint, index) => (
                <li key={index}>{constraint}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <CodeEditor value={code} onChange={setCode} />

          <div className="flex gap-2">
            <button
              onClick={handleRun}
              disabled={running}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface disabled:opacity-50"
            >
              Run tests
            </button>
            <button
              onClick={handleSubmit}
              disabled={running}
              className="rounded-md bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              Submit
            </button>
          </div>

          {result?.allPassed && (
            <div className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-xs font-medium text-green-600 dark:text-green-400">
              All tests passed — marked complete.
            </div>
          )}

          {result && <TestResults result={result} />}
        </div>
      </div>
    </div>
  )
}
