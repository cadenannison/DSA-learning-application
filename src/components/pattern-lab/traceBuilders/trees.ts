import type { Trace, CodeLine, NodeItem, NodeEdge, NodePanel } from '../types';

/**
 * Tree trace builders — run the real algorithm over a real tree of
 * {val, left, right} node objects, record a step at every meaningful visit.
 * See ../../README.md for the authoring checklist.
 *
 * Layout convention (shared by every variant below): classic top-down
 * binary-tree layout. Root at (x=50, y=12). Every node's horizontal slot is
 * its in-order position among the STATIC tree shape (computed once, before
 * tracing), so siblings never overlap: x = 10 + slot * (80 / (total-1||1)),
 * y = 12 + depth * 20.
 */

interface TNode {
  val: number;
  left: TNode | null;
  right: TNode | null;
}

function buildFromLevelOrder(arr: (number | null)[]): TNode | null {
  if (!arr.length || arr[0] == null) return null;
  const root: TNode = { val: arr[0], left: null, right: null };
  const queue: TNode[] = [root];
  let i = 1;
  while (i < arr.length && queue.length) {
    const node = queue.shift()!;
    if (i < arr.length) {
      const lv = arr[i++];
      if (lv != null) { node.left = { val: lv, left: null, right: null }; queue.push(node.left); }
    }
    if (i < arr.length) {
      const rv = arr[i++];
      if (rv != null) { node.right = { val: rv, left: null, right: null }; queue.push(node.right); }
    }
  }
  return root;
}

function insertBST(root: TNode | null, val: number): TNode {
  if (!root) return { val, left: null, right: null };
  if (val < root.val) root.left = insertBST(root.left, val);
  else root.right = insertBST(root.right, val);
  return root;
}

/** Computes an in-order slot (x) and depth (y) for every node, once, from the static tree shape. */
function computeLayout(root: TNode | null) {
  const pos = new Map<number, { x: number; y: number }>();
  const edges: { from: number; to: number }[] = [];
  const allVals: number[] = [];
  let total = 0;
  (function count(n: TNode | null) { if (!n) return; count(n.left); total++; count(n.right); })(root);
  let slot = 0;
  (function walk(n: TNode | null, depth: number) {
    if (!n) return;
    walk(n.left, depth + 1);
    pos.set(n.val, { x: 10 + slot * (80 / (total - 1 || 1)), y: 12 + depth * 20 });
    slot++;
    allVals.push(n.val);
    walk(n.right, depth + 1);
  })(root, 0);
  (function collectEdges(n: TNode | null) {
    if (!n) return;
    if (n.left) { edges.push({ from: n.val, to: n.left.val }); collectEdges(n.left); }
    if (n.right) { edges.push({ from: n.val, to: n.right.val }); collectEdges(n.right); }
  })(root);
  return { pos, edges, allVals };
}

const fmtBound = (n: number) => (n === -Infinity ? '-∞' : n === Infinity ? '∞' : String(n));

