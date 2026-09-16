import path from "node:path"
import { describe, expect, it } from "vitest"
import { FileProblemRepository } from "@/server/repositories/file-problem-repository"
import { strippedProblemSchema } from "@/server/models/schemas"

const problemsDir = path.join(process.cwd(), "src/data/problems")

describe("blind test response shape", () => {
  it("never includes pattern, difficulty, hints, or solution keys", async () => {
    const repository = new FileProblemRepository(problemsDir)
    const stripped = await repository.getStrippedById("two-sum")

    expect(stripped).not.toBeNull()

    // This is what the /api/blind/[id] route handler sends over the wire — parsing
    // through the .strict() schema is the same guarantee the route relies on.
    const parsed = strippedProblemSchema.parse(stripped)
    const json = JSON.parse(JSON.stringify(parsed))

    expect(json).not.toHaveProperty("pattern")
    expect(json).not.toHaveProperty("difficulty")
    expect(json).not.toHaveProperty("hints")
    expect(json).not.toHaveProperty("solution")
  })

  it("rejects a stripped payload that leaks pattern/difficulty/hints/solution", () => {
    const leaking = {
      id: "two-sum",
      title: "Two Sum",
      prompt: "...",
      examples: [],
      constraints: [],
      starterCode: "function twoSum() {}",
      functionName: "twoSum",
      pattern: "arrays-two-pointers",
      difficulty: "easy",
      hints: ["use a hash map"],
      solution: { approach: "x", code: "y", timeComplexity: "O(n)", spaceComplexity: "O(n)" },
    }

    expect(() => strippedProblemSchema.parse(leaking)).toThrow()
  })
})
