import type { ProblemRepository } from "@/server/interfaces/problem-repository"
import type { StatsStore } from "@/server/interfaces/stats-store"
import {
  computeEventPoints,
  type DailyActivityOverview,
  type Difficulty,
  type OAMetrics,
  type OASessionHistoryEntry,
  type PracticeMode,
  type ProfileStatsOverview,
  type SolvedProblemEntry,
  type StatEvent,
  type StatEventType,
} from "@/server/models/domain"

function toDateKey(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 10)
}

/** Folds the longest run of consecutive calendar days ending today (or yesterday, so a streak
 * doesn't reset the instant midnight passes before today's first activity) out of a sorted set
 * of active-day keys, plus the longest run anywhere in the history. */
function computeStreaks(activeDayKeys: string[]): { current: number; longest: number } {
  if (activeDayKeys.length === 0) return { current: 0, longest: 0 }

  const days = Array.from(new Set(activeDayKeys)).sort()
  const dayMs = 24 * 60 * 60 * 1000

  let longest = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    const gapDays = Math.round(
      (new Date(`${days[i]}T00:00:00Z`).getTime() - new Date(`${days[i - 1]}T00:00:00Z`).getTime()) /
        dayMs
    )
    run = gapDays === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
  }

  const todayKey = toDateKey(new Date().toISOString())
  const lastActiveKey = days[days.length - 1]
  const daysSinceLastActive = Math.round(
    (new Date(`${todayKey}T00:00:00Z`).getTime() - new Date(`${lastActiveKey}T00:00:00Z`).getTime()) /
      dayMs
  )

  if (daysSinceLastActive > 1) return { current: 0, longest }

  let current = 1
  for (let i = days.length - 1; i > 0; i--) {
    const gapDays = Math.round(
      (new Date(`${days[i]}T00:00:00Z`).getTime() - new Date(`${days[i - 1]}T00:00:00Z`).getTime()) /
        dayMs
    )
    if (gapDays !== 1) break
    current += 1
  }

  return { current, longest }
}

function foldOverview(events: StatEvent[]): ProfileStatsOverview {
  const byMode: ProfileStatsOverview["byMode"] = {
    practice: { attempts: 0, passed: 0 },
    blind: { attempts: 0, passed: 0 },
    oa: { attempts: 0, passed: 0 },
  }

  const solvedProblemIds = new Set<string>()
  let totalAttempts = 0
  let totalLinesOfCode = 0
  let totalTimeSpentMs = 0
  let oaSessionsCompleted = 0
  let totalPoints = 0
  const activeDayKeys: string[] = []

  const oaMetrics: OAMetrics = {
    sessionsCompleted: 0,
    problemsSolved: 0,
    totalTimeMs: 0,
    totalPoints: 0,
  }

  for (const event of events) {
    activeDayKeys.push(toDateKey(event.occurredAt))
    totalTimeSpentMs += event.durationMs
    totalLinesOfCode += event.linesOfCode
    totalPoints += event.points

    if (event.type === "attempt") {
      totalAttempts += 1
      if (event.mode) {
        byMode[event.mode].attempts += 1
        if (event.passed) byMode[event.mode].passed += 1
      }
      if (event.passed && event.problemId) solvedProblemIds.add(event.problemId)

      if (event.mode === "oa") {
        oaMetrics.totalTimeMs += event.durationMs
        oaMetrics.totalPoints += event.points
        if (event.passed) oaMetrics.problemsSolved += 1
      }
    } else if (event.type === "oa_session_completed") {
      oaSessionsCompleted += 1
      oaMetrics.sessionsCompleted += 1
    }
  }

  const { current, longest } = computeStreaks(activeDayKeys)

  return {
    problemsCompleted: solvedProblemIds.size,
    totalAttempts,
    totalLinesOfCode,
    totalTimeSpentMs,
    oaSessionsCompleted,
    currentStreakDays: current,
    longestStreakDays: longest,
    activeDays: new Set(activeDayKeys).size,
    lastActiveAt: events.length > 0 ? events[events.length - 1].occurredAt : null,
    byMode,
    totalPoints,
    oaMetrics,
  }
}

export class StatsService {
  constructor(
    private readonly statsStore: StatsStore,
    private readonly problemRepository: ProblemRepository
  ) {}

  async recordEvent(input: {
    userId: string
    type: StatEventType
    problemId?: string | null
    studyProblemId?: string | null
    mode?: PracticeMode | null
    passed?: boolean | null
    durationMs?: number
    linesOfCode?: number
    testsPassed?: number | null
    testsTotal?: number | null
    difficulty?: Difficulty | null
    sessionId?: string | null
  }): Promise<StatEvent> {
    const mode = input.mode ?? null
    const passed = input.passed ?? null
    const testsPassed = input.testsPassed ?? null
    const difficulty = input.difficulty ?? null

    return this.statsStore.recordStatEvent({
      userId: input.userId,
      type: input.type,
      occurredAt: new Date().toISOString(),
      problemId: input.problemId ?? null,
      studyProblemId: input.studyProblemId ?? null,
      mode,
      passed,
      durationMs: input.durationMs ?? 0,
      linesOfCode: input.linesOfCode ?? 0,
      testsPassed,
      testsTotal: input.testsTotal ?? null,
      difficulty,
      points: computeEventPoints({ passed, mode, difficulty, testsPassed }),
      sessionId: input.sessionId ?? null,
    })
  }

  async getOverview(userId: string): Promise<ProfileStatsOverview> {
    const events = await this.statsStore.listStatEvents(userId)
    return foldOverview(events)
  }

