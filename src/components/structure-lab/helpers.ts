import type { TreeNode } from './types';

export function rnum(): number {
  return Math.floor(Math.random() * 89 + 10);
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const KEY_POOL = ['cat', 'dog', 'fox', 'owl', 'bee', 'ant', 'cod', 'elk', 'jay', 'ram', 'hen', 'pig'];

export function hashOf(key: string): number {
  let h = 0;
  for (const c of key) h += c.charCodeAt(0);
  return h % 8;
}

// ---------------- BST ----------------

/** Returns a new tree with `val` inserted; appends the values compared against on the way
 * down to `path` (does not mutate the input tree). */
export function bstInsert(root: TreeNode | null, val: number, path: number[]): TreeNode {
  if (!root) return { val, left: null, right: null };
  path.push(root.val);
  if (val < root.val) return { ...root, left: bstInsert(root.left, val, path) };
  if (val > root.val) return { ...root, right: bstInsert(root.right, val, path) };
  return root;
}

export function bstSearch(root: TreeNode | null, val: number, path: number[]): boolean {
  if (!root) return false;
  path.push(root.val);
  if (val === root.val) return true;
  return val < root.val ? bstSearch(root.left, val, path) : bstSearch(root.right, val, path);
}

export function bstInOrder(root: TreeNode | null, out: number[]): void {
  if (!root) return;
  bstInOrder(root.left, out);
  out.push(root.val);
  bstInOrder(root.right, out);
}

export function bstLevels(root: TreeNode | null): number[][] {
  const levels: number[][] = [];
  let queue: TreeNode[] = root ? [root] : [];
  while (queue.length) {
    levels.push(queue.map((n) => n.val));
    const next: TreeNode[] = [];
    for (const n of queue) {
      if (n.left) next.push(n.left);
      if (n.right) next.push(n.right);
    }
    queue = next;
  }
  return levels;
}

// ---------------- Heap (array-based min-heap) ----------------

export function heapLevels(values: number[]): number[][] {
  const levels: number[][] = [];
  let i = 0;
  let size = 1;
  while (i < values.length) {
    levels.push(values.slice(i, i + size));
    i += size;
    size *= 2;
  }
  return levels;
}

/** Sifts values[i] up toward the root, in place on the given array copy. Returns the number
 * of swaps performed. */
export function heapSiftUp(values: number[], i: number): number {
  let swaps = 0;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (values[p] <= values[i]) break;
    [values[p], values[i]] = [values[i], values[p]];
    swaps++;
    i = p;
  }
  return swaps;
}

/** Sifts values[i] down toward the leaves, in place on the given array copy. Returns the
 * number of swaps performed. */
export function heapSiftDown(values: number[], i: number): number {
  const n = values.length;
  let swaps = 0;
  while (true) {
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    let smallest = i;
    if (l < n && values[l] < values[smallest]) smallest = l;
    if (r < n && values[r] < values[smallest]) smallest = r;
    if (smallest === i) break;
    [values[i], values[smallest]] = [values[smallest], values[i]];
    swaps++;
    i = smallest;
  }
  return swaps;
}
