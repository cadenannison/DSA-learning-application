import type { DsaPattern, StudyPatternWithReadiness, StudyPlanOverview } from "@/types"

/** Same grouping/sort the Study Plan list page uses: each track's patterns ordered by
 * priorityRank. Shared with the per-pattern page so Prev/Next walks the identical sequence
 * the list displays. */
export function sortedPatternsByTrack(
  overview: StudyPlanOverview
): { technicalPatterns: StudyPatternWithReadiness[]; oaPatterns: StudyPatternWithReadiness[] } {
  const technicalPatterns = overview.patterns
    .filter((p) => p.trackId === "technical-interview-prep")
    .sort((a, b) => a.priorityRank - b.priorityRank)

  const oaPatterns = overview.patterns
    .filter((p) => p.trackId === "oa-prep")
    .sort((a, b) => a.priorityRank - b.priorityRank)

  return { technicalPatterns, oaPatterns }
}

/** Prev/Next neighbors for a pattern, within its own track only (tracks are not chained). At
 * the first/last pattern in a track, the corresponding neighbor is null and the caller should
 * disable that direction rather than wrap or jump tracks. */
export function adjacentPatterns(
  overview: StudyPlanOverview,
  patternId: string
): { prev: StudyPatternWithReadiness | null; next: StudyPatternWithReadiness | null } {
  const { technicalPatterns, oaPatterns } = sortedPatternsByTrack(overview)
  const pattern = overview.patterns.find((p) => p.id === patternId)
  if (!pattern) return { prev: null, next: null }

  const track = pattern.trackId === "technical-interview-prep" ? technicalPatterns : oaPatterns
  const index = track.findIndex((p) => p.id === patternId)
  if (index === -1) return { prev: null, next: null }

  return {
    prev: index > 0 ? track[index - 1] : null,
    next: index < track.length - 1 ? track[index + 1] : null,
  }
}

/** Maps each study-plan curriculum pattern id to the lesson pattern(s) it covers. Curriculum
 * ids don't line up 1:1 with lesson patterns (some curriculum entries bundle several lessons,
 * some lessons have no curriculum entry), so this is a manual, best-effort correspondence. */
const CURRICULUM_TO_LESSON_PATTERNS: Record<string, DsaPattern[]> = {
  "oa-binary-search": ["binary-search"],
  graphs: ["graphs"],
  "dynamic-programming": ["dynamic-programming"],
  trees: ["trees"],
  heaps: ["heaps"],
  stacks: ["stacks-queues"],
  "linked-lists": ["linked-list"],
  intervals: ["intervals"],
  backtracking: ["backtracking"],
  "two-pointers-sliding-window-binary-search": ["arrays-two-pointers", "sliding-window", "binary-search"],
}

/** For each lesson pattern, the best (lowest = highest priority) rank found across every
 * pattern in the study plan overview that maps to it. Patterns with no corresponding
 * curriculum entry are left out of the map entirely. */
export function lessonPriorityRanks(overview: StudyPlanOverview): Partial<Record<DsaPattern, number>> {
  const ranks: Partial<Record<DsaPattern, number>> = {}

  for (const studyPattern of overview.patterns) {
    const lessonPatterns = CURRICULUM_TO_LESSON_PATTERNS[studyPattern.id]
    if (!lessonPatterns) continue

    for (const lessonPattern of lessonPatterns) {
      const existing = ranks[lessonPattern]
      if (existing === undefined || studyPattern.priorityRank < existing) {
        ranks[lessonPattern] = studyPattern.priorityRank
      }
    }
  }

  return ranks
}
