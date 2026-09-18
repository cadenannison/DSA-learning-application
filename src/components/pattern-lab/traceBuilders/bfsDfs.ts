import type { Trace, CodeLine, GridCellState, NodeItem, NodeEdge, NodePanel } from '../types';

/**
 * BFS/DFS trace builders — run the real algorithm, record a step at every
 * meaningful moment. See ../../README.md for the authoring checklist.
 */

// ---- Flood Fill (simple · grid · DFS) --------------------------------

export function floodFillTrace(image: number[][], sr: number, sc: number, newColor: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function floodFill(image, sr, sc, newColor) {' },
    { k: 'start', t: '  const startColor = image[sr][sc];' },
    { k: 'guard', t: '  if (startColor === newColor) return image;' },
    { k: 'call', t: '  dfs(sr, sc);' },
    { k: 'ret', t: '  return image;' },
    { k: 'end', t: '}' },
    { k: 'blank', t: '' },
    { k: 'dfshead', t: 'function dfs(r, c) {' },
    { k: 'bounds', t: '  if (out of bounds || image[r][c] !== startColor) return;' },
    { k: 'paint', t: '  image[r][c] = newColor;' },
    { k: 'recurse', t: '  dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1);' },
    { k: 'dfsend', t: '}' },
  ];
  const rows = image.length, cols = image[0].length;
  const startColor = image[sr][sc];
  const img = image.map((r) => r.slice());
  const filled = image.map((r) => r.map(() => false));
  const steps: Trace['steps'] = [];

  const classify = (r: number, c: number, current: [number, number] | null): GridCellState => {
    if (current && current[0] === r && current[1] === c) return 'current';
    if (filled[r][c]) return 'visited';
    if (img[r][c] === startColor) return 'land';
    return 'water';
  };
  const snap = (current: [number, number] | null): GridCellState[][] => {
    const g: GridCellState[][] = [];
    for (let r = 0; r < rows; r++) { const row: GridCellState[] = []; for (let c = 0; c < cols; c++) row.push(classify(r, c, current)); g.push(row); }
    return g;
  };

  steps.push({ kind: 'grid', line: 'start', grid: snap([sr, sc]), note: `Start color at (${sr},${sc}) is ${startColor}. New color is ${newColor} — since they differ, DFS-flood-fill outward from here.` });

  if (startColor === newColor) {
    steps.push({ kind: 'grid', line: 'guard', grid: snap(null), note: `Start color already equals newColor (${newColor}) — nothing to do, return the image unchanged.` });
    return { lines, steps };
  }

  function dfs(r: number, c: number) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || img[r][c] !== startColor) return;
    filled[r][c] = true;
    img[r][c] = newColor;
    steps.push({ kind: 'grid', line: 'paint', grid: snap([r, c]), note: `(${r},${c}) matches the start color → paint it ${newColor} and continue to its 4 neighbors.` });
    dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
  }

  dfs(sr, sc);
  steps.push({ kind: 'grid', line: 'ret', grid: snap(null), note: `DFS exhausted every connected cell of the original color → final image: [${img.map((row) => `[${row.join(',')}]`).join(', ')}].` });
  return { lines, steps };
}

// ---- Binary Tree Root-to-Leaf Path Sum (easy · nodes · DFS backtrack) --

