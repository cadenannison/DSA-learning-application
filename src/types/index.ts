import type { z } from "zod"
import type {
  attemptRecordSchema,
  blindTestSetSchema,
  blindTestSetSummarySchema,
  bugTracingExerciseSchema,
  createStudyPlanRequestSchema,
  difficultySchema,
  drillQueueEntrySchema,
  dsaPatternSchema,
  executionResultSchema,
  extendedLessonSchema,
  lessonDemoKindSchema,
  logProblemSessionRequestSchema,
  loginRequestSchema,
  mockInterviewResultSchema,
  oaProblemStatusSchema,
  oaSessionConfigSchema,
  oaSessionProblemStateSchema,
  oaSessionSchema,
  oaSessionStatusSchema,
  oaSessionSummarySchema,
  patternLessonSchema,
  patternLessonSummarySchema,
  dailyActivityDaySchema,
  dailyActivityOverviewSchema,
  practiceModeSchema,
  problemProgressSchema,
  problemSchema,
  problemSummarySchema,
  profileStatsOverviewSchema,
  progressStatusSchema,
  patternResourceSchema,
  readinessChecklistItemSchema,
  readinessChecklistOverviewSchema,
  readinessSourceSchema,
  readinessTriStateSchema,
  recommendedProblemSchema,
  registerRequestSchema,
  resourceTypeSchema,
  roadmapOverviewSchema,
  roadmapPatternEntrySchema,
  skillSchema,
  spacedRepetitionStateSchema,
  statEventTypeSchema,
  strippedProblemSchema,
  studyPatternComplexityTierSchema,
  studyPatternSchema,
  studyPatternStageSchema,
  studyPatternWithReadinessSchema,
  studyPlanOverviewSchema,
  studyPlanSchema,
  studyPlanSettingsSchema,
  studyPlanSummarySchema,
  studyProblemRoleSchema,
  studyProblemSchema,
  studyReadinessSchema,
  studyRecommendationSchema,
  studySessionSchema,
  studyTrackIdSchema,
  studyTrackSchema,
  submitStudyProblemRequestSchema,
  submitStudyProblemResponseSchema,
  themePreferenceSchema,
  todayFocusEntrySchema,
  updateReadinessChecklistItemRequestSchema,
  updateSkillRequestSchema,
  userSchema,
} from "@/server/models/schemas"

export type Difficulty = z.infer<typeof difficultySchema>
export type DsaPattern = z.infer<typeof dsaPatternSchema>
export type Problem = z.infer<typeof problemSchema>
export type TestCase = Problem["testCases"][number]
export type StrippedProblem = z.infer<typeof strippedProblemSchema>
export type ProblemSummary = z.infer<typeof problemSummarySchema>
export type ProgressStatus = z.infer<typeof progressStatusSchema>
export type ProblemProgress = z.infer<typeof problemProgressSchema>
export type AttemptRecord = z.infer<typeof attemptRecordSchema>
export type ExecutionResult = z.infer<typeof executionResultSchema>
export type TestCaseResult = ExecutionResult["results"][number]
export type TestOutcomeStatus = TestCaseResult["status"]
export type ThemePreference = z.infer<typeof themePreferenceSchema>

export type PracticeMode = z.infer<typeof practiceModeSchema>

export interface CodeSubmission {
  code: string
  functionName: string
  language: "python"
}

export type OASessionStatus = z.infer<typeof oaSessionStatusSchema>
export type OAProblemStatus = z.infer<typeof oaProblemStatusSchema>
export type OASessionConfig = z.infer<typeof oaSessionConfigSchema>
export type OASessionProblemState = z.infer<typeof oaSessionProblemStateSchema>
export type OASession = z.infer<typeof oaSessionSchema>
export type OASessionSummary = z.infer<typeof oaSessionSummarySchema>

export type BlindTestSet = z.infer<typeof blindTestSetSchema>
export type BlindTestSetSummary = z.infer<typeof blindTestSetSummarySchema>

