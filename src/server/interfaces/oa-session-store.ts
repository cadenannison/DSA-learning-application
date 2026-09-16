import type { OASessionConfig, OASessionStatus } from "@/server/models/domain"

/** Row shape persisted in `oa_sessions` — mirrors OASession but keeps `problemIds` as the
 * ordered, authoritative problem list and `config` as the original session config, per
 * ARCHITECTURE.md's Persistence section. Per-problem live state (code, last result, time
 * spent) is NOT persisted here — it lives only in the in-memory OASession the manager holds
 * for the lifetime of the session, consistent with the "single browser session, no
 * cross-device resume" scope. */
export interface OASessionRecord {
  id: string
  status: OASessionStatus
  startedAt: string
  deadline: string
  config: OASessionConfig
  problemIds: string[]
}

export interface OASessionStore {
  createSession(record: OASessionRecord): Promise<void>
  getSession(sessionId: string): Promise<OASessionRecord | null>
  updateStatus(sessionId: string, status: OASessionStatus): Promise<void>
  listRecentSessionIds(limit: number): Promise<string[]>
}