// ---------------------------------------------------------------------------
// 1. Binary Tree Inorder Traversal (simple)
// ---------------------------------------------------------------------------
export function treeInorderTrace(insertOrder: number[]): Trace {
  const lines: CodeLine[] = [
    { k: 'head', t: 'function inorder(node) {' },
    { k: 'base', t: '  if (!node) return;' },
    { k: 'left', t: '  inorder(node.left);' },
    { k: 'visit', t: '  result.push(node.val);' },
    { k: 'right', t: '  inorder(node.right);' },
    { k: 'end', t: '}' },
  ];
  let root: TNode | null = null;
  for (const v of insertOrder) root = insertBST(root, v);
  const { pos, edges, allVals } = computeLayout(root);

  const steps: Trace['steps'] = [];
  const result: number[] = [];
  const done = new Set<number>();

  const nodesFor = (current: number | null): NodeItem[] =>
    allVals.map((v) => {
      const p = pos.get(v)!;
      const state: NodeItem['state'] = current === v ? 'current' : done.has(v) ? 'done' : '';
      return { id: v, label: '', state, x: p.x, y: p.y };
    });
  const edgesFor = (): NodeEdge[] => edges.map((e) => ({ from: e.from, to: e.to, directed: true }));
  const panelsFor = (): NodePanel[] => [
    { label: 'visited order', items: result.map((v) => ({ text: String(v), hot: false })) },
  ];

  steps.push({ kind: 'nodes', line: 'head', nodes: nodesFor(null), edges: edgesFor(), panels: panelsFor(), note: 'Start the recursive inorder walk at the root — left subtree, then self, then right subtree.' });

  function inorder(node: TNode | null) {
    if (!node) return;
    steps.push({ kind: 'nodes', line: 'left', nodes: nodesFor(node.val), edges: edgesFor(), panels: panelsFor(), note: `Recurse into ${node.val}'s left subtree first — nothing about ${node.val} is visited yet.` });
    inorder(node.left);
    steps.push({ kind: 'nodes', line: 'visit', nodes: nodesFor(node.val), edges: edgesFor(), panels: panelsFor(), note: `${node.val}'s left subtree is fully visited → push ${node.val} to the result now.` });
    result.push(node.val);
    steps.push({ kind: 'nodes', line: 'right', nodes: nodesFor(node.val), edges: edgesFor(), panels: panelsFor(), note: `Now recurse into ${node.val}'s right subtree.` });
    inorder(node.right);
    done.add(node.val);
    steps.push({ kind: 'nodes', line: 'end', nodes: nodesFor(null), edges: edgesFor(), panels: panelsFor(), note: `${node.val}'s entire subtree (left, self, right) is done.` });
  }
  inorder(root);

  steps.push({ kind: 'nodes', line: 'end', nodes: nodesFor(null), edges: edgesFor(), panels: panelsFor(), note: `Traversal complete → inorder = [${result.join(', ')}]. For a BST, inorder always visits values in sorted order.` });
  return { lines, steps };
}

// ---------------------------------------------------------------------------
// 2. Maximum Depth of Binary Tree (easy)
// ---------------------------------------------------------------------------
export function maxDepthTrace(levelOrder: (number | null)[]): Trace {
  const lines: CodeLine[] = [
    { k: 'head', t: 'function maxDepth(node) {' },
    { k: 'base', t: '  if (!node) return 0;' },
    { k: 'left', t: '  const left = maxDepth(node.left);' },
    { k: 'right', t: '  const right = maxDepth(node.right);' },
    { k: 'ret', t: '  return 1 + Math.max(left, right);' },
    { k: 'end', t: '}' },
  ];
  const root = buildFromLevelOrder(levelOrder);
  const { pos, edges, allVals } = computeLayout(root);

  const steps: Trace['steps'] = [];
  const depthOf = new Map<number, number>();
  const done = new Set<number>();

  const nodesFor = (current: number | null): NodeItem[] =>
    allVals.map((v) => {
      const p = pos.get(v)!;
      const state: NodeItem['state'] = current === v ? 'current' : done.has(v) ? 'done' : '';
      const label = depthOf.has(v) ? `depth ${depthOf.get(v)}` : '';
      return { id: v, label, state, x: p.x, y: p.y };
    });
  const edgesFor = (): NodeEdge[] => edges.map((e) => ({ from: e.from, to: e.to, directed: true }));
  const panelsFor = (): NodePanel[] => [
    { label: 'resolved depths', items: [...depthOf.entries()].map(([v, d]) => ({ text: `${v}:${d}`, hot: false })) },
  ];

  function md(node: TNode | null): number {
    if (!node) {
      steps.push({ kind: 'nodes', line: 'base', nodes: nodesFor(null), edges: edgesFor(), panels: panelsFor(), note: 'Reached a null child → an empty subtree has depth 0.' });
      return 0;
    }
    steps.push({ kind: 'nodes', line: 'left', nodes: nodesFor(node.val), edges: edgesFor(), panels: panelsFor(), note: `Visit ${node.val} — first compute its left subtree's depth (postorder-shaped: children before self).` });
    const left = md(node.left);
    steps.push({ kind: 'nodes', line: 'right', nodes: nodesFor(node.val), edges: edgesFor(), panels: panelsFor(), note: `Left depth under ${node.val} is ${left}. Now compute its right subtree's depth.` });
    const right = md(node.right);
    const d = 1 + Math.max(left, right);
    depthOf.set(node.val, d);
    done.add(node.val);
    steps.push({ kind: 'nodes', line: 'ret', nodes: nodesFor(node.val), edges: edgesFor(), panels: panelsFor(), note: `${node.val}: 1 + max(${left}, ${right}) = ${d} → returns ${d} up to its parent.` });
    return d;
  }
  steps.push({ kind: 'nodes', line: 'head', nodes: nodesFor(null), edges: edgesFor(), panels: panelsFor(), note: 'Start at the root — depth needs both children\'s depths before it can answer for itself.' });
  const answer = md(root);

  steps.push({ kind: 'nodes', line: 'end', nodes: nodesFor(null), edges: edgesFor(), panels: panelsFor(), note: `Recursion fully unwound → maximum depth = ${answer}.` });
  return { lines, steps };
}

