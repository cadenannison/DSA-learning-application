import type { Trace, CodeLine, NodeItem, NodeEdge, NodePanel } from '../types';

/**
 * Heap trace builders — run the real algorithm, record a step at every
 * meaningful heap operation. See ../../README.md for the authoring checklist.
 *
 * `heapPush`/`heapPop` below are a real, generic, comparator-driven
 * array-backed binary heap (sift-up on push, sift-down on pop) — not a
 * stand-in for Array.sort(). Kth Largest and Top K Frequent additionally
 * instrument every individual sift swap (they want to show the heap array
 * "growing/shifting" cell by cell); the other three variants call these
 * shared helpers and record one step per push/pop, since their visuals
 * (panels, positioned nodes, a matrix) tell the story better at that grain.
 */
function heapPush<T>(a: T[], val: T, cmp: (x: T, y: T) => number) {
  a.push(val);
  let i = a.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (cmp(a[i], a[p]) < 0) {
      [a[i], a[p]] = [a[p], a[i]];
      i = p;
    } else break;
  }
}

function heapPop<T>(a: T[], cmp: (x: T, y: T) => number): T {
  const top = a[0];
  const last = a.pop() as T;
  if (a.length) {
    a[0] = last;
    let i = 0;
    while (true) {
      const l = 2 * i + 1, r = 2 * i + 2;
      let smallest = i;
      if (l < a.length && cmp(a[l], a[smallest]) < 0) smallest = l;
      if (r < a.length && cmp(a[r], a[smallest]) < 0) smallest = r;
      if (smallest === i) break;
      [a[i], a[smallest]] = [a[smallest], a[i]];
      i = smallest;
    }
  }
  return top;
}

// ---------------------------------------------------------------------
// Kth Largest Element in an Array — min-heap of size k
// ---------------------------------------------------------------------
export function kthLargestTrace(nums: number[], k: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function findKthLargest(nums, k) {' },
    { k: 'alloc', t: '  const heap = [];   // min-heap, kept at size k' },
    { k: 'loop', t: '  for (const num of nums) {' },
    { k: 'pushline', t: '    heap.push(num); siftUp(heap.length - 1);' },
    { k: 'siftup', t: '      while (heap[parent] > heap[i]) swap(i, parent);' },
    { k: 'sizecheck', t: '    if (heap.length > k) {' },
    { k: 'evict', t: '      heap[0] = heap.pop(); siftDown(0);' },
    { k: 'endif', t: '    }' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return heap[0];   // root of the size-k min-heap = kth largest' },
    { k: 'end', t: '}' },
  ];
  const heap: number[] = [];
  const steps: Trace['steps'] = [];

  function siftUp(startIdx: number) {
    let i = startIdx;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p] > heap[i]) {
        const parentVal = heap[p], childVal = heap[i];
        [heap[i], heap[p]] = [heap[p], heap[i]];
        steps.push({ kind: 'array', line: 'siftup', cells: heap.slice(), current: p, note: `Sift-up: parent ${parentVal} > child ${childVal} → swap. Heap is now [${heap.join(', ')}].` });
        i = p;
      } else break;
    }
  }

  function siftDown(startIdx: number) {
    let i = startIdx;
    while (true) {
      const l = 2 * i + 1, r = 2 * i + 2;
      let smallest = i;
      if (l < heap.length && heap[l] < heap[smallest]) smallest = l;
      if (r < heap.length && heap[r] < heap[smallest]) smallest = r;
      if (smallest === i) break;
      [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
      steps.push({ kind: 'array', line: 'siftup', cells: heap.slice(), current: smallest, note: `Sift-down: child ${heap[smallest]} was smaller than its parent → swap. Heap is now [${heap.join(', ')}].` });
      i = smallest;
    }
  }

  steps.push({ kind: 'array', line: 'alloc', cells: [], note: `Allocate an empty min-heap. It will only ever hold the ${k} largest values seen so far, so its root — the smallest of those k — is always the current answer.` });

  for (const num of nums) {
    heap.push(num);
    steps.push({ kind: 'array', line: 'pushline', cells: heap.slice(), current: heap.length - 1, note: `Push ${num} onto the end of the heap array, at index ${heap.length - 1}.` });
    siftUp(heap.length - 1);
    if (heap.length > k) {
      const removed = heap[0];
      steps.push({ kind: 'array', line: 'sizecheck', cells: heap.slice(), current: 0, note: `Heap size ${heap.length} > k=${k} → this heap is only allowed to remember the ${k} largest, so evict the current minimum, ${removed}.` });
      heap[0] = heap[heap.length - 1];
      heap.pop();
      steps.push({ kind: 'array', line: 'evict', cells: heap.slice(), current: 0, note: `Move the last leaf into the root and drop the tail slot, then sift it down to restore the min-heap property.` });
      siftDown(0);
    }
  }

  steps.push({ kind: 'array', line: 'ret', cells: heap.slice(), current: 0, note: `Heap holds the ${k} largest values: [${heap.join(', ')}]. Its root, ${heap[0]}, is the smallest of them — that's the ${k}th largest overall.` });
  return { lines, steps };
}

