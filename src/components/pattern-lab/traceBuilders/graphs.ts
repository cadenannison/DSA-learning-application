import type { Trace, CodeLine, GridCellState } from '../types';

const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * Graph trace builders — run the real algorithm, record a step at every
 * meaningful moment. See ../../README.md for the authoring checklist.
 */
export function islandsTrace(grid: string[][]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function numIslands(grid) {' },
    { k: 'dims', t: '  const rows = grid.length, cols = grid[0].length;' },
    { k: 'visited', t: '  const visited = grid.map(r => r.map(() => false));' },
    { k: 'countinit', t: '  let count = 0;' },
    { k: 'forR', t: '  for (let r = 0; r < rows; r++)' },
    { k: 'forC', t: '    for (let c = 0; c < cols; c++)' },
    { k: 'check', t: '      if (grid[r][c] === "1" && !visited[r][c]) {' },
    { k: 'inc', t: '        count++;' },
    { k: 'call', t: '        bfs(r, c);   // flood-fill this whole island' },
    { k: 'endif', t: '      }' },
    { k: 'ret', t: '  return count;' },
    { k: 'end', t: '}' },
    { k: 'bfsinit', t: '' },
    { k: 'bfshead', t: 'function bfs(r, c) {' },
    { k: 'bfsqueue', t: '  const queue = [[r, c]];  visited[r][c] = true;' },
    { k: 'bfswhile', t: '  while (queue.length) {' },
    { k: 'bfspop', t: '    const [cr, cc] = queue.shift();' },
    { k: 'bfsdirs', t: '    for (const [dr, dc] of DIRS) {' },
    { k: 'bfscheck', t: '      if (inBounds && grid[nr][nc]==="1" && !visited[nr][nc]) {' },
    { k: 'bfsmark', t: '        visited[nr][nc] = true;  queue.push([nr, nc]);' },
    { k: 'bfsend', t: '      }' },
  ];
  const rows = grid.length, cols = grid[0].length;
  const visited = grid.map((r) => r.map(() => false));
  const steps: Trace['steps'] = [];
  let count = 0;
  const classify = (r: number, c: number, current: [number, number] | null, qset: Set<string> | null): GridCellState => {
    if (grid[r][c] === '0') return 'water';
    if (current && current[0] === r && current[1] === c) return 'current';
    if (qset && qset.has(r + ',' + c)) return 'frontier';
    if (visited[r][c]) return 'visited';
    return 'land';
  };
  const snap = (current: [number, number] | null, queue: [number, number][] | null): GridCellState[][] => {
    const qset = new Set((queue || []).map(([r, c]) => r + ',' + c));
    const g: GridCellState[][] = [];
    for (let r = 0; r < rows; r++) { const row: GridCellState[] = []; for (let c = 0; c < cols; c++) row.push(classify(r, c, current, qset)); g.push(row); }
    return g;
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1' && !visited[r][c]) {
        count++;
        steps.push({ kind: 'grid', line: 'check', grid: snap([r, c], []), count, note: `(${r},${c}) is unvisited land → this is the start of a new island. Island count → ${count}.` });
        const queue: [number, number][] = [[r, c]]; visited[r][c] = true;
        steps.push({ kind: 'grid', line: 'bfsqueue', grid: snap(null, queue), count, note: `Mark (${r},${c}) visited and enqueue it — begin flooding outward from here.` });
        while (queue.length) {
          const [cr, cc] = queue.shift()!;
          steps.push({ kind: 'grid', line: 'bfspop', grid: snap([cr, cc], queue), count, note: `Dequeue (${cr},${cc}) and check its 4 neighbors.` });
          for (const [dr, dc] of DIRS) {
            const nr = cr + dr, nc = cc + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === '1' && !visited[nr][nc]) {
              visited[nr][nc] = true;
              queue.push([nr, nc]);
              steps.push({ kind: 'grid', line: 'bfsmark', grid: snap([cr, cc], queue), count, note: `(${nr},${nc}) is land and unvisited → mark visited, enqueue it as part of the same island.` });
            }
          }
        }
      }
    }
  }
  steps.push({ kind: 'grid', line: 'ret', grid: snap(null, []), count, note: `Every cell scanned → ${count} islands total.` });
  return { lines, steps };
}

