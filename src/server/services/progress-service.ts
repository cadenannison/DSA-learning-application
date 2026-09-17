import type { ProgressStore } from "@/server/interfaces/progress-store"
import type { StudyPlanStore } from "@/server/interfaces/study-plan-store"
import type {
  AttemptRecord,
  PracticeMode,
  ProblemProgress,
  ThemePreference,
} from "@/server/models/domain"
import type { StudyPlanService } from "@/server/services/study-plan-service"

export class ProgressService {
  /** studyPlanStore/studyPlanService are optional so ProgressService stays constructible
   * without a study plan feature wired up; when present, they power the cross-app progress
   * hook below (solving a problem anywhere marks its linked StudyProblems complete). */
  constructor(
    private readonly progressStore: ProgressStore,
    private readonly studyPlanStore?: StudyPlanStore,
    private readonly studyPlanService?: StudyPlanService
  ) {}

  async recordAttempt(input: {
    problemId: string
    passed: boolean
    hintsUsed: number
    durationMs: number
    mode: PracticeMode
  }): Promise<AttemptRecord> {
    const attempt = await this.progressStore.recordAttempt({
      ...input,
      timestamp: new Date().toISOString(),
    })

    if (input.passed) {
      await this.completeLinkedStudyProblems(input.problemId)
    }

    return attempt
  }

  /** Cross-app progress: a passing attempt in ANY mode (Practice/Blind/OA) marks every
   * StudyProblem across every plan that links to this main-library Problem as completed,
   * triggering the same stage-auto-advance the embedded study-plan editor already does. Skips
   * cheaply when nothing links to this problem, the common case. */
  private async completeLinkedStudyProblems(problemId: string): Promise<void> {
    if (!this.studyPlanStore || !this.studyPlanService) return

    const links = await this.studyPlanStore.listStudyProblemsByLinkedProblemId(problemId)
    for (const link of links) {
      await this.studyPlanService.updateProblem(link.planId, link.studyProblemId, {
        completed: true,
      })
    }
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