export interface BlindTestSetFilter {
  patterns?: DsaPattern[]
  difficulties?: Difficulty[]
}

export type LessonDemoKind = z.infer<typeof lessonDemoKindSchema>
export type PatternLesson = z.infer<typeof patternLessonSchema>
export type PatternLessonSummary = z.infer<typeof patternLessonSummarySchema>

export type User = z.infer<typeof userSchema>
export type RegisterRequest = z.infer<typeof registerRequestSchema>
export type LoginRequest = z.infer<typeof loginRequestSchema>

export type StatEventType = z.infer<typeof statEventTypeSchema>
export type ProfileStatsOverview = z.infer<typeof profileStatsOverviewSchema>
export type DailyActivityDay = z.infer<typeof dailyActivityDaySchema>
export type DailyActivityOverview = z.infer<typeof dailyActivityOverviewSchema>

export type StudyTrackId = z.infer<typeof studyTrackIdSchema>
export type StudyTrack = z.infer<typeof studyTrackSchema>
export type StudyPatternComplexityTier = z.infer<typeof studyPatternComplexityTierSchema>
export type StudyPatternStage = z.infer<typeof studyPatternStageSchema>
export type StudyProblemRole = z.infer<typeof studyProblemRoleSchema>
export type StudyReadiness = z.infer<typeof studyReadinessSchema>
export type StudyProblem = z.infer<typeof studyProblemSchema>
export type SpacedRepetitionState = z.infer<typeof spacedRepetitionStateSchema>
export type StudyPattern = z.infer<typeof studyPatternSchema>
export type StudyPatternWithReadiness = z.infer<typeof studyPatternWithReadinessSchema>
export type StudySession = z.infer<typeof studySessionSchema>
export type MockInterviewResult = z.infer<typeof mockInterviewResultSchema>
export type StudyPlanSettings = z.infer<typeof studyPlanSettingsSchema>
export type StudyPlan = z.infer<typeof studyPlanSchema>
export type StudyPlanSummary = z.infer<typeof studyPlanSummarySchema>
export type CreateStudyPlanRequest = z.infer<typeof createStudyPlanRequestSchema>
export type StudyRecommendation = z.infer<typeof studyRecommendationSchema>
export type DrillQueueEntry = z.infer<typeof drillQueueEntrySchema>
export type RecommendedProblem = z.infer<typeof recommendedProblemSchema>
export type TodayFocusEntry = z.infer<typeof todayFocusEntrySchema>
export type StudyPlanOverview = z.infer<typeof studyPlanOverviewSchema>
export type ExtendedLesson = z.infer<typeof extendedLessonSchema>
export type BugTracingExercise = z.infer<typeof bugTracingExerciseSchema>
export type SubmitStudyProblemRequest = z.infer<typeof submitStudyProblemRequestSchema>
export type SubmitStudyProblemResponse = z.infer<typeof submitStudyProblemResponseSchema>
export type LogProblemSessionRequest = z.infer<typeof logProblemSessionRequestSchema>

export type RoadmapPatternEntry = z.infer<typeof roadmapPatternEntrySchema>
export type RoadmapOverview = z.infer<typeof roadmapOverviewSchema>

export type Skill = z.infer<typeof skillSchema>
export type UpdateSkillRequest = z.infer<typeof updateSkillRequestSchema>

export type ReadinessSource = z.infer<typeof readinessSourceSchema>
export type ReadinessTriState = z.infer<typeof readinessTriStateSchema>
export type ReadinessChecklistItem = z.infer<typeof readinessChecklistItemSchema>
export type ReadinessChecklistOverview = z.infer<typeof readinessChecklistOverviewSchema>
export type UpdateReadinessChecklistItemRequest = z.infer<
  typeof updateReadinessChecklistItemRequestSchema
>

export type ResourceType = z.infer<typeof resourceTypeSchema>
export type PatternResource = z.infer<typeof patternResourceSchema>
