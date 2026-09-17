import { randomUUID } from "node:crypto"
import type { OAProblemSelector } from "@/server/interfaces/oa-problem-selector"
import type { OASessionManager } from "@/server/interfaces/oa-session-manager"
import type { OASessionStore } from "@/server/interfaces/oa-session-store"
import type {
  CodeSubmission,
  OASession,
  OASessionConfig,
  OASessionSummary,
} from "@/server/models/domain"
import type { ExecutionService } from "@/server/services/execution-service"
import { toClientExecutionResult } from "@/server/services/execution-result-view"
import type { ProgressService } from "@/server/services/progress-service"

const RECENT_SESSIONS_TO_AVOID = 5

function cloneSession(session: OASession): OASession {
  return {
    ...session,
    problems: session.problems.map((p) => ({ ...p })),
  }
}

/**
 * Default `OASessionManager`. Session/timer state lives in memory for the lifetime of the
 * server process — same "single local user, one browser session, no cross-device resume"
 * scope the rest of the app declares — while the durable `oa_sessions` row (id, status,
 * startedAt, deadline, config, problemIds) is written through `OASessionStore` so recent
 * session history survives a restart and feeds the selector's repeat-avoidance.
 *
 * Per-problem attempts are written to the shared `attempts` table (mode: "oa") via
 * `ProgressService`, exactly like Practice/Blind Test — Mock OA is a third consumer of the
 * same ProgressStore/ExecutionService seams, not a parallel persistence path.
 */
export class OASessionService implements OASessionManager {
  private readonly sessions = new Map<string, OASession>()
  // Tracks, per (sessionId, problemId), the wall-clock timestamp of the last saveProgress/
  // submitProblem call — used to accumulate OASessionProblemState.timeSpentMs incrementally
  // rather than requiring the client to self-report elapsed time (which a client could get
  // wrong or manipulate). Not part of the public OASession shape sent to the client.
  private readonly lastTouchedAtMs = new Map<string, number>()

  constructor(
    private readonly selector: OAProblemSelector,
    private readonly sessionStore: OASessionStore,
    private readonly executionService: ExecutionService,
    private readonly progressService: ProgressService
  ) {}

  async startSession(config: OASessionConfig): Promise<OASession> {
    const recentSessionIds = await this.sessionStore.listRecentSessionIds(RECENT_SESSIONS_TO_AVOID)
    const problems = await this.selector.selectForSession(config, recentSessionIds)

    if (problems.length === 0) {
      throw new Error("No problems available to start a session")
    }

    const id = randomUUID()
    const startedAt = new Date()
    const deadline = new Date(startedAt.getTime() + config.timeBudgetMs)

    const session: OASession = {
      id,
      status: "in_progress",
      startedAt: startedAt.toISOString(),
      deadline: deadline.toISOString(),
      problems: problems.map((p) => ({
        problemId: p.id,
        status: "unanswered",
        code: null,
        lastSubmissionResult: null,
        timeSpentMs: 0,
      })),
      activeProblemId: problems[0]?.id ?? null,
    }

    await this.sessionStore.createSession({
      id,
      status: session.status,
      startedAt: session.startedAt,
      deadline: session.deadline,
      config,
      problemIds: problems.map((p) => p.id),
    })

    this.sessions.set(id, session)
    return cloneSession(session)
  }

  async getSession(sessionId: string): Promise<OASession | null> {
    const session = await this.resolveLiveSession(sessionId)
    return session ? cloneSession(session) : null
  }

  async saveProgress(sessionId: string, problemId: string, code: string): Promise<OASession> {
    const session = await this.requireActiveSession(sessionId)
    const problemState = this.requireProblemState(session, problemId)
    this.accrueTimeSpent(sessionId, problemState)

    problemState.code = code
    if (problemState.status === "unanswered") {
      problemState.status = "in_progress"
    }
    session.activeProblemId = problemId

    return cloneSession(session)
  }