export function rottenOrangesTrace(grid: number[][]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function orangesRotting(grid) {' },
    { k: 'seed', t: '  let queue = allCellsWhere(v => v === 2);  // every rotten cell, minute 0' },
    { k: 'fresh', t: '  let fresh = countCellsWhere(v => v === 1);' },
    { k: 'loop', t: '  let minute = 0;' },
    { k: 'while', t: '  while (queue.length && fresh > 0) {' },
    { k: 'tick', t: '    minute++;  const layer = queue;  queue = [];' },
    { k: 'forlayer', t: '    for (const [r, c] of layer) {' },
    { k: 'dirs', t: '      for (const [dr, dc] of DIRS) {' },
    { k: 'infect', t: '        if (inBounds && grid[nr][nc] === 1) {' },
    { k: 'infectbody', t: '          grid[nr][nc] = 2;  fresh--;  queue.push([nr, nc]);' },
    { k: 'endif', t: '        }' },
    { k: 'endwhile', t: '  }' },
    { k: 'ret', t: '  return fresh > 0 ? -1 : minute;' },
    { k: 'end', t: '}' },
  ];
  const rows = grid.length, cols = grid[0].length;
  const g = grid.map((row) => row.slice());
  const steps: Trace['steps'] = [];
  let queue: [number, number][] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (g[r][c] === 2) queue.push([r, c]);
  let fresh = 0;
  for (const row of g) for (const v of row) if (v === 1) fresh++;
  const classify = (r: number, c: number, current: [number, number][] | null): GridCellState => {
    if (current && current.some(([cr, cc]) => cr === r && cc === c)) return 'current';
    if (g[r][c] === 0) return 'empty';
    if (g[r][c] === 2) return 'rotten';
    return 'fresh';
  };
  const snap = (current: [number, number][] | null): GridCellState[][] => {
    const g2: GridCellState[][] = [];
    for (let r = 0; r < rows; r++) { const row: GridCellState[] = []; for (let c = 0; c < cols; c++) row.push(classify(r, c, current)); g2.push(row); }
    return g2;
  };
  let minute = 0;
  steps.push({ kind: 'grid', line: 'seed', grid: snap(queue), minute, note: `Minute 0: every already-rotten orange (${queue.length}) is a source — all start in the queue together.` });
  while (queue.length && fresh > 0) {
    minute++;
    const layer = queue; queue = [];
    steps.push({ kind: 'grid', line: 'tick', grid: snap(layer), minute, note: `Minute ${minute}: rot spreads outward from all ${layer.length} orange(s) in the current layer at once — this is what makes it multi-source BFS.` });
    for (const [r, c] of layer) {
      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && g[nr][nc] === 1) {
          g[nr][nc] = 2; fresh--; queue.push([nr, nc]);
          steps.push({ kind: 'grid', line: 'infectbody', grid: snap(queue), minute, note: `(${nr},${nc}) turns rotten at minute ${minute}. ${fresh} fresh orange(s) left.` });
        }
      }
    }
  }
  steps.push({ kind: 'grid', line: 'ret', grid: snap(null), minute, note: fresh > 0 ? `${fresh} orange(s) can never be reached → return -1.` : `All oranges rotten by minute ${minute} → return ${minute}.` });
  return { lines, steps };
}

