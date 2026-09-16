import type { z } from "zod"
import type {
  attemptRecordSchema,
  blindTestSetSchema,
  blindTestSetSummarySchema,
  difficultySchema,
  dsaPatternSchema,
  executionResultSchema,
  lessonDemoKindSchema,
  oaProblemStatusSchema,
  oaSessionConfigSchema,
  oaSessionProblemStateSchema,
  oaSessionSchema,
  oaSessionStatusSchema,
  oaSessionSummarySchema,
  patternLessonSchema,
  patternLessonSummarySchema,
  practiceModeSchema,
  problemProgressSchema,
  problemSchema,
  problemSummarySchema,
  progressStatusSchema,
  strippedProblemSchema,
  themePreferenceSchema,
} from "@/server/models/schemas"

export type Difficulty = z.infer<typeof difficultySchema>
export type DsaPattern = z.infer<typeof dsaPatternSchema>
export type Problem = z.infer<typeof problemSchema>
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
  language: "javascript"
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
