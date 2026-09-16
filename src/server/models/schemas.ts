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

// functionName is interpolated directly into vm script source (`${functionName}(...__input)`)
// rather than passed as data, so it must be constrained to a single valid identifier —
// otherwise it's a script-injection vector into the sandbox's invocation script.
const identifierSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z_$][\w$]*$/, "functionName must be a single valid JavaScript identifier")

export const codeSubmissionSchema = z.object({
  code: z.string().min(1),
  functionName: identifierSchema,
  language: z.literal("javascript"),
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
})

export const preferencesSchema = z.object({
  theme: z.enum(["light", "dark"]),
})

export const themePreferenceSchema = z.enum(["light", "dark"])

const testCaseSchema = z.object({
  input: z.array(z.unknown()),
  expected: z.unknown(),
  isHidden: z.boolean(),
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
