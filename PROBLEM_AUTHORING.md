# Problem Authoring Guide

How to add a new coding problem to this app. Read this before hand-authoring a problem JSON file — there is no admin UI or seed script; adding a problem means creating one file by hand.

## Where problems live

Every problem is a single JSON file at `src/data/problems/<id>.json`, matching the `Problem` interface in `src/server/models/domain.ts` and validated against `problemSchema` in `src/server/models/schemas.ts`. `FileProblemRepository` (`src/server/repositories/file-problem-repository.ts`) reads every `*.json` file in that directory into an in-memory array **once per server process** — it does not re-scan the directory on new requests. In dev, this means a fresh problem file only shows up after the Next.js dev server restarts (or Turbopack's module cache is otherwise invalidated); it will not appear from a plain hot-reload of an unrelated file.

The file's basename doesn't matter — the `id` field inside it is what's looked up everywhere (`/problems/<id>`, `apiClient.getProblem(id)`, `StudyProblem.linkedProblemId`). By convention the basename matches the id (`two-sum.json` → `"id": "two-sum"`).

## The `Problem` shape

```json
{
  "id": "example-problem",
  "title": "Example Problem",
  "pattern": "arrays-two-pointers",
  "difficulty": "easy",
  "companies": ["Amazon", "Google"],
  "prompt": "Full problem statement. Markdown-lite: backticks render as code, newlines are preserved (whitespace-pre-wrap).",
  "examples": [
    { "input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "optional, one sentence" }
  ],
  "constraints": [
    "2 <= nums.length <= 10^4"
  ],
  "hints": [
    "Progressively revealed hints, weakest to strongest."
  ],
  "solution": {
    "approach": "Prose walkthrough of the intended approach.",
    "code": "def example_problem(nums, target):\n    ...\n",
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(n)"
  },
  "starterCode": "def example_problem(nums, target):\n    # your code here\n    pass\n",
  "functionName": "example_problem",
  "paramNames": ["nums", "target"],
  "testCases": [
    { "input": [[2, 7, 11, 15], 9], "expected": [0, 1], "isHidden": false }
  ]
}
```

### Field notes

- **`pattern`** must be one of the `DsaPattern` enum values (`dsaPatternSchema` in `schemas.ts`) — e.g. `arrays-two-pointers`, `sliding-window`, `binary-search`, `linked-list`, `trees`, `bfs-dfs`, `heaps`, `backtracking`, `intervals`, `graphs`, `dynamic-programming`, `greedy`, `tries`, `stacks-queues`. A typo here fails schema validation, not silently drops the field.
- **`examples` vs `testCases` — these are two different things, both required:**
  - `examples` are **display-only prose** shown in the left instructions pane. They're free-text strings (`"nums = [2,7,11,15], target = 9"`), never parsed or executed.
  - `testCases` are **structured, executed** input/expected pairs. `input` is a positional array matching `functionName`'s parameters in order; `expected` is whatever the function should return. The sandbox (`PythonSubprocessSandbox` / `python_worker.py`) actually calls `functionName(*input)` and compares the result to `expected`.
  - It's normal (and expected) for `examples` and the first few `testCases` to describe the same scenarios in both forms — keep them consistent so the prose matches what's actually tested.
- **`isHidden`** (per test case): `true` hides that case's `input`/`expected`/`actual` from the results UI and from the test-case panel's tabs entirely (hidden cases never appear as a tab). Only `status` (pass/fail) and a generic "Hidden test case failed" message are shown. Use this for a couple of edge cases per problem so a submission can't be gamed by hardcoding the visible examples.
- **`paramNames`** (optional, but recommended for new problems): an array of parameter names, in the same order as each test case's `input` array — e.g. `["nums", "target"]` for `def two_sum(nums, target)`. This drives the test-case panel's labeled inputs (`nums = [2,7,11,15]`, `target = 9`), matching how LeetCode-style UIs show inputs. If omitted, the panel falls back to generic labels (`arg1`, `arg2`, …). Keep `paramNames.length` equal to every test case's `input.length` — the panel zips them positionally with no bounds checking beyond what `TestCasePanel` already guards.
- **`functionName`** must be a valid Python identifier (enforced by `identifierSchema` in `schemas.ts`) and must match the function defined in `starterCode` and `solution.code`.
- **`starterCode`** is what populates the editor on first load (and after "Reset"). It should define `functionName` with a `pass` or similar stub — never a working solution.
- **`solution`** is shown in "reveal solution" flows — write `approach` as prose a learner would want after struggling, not just a restatement of the code.

## How test cases reach the UI

The problem-solving workbench (`src/components/problem-workbench-view.tsx`) renders three resizable panes: instructions (left), code editor (top-right), and a test-case panel + results (bottom-right). The test-case panel (`src/components/test-case-panel.tsx`) reads `problem.testCases` and `problem.paramNames` directly — no separate authoring step is needed beyond getting these two fields right in the JSON. Each non-hidden test case becomes a tab ("Case 1", "Case 2", …); hidden cases are simply excluded from the tab list.

"Run tests" executes the full `testCases` array; "Run this case" (in the test-case panel) executes only the selected index via an optional `testCaseIndices` param threaded through `POST /api/execute` → `ExecutionService.execute` → the sandbox — the server resolves indices against its own `problem.testCases`, so a single-case run can't be used to inject arbitrary test data from the client.

## Linking a problem into a study plan (optional)

Problems in `src/data/problems/` are a standalone library — a problem doesn't need to be part of the study-plan curriculum to be practiced at `/problems/<id>`. To surface a problem inside a study plan's workbook, set `StudyProblem.linkedProblemId` (in `src/data/study-plan/curriculum.json`) to the new problem's `id`. That's the only link between the two systems — study-plan progress (stage, completion, timing) lives entirely in SQLite (`SqliteProgressStore`) and is keyed by the study-plan's own problem id, joined to library content only through this field.

## Checklist for a new problem

1. Pick an `id` (kebab-case, unique — check `src/data/problems/` for collisions).
2. Write `prompt`, `examples`, `constraints`, `hints` (weakest to strongest), `solution`.
3. Write `starterCode` and `functionName` — make sure they match.
4. Write `paramNames` matching `functionName`'s signature.
5. Write `testCases`: a handful of visible cases mirroring the `examples`, plus 1-2 `isHidden: true` edge cases (empty input, negative numbers, duplicates — whatever's easy to hardcode past if only the visible cases mattered).
6. Validate the JSON parses and matches `problemSchema` — easiest way today is starting the dev server and hitting `/problems/<id>`; a schema mismatch surfaces as a 500 from `/api/problems/<id>`.
7. Restart the dev server if it was already running (see the in-memory cache note above).
8. (Optional) Add `linkedProblemId` to a `StudyProblem` in `curriculum.json` to surface it in a study plan.
