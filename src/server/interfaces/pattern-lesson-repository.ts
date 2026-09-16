import type { DsaPattern, PatternLesson, PatternLessonSummary } from "@/server/models/domain"

export interface PatternLessonRepository {
  getByPattern(pattern: DsaPattern): Promise<PatternLesson | null>
  list(): Promise<PatternLessonSummary[]>
}