// ---------------------------------------------------------------------------
// 3. Binary Tree Level Order Traversal / BFS (medium)
// ---------------------------------------------------------------------------
export function levelOrderTrace(levelOrderArr: (number | null)[]): Trace {
  const lines: CodeLine[] = [
    { k: 'head', t: 'function levelOrder(root) {' },
    { k: 'init', t: '  if (!root) return [];' },
    { k: 'result', t: '  const result = [];  let queue = [root];' },
    { k: 'while', t: '  while (queue.length) {' },
    { k: 'levelinit', t: '    const level = [];  const next = [];' },
    { k: 'for', t: '    for (let i = 0, len = queue.length; i < len; i++) {' },
    { k: 'pop', t: '      const node = queue[i];  level.push(node.val);' },
    { k: 'pushkids', t: '      if (node.left) next.push(node.left);  if (node.right) next.push(node.right);' },
    { k: 'endfor', t: '    }' },
    { k: 'commit', t: '    result.push(level);  queue = next;' },
    { k: 'endwhile', t: '  }' },
    { k: 'ret', t: '  return result;' },
    { k: 'end', t: '}' },
  ];
  const root = buildFromLevelOrder(levelOrderArr);
  const { pos, edges, allVals } = computeLayout(root);

  const steps: Trace['steps'] = [];
  const done = new Set<number>();
  const levels: number[][] = [];

  const nodesFor = (current: number | null): NodeItem[] =>
    allVals.map((v) => {
      const p = pos.get(v)!;
      const state: NodeItem['state'] = current === v ? 'current' : done.has(v) ? 'done' : '';
      return { id: v, label: '', state, x: p.x, y: p.y };
    });
  const edgesFor = (): NodeEdge[] => edges.map((e) => ({ from: e.from, to: e.to, directed: true }));
  const panelsFor = (queue: TNode[]): NodePanel[] => [
    { label: 'queue', items: queue.map((n) => ({ text: String(n.val), hot: true })) },
    { label: 'levels so far', items: levels.map((l) => ({ text: `[${l.join(',')}]`, hot: false })) },
  ];

  let queue: TNode[] = root ? [root] : [];
  steps.push({ kind: 'nodes', line: 'result', nodes: nodesFor(null), edges: edgesFor(), panels: panelsFor(queue), note: 'Seed the queue with just the root — BFS explores level by level, not by recursing into children.' });

  while (queue.length) {
    const level: number[] = [];
    const next: TNode[] = [];
    steps.push({ kind: 'nodes', line: 'levelinit', nodes: nodesFor(null), edges: edgesFor(), panels: panelsFor(queue), note: `Level boundary: the ${queue.length} node(s) already in the queue are exactly this level — that's the "queue.length before the loop" trick.` });
    for (let i = 0; i < queue.length; i++) {
      const node = queue[i];
      steps.push({ kind: 'nodes', line: 'pop', nodes: nodesFor(node.val), edges: edgesFor(), panels: panelsFor(queue), note: `Take ${node.val} from the queue and add it to this level.` });
      level.push(node.val);
      if (node.left) next.push(node.left);
      if (node.right) next.push(node.right);
      done.add(node.val);
      steps.push({ kind: 'nodes', line: 'pushkids', nodes: nodesFor(node.val), edges: edgesFor(), panels: panelsFor(next), note: node.left || node.right ? `${node.val}'s children are enqueued for the next level.` : `${node.val} is a leaf — nothing to enqueue.` });
    }
    levels.push(level);
    queue = next;
    steps.push({ kind: 'nodes', line: 'commit', nodes: nodesFor(null), edges: edgesFor(), panels: panelsFor(queue), note: `Level complete → [${level.join(', ')}]. ${queue.length ? `Move on to the next level (${queue.length} node(s)).` : 'Queue is empty — BFS is done.'}` });
  }

  steps.push({ kind: 'nodes', line: 'ret', nodes: nodesFor(null), edges: edgesFor(), panels: panelsFor([]), note: `Levels = [${levels.map((l) => `[${l.join(',')}]`).join(', ')}].` });
  return { lines, steps };
}