export function courseScheduleTrace(n: number, prereqs: [number, number][]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function canFinish(n, prereqs) {' },
    { k: 'build', t: '  const indeg = new Array(n).fill(0), adj = Array.from({length:n}, () => []);' },
    { k: 'buildloop', t: '  for (const [course, needs] of prereqs) { adj[needs].push(course); indeg[course]++; }' },
    { k: 'seed', t: '  const queue = [...Array(n).keys()].filter(i => indeg[i] === 0);' },
    { k: 'order', t: '  const order = [];' },
    { k: 'while', t: '  while (queue.length) {' },
    { k: 'pop', t: '    const node = queue.shift();  order.push(node);' },
    { k: 'fornext', t: '    for (const next of adj[node]) {' },
    { k: 'dec', t: '      if (--indeg[next] === 0) queue.push(next);' },
    { k: 'endfor', t: '    }' },
    { k: 'endwhile', t: '  }' },
    { k: 'ret', t: '  return order.length === n;   // false ⇒ a cycle blocks completion' },
    { k: 'end', t: '}' },
  ];
  const indeg = new Array(n).fill(0);
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [course, needs] of prereqs) { adj[needs].push(course); indeg[course]++; }
  const steps: Trace['steps'] = [];
  const nodesFor = (queue: number[], order: number[], current: number | null) => {
    const qs = new Set(queue);
    const out = [];
    for (let i = 0; i < n; i++) {
      let st: '' | 'current' | 'frontier' | 'done' = '';
      if (order.includes(i)) st = 'done';
      else if (current === i) st = 'current';
      else if (qs.has(i)) st = 'frontier';
      out.push({ id: i, label: `indeg ${indeg[i]}`, state: st });
    }
    return out;
  };
  const panelsFor = (queue: number[], order: number[]) => ([
    { label: 'queue', items: queue.map((q) => ({ text: String(q), hot: true })) },
    { label: 'order', items: order.map((q) => ({ text: String(q), hot: false })) },
  ]);
  const adjHtml = adj.map((list, i) => `${i} → [${list.join(', ')}]`).join('<br>');
  steps.push({ kind: 'nodes', line: 'buildloop', nodes: nodesFor([], [], null), panels: panelsFor([], []), adjHtml, note: `Build indegree (unmet prerequisite count) and an adjacency list from the ${prereqs.length} prerequisite pairs.` });
  const queue: number[] = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);
  steps.push({ kind: 'nodes', line: 'seed', nodes: nodesFor(queue, [], null), panels: panelsFor(queue, []), adjHtml, note: `Courses with indegree 0 need nothing first — they seed the queue: [${queue.join(', ')}].` });
  const order: number[] = [];
  while (queue.length) {
    const node = queue.shift()!;
    order.push(node);
    steps.push({ kind: 'nodes', line: 'pop', nodes: nodesFor(queue, order, node), panels: panelsFor(queue, order), adjHtml, note: `Take course ${node} — every prerequisite it had is already done.` });
    for (const next of adj[node]) {
      indeg[next]--;
      steps.push({ kind: 'nodes', line: 'dec', nodes: nodesFor(queue, order, node), panels: panelsFor(queue, order), adjHtml, note: `Course ${next} no longer needs course ${node} → its indegree drops to ${indeg[next]}${indeg[next] === 0 ? `. It hits 0 → enqueue it.` : '.'}` });
      if (indeg[next] === 0) queue.push(next);
    }
  }
  steps.push({ kind: 'nodes', line: 'ret', nodes: nodesFor(queue, order, null), panels: panelsFor(queue, order), adjHtml, note: order.length === n ? `All ${n} courses ordered → a valid schedule exists: [${order.join(' → ')}].` : `Only ${order.length}/${n} courses could be ordered → the rest form a cycle, so it's impossible.` });
  return { lines, steps };
}

