import { randomUUID } from "node:crypto"
import type { BlindTestSetStore } from "@/server/interfaces/blind-test-set-store"
import type { ProblemRepository } from "@/server/interfaces/problem-repository"
import type {
  BlindTestSet,
  BlindTestSetFilter,
  BlindTestSetSummary,
  StrippedProblem,
} from "@/server/models/domain"

export class BlindTestSetService {
  constructor(
    private readonly setStore: BlindTestSetStore,
    private readonly problemRepository: ProblemRepository
  ) {}

  async createSet(
    name: string,
    problemIds: string[] = [],
    filter?: BlindTestSetFilter
  ): Promise<BlindTestSet> {
    const filteredIds = filter ? await this.resolveFilter(filter) : []
    const allIds = Array.from(new Set([...problemIds, ...filteredIds]))

    const set: BlindTestSet = {
      id: randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      problemIds: allIds,
    }

    await this.setStore.createSet(set)
    return set
  }

  async getSet(id: string): Promise<BlindTestSet | null> {
    return this.setStore.getSet(id)
  }

  async listSets(): Promise<BlindTestSetSummary[]> {
    return this.setStore.listSets()
  }

  async addProblems(id: string, problemIds: string[]): Promise<BlindTestSet | null> {
    return this.setStore.addProblems(id, problemIds)
  }

  async addByFilter(id: string, filter: BlindTestSetFilter): Promise<BlindTestSet | null> {
    const problemIds = await this.resolveFilter(filter)
    return this.setStore.addProblems(id, problemIds)
  }

  async removeProblem(id: string, problemId: string): Promise<BlindTestSet | null> {
    return this.setStore.removeProblem(id, problemId)
  }

  async deleteSet(id: string): Promise<void> {
    await this.setStore.deleteSet(id)
  }

  async getRandomStrippedProblem(id: string): Promise<StrippedProblem | null> {
    const set = await this.setStore.getSet(id)
    if (!set || set.problemIds.length === 0) return null

    const problemId = set.problemIds[Math.floor(Math.random() * set.problemIds.length)]
    return this.problemRepository.getStrippedById(problemId)
  }

  private async resolveFilter(filter: BlindTestSetFilter): Promise<string[]> {
    const patterns = filter.patterns && filter.patterns.length > 0 ? filter.patterns : [undefined]
    const difficulties =
      filter.difficulties && filter.difficulties.length > 0 ? filter.difficulties : [undefined]

    const matched = new Map<string, true>()

    for (const pattern of patterns) {
      for (const difficulty of difficulties) {
        const problems = await this.problemRepository.list({ pattern, difficulty })
        for (const problem of problems) matched.set(problem.id, true)
      }
    }

    return Array.from(matched.keys())
  }
}
