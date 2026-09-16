import type { DsaPattern, Difficulty, Problem, StrippedProblem } from "@/server/models/domain"

export interface ProblemFilter {
  pattern?: DsaPattern
  difficulty?: Difficulty
  query?: string
}

export interface ProblemRepository {
  getById(id: string): Promise<Problem | null>
  getStrippedById(id: string): Promise<StrippedProblem | null>
  list(filter?: ProblemFilter): Promise<Problem[]>
  listPatterns(): Promise<DsaPattern[]>
}
