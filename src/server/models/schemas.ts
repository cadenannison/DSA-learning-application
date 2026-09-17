import { z } from "zod"

export const difficultySchema = z.enum(["easy", "medium", "hard"])

export const dsaPatternSchema = z.enum([
  "arrays-two-pointers",
  "sliding-window",
  "binary-search",
  "linked-list",
  "trees",
  "bfs-dfs",
  "heaps",
  "backtracking",
  "intervals",
  "graphs",
  "dynamic-programming",
  "greedy",
  "tries",
  "stacks-queues",
])

export const problemFilterSchema = z.object({
  pattern: dsaPatternSchema.optional(),
  difficulty: difficultySchema.optional(),
  company: z.string().optional(),
  query: z.string().optional(),
  favorite: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
})

// functionName is passed as data (JSON over stdin) to the Python worker and looked up via a
// dict lookup after exec, never interpolated into exec'd source — so it isn't a script-injection
// vector. This regex is still enforced as defense in depth (a non-identifier name can only ever
// fail the lookup, never do anything else) and to give a clear validation error early.
const identifierSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z_]\w*$/, "functionName must be a single valid Python identifier")

export const codeSubmissionSchema = z.object({
  code: z.string().min(1),
  functionName: identifierSchema,
  language: z.literal("python"),
})

export const practiceModeSchema = z.enum(["practice", "blind", "oa"])

export const executeRequestSchema = z.object({
  problemId: z.string().min(1),
  submission: codeSubmissionSchema,
  mode: practiceModeSchema,
})

export const recordAttemptRequestSchema = z.object({
  problemId: z.string().min(1),
  passed: z.boolean(),
  hintsUsed: z.number().int().min(0),
  durationMs: z.number().int().min(0),
  mode: practiceModeSchema,
  // Optional, submitted-code text — used only to derive a lines-of-code count for the
  // logged-in submitter's profile stats. Never persisted verbatim or echoed back.
  code: z.string().optional(),
})

export const preferencesSchema = z.object({
  theme: z.enum(["light", "dark"]),
})

export const themePreferenceSchema = z.enum(["light", "dark"])

const testCaseSchema = z.object({
  input: z.array(z.unknown()),
  expected: z.unknown(),
  isHidden: z.boolean(),
  name: z.string().optional(),
})

export const problemSchema = z.object({
  id: z.string(),
  title: z.string(),
  pattern: dsaPatternSchema,
  difficulty: difficultySchema,
  companies: z.array(z.string()),
  prompt: z.string(),
  examples: z.array(
    z.object({
      input: z.string(),
      output: z.string(),
      explanation: z.string().optional(),
    })
  ),
  constraints: z.array(z.string()),
  hints: z.array(z.string()),
  solution: z.object({
    approach: z.string(),
    code: z.string(),
    timeComplexity: z.string(),
    spaceComplexity: z.string(),
  }),
  starterCode: z.string(),
  functionName: z.string(),
  testCases: z.array(testCaseSchema),
})

// .strict() is load-bearing here: it's the mechanical guarantee that pattern, difficulty,
// hints, and solution can never leak into a Blind Test response, even if a future field is
// added to the domain Problem type and someone forgets to update this schema by hand.
export const strippedProblemSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    prompt: z.string(),
    examples: z.array(
      z.object({
        input: z.string(),
        output: z.string(),
        explanation: z.string().optional(),
      })
    ),
    constraints: z.array(z.string()),
    starterCode: z.string(),
    functionName: z.string(),
  })
  .strict()

export const progressStatusSchema = z.enum(["not_started", "attempted", "solved", "mastered"])

export const problemSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  pattern: dsaPatternSchema,
  difficulty: difficultySchema,
  companies: z.array(z.string()),
  progressStatus: progressStatusSchema,
  favorited: z.boolean(),
})

export const setFavoriteRequestSchema = z.object({
  favorited: z.boolean(),
})

const testOutcomeStatusSchema = z.enum(["passed", "wrong_answer", "runtime_error", "timeout"])

const testCaseResultSchema = z.object({
  status: testOutcomeStatusSchema,
  input: z.array(z.unknown()),
  expected: z.unknown(),
  actual: z.unknown(),
  isHidden: z.boolean(),
  stdout: z.string(),
  errorMessage: z.string().nullable(),
  name: z.string().optional(),
})

