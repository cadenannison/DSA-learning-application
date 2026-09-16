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
  query: z.string().optional(),
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

export const executeRequestSchema = z.object({
  problemId: z.string().min(1),
  submission: codeSubmissionSchema,
  mode: z.enum(["practice", "blind"]),
})

export const recordAttemptRequestSchema = z.object({
  problemId: z.string().min(1),
  passed: z.boolean(),
  hintsUsed: z.number().int().min(0),
  durationMs: z.number().int().min(0),
  mode: z.enum(["practice", "blind"]),
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
  progressStatus: progressStatusSchema,
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
  mode: z.enum(["practice", "blind"]),
})

export const problemProgressSchema = z.object({
  problemId: z.string(),
  status: progressStatusSchema,
  attemptCount: z.number().int().min(0),
  hintsEverUsed: z.boolean(),
  lastAttemptAt: z.string().nullable(),
  lastSolvedAt: z.string().nullable(),
})
