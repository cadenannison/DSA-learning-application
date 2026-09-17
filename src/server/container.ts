import path from "node:path"
import { FilePatternLessonRepository } from "@/server/repositories/file-pattern-lesson-repository"
import { FileProblemRepository } from "@/server/repositories/file-problem-repository"
import { FileStudyCurriculumRepository } from "@/server/repositories/file-study-curriculum-repository"
import { PythonSubprocessSandbox } from "@/server/sandbox/python-subprocess-sandbox"
import { SqliteProgressStore } from "@/server/store/sqlite-progress-store"
import { AuthService } from "@/server/services/auth-service"
import { BlindTestSetService } from "@/server/services/blind-test-set-service"
import { ExecutionService } from "@/server/services/execution-service"
import { DefaultOAProblemSelector } from "@/server/services/oa-problem-selector"
import { OASessionService } from "@/server/services/oa-session-service"
import { PatternLessonService } from "@/server/services/pattern-lesson-service"
import { ProblemService } from "@/server/services/problem-service"
import { ProgressService } from "@/server/services/progress-service"
import { StatsService } from "@/server/services/stats-service"
import { StudyPlanService } from "@/server/services/study-plan-service"

interface Container {
  problemService: ProblemService
  executionService: ExecutionService
  progressService: ProgressService
  oaSessionService: OASessionService
  blindTestSetService: BlindTestSetService
  patternLessonService: PatternLessonService
  studyPlanService: StudyPlanService
  authService: AuthService
  statsService: StatsService
}

function buildContainer(): Container {
  const problemsDir = process.env.DSA_PROBLEMS_DIR ?? path.join(process.cwd(), "src/data/problems")
  const lessonsDir = process.env.DSA_LESSONS_DIR ?? path.join(process.cwd(), "src/data/lessons")
  const dbPath = process.env.DSA_DB_PATH ?? path.join(process.cwd(), "data/progress.db")
  const studyCurriculumPath =
    process.env.DSA_STUDY_CURRICULUM_PATH ??
    path.join(process.cwd(), "src/data/study-plan/curriculum.json")

  const problemRepository = new FileProblemRepository(problemsDir)
  const patternLessonRepository = new FilePatternLessonRepository(lessonsDir)
  const studyCurriculumRepository = new FileStudyCurriculumRepository(studyCurriculumPath)
  const sandbox = new PythonSubprocessSandbox()
  const progressStore = new SqliteProgressStore(dbPath)

  const executionService = new ExecutionService(sandbox, problemRepository)
  const oaProblemSelector = new DefaultOAProblemSelector(problemRepository, progressStore)
  // Built before progressService so the cross-app completion hook (a passing attempt anywhere
  // marks linked StudyProblems complete) can reuse its updateProblem/auto-advance logic
  // instead of duplicating it against the raw store.
  const studyPlanService = new StudyPlanService(
    progressStore,
    studyCurriculumRepository,
    executionService
  )
  const progressService = new ProgressService(progressStore, progressStore, studyPlanService)

  return {
    problemService: new ProblemService(problemRepository),
    executionService,
    progressService,
    oaSessionService: new OASessionService(
      oaProblemSelector,
      progressStore,
      executionService,
      progressService
    ),
    blindTestSetService: new BlindTestSetService(progressStore, problemRepository),
    patternLessonService: new PatternLessonService(patternLessonRepository),
    studyPlanService,
    authService: new AuthService(progressStore),
    statsService: new StatsService(progressStore),
  }
}

declare global {
  var __dsaContainer: Container | undefined
}

export const container = globalThis.__dsaContainer ?? buildContainer()

if (process.env.NODE_ENV !== "production") {
  globalThis.__dsaContainer = container
}