export function pathSumTrace(targetSum: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function hasPathSum(node, targetSum) {' },
    { k: 'base', t: '  if (!node) return false;' },
    { k: 'leaf', t: '  if (!node.left && !node.right) return node.val === targetSum;' },
    { k: 'rem', t: '  const remaining = targetSum - node.val;' },
    { k: 'rec', t: '  return hasPathSum(node.left, remaining) || hasPathSum(node.right, remaining);' },
    { k: 'end', t: '}' },
  ];

  type TNode = { id: string; val: number; x: number; y: number; left?: TNode; right?: TNode };
  // Fixed layout for [5,4,8,11,null,13,4,7,2,null,null,null,1] (LeetCode 112's classic example).
  const n8: TNode = { id: 'n8', val: 1, x: 94, y: 78 };
  const n7: TNode = { id: 'n7', val: 2, x: 24, y: 78 };
  const n6: TNode = { id: 'n6', val: 7, x: 8, y: 78 };
  const n5: TNode = { id: 'n5', val: 4, x: 86, y: 56, right: n8 };
  const n4: TNode = { id: 'n4', val: 13, x: 58, y: 56 };
  const n3: TNode = { id: 'n3', val: 11, x: 16, y: 56, left: n6, right: n7 };
  const n2: TNode = { id: 'n2', val: 8, x: 72, y: 34, left: n4, right: n5 };
  const n1: TNode = { id: 'n1', val: 4, x: 28, y: 34, left: n3 };
  const n0: TNode = { id: 'n0', val: 5, x: 50, y: 12, left: n1, right: n2 };
  const all: TNode[] = [n0, n1, n2, n3, n4, n5, n6, n7, n8];
  const edgeDefs: [string, string][] = [
    ['n0', 'n1'], ['n0', 'n2'],
    ['n1', 'n3'],
    ['n2', 'n4'], ['n2', 'n5'],
    ['n3', 'n6'], ['n3', 'n7'],
    ['n5', 'n8'],
  ];

  const nodeState: Record<string, '' | 'current' | 'done'> = {};
  all.forEach((nd) => { nodeState[nd.id] = ''; });
  const edgeState: Record<string, '' | 'active' | 'done'> = {};
  edgeDefs.forEach(([a, b]) => { edgeState[`${a}-${b}`] = ''; });

  const nodesFor = (): NodeItem[] => all.map((nd) => ({ id: nd.id, label: `val ${nd.val}`, state: nodeState[nd.id], x: nd.x, y: nd.y }));
  const edgesFor = (): NodeEdge[] => edgeDefs.map(([a, b]) => ({ from: a, to: b, state: edgeState[`${a}-${b}`], directed: true }));

  const steps: Trace['steps'] = [];

  function dfs(node: TNode, target: number, parentId: string | null): boolean {
    if (parentId) edgeState[`${parentId}-${node.id}`] = 'active';
    nodeState[node.id] = 'current';
    steps.push({ kind: 'nodes', line: 'init', nodes: nodesFor(), panels: [], edges: edgesFor(), note: `Visit ${node.val}: a path through here needs the rest of the way down to sum to ${target}.` });

    if (!node.left && !node.right) {
      const match = node.val === target;
      steps.push({ kind: 'nodes', line: 'leaf', nodes: nodesFor(), panels: [], edges: edgesFor(), note: `${node.val} is a leaf: ${node.val} ${match ? '===' : '≠'} ${target} → ${match ? 'this root-to-leaf path sums to the target!' : 'dead end, backtrack.'}` });
      nodeState[node.id] = 'done';
      if (parentId) edgeState[`${parentId}-${node.id}`] = 'done';
      return match;
    }

    const remaining = target - node.val;
    steps.push({ kind: 'nodes', line: 'rem', nodes: nodesFor(), panels: [], edges: edgesFor(), note: `Not a leaf: subtract ${node.val} from ${target} → a child's subtree still needs to sum to ${remaining}.` });

    let result = false;
    if (node.left) result = dfs(node.left, remaining, node.id);
    if (!result && node.right) result = dfs(node.right, remaining, node.id);

    nodeState[node.id] = 'done';
    if (parentId) edgeState[`${parentId}-${node.id}`] = 'done';
    steps.push({ kind: 'nodes', line: 'rec', nodes: nodesFor(), panels: [], edges: edgesFor(), note: result ? `A path below ${node.val} matched → propagate true back up.` : `Neither child of ${node.val} found a matching path → backtrack.` });
    return result;
  }

  const found = dfs(n0, targetSum, null);
  steps.push({ kind: 'nodes', line: 'end', nodes: nodesFor(), panels: [], edges: edgesFor(), note: found ? `hasPathSum(root, ${targetSum}) → true. The path 5 → 4 → 11 → 2 sums to ${targetSum}.` : `hasPathSum(root, ${targetSum}) → false. No root-to-leaf path sums to ${targetSum}.` });

  return { lines, steps };
}

// ---- Shortest Path in a Binary Matrix (medium · grid · 8-dir BFS) ------