// ---------------------------------------------------------------------------
// 4. Validate Binary Search Tree (medium/hard)
// ---------------------------------------------------------------------------
export function validateBSTTrace(levelOrderArr: (number | null)[]): Trace {
  const lines: CodeLine[] = [
    { k: 'head', t: 'function isValidBST(node, lo = -Infinity, hi = Infinity) {' },
    { k: 'base', t: '  if (!node) return true;' },
    { k: 'check', t: '  if (node.val <= lo || node.val >= hi) return false;' },
    { k: 'left', t: '  return isValidBST(node.left, lo, node.val)' },
    { k: 'right', t: '      && isValidBST(node.right, node.val, hi);' },
    { k: 'end', t: '}' },
  ];
  const root = buildFromLevelOrder(levelOrderArr);
  const { pos, edges, allVals } = computeLayout(root);

  const steps: Trace['steps'] = [];
  const done = new Set<number>();
  let violation: number | null = null;

  const nodesFor = (current: number | null): NodeItem[] =>
    allVals.map((v) => {
      const p = pos.get(v)!;
      const state: NodeItem['state'] = current === v ? 'current' : done.has(v) ? 'done' : '';
      return { id: v, label: '', state, x: p.x, y: p.y };
    });
  const edgesFor = (): NodeEdge[] => edges.map((e) => ({ from: e.from, to: e.to, directed: true }));
  const panelsFor = (lo: number, hi: number): NodePanel[] => [
    { label: 'valid range', items: [{ text: `(${fmtBound(lo)}, ${fmtBound(hi)})`, hot: false }] },
  ];

  function valid(node: TNode | null, lo: number, hi: number): boolean {
    if (!node) {
      steps.push({ kind: 'nodes', line: 'base', nodes: nodesFor(null), edges: edgesFor(), panels: panelsFor(lo, hi), note: 'Null child → an empty subtree is trivially valid.' });
      return true;
    }
    const ok = node.val > lo && node.val < hi;
    steps.push({ kind: 'nodes', line: 'check', nodes: nodesFor(node.val), edges: edgesFor(), panels: panelsFor(lo, hi), note: `${node.val} must satisfy ${fmtBound(lo)} < ${node.val} < ${fmtBound(hi)}. ${ok ? 'Inside the allowed range — continue.' : `Violated! ${node.val} breaks the bound its ancestors imposed → return false immediately.`}` });
    if (!ok) { violation = node.val; return false; }
    const leftOk = valid(node.left, lo, node.val);
    if (!leftOk) return false;
    const rightOk = valid(node.right, node.val, hi);
    if (!rightOk) return false;
    done.add(node.val);
    return true;
  }
  steps.push({ kind: 'nodes', line: 'head', nodes: nodesFor(null), edges: edgesFor(), panels: panelsFor(-Infinity, Infinity), note: 'Start at the root with an unbounded (-∞, ∞) valid range — every descendant will narrow it.' });
  const answer = valid(root, -Infinity, Infinity);

  steps.push({ kind: 'nodes', line: 'end', nodes: nodesFor(violation), edges: edgesFor(), panels: panelsFor(-Infinity, Infinity), note: answer ? 'Every node satisfied its inherited (lo, hi) range → this is a valid BST.' : `Node ${violation} violated the range passed down from its ancestors → not a valid BST.` });
  return { lines, steps };
}