export const executionResultSchema = z.object({
  allPassed: z.boolean(),
  results: z.array(testCaseResultSchema),
  runtimeMs: z.number(),
})

export const attemptRecordSchema = z.object({
  id: z.string(),
  problemId: z.string(),
  timestamp: z.string(),
  passed: z.boolean(),
  hintsUsed: z.number().int().min(0),
  durationMs: z.number().int().min(0),
  mode: practiceModeSchema,
})

export const problemProgressSchema = z.object({
  problemId: z.string(),
  status: progressStatusSchema,
  attemptCount: z.number().int().min(0),
  hintsEverUsed: z.boolean(),
  lastAttemptAt: z.string().nullable(),
  lastSolvedAt: z.string().nullable(),
})

// --- Mock OA Mode ---

export const oaSessionStatusSchema = z.enum(["in_progress", "completed", "expired"])
export const oaProblemStatusSchema = z.enum(["unanswered", "in_progress", "passed", "failed"])

export const oaSessionConfigSchema = z.object({
  difficulty: z.union([
    difficultySchema,
    z.object({
      easy: z.number().int().min(0).optional(),
      medium: z.number().int().min(0).optional(),
      hard: z.number().int().min(0).optional(),
    }),
  ]),
  problemCount: z.number().int().min(1),
  timeBudgetMs: z.number().int().min(1),
})

export const oaSessionProblemStateSchema = z.object({
  problemId: z.string(),
  status: oaProblemStatusSchema,
  code: z.string().nullable(),
  lastSubmissionResult: executionResultSchema.nullable(),
  timeSpentMs: z.number().int().min(0),
})

// .strict() is load-bearing here for the same reason as strippedProblemSchema: OASession is
// the payload sent to the client during a live session, and it must never carry `pattern` or
// a bare `difficulty` label per-problem — only problemId + session-local state. This schema is
// the mechanical guarantee, not a comment.
export const oaSessionSchema = z
  .object({
    id: z.string(),
    status: oaSessionStatusSchema,
    startedAt: z.string(),
    deadline: z.string(),
    problems: z.array(oaSessionProblemStateSchema),
    activeProblemId: z.string().nullable(),
  })
  .strict()

export const oaSessionSummarySchema = z.object({
  sessionId: z.string(),
  status: oaSessionStatusSchema,
  problemsPassed: z.number().int().min(0),
  problemsTotal: z.number().int().min(0),
  perProblem: z.array(
    z.object({
      problemId: z.string(),
      status: oaProblemStatusSchema,
      timeSpentMs: z.number().int().min(0),
    })
  ),
})

export const startOASessionRequestSchema = z.object({
  config: oaSessionConfigSchema,
})

export const saveOAProgressRequestSchema = z.object({
  problemId: z.string().min(1),
  code: z.string(),
})

export const submitOAProblemRequestSchema = z.object({
  problemId: z.string().min(1),
  submission: codeSubmissionSchema,
})

// --- Blind Test Sets ---

export const blindTestSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  problemIds: z.array(z.string()),
})

export const blindTestSetSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  problemCount: z.number().int().min(0),
})

export const createBlindTestSetRequestSchema = z.object({
  name: z.string().min(1),
  problemIds: z.array(z.string()).optional(),
  filter: z
    .object({
      patterns: z.array(dsaPatternSchema).optional(),
      difficulties: z.array(difficultySchema).optional(),
    })
    .optional(),
})

export const addProblemsToSetRequestSchema = z.object({
  problemIds: z.array(z.string().min(1)).min(1),
})

// --- Pattern Lessons ---

export const lessonDemoKindSchema = z.enum([
  "two-pointers",
  "sliding-window",
  "binary-search",
  "bfs-dfs",
  "linked-list",
  "trees",
  "heaps",
  "backtracking",
  "intervals",
  "graphs",
  "dynamic-programming",
  "greedy",
  "tries",
  "stacks-queues",
  "none",
])

export const patternLessonSchema = z.object({
  pattern: dsaPatternSchema,
  title: z.string(),
  summary: z.string(),
  explanation: z.array(z.string()),
  whenToUse: z.array(z.string()),
  timeComplexity: z.string(),
  spaceComplexity: z.string(),
  demoKind: lessonDemoKindSchema,
  relatedProblemIds: z.array(z.string()),
})

export const patternLessonSummarySchema = z.object({
  pattern: dsaPatternSchema,
  title: z.string(),
  summary: z.string(),
  hasInteractiveDemo: z.boolean(),
  relatedProblemCount: z.number().int().min(0),
})

