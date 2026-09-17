import type { AttemptRecord, ProblemProgress, ThemePreference } from "@/server/models/domain"

export interface ProgressStore {
  recordAttempt(attempt: Omit<AttemptRecord, "id">): Promise<AttemptRecord>
  getProgress(problemId: string): Promise<ProblemProgress | null>
  listProgress(): Promise<ProblemProgress[]>
  getTheme(): Promise<ThemePreference>
  setTheme(theme: ThemePreference): Promise<void>
  setFavorite(problemId: string, favorited: boolean): Promise<void>
  listFavoriteIds(): Promise<string[]>
}
