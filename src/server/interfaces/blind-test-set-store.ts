import type { BlindTestSet, BlindTestSetSummary } from "@/server/models/domain"

export interface BlindTestSetStore {
  createSet(set: BlindTestSet): Promise<void>
  getSet(id: string): Promise<BlindTestSet | null>
  listSets(): Promise<BlindTestSetSummary[]>
  addProblems(id: string, problemIds: string[]): Promise<BlindTestSet | null>
  removeProblem(id: string, problemId: string): Promise<BlindTestSet | null>
  deleteSet(id: string): Promise<void>
}
