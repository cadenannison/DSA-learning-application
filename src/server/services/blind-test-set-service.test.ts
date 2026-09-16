import path from "node:path"
import { describe, expect, it } from "vitest"
import { FileProblemRepository } from "@/server/repositories/file-problem-repository"
import { SqliteProgressStore } from "@/server/store/sqlite-progress-store"
import { BlindTestSetService } from "@/server/services/blind-test-set-service"

const problemsDir = path.join(process.cwd(), "src/data/problems")

function makeService() {
  const repository = new FileProblemRepository(problemsDir)
  const store = new SqliteProgressStore(":memory:")
  return new BlindTestSetService(store, repository)
}

describe("BlindTestSetService", () => {
  it("creates a set from explicit problem ids", async () => {
    const service = makeService()
    const set = await service.createSet("My Set", ["two-sum", "valid-anagram"])

    expect(set.name).toBe("My Set")
    expect(set.problemIds).toEqual(["two-sum", "valid-anagram"])

    const fetched = await service.getSet(set.id)
    expect(fetched).toEqual(set)
  })

  it("creates a set from a difficulty filter", async () => {
    const service = makeService()
    const repository = new FileProblemRepository(problemsDir)
    const easyProblems = await repository.list({ difficulty: "easy" })

    const set = await service.createSet("Easy Set", [], { difficulties: ["easy"] })

    expect(new Set(set.problemIds)).toEqual(new Set(easyProblems.map((p) => p.id)))
  })

  it("creates a set from a pattern filter", async () => {
    const service = makeService()
    const repository = new FileProblemRepository(problemsDir)
    const arrayProblems = await repository.list({ pattern: "arrays-two-pointers" })

    const set = await service.createSet("Two Pointer Set", [], {
      patterns: ["arrays-two-pointers"],
    })

    expect(new Set(set.problemIds)).toEqual(new Set(arrayProblems.map((p) => p.id)))
  })

  it("matches the union across multiple selected patterns and difficulties", async () => {
    const service = makeService()
    const repository = new FileProblemRepository(problemsDir)

    const expected = new Set<string>()
    for (const pattern of ["arrays-two-pointers", "binary-search"] as const) {
      for (const difficulty of ["easy", "medium"] as const) {
        const problems = await repository.list({ pattern, difficulty })
        for (const p of problems) expected.add(p.id)
      }
    }

    const set = await service.createSet("Combined", [], {
      patterns: ["arrays-two-pointers", "binary-search"],
      difficulties: ["easy", "medium"],
    })

    expect(new Set(set.problemIds)).toEqual(expected)
  })

  it("does not duplicate problem ids when adding overlapping problems", async () => {
    const service = makeService()
    const set = await service.createSet("Set", ["two-sum"])

    const updated = await service.addProblems(set.id, ["two-sum", "valid-anagram"])

    expect(updated?.problemIds).toEqual(["two-sum", "valid-anagram"])
  })

  it("removes a problem from a set", async () => {
    const service = makeService()
    const set = await service.createSet("Set", ["two-sum", "valid-anagram"])

    const updated = await service.removeProblem(set.id, "two-sum")

    expect(updated?.problemIds).toEqual(["valid-anagram"])
  })

  it("returns a random stripped problem from the set with no pattern/difficulty leakage", async () => {
    const service = makeService()
    const set = await service.createSet("Set", ["two-sum"])

    const problem = await service.getRandomStrippedProblem(set.id)

    expect(problem?.id).toBe("two-sum")
    expect(problem).not.toHaveProperty("pattern")
    expect(problem).not.toHaveProperty("difficulty")
  })

  it("returns null for a random pick from an empty or missing set", async () => {
    const service = makeService()
    const emptySet = await service.createSet("Empty", [])

    expect(await service.getRandomStrippedProblem(emptySet.id)).toBeNull()
    expect(await service.getRandomStrippedProblem("does-not-exist")).toBeNull()
  })

  it("lists sets with problem counts", async () => {
    const service = makeService()
    await service.createSet("Set A", ["two-sum"])
    await service.createSet("Set B", ["two-sum", "valid-anagram"])

    const sets = await service.listSets()
    const byName = new Map(sets.map((s) => [s.name, s.problemCount]))

    expect(byName.get("Set A")).toBe(1)
    expect(byName.get("Set B")).toBe(2)
  })

  it("deletes a set", async () => {
    const service = makeService()
    const set = await service.createSet("Temp", ["two-sum"])

    await service.deleteSet(set.id)

    expect(await service.getSet(set.id)).toBeNull()
  })
})