export function networkDelayTrace(times: [number, number, number][], n: number, k: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function networkDelayTime(times, n, k) {' },
    { k: 'alloc', t: '  const dist = new Array(n + 1).fill(Infinity);  dist[k] = 0;' },
    { k: 'adj', t: '  const adj = Array.from({length:n+1}, () => []);' },
    { k: 'buildadj', t: '  for (const [u, v, w] of times) adj[u].push([v, w]);' },
    { k: 'loop', t: '  for (let iter = 0; iter < n; iter++) {' },
    { k: 'pick', t: '    const u = closestUnvisitedNode(dist);   // swap for a min-heap when sparse' },
    { k: 'visit', t: '    visited[u] = true;' },
    { k: 'relaxloop', t: '    for (const [v, w] of adj[u]) {' },
    { k: 'relax', t: '      if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;' },
    { k: 'endrelax', t: '    }' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return Math.max(...dist.slice(1)) === Infinity ? -1 : Math.max(...dist.slice(1));' },
    { k: 'end', t: '}' },
  ];
  const dist = new Array(n + 1).fill(Infinity); dist[k] = 0;
  const visited = new Array(n + 1).fill(false);
  const adj: [number, number][][] = Array.from({ length: n + 1 }, () => []);
  for (const [u, v, w] of times) adj[u].push([v, w]);
  const steps: Trace['steps'] = [];
  const nodesFor = (current: number | null) => {
    const out = [];
    for (let i = 1; i <= n; i++) out.push({ id: i, label: `dist ${dist[i] === Infinity ? '∞' : dist[i]}`, state: (current === i ? 'current' : (visited[i] ? 'done' : '')) as '' | 'current' | 'done' });
    return out;
  };
  const panelsFor = () => ([{ label: 'settled', items: [...Array(n).keys()].map((i) => i + 1).filter((i) => visited[i]).map((i) => ({ text: String(i), hot: false })) }]);
  const adjHtml = adj.slice(1).map((list, i) => `${i + 1} → [${list.map(([v, w]) => `${v}(w=${w})`).join(', ')}]`).join('<br>');
  steps.push({ kind: 'nodes', line: 'buildadj', nodes: nodesFor(null), panels: panelsFor(), adjHtml, note: `Start all distances at ∞ except the source (node ${k} = 0), and build a weighted adjacency list.` });
  for (let iter = 0; iter < n; iter++) {
    let u = -1;
    for (let i = 1; i <= n; i++) if (!visited[i] && (u === -1 || dist[i] < dist[u])) u = i;
    if (u === -1 || dist[u] === Infinity) break;
    steps.push({ kind: 'nodes', line: 'pick', nodes: nodesFor(u), panels: panelsFor(), adjHtml, note: `Among unvisited nodes, ${u} has the smallest known distance (${dist[u]}) — it can never improve later, so finalize it.` });
    visited[u] = true;
    for (const [v, w] of adj[u]) {
      const before = dist[v];
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        steps.push({ kind: 'nodes', line: 'relax', nodes: nodesFor(u), panels: panelsFor(), adjHtml, note: `Edge ${u}→${v} (weight ${w}): ${dist[u]}+${w}=${dist[u] + w} beats ${before === Infinity ? '∞' : before} → dist[${v}] updates to ${dist[v]}.` });
      }
    }
  }
  const answer = Math.max(...dist.slice(1));
  steps.push({ kind: 'nodes', line: 'ret', nodes: nodesFor(null), panels: panelsFor(), adjHtml, note: answer === Infinity ? 'Some node is unreachable from the source → return -1.' : `Every node is reached; the slowest one took ${answer} — that's the signal delay time.` });
  return { lines, steps };
}

export function redundantConnectionTrace(edges: [number, number][]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function findRedundantConnection(edges) {' },
    { k: 'alloc', t: '  const parent = new Array(edges.length + 1).fill(0).map((_, i) => i);' },
    { k: 'find', t: '  function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }' },
    { k: 'union', t: '  function union(x, y) { parent[find(x)] = find(y); }' },
    { k: 'loop', t: '  for (const [u, v] of edges) {' },
    { k: 'check', t: '    if (find(u) === find(v)) return [u, v];   // already connected → this edge closes a cycle' },
    { k: 'do-union', t: '    union(u, v);' },
    { k: 'endloop', t: '  }' },
    { k: 'end', t: '}' },
  ];
  const n = edges.length;
  const parent = new Array(n + 1).fill(0).map((_, i) => i);
  function find(x: number): number { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
  const steps: Trace['steps'] = [];
  const nodesFor = (highlight: number[] | null) => {
    const out = [];
    for (let i = 1; i <= n; i++) out.push({ id: i, label: `root ${find(i)}`, state: (highlight && highlight.includes(i) ? 'current' : '') as '' | 'current' });
    return out;
  };
  const processed: [number, number][] = [];
  const panelsFor = () => ([{ label: 'edges processed', items: processed.map((p) => ({ text: `${p[0]}–${p[1]}`, hot: false })) }]);
  steps.push({ kind: 'nodes', line: 'alloc', nodes: nodesFor(null), panels: panelsFor(), note: `Each of the ${n} nodes starts as its own root — no unions yet.` });
  for (const [u, v] of edges) {
    const ru = find(u), rv = find(v);
    steps.push({ kind: 'nodes', line: 'check', nodes: nodesFor([u, v]), panels: panelsFor(), note: `Edge ${u}–${v}: root(${u})=${ru}, root(${v})=${rv}.${ru === rv ? ' Same root → they were already connected → this edge is redundant.' : ' Different roots → safe to connect.'}` });
    if (ru === rv) {
      steps.push({ kind: 'nodes', line: 'check', nodes: nodesFor([u, v]), panels: panelsFor(), note: `[${u}, ${v}] is the extra edge — remove it and the graph is a tree.` });
      break;
    }
    parent[ru] = rv;
    processed.push([u, v]);
    steps.push({ kind: 'nodes', line: 'do-union', nodes: nodesFor([u, v]), panels: panelsFor(), note: `union(${u}, ${v}): root ${ru} now points to root ${rv}.` });
  }
  return { lines, steps };
}
