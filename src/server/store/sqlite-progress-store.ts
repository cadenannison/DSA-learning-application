import Database from "better-sqlite3"
import { randomUUID } from "node:crypto"
import { mkdirSync } from "node:fs"
import path from "node:path"
import type { BlindTestSetStore } from "@/server/interfaces/blind-test-set-store"
import type { OASessionRecord, OASessionStore } from "@/server/interfaces/oa-session-store"
import type { ProgressStore } from "@/server/interfaces/progress-store"
import type {
  AttemptRecord,
  BlindTestSet,
  BlindTestSetSummary,
  OASessionConfig,
  OASessionStatus,
  ProblemProgress,
  ProgressStatus,
  ThemePreference,
} from "@/server/models/domain"

interface AttemptRow {
  id: string
  problem_id: string
  timestamp: string
  passed: number
  hints_used: number
  duration_ms: number
  mode: string
}

interface OASessionRow {
  id: string
  status: string
  started_at: string
  deadline: string
  config: string
  problem_ids: string
}

interface BlindTestSetRow {
  id: string
  name: string
  created_at: string
}

function computeStatus(rows: AttemptRow[]): ProgressStatus {
  if (rows.length === 0) return "not_started"

  const hasSolvedWithoutHints = rows.some((row) => row.passed === 1 && row.hints_used === 0)
  const hasSolved = rows.some((row) => row.passed === 1)

  if (hasSolvedWithoutHints) return "mastered"
  if (hasSolved) return "solved"
  return "attempted"
}

function toProgress(problemId: string, rows: AttemptRow[]): ProblemProgress {
  const solvedRows = rows.filter((row) => row.passed === 1)

  return {
    problemId,
    status: computeStatus(rows),
    attemptCount: rows.length,
    hintsEverUsed: rows.some((row) => row.hints_used > 0),
    lastAttemptAt: rows.length > 0 ? rows[rows.length - 1].timestamp : null,
    lastSolvedAt: solvedRows.length > 0 ? solvedRows[solvedRows.length - 1].timestamp : null,
  }
}

export class SqliteProgressStore implements ProgressStore, OASessionStore, BlindTestSetStore {
  private readonly db: Database.Database

