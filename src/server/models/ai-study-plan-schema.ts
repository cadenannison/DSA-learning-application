import { z } from "zod"
import { studyPatternStageSchema } from "@/server/models/schemas"

/** The action vocabulary the AI study-plan builder is allowed to dispatch. Each action maps
 * 1:1 onto an existing StudyPlanService method — no new mutation path is introduced, so a
 * generated plan flows through the exact same validated writes a manual edit would. */

export const createPlanActionSchema = z.object({
  action: z.literal("create_plan"),
  name: z.string().min(1),
})

export const updateSettingsActionSchema = z.object({
  action: z.literal("update_settings"),
  interviewDate: z.string().nullable().optional(),
  dailyTimeBudgetMinutes: z.number().int().min(1).optional(),
  targetCompany: z.string().nullable().optional(),
  targetRole: z.string().nullable().optional(),
  background: z.string().nullable().optional(),
})

export const updatePatternActionSchema = z.object({
  action: z.literal("update_pattern"),
  studyPatternId: z.string(),
  stage: studyPatternStageSchema.optional(),
  confidence: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().optional(),
})

/** Distinct from update_pattern: this sets the plan's *personalized* priority/likelihood
 * override for a pattern (see StudyPattern.personalizedPriorityRank), reflecting the LLM's
 * judgment of how this pattern matters for the user's stated target company/role/background —
 * not the user's own self-rated stage/confidence, which update_pattern already covers. */
export const setPatternPriorityActionSchema = z.object({
  action: z.literal("set_pattern_priority"),
  studyPatternId: z.string(),
  personalizedPriorityRank: z.number().int().min(1).optional(),
  personalizedLikelihoodWeight: z.number().min(0).max(1).optional(),
})

export const updateSkillActionSchema = z.object({
  action: z.literal("update_skill"),
  skillId: z.string(),
  done: z.boolean(),
})

export const aiStudyPlanActionSchema = z.discriminatedUnion("action", [
  createPlanActionSchema,
  updateSettingsActionSchema,
  updatePatternActionSchema,
  setPatternPriorityActionSchema,
  updateSkillActionSchema,
])

export type AiStudyPlanAction = z.infer<typeof aiStudyPlanActionSchema>

/** Top-level shape the AI payload must match: exactly one create_plan action, plus any number
 * of the other action types (in any order — the service applies them sequentially). */
export const aiStudyPlanPayloadSchema = z.object({
  actions: z
    .array(aiStudyPlanActionSchema)
    .min(1)
    .refine(
      (actions) => actions.filter((a) => a.action === "create_plan").length === 1,
      "actions must contain exactly one create_plan action"
    ),
})

export type AiStudyPlanPayload = z.infer<typeof aiStudyPlanPayloadSchema>
