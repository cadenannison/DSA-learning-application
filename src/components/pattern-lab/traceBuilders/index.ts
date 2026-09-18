/**
 * Trace builders — one per Practice problem, grouped by pattern.
 *
 * IMPORTANT: these are not hand-scripted animations. Each function runs a real,
 * instrumented version of the algorithm and records a `step` at every
 * meaningful moment. This is what makes the workbench trustworthy — the
 * numbers in the table/tree/grid are the numbers the algorithm actually
 * produced. See ../../README.md for the authoring checklist when adding a
 * new pattern's trace builders as their own file in this folder.
 */
export * from './dp';
export * from './graphs';
export * from './backtracking';
export * from './bfsDfs';
export * from './binarySearch';
export * from './greedy';
export * from './heaps';
export * from './intervals';
export * from './linkedList';
export * from './slidingWindow';
export * from './stacksQueues';
export * from './trees';
export * from './tries';
export * from './twoPointers';
