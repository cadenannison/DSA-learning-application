/**
 * Structure Lab — content schema. One `Structure` per data structure (Arrays, Linked
 * Lists, Stacks, Queues, Hash Maps, Trees/BST, Heaps, Graphs-as-structure). Each owns a
 * small demo state, a set of runnable operations that mutate it, and a render function
 * that turns that state into a visualization. Mirrors the shape of ../pattern-lab/types.ts.
 */

export interface ComplexityRow {
  op: string;
  big: string;
  note: string;
}

export interface UseCase {
  title: string;
  /** May contain <b> tags (author-controlled content only). */
  body: string;
}

// ---- Demo state, one shape per structure -------------------------------

export interface Highlight {
  current?: number | string | null;
  source?: number;
  newId?: number;
  bucket?: number;
  key?: string;
  path?: (number | string)[];
  order?: Map<number | string, number>;
}

export interface ArrayDemoState {
  values: number[];
  hi: Highlight | null;
  lastNote?: string;
}

export interface ListNode {
  id: number;
  val: number;
}

export interface ListDemoState {
  nodes: ListNode[];
  nextId: number;
  hi: Highlight | null;
  lastNote?: string;
}

export interface StackDemoState {
  values: number[];
  hi: Highlight | null;
  lastNote?: string;
}

export interface QueueDemoState {
  values: number[];
  hi: Highlight | null;
  lastNote?: string;
}

export interface HashMapEntry {
  k: string;
  v: number;
}

export interface HashMapDemoState {
  buckets: HashMapEntry[][];
  hi: Highlight | null;
  lastNote?: string;
}

export interface TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

export interface TreeDemoState {
  root: TreeNode | null;
  hi: Highlight | null;
  lastNote?: string;
}

export interface HeapDemoState {
  values: number[];
  hi: Highlight | null;
  lastNote?: string;
}

export interface GraphDemoState {
  nodes: number[];
  adj: Record<number, number[]>;
  hi: Highlight | null;
  lastNote?: string;
}

export type DemoState =
  | ArrayDemoState
  | ListDemoState
  | StackDemoState
  | QueueDemoState
  | HashMapDemoState
  | TreeDemoState
  | HeapDemoState
  | GraphDemoState;

// ---- Structure: the top-level content unit ------------------------------

export interface StructureOp<S extends DemoState> {
  id: string;
  label: string;
  /** Big-O badge shown on the operation button. */
  big: string;
  /** Runs the operation against the current state and returns the next state plus an
   * explanation note. Never mutates the input state in place. */
  run: (state: S) => { next: S; note: string };
}

export interface Structure<S extends DemoState = DemoState> {
  id: string;
  label: string;
  short: string;
  /** Theme accent, e.g. '#1f6fb2'. */
  accent: string;
  accentDark: string;
  blurb: string;
  analogy: string;
  /** May contain <b> tags. */
  coreIdea: string;
  /** Optional formula/recurrence shown only for structures where one applies (e.g. heaps). */
  recurrenceGeneral?: string;
  complexity: ComplexityRow[];
  useCases: UseCase[];
  init: () => S;
  ops: StructureOp<S>[];
}
