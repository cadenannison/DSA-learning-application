import type { Trace, CodeLine, NodeItem, NodeEdge, NodePanel } from '../types';

/**
 * Linked List trace builders — run the real algorithm, record a step at
 * every meaningful pointer change. See ../../README.md for the authoring
 * checklist.
 *
 * Layout convention used throughout this file: each list is laid out as a
 * horizontal chain, y ≈ 50 (or 30/70 for a two-row two-list problem), x
 * spaced evenly left to right, with directed edges labeled "next" drawn
 * from the actual `.next` pointer of a real node object — never a canned
 * position. When a list is restructured, every step recomputes edges from
 * whatever the node objects' `.next` pointers actually are at that moment.
 */

// ---- shared node object shape ------------------------------------------

interface LLNode {
  id: string;
  val: number | string;
  next: LLNode | null;
  x: number;
  y: number;
}

function edgesFromNodes(nodes: LLNode[], extra: NodeEdge[] = []): NodeEdge[] {
  const out: NodeEdge[] = [];
  for (const n of nodes) {
    if (n.next) out.push({ from: n.id, to: n.next.id, label: 'next', state: 'active', directed: true });
  }
  return out.concat(extra);
}

function itemsFromNodes(nodes: LLNode[], states: Record<string, NodeItem['state']>): NodeItem[] {
  return nodes.map((n) => ({ id: n.id, label: String(n.val), state: states[n.id] ?? '', x: n.x, y: n.y }));
}

// ---- 1. Reverse Linked List (simple) ------------------------------------