export function shortestPathBinaryMatrixTrace(grid: number[][]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function shortestPathBinaryMatrix(grid) {' },
    { k: 'n', t: '  const n = grid.length;' },
    { k: 'guard', t: '  if (grid[0][0] === 1 || grid[n-1][n-1] === 1) return -1;' },
    { k: 'queue', t: '  const queue = [[0, 0, 1]];  const visited = new Set(["0,0"]);' },
    { k: 'while', t: '  while (queue.length) {' },
    { k: 'pop', t: '    const [r, c, dist] = queue.shift();' },
    { k: 'check', t: '    if (r === n - 1 && c === n - 1) return dist;' },
    { k: 'dirs', t: '    for (const [dr, dc] of DIRS8) {   // all 8 neighbors' },
    { k: 'test', t: '      if (inBounds && grid[nr][nc] === 0 && !visited.has(key)) {' },
    { k: 'mark', t: '        visited.add(key);  queue.push([nr, nc, dist + 1]);' },
    { k: 'endif', t: '      }' },
    { k: 'endfor', t: '    }' },
    { k: 'endwhile', t: '  }' },
    { k: 'ret', t: '  return -1;' },
    { k: 'end', t: '}' },
  ];
  const DIRS8: [number, number][] = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const n = grid.length;
  const steps: Trace['steps'] = [];

  const classify = (r: number, c: number, current: [number, number] | null, qset: Set<string>, visited: Set<string>): GridCellState => {
    if (grid[r][c] === 1) return 'water';
    if (current && current[0] === r && current[1] === c) return 'current';
    if (qset.has(`${r},${c}`)) return 'frontier';
    if (visited.has(`${r},${c}`)) return 'visited';
    return 'empty';
  };
  const snap = (current: [number, number] | null, queue: [number, number, number][], visited: Set<string>): GridCellState[][] => {
    const qset = new Set(queue.map(([r, c]) => `${r},${c}`));
    const g: GridCellState[][] = [];
    for (let r = 0; r < n; r++) { const row: GridCellState[] = []; for (let c = 0; c < n; c++) row.push(classify(r, c, current, qset, visited)); g.push(row); }
    return g;
  };

  if (grid[0][0] === 1 || grid[n - 1][n - 1] === 1) {
    steps.push({ kind: 'grid', line: 'guard', grid: snap(null, [], new Set()), note: 'The start or end cell is blocked → no path exists, return -1.' });
    return { lines, steps };
  }

  const visited = new Set<string>(['0,0']);
  const queue: [number, number, number][] = [[0, 0, 1]];
  steps.push({ kind: 'grid', line: 'queue', grid: snap(null, queue, visited), note: `Seed the queue with the start cell (0,0) at distance 1, and mark it visited.` });

  let answer = -1;
  while (queue.length) {
    const [r, c, dist] = queue.shift()!;
    steps.push({ kind: 'grid', line: 'pop', grid: snap([r, c], queue, visited), note: `Dequeue (${r},${c}) at distance ${dist} — check its 8 neighbors.` });
    if (r === n - 1 && c === n - 1) {
      answer = dist;
      steps.push({ kind: 'grid', line: 'check', grid: snap([r, c], queue, visited), note: `(${r},${c}) is the bottom-right corner → shortest path length is ${dist}.` });
      break;
    }
    for (const [dr, dc] of DIRS8) {
      const nr = r + dr, nc = c + dc;
      const key = `${nr},${nc}`;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] === 0 && !visited.has(key)) {
        visited.add(key);
        queue.push([nr, nc, dist + 1]);
        steps.push({ kind: 'grid', line: 'mark', grid: snap([r, c], queue, visited), note: `(${nr},${nc}) is open and unvisited → mark visited, enqueue at distance ${dist + 1}.` });
      }
    }
  }

  if (answer === -1) {
    steps.push({ kind: 'grid', line: 'ret', grid: snap(null, [], visited), note: 'The queue emptied without reaching the bottom-right corner → no path exists, return -1.' });
  }
  return { lines, steps };
}

// ---- Clone Graph (medium/hard · nodes · DFS + visited map, has a cycle) -

