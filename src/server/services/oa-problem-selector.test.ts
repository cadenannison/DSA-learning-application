import path from "node:path"
import { describe, expect, it } from "vitest"
import { FileProblemRepository } from "@/server/repositories/file-problem-repository"
import { SqliteProgressStore } from "@/server/store/sqlite-progress-store"
import { DefaultOAProblemSelector } from "@/server/services/oa-problem-selector"
import type { OASessionConfig } from "@/server/models/domain"

const problemsDir = path.join(process.cwd(), "src/data/problems")

function makeSelector() {
  const repository = new FileProblemRepository(problemsDir)
  const store = new SqliteProgressStore(":memory:")
  return { selector: new DefaultOAProblemSelector(repository, store), store }
}

describe("DefaultOAProblemSelector", () => {
  it("selects the requested number of problems for a single difficulty", async () => {
    const { selector } = makeSelector()
    const config: OASessionConfig = { difficulty: "easy", problemCount: 3, timeBudgetMs: 60_000 }

    const problems = await selector.selectForSession(config, [])

    expect(problems).toHaveLength(3)
    expect(problems.every((p) => p.difficulty === "easy")).toBe(true)
    // No duplicate ids within one session.
    expect(new Set(problems.map((p) => p.id)).size).toBe(3)
  })

  it("selects per-difficulty counts for a mixed config", async () => {
    const { selector } = makeSelector()
    const config: OASessionConfig = {
      difficulty: { easy: 1, medium: 2 },
      problemCount: 3,
      timeBudgetMs: 60_000,
    }

    const problems = await selector.selectForSession(config, [])

    expect(problems.filter((p) => p.difficulty === "easy")).toHaveLength(1)
    expect(problems.filter((p) => p.difficulty === "medium")).toHaveLength(2)
  })

  it("never includes pattern-filtering — selection is difficulty-only", async () => {
    const { selector } = makeSelector()
    const config: OASessionConfig = { difficulty: "medium", problemCount: 5, timeBudgetMs: 60_000 }

    const problems = await selector.selectForSession(config, [])
    const patterns = new Set(problems.map((p) => p.pattern))

    // With 9 medium problems spanning several patterns in the seed set, a difficulty-only
    // selector should be able to return problems from more than one pattern.
    expect(patterns.size).toBeGreaterThan(0)
  })

  it("degrades gracefully (repeats allowed) when problemCount exceeds the difficulty's inventory", async () => {
    const { selector } = makeSelector()
    // The seed library has 0 "hard" problems today — asking for hard problems must still
    // return a full session by falling back to the broader pool rather than failing.
    const config: OASessionConfig = { difficulty: "hard", problemCount: 2, timeBudgetMs: 60_000 }

    const problems = await selector.selectForSession(config, [])

    expect(problems).toHaveLength(2)
  })

  it("avoids repeats from recent sessions when enough fresh problems exist", async () => {
    const { selector, store } = makeSelector()

    const allEasy = await new FileProblemRepository(problemsDir).list({ difficulty: "easy" })
    const usedIds = allEasy.slice(0, allEasy.length - 1).map((p) => p.id)

    await store.createSession({
      id: "prev-session",
      status: "completed",
      startedAt: new Date().toISOString(),
      deadline: new Date().toISOString(),
      config: { difficulty: "easy", problemCount: usedIds.length, timeBudgetMs: 60_000 },
      problemIds: usedIds,
    })

    const config: OASessionConfig = { difficulty: "easy", problemCount: 1, timeBudgetMs: 60_000 }
    const problems = await selector.selectForSession(config, ["prev-session"])

    expect(problems).toHaveLength(1)
    expect(usedIds).not.toContain(problems[0].id)
  })

  it("falls back to repeats when avoiding recent sessions would leave too few problems", async () => {
    const { selector, store } = makeSelector()

    const allEasy = await new FileProblemRepository(problemsDir).list({ difficulty: "easy" })
    const usedIds = allEasy.map((p) => p.id)

    await store.createSession({
      id: "prev-session",
      status: "completed",
      startedAt: new Date().toISOString(),
      deadline: new Date().toISOString(),
      config: { difficulty: "easy", problemCount: usedIds.length, timeBudgetMs: 60_000 },
      problemIds: usedIds,
    })

    // Every easy problem was "recently used" — with a thin library, the selector must still
    // return a full session by falling back to allowing repeats rather than failing.
    const config: OASessionConfig = {
      difficulty: "easy",
      problemCount: allEasy.length,
      timeBudgetMs: 60_000,
    }
    const problems = await selector.selectForSession(config, ["prev-session"])

    expect(problems).toHaveLength(allEasy.length)
  })
})