  /** Zero-filled per-day solved counts for the last `days` calendar days (oldest first),
   * plus the longest streak anywhere in the user's full history — backs both the Progress
   * page's line chart and its consistency heatmap without needing a separate query. */
  async getDailyActivity(userId: string, days: number): Promise<DailyActivityOverview> {
    const events = await this.statsStore.listStatEvents(userId)

    const solvedByDay = new Map<string, number>()
    const activeDayKeys: string[] = []
    for (const event of events) {
      const dayKey = toDateKey(event.occurredAt)
      activeDayKeys.push(dayKey)
      if (event.type === "attempt" && event.passed) {
        solvedByDay.set(dayKey, (solvedByDay.get(dayKey) ?? 0) + 1)
      }
    }

    const { longest } = computeStreaks(activeDayKeys)

    const result: { date: string; solvedCount: number }[] = []
    const dayMs = 24 * 60 * 60 * 1000
    const todayKey = toDateKey(new Date().toISOString())
    const today = new Date(`${todayKey}T00:00:00Z`).getTime()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today - i * dayMs).toISOString().slice(0, 10)
      result.push({ date, solvedCount: solvedByDay.get(date) ?? 0 })
    }

    return { days: result, longestStreakDays: longest }
  }

  /** History of passing submissions for a "Solved problems" table — one row per passing
   * "attempt" event, most-recent-first. Deliberately not deduped by problemId: a re-solve is
   * genuine history, not noise. Falls back to the problemId itself as the display name/null
   * difficulty if the underlying Problem was since deleted or renamed. */
  async listSolvedProblems(userId: string): Promise<SolvedProblemEntry[]> {
    const events = await this.statsStore.listStatEvents(userId)
    const solvedEvents = events.filter(
      (event): event is StatEvent & { problemId: string } =>
        event.type === "attempt" && event.passed === true && event.problemId !== null
    )

    const entries = await Promise.all(
      solvedEvents.map(async (event) => {
        const problem = await this.problemRepository.getById(event.problemId)
        return {
          problemId: event.problemId,
          problemName: problem?.title ?? event.problemId,
          // Prefer the difficulty snapshotted on the event at write time (events recorded
          // after that column existed) — falls back to the live join for older rows so
          // history recorded before this column existed still displays something.
          difficulty: event.difficulty ?? problem?.difficulty ?? null,
          solvedAt: event.occurredAt,
          durationMs: event.durationMs,
          linesOfCode: event.linesOfCode,
          mode: event.mode,
          testsPassed: event.testsPassed,
          testsTotal: event.testsTotal,
          points: event.points,
          // Not snapshotted on the event itself (unlike difficulty) — the full Problem is
          // already resolved above for title/difficulty, so pattern/companies ride along for
          // the Stats page's "solved by category" breakdown at no extra cost.
          pattern: problem?.pattern ?? null,
          companies: problem?.companies ?? [],
        }
      })
    )

    return entries.sort((a, b) => (a.solvedAt < b.solvedAt ? 1 : a.solvedAt > b.solvedAt ? -1 : 0))
  }

  /** One row per completed Mock OA session, most-recent-first, for the "Mock OAs completed"
   * table — folds this user's "attempt" events (mode "oa") grouped by sessionId, using each
   * session's own "oa_session_completed" event for completedAt. Sessions with no matching
   * "oa_session_completed" event (e.g. recorded before sessionId existed, or the end-session
   * call never happened) are skipped — there's no reliable completedAt to sort/display for
   * them. Per-problem detail is included so the client can render it collapsed by default. */
  async listOASessionHistory(userId: string): Promise<OASessionHistoryEntry[]> {
    const events = await this.statsStore.listStatEvents(userId)

    const completedAtBySessionId = new Map<string, string>()
    const problemEventsBySessionId = new Map<string, StatEvent[]>()

    for (const event of events) {
      if (!event.sessionId) continue

      if (event.type === "oa_session_completed") {
        completedAtBySessionId.set(event.sessionId, event.occurredAt)
      } else if (event.type === "attempt" && event.mode === "oa") {
        const existing = problemEventsBySessionId.get(event.sessionId) ?? []
        existing.push(event)
        problemEventsBySessionId.set(event.sessionId, existing)
      }
    }

    const entries = await Promise.all(
      Array.from(completedAtBySessionId.entries()).map(async ([sessionId, completedAt]) => {
        const problemEvents = problemEventsBySessionId.get(sessionId) ?? []

        const problems = await Promise.all(
          problemEvents.map(async (event) => {
            const problem = event.problemId ? await this.problemRepository.getById(event.problemId) : null
            return {
              problemId: event.problemId ?? "",
              problemName: problem?.title ?? event.problemId ?? "Unknown problem",
              difficulty: event.difficulty ?? problem?.difficulty ?? null,
              passed: event.passed === true,
              durationMs: event.durationMs,
              testsPassed: event.testsPassed,
              testsTotal: event.testsTotal,
              points: event.points,
            }
          })
        )

        const entry: OASessionHistoryEntry = {
          sessionId,
          completedAt,
          problemsPassed: problems.filter((p) => p.passed).length,
          problemsTotal: problems.length,
          totalTimeMs: problems.reduce((sum, p) => sum + p.durationMs, 0),
          totalPoints: problems.reduce((sum, p) => sum + p.points, 0),
          problems,
        }
        return entry
      })
    )

    return entries.sort((a, b) => (a.completedAt < b.completedAt ? 1 : a.completedAt > b.completedAt ? -1 : 0))
  }
}
