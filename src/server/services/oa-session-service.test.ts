import path from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { FileProblemRepository } from "@/server/repositories/file-problem-repository"
import { NodeVmSandbox } from "@/server/sandbox/node-vm-sandbox"
import { SqliteProgressStore } from "@/server/store/sqlite-progress-store"
import { ExecutionService } from "@/server/services/execution-service"
import { DefaultOAProblemSelector } from "@/server/services/oa-problem-selector"
import { OASessionService } from "@/server/services/oa-session-service"
import { ProgressService } from "@/server/services/progress-service"
import type { OASessionConfig } from "@/server/models/domain"

const problemsDir = path.join(process.cwd(), "src/data/problems")

function makeService() {
  const repository = new FileProblemRepository(problemsDir)
  const store = new SqliteProgressStore(":memory:")
  const executionService = new ExecutionService(new NodeVmSandbox(500), repository)
  const progressService = new ProgressService(store)
  const selector = new DefaultOAProblemSelector(repository, store)

  return new OASessionService(selector, store, executionService, progressService)
}

async function correctSubmissionFor(problemId: string) {
  const repository = new FileProblemRepository(problemsDir)
  const problem = await repository.getById(problemId)
  if (!problem) throw new Error(`fixture problem missing: ${problemId}`)
  return {
    code: problem.solution.code,
    functionName: problem.functionName,
    language: "javascript" as const,
  }
}

describe("OASessionService", () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it("starts a session with the requested number of problems, status in_progress, and a computed deadline", async () => {
    const service = makeService()
    const config: OASessionConfig = { difficulty: "easy", problemCount: 2, timeBudgetMs: 60_000 }

    const session = await service.startSession(config)

    expect(session.status).toBe("in_progress")
    expect(session.problems).toHaveLength(2)
    expect(session.problems.every((p) => p.status === "unanswered")).toBe(true)
    expect(new Date(session.deadline).getTime()).toBeGreaterThan(new Date(session.startedAt).getTime())
    expect(session.activeProblemId).toBe(session.problems[0].problemId)
  })

  it("never exposes pattern or a bare difficulty label on the session payload", async () => {
    const service = makeService()
    const session = await service.startSession({
      difficulty: "easy",
      problemCount: 1,
      timeBudgetMs: 60_000,
    })

    const json = JSON.parse(JSON.stringify(session))
    expect(json).not.toHaveProperty("pattern")
    expect(json.problems[0]).not.toHaveProperty("pattern")
    expect(json.problems[0]).not.toHaveProperty("difficulty")
  })

  it("saveProgress persists in-editor code without submitting", async () => {
    const service = makeService()
    const session = await service.startSession({
      difficulty: "easy",
      problemCount: 1,
      timeBudgetMs: 60_000,
    })
    const problemId = session.problems[0].problemId

    const updated = await service.saveProgress(session.id, problemId, "// wip")

    const state = updated.problems.find((p) => p.problemId === problemId)
    expect(state?.code).toBe("// wip")
    expect(state?.status).toBe("in_progress")
    expect(state?.lastSubmissionResult).toBeNull()
  })

  it("submitProblem runs the sandbox and marks the problem passed/failed without ending the session", async () => {
    const service = makeService()
    const session = await service.startSession({
      difficulty: "easy",
      problemCount: 1,
      timeBudgetMs: 60_000,
    })
    const problemId = session.problems[0].problemId
    const submission = await correctSubmissionFor(problemId)

    const updated = await service.submitProblem(session.id, problemId, submission)

    const state = updated.problems.find((p) => p.problemId === problemId)
    expect(state?.status).toBe("passed")
    expect(state?.lastSubmissionResult?.allPassed).toBe(true)
    expect(updated.status).toBe("in_progress")
  }, 10000)

  it("strips hidden test case input/expected/actual from the stored submission result, same as Practice/Blind Test", async () => {
    const service = makeService()
    const session = await service.startSession({
      difficulty: "easy",
      problemCount: 1,
      timeBudgetMs: 60_000,
    })
    const problemId = session.problems[0].problemId
    const submission = await correctSubmissionFor(problemId)

    const updated = await service.submitProblem(session.id, problemId, submission)
    const state = updated.problems.find((p) => p.problemId === problemId)
    const hiddenResults = state?.lastSubmissionResult?.results.filter((r) => r.isHidden) ?? []

    expect(hiddenResults.length).toBeGreaterThan(0)
    for (const hidden of hiddenResults) {
      expect(hidden.input).toEqual([])
      expect(hidden.expected).toBeUndefined()
      expect(hidden.actual).toBeUndefined()
    }
  }, 10000)

  it("allows moving between problems and returning to an earlier one later in the session", async () => {
    const service = makeService()
    const session = await service.startSession({
      difficulty: "easy",
      problemCount: 2,
      timeBudgetMs: 60_000,
    })
    const [first, second] = session.problems.map((p) => p.problemId)

    await service.saveProgress(session.id, first, "// first attempt")
    await service.saveProgress(session.id, second, "// second problem")
    const backToFirst = await service.saveProgress(session.id, first, "// revised")

    const firstState = backToFirst.problems.find((p) => p.problemId === first)
    expect(firstState?.code).toBe("// revised")
    expect(backToFirst.activeProblemId).toBe(first)
  })

  it("rejects submitProblem against an expired session", async () => {
    const service = makeService()
    const session = await service.startSession({
      difficulty: "easy",
      problemCount: 1,
      timeBudgetMs: 10,
    })
    const problemId = session.problems[0].problemId
    const submission = await correctSubmissionFor(problemId)

    await new Promise((resolve) => setTimeout(resolve, 30))

    await expect(service.submitProblem(session.id, problemId, submission)).rejects.toThrow()
  }, 10000)

  it("endSession finalizes status and returns a summary with pass counts and per-problem status", async () => {
    const service = makeService()
    const session = await service.startSession({
      difficulty: "easy",
      problemCount: 2,
      timeBudgetMs: 60_000,
    })
    const [first, second] = session.problems.map((p) => p.problemId)
    const goodSubmission = await correctSubmissionFor(first)

    await service.submitProblem(session.id, first, goodSubmission)
    await service.saveProgress(session.id, second, "// never submitted")

    const summary = await service.endSession(session.id)

    expect(summary.status).toBe("completed")
    expect(summary.problemsTotal).toBe(2)
    expect(summary.problemsPassed).toBe(1)
    expect(summary.perProblem.find((p) => p.problemId === first)?.status).toBe("passed")
    expect(summary.perProblem.find((p) => p.problemId === second)?.status).toBe("in_progress")

    const persisted = await service.getSession(session.id)
    expect(persisted?.status).toBe("completed")
  }, 10000)

  it("endSession marks an unfinished, time-expired session as expired rather than completed", async () => {
    const service = makeService()
    const session = await service.startSession({
      difficulty: "easy",
      problemCount: 1,
      timeBudgetMs: 10,
    })

    await new Promise((resolve) => setTimeout(resolve, 30))

    const summary = await service.endSession(session.id)
    expect(summary.status).toBe("expired")
  })
})
