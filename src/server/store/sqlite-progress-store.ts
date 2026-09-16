import Database from "better-sqlite3"
import { randomUUID } from "node:crypto"
import { mkdirSync } from "node:fs"
import path from "node:path"
import type { ProgressStore } from "@/server/interfaces/progress-store"
import type {
  AttemptRecord,
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

export class SqliteProgressStore implements ProgressStore {
  private readonly db: Database.Database

  constructor(dbPath: string) {
    mkdirSync(path.dirname(dbPath), { recursive: true })
    this.db = new Database(dbPath)
    this.db.pragma("journal_mode = WAL")
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
}
