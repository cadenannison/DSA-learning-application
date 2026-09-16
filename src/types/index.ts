import type { z } from "zod"
import type {
  attemptRecordSchema,
  difficultySchema,
  dsaPatternSchema,
  executionResultSchema,
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

export type PracticeMode = "practice" | "blind"

export interface CodeSubmission {
  code: string
  functionName: string
  language: "javascript"
}
