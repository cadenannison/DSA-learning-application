import Database from "better-sqlite3"
import { randomUUID } from "node:crypto"
import { mkdirSync } from "node:fs"
import path from "node:path"
import type { AuthStore, SessionRecord, StoredUser } from "@/server/interfaces/auth-store"
import type { BlindTestSetStore } from "@/server/interfaces/blind-test-set-store"
import type { OASessionRecord, OASessionStore } from "@/server/interfaces/oa-session-store"
import type { ProgressStore } from "@/server/interfaces/progress-store"
import type { StudyCurriculumSeed, StudyPlanStore } from "@/server/interfaces/study-plan-store"
import type {
  AttemptRecord,
  BlindTestSet,
  BlindTestSetSummary,
  MockInterviewResult,
  OASessionConfig,
  OASessionStatus,
  ProblemProgress,
  ProgressStatus,
  StudyPattern,
  StudyPatternStage,
  StudyPlanSettings,
  StudyProblem,
  StudySession,
  StudyTrack,
  ThemePreference,
  User,
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

interface StudyTrackRow {
  id: string
  name: string
  description: string
  coaching_note: string | null
}

// Shared curriculum template — same for every user, seeded once from curriculum.json.
interface StudyPatternRow {
  id: string
  track_id: string
  name: string
  priority_rank: number
  likelihood_weight: number
  concept_notes: string
  complexity_tier: string
}

// Per-user mutable state layered on top of the shared StudyPatternRow template.
interface UserStudyPatternStateRow {
  user_id: string
  study_pattern_id: string
  stage: string
  confidence: number | null
  notes: string
  ease_factor: number
  interval_days: number
  due_at: string | null
  last_reviewed_at: string | null
  review_count: number
}

interface StudyProblemRow {
  id: string
  study_pattern_id: string
  name: string
  difficulty: string
  role: string
  external_url: string | null
}

// Per-user completion state for a shared StudyProblemRow template row.
interface UserStudyProblemStateRow {
  user_id: string
  study_problem_id: string
  completed: number
  time_taken_minutes: number | null
  constraint_added_mid_solve: number | null
}

interface StudySessionRow {
  id: string
  user_id: string
  date: string
  minutes_spent: number
  study_pattern_ids: string
  sticking_point: string
  plan_for_next_session: string
}

interface MockInterviewResultRow {
  id: string
  user_id: string
  date: string
  study_problem_id: string | null
  study_pattern_id: string | null
  problem_name: string
  time_taken_minutes: number
  solved_cleanly: number
  constraint_added_mid_solve: number
  notes: string
}

interface StudyProblemExtensionRow {
  study_problem_id: string
  linked_problem_id: string | null
}

interface StudyPatternExtensionRow {
  study_pattern_id: string
  lesson_json: string | null
  bug_tracing_prompt: string | null
  bug_tracing_solution_markdown: string | null
}

interface UserRow {
  id: string
  username: string
  password_hash: string
  password_salt: string
  created_at: string
}

interface SessionRow {
  id: string
  user_id: string
  expires_at: string
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

export class SqliteProgressStore
  implements ProgressStore, OASessionStore, BlindTestSetStore, StudyPlanStore, AuthStore
{
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

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        expires_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

      -- Study Plan: study_tracks/study_patterns/study_problems are a shared curriculum
      -- template (same for every account, seeded once from curriculum.json). Per-user
      -- progress lives in user_study_pattern_state / user_study_problem_state, keyed by
      -- (user_id, *_id) — this is what lets "specific to me" and "others can create their
      -- own account" coexist without duplicating the curriculum per user.
      CREATE TABLE IF NOT EXISTS study_tracks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        coaching_note TEXT
      );

      CREATE TABLE IF NOT EXISTS study_patterns (
        id TEXT PRIMARY KEY,
        track_id TEXT NOT NULL REFERENCES study_tracks(id),
        name TEXT NOT NULL,
        priority_rank INTEGER NOT NULL,
        likelihood_weight REAL NOT NULL DEFAULT 0.5,
        concept_notes TEXT NOT NULL,
        complexity_tier TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_study_patterns_track_id ON study_patterns(track_id);

      CREATE TABLE IF NOT EXISTS study_problems (
        id TEXT PRIMARY KEY,
        study_pattern_id TEXT NOT NULL REFERENCES study_patterns(id),
        name TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        role TEXT NOT NULL,
        external_url TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_study_problems_pattern_id ON study_problems(study_pattern_id);

      CREATE TABLE IF NOT EXISTS user_study_pattern_state (
        user_id TEXT NOT NULL REFERENCES users(id),
        study_pattern_id TEXT NOT NULL REFERENCES study_patterns(id),
        stage TEXT NOT NULL DEFAULT 'not_started',
        confidence INTEGER,
        notes TEXT NOT NULL DEFAULT '',
        ease_factor REAL NOT NULL DEFAULT 2.5,
        interval_days REAL NOT NULL DEFAULT 0,
        due_at TEXT,
        last_reviewed_at TEXT,
        review_count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, study_pattern_id)
      );
      CREATE INDEX IF NOT EXISTS idx_user_study_pattern_state_user_id
        ON user_study_pattern_state(user_id);

      CREATE TABLE IF NOT EXISTS user_study_problem_state (
        user_id TEXT NOT NULL REFERENCES users(id),
        study_problem_id TEXT NOT NULL REFERENCES study_problems(id),
        completed INTEGER NOT NULL DEFAULT 0,
        time_taken_minutes INTEGER,
        constraint_added_mid_solve INTEGER,
        PRIMARY KEY (user_id, study_problem_id)
      );
      CREATE INDEX IF NOT EXISTS idx_user_study_problem_state_user_id
        ON user_study_problem_state(user_id);

      CREATE TABLE IF NOT EXISTS study_plan_settings (
        user_id TEXT PRIMARY KEY REFERENCES users(id),
        interview_date TEXT,
        daily_time_budget_minutes INTEGER NOT NULL DEFAULT 120
      );

      CREATE TABLE IF NOT EXISTS study_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        date TEXT NOT NULL,
        minutes_spent INTEGER NOT NULL,
        study_pattern_ids TEXT NOT NULL,
        sticking_point TEXT NOT NULL DEFAULT '',
        plan_for_next_session TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(date);

      CREATE TABLE IF NOT EXISTS mock_interview_results (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        date TEXT NOT NULL,
        study_problem_id TEXT,
        study_pattern_id TEXT,
        problem_name TEXT NOT NULL,
        time_taken_minutes INTEGER NOT NULL,
        solved_cleanly INTEGER NOT NULL,
        constraint_added_mid_solve INTEGER NOT NULL DEFAULT 0,
        notes TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX IF NOT EXISTS idx_mock_interview_results_user_id
        ON mock_interview_results(user_id);
      CREATE INDEX IF NOT EXISTS idx_mock_interview_results_date ON mock_interview_results(date);

      -- Extends the shared study_problems template with the (rare) linked main-library
      -- Problem id. Kept as a separate table rather than a column on study_problems so the
      -- existing study_problems schema and its ensureSeeded() INSERT are untouched.
      CREATE TABLE IF NOT EXISTS study_problem_extensions (
        study_problem_id TEXT PRIMARY KEY REFERENCES study_problems(id),
        linked_problem_id TEXT
      );

      -- Extends the shared study_patterns template with extended-lesson content. Only rows
      -- for the highest-priority patterns exist; absence of a row means no extended lesson.
      CREATE TABLE IF NOT EXISTS study_pattern_extensions (
        study_pattern_id TEXT PRIMARY KEY REFERENCES study_patterns(id),
        lesson_json TEXT,
        bug_tracing_prompt TEXT,
        bug_tracing_solution_markdown TEXT
      );

      -- Append-only log of embedded-problem study time: one row per submit (pass or fail) or
      -- per collapse-without-submitting (passed = NULL). Never updated or deleted.
      CREATE TABLE IF NOT EXISTS study_problem_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        study_problem_id TEXT NOT NULL REFERENCES study_problems(id),
        started_at TEXT NOT NULL,
        ended_at TEXT NOT NULL,
        minutes_spent INTEGER NOT NULL,
        passed INTEGER,
        source TEXT NOT NULL DEFAULT 'embedded_editor'
      );
      CREATE INDEX IF NOT EXISTS idx_study_problem_sessions_user_id
        ON study_problem_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_study_problem_sessions_problem_id
        ON study_problem_sessions(study_problem_id);
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

  // --- Study Plan ---

  /** Inserts the shared curriculum template (tracks/patterns/problems) that doesn't already
   * exist by id. Safe to call on every boot — this table holds no per-user progress, so
   * there's nothing here that re-running could clobber. Per-user state is seeded separately
   * by `ensureUserStateSeeded`, called once a user is known (on login/register). */
  async ensureSeeded(seed: StudyCurriculumSeed): Promise<void> {
    const insertTrack = this.db.prepare(
      `INSERT OR IGNORE INTO study_tracks (id, name, description, coaching_note)
       VALUES (@id, @name, @description, @coachingNote)`
    )
    const insertPattern = this.db.prepare(
      `INSERT OR IGNORE INTO study_patterns
         (id, track_id, name, priority_rank, likelihood_weight, concept_notes, complexity_tier)
       VALUES (@id, @trackId, @name, @priorityRank, @likelihoodWeight, @conceptNotes, @complexityTier)`
    )
    const insertProblem = this.db.prepare(
      `INSERT OR IGNORE INTO study_problems (id, study_pattern_id, name, difficulty, role, external_url)
       VALUES (@id, @studyPatternId, @name, @difficulty, @role, @externalUrl)`
    )
    const insertProblemExtension = this.db.prepare(
      `INSERT OR IGNORE INTO study_problem_extensions (study_problem_id, linked_problem_id)
       VALUES (@studyProblemId, @linkedProblemId)`
    )
    const insertPatternExtension = this.db.prepare(
      `INSERT OR IGNORE INTO study_pattern_extensions
         (study_pattern_id, lesson_json, bug_tracing_prompt, bug_tracing_solution_markdown)
       VALUES (@studyPatternId, @lessonJson, @bugTracingPrompt, @bugTracingSolutionMarkdown)`
    )

    const transaction = this.db.transaction(() => {
      for (const track of seed.tracks) {
        insertTrack.run({
          id: track.id,
          name: track.name,
          description: track.description,
          coachingNote: track.coachingNote,
        })
      }

      for (const pattern of seed.patterns) {
        insertPattern.run({
          id: pattern.id,
          trackId: pattern.trackId,
          name: pattern.name,
          priorityRank: pattern.priorityRank,
          likelihoodWeight: pattern.likelihoodWeight,
          conceptNotes: pattern.conceptNotes,
          complexityTier: pattern.complexityTier,
        })

        if (pattern.lesson || pattern.bugTracingExercise) {
          insertPatternExtension.run({
            studyPatternId: pattern.id,
            lessonJson: pattern.lesson ? JSON.stringify(pattern.lesson) : null,
            bugTracingPrompt: pattern.bugTracingExercise?.prompt ?? null,
            bugTracingSolutionMarkdown:
              pattern.bugTracingExercise?.solutionWalkthroughMarkdown ?? null,
          })
        }

        pattern.problems.forEach((problem, index) => {
          const id = `${pattern.id}--${index}`

          insertProblem.run({
            id,
            studyPatternId: pattern.id,
            name: problem.name,
            difficulty: problem.difficulty,
            role: problem.role,
            externalUrl: problem.externalUrl ?? null,
          })

          if (problem.linkedProblemId) {
            insertProblemExtension.run({
              studyProblemId: id,
              linkedProblemId: problem.linkedProblemId,
            })
          }
        })
      }
    })

    transaction()
  }

  /** Creates default per-user state rows (not_started, unrated, never-reviewed) for every
   * curriculum pattern/problem the given user doesn't already have a row for. Idempotent —
   * called on every login so a newly-added curriculum pattern picks up default state for
   * existing users too. */
  async ensureUserStateSeeded(userId: string): Promise<void> {
    const patternIds = (
      this.db.prepare(`SELECT id FROM study_patterns`).all() as { id: string }[]
    ).map((r) => r.id)
    const problemIds = (
      this.db.prepare(`SELECT id FROM study_problems`).all() as { id: string }[]
    ).map((r) => r.id)

    const insertPatternState = this.db.prepare(
      `INSERT OR IGNORE INTO user_study_pattern_state (user_id, study_pattern_id)
       VALUES (@userId, @studyPatternId)`
    )
    const insertProblemState = this.db.prepare(
      `INSERT OR IGNORE INTO user_study_problem_state (user_id, study_problem_id)
       VALUES (@userId, @studyProblemId)`
    )
    const insertSettings = this.db.prepare(
      `INSERT OR IGNORE INTO study_plan_settings (user_id, interview_date, daily_time_budget_minutes)
       VALUES (@userId, NULL, 120)`
    )

    const transaction = this.db.transaction(() => {
      for (const studyPatternId of patternIds) {
        insertPatternState.run({ userId, studyPatternId })
      }
      for (const studyProblemId of problemIds) {
        insertProblemState.run({ userId, studyProblemId })
      }
      insertSettings.run({ userId })
    })

    transaction()
  }

  async listTracks(): Promise<StudyTrack[]> {
    const rows = this.db.prepare(`SELECT * FROM study_tracks ORDER BY id ASC`).all() as StudyTrackRow[]
    return rows.map((row) => this.toTrack(row))
  }

  async listPatterns(userId: string): Promise<StudyPattern[]> {
    const rows = this.db
      .prepare(`SELECT * FROM study_patterns ORDER BY priority_rank ASC`)
      .all() as StudyPatternRow[]

    return rows.map((row) => this.toPattern(row, userId))
  }

  async getPattern(userId: string, id: string): Promise<StudyPattern | null> {
    const row = this.db.prepare(`SELECT * FROM study_patterns WHERE id = ?`).get(id) as
      | StudyPatternRow
      | undefined

    if (!row) return null
    return this.toPattern(row, userId)
  }

  async getProblem(userId: string, id: string): Promise<StudyProblem | null> {
    const row = this.db.prepare(`SELECT * FROM study_problems WHERE id = ?`).get(id) as
      | StudyProblemRow
      | undefined

    if (!row) return null

    const state = this.db
      .prepare(`SELECT * FROM user_study_problem_state WHERE user_id = ? AND study_problem_id = ?`)
      .get(userId, id) as UserStudyProblemStateRow | undefined

    const extension = this.db
      .prepare(`SELECT * FROM study_problem_extensions WHERE study_problem_id = ?`)
      .get(id) as StudyProblemExtensionRow | undefined

    return {
      id: row.id,
      studyPatternId: row.study_pattern_id,
      name: row.name,
      difficulty: row.difficulty as StudyProblem["difficulty"],
      role: row.role as StudyProblem["role"],
      externalUrl: row.external_url,
      completed: state?.completed === 1,
      timeTakenMinutes: state?.time_taken_minutes ?? null,
      constraintAddedMidSolve:
        state?.constraint_added_mid_solve === null || state?.constraint_added_mid_solve === undefined
          ? null
          : state.constraint_added_mid_solve === 1,
      linkedProblemId: extension?.linked_problem_id ?? null,
    }
  }

  async updatePattern(
    userId: string,
    id: string,
    update: { stage?: StudyPatternStage; confidence?: number | null; notes?: string }
  ): Promise<StudyPattern | null> {
    const existing = this.db.prepare(`SELECT id FROM study_patterns WHERE id = ?`).get(id)
    if (!existing) return null

    const sets: string[] = []
    const params: Record<string, unknown> = { userId, id }

    if (update.stage !== undefined) {
      sets.push("stage = @stage")
      params.stage = update.stage
    }
    if (update.confidence !== undefined) {
      sets.push("confidence = @confidence")
      params.confidence = update.confidence
    }
    if (update.notes !== undefined) {
      sets.push("notes = @notes")
      params.notes = update.notes
    }

    if (sets.length > 0) {
      this.db
        .prepare(
          `UPDATE user_study_pattern_state SET ${sets.join(", ")}
           WHERE user_id = @userId AND study_pattern_id = @id`
        )
        .run(params)
    }

    return this.getPattern(userId, id)
  }

  /** Applies an SM-2-lite reschedule for this user's pattern — called on every "review
   * event" (stage change, confidence rating, or a mock interview touching the pattern), never
   * on a bare page view. `qualityScore` is 0-5, mapped the usual SM-2 way: >=3 grows the
   * interval, <3 resets it (the pattern needs to resurface soon). */
  async recordPatternReview(
    userId: string,
    id: string,
    qualityScore: number
  ): Promise<StudyPattern | null> {
    const row = this.db
      .prepare(
        `SELECT * FROM user_study_pattern_state WHERE user_id = ? AND study_pattern_id = ?`
      )
      .get(userId, id) as UserStudyPatternStateRow | undefined

    if (!row) return null

    const now = new Date()
    let easeFactor = row.ease_factor
    let intervalDays: number

    if (qualityScore < 3) {
      intervalDays = 1
    } else {
      easeFactor = Math.max(
        1.3,
        easeFactor + (0.1 - (5 - qualityScore) * (0.08 + (5 - qualityScore) * 0.02))
      )
      intervalDays =
        row.review_count === 0 ? 1 : row.review_count === 1 ? 3 : row.interval_days * easeFactor
    }

    const dueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000).toISOString()

    this.db
      .prepare(
        `UPDATE user_study_pattern_state
         SET ease_factor = @easeFactor, interval_days = @intervalDays, due_at = @dueAt,
             last_reviewed_at = @lastReviewedAt, review_count = review_count + 1
         WHERE user_id = @userId AND study_pattern_id = @id`
      )
      .run({
        userId,
        id,
        easeFactor,
        intervalDays,
        dueAt,
        lastReviewedAt: now.toISOString(),
      })

    return this.getPattern(userId, id)
  }

  async updateProblem(
    userId: string,
    id: string,
    update: {
      completed?: boolean
      timeTakenMinutes?: number | null
      constraintAddedMidSolve?: boolean | null
    }
  ): Promise<StudyPattern | null> {
    const row = this.db
      .prepare(`SELECT study_pattern_id FROM study_problems WHERE id = ?`)
      .get(id) as { study_pattern_id: string } | undefined

    if (!row) return null

    const sets: string[] = []
    const params: Record<string, unknown> = { userId, id }

    if (update.completed !== undefined) {
      sets.push("completed = @completed")
      params.completed = update.completed ? 1 : 0
    }
    if (update.timeTakenMinutes !== undefined) {
      sets.push("time_taken_minutes = @timeTakenMinutes")
      params.timeTakenMinutes = update.timeTakenMinutes
    }
    if (update.constraintAddedMidSolve !== undefined) {
      sets.push("constraint_added_mid_solve = @constraintAddedMidSolve")
      params.constraintAddedMidSolve =
        update.constraintAddedMidSolve === null ? null : update.constraintAddedMidSolve ? 1 : 0
    }

    if (sets.length > 0) {
      this.db
        .prepare(
          `UPDATE user_study_problem_state SET ${sets.join(", ")}
           WHERE user_id = @userId AND study_problem_id = @id`
        )
        .run(params)
    }

    return this.getPattern(userId, row.study_pattern_id)
  }

  async getSettings(userId: string): Promise<StudyPlanSettings> {
    const row = this.db
      .prepare(`SELECT * FROM study_plan_settings WHERE user_id = ?`)
      .get(userId) as { interview_date: string | null; daily_time_budget_minutes: number }

    return {
      interviewDate: row.interview_date,
      dailyTimeBudgetMinutes: row.daily_time_budget_minutes,
    }
  }

  async updateSettings(
    userId: string,
    update: Partial<StudyPlanSettings>
  ): Promise<StudyPlanSettings> {
    const sets: string[] = []
    const params: Record<string, unknown> = { userId }

    if (update.interviewDate !== undefined) {
      sets.push("interview_date = @interviewDate")
      params.interviewDate = update.interviewDate
    }
    if (update.dailyTimeBudgetMinutes !== undefined) {
      sets.push("daily_time_budget_minutes = @dailyTimeBudgetMinutes")
      params.dailyTimeBudgetMinutes = update.dailyTimeBudgetMinutes
    }

    if (sets.length > 0) {
      this.db
        .prepare(`UPDATE study_plan_settings SET ${sets.join(", ")} WHERE user_id = @userId`)
        .run(params)
    }

    return this.getSettings(userId)
  }

  async createStudySession(
    userId: string,
    session: Omit<StudySession, "id">
  ): Promise<StudySession> {
    const id = randomUUID()

    this.db
      .prepare(
        `INSERT INTO study_sessions (id, user_id, date, minutes_spent, study_pattern_ids, sticking_point, plan_for_next_session)
         VALUES (@id, @userId, @date, @minutesSpent, @studyPatternIds, @stickingPoint, @planForNextSession)`
      )
      .run({
        id,
        userId,
        date: session.date,
        minutesSpent: session.minutesSpent,
        studyPatternIds: JSON.stringify(session.studyPatternIds),
        stickingPoint: session.stickingPoint,
        planForNextSession: session.planForNextSession,
      })

    return { id, ...session }
  }

  async listSessions(userId: string): Promise<StudySession[]> {
    const rows = this.db
      .prepare(`SELECT * FROM study_sessions WHERE user_id = ? ORDER BY date DESC`)
      .all(userId) as StudySessionRow[]

    return rows.map((row) => ({
      id: row.id,
      date: row.date,
      minutesSpent: row.minutes_spent,
      studyPatternIds: JSON.parse(row.study_pattern_ids) as string[],
      stickingPoint: row.sticking_point,
      planForNextSession: row.plan_for_next_session,
    }))
  }

  async createMockInterviewResult(
    userId: string,
    result: Omit<MockInterviewResult, "id">
  ): Promise<MockInterviewResult> {
    const id = randomUUID()

    this.db
      .prepare(
        `INSERT INTO mock_interview_results
           (id, user_id, date, study_problem_id, study_pattern_id, problem_name, time_taken_minutes, solved_cleanly, constraint_added_mid_solve, notes)
         VALUES (@id, @userId, @date, @studyProblemId, @studyPatternId, @problemName, @timeTakenMinutes, @solvedCleanly, @constraintAddedMidSolve, @notes)`
      )
      .run({
        id,
        userId,
        date: result.date,
        studyProblemId: result.studyProblemId,
        studyPatternId: result.studyPatternId,
        problemName: result.problemName,
        timeTakenMinutes: result.timeTakenMinutes,
        solvedCleanly: result.solvedCleanly ? 1 : 0,
        constraintAddedMidSolve: result.constraintAddedMidSolve ? 1 : 0,
        notes: result.notes,
      })

    return { id, ...result }
  }

  async listMockInterviewResults(userId: string): Promise<MockInterviewResult[]> {
    const rows = this.db
      .prepare(`SELECT * FROM mock_interview_results WHERE user_id = ? ORDER BY date DESC`)
      .all(userId) as MockInterviewResultRow[]

    return rows.map((row) => ({
      id: row.id,
      date: row.date,
      studyProblemId: row.study_problem_id,
      studyPatternId: row.study_pattern_id,
      problemName: row.problem_name,
      timeTakenMinutes: row.time_taken_minutes,
      solvedCleanly: row.solved_cleanly === 1,
      constraintAddedMidSolve: row.constraint_added_mid_solve === 1,
      notes: row.notes,
    }))
  }

  async recordProblemSession(
    userId: string,
    session: {
      studyProblemId: string
      startedAt: string
      endedAt: string
      minutesSpent: number
      passed: boolean | null
      source: string
    }
  ): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO study_problem_sessions
           (id, user_id, study_problem_id, started_at, ended_at, minutes_spent, passed, source)
         VALUES (@id, @userId, @studyProblemId, @startedAt, @endedAt, @minutesSpent, @passed, @source)`
      )
      .run({
        id: randomUUID(),
        userId,
        studyProblemId: session.studyProblemId,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        minutesSpent: session.minutesSpent,
        passed: session.passed === null ? null : session.passed ? 1 : 0,
        source: session.source,
      })
  }

  private toTrack(row: StudyTrackRow): StudyTrack {
    return {
      id: row.id as StudyTrack["id"],
      name: row.name,
      description: row.description,
      coachingNote: row.coaching_note,
    }
  }

  private toPattern(row: StudyPatternRow, userId: string): StudyPattern {
    const problemRows = this.db
      .prepare(`SELECT * FROM study_problems WHERE study_pattern_id = ? ORDER BY rowid ASC`)
      .all(row.id) as StudyProblemRow[]

    const problemStateRows = this.db
      .prepare(`SELECT * FROM user_study_problem_state WHERE user_id = ? AND study_problem_id IN (${problemRows.map(() => "?").join(",") || "NULL"})`)
      .all(userId, ...problemRows.map((p) => p.id)) as UserStudyProblemStateRow[]
    const problemStateById = new Map(problemStateRows.map((s) => [s.study_problem_id, s]))

    const problemExtensionRows = this.db
      .prepare(`SELECT * FROM study_problem_extensions WHERE study_problem_id IN (${problemRows.map(() => "?").join(",") || "NULL"})`)
      .all(...problemRows.map((p) => p.id)) as StudyProblemExtensionRow[]
    const linkedProblemIdById = new Map(
      problemExtensionRows.map((r) => [r.study_problem_id, r.linked_problem_id])
    )

    const patternState = this.db
      .prepare(
        `SELECT * FROM user_study_pattern_state WHERE user_id = ? AND study_pattern_id = ?`
      )
      .get(userId, row.id) as UserStudyPatternStateRow | undefined

    const patternExtension = this.db
      .prepare(`SELECT * FROM study_pattern_extensions WHERE study_pattern_id = ?`)
      .get(row.id) as StudyPatternExtensionRow | undefined

    return {
      id: row.id,
      trackId: row.track_id as StudyPattern["trackId"],
      name: row.name,
      priorityRank: row.priority_rank,
      likelihoodWeight: row.likelihood_weight,
      conceptNotes: row.concept_notes,
      complexityTier: row.complexity_tier as StudyPattern["complexityTier"],
      stage: (patternState?.stage as StudyPatternStage) ?? "not_started",
      confidence: patternState?.confidence ?? null,
      notes: patternState?.notes ?? "",
      problems: problemRows.map((problemRow) => {
        const state = problemStateById.get(problemRow.id)
        return {
          id: problemRow.id,
          studyPatternId: problemRow.study_pattern_id,
          name: problemRow.name,
          difficulty: problemRow.difficulty as StudyPattern["problems"][number]["difficulty"],
          role: problemRow.role as StudyPattern["problems"][number]["role"],
          externalUrl: problemRow.external_url,
          completed: state?.completed === 1,
          timeTakenMinutes: state?.time_taken_minutes ?? null,
          constraintAddedMidSolve:
            state?.constraint_added_mid_solve === null || state?.constraint_added_mid_solve === undefined
              ? null
              : state.constraint_added_mid_solve === 1,
          linkedProblemId: linkedProblemIdById.get(problemRow.id) ?? null,
        }
      }),
      spacedRepetition: {
        easeFactor: patternState?.ease_factor ?? 2.5,
        intervalDays: patternState?.interval_days ?? 0,
        dueAt: patternState?.due_at ?? null,
        lastReviewedAt: patternState?.last_reviewed_at ?? null,
        reviewCount: patternState?.review_count ?? 0,
      },
      hasExtendedLesson: row.track_id === "technical-interview-prep" && row.priority_rank <= 2,
      lesson: patternExtension?.lesson_json
        ? (JSON.parse(patternExtension.lesson_json) as StudyPattern["lesson"])
        : null,
      bugTracingExercise: patternExtension?.bug_tracing_prompt
        ? {
            prompt: patternExtension.bug_tracing_prompt,
            solutionWalkthroughMarkdown: patternExtension.bug_tracing_solution_markdown ?? "",
          }
        : null,
    }
  }

  // --- Auth ---

  async createUser(user: Omit<StoredUser, "id" | "createdAt">): Promise<User> {
    const id = randomUUID()
    const createdAt = new Date().toISOString()

    this.db
      .prepare(
        `INSERT INTO users (id, username, password_hash, password_salt, created_at)
         VALUES (@id, @username, @passwordHash, @passwordSalt, @createdAt)`
      )
      .run({
        id,
        username: user.username,
        passwordHash: user.passwordHash,
        passwordSalt: user.passwordSalt,
        createdAt,
      })

    return { id, username: user.username, createdAt }
  }

  async getUserByUsername(username: string): Promise<StoredUser | null> {
    const row = this.db.prepare(`SELECT * FROM users WHERE username = ?`).get(username) as
      | UserRow
      | undefined

    if (!row) return null
    return this.toStoredUser(row)
  }

  async getUserById(id: string): Promise<User | null> {
    const row = this.db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as
      | UserRow
      | undefined

    if (!row) return null
    return { id: row.id, username: row.username, createdAt: row.created_at }
  }

  async createAuthSession(session: SessionRecord): Promise<void> {
    this.db
      .prepare(`INSERT INTO sessions (id, user_id, expires_at) VALUES (@id, @userId, @expiresAt)`)
      .run({ id: session.id, userId: session.userId, expiresAt: session.expiresAt })
  }

  async getAuthSession(id: string): Promise<SessionRecord | null> {
    const row = this.db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as
      | SessionRow
      | undefined

    if (!row) return null
    return { id: row.id, userId: row.user_id, expiresAt: row.expires_at }
  }

  async deleteAuthSession(id: string): Promise<void> {
    this.db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id)
  }

  private toStoredUser(row: UserRow): StoredUser {
    return {
      id: row.id,
      username: row.username,
      createdAt: row.created_at,
      passwordHash: row.password_hash,
      passwordSalt: row.password_salt,
    }
  }
}
