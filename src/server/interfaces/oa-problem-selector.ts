import type { OASessionConfig, ProblemSummary } from "@/server/models/domain"

export interface OAProblemSelector {
  selectForSession(config: OASessionConfig, recentSessionIds: string[]): Promise<ProblemSummary[]>
}