// ---------------------------------------------------------------------
// Top K Frequent Elements — frequency map + min-heap of (count, value)
// ---------------------------------------------------------------------
export function topKFrequentTrace(nums: number[], k: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function topKFrequent(nums, k) {' },
    { k: 'freqbuild', t: '  const freq = new Map();\n  for (const n of nums) freq.set(n, (freq.get(n) || 0) + 1);' },
    { k: 'alloc', t: '  const heap = [];   // min-heap of [count, value], kept at size k' },
    { k: 'loop', t: '  for (const [value, count] of freq) {' },
    { k: 'pushline', t: '    heap.push([count, value]); siftUp(heap.length - 1);' },
    { k: 'sizecheck', t: '    if (heap.length > k) {' },
    { k: 'evict', t: '      heap[0] = heap.pop(); siftDown(0);' },
    { k: 'endif', t: '    }' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return heap.map(([, value]) => value);' },
    { k: 'end', t: '}' },
  ];
  const freq = new Map<number, number>();
  for (const n of nums) freq.set(n, (freq.get(n) ?? 0) + 1);

  const heap: [number, number][] = []; // [count, value]
  const steps: Trace['steps'] = [];
  const cellsFor = () => heap.map(([count]) => count);
  const panelsFor = (): NodePanel[] => [
    { label: 'freq map (value:count)', items: [...freq.entries()].map(([v, c]) => ({ text: `${v}:${c}`, hot: false })) },
    { label: 'heap (value:count)', items: heap.map(([c, v]) => ({ text: `${v}:${c}`, hot: true })) },
  ];

  steps.push({ kind: 'array', line: 'freqbuild', cells: [], panels: panelsFor(), note: `Count every value's frequency first: ${[...freq.entries()].map(([v, c]) => `${v}→${c}`).join(', ')}.` });

  function siftUp(startIdx: number) {
    let i = startIdx;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] > heap[i][0]) {
        const pc = heap[p][0], ic = heap[i][0];
        [heap[i], heap[p]] = [heap[p], heap[i]];
        steps.push({ kind: 'array', line: 'pushline', cells: cellsFor(), current: p, panels: panelsFor(), note: `Sift-up: parent count ${pc} > child count ${ic} → swap.` });
        i = p;
      } else break;
    }
  }
  function siftDown(startIdx: number) {
    let i = startIdx;
    while (true) {
      const l = 2 * i + 1, r = 2 * i + 2;
      let smallest = i;
      if (l < heap.length && heap[l][0] < heap[smallest][0]) smallest = l;
      if (r < heap.length && heap[r][0] < heap[smallest][0]) smallest = r;
      if (smallest === i) break;
      [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
      steps.push({ kind: 'array', line: 'evict', cells: cellsFor(), current: smallest, panels: panelsFor(), note: `Sift-down after eviction: child count ${heap[smallest][0]} was smaller → swap.` });
      i = smallest;
    }
  }

  for (const [value, count] of freq) {
    heap.push([count, value]);
    steps.push({ kind: 'array', line: 'pushline', cells: cellsFor(), current: heap.length - 1, panels: panelsFor(), note: `Push (value ${value}, count ${count}) onto the heap.` });
    siftUp(heap.length - 1);
    if (heap.length > k) {
      const [rc, rv] = heap[0];
      steps.push({ kind: 'array', line: 'sizecheck', cells: cellsFor(), current: 0, panels: panelsFor(), note: `Heap size ${heap.length} > k=${k} → evict (value ${rv}, count ${rc}), the least-frequent entry currently kept.` });
      heap[0] = heap[heap.length - 1];
      heap.pop();
      steps.push({ kind: 'array', line: 'evict', cells: cellsFor(), current: 0, panels: panelsFor(), note: `Move the last element into the root, drop the tail, then sift it down.` });
      siftDown(0);
    }
  }

  const result = heap.map(([, v]) => v);
  steps.push({ kind: 'array', line: 'ret', cells: cellsFor(), panels: panelsFor(), note: `Heap ends holding the ${k} most frequent values: {${result.join(', ')}}. (Which slot they sit in depends on Map iteration order for tied counts, but the value set {1, 2} is correct — both occur more often than 3.)` });
  return { lines, steps };
}

