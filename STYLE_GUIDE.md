# Style guide (extracted from the SAR project docs)

Source: `00-agent-onboarding.md` through `07-frontend-data-map.md` in this repo. These are planning/architecture docs, not code, so everything below is inferred from how you write and structure specs — not from a codebase I could grep. Flagging that up front since it's a thinner signal than reading actual source files would give.

One gap: several docs point to a root-level `AGENTS.md` for "DI, factories, MVP, logging" conventions, but that file isn't present anywhere in this filesystem. I've reconstructed what I can from references to it, but I haven't seen it directly — call this out if you have a copy elsewhere.

## Documentation structure & naming

- **Numbered prefixes on planning docs** (`00-`, `01-`, ... `07-`) that encode *read order*, not just topic. The number is load-bearing — it tells a new contributor/agent what to read first.
- **One doc, one concern.** Decisions, architecture, inventory, contracts, ownership, scope, and frontend-mapping are physically separate files rather than sections of one giant doc. Each has a one-line "read when" trigger listed in an index (`00-agent-onboarding.md`'s table).
- **Kebab-case filenames**, lowercase, descriptive nouns (`whats-built`, `wbs-ownership`, `out-of-scope`), not abbreviations you'd have to decode.
- Docs cross-reference each other constantly with relative markdown links (`[04-contracts.md](04-contracts.md)`), and code references link to actual files (`[backend/main.py](../../backend/main.py)`). Nothing is described without a path to go verify it.

## Decision records (01-decisions.md pattern)

Every decision follows the same skeleton, and you don't skip parts even when they seem obvious:

- **Decision:** — the rule, stated as an imperative or a fact, not a suggestion.
- **Why:** — the actual reasoning, often including *what was tried and failed* (see D17: the synthetic DEM was rejected because it made a working router indistinguishable from a broken one; D20: routing past the LZ inflated `estimatedMinutes` from 37 to 67 min).
- **Rejected:** — alternatives considered and why they lost. This is treated as important enough to keep permanently, not just discuss once.
- **Consequences:** — second-order effects, especially "this field/enum stays even though it looks unused now, because X."
- **Later:** — the explicitly deferred version, so nobody re-litigates scope creep.

This is a strong, consistent convention: **decisions carry their own rejected alternatives and reasoning, forever**, so future-you (or an agent) doesn't silently reverse something that was already tried.

## "What's built" honesty convention

`03-whats-built.md` draws a hard, explicit line: **Real (use it)** vs **Stubbed (fallback only)** vs **Placeholders (UI only)** vs **Not in the repo**. Nothing is implied to be more finished than it is. Stub fallback conditions are stated precisely ("`SAR_YOLO_ENABLED=false` or ultralytics missing"), not just "if unavailable."

This matters for the new project: progress-tracking / mastery status should probably get the same explicit-state treatment (e.g., a problem's "solved" badge should never be ambiguous about whether it means "passed once" vs "passed and hints unused").

## Contracts (04-contracts.md pattern)

- **Snake_case in the backend/domain layer, camelCase on the wire, one bridging mechanism** (Pydantic alias generator) — not two schema languages, not manual per-field mapping scattered everywhere.
- **Domain objects and HTTP schemas are different types**, converted at the boundary (`to_domain`/`from_domain`). Business logic never imports the HTTP framework's types.
- Every entity is documented as a **table**: JSON field name, domain field name (if different), and a one-line note — units, ranges, nullability semantics, and *what null means* when it's not just "absent" (canopyFraction: null means unknown, not measured-zero — called out explicitly and defended with a test-shaped invariant).
- **"If you add a field" is stated as a checklist** inline in the doc (update domain.py, schemas.py, the TS mirror, the SQLite mapping — same PR). Contract changes are never partial.
- Enums are listed in one small table up top, values only, no elaboration needed.
- Non-obvious invariants get their own numbered list at the end of a doc (`04-contracts.md`'s `legs[]` partitioning rule, `07-frontend-data-map.md` §6) — these are the kind of thing that "silently goes wrong" if broken, and you flag that explicitly rather than trusting a reader to infer it.

## Architecture doc pattern

- Starts with a **plain-text ASCII pipeline diagram** before the mermaid version — the text version is skimmable in a terminal/PR diff, mermaid is for rendering. Both say the same thing.
- **Layers table**: path → "allowed to know." This is an explicit dependency-direction contract (e.g., HTTP layer knows about schemas and services; it must never know about SQLite directly).
- **Composition root is named and singular** (`backend/main.py`) — exactly one place binds interfaces to concrete implementations. Everywhere else takes interfaces via constructor injection.
- A **"swapping infrastructure later" table** at the end: interface → current impl → future impl, with an explicit "do not change X" note. This is where the interface-boundary intent gets tested — if swapping the impl would require touching callers, the abstraction is wrong.
- Config documented as a table: env var, default, meaning — not prose.

## Ownership (05-wbs-ownership.md pattern)

- Work is split by **owned files/interfaces**, not by feature name alone. Each owner gets a "Do not" line (what NOT to touch or implement) as often as a "goal" line.
- A **shared / do not "own away"** section lists files everyone can touch but nobody unilaterally redesigns (contracts, DAO interfaces, composition root).
- Ends with a tiny **allowed/forbidden code snippet** showing the exact shape of correct dependency injection vs. the anti-pattern (constructing a concrete class outside the composition root). Short, concrete, unambiguous — not prose describing DI in the abstract.

## Scope control (06-out-of-scope.md pattern)

- Explicitly split into **"Not for the talk"** (hard no for this milestone), **"Still later"** (deferred, not rejected), **"Platform"** (infra-level exclusions), and **"Process anti-patterns"** (behavioral things to avoid, like a second job queue or silent `except: pass`).
- This is a real, actively-consulted doc — decisions reference it (D1 points here), and it's read as a gate before adding anything "while you're here."

## Frontend/backend seam doc (07-frontend-data-map.md pattern)

- Written explicitly **"for" a named audience** ("anyone building backend for X") — the doc states its own reader up front.
- Distinguishes **already-implemented** vs **not-implemented-yet** endpoints, and for not-yet-built ones, specifies exact request/response shape so backend work can proceed without asking.
- A **field-by-field capture table**: UI control → page → type → where it goes today → where it *should* go. This tracks temporary state (e.g., browser-local overrides) against its eventual real home, so migration isn't a mystery later.
- A **"read by nothing" section** — fields that exist in the contract but nothing displays, called out so nobody wastes effort polishing them.
- A **conformance status** section at the end, stating a literal diff result between backend schema and frontend types ("24 types and enums compared, no divergence") — contracts are treated as things you can and do verify mechanically, not just trust.

## Tone and voice

- Imperative, terse, high information density. Sentences drop filler words ("Do not invent types" not "please try to avoid inventing new types").
- Rules are numbered and stated as hard constraints ("Never," "Do not," "Must") when they're load-bearing, with the reasoning given once and not repeated.
- Tables over prose whenever there's more than 2 parallel facts to convey.
- No marketing language, no hedging. When something is a real limitation (e.g., LZ approach clearance doesn't model trees/wires), it's stated flatly rather than caveated softly.
- Comments in the doc-about-code sense are reasoning-dense but code-comment-sparse: the docs carry the "why," implying actual code comments should be rare and reserved for the same kind of non-obvious constraint (per the referenced AGENTS.md: "no narration comments").

## Architectural patterns worth carrying into the DSA app

These are the structural habits, independent of the SAR domain, that seem worth reusing:

1. **Interfaces over concrete types at every seam you might swap later** — here that's DAO/ArtifactStore/CvPipeline/GisRouter; in the DSA app it'd be problem-data source, code-execution sandbox, and progress store, exactly as your project brief already asks for.
2. **One composition root.** Wherever interfaces get bound to real implementations, that binding happens in exactly one file/function.
3. **MVP-style presenters with no framework imports**, so core logic is unit-testable without mounting UI.
4. **Domain type vs. wire type separation**, converted at the boundary, with a single casing convention per side and one bridging mechanism.
5. **A living "what's built" doc** distinguishing real / stub / placeholder — directly reusable for tracking progress-tracking-store vs. code-execution-engine vs. UI as they come online.
6. **Decisions recorded with rejected alternatives**, not just the chosen path — cheap insurance against re-litigating settled tradeoffs.
7. **Explicit null semantics** wherever "null" could be mistaken for a measured/default value.

## Open question for you

Given there's no actual source code (Python/TS/React files) in either this repo or referenced elsewhere on disk, I have nothing to extract for: formatting details (indent width, quote style), specific naming casing inside code (beyond what contracts imply), test file organization/naming, or component-file internal structure. If you have the actual SAR codebase (or another repo with real source), pointing me at it would let me tighten those specifics before I draft `ARCHITECTURE.md` for the new project. Otherwise I'll proceed on the conventions above plus sensible defaults for a TypeScript/React + lightweight backend stack.