// ---------------------------------------------------------------------------
// 5. Lowest Common Ancestor of a BST (hard)
// ---------------------------------------------------------------------------
export function lcaBSTTrace(levelOrderArr: (number | null)[], p: number, q: number): Trace {
  const lines: CodeLine[] = [
    { k: 'head', t: 'function lowestCommonAncestor(root, p, q) {' },
    { k: 'node', t: '  let node = root;' },
    { k: 'while', t: '  while (node) {' },
    { k: 'both-left', t: '    if (p < node.val && q < node.val) node = node.left;' },
    { k: 'both-right', t: '    else if (p > node.val && q > node.val) node = node.right;' },
    { k: 'found', t: '    else return node;   // split point = the LCA' },
    { k: 'endwhile', t: '  }' },
    { k: 'end', t: '}' },
  ];
  const root = buildFromLevelOrder(levelOrderArr);
  const { pos, edges, allVals } = computeLayout(root);

  const steps: Trace['steps'] = [];
  const path: number[] = [];
  const activeEdges = new Set<string>();

  const nodesFor = (current: number | null): NodeItem[] =>
    allVals.map((v) => {
      const p2 = pos.get(v)!;
      const state: NodeItem['state'] = current === v ? 'current' : path.includes(v) ? 'done' : '';
      return { id: v, label: v === p ? 'p' : v === q ? 'q' : '', state, x: p2.x, y: p2.y };
    });
  const edgesFor = (): NodeEdge[] => edges.map((e) => ({ from: e.from, to: e.to, directed: true, state: activeEdges.has(`${e.from}-${e.to}`) ? 'active' : '' }));
  const panelsFor = (): NodePanel[] => [
    { label: 'path', items: path.map((v) => ({ text: String(v), hot: false })) },
  ];

  steps.push({ kind: 'nodes', line: 'node', nodes: nodesFor(root ? root.val : null), edges: edgesFor(), panels: panelsFor(), note: `Start at the root, looking for the split point between p=${p} and q=${q}.` });

  let node: TNode | null = root;
  let answer: number | null = null;
  while (node) {
    path.push(node.val);
    if (p < node.val && q < node.val) {
      steps.push({ kind: 'nodes', line: 'both-left', nodes: nodesFor(node.val), edges: edgesFor(), panels: panelsFor(), note: `p=${p} and q=${q} are both < ${node.val} → both live in the left subtree — the sorted-order property lets us skip the right side entirely. Go left.` });
      if (node.left) activeEdges.add(`${node.val}-${node.left.val}`);
      node = node.left;
    } else if (p > node.val && q > node.val) {
      steps.push({ kind: 'nodes', line: 'both-right', nodes: nodesFor(node.val), edges: edgesFor(), panels: panelsFor(), note: `p=${p} and q=${q} are both > ${node.val} → both live in the right subtree. Go right.` });
      if (node.right) activeEdges.add(`${node.val}-${node.right.val}`);
      node = node.right;
    } else {
      answer = node.val;
      steps.push({ kind: 'nodes', line: 'found', nodes: nodesFor(node.val), edges: edgesFor(), panels: panelsFor(), note: `p=${p} and q=${q} split here at ${node.val} — one is ≤ and the other is ≥, so their paths diverge from this node. This is the LCA.` });
      break;
    }
  }

  steps.push({ kind: 'nodes', line: 'end', nodes: nodesFor(answer), edges: edgesFor(), panels: panelsFor(), note: `LCA(${p}, ${q}) = ${answer}.` });
  return { lines, steps };
}
