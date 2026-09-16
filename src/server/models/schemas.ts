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

export const codeSubmissionSchema = z.object({
  code: z.string().min(1),
  functionName: z.string().min(1),
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