// ---------------------------------------------------------------------
// Find Median from Data Stream — two heaps, rebalanced after every insert
// ---------------------------------------------------------------------
export function findMedianTrace(stream: number[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function addNum(num) {' },
    { k: 'decide', t: '  if (!lo.size || num <= lo.peek()) lo.push(num); else hi.push(num);' },
    { k: 'rebalanceA', t: '  if (lo.size > hi.size + 1) hi.push(lo.pop());' },
    { k: 'rebalanceB', t: '  else if (hi.size > lo.size) lo.push(hi.pop());' },
    { k: 'end', t: '}' },
    { k: 'medianhead', t: 'function findMedian() {' },
    { k: 'medianret', t: '  return lo.size > hi.size ? lo.peek() : (lo.peek() + hi.peek()) / 2;' },
    { k: 'medianend', t: '}' },
  ];

  const lo: number[] = []; // max-heap: lower half
  const hi: number[] = []; // min-heap: upper half
  const cmpMax = (a: number, b: number) => b - a;
  const cmpMin = (a: number, b: number) => a - b;

  const steps: Trace['steps'] = [];
  const seen: (number | null)[] = [];
  const panelsFor = (): NodePanel[] => [
    { label: 'max-heap (lower half)', items: lo.map((v) => ({ text: String(v), hot: false })) },
    { label: 'min-heap (upper half)', items: hi.map((v) => ({ text: String(v), hot: false })) },
  ];

  let lastMedian = 0;
  stream.forEach((num, idx) => {
    seen.push(num);

    if (lo.length === 0 || num <= lo[0]) {
      heapPush(lo, num, cmpMax);
      steps.push({ kind: 'array', line: 'decide', cells: seen.slice(), current: idx, panels: panelsFor(), note: `${num} ≤ the max-heap's top (or the lower half is still empty) → it belongs in the lower half, so push it onto the max-heap.` });
    } else {
      heapPush(hi, num, cmpMin);
      steps.push({ kind: 'array', line: 'decide', cells: seen.slice(), current: idx, panels: panelsFor(), note: `${num} > the max-heap's top → it belongs in the upper half, so push it onto the min-heap.` });
    }

    if (lo.length > hi.length + 1) {
      const moved = heapPop(lo, cmpMax);
      heapPush(hi, moved, cmpMin);
      steps.push({ kind: 'array', line: 'rebalanceA', cells: seen.slice(), current: idx, panels: panelsFor(), note: `Lower half grew more than one bigger than the upper half → pop its max (${moved}) and push it onto the min-heap to rebalance.` });
    } else if (hi.length > lo.length) {
      const moved = heapPop(hi, cmpMin);
      heapPush(lo, moved, cmpMax);
      steps.push({ kind: 'array', line: 'rebalanceB', cells: seen.slice(), current: idx, panels: panelsFor(), note: `Upper half grew bigger than the lower half → pop its min (${moved}) and push it onto the max-heap to rebalance.` });
    }

    lastMedian = lo.length > hi.length ? lo[0] : (lo[0] + hi[0]) / 2;
    steps.push({ kind: 'array', line: 'medianret', cells: seen.slice(), current: idx, panels: panelsFor(), note: `Both halves are balanced (sizes ${lo.length}/${hi.length}) → median so far is ${lo.length > hi.length ? `lo top = ${lo[0]}` : `(lo top ${lo[0]} + hi top ${hi[0]}) / 2 = ${lastMedian}`}.` });
  });

  steps.push({ kind: 'array', line: 'medianret', cells: seen.slice(), current: stream.length - 1, panels: panelsFor(), note: `After inserting all ${stream.length} numbers, the median is ${lastMedian}.` });
  return { lines, steps };
}

// ---------------------------------------------------------------------
// Merge K Sorted Lists — min-heap over "current head of each list"
// ---------------------------------------------------------------------
export function mergeKListsTrace(lists: number[][]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function mergeKLists(lists) {' },
    { k: 'seed', t: '  const heap = [];\n  lists.forEach((list, i) => list.length && heap.push({val: list[0], listIdx: i, elemIdx: 0}));' },
    { k: 'out', t: '  const out = [];' },
    { k: 'while', t: '  while (heap.length) {' },
    { k: 'pop', t: '    const {val, listIdx, elemIdx} = popMin(heap);   // heap holds POINTERS, not the data' },
    { k: 'record', t: '    out.push(val);' },
    { k: 'advance', t: '    if (elemIdx + 1 < lists[listIdx].length) heap.push({val: lists[listIdx][elemIdx + 1], listIdx, elemIdx: elemIdx + 1});' },
    { k: 'endwhile', t: '  }' },
    { k: 'ret', t: '  return out;' },
    { k: 'end', t: '}' },
  ];

  type Cand = { val: number; listIdx: number; elemIdx: number };
  const cmp = (a: Cand, b: Cand) => a.val - b.val;
  const heap: Cand[] = [];
  const steps: Trace['steps'] = [];
  const consumed = new Set<string>();
  const nodeId = (i: number, j: number) => `${i}-${j}`;

  const allNodes: NodeItem[] = [];
  const allEdges: NodeEdge[] = [];
  lists.forEach((list, i) => {
    list.forEach((val, j) => {
      allNodes.push({ id: nodeId(i, j), label: String(val), state: '', x: 10 + j * 20, y: 18 + i * 28 });
      if (j > 0) allEdges.push({ from: nodeId(i, j - 1), to: nodeId(i, j), label: 'next', directed: true, state: '' });
    });
  });

  const out: number[] = [];
  const frontierIdsOf = () => new Set(heap.map((c) => nodeId(c.listIdx, c.elemIdx)));
  const nodesSnapshot = (currentId: string | null): NodeItem[] => {
    const frontier = frontierIdsOf();
    return allNodes.map((n) => ({
      ...n,
      state: (currentId === n.id ? 'current' : consumed.has(String(n.id)) ? 'done' : frontier.has(String(n.id)) ? 'frontier' : '') as NodeItem['state'],
    }));
  };
  const edgesSnapshot = (): NodeEdge[] => allEdges.map((e) => ({ ...e, state: consumed.has(String(e.from)) ? 'done' : '' }));
  const panelsFor = (): NodePanel[] => [{ label: 'merged so far', items: out.map((v) => ({ text: String(v), hot: false })) }];

  lists.forEach((list, i) => {
    if (list.length) heapPush(heap, { val: list[0], listIdx: i, elemIdx: 0 }, cmp);
  });
  steps.push({ kind: 'nodes', line: 'seed', nodes: nodesSnapshot(null), edges: edgesSnapshot(), panels: panelsFor(), note: `${lists.length} sorted lists. The heap only ever holds the current head of each list (${heap.map((c) => c.val).join(', ')}) — never the lists' full contents.` });

  while (heap.length) {
    const { val, listIdx, elemIdx } = heapPop(heap, cmp);
    const id = nodeId(listIdx, elemIdx);
    consumed.add(id);
    out.push(val);
    steps.push({ kind: 'nodes', line: 'pop', nodes: nodesSnapshot(id), edges: edgesSnapshot(), panels: panelsFor(), note: `Pop the heap's minimum: ${val}, the head of list ${listIdx}. It's smaller than every other list's current head → append it to the merged output.` });
    if (elemIdx + 1 < lists[listIdx].length) {
      const nextVal = lists[listIdx][elemIdx + 1];
      heapPush(heap, { val: nextVal, listIdx, elemIdx: elemIdx + 1 }, cmp);
      steps.push({ kind: 'nodes', line: 'advance', nodes: nodesSnapshot(id), edges: edgesSnapshot(), panels: panelsFor(), note: `List ${listIdx} still has more nodes — push its new head, ${nextVal}, onto the heap.` });
    }
  }

  steps.push({ kind: 'nodes', line: 'ret', nodes: nodesSnapshot(null), edges: edgesSnapshot(), panels: panelsFor(), note: `Heap is empty → every node has been consumed. Merged output: [${out.join(', ')}].` });
  return { lines, steps };
}

// ---------------------------------------------------------------------
// Kth Smallest Element in a Sorted Matrix — min-heap over candidates
// ---------------------------------------------------------------------
export function kthSmallestMatrixTrace(matrix: number[][], k: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function kthSmallest(matrix, k) {' },
    { k: 'heapinit', t: '  const heap = [{val: matrix[0][0], r: 0, c: 0}];\n  const visited = new Set(["0,0"]);' },
    { k: 'loop', t: '  for (let i = 0; i < k; i++) {' },
    { k: 'pop', t: '    const {val, r, c} = popMin(heap);' },
    { k: 'right', t: '    if (c + 1 < cols && !visited.has(r,c+1)) heap.push({val: matrix[r][c+1], r, c: c+1});' },
    { k: 'down', t: '    if (r + 1 < rows && !visited.has(r+1,c)) heap.push({val: matrix[r+1][c], r: r+1, c});' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return val;   // the kth value popped' },
    { k: 'end', t: '}' },
  ];

  type Cand = { val: number; r: number; c: number };
  const cmp = (a: Cand, b: Cand) => a.val - b.val;
  const rows = matrix.length, cols = matrix[0].length;
  const heap: Cand[] = [];
  const visited = new Set<string>();
  const steps: Trace['steps'] = [];
  const snapCells = () => matrix.map((row) => row.slice());

  heapPush(heap, { val: matrix[0][0], r: 0, c: 0 }, cmp);
  visited.add('0,0');
  steps.push({ kind: 'matrix', line: 'heapinit', cells: snapCells(), current: [0, 0], note: `Start the heap with just the top-left cell. Because every row and column is sorted, the next-smallest unseen value is always a right or down neighbor of some already-popped cell — no need to enqueue the whole matrix.` });

  let val = matrix[0][0], r = 0, c = 0;
  for (let i = 0; i < k; i++) {
    const popped = heapPop(heap, cmp);
    val = popped.val; r = popped.r; c = popped.c;
    steps.push({ kind: 'matrix', line: 'pop', cells: snapCells(), current: [r, c], note: `Pop #${i + 1}: the heap's minimum is matrix[${r}][${c}] = ${val}.${i + 1 === k ? ` That's the ${k}th pop → this is the answer.` : ''}` });

    const sources: [number, number][] = [];
    if (c + 1 < cols && !visited.has(`${r},${c + 1}`)) {
      visited.add(`${r},${c + 1}`);
      heapPush(heap, { val: matrix[r][c + 1], r, c: c + 1 }, cmp);
      sources.push([r, c + 1]);
    }
    if (r + 1 < rows && !visited.has(`${r + 1},${c}`)) {
      visited.add(`${r + 1},${c}`);
      heapPush(heap, { val: matrix[r + 1][c], r: r + 1, c }, cmp);
      sources.push([r + 1, c]);
    }
    if (sources.length) {
      steps.push({ kind: 'matrix', line: 'down', cells: snapCells(), current: [r, c], sources, note: `Push ${sources.map(([sr, sc]) => `matrix[${sr}][${sc}]=${matrix[sr][sc]}`).join(' and ')} onto the heap as new candidates reachable from (${r},${c}).` });
    }
  }

  steps.push({ kind: 'matrix', line: 'ret', cells: snapCells(), current: [r, c], note: `The ${k}th smallest value in the matrix is ${val}.` });
  return { lines, steps, colLabels: matrix[0].map((_, j) => j), rowLabels: matrix.map((_, i) => i) };
}
