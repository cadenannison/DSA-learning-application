"use client"

import { useRouter } from "next/navigation"
import { use, useCallback, useEffect, useRef, useState } from "react"
import { CodeEditor } from "@/components/code-editor"
import { TestResults } from "@/components/test-results"
import { apiClient } from "@/lib/api-client"
import { OASessionPresenter, type OASessionView } from "@/presenter/oa-session-presenter"
import type { OASession, OAProblemStatus, StrippedProblem } from "@/types"

const STATUS_LABELS: Record<OAProblemStatus, string> = {
  unanswered: "Unanswered",
  in_progress: "In progress",
  passed: "Passed",
  failed: "Failed",
}

const STATUS_COLORS: Record<OAProblemStatus, string> = {
  unanswered: "text-muted",
  in_progress: "text-amber-600 dark:text-amber-400",
  passed: "text-green-600 dark:text-green-400",
  failed: "text-red-600 dark:text-red-400",
}

function formatRemaining(ms: number): string {
  const clamped = Math.max(0, ms)
  const totalSeconds = Math.floor(clamped / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export default function OASessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [session, setSession] = useState<OASession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [activeProblemId, setActiveProblemId] = useState<string | null>(null)
  const [problemContent, setProblemContent] = useState<StrippedProblem | null>(null)
  const [code, setCode] = useState("")
  const [now, setNow] = useState(() => Date.now())
  const endedRef = useRef(false)

  const [presenter] = useState(() => {
    const view: OASessionView = {
      setLoading,
      setSession: (s) => {
        setSession(s)
        setActiveProblemId((current) => current ?? s.activeProblemId ?? s.problems[0]?.problemId ?? null)
      },
      setError,
      setRunning,
    }
    return new OASessionPresenter(view)
  })

  useEffect(() => {
    presenter.loadSession(id)
  }, [presenter, id])

  // Load stripped problem content (title/prompt/examples/constraints/starter code only —
  // same StrippedProblem shape Blind Test uses, so pattern/difficulty/hints/solution never
  // reach this page) whenever the active problem changes.
  useEffect(() => {
    if (!activeProblemId || !session) return
    const problemState = session.problems.find((p) => p.problemId === activeProblemId)

    apiClient.getBlindProblem(activeProblemId).then((content) => {
      setProblemContent(content)
      setCode(problemState?.code ?? content.starterCode)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProblemId])

  // Countdown tick.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const endSession = useCallback(async () => {
    if (endedRef.current) return
    endedRef.current = true
    await presenter.endSession()
    router.push(`/oa/session/${id}/summary`)
  }, [presenter, id, router])

  // Auto-submit when the deadline passes — client-side enforcement per ARCHITECTURE.md;
  // the server independently re-checks the deadline on any call against an expired session.
  useEffect(() => {
    if (!session) return
    const deadlineMs = new Date(session.deadline).getTime()
    if (session.status === "in_progress" && now >= deadlineMs) {
      void endSession()
    }
  }, [session, now, endSession])

  if (loading) return <main className="p-8 text-sm text-muted">Loading session...</main>
  if (error) return <main className="p-8 text-sm text-red-600 dark:text-red-400">{error}</main>
  if (!session) return null

  const deadlineMs = new Date(session.deadline).getTime()
  const remainingMs = deadlineMs - now
  const lowTime = remainingMs < 5 * 60 * 1000

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Mock OA Session</h1>
          <span
            className={`rounded-md border px-3 py-1 text-sm font-mono ${
              lowTime
                ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
                : "border-border text-foreground"
            }`}
          >
            {formatRemaining(remainingMs)}
          </span>
        </div>
        <button
          onClick={endSession}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface"
        >
          End session
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {session.problems.map((p, index) => (
          <button
            key={p.problemId}
            onClick={() => setActiveProblemId(p.problemId)}
            className={`rounded-md border px-3 py-1.5 text-xs ${
              p.problemId === activeProblemId ? "border-accent bg-accent/10" : "border-border"
            }`}
          >
            <span className="mr-1.5">Problem {index + 1}</span>
            <span className={STATUS_COLORS[p.status]}>{STATUS_LABELS[p.status]}</span>
          </button>
        ))}
      </div>

      {problemContent ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{problemContent.title}</h2>
            <p className="whitespace-pre-wrap text-sm">{problemContent.prompt}</p>

            <div>
              <h3 className="mb-2 text-sm font-medium">Examples</h3>
              <ul className="space-y-2">
                {problemContent.examples.map((example, index) => (
                  <li key={index} className="rounded-md border border-border p-3 text-xs font-mono">
                    <div>Input: {example.input}</div>
                    <div>Output: {example.output}</div>
                    {example.explanation && <div className="text-muted">{example.explanation}</div>}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium">Constraints</h3>
              <ul className="list-inside list-disc text-xs text-muted">
                {problemContent.constraints.map((constraint, index) => (
                  <li key={index}>{constraint}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <CodeEditor value={code} onChange={setCode} />

            <div className="flex gap-2">
              <button
                onClick={() => activeProblemId && presenter.saveProgress(activeProblemId, code)}
                disabled={running}
                className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() =>
                  activeProblemId &&
                  presenter.submitProblem(activeProblemId, code, problemContent.functionName)
                }
                disabled={running}
                className="rounded-md bg-accent px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                Submit
              </button>
            </div>

            {(() => {
              const activeState = session.problems.find((p) => p.problemId === activeProblemId)
              return activeState?.lastSubmissionResult ? (
                <TestResults result={activeState.lastSubmissionResult} />
              ) : null
            })()}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">Loading problem...</p>
      )}
    </main>
  )
}
