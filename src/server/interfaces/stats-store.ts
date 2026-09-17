import type { StatEvent } from "@/server/models/domain"

export interface StatsStore {
  /** Append-only — never updated or deleted, same convention as study_problem_sessions. */
  recordStatEvent(event: Omit<StatEvent, "id">): Promise<StatEvent>
  listStatEvents(userId: string): Promise<StatEvent[]>
}