export function cloneGraphTrace(adjList: number[][]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function cloneGraph(node) {' },
    { k: 'map', t: '  const visited = new Map();   // original node -> its clone' },
    { k: 'dfshead', t: '  function dfs(u) {' },
    { k: 'base', t: '    if (visited.has(u)) return visited.get(u);' },
    { k: 'clone', t: '    const copy = new Node(u.val);  visited.set(u, copy);' },
    { k: 'neighbors', t: '    for (const v of u.neighbors) {' },
    { k: 'recurse', t: '      copy.neighbors.push(dfs(v));' },
    { k: 'endfor', t: '    }' },
    { k: 'return', t: '    return copy;' },
    { k: 'dfsend', t: '  }' },
    { k: 'call', t: '  return dfs(node);' },
    { k: 'end', t: '}' },
  ];
  const n = adjList.length;
  const ids = Array.from({ length: n }, (_, i) => i + 1);
  const pos: Record<number, [number, number]> = { 1: [30, 30], 2: [70, 30], 3: [70, 70], 4: [30, 70] };
  const edgeDefs: [number, number][] = [];
  const seen = new Set<string>();
  ids.forEach((u) => {
    for (const v of adjList[u - 1]) {
      const key = u < v ? `${u}-${v}` : `${v}-${u}`;
      if (!seen.has(key)) { seen.add(key); edgeDefs.push(u < v ? [u, v] : [v, u]); }
    }
  });
  const nodeState: Record<number, '' | 'current' | 'done'> = {};
  ids.forEach((i) => { nodeState[i] = ''; });
  const edgeState: Record<string, '' | 'active'> = {};
  edgeDefs.forEach(([a, b]) => { edgeState[`${a}-${b}`] = ''; });
  const cloned: number[] = [];

  const nodesFor = (): NodeItem[] => ids.map((i) => ({ id: i, label: `val ${i}`, state: nodeState[i], x: pos[i][0], y: pos[i][1] }));
  const edgesFor = (): NodeEdge[] => edgeDefs.map(([a, b]) => ({ from: a, to: b, state: edgeState[`${a}-${b}`] }));
  const panelsFor = (): NodePanel[] => ([{ label: 'cloned', items: cloned.map((c) => ({ text: String(c), hot: false })) }]);

  const steps: Trace['steps'] = [];
  steps.push({ kind: 'nodes', line: 'map', nodes: nodesFor(), panels: panelsFor(), edges: edgesFor(), note: `Start DFS from node 1 with an empty visited map (original node → its clone).` });

  const edgeKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

  function dfs(u: number) {
    nodeState[u] = 'current';
    cloned.push(u);
    steps.push({ kind: 'nodes', line: 'clone', nodes: nodesFor(), panels: panelsFor(), edges: edgesFor(), note: `Create a clone of node ${u} and record it in the visited map before touching its neighbors — this is what makes the cycle safe.` });
    for (const v of adjList[u - 1]) {
      edgeState[edgeKey(u, v)] = 'active';
      if (nodeState[v] === '') {
        steps.push({ kind: 'nodes', line: 'neighbors', nodes: nodesFor(), panels: panelsFor(), edges: edgesFor(), note: `Neighbor ${v} of ${u} hasn't been cloned yet → recurse into it.` });
        dfs(v);
      } else {
        steps.push({ kind: 'nodes', line: 'base', nodes: nodesFor(), panels: panelsFor(), edges: edgesFor(), note: `Neighbor ${v} of ${u} is already in the visited map → reuse its clone instead of recursing (this is what prevents infinite loops on the cycle).` });
      }
    }
    nodeState[u] = 'done';
    steps.push({ kind: 'nodes', line: 'return', nodes: nodesFor(), panels: panelsFor(), edges: edgesFor(), note: `Node ${u} is fully cloned — all its neighbor clones are linked, return copy.` });
  }

  dfs(1);
  steps.push({ kind: 'nodes', line: 'end', nodes: nodesFor(), panels: panelsFor(), edges: edgesFor(), note: `All ${n} nodes cloned with the same ${edgeDefs.length} edges as the original graph → the clone is structurally identical.` });
  return { lines, steps };
}

// ---- Word Ladder (hard · nodes, flat/unpositioned · layered BFS) -------

