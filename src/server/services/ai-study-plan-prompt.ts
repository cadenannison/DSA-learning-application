import type { StudyCurriculumSeed } from "@/server/interfaces/study-plan-store"

const ACTION_SCHEMA_DOC = `{
  "actions": [
    { "action": "create_plan", "name": "string (required, exactly one of this action)" },
    { "action": "update_settings", "interviewDate": "YYYY-MM-DD string or null (optional)", "dailyTimeBudgetMinutes": "integer >= 1 (optional)", "targetCompany": "string or null (optional)", "targetRole": "string or null (optional)", "background": "string or null (optional, free text)" },
    { "action": "update_pattern", "studyPatternId": "string, must be one of the Pattern IDs below", "stage": "one of: not_started | concept | easy_done | mediums_done | bug_tracing_done (optional)", "confidence": "integer 1-5 or null (optional)", "notes": "string (optional)" },
    { "action": "set_pattern_priority", "studyPatternId": "string, must be one of the Pattern IDs below", "personalizedPriorityRank": "integer >= 1 (optional) — lower is more urgent to learn", "personalizedLikelihoodWeight": "number 0-1 (optional) — your estimate of how likely this pattern is to appear in this specific interview loop" },
    { "action": "update_skill", "skillId": "string, must be one of the Skill IDs below", "done": "boolean" }
  ]
}`

/** Builds the copyable meta-prompt for Step 1 of the AI study-plan builder: instructions for
 * an external LLM (ChatGPT/Claude/Cursor) to interview the user about their prep, then emit a
 * JSON payload matching our exact action schema. Embeds the real curriculum pattern/skill IDs
 * so the external model references valid targets instead of inventing ids that won't resolve
 * against this plan's actual patterns. */
export function buildAiStudyPlanMetaPrompt(curriculum: StudyCurriculumSeed): string {
  const patternList = curriculum.patterns
    .map((p) => `- ${p.id} — "${p.name}" (track: ${p.trackId}, tier: ${p.complexityTier}, priority ${p.priorityRank})`)
    .join("\n")

  const skillList = curriculum.skills
    .map((s) => `- ${s.id} — "${s.name}"`)
    .join("\n")

  return `You are helping me build a personalized DSA interview-prep study plan for an app I use. Interview me conversationally — one question at a time — to learn:

1. What should this study plan be named?
2. What company and role am I interviewing for (if any), and when is the interview? How many minutes per day can I realistically study?
3. Briefly, what's my background — years of experience, languages/stacks I know, and any DSA areas I already know I'm weak or strong in?
4. For each pattern below that I have relevant experience with, ask me to self-rate: what stage am I at (not_started, concept, easy_done, mediums_done, bug_tracing_done), and my confidence 1-5 (or skip if unsure). Don't force me through every pattern mechanically — focus on the ones I bring up or that matter most for my prep, and leave the rest untouched.
5. Ask which of the foundational skills below I can already do "from scratch" with no reference, and mark those done.

Once you know my target company/role (or if I don't have one, use general industry knowledge), use your own knowledge of that company's or role's actual interview patterns to personalize the plan:
- Emit "set_pattern_priority" actions for patterns you believe are especially likely (or unlikely) to appear in my specific interview loop, given the company/role/background I described. Set personalizedLikelihoodWeight higher (closer to 1) for patterns that company/role is known to emphasize, and personalizedPriorityRank lower (more urgent) for the ones I should learn first given my timeline and background.
- Don't reorder everything — only emit set_pattern_priority for patterns where you have an actual, reasoned basis for deviating from a generic prep order (e.g. "this company's loop is known for heavy graph/BFS questions" or "with only 2 weeks and backend experience, dynamic programming should come before less-common patterns").
- If I gave no target company/role and no strong background signal, skip set_pattern_priority entirely — don't fabricate a rationale.

Available Pattern IDs (only use these exact ids):
${patternList}

Available Skill IDs (only use these exact ids):
${skillList}

Once you have enough information, STOP asking questions and output ONLY a single JSON object matching this exact schema (no markdown fences, no commentary before or after):

${ACTION_SCHEMA_DOC}

Rules:
- Include exactly one "create_plan" action.
- Only include "update_pattern" / "update_skill" actions for patterns/skills we actually discussed — don't invent data for ones I didn't mention.
- Only include "set_pattern_priority" actions where you have a real, statable reason tied to my company/role/background/timeline — never as a default for every pattern.
- Only use studyPatternId / skillId values from the lists above.
- Output raw JSON only in your final message — that JSON is what I'll paste into the app's builder box.`
}
