import { describe, expect, it } from "vitest"
import { SqliteProgressStore } from "@/server/store/sqlite-progress-store"
import type { AttemptRecord } from "@/server/models/domain"

function attempt(overrides: Partial<Omit<AttemptRecord, "id">>): Omit<AttemptRecord, "id"> {
  return {
    problemId: "two-sum",
    timestamp: new Date().toISOString(),
    passed: false,
    hintsUsed: 0,
    durationMs: 1000,
    mode: "practice",
    ...overrides,
  }
}

describe("SqliteProgressStore status computation", () => {
  it("is not_started with no attempts", async () => {
    const store = new SqliteProgressStore(":memory:")
    const progress = await store.getProgress("two-sum")
    expect(progress).toBeNull()
  })

  it("is attempted after a failed attempt", async () => {
    const store = new SqliteProgressStore(":memory:")
    await store.recordAttempt(attempt({ passed: false }))

    const progress = await store.getProgress("two-sum")
    expect(progress?.status).toBe("attempted")
  })

  it("is solved after a passing attempt made with hints used", async () => {
    const store = new SqliteProgressStore(":memory:")
    await store.recordAttempt(attempt({ passed: true, hintsUsed: 2 }))

    const progress = await store.getProgress("two-sum")
    expect(progress?.status).toBe("solved")
    expect(progress?.hintsEverUsed).toBe(true)
  })

  it("is mastered after a passing attempt made with no hints", async () => {
    const store = new SqliteProgressStore(":memory:")
    await store.recordAttempt(attempt({ passed: true, hintsUsed: 0 }))

    const progress = await store.getProgress("two-sum")
    expect(progress?.status).toBe("mastered")
  })

  it("resolves to mastered when a hint-assisted solve is followed by a later hint-free solve", async () => {
    const store = new SqliteProgressStore(":memory:")

    await store.recordAttempt(
      attempt({ passed: true, hintsUsed: 3, timestamp: "2026-01-01T00:00:00.000Z" })
    )
    await store.recordAttempt(
      attempt({ passed: true, hintsUsed: 0, timestamp: "2026-01-02T00:00:00.000Z" })
    )

    const progress = await store.getProgress("two-sum")
    expect(progress?.status).toBe("mastered")
    expect(progress?.hintsEverUsed).toBe(true)
  })

  it("stays solved (never downgrades) if a hint-free solve is followed by a hint-assisted solve", async () => {
    const store = new SqliteProgressStore(":memory:")

    await store.recordAttempt(
      attempt({ passed: true, hintsUsed: 0, timestamp: "2026-01-01T00:00:00.000Z" })
    )
    await store.recordAttempt(
      attempt({ passed: true, hintsUsed: 2, timestamp: "2026-01-02T00:00:00.000Z" })
    )

    const progress = await store.getProgress("two-sum")
    expect(progress?.status).toBe("mastered")
  })

  it("stays attempted across multiple failed attempts", async () => {
    const store = new SqliteProgressStore(":memory:")
    await store.recordAttempt(attempt({ passed: false }))
    await store.recordAttempt(attempt({ passed: false }))

    const progress = await store.getProgress("two-sum")
    expect(progress?.status).toBe("attempted")
    expect(progress?.attemptCount).toBe(2)
  })
})
