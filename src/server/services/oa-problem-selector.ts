import type { OAProblemSelector } from "@/server/interfaces/oa-problem-selector"
import type { OASessionStore } from "@/server/interfaces/oa-session-store"
import type { ProblemRepository } from "@/server/interfaces/problem-repository"
import type { Difficulty, OASessionConfig, ProblemSummary } from "@/server/models/domain"

function toBucket(difficulty: OASessionConfig["difficulty"]): Partial<Record<Difficulty, number>> {
  if (typeof difficulty === "string") {
    return {}
  }
  return difficulty
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Default `OAProblemSelector`. Pulls candidates from `ProblemRepository.list({ difficulty })`
 * per difficulty bucket in `config.difficulty` — pattern is never part of the selection
 * filter or the returned summaries beyond what `ProblemSummary` already carries, so the
 * session payload built from this never needs to strip a pattern tag added after the fact.
 *
 * "Avoid repeats from recent OA sessions" is a soft preference: filter out problems used in
 * `recentSessionIds` first, and only fall back to allowing repeats if too few unused problems
 * exist at that difficulty — required given the ~15-problem library that exists today.
 */
export class DefaultOAProblemSelector implements OAProblemSelector {
  constructor(
    private readonly problemRepository: ProblemRepository,
    private readonly sessionStore: OASessionStore
  ) {}

  async selectForSession(
    config: OASessionConfig,
    recentSessionIds: string[]
  ): Promise<ProblemSummary[]> {
    const recentProblemIds = await this.collectRecentProblemIds(recentSessionIds)

    const buckets = this.resolveBuckets(config)
    const selected: ProblemSummary[] = []
    const usedIds = new Set<string>()

    for (const [difficulty, count] of buckets) {
      const picked = await this.pickForDifficulty(difficulty, count, recentProblemIds, usedIds)
      for (const problem of picked) {
        selected.push(problem)
        usedIds.add(problem.id)
      }
    }

    // If bucket-by-bucket selection came up short (thin library, or a single-difficulty
    // config asking for more than exists), top up from any difficulty rather than starting
    // a session with fewer problems than requested.
    if (selected.length < config.problemCount) {
      const shortBy = config.problemCount - selected.length
      const allProblems = await this.problemRepository.list()
      const fallbackPool = shuffle(allProblems.filter((p) => !usedIds.has(p.id)))

      for (const problem of fallbackPool.slice(0, shortBy)) {
        selected.push(this.toSummary(problem))
        usedIds.add(problem.id)
      }
    }

    return selected
  }

  private resolveBuckets(config: OASessionConfig): [Difficulty, number][] {
    if (typeof config.difficulty === "string") {
      return [[config.difficulty, config.problemCount]]
    }

    const bucket = toBucket(config.difficulty)
    const entries = Object.entries(bucket) as [Difficulty, number | undefined][]
    return entries
      .filter((entry): entry is [Difficulty, number] => typeof entry[1] === "number" && entry[1] > 0)
      .map(([difficulty, count]) => [difficulty, count])
  }

  private async pickForDifficulty(
    difficulty: Difficulty,
    count: number,
    recentProblemIds: Set<string>,
    alreadyUsed: Set<string>
  ): Promise<ProblemSummary[]> {
    const candidates = await this.problemRepository.list({ difficulty })
    const available = candidates.filter((p) => !alreadyUsed.has(p.id))

    const fresh = shuffle(available.filter((p) => !recentProblemIds.has(p.id)))
    const repeats = shuffle(available.filter((p) => recentProblemIds.has(p.id)))

    // Fresh problems first, then fall back to repeats if the difficulty bucket is too thin —
    // silently degrading beats failing to start a session.
    const pool = [...fresh, ...repeats].slice(0, count)
    return pool.map((p) => this.toSummary(p))
  }

  private toSummary(problem: {
    id: string
    title: string
    pattern: ProblemSummary["pattern"]
    difficulty: Difficulty
    companies: string[]
  }): ProblemSummary {
    return {
      id: problem.id,
      title: problem.title,
      pattern: problem.pattern,
      difficulty: problem.difficulty,
      companies: problem.companies,
      progressStatus: "not_started",
      favorited: false,
    }
  }

  private async collectRecentProblemIds(recentSessionIds: string[]): Promise<Set<string>> {
    const ids = new Set<string>()

    for (const sessionId of recentSessionIds) {
      const record = await this.sessionStore.getSession(sessionId)
      if (!record) continue
      for (const problemId of record.problemIds) ids.add(problemId)
    }

    return ids
  }
}
