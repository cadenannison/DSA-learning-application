import type { ProgressStore } from "@/server/interfaces/progress-store"
import type {
  AttemptRecord,
  PracticeMode,
  ProblemProgress,
  ThemePreference,
} from "@/server/models/domain"

export class ProgressService {
  constructor(private readonly progressStore: ProgressStore) {}

  async recordAttempt(input: {
    problemId: string
    passed: boolean
    hintsUsed: number
    durationMs: number
    mode: PracticeMode
  }): Promise<AttemptRecord> {
    return this.progressStore.recordAttempt({
      ...input,
      timestamp: new Date().toISOString(),
    })
  }

  async getProgress(problemId: string): Promise<ProblemProgress | null> {
    return this.progressStore.getProgress(problemId)
  }

  async listProgress(): Promise<ProblemProgress[]> {
    return this.progressStore.listProgress()
  }

  async getTheme(): Promise<ThemePreference> {
    return this.progressStore.getTheme()
  }

  async setTheme(theme: ThemePreference): Promise<void> {
    return this.progressStore.setTheme(theme)
  }

  async setFavorite(problemId: string, favorited: boolean): Promise<void> {
    return this.progressStore.setFavorite(problemId, favorited)
  }

  async listFavoriteIds(): Promise<string[]> {
    return this.progressStore.listFavoriteIds()
  }
}