export function reverseListTrace(values: number[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function reverseList(head) {' },
    { k: 'prev', t: '  let prev = null;' },
    { k: 'curr', t: '  let curr = head;' },
    { k: 'loop', t: '  while (curr) {' },
    { k: 'save', t: '    const next = curr.next;   // save it before we overwrite curr.next' },
    { k: 'flip', t: '    curr.next = prev;' },
    { k: 'advprev', t: '    prev = curr;' },
    { k: 'advcurr', t: '    curr = next;' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return prev;   // prev is the new head' },
    { k: 'end', t: '}' },
  ];

  const n = values.length;
  const spacing = 80 / Math.max(1, n - 1);
  const nodes: LLNode[] = values.map((v, i) => ({ id: String(v), val: v, next: null, x: 10 + i * spacing, y: 50 }));
  for (let i = 0; i < n - 1; i++) nodes[i].next = nodes[i + 1];

  const steps: Trace['steps'] = [];
  const snap = (currId: string | null, prevId: string | null, note: string, line: string) => {
    const states: Record<string, NodeItem['state']> = {};
    if (prevId) states[prevId] = 'done';
    if (currId) states[currId] = 'current';
    steps.push({
      kind: 'nodes',
      line,
      nodes: itemsFromNodes(nodes, states),
      panels: [{ label: 'prev / curr', items: [{ text: `prev: ${prevId ?? 'null'}`, hot: false }, { text: `curr: ${currId ?? 'null'}`, hot: true }] }],
      edges: edgesFromNodes(nodes),
      note,
    });
  };

  let prev: LLNode | null = null;
  let curr: LLNode | null = nodes[0] ?? null;
  snap(curr?.id ?? null, null, `Start with prev = null and curr = head (${curr?.val}). The chain still points forward.`, 'curr');
  while (curr) {
    const next: LLNode | null = curr.next;
    curr.next = prev;
    snap(curr.id, prev?.id ?? null, `Reversed curr(${curr.val}).next to point at prev(${prev ? prev.val : 'null'}) — one link flips at a time.`, 'flip');
    prev = curr;
    curr = next;
    if (curr) snap(curr.id, prev.id, `Advance: prev = ${prev.val}, curr = ${curr.val}.`, 'advcurr');
  }
  const order: (number | string)[] = [];
  let walk = prev;
  while (walk) { order.push(walk.val); walk = walk.next; }
  steps.push({
    kind: 'nodes',
    line: 'ret',
    nodes: itemsFromNodes(nodes, Object.fromEntries(nodes.map((nd) => [nd.id, 'done' as const]))),
    panels: [{ label: 'result', items: order.map((v) => ({ text: String(v), hot: false })) }],
    edges: edgesFromNodes(nodes),
    note: `curr is null → loop ends. prev is the new head → [${order.join(' → ')}].`,
  });
  return { lines, steps };
}

// ---- 2. Merge Two Sorted Lists (easy) -----------------------------------

export function mergeTwoListsTrace(a: number[], b: number[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function mergeTwoLists(a, b) {' },
    { k: 'dummy', t: '  const dummy = { next: null };  let tail = dummy;' },
    { k: 'loop', t: '  while (a && b) {' },
    { k: 'cmp', t: '    if (a.val <= b.val) { tail.next = a; a = a.next; }' },
    { k: 'cmpelse', t: '    else { tail.next = b; b = b.next; }' },
    { k: 'advtail', t: '    tail = tail.next;' },
    { k: 'endloop', t: '  }' },
    { k: 'rest', t: '  tail.next = a || b;   // splice in whatever\'s left' },
    { k: 'ret', t: '  return dummy.next;' },
    { k: 'end', t: '}' },
  ];

  const aSpacing = 80 / Math.max(1, a.length - 1);
  const bSpacing = 80 / Math.max(1, b.length - 1);
  const aNodes: LLNode[] = a.map((v, i) => ({ id: `a${i}`, val: v, next: null, x: 10 + i * aSpacing, y: 30 }));
  const bNodes: LLNode[] = b.map((v, i) => ({ id: `b${i}`, val: v, next: null, x: 10 + i * bSpacing, y: 70 }));
  for (let i = 0; i < aNodes.length - 1; i++) aNodes[i].next = aNodes[i + 1];
  for (let i = 0; i < bNodes.length - 1; i++) bNodes[i].next = bNodes[i + 1];
  const all = [...aNodes, ...bNodes];

  const steps: Trace['steps'] = [];
  const merged: LLNode[] = [];
  const snap = (line: string, note: string, current: LLNode[] = []) => {
    const states: Record<string, NodeItem['state']> = {};
    for (const m of merged) states[m.id] = 'done';
    for (const c of current) states[c.id] = 'current';
    steps.push({
      kind: 'nodes',
      line,
      nodes: itemsFromNodes(all, states),
      panels: [{ label: 'merged so far', items: merged.map((m) => ({ text: String(m.val), hot: false })) }],
      edges: edgesFromNodes(all),
      note,
    });
  };

  snap('dummy', 'Two sorted lists laid out on their own rows — list A on top, list B below. A dummy head starts the merged chain (not drawn).', []);

  let ap: LLNode | null = aNodes[0] ?? null;
  let bp: LLNode | null = bNodes[0] ?? null;
  let tail: LLNode | null = null; // last node placed into the merged chain
  while (ap && bp) {
    snap('cmp', `Compare a(${ap.val}) vs b(${bp.val}).`, [ap, bp]);
    let chosen: LLNode;
    if (ap.val <= bp.val) { chosen = ap; ap = ap.next; } else { chosen = bp; bp = bp.next; }
    if (tail) tail.next = chosen; // real pointer surgery — may sever the node's own original list link
    tail = chosen;
    merged.push(chosen);
    snap('advtail', `${chosen.val} is the smaller/equal candidate → it becomes the next node in the merged chain.`, [chosen]);
  }
  const rest = ap || bp;
  if (tail) tail.next = rest;
  const restVals: (number | string)[] = [];
  let walk = rest;
  while (walk) { merged.push(walk); restVals.push(walk.val); walk = walk.next; }
  snap('rest', restVals.length ? `One list is exhausted → splice the remaining [${restVals.join(', ')}] onto the tail as-is (already sorted, nothing left to compare).` : 'Both lists ended at exactly the same time — nothing left to splice.');

  const order = merged.map((m) => m.val);
  steps.push({
    kind: 'nodes',
    line: 'ret',
    nodes: itemsFromNodes(all, Object.fromEntries(all.map((nd) => [nd.id, 'done' as const]))),
    panels: [{ label: 'merged result', items: order.map((v) => ({ text: String(v), hot: false })) }],
    edges: edgesFromNodes(all),
    note: `Merged list: [${order.join(', ')}].`,
  });
  return { lines, steps };
}

// ---- 3. Detect Cycle / Floyd's Tortoise and Hare (medium) ---------------

export function hasCycleTrace(values: number[], cycleEntryIndex: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function hasCycle(head) {' },
    { k: 'ptrs', t: '  let slow = head, fast = head;' },
    { k: 'loop', t: '  while (fast && fast.next) {' },
    { k: 'moveslow', t: '    slow = slow.next;' },
    { k: 'movefast', t: '    fast = fast.next.next;' },
    { k: 'check', t: '    if (slow === fast) return true;' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return false;' },
    { k: 'end', t: '}' },
  ];

  // Lollipop layout: stem node(s) straight, loop nodes arranged in a small circle.
  const stemCount = cycleEntryIndex; // nodes before the cycle entry
  const loopCount = values.length - cycleEntryIndex;
  const nodes: LLNode[] = [];
  for (let i = 0; i < stemCount; i++) nodes.push({ id: String(i), val: values[i], next: null, x: 8 + i * 15, y: 50 });
  const loopCx = 8 + stemCount * 15 + 20, loopCy = 50, loopR = 22;
  for (let i = 0; i < loopCount; i++) {
    const angle = (2 * Math.PI * i) / loopCount - Math.PI / 2;
    const idx = stemCount + i;
    nodes.push({
      id: String(idx),
      val: values[idx],
      next: null,
      x: loopCx + loopR * Math.cos(angle),
      y: loopCy + loopR * Math.sin(angle) * 0.9,
    });
  }
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].next = nodes[i + 1];
  nodes[nodes.length - 1].next = nodes[cycleEntryIndex]; // back-edge closes the loop

  const steps: Trace['steps'] = [];
  const snap = (slow: LLNode, fast: LLNode, line: string, note: string) => {
    const states: Record<string, NodeItem['state']> = {};
    states[slow.id] = 'current';
    if (fast.id !== slow.id) states[fast.id] = states[fast.id] ? states[fast.id] : 'frontier';
    steps.push({
      kind: 'nodes',
      line,
      nodes: itemsFromNodes(nodes, states),
      panels: [{ label: 'pointers', items: [{ text: `slow → ${slow.val}`, hot: true }, { text: `fast → ${fast.val}`, hot: true }] }],
      edges: edgesFromNodes(nodes, [{ from: nodes[nodes.length - 1].id, to: nodes[cycleEntryIndex].id, label: 'next', state: 'active', directed: true }]),
      note,
    });
  };

  let slow = nodes[0], fast = nodes[0];
  snap(slow, fast, 'ptrs', `Both pointers start at the head (${slow.val}). The tail (${nodes[nodes.length - 1].val}) loops back to ${nodes[cycleEntryIndex].val} instead of ending in null.`);
  let found = false;
  while (fast && fast.next) {
    slow = slow.next!;
    fast = fast.next.next!;
    if (slow === fast) { found = true; snap(slow, fast, 'check', `slow (${slow.val}) and fast (${fast.val}) landed on the same node → they met inside the loop → a cycle exists.`); break; }
    snap(slow, fast, 'movefast', `slow moves 1 hop to ${slow.val}; fast moves 2 hops to ${fast.val}. Not equal yet — keep going.`);
  }
  steps.push({
    kind: 'nodes',
    line: 'ret',
    nodes: itemsFromNodes(nodes, { [slow.id]: 'done', [fast.id]: 'done' }),
    panels: [{ label: 'result', items: [{ text: `hasCycle = ${found}`, hot: true }] }],
    edges: edgesFromNodes(nodes, [{ from: nodes[nodes.length - 1].id, to: nodes[cycleEntryIndex].id, label: 'next', state: 'active', directed: true }]),
    note: found ? 'The fast pointer lapped the slow pointer inside the loop → return true. (If the list were acyclic, fast would hit null first.)' : 'fast reached null without ever meeting slow → return false.',
  });
  return { lines, steps };
}

// ---- 4. Remove Nth Node From End of List (medium/hard) ------------------

export function removeNthFromEndTrace(values: number[], n: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function removeNthFromEnd(head, n) {' },
    { k: 'dummy', t: '  const dummy = { next: head };  let lead = dummy, trail = dummy;' },
    { k: 'gap', t: '  for (let i = 0; i <= n; i++) lead = lead.next;   // open an (n+1)-gap' },
    { k: 'loop', t: '  while (lead) { lead = lead.next; trail = trail.next; }' },
    { k: 'remove', t: '  trail.next = trail.next.next;   // trail sits right before the target' },
    { k: 'ret', t: '  return dummy.next;' },
    { k: 'end', t: '}' },
  ];

  const spacing = 80 / Math.max(1, values.length - 1);
  const nodes: LLNode[] = values.map((v, i) => ({ id: String(v), val: v, next: null, x: 10 + i * spacing, y: 50 }));
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].next = nodes[i + 1];
  const dummy: LLNode = { id: 'dummy', val: 'D', next: nodes[0] ?? null, x: -100, y: -100 };

  const steps: Trace['steps'] = [];
  const label = (p: LLNode) => (p.id === 'dummy' ? 'dummy' : String(p.val));
  const snap = (lead: LLNode | null, trail: LLNode, line: string, note: string) => {
    const states: Record<string, NodeItem['state']> = {};
    if (lead) states[lead.id] = 'current';
    if (trail.id !== 'dummy') states[trail.id] = states[trail.id] ?? 'frontier';
    steps.push({
      kind: 'nodes',
      line,
      nodes: itemsFromNodes(nodes, states),
      panels: [{ label: 'pointers', items: [{ text: `lead → ${lead ? label(lead) : 'null'}`, hot: true }, { text: `trail → ${label(trail)}`, hot: true }] }],
      edges: edgesFromNodes(nodes),
      note,
    });
  };

  let lead: LLNode | null = dummy, trail: LLNode = dummy;
  snap(lead, trail, 'dummy', `A dummy node sits before the head, so removing the head itself needs no special case. lead and trail both start there.`);
  for (let i = 0; i <= n; i++) {
    lead = lead!.next;
    snap(lead, trail, 'gap', `Advance lead ${i + 1}/${n + 1} step(s) — opening a gap of ${n + 1} nodes between lead and trail.`);
  }
  while (lead) {
    lead = lead.next;
    trail = trail.next!;
    snap(lead, trail, 'loop', lead ? `Move both one hop: lead → ${label(lead)}, trail → ${label(trail)}. The gap stays fixed at ${n + 1}.` : `lead fell off the end → trail (${label(trail)}) now sits exactly one node before the target to remove.`);
  }
  const target = trail.next!;
  trail.next = target.next;
  const order: (number | string)[] = [];
  let walk = dummy.next;
  while (walk) { order.push(walk.val); walk = walk.next; }
  const survivors = nodes.filter((nd) => nd.id !== target.id);
  const trailDoneStates: Record<string, NodeItem['state']> = trail.id !== 'dummy' ? { [trail.id]: 'done' } : {};
  steps.push({
    kind: 'nodes',
    line: 'remove',
    nodes: itemsFromNodes(survivors, trailDoneStates),
    panels: [{ label: 'result', items: order.map((v) => ({ text: String(v), hot: false })) }],
    edges: edgesFromNodes(survivors),
    note: `trail.next skips over ${target.val} (the ${n}${n === 2 ? 'nd' : n === 1 ? 'st' : n === 3 ? 'rd' : 'th'} node from the end) → it's removed. Result: [${order.join(', ')}].`,
  });
  return { lines, steps };
}

// ---- 5. LRU Cache (hard) --------------------------------------------------

type LRUOp =
  | { kind: 'put'; key: number; val: number }
  | { kind: 'get'; key: number };

export function lruCacheTrace(capacity: number, ops: LRUOp[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'class LRUCache {' },
    { k: 'ctor', t: '  constructor(capacity) { this.cap = capacity; this.map = new Map(); /* + doubly-linked list */ }' },
    { k: 'get', t: '  get(key) {' },
    { k: 'gethit', t: '    if (!this.map.has(key)) return -1;' },
    { k: 'movefront', t: '    moveToFront(node);  return node.val;' },
    { k: 'getend', t: '  }' },
    { k: 'put', t: '  put(key, val) {' },
    { k: 'puthit', t: '    if (this.map.has(key)) { update node.val; moveToFront(node); return; }' },
    { k: 'evict', t: '    if (this.map.size >= this.cap) evict(list.tail);   // least-recently-used' },
    { k: 'insert', t: '    insertFront(new node);' },
    { k: 'putend', t: '  }' },
    { k: 'end', t: '}' },
  ];

  interface LNode { key: number; val: number; prev: LNode | null; next: LNode | null; }
  const map = new Map<number, LNode>();
  const head: LNode = { key: -1, val: -1, prev: null, next: null }; // MRU sentinel
  const tail: LNode = { key: -1, val: -1, prev: null, next: null }; // LRU sentinel
  head.next = tail; tail.prev = head;
  const remove = (nd: LNode) => { nd.prev!.next = nd.next; nd.next!.prev = nd.prev; };
  const addFront = (nd: LNode) => { nd.next = head.next; nd.prev = head; head.next!.prev = nd; head.next = nd; };

  const steps: Trace['steps'] = [];
  const snap = (line: string, note: string, evictedKey?: number) => {
    // MRU→LRU order, left to right, re-laid-out after every operation that changes order.
    const order: LNode[] = [];
    for (let nd = head.next; nd && nd !== tail; nd = nd.next) order.push(nd);
    const spacing = 80 / Math.max(1, order.length - 1);
    const nodeItems: NodeItem[] = order.map((nd, i) => ({
      id: String(nd.key),
      label: `v${nd.val}`,
      state: nd.key === lastTouched ? 'current' : '',
      x: order.length === 1 ? 50 : 10 + i * spacing,
      y: 50,
    }));
    const edges: NodeEdge[] = [];
    for (let i = 0; i < order.length - 1; i++) edges.push({ from: String(order[i].key), to: String(order[i + 1].key), label: 'next', state: 'active', directed: true });
    const cachePanel: NodePanel = {
      label: 'cache (key→value)',
      items: order.length ? order.map((nd) => ({ text: `${nd.key}→${nd.val}`, hot: nd.key === lastTouched })) : [{ text: '—', hot: false }],
    };
    const evictedPanel: NodePanel | null = evictedKey != null ? { label: 'evicted', items: [{ text: `key ${evictedKey}`, hot: true }] } : null;
    steps.push({ kind: 'nodes', line, nodes: nodeItems, panels: evictedPanel ? [cachePanel, evictedPanel] : [cachePanel], edges, note });
  };

  let lastTouched: number | null = null;
  steps.push({ kind: 'nodes', line: 'ctor', nodes: [], panels: [{ label: 'cache (key→value)', items: [{ text: '—', hot: false }] }], edges: [], note: `capacity = ${capacity}. List order will run MRU (left) → LRU (right); a Map gives O(1) lookup into the list nodes.` });

  for (const op of ops) {
    if (op.kind === 'put') {
      const existing = map.get(op.key);
      let evictedKey: number | undefined;
      let note: string;
      if (existing) {
        existing.val = op.val;
        remove(existing); addFront(existing);
        note = `put(${op.key}, ${op.val}): key already present → update its value and move it to the MRU end.`;
      } else {
        if (map.size >= capacity) {
          const lru = tail.prev!;
          remove(lru); map.delete(lru.key);
          evictedKey = lru.key;
        }
        const nd: LNode = { key: op.key, val: op.val, prev: null, next: null };
        map.set(op.key, nd);
        addFront(nd);
        note = evictedKey != null
          ? `put(${op.key}, ${op.val}): cache is at capacity (${capacity}) → evict the LRU entry (key ${evictedKey}) first, then insert ${op.key} at the MRU end.`
          : `put(${op.key}, ${op.val}): room available → insert ${op.key} at the MRU end.`;
      }
      lastTouched = op.key;
      snap(existing ? 'puthit' : 'insert', note, evictedKey);
    } else {
      const nd = map.get(op.key);
      if (!nd) {
        lastTouched = null;
        snap('gethit', `get(${op.key}): not in the cache → return -1.`);
      } else {
        remove(nd); addFront(nd);
        lastTouched = op.key;
        snap('movefront', `get(${op.key}) → ${nd.val}. Touching a key makes it most-recently-used → move it to the front of the list.`);
      }
    }
  }
  return { lines, steps };
}