export function wordLadderTrace(beginWord: string, endWord: string, wordList: string[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function ladderLength(beginWord, endWord, wordList) {' },
    { k: 'wordset', t: '  const words = new Set(wordList);' },
    { k: 'guard', t: '  if (!words.has(endWord)) return 0;' },
    { k: 'queue', t: '  const queue = [[beginWord, 1]];  const visited = new Set([beginWord]);' },
    { k: 'while', t: '  while (queue.length) {' },
    { k: 'pop', t: '    const [word, dist] = queue.shift();' },
    { k: 'check', t: '    if (word === endWord) return dist;' },
    { k: 'gen', t: '    for (const next of oneLetterNeighbors(word, words)) {' },
    { k: 'test', t: '      if (!visited.has(next)) {' },
    { k: 'mark', t: '        visited.add(next);  queue.push([next, dist + 1]);' },
    { k: 'endif', t: '      }' },
    { k: 'endgen', t: '    }' },
    { k: 'endwhile', t: '  }' },
    { k: 'ret', t: '  return 0;' },
    { k: 'end', t: '}' },
  ];

  const oneAway = (a: string, b: string): boolean => {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) diff++; if (diff > 1) return false; }
    return diff === 1;
  };

  const words = new Set(wordList);
  const universe = Array.from(new Set([beginWord, ...wordList]));
  const dist: Record<string, number | null> = {};
  universe.forEach((w) => { dist[w] = null; });
  const steps: Trace['steps'] = [];

  if (!words.has(endWord)) {
    steps.push({ kind: 'nodes', line: 'guard', nodes: universe.map((w) => ({ id: w, label: '', state: '' as const })), panels: [], note: `"${endWord}" isn't in the word list at all → no transformation can reach it, return 0.` });
    return { lines, steps };
  }

  const doneSet = new Set<string>();
  const nodesFor = (queue: [string, number][], current: string | null): NodeItem[] => {
    const qset = new Set(queue.map(([w]) => w));
    return universe.map((w) => {
      let state: '' | 'current' | 'frontier' | 'done' = '';
      if (current === w) state = 'current';
      else if (doneSet.has(w)) state = 'done';
      else if (qset.has(w)) state = 'frontier';
      return { id: w, label: dist[w] != null ? `dist ${dist[w]}` : '', state };
    });
  };
  const panelsFor = (queue: [string, number][], visited: Set<string>): NodePanel[] => ([
    { label: 'queue', items: queue.map(([w, d]) => ({ text: `${w} (${d})`, hot: true })) },
    { label: 'visited', items: [...visited].map((w) => ({ text: w, hot: false })) },
  ]);
  const adjFor = (word: string): string => {
    const neighbors = wordList.filter((w) => w !== word && oneAway(w, word));
    return `${word} → [${neighbors.join(', ')}]`;
  };

  const queue: [string, number][] = [[beginWord, 1]];
  const visited = new Set<string>([beginWord]);
  dist[beginWord] = 1;
  steps.push({ kind: 'nodes', line: 'queue', nodes: nodesFor(queue, null), panels: panelsFor(queue, visited), note: `Seed the queue with "${beginWord}" at distance 1.` });

  let answer = 0;
  while (queue.length) {
    const [word, d] = queue.shift()!;
    steps.push({ kind: 'nodes', line: 'pop', nodes: nodesFor(queue, word), panels: panelsFor(queue, visited), adjHtml: adjFor(word), note: `Dequeue "${word}" at distance ${d}. Words one letter apart from it are shown below.` });
    if (word === endWord) {
      answer = d;
      doneSet.add(word);
      steps.push({ kind: 'nodes', line: 'check', nodes: nodesFor(queue, null), panels: panelsFor(queue, visited), adjHtml: adjFor(word), note: `"${word}" is the target → shortest transformation sequence has length ${d}.` });
      break;
    }
    for (const next of wordList.filter((w) => oneAway(w, word))) {
      if (!visited.has(next)) {
        visited.add(next);
        dist[next] = d + 1;
        queue.push([next, d + 1]);
        steps.push({ kind: 'nodes', line: 'mark', nodes: nodesFor(queue, word), panels: panelsFor(queue, visited), adjHtml: adjFor(word), note: `"${next}" is unvisited and one letter from "${word}" → mark visited, enqueue at distance ${d + 1}.` });
      }
    }
    doneSet.add(word);
  }

  if (answer === 0) {
    steps.push({ kind: 'nodes', line: 'ret', nodes: nodesFor(queue, null), panels: panelsFor(queue, visited), note: `The queue emptied without reaching "${endWord}" → no transformation sequence exists, return 0.` });
  }

  return { lines, steps };
}
