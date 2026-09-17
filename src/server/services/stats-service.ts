import type { StatsStore } from "@/server/interfaces/stats-store"
import type {
  DailyActivityOverview,
  PracticeMode,
  ProfileStatsOverview,
  StatEvent,
  StatEventType,
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
  const activeDayKeys: string[] = []

  for (const event of events) {
    activeDayKeys.push(toDateKey(event.occurredAt))
    totalTimeSpentMs += event.durationMs
    totalLinesOfCode += event.linesOfCode

    if (event.type === "attempt") {
      totalAttempts += 1
      if (event.mode) {
        byMode[event.mode].attempts += 1
        if (event.passed) byMode[event.mode].passed += 1
      }
      if (event.passed && event.problemId) solvedProblemIds.add(event.problemId)
    } else if (event.type === "oa_session_completed") {
      oaSessionsCompleted += 1
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
  }
}

export class StatsService {
  constructor(private readonly statsStore: StatsStore) {}

  async recordEvent(input: {
    userId: string
    type: StatEventType
    problemId?: string | null
    mode?: PracticeMode | null
    passed?: boolean | null
    durationMs?: number
    linesOfCode?: number
  }): Promise<StatEvent> {
    return this.statsStore.recordStatEvent({
      userId: input.userId,
      type: input.type,
      occurredAt: new Date().toISOString(),
      problemId: input.problemId ?? null,
      mode: input.mode ?? null,
      passed: input.passed ?? null,
      durationMs: input.durationMs ?? 0,
      linesOfCode: input.linesOfCode ?? 0,
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
}