  constructor(dbPath: string) {
    mkdirSync(path.dirname(dbPath), { recursive: true })
    this.db = new Database(dbPath)
    this.db.pragma("journal_mode = WAL")
    this.db.pragma("foreign_keys = ON")
    this.migrate()
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS attempts (
        id TEXT PRIMARY KEY,
        problem_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        passed INTEGER NOT NULL,
        hints_used INTEGER NOT NULL,
        duration_ms INTEGER NOT NULL,
        mode TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_attempts_problem_id ON attempts(problem_id);

      CREATE TABLE IF NOT EXISTS preferences (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        theme TEXT NOT NULL DEFAULT 'light'
      );
      INSERT OR IGNORE INTO preferences (id, theme) VALUES (1, 'light');

      CREATE TABLE IF NOT EXISTS oa_sessions (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        deadline TEXT NOT NULL,
        config TEXT NOT NULL,
        problem_ids TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_oa_sessions_started_at ON oa_sessions(started_at);

      CREATE TABLE IF NOT EXISTS blind_test_sets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS blind_test_set_problems (
        set_id TEXT NOT NULL REFERENCES blind_test_sets(id) ON DELETE CASCADE,
        problem_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        PRIMARY KEY (set_id, problem_id)
      );
      CREATE INDEX IF NOT EXISTS idx_blind_test_set_problems_set_id ON blind_test_set_problems(set_id);

      CREATE TABLE IF NOT EXISTS favorites (
        problem_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL
      );
    `)
  }

  async recordAttempt(attempt: Omit<AttemptRecord, "id">): Promise<AttemptRecord> {
    const id = randomUUID()

    this.db
      .prepare(
        `INSERT INTO attempts (id, problem_id, timestamp, passed, hints_used, duration_ms, mode)
         VALUES (@id, @problemId, @timestamp, @passed, @hintsUsed, @durationMs, @mode)`
      )
      .run({
        id,
        problemId: attempt.problemId,
        timestamp: attempt.timestamp,
        passed: attempt.passed ? 1 : 0,
        hintsUsed: attempt.hintsUsed,
        durationMs: attempt.durationMs,
        mode: attempt.mode,
      })

    return { id, ...attempt }
  }

  async getProgress(problemId: string): Promise<ProblemProgress | null> {
    const rows = this.db
      .prepare(`SELECT * FROM attempts WHERE problem_id = ? ORDER BY timestamp ASC`)
      .all(problemId) as AttemptRow[]

    if (rows.length === 0) return null
    return toProgress(problemId, rows)
  }

  async listProgress(): Promise<ProblemProgress[]> {
    const rows = this.db
      .prepare(`SELECT * FROM attempts ORDER BY timestamp ASC`)
      .all() as AttemptRow[]

    const byProblem = new Map<string, AttemptRow[]>()
    for (const row of rows) {
      const existing = byProblem.get(row.problem_id) ?? []
      existing.push(row)
      byProblem.set(row.problem_id, existing)
    }

    return Array.from(byProblem.entries()).map(([problemId, problemRows]) =>
      toProgress(problemId, problemRows)
    )
  }

  async getTheme(): Promise<ThemePreference> {
    const row = this.db.prepare(`SELECT theme FROM preferences WHERE id = 1`).get() as
      | { theme: ThemePreference }
      | undefined
    return row?.theme ?? "light"
  }

  async setTheme(theme: ThemePreference): Promise<void> {
    this.db.prepare(`UPDATE preferences SET theme = ? WHERE id = 1`).run(theme)
  }

  async setFavorite(problemId: string, favorited: boolean): Promise<void> {
    if (favorited) {
      this.db
        .prepare(`INSERT OR IGNORE INTO favorites (problem_id, created_at) VALUES (?, ?)`)
        .run(problemId, new Date().toISOString())
    } else {
      this.db.prepare(`DELETE FROM favorites WHERE problem_id = ?`).run(problemId)
    }
  }

  async listFavoriteIds(): Promise<string[]> {
    const rows = this.db
      .prepare(`SELECT problem_id FROM favorites ORDER BY created_at ASC`)
      .all() as { problem_id: string }[]
    return rows.map((row) => row.problem_id)
  }

  async createSession(record: OASessionRecord): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO oa_sessions (id, status, started_at, deadline, config, problem_ids)
         VALUES (@id, @status, @startedAt, @deadline, @config, @problemIds)`
      )
      .run({
        id: record.id,
        status: record.status,
        startedAt: record.startedAt,
        deadline: record.deadline,
        config: JSON.stringify(record.config),
        problemIds: JSON.stringify(record.problemIds),
      })
  }

  async getSession(sessionId: string): Promise<OASessionRecord | null> {
    const row = this.db.prepare(`SELECT * FROM oa_sessions WHERE id = ?`).get(sessionId) as
      | OASessionRow
      | undefined

    if (!row) return null
    return this.toSessionRecord(row)
  }

  async updateStatus(sessionId: string, status: OASessionStatus): Promise<void> {
    this.db.prepare(`UPDATE oa_sessions SET status = ? WHERE id = ?`).run(status, sessionId)
  }

  async listRecentSessionIds(limit: number): Promise<string[]> {
    const rows = this.db
      .prepare(`SELECT id FROM oa_sessions ORDER BY started_at DESC LIMIT ?`)
      .all(limit) as { id: string }[]

    return rows.map((row) => row.id)
  }

  private toSessionRecord(row: OASessionRow): OASessionRecord {
    return {
      id: row.id,
      status: row.status as OASessionStatus,
      startedAt: row.started_at,
      deadline: row.deadline,
      config: JSON.parse(row.config) as OASessionConfig,
      problemIds: JSON.parse(row.problem_ids) as string[],
    }
  }

  async createSet(set: BlindTestSet): Promise<void> {
    const insertSet = this.db.prepare(
      `INSERT INTO blind_test_sets (id, name, created_at) VALUES (@id, @name, @createdAt)`
    )
    const insertProblem = this.db.prepare(
      `INSERT INTO blind_test_set_problems (set_id, problem_id, position) VALUES (@setId, @problemId, @position)`
    )

    const transaction = this.db.transaction(() => {
      insertSet.run({ id: set.id, name: set.name, createdAt: set.createdAt })
      set.problemIds.forEach((problemId, position) => {
        insertProblem.run({ setId: set.id, problemId, position })
      })
    })

    transaction()
  }

  async getSet(id: string): Promise<BlindTestSet | null> {
    const row = this.db.prepare(`SELECT * FROM blind_test_sets WHERE id = ?`).get(id) as
      | BlindTestSetRow
      | undefined

    if (!row) return null

    const problemIds = this.getSetProblemIds(id)
    return { id: row.id, name: row.name, createdAt: row.created_at, problemIds }
  }

  async listSets(): Promise<BlindTestSetSummary[]> {
    const rows = this.db
      .prepare(
        `SELECT s.id, s.name, s.created_at, COUNT(p.problem_id) as problem_count
         FROM blind_test_sets s
         LEFT JOIN blind_test_set_problems p ON p.set_id = s.id
         GROUP BY s.id
         ORDER BY s.created_at DESC`
      )
      .all() as (BlindTestSetRow & { problem_count: number })[]

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      problemCount: row.problem_count,
    }))
  }

  async addProblems(id: string, problemIds: string[]): Promise<BlindTestSet | null> {
    const existing = this.db.prepare(`SELECT id FROM blind_test_sets WHERE id = ?`).get(id)
    if (!existing) return null

    const currentIds = new Set(this.getSetProblemIds(id))
    const startPosition = currentIds.size

    const insertProblem = this.db.prepare(
      `INSERT OR IGNORE INTO blind_test_set_problems (set_id, problem_id, position) VALUES (@setId, @problemId, @position)`
    )

    const transaction = this.db.transaction(() => {
      let position = startPosition
      for (const problemId of problemIds) {
        if (currentIds.has(problemId)) continue
        insertProblem.run({ setId: id, problemId, position })
        currentIds.add(problemId)
        position += 1
      }
    })

    transaction()
    return this.getSet(id)
  }

  async removeProblem(id: string, problemId: string): Promise<BlindTestSet | null> {
    this.db
      .prepare(`DELETE FROM blind_test_set_problems WHERE set_id = ? AND problem_id = ?`)
      .run(id, problemId)
    return this.getSet(id)
  }

  async deleteSet(id: string): Promise<void> {
    this.db.prepare(`DELETE FROM blind_test_sets WHERE id = ?`).run(id)
  }

  private getSetProblemIds(setId: string): string[] {
    const rows = this.db
      .prepare(
        `SELECT problem_id FROM blind_test_set_problems WHERE set_id = ? ORDER BY position ASC`
      )
      .all(setId) as { problem_id: string }[]

    return rows.map((row) => row.problem_id)
  }
}
