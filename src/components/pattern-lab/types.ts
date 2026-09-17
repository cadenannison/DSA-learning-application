/**
 * Pattern Lab — content schema.
 *
 * This is the contract content authors write against. `Pattern` is the top-level
 * unit (one per DSA pattern — DP, Graphs, Backtracking, ...). Everything else
 * hangs off it. See README.md for the authoring guide and worked examples.
 */

export type Difficulty = 'simple' | 'easy' | 'medium' | 'hard';

/** The four visualizer types the Practice workbench knows how to render. */
export type VizType = 'array' | 'grid' | 'matrix' | 'nodes';

export interface CodeLine {
  /** Stable key used to match a trace step to the line it highlights. */
  k: string;
  /** The literal source text of this line (rendered verbatim, monospace). */
  t: string;
}

// ---- Trace step shapes, one per VizType --------------------------------

export interface ArrayStep {
  kind: 'array';
  line: string;
  /** One entry per array slot; null renders as an empty "unknown" cell. */
  cells: (number | null)[];
  current?: number;
  source?: number;
  note: string;
}

export interface MatrixStep {
  kind: 'matrix';
  line: string;
  /** Row-major 2D table snapshot. */
  cells: (number | null)[][];
  current?: [number, number] | null;
  /** Cells the current cell's value was read from (diagonal/up/left, etc). */
  sources?: [number, number][];
  note: string;
}

export type GridCellState =
  | 'water' | 'land' | 'visited' | 'frontier' | 'current' | 'empty' | 'fresh' | 'rotten';

export interface GridStep {
  kind: 'grid';
  line: string;
  grid: GridCellState[][];
  /** Optional running counters shown above the grid (e.g. islands found so far). */
  count?: number;
  minute?: number;
  note: string;
}

export interface NodeItem {
  id: number | string;
  /** Short label under the node id, e.g. "indeg 2", "dist 6", "root 3". */
  label: string;
  state: '' | 'current' | 'frontier' | 'done';
}

export interface NodePanel {
  label: string;
  items: { text: string; hot: boolean }[];
}

export interface NodeStep {
  kind: 'nodes';
  line: string;
  nodes: NodeItem[];
  panels: NodePanel[];
  /** Pre-formatted adjacency list, one line per node, joined with <br/>. */
  adjHtml?: string;
  note: string;
}

export type TraceStep = ArrayStep | MatrixStep | GridStep | NodeStep;

export interface Trace {
  lines: CodeLine[];
  steps: TraceStep[];
  /** Column headers for the array/matrix visualizers (indices or characters). */
  colLabels?: (string | number)[];
  /** Row headers for the matrix visualizer. */
  rowLabels?: (string | number)[];
}

// ---- Practice: one concrete problem -------------------------------------

export interface Variant {
  id: string;
  label: string;
  /** Short descriptor shown under the label, e.g. "1D · unbounded". */
  short: string;
  difficulty: Difficulty;
  /** Problem statement. May contain <b> tags for emphasis (trusted content only). */
  statement: string;
  /** The recurrence/algorithm shown above the code panel. */
  recurrence: string;
  complexity: string;
  /** One sentence: why this problem sits at this difficulty / what's new about it. */
  twist: string;
  viz: VizType;
  /**
   * Builds the trace by actually RUNNING an instrumented version of the
   * algorithm — never hand-scripted steps. See src/traceBuilders.ts for
   * the pattern to follow when authoring a new one.
   */
  trace: () => Trace;
}

// ---- Learn / Recognize: one rung of the difficulty ladder ---------------

export interface SignalExample {
  /** A short, quoted excerpt of realistic problem-statement phrasing. May contain <b>. */
  snippet: string;
  /** What that phrasing tells you, and why. May contain <b>. */
  tell: string;
}

export interface PatternLevel {
  tier: Difficulty;
  /** Short label shown under the step number in the depth stepper. */
  tag: string;

  // Learn > Concept, at this depth
  learnHeading: string;
  /** May contain <b> tags. */
  learnBody: string;
  learnFocus: string[];

  // Recognize It, at this depth
  cues: string[];
  examples: SignalExample[];
  /** Optional "don't confuse this with X" callout shown at this level only. */
  confuse?: string;
}

export interface SyntaxCard {
  title: string;
  code: string;
  note: string;
}

// ---- Pattern: the top-level content unit --------------------------------

export interface Pattern {
  id: string;
  label: string;
  short: string;
  /** Theme accent, e.g. '#6d5bd0'. Used for both light and dark (see PatternLab.css). */
  accent: string;
  accentDark: string;
  blurb: string;
  /** Abstract recurrence shape shown only at the Simple level of Learn > Concept. */
  recurrenceGeneral: string;
  /** Exactly 4 entries, aligned 1:1 with ['simple','easy','medium','hard']. */
  levels: [PatternLevel, PatternLevel, PatternLevel, PatternLevel];
  /** At least one variant per difficulty tier; ties within a tier get a sub-picker. */
  variants: Variant[];
  /** Learn > Syntax Reference cards — flat, not tiered by depth. */
  syntax: SyntaxCard[];
}
