"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { notFound } from "next/navigation"
import { use, useEffect, useRef, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { ProblemWorkbenchView } from "@/components/problem-workbench-view"
import { apiClient } from "@/lib/api-client"
import { StudyPlanPresenter } from "@/presenter/study-plan-presenter"
import type { ExecutionResult, Problem, StudyPlanOverview } from "@/types"

/** Full library-style workbench for a single workbook problem — same prompt/examples/
 * constraints/hints/editor/Run/Submit layout as /problems/[id] (see ProblemWorkbenchView),
 * reused rather than duplicated. The one difference from the library page: Back and a
 * passing Submit both return to this pattern's Practice tab instead of the library, and
 * Submit records completion against the study plan (via submitEmbeddedProblem) instead of
 * generic library progress. */
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
  const practiceHref = `/study-plan/${planId}/${patternId}/practice`

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
  const [code, setCode] = useState("")
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ExecutionResult | null>(null)
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
      practiceHref={practiceHref}
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
  practiceHref,
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
  revealedHints,
  setRevealedHints,
  startedAtRef,
  submittedRef,
  router,
}: {
  practiceHref: string
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
        setCode(p.starterCode)
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
    } catch (err) {
      setProblemError(err instanceof Error ? err.message : "Failed to run code")
    } finally {
      setRunning(false)
    }
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
        <Link href={practiceHref} className="text-sm text-text-2 hover:text-text-1">
          &larr; Back to Workbook
        </Link>
        <span className="truncate text-xs text-text-2">{patternName}</span>
      </div>

      <ProblemWorkbenchView
        problem={problem}
        code={code}
        onChangeCode={setCode}
        running={running}
        result={result}
        onRun={handleRun}
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
              onClick={() => router.push(practiceHref)}
              className="min-h-[36px] rounded-control border border-border px-3 text-xs font-medium text-text-1 hover:bg-surface-2"
            >
              Back to Workbook
            </button>
          </div>
        }
      />
    </div>
  )
}
