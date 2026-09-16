import type { PatternLessonRepository } from "@/server/interfaces/pattern-lesson-repository"
import type { DsaPattern, PatternLesson, PatternLessonSummary } from "@/server/models/domain"

export class PatternLessonService {
  constructor(private readonly patternLessonRepository: PatternLessonRepository) {}

  async getByPattern(pattern: DsaPattern): Promise<PatternLesson | null> {
    return this.patternLessonRepository.getByPattern(pattern)
  }

  async list(): Promise<PatternLessonSummary[]> {
    return this.patternLessonRepository.list()
  }
}
