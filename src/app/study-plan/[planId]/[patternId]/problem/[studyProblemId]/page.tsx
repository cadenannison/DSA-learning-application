"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { notFound } from "next/navigation"
import { use, useEffect, useRef, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { ProblemWorkbenchView } from "@/components/problem-workbench-view"
import { apiClient } from "@/lib/api-client"
import { usePersistedCode } from "@/lib/use-persisted-code"
import { StudyPlanPresenter } from "@/presenter/study-plan-presenter"
import type { ExecutionResult, Problem, StudyPlanOverview, TestCaseResult } from "@/types"

/** Full library-style workbench for a single workbook problem — same prompt/examples/
 * constraints/hints/editor/Run/Submit layout as /problems/[id] (see ProblemWorkbenchView),
 * reused rather than duplicated. Back and a passing Submit both return wherever the user came
 * from (this pattern's Practice tab by default, or Today when opened via ?from=today — see
 * WorkbookProblemContainer's backHref) instead of the library; Submit records completion
 * against the study plan (via submitEmbeddedProblem) instead of generic library progress. */
export default function WorkbookProblemPage({
  params,
}: {
  params: Promise<{ planId: string; patternId: string; studyProblemId: string }>
}) {
  const { planId, patternId, studyProblemId } = use(params)

  return (
    <AuthGate>
      {() => (
        <WorkbookProblemContainer
          planId={planId}
          patternId={patternId}
          studyProblemId={studyProblemId}
        />
      )}
    </AuthGate>
  )
}

function WorkbookProblemContainer({
  planId,
  patternId,
  studyProblemId,
}: {
  planId: string
  patternId: string
  studyProblemId: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const practiceHref = `/study-plan/${planId}/${patternId}/practice`
  const backHref = searchParams.get("from") === "today" ? `/study-plan/${planId}` : practiceHref

  const [overview, setOverview] = useState<StudyPlanOverview | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [overviewError, setOverviewError] = useState<string | null>(null)

  const [presenter] = useState(
    () =>
      new StudyPlanPresenter(planId, {
        setLoading: setOverviewLoading,
        setOverview,
        setError: setOverviewError,
      })
  )

  useEffect(() => {
    presenter.load()
  }, [presenter])

  const [problem, setProblem] = useState<Problem | null>(null)
  const [problemError, setProblemError] = useState<string | null>(null)
  const [code, setCode] = usePersistedCode(
    problem ? studyProblemId : null,
    problem?.starterCode ?? ""
  )
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [caseResults, setCaseResults] = useState<Record<number, TestCaseResult>>({})
  const [revealedHints, setRevealedHints] = useState(0)

  const startedAtRef = useRef<number | null>(null)
  const submittedRef = useRef(false)

  if (overviewLoading && !overview) {
    return <div className="flex-1 p-8 text-sm text-text-2">Loading workbook...</div>
  }

  if (overviewError || !overview) {
    return <div className="flex-1 p-8 text-sm text-danger">{overviewError ?? "Failed to load"}</div>
  }

  const pattern = overview.patterns.find((p) => p.id === patternId)
  if (!pattern) notFound()

  const studyProblem = pattern.problems.find((p) => p.id === studyProblemId)
  if (!studyProblem || !studyProblem.linkedProblemId) notFound()

  return (
    <WorkbookProblemBody
      backHref={backHref}
      patternName={pattern.name}
      linkedProblemId={studyProblem.linkedProblemId}
      studyProblemId={studyProblem.id}
      presenter={presenter}
      problem={problem}
      setProblem={setProblem}
      problemError={problemError}
      setProblemError={setProblemError}
      code={code}
      setCode={setCode}
      running={running}
      setRunning={setRunning}
      result={result}
      setResult={setResult}
      caseResults={caseResults}
      setCaseResults={setCaseResults}
      revealedHints={revealedHints}
      setRevealedHints={setRevealedHints}
      startedAtRef={startedAtRef}
      submittedRef={submittedRef}
      router={router}
    />
  )
}

/** Split out from the container so hooks (the problem-load effect, the collapse-timer effect)
 * only mount once the pattern/studyProblem lookups above have confirmed a linked problem
 * exists, rather than running conditionally. */
function WorkbookProblemBody({
  backHref,
  patternName,
  linkedProblemId,
  studyProblemId,
  presenter,
  problem,
  setProblem,
  problemError,
  setProblemError,
  code,
  setCode,
  running,
  setRunning,
  result,
  setResult,
  caseResults,
  setCaseResults,
  revealedHints,
  setRevealedHints,
  startedAtRef,
  submittedRef,
  router,
}: {
  backHref: string
  patternName: string
  linkedProblemId: string
  studyProblemId: string
  presenter: StudyPlanPresenter
  problem: Problem | null
  setProblem: (problem: Problem) => void
  problemError: string | null
  setProblemError: (message: string | null) => void
  code: string
  setCode: (value: string) => void
  running: boolean
  setRunning: (running: boolean) => void
  result: ExecutionResult | null
  setResult: (result: ExecutionResult | null) => void
  caseResults: Record<number, TestCaseResult>
  setCaseResults: React.Dispatch<React.SetStateAction<Record<number, TestCaseResult>>>
  revealedHints: number
  setRevealedHints: (count: number) => void
  startedAtRef: React.MutableRefObject<number | null>
  submittedRef: React.MutableRefObject<boolean>
  router: ReturnType<typeof useRouter>
}) {
  useEffect(() => {
    startedAtRef.current = performance.now()
  }, [startedAtRef])

  useEffect(() => {
    let cancelled = false

    apiClient
      .getProblem(linkedProblemId)
      .then((p) => {
        if (cancelled) return
        setProblem(p)
      })
      .catch((err) => {
        if (cancelled) return
        setProblemError(err instanceof Error ? err.message : "Failed to load problem")
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedProblemId])

  useEffect(() => {
    return () => {
      const startedAt = startedAtRef.current ?? performance.now()
      const elapsedMinutes = Math.round((performance.now() - startedAt) / 60_000)
      if (!submittedRef.current && elapsedMinutes >= 1) {
        presenter.logProblemTimeOnCollapse(studyProblemId, elapsedMinutes)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyProblemId])

  function revealNextHint() {
    if (!problem) return
    if (revealedHints < problem.hints.length) {
      setRevealedHints(revealedHints + 1)
    }
  }

  async function handleRun() {
    if (!problem) return
    setRunning(true)
    try {
      const execution = await presenter.runEmbeddedProblem(problem.id, {
        code,
        functionName: problem.functionName,
        language: "python",
      })
      setResult(execution)
      setCaseResults(Object.fromEntries(execution.results.map((r, i) => [i, r])))
    } catch (err) {
      setProblemError(err instanceof Error ? err.message : "Failed to run code")
    } finally {
      setRunning(false)
    }
  }

  async function handleRunCase(index: number) {
    if (!problem) return
    setRunning(true)
    try {
      const execution = await presenter.runEmbeddedProblem(
        problem.id,
        { code, functionName: problem.functionName, language: "python" },
        [index]
      )
      const caseResult = execution.results[0]
      if (caseResult) {
        setCaseResults((prev) => ({ ...prev, [index]: caseResult }))
      }
    } catch (err) {
      setProblemError(err instanceof Error ? err.message : "Failed to run test case")
    } finally {
      setRunning(false)
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

  async function handleSubmit() {
    if (!problem) return
    setRunning(true)
    try {
      const startedAt = startedAtRef.current ?? performance.now()
      const elapsedMinutes = Math.max(0, Math.round((performance.now() - startedAt) / 60_000))
      const execution = await presenter.submitEmbeddedProblem(
        studyProblemId,
        { code, functionName: problem.functionName, language: "python" },
        elapsedMinutes
      )
      submittedRef.current = true
      setResult(execution)
      setCaseResults(Object.fromEntries(execution.results.map((r, i) => [i, r])))
    } catch (err) {
      setProblemError(err instanceof Error ? err.message : "Failed to submit code")
    } finally {
      setRunning(false)
    }
  }

  if (problemError) return <div className="flex-1 p-8 text-sm text-danger">{problemError}</div>
  if (!problem) return <div className="flex-1 p-8 text-sm text-text-2">Loading problem...</div>

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
        <Link href={backHref} className="text-sm text-text-2 hover:text-text-1">
          &larr; Back
        </Link>
        <span className="truncate text-xs text-text-2">{patternName}</span>
      </div>

      <ProblemWorkbenchView
        problem={problem}
        code={code}
        onChangeCode={setCode}
        running={running}
        result={result}
        caseResults={caseResults}
        onRun={handleRun}
        onRunCase={handleRunCase}
        onResetCase={handleResetCase}
        onSubmit={handleSubmit}
        onResetCode={() => setCode(problem.starterCode)}
        revealedHints={revealedHints}
        onRevealNextHint={revealNextHint}
        afterResult={
          <div className="flex items-center justify-between rounded-control border border-border bg-surface px-3 py-2.5">
            <span className="text-xs text-text-2">
              {result?.allPassed
                ? "Marked complete in the workbook."
                : "Progress saved — you can keep iterating or head back."}
            </span>
            <button
              onClick={() => router.push(backHref)}
              className="min-h-[36px] rounded-control border border-border px-3 text-xs font-medium text-text-1 hover:bg-surface-2"
            >
              Back
            </button>
          </div>
        }
      />
    </div>
  )
}
