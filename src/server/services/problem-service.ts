import type { ProblemFilter, ProblemRepository } from "@/server/interfaces/problem-repository"
import type { DsaPattern, Problem, StrippedProblem } from "@/server/models/domain"

export class ProblemService {
  constructor(private readonly problemRepository: ProblemRepository) {}

  async getById(id: string): Promise<Problem | null> {
    return this.problemRepository.getById(id)
  }

  async getForBlindTest(id: string): Promise<StrippedProblem | null> {
    return this.problemRepository.getStrippedById(id)
  }

  async list(filter?: ProblemFilter): Promise<Problem[]> {
    return this.problemRepository.list(filter)
  }

  async listPatterns(): Promise<DsaPattern[]> {
    return this.problemRepository.listPatterns()
  }

  async listCompanies(): Promise<string[]> {
    return this.problemRepository.listCompanies()
  }
}
