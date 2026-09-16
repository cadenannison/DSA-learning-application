import path from "node:path"
import { FileProblemRepository } from "@/server/repositories/file-problem-repository"
import { NodeVmSandbox } from "@/server/sandbox/node-vm-sandbox"
import { SqliteProgressStore } from "@/server/store/sqlite-progress-store"
import { ExecutionService } from "@/server/services/execution-service"
import { ProblemService } from "@/server/services/problem-service"
import { ProgressService } from "@/server/services/progress-service"

interface Container {
  problemService: ProblemService
  executionService: ExecutionService
  progressService: ProgressService
}

function buildContainer(): Container {
  const problemsDir = process.env.DSA_PROBLEMS_DIR ?? path.join(process.cwd(), "src/data/problems")
  const dbPath = process.env.DSA_DB_PATH ?? path.join(process.cwd(), "data/progress.db")

  const problemRepository = new FileProblemRepository(problemsDir)
  const sandbox = new NodeVmSandbox()
  const progressStore = new SqliteProgressStore(dbPath)

  return {
    problemService: new ProblemService(problemRepository),
    executionService: new ExecutionService(sandbox, problemRepository),
    progressService: new ProgressService(progressStore),
  }
}

declare global {
  var __dsaContainer: Container | undefined
}

export const container = globalThis.__dsaContainer ?? buildContainer()

if (process.env.NODE_ENV !== "production") {
  globalThis.__dsaContainer = container
}
