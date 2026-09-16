# Architecture — DSA Practice App

Proposed. Do not scaffold from this until you approve it (per `00-agent-onboarding.md`'s deliverable order). Conventions follow `STYLE_GUIDE.md`, adapted from the SAR project docs.

## Stack

Next.js (App Router), TypeScript strict, full-stack in one app — no separate backend process. API routes replace FastAPI; a local file/SQLite-backed store replaces the DAO layer's SQLite impl. Same interface-first shape as the SAR project, fewer moving parts to boot.

## Runtime shape

```text
Browser (Next.js client components)
        |
        | typed fetch (src/lib/api-client.ts)
        v
Next.js Route Handlers (src/app/api/**)
  thin — parse, call a service, return a schema
        |
        v
Services (src/server/services/*)
  ProblemService    --> ProblemRepository   --> problem JSON/MDX files on disk
  ExecutionService  --> CodeSandbox         --> in-process VM today, swappable later
  ProgressService   --> ProgressStore       --> SQLite (better-sqlite3) today
```

```mermaid
flowchart LR
  ui[Client components] --> routes[Route Handlers]
  routes --> problemSvc[ProblemService]
  routes --> execSvc[ExecutionService]
  routes --> progressSvc[ProgressService]
  problemSvc --> problemRepo[ProblemRepository interface]
  execSvc --> sandbox[CodeSandbox interface]
  progressSvc --> progressStore[ProgressStore interface]
  problemRepo --> fsImpl[FileProblemRepository]
  sandbox --> vmImpl[NodeVmSandbox]
  progressStore --> sqliteImpl[SqliteProgressStore]
```

## Why three seams, not one

Per your brief: problem data, execution, and progress must be swappable independently (e.g. add NeetCode 150 as a second problem source, or swap the sandbox for a real container later) without touching UI. Each seam gets its own interface, its own directory, and exactly one bound implementation today.

## Layers

| Layer | Path | Allowed to know |
| --- | --- | --- |
| UI (client) | `src/app/**/*.tsx`, `src/components/` | Presenters, `ApiClient`, view types |
| Presenters | `src/presenter/` | Domain/view types only — **no React imports** |
| Route Handlers | `src/app/api/**/route.ts` | Zod schemas, services — no direct repo/store access |
| Services | `src/server/services/` | Interfaces (`ProblemRepository`, `CodeSandbox`, `ProgressStore`) |
| Repository/store interfaces | `src/server/interfaces/` | Domain types only |
| Implementations | `src/server/repositories/`, `src/server/sandbox/`, `src/server/store/` | Domain types + their own storage detail (fs, vm, sqlite) |
| Composition | `src/server/container.ts` | Concrete types — the only file allowed to `new` an implementation |

Route Handlers must not contain business logic — same rule as the SAR routes layer.

## Composition root

`src/server/container.ts`, a singleton built once per server process:

1. `FileProblemRepository(problemsDir)` — reads `src/data/problems/**`
2. `SqliteProgressStore(dbPath)` — `data/progress.db`, created on first run
3. `NodeVmSandbox()` — today's `CodeSandbox`; swappable for a container-based sandbox later
4. `ProblemService(problemRepository)`, `ExecutionService(sandbox)`, `ProgressService(progressStore)`

Route Handlers import the container, never a concrete class. Tests construct their own container with an in-memory `ProgressStore` and a temp problems dir, so they never touch `data/`.

```text
# allowed
class SqliteProgressStore implements ProgressStore { constructor(dbPath: string) {} }

# in container.ts only
const progressStore = new SqliteProgressStore(config.dbPath)

# forbidden in route handlers / services / presenters
import { SqliteProgressStore } from "@/server/store/sqlite-progress-store"
new SqliteProgressStore(...)
```

## Domain types vs wire types

Same split as SAR's D6/D7: internal domain types live in `src/server/models/domain.ts`; anything crossing the HTTP boundary is validated with a Zod schema in `src/server/models/schemas.ts`, and the client-side mirror lives in `src/types/*.ts`. Since this is TypeScript end to end, domain and wire types can share a base shape — but request/response shapes are still their own Zod-validated types, not the same object the sandbox or repository pass around internally. Convert at the route handler boundary.

JSON on the wire is camelCase. Internal domain types are also camelCase (no snake_case bridge needed in a TS-only stack) — this is a deliberate deviation from the SAR project's Python/TS casing bridge, noted here so it doesn't look like an oversight.

## Interface contracts

### ProblemRepository

```ts
interface ProblemRepository {
  getById(id: string): Promise<Problem | null>
  list(filter?: { pattern?: DsaPattern; difficulty?: Difficulty; query?: string }): Promise<ProblemSummary[]>
  listPatterns(): Promise<DsaPattern[]>
}
```

- `FileProblemRepository` today, reading structured JSON/MDX from `src/data/problems/`.
- A second source (NeetCode 150) is a second directory + a merge at this interface — no schema change, per your requirement that NeetCode 150 slot in later without a rework.

### CodeSandbox

```ts
interface CodeSandbox {
  run(submission: CodeSubmission, testCases: TestCase[]): Promise<ExecutionResult>
}
```

- `NodeVmSandbox` today — Node's `vm` module. Each test case is compiled and invoked as its own timed `vm.Script`, so a submission that returns is bounded per-case, not just at function-definition time. The whole submission (definition + all test cases) runs inside a `worker_threads` Worker, spawned per call; the parent process races the worker's result against a wall-clock deadline and calls `worker.terminate()` on timeout.
- **Why a worker, not just `vm`'s `timeout` option:** `vm.Script.runInContext(..., { timeout })` only bounds *synchronous* execution. A submission using async/await (e.g. `async function f(){ while(true){ await Promise.resolve() } } }`) returns a pending Promise almost immediately, so the timed call never trips — the promise's continuations then spin as microtasks, which also starves the host's own timer queue, so a same-thread `Promise.race` against `setTimeout` never fires either. Running the submission in a worker thread lets the parent enforce the deadline via `worker.terminate()`, a V8-isolate-level operation the starved worker can't block — this bounds wall-clock time regardless of sync busy-loops, async/microtask spins, or unconsumed generators.
- **Known limitation, not a bug:** while a *synchronous* submission is spinning inside the worker, that worker thread is fully occupied for up to `DSA_SANDBOX_TIMEOUT_MS` per test case — but the parent process's event loop is untouched, so other requests keep completing. Fine for a single local user running their own code; not a boundary for untrusted or concurrent use.
- Swap target later: a real isolate (e.g. an actual container or a hosted execution service) implementing the same interface. Nothing above this line changes.
- `ExecutionResult` reports per-test pass/fail, actual vs expected output, stdout, runtime, and a distinguished `timeout | runtime_error | wrong_answer | passed` status — never a bare boolean, so the UI can render *why* a case failed.

### ProgressStore

```ts
interface ProgressStore {
  recordAttempt(attempt: AttemptRecord): Promise<void>
  getProgress(problemId: string): Promise<ProblemProgress | null>
  listProgress(): Promise<ProblemProgress[]>
}
```

- `SqliteProgressStore` today (`better-sqlite3`, single file, no server process — matches your Docker-free, low-overhead priority).
- Schema documented in full in `CONTRACTS.md` (to be written alongside scaffolding, mirroring `04-contracts.md`'s table format) — but the key design point now: `AttemptRecord` stores one row per attempt (not an overwritten "latest state"), so mastery/spaced-repetition scheduling can later be derived from attempt history without a schema change. `ProblemProgress` is a computed view over attempts (status: `not_started | attempted | solved | mastered`, hints used, last-reviewed date), not a separately-maintained mutable row — avoids the two-writes-can-disagree bug class.

## Practice Mode vs Blind Test Mode

Both modes share `ExecutionService` and the editor/test-runner UI. They differ only in what the **presenter** is allowed to read from `Problem`:

```text
PracticePresenter   — full Problem (prompt, examples, constraints, hints[], solution, pattern, difficulty)
BlindTestPresenter   — StrippedProblem (title, prompt, examples, constraints only — no pattern, no difficulty, no hints, no solution)
```

`StrippedProblem` is a real type derived from `Problem` at the service boundary (`ProblemService.getForBlindTest(id)`), not a UI-side filter — so a bug can't leak the pattern tag into Blind Test by rendering the wrong field. This mirrors the SAR project's habit of encoding a hard rule as a type rather than a comment ("do not render X here").

## Mock OA Mode (phase 2)

Simulates a timed Google-style online assessment: a fixed-length, difficulty-driven session across multiple problems, distinct from untimed single-problem Practice/Blind Test attempts. Deferred until Practice Mode and Blind Test Mode are working end-to-end, since it reuses their editor/test-runner UI rather than building its own — that dependency is now satisfied.

**Reuses, unchanged:** `ProblemRepository`, `CodeSandbox`/`ExecutionService`, `ProgressStore`, the editor + test-runner component. Mock OA does not get its own problem data model — it is a third consumer of the same three seams, alongside Practice and Blind Test.

**Net-new:** a session/timer state model and a difficulty-driven problem selector, behind a new `OASessionManager` service — kept separate from `ProblemService`/`ExecutionService`/`ProgressService` rather than folded into them, so the three existing modes stay simple consumers of the same underlying layers.

### OASessionManager

```ts
interface OASessionManager {
  startSession(config: OASessionConfig): Promise<OASession>
  getSession(sessionId: string): Promise<OASession | null>
  saveProgress(sessionId: string, problemId: string, code: string): Promise<OASession>
  submitProblem(sessionId: string, problemId: string, submission: CodeSubmission): Promise<OASession>
  endSession(sessionId: string): Promise<OASessionSummary>
}
```

- `startSession` selects `config.problemCount` problems matching `config.difficulty` (a single `Difficulty` or a mix, e.g. `{ medium: 2, hard: 1 }`) via the selector below, and returns an `OASession` with `status: "in_progress"`, `startedAt` stamped server-side, and a `deadline` computed from `config.timeBudgetMs`.
- `saveProgress` persists in-editor code for a problem without submitting it — supports moving between problems and coming back later in the session, per the requirement that users can revisit earlier problems before time runs out.
- `submitProblem` runs the submission through the existing `CodeSandbox` (same as Practice/Blind Test) and updates that problem's status within the session; it does not end the session.
- A session auto-submits when `deadline` passes — enforced client-side by the persistent countdown timer calling `endSession`, and re-checked server-side on any call against an expired session (a late `submitProblem` against an expired session is rejected, same trust boundary as any other server-authoritative deadline).
- `endSession` finalizes the session (`status: "completed"` or `"expired"`), writes one `AttemptRecord` per attempted problem tagged `mode: "oa"` (see below) plus the session's own row in `oa_sessions` (see Persistence), and returns the post-session summary.

### Session/timer state model

```ts
export type OASessionStatus = "in_progress" | "completed" | "expired"
export type OAProblemStatus = "unanswered" | "in_progress" | "passed" | "failed"

export interface OASessionConfig {
  difficulty: Difficulty | Partial<Record<Difficulty, number>>
  problemCount: number
  timeBudgetMs: number
}

export interface OASessionProblemState {
  problemId: string
  status: OAProblemStatus
  code: string | null
  lastSubmissionResult: ExecutionResult | null
  timeSpentMs: number
}

export interface OASession {
  id: string
  status: OASessionStatus
  startedAt: string
  deadline: string
  problems: OASessionProblemState[]
  activeProblemId: string | null
}

export interface OASessionSummary {
  sessionId: string
  status: OASessionStatus
  problemsPassed: number
  problemsTotal: number
  perProblem: { problemId: string; status: OAProblemStatus; timeSpentMs: number }[]
}
```

`OASession` is the live, in-progress state a client polls/holds during the session (extends `PracticeMode` with an `"oa"` case in `AttemptRecord.mode`, rather than a parallel mode enum). `OASessionSummary` is the terminal, post-session view — a computed projection, same "don't store a redundant mutable view" rule `ProblemProgress` already follows.

### Problem selection

```ts
interface OAProblemSelector {
  selectForSession(config: OASessionConfig, recentSessionIds: string[]): Promise<ProblemSummary[]>
}
```

- Pulls candidates from the existing `ProblemRepository.list({ difficulty })` per difficulty bucket in `config.difficulty` — pattern is never part of the selection filter, so pattern tags stay hidden from the user exactly as in Blind Test Mode (`ProblemService.getForBlindTest`-style stripping applies to session problems too — the session never exposes `pattern` to the client).
- "Avoid repeating problems from recent OA sessions" is a soft preference, not a hard guarantee: filter candidates against problems used in `recentSessionIds` first, and only fall back to allowing repeats if too few unused problems exist at that difficulty (a thin library, like this one's, may not have enough per-difficulty inventory to guarantee no repeats — silently falling back beats failing to start a session).

### Persistence

One new table, following the `attempts` / `preferences` pattern already in place:

| Table | Purpose |
| --- | --- |
| `oa_sessions` | One row per session: `id`, `status`, `startedAt`, `deadline`, `config` (JSON), `problemIds` (JSON, ordered) |

Per-problem attempts within a session still write to `attempts` with `mode: "oa"` — `AttemptRecord.mode` (`src/server/models/domain.ts`) gains an `"oa"` variant alongside `"practice" | "blind"`, so OA attempts are queryable through the same table and distinguishable in history, per the requirement that OA sessions are tagged rather than indistinguishable from single-problem attempts. `OASessionSummary` is computed by joining `oa_sessions` with the matching `attempts` rows — not a separately-maintained mutable rollup, same reasoning as `ProblemProgress`.

### Out of scope for the first Mock OA pass

- Editing session config mid-session (difficulty/time budget are fixed at `startSession`)
- Cross-device session resume — a session lives for one browser session, matching the single-local-user scope already declared above
- Anti-repeat guarantee stronger than best-effort (see selector note above) — would require a much larger problem library than exists today

### Implementation notes (deviations from the draft above)

The contract above was implemented as drafted; the following are the concrete choices made where the draft deliberately left room for judgment:

- **`OASessionStore` interface** (`src/server/interfaces/oa-session-store.ts`, net-new, not in the original draft): a small persistence-facing interface — `createSession`, `getSession`, `updateStatus`, `listRecentSessionIds` — over the durable `oa_sessions` row shape (`id`, `status`, `startedAt`, `deadline`, `config`, `problemIds`). `SqliteProgressStore` implements both `ProgressStore` and `OASessionStore` against the same `data/progress.db` connection (one new `CREATE TABLE IF NOT EXISTS oa_sessions` in its existing `migrate()`), rather than a separate store class — it already owns the one DB file, and `oa_sessions` follows the same `attempts`/`preferences` migration convention in place. `container.ts` still only constructs one `SqliteProgressStore` and passes it wherever either interface is needed.
- **Live session state is in-memory, not fully persisted.** `OASessionService` (`src/server/services/oa-session-service.ts`) holds the live `OASession` (per-problem `code`, `lastSubmissionResult`, `timeSpentMs`, `activeProblemId`) in a `Map` for the process lifetime; only the durable summary shape (id/status/startedAt/deadline/config/problemIds) is written to `oa_sessions`. This satisfies the documented "one browser session, no cross-device resume" scope, but also means a dev-server restart mid-session loses in-progress code/results for that session (the row in `oa_sessions` still exists and is queryable, so it still feeds the selector's repeat-avoidance and history — just not live resume). If this needs to survive a restart later, `OASessionProblemState` would need its own persisted rows; not built now since it's explicitly out of scope.
- **`timeSpentMs` is accrued server-side**, not self-reported by the client: `OASessionService` tracks a last-touched timestamp per `(sessionId, problemId)` and adds the wall-clock delta (capped at 10 minutes per touch, to avoid inflating the figure if a tab sits idle) on every `saveProgress`/`submitProblem` call. This keeps the number out of the client's hands without adding a new endpoint.
- **Hidden test case stripping is shared, not duplicated.** The `/api/execute` route already stripped `input`/`expected`/`actual` off hidden `TestCaseResult`s before responding; that logic was extracted into `toClientExecutionResult` (`src/server/services/execution-result-view.ts`) so `OASessionService.submitProblem` applies the identical stripping before storing `lastSubmissionResult` on the session — otherwise a session fetch after submission would have leaked hidden-case answers that Practice/Blind Test already hide.
- **Problem content delivered to the OA client reuses the Blind Test route**, not a new "OA problem" endpoint: `OASession`/`OASessionProblemState` only ever carry `problemId` + session-local state (never `pattern`, `difficulty`, `title`, `prompt`, etc. — enforced by `oaSessionSchema`'s `.strict()`), and the in-session page fetches display content via the existing `GET /api/blind/[id]` (`StrippedProblem` — no pattern/difficulty/hints/solution). This is exactly the reuse the draft called for ("`ProblemService.getForBlindTest`-style stripping applies to session problems too") without adding a fourth problem-shaping path.

## Progress surfaced in the library view

`ProblemSummary` (list view) includes `progressStatus` computed by `ProgressService`, joined in the route handler — the library route handler calls both `ProblemService.list()` and `ProgressService.listProgress()` and merges by id. This keeps `ProblemRepository` ignorant of progress entirely (per the "allowed to know" table), so swapping either seam independently stays possible.

## Frontend MVP (same as SAR D9)

```text
page.tsx (View implementation, holds React state)
    --> LibraryPresenter / PracticePresenter / BlindTestPresenter (no React)
          --> ApiClient
                --> GET /api/problems, GET /api/problems/:id, POST /api/execute, POST /api/progress
```

Presenters are unit-testable without mounting a component. Monaco (or CodeMirror) editor is a client component; if it needs `next/dynamic` with `ssr:false` that's decided at scaffold time based on which editor library is chosen.

### Shared layout / sidebar nav

`src/app/layout.tsx` renders a persistent left sidebar (`src/components/sidebar-nav.tsx`, a client component using `usePathname()` to highlight the active section) alongside `{children}`, rather than each route owning its own top-level chrome. Sections: **Library** (`/`, covers both Practice and Blind Test entry), **Mock OA** (`/oa`), and **Learning Patterns** (`/patterns` — reserved nav slot + a "coming soon" page only; no pattern-learning content is built here). The existing `ThemeToggle` now lives in the sidebar; individual pages that previously rendered their own toggle inline still do (harmless duplication, not removed, to avoid touching Practice/Blind Test page internals beyond the layout wrap).

## Persistence

SQLite (`data/progress.db`) via `better-sqlite3` for progress only — problems are static files, not database rows, since they're authored/seeded content, not user data. This deliberately does not use SAR's "metadata in DB / binaries on disk" split, because there are no binaries here; noting the deviation rather than cargo-culting the pattern.

| Table | Purpose |
| --- | --- |
| `attempts` | One row per run: `problemId`, `timestamp`, `passed`, `hintsUsed`, `durationMs`, `mode` (`practice` \| `blind` \| `oa`) |
| `preferences` | Single-row table: `theme` (`light` \| `dark`), persisted across sessions |

`ProblemProgress` (status, last-reviewed, hints-used-ever) is computed from `attempts` on read — never stored directly — so spaced-repetition scheduling is an additional computed view later, not a migration.

## Config

| Env | Default | Meaning |
| --- | --- | --- |
| `DSA_DB_PATH` | `data/progress.db` | SQLite file |
| `DSA_PROBLEMS_DIR` | `src/data/problems` | Problem source root |
| `DSA_SANDBOX_TIMEOUT_MS` | `5000` | Per-test-case execution timeout |

## What's out of scope for the first pass

Following the SAR project's `06-out-of-scope.md` convention — stated so it reads as a decision, not a gap:

- Spaced-repetition scheduling itself (data model supports it; the scheduler is not built now)
- Multi-user auth/accounts — single local user, no login
- A real sandboxed container/VM for code execution — Node's `vm` module only, good enough for JS/TS submissions; not a security boundary for untrusted multi-tenant use
- NeetCode 150 seed data — schema supports it, data comes later
- OpenAPI/codegen between server and client — hand-mirrored types, same call as SAR's D6, revisit only if drift becomes painful

## Swapping infrastructure later

| Interface | Today | Later |
| --- | --- | --- |
| `ProblemRepository` | `FileProblemRepository` | `HttpProblemRepository` (hosted problem source), multi-source merge |
| `CodeSandbox` | `NodeVmSandbox` | Real isolate / hosted execution service |
| `ProgressStore` | `SqliteProgressStore` | Swap file for a hosted DB if this ever becomes multi-device |

Add one implementation + one line in `container.ts`. No service or route handler changes.

## Proposed folder structure

```text
src/
  app/
    page.tsx                      # library view
    problems/[id]/page.tsx        # practice mode
    blind/[id]/page.tsx           # blind test mode
    api/
      problems/route.ts
      problems/[id]/route.ts
      execute/route.ts
      progress/route.ts
  components/                     # dumb UI, editor wrapper, filter bar, etc.
  presenter/                      # React-free view logic
  server/
    container.ts
    interfaces/
      problem-repository.ts
      code-sandbox.ts
      progress-store.ts
    services/
      problem-service.ts
      execution-service.ts
      progress-service.ts
    repositories/
      file-problem-repository.ts
    sandbox/
      node-vm-sandbox.ts
    store/
      sqlite-progress-store.ts
    models/
      domain.ts
      schemas.ts
  types/                          # client-side mirrors
  lib/
    api-client.ts
  data/
    problems/                     # seed content, one file per problem
data/
  progress.db                     # gitignored
```

## Decisions confirmed

1. **Editor:** CodeMirror. Lighter bundle, faster to stand up than Monaco — fits the limited-time constraint. Loaded as a client component; no SSR concerns since it's a leaf UI component, not a map-style library needing `next/dynamic`.
2. **Seed data:** Claude authors original prompt/example/constraint/hint/solution text per Blind 75 problem — not copied verbatim from LeetCode or any single source. Content is generated to be reviewed and edited by you, same as any other scaffolded file.
3. **Hint tracking:** locked in. Revealing any hint during an attempt permanently sets `hintsUsed > 0` (and records how many) for that `AttemptRecord`, regardless of whether the user later solves it without referring back. Matches real interview honesty — once you've seen a hint, the attempt isn't "cold" anymore. This requires no schema change from what's above: `attempts.hintsUsed` is written once per attempt at submission time, sourced from a running counter the presenter increments on each reveal and never decrements.