// --- Auth ---

const usernameSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[A-Za-z0-9_-]+$/, "username must be letters, numbers, _ or -")

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  createdAt: z.string(),
})

export const registerRequestSchema = z.object({
  username: usernameSchema,
  password: z.string().min(8).max(200),
})

export const loginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

// --- Profile / Stats ---

export const statEventTypeSchema = z.enum(["attempt", "oa_session_completed"])

export const profileStatsOverviewSchema = z.object({
  problemsCompleted: z.number().int().min(0),
  totalAttempts: z.number().int().min(0),
  totalLinesOfCode: z.number().int().min(0),
  totalTimeSpentMs: z.number().int().min(0),
  oaSessionsCompleted: z.number().int().min(0),
  currentStreakDays: z.number().int().min(0),
  longestStreakDays: z.number().int().min(0),
  activeDays: z.number().int().min(0),
  lastActiveAt: z.string().nullable(),
  byMode: z.record(practiceModeSchema, z.object({ attempts: z.number().int().min(0), passed: z.number().int().min(0) })),
})

export const dailyActivityDaySchema = z.object({
  date: z.string(),
  solvedCount: z.number().int().min(0),
})

export const dailyActivityOverviewSchema = z.object({
  days: z.array(dailyActivityDaySchema),
  longestStreakDays: z.number().int().min(0),
})

// --- Study Plan ---

export const studyTrackIdSchema = z.enum(["oa-prep", "technical-interview-prep"])

export const studyPatternComplexityTierSchema = z.enum([
  "core",
  "important",
  "complexity-ceiling",
  "stretch",
])

export const studyPatternStageSchema = z.enum([
  "not_started",
  "concept",
  "easy_done",
  "mediums_done",
  "bug_tracing_done",
])

export const studyProblemRoleSchema = z.enum(["canonical_easy", "medium_variant"])

export const studyReadinessSchema = z.enum(["not_started", "needs_work", "developing", "ready"])

export const studyTrackSchema = z.object({
  id: studyTrackIdSchema,
  name: z.string(),
  description: z.string(),
  coachingNote: z.string().nullable(),
})

export const studyProblemSchema = z.object({
  id: z.string(),
  studyPatternId: z.string(),
  name: z.string(),
  difficulty: difficultySchema,
  role: studyProblemRoleSchema,
  externalUrl: z.string().nullable(),
  completed: z.boolean(),
  timeTakenMinutes: z.number().int().min(0).nullable(),
  constraintAddedMidSolve: z.boolean().nullable(),
  linkedProblemId: z.string().nullable(),
  estimatedMinutes: z.number().int().min(0),
})

export const extendedLessonSchema = z.object({
  coreIdeaMarkdown: z.string(),
  workedExampleMarkdown: z.string(),
  variationsMarkdown: z.string(),
  signalPhrases: z.array(z.string()),
  commonMistakesMarkdown: z.string(),
  complexityMarkdown: z.string(),
})

export const bugTracingExerciseSchema = z.object({
  prompt: z.string(),
  solutionWalkthroughMarkdown: z.string(),
})

export const spacedRepetitionStateSchema = z.object({
  easeFactor: z.number().min(1.3),
  intervalDays: z.number().min(0),
  dueAt: z.string().nullable(),
  lastReviewedAt: z.string().nullable(),
  reviewCount: z.number().int().min(0),
})

export const studyPatternSchema = z.object({
  id: z.string(),
  trackId: studyTrackIdSchema,
  name: z.string(),
  priorityRank: z.number().int(),
  likelihoodWeight: z.number().min(0).max(1),
  conceptNotes: z.string(),
  complexityTier: studyPatternComplexityTierSchema,
  stage: studyPatternStageSchema,
  confidence: z.number().int().min(1).max(5).nullable(),
  notes: z.string(),
  problems: z.array(studyProblemSchema),
  spacedRepetition: spacedRepetitionStateSchema,
  hasExtendedLesson: z.boolean(),
  lesson: extendedLessonSchema.nullable(),
  bugTracingExercise: bugTracingExerciseSchema.nullable(),
})

export const studyPatternWithReadinessSchema = studyPatternSchema.extend({
  readiness: studyReadinessSchema,
})

