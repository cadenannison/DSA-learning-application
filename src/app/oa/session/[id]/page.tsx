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
  unanswered: "text-text-2",
  in_progress: "text-warning",
  passed: "text-success",
  failed: "text-danger",
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

  if (loading) return <div className="flex-1 p-8 text-sm text-text-2">Loading session...</div>
  if (error) return <div className="flex-1 p-8 text-sm text-danger">{error}</div>
  if (!session) return null

  const deadlineMs = new Date(session.deadline).getTime()
  const remainingMs = deadlineMs - now
  const lowTime = remainingMs < 5 * 60 * 1000

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-base font-semibold text-text-1">Mock OA Session</h1>
          <span
            className={`rounded-control border px-3 py-1 font-mono text-sm ${
              lowTime ? "border-danger/40 bg-danger/10 text-danger" : "border-border text-text-1"
            }`}
          >
            {formatRemaining(remainingMs)}
          </span>
        </div>
        <button
          onClick={endSession}
          className="min-h-[44px] rounded-control border border-border px-3 text-sm text-text-2 hover:bg-surface-2 hover:text-text-1"
        >
          End session
        </button>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 border-b border-border px-6 py-3">
        {session.problems.map((p, index) => (
          <button
            key={p.problemId}
            onClick={() => setActiveProblemId(p.problemId)}
            className={`min-h-[36px] rounded-control border px-3 text-xs ${
              p.problemId === activeProblemId
                ? "border-accent bg-accent-soft"
                : "border-border hover:bg-surface-2"
            }`}
          >
            <span className="mr-1.5 text-text-1">Problem {index + 1}</span>
            <span className={STATUS_COLORS[p.status]}>{STATUS_LABELS[p.status]}</span>
          </button>
        ))}
      </div>

      {problemContent ? (
        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
          <div className="space-y-4 overflow-y-auto border-b border-border p-6 lg:border-b-0 lg:border-r">
            <h2 className="font-display text-lg font-semibold text-text-1">{problemContent.title}</h2>
            <p className="whitespace-pre-wrap text-sm text-text-1">{problemContent.prompt}</p>

            <div>
              <h3 className="mb-2 text-sm font-medium text-text-1">Examples</h3>
              <ul className="space-y-2">
                {problemContent.examples.map((example, index) => (
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
              <h3 className="mb-2 text-sm font-medium text-text-1">Constraints</h3>
              <ul className="list-inside list-disc text-xs text-text-2">
                {problemContent.constraints.map((constraint, index) => (
                  <li key={index}>{constraint}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col space-y-4 overflow-y-auto p-6">
            <CodeEditor value={code} onChange={setCode} height="420px" />

            <div className="flex gap-2">
              <button
                onClick={() => activeProblemId && presenter.saveProgress(activeProblemId, code)}
                disabled={running}
                className="min-h-[44px] rounded-control border border-border px-4 text-sm text-text-2 hover:bg-surface-2 hover:text-text-1 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() =>
                  activeProblemId &&
                  presenter.submitProblem(activeProblemId, code, problemContent.functionName)
                }
                disabled={running}
                className="min-h-[44px] rounded-control bg-accent px-4 text-sm font-semibold text-bg disabled:opacity-50"
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
        <p className="p-6 text-sm text-text-2">Loading problem...</p>
      )}
    </div>
  )
}