  async submitProblem(
    sessionId: string,
    problemId: string,
    submission: CodeSubmission
  ): Promise<OASession> {
    const session = await this.requireActiveSession(sessionId)
    const problemState = this.requireProblemState(session, problemId)
    this.accrueTimeSpent(sessionId, problemState)

    const result = await this.executionService.execute(problemId, submission, "oa")

    // Same hidden-test-case stripping as /api/execute (Practice/Blind Test) — the session
    // payload is polled/held client-side for the rest of the session, so lastSubmissionResult
    // must never carry hidden-case input/expected/actual either.
    const clientResult = toClientExecutionResult(result)

    problemState.code = submission.code
    problemState.lastSubmissionResult = clientResult
    problemState.status = result.allPassed ? "passed" : "failed"
    session.activeProblemId = problemId

    await this.progressService.recordAttempt({
      problemId,
      passed: result.allPassed,
      hintsUsed: 0,
      durationMs: problemState.timeSpentMs,
      mode: "oa",
    })

    return cloneSession(session)
  }

  async endSession(sessionId: string): Promise<OASessionSummary> {
    const session = await this.resolveLiveSession(sessionId)
    if (!session) {
      throw new Error(`Unknown OA session: ${sessionId}`)
    }

    if (session.status === "in_progress") {
      const expired = new Date(session.deadline).getTime() <= Date.now()
      session.status = expired ? "expired" : "completed"
      await this.sessionStore.updateStatus(sessionId, session.status)
    }

    const problemsPassed = session.problems.filter((p) => p.status === "passed").length

    return {
      sessionId: session.id,
      status: session.status,
      problemsPassed,
      problemsTotal: session.problems.length,
      perProblem: session.problems.map((p) => ({
        problemId: p.problemId,
        status: p.status,
        timeSpentMs: p.timeSpentMs,
      })),
    }
  }

  /** Re-checks the deadline server-side on every call against a live session — a late call
   * against an expired session flips it to "expired" before any mutation is allowed, same
   * trust boundary as any other server-authoritative deadline. */
  private async requireActiveSession(sessionId: string): Promise<OASession> {
    const session = await this.resolveLiveSession(sessionId)
    if (!session) {
      throw new Error(`Unknown OA session: ${sessionId}`)
    }

    if (session.status !== "in_progress") {
      throw new Error(`OA session ${sessionId} is no longer in progress (${session.status})`)
    }

    if (new Date(session.deadline).getTime() <= Date.now()) {
      session.status = "expired"
      await this.sessionStore.updateStatus(sessionId, "expired")
      throw new Error(`OA session ${sessionId} has expired`)
    }

    return session
  }

  private requireProblemState(session: OASession, problemId: string) {
    const problemState = session.problems.find((p) => p.problemId === problemId)
    if (!problemState) {
      throw new Error(`Problem ${problemId} is not part of session ${session.id}`)
    }
    return problemState
  }

  /** Accrues wall-clock time since this problem was last touched (saveProgress/submitProblem)
   * within this session into `timeSpentMs`. Deltas are capped so a tab left open/idle for a
   * long stretch doesn't inflate the figure — this is a rough "time on task" signal for the
   * summary, not an interview-grade activity tracker. */
  private accrueTimeSpent(sessionId: string, problemState: OASession["problems"][number]): void {
    const key = `${sessionId}:${problemState.problemId}`
    const now = Date.now()
    const last = this.lastTouchedAtMs.get(key)

    if (last !== undefined) {
      const MAX_DELTA_MS = 10 * 60 * 1000
      problemState.timeSpentMs += Math.min(now - last, MAX_DELTA_MS)
    }

    this.lastTouchedAtMs.set(key, now)
  }

  /** In-memory sessions don't survive a server restart (dev server reload, etc). If a session
   * id is known to the durable store but missing from memory, treat it as unrecoverable rather
   * than silently fabricating a new one — the client should surface this rather than resume
   * a session with lost per-problem code/state. */
  private async resolveLiveSession(sessionId: string): Promise<OASession | null> {
    return this.sessions.get(sessionId) ?? null
  }
}