export const studySessionSchema = z.object({
  id: z.string(),
  date: z.string(),
  minutesSpent: z.number().int().min(0),
  studyPatternIds: z.array(z.string()),
  stickingPoint: z.string(),
  planForNextSession: z.string(),
})

export const mockInterviewResultSchema = z.object({
  id: z.string(),
  date: z.string(),
  studyProblemId: z.string().nullable(),
  studyPatternId: z.string().nullable(),
  problemName: z.string(),
  timeTakenMinutes: z.number().int().min(0),
  solvedCleanly: z.boolean(),
  constraintAddedMidSolve: z.boolean(),
  notes: z.string(),
})

export const studyPlanSettingsSchema = z.object({
  interviewDate: z.string().nullable(),
  dailyTimeBudgetMinutes: z.number().int().min(1),
})

export const studyPlanSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  createdAt: z.string(),
})

export const studyPlanSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  interviewDate: z.string().nullable(),
  dailyTimeBudgetMinutes: z.number().int().min(1),
  totalPatterns: z.number().int().min(0),
  readyOrBetterPatterns: z.number().int().min(0),
})

export const createStudyPlanRequestSchema = z.object({
  name: z.string().min(1),
})

export const studyRecommendationSchema = z.object({
  studyPatternId: z.string().nullable(),
  studyPatternName: z.string().nullable(),
  trackId: studyTrackIdSchema.nullable(),
  nextStage: studyPatternStageSchema.nullable(),
  reason: z.string(),
  daysRemaining: z.number().int().nullable(),
  suggestedMinutesToday: z.number().int().min(0),
  oaPrepSuggestion: z.string().nullable(),
  drillQueueEstimatedMinutes: z.number().int().min(0),
})

export const drillQueueEntrySchema = z.object({
  studyPatternId: z.string(),
  studyPatternName: z.string(),
  trackId: studyTrackIdSchema,
  reason: z.enum([
    "overdue_review",
    "never_reviewed",
    "high_likelihood_low_confidence",
    "scheduled",
  ]),
  priorityScore: z.number(),
  likelihoodWeight: z.number().min(0).max(1),
  readiness: studyReadinessSchema,
  dueAt: z.string().nullable(),
  estimatedMinutes: z.number().int().min(0),
})

export const studyPlanOverviewSchema = z.object({
  settings: studyPlanSettingsSchema,
  tracks: z.array(studyTrackSchema),
  patterns: z.array(studyPatternWithReadinessSchema),
  recommendation: studyRecommendationSchema,
  drillQueue: z.array(drillQueueEntrySchema),
  overallProgress: z.array(
    z.object({
      trackId: studyTrackIdSchema,
      totalPatterns: z.number().int().min(0),
      readyOrBetter: z.number().int().min(0),
      averageStageIndex: z.number().min(0),
    })
  ),
})

export const updateStudyPatternRequestSchema = z.object({
  stage: studyPatternStageSchema.optional(),
  confidence: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().optional(),
})

export const updateStudyProblemRequestSchema = z.object({
  completed: z.boolean().optional(),
  timeTakenMinutes: z.number().int().min(0).nullable().optional(),
  constraintAddedMidSolve: z.boolean().nullable().optional(),
})

export const updateStudyPlanSettingsRequestSchema = z.object({
  interviewDate: z.string().nullable().optional(),
  dailyTimeBudgetMinutes: z.number().int().min(1).optional(),
})

export const createStudySessionRequestSchema = z.object({
  date: z.string().min(1),
  minutesSpent: z.number().int().min(0),
  studyPatternIds: z.array(z.string()),
  stickingPoint: z.string().optional().default(""),
  planForNextSession: z.string().optional().default(""),
})

export const createMockInterviewResultRequestSchema = z.object({
  date: z.string().min(1),
  studyProblemId: z.string().nullable().optional(),
  studyPatternId: z.string().nullable().optional(),
  problemName: z.string().min(1),
  timeTakenMinutes: z.number().int().min(0),
  solvedCleanly: z.boolean(),
  constraintAddedMidSolve: z.boolean().optional().default(false),
  notes: z.string().optional().default(""),
})

export const submitStudyProblemRequestSchema = z.object({
  submission: codeSubmissionSchema,
  timeTakenMinutes: z.number().int().min(0),
})

export const submitStudyProblemResponseSchema = z.object({
  execution: executionResultSchema,
  pattern: studyPatternSchema,
})

export const logProblemSessionRequestSchema = z.object({
  minutesSpent: z.number().int().min(0),
})
