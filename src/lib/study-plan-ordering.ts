import type { StudyPatternWithReadiness, StudyPlanOverview } from "@/types"

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
