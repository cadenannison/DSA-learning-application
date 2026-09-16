import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import type { ProblemFilter, ProblemRepository } from "@/server/interfaces/problem-repository"
import type { DsaPattern, Problem, StrippedProblem } from "@/server/models/domain"

function strip(problem: Problem): StrippedProblem {
  return {
    id: problem.id,
    title: problem.title,
    prompt: problem.prompt,
    examples: problem.examples,
    constraints: problem.constraints,
    starterCode: problem.starterCode,
    functionName: problem.functionName,
  }
}

export class FileProblemRepository implements ProblemRepository {
  private cache: Problem[] | null = null

  constructor(private readonly problemsDir: string) {}

  private async loadAll(): Promise<Problem[]> {
    if (this.cache) return this.cache

    const files = await readdir(this.problemsDir)
    const jsonFiles = files.filter((file) => file.endsWith(".json"))

    const problems = await Promise.all(
      jsonFiles.map(async (file) => {
        const raw = await readFile(path.join(this.problemsDir, file), "utf-8")
        return JSON.parse(raw) as Problem
      })
    )

    this.cache = problems
    return problems
  }

  async getById(id: string): Promise<Problem | null> {
    const problems = await this.loadAll()
    return problems.find((problem) => problem.id === id) ?? null
  }

  async getStrippedById(id: string): Promise<StrippedProblem | null> {
    const problem = await this.getById(id)
    return problem ? strip(problem) : null
  }

  async list(filter?: ProblemFilter): Promise<Problem[]> {
    const problems = await this.loadAll()

    return problems.filter((problem) => {
      if (filter?.pattern && problem.pattern !== filter.pattern) return false
      if (filter?.difficulty && problem.difficulty !== filter.difficulty) return false
      if (filter?.query) {
        const query = filter.query.toLowerCase()
        if (!problem.title.toLowerCase().includes(query)) return false
      }
      return true
    })
  }

  async listPatterns(): Promise<DsaPattern[]> {
    const problems = await this.loadAll()
    return Array.from(new Set(problems.map((problem) => problem.pattern)))
  }
}
