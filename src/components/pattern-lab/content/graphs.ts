import type { Pattern } from '../types';
import { islandsTrace, rottenOrangesTrace, courseScheduleTrace, networkDelayTrace, redundantConnectionTrace } from '../traceBuilders';

export const graphsPattern: Pattern = {
  id: 'graphs',
  label: 'Graphs',
  short: 'Graphs',
  accent: '#0f8f83',
  accentDark: '#4fd6c6',
  blurb: 'Model relationships as nodes and edges, then traverse, detect cycles, or order them to answer questions about connectivity and dependency.',
  recurrenceGeneral: 'visit(node):  mark visited\n  for neighbor of adj[node]:\n    if !visited[neighbor]: visit(neighbor)',

  levels: [
    {
      tier: 'simple',
      tag: 'the basics',
      learnHeading: 'What a graph traversal actually does',
      learnBody:
        'A graph is just things (nodes) and the connections between them (edges). To explore one, you start at a node, move along its edges to its neighbors, and keep track of where you\'ve already been so you don\'t go in circles. That\'s the whole idea — every graph algorithm on this page is a variation of "visit a node, look at its neighbors, decide what to do next."',
      learnFocus: [
        'Nodes + edges = the whole model.',
        'Track visited nodes so you don\'t loop forever.',
        'A grid you move up/down/left/right in is a graph in disguise.',
      ],
      cues: [
        'entities with connections: "neighbors", "adjacent", "friends of"',
        'a grid you move through up/down/left/right — grids are graphs in disguise',
      ],
      examples: [
        { snippet: '"...an m x n grid of \'1\'s (land) and \'0\'s (water). <b>Count the number of islands.</b>"', tell: 'A grid plus <b>"count the groups"</b> is a connected-components question — flood-fill each unvisited patch.' },
      ],
    },
    {
      tier: 'easy',
      tag: 'BFS vs DFS',
      learnHeading: 'BFS vs. DFS, and how you represent the graph',
      learnBody:
        'Represent the graph as an adjacency list (each node\'s array of neighbors) or, for a grid, just the grid itself. Two ways to explore it: BFS uses a queue and explores level-by-level — it\'s the only one that guarantees the shortest path when every edge costs the same. DFS uses a stack (or recursion) and goes as deep as possible before backing up — usually simpler when you just need to know if a path exists, or to count connected groups.',
      learnFocus: [
        'Adjacency list: adj[u] = neighbors of u.',
        'BFS = queue = shortest path on equal-cost edges.',
        'DFS = stack/recursion = simpler existence/counting questions.',
      ],
      cues: [
        '"connected group / province / island / cluster" → count components',
        '"prerequisite", "depends on", "must happen before" → ordering',
      ],
      examples: [
        { snippet: '"Every minute, <b>any fresh orange adjacent to a rotten orange</b> becomes rotten."', tell: 'Spreads to neighbors simultaneously, from more than one source at once → multi-source BFS, layer by layer.' },
      ],
    },
    {
      tier: 'medium',
      tag: 'direction & weight',
      learnHeading: 'Direction, weight, and cycles change the question',
      learnBody:
        'Three properties of the graph change which tool you reach for. Directed vs. undirected changes whether an edge goes one way or both. Weighted vs. unweighted decides whether plain BFS still gives the shortest path — it doesn\'t, once edges cost different amounts. And whether the graph can contain a cycle decides if you need to actively detect one: a "find a valid order" question over a directed graph is really asking "is this a DAG", which is exactly what topological sort answers.',
      learnFocus: [
        'Directed edges only go one way — build the adjacency list accordingly.',
        'Weighted edges break plain BFS\'s shortest-path guarantee.',
        '"Prerequisite / order" over a directed graph = cycle detection + topological sort.',
      ],
      cues: [
        'need the shortest path where every edge costs the same → BFS',
        'need to know if a cycle exists before something can complete',
      ],
      confuse:
        '<b>BFS vs. DFS:</b> BFS explores level-by-level and is the only one that guarantees the shortest path on an unweighted graph. DFS goes deep first and is usually simpler for "does a path exist" or component-counting questions where distance doesn\'t matter. If edges have different weights, neither plain one works — that\'s Dijkstra.',
      examples: [
        { snippet: '"To take course a you have to first take course b... return the order, or <b>false</b> if impossible."', tell: '<b>"must happen before"</b> is a dependency, and "impossible" hints at cycle detection → topological sort.' },
      ],
    },
    {
      tier: 'hard',
      tag: 'the hard parts',
      learnHeading: 'Where it actually gets hard',
      learnBody:
        'Past basic traversal, the harder graph problems mix techniques: Dijkstra for weighted shortest paths (and knowing when a plain array scan is fine vs. when you need a heap), Union-Find for "are these already connected?" questions that arrive one edge at a time instead of all at once, and disguised graphs — word transformations, state-space search, puzzle solving — where the "nodes" are never handed to you as a literal graph and you have to define what a neighbor even means. The real skill at this level is recognizing the graph hiding inside a problem that never says the word "graph."',
      learnFocus: [
        'Dijkstra when edges are weighted; add a heap once the graph is sparse.',
        'Union-Find beats re-running BFS when edges arrive one at a time.',
        'The hardest part is often just noticing a graph is there at all.',
      ],
      cues: [
        'edges carry an explicit cost/weight/time → Dijkstra, not plain BFS',
        'edges arrive one at a time and you only need "already connected?" → Union-Find',
      ],
      examples: [
        { snippet: '"times[i] = (u, v, w) means it takes <b>w</b> time to travel from u to v."', tell: 'An explicit travel cost on each edge rules out plain BFS — weighted edges need Dijkstra.' },
        { snippet: '"Edges are added one at a time; find the edge that, if removed, leaves a tree."', tell: 'One edge processed at a time plus "are these already connected?" is the Union-Find signature.' },
      ],
    },
  ],

  variants: [
    {
      id: 'num-islands',
      label: 'Number of Islands',
      short: 'grid · components',
      difficulty: 'simple',
      statement: 'Count the connected groups of land (<b>1</b>s) in this 5×5 grid of land and water.',
      recurrence: 'For every unvisited "1": count++ and flood-fill (BFS) the whole connected patch to visited.',
      complexity: 'O(rows × cols) time and space',
      twist: 'The grid is just an unweighted graph where each cell has up to 4 edges to its neighbors — flood-fill is BFS wearing a grid costume.',
      viz: 'grid',
      trace: () => islandsTrace([
        ['1', '1', '0', '0', '0'],
        ['1', '1', '0', '0', '0'],
        ['0', '0', '1', '0', '0'],
        ['0', '0', '0', '1', '1'],
        ['0', '0', '0', '1', '1'],
      ]),
    },
    {
      id: 'rotting-oranges',
      label: 'Rotting Oranges',
      short: 'grid · multi-source BFS',
      difficulty: 'easy',
      statement: 'Rot spreads one minute at a time to orthogonal neighbors. How many minutes until every orange rots?',
      recurrence: 'Seed the queue with ALL rotten cells at once; each BFS layer = one minute.',
      complexity: 'O(rows × cols) time and space',
      twist: 'Multiple starting points enter the queue in the same step — the layer-by-layer BFS boundary doubles as the minute counter.',
      viz: 'grid',
      trace: () => rottenOrangesTrace([
        [2, 1, 1, 0],
        [1, 1, 0, 1],
        [0, 1, 1, 1],
      ]),
    },
    {
      id: 'course-schedule',
      label: 'Course Schedule',
      short: 'DAG · topological sort',
      difficulty: 'medium',
      statement: '6 courses, prerequisites <b>1←0, 2←0, 3←1, 3←2, 4←3, 5←3</b>. Can all courses be finished, and in what order?',
      recurrence: "Kahn's algorithm: repeatedly take a node with indegree 0, then decrement its neighbors' indegree.",
      complexity: 'O(V + E) time · O(V + E) space',
      twist: 'If the queue empties before every node is processed, the leftover nodes form a cycle — that\'s how you detect "impossible" schedules.',
      viz: 'nodes',
      trace: () => courseScheduleTrace(6, [[1, 0], [2, 0], [3, 1], [3, 2], [4, 3], [5, 3]]),
    },
    {
      id: 'network-delay',
      label: 'Network Delay Time',
      short: 'weighted · shortest path',
      difficulty: 'hard',
      statement: 'A signal starts at node <b>1</b>. Edges have travel times. How long until every one of the 5 nodes has received it?',
      recurrence: "Dijkstra: repeatedly finalize the closest unvisited node, then relax its outgoing edges.",
      complexity: 'O(V²) time here (O((V+E) log V) with a min-heap) · O(V + E) space',
      twist: 'Plain BFS only works when every edge costs the same. The moment edges are weighted, "fewest hops" stops meaning "fastest" — that\'s when you need Dijkstra.',
      viz: 'nodes',
      trace: () => networkDelayTrace([[1, 2, 1], [1, 3, 4], [2, 3, 2], [2, 4, 7], [3, 4, 1], [4, 5, 2]], 5, 1),
    },
    {
      id: 'redundant-connection',
      label: 'Redundant Connection',
      short: 'union-find · cycle detection',
      difficulty: 'hard',
      statement: 'A tree of 5 nodes got one extra edge, creating exactly one cycle. Given the edges in order, find the extra one.',
      recurrence: 'For each edge (u, v): if find(u) === find(v) it\'s redundant, else union(u, v).',
      complexity: 'O(n α(n)) time (near O(n)) · O(n) space',
      twist: 'No traversal at all — Union-Find answers "are these already connected?" in near O(1), which makes it the sharper tool whenever edges arrive one at a time.',
      viz: 'nodes',
      trace: () => redundantConnectionTrace([[1, 2], [2, 3], [3, 1], [1, 4], [4, 5]]),
    },
  ],

  syntax: [
    { title: 'Adjacency list from an edge list', code: 'const adj = Array.from({length: n}, () => []);\nfor (const [u, v] of edges) {\n  adj[u].push(v);\n  adj[v].push(u); // omit for a directed graph\n}', note: 'That one extra line is the entire difference between modeling a directed and an undirected graph.' },
    { title: 'Set/Map visited, not an array', code: 'const visited = new Set();\nvisited.add(node);\nif (!visited.has(neighbor)) {\n  queue.push(neighbor);\n}', note: 'Reach for this when nodes are strings, objects, or coordinates — anything that isn\'t a small dense integer index.' },
    { title: 'Iterative DFS, explicit stack', code: 'const stack = [start];\nconst visited = new Set([start]);\nwhile (stack.length) {\n  const node = stack.pop();\n  for (const next of adj[node]) {\n    if (!visited.has(next)) {\n      visited.add(next);\n      stack.push(next);\n    }\n  }\n}', note: 'Same traversal as recursive DFS, but it won\'t blow the call stack on a graph that\'s thousands of nodes deep.' },
    { title: 'Union-Find with path compression', code: 'function find(x) {\n  while (parent[x] !== x) {\n    parent[x] = parent[parent[x]];\n    x = parent[x];\n  }\n  return x;\n}\nfunction union(x, y) {\n  parent[find(x)] = find(y);\n}', note: 'The fastest way to answer "are these two already connected?" while edges are being added one at a time.' },
    { title: 'Dijkstra with a min-heap', code: 'heap.push([0, source]);\nwhile (!heap.isEmpty()) {\n  const [d, u] = heap.pop();\n  if (d > dist[u]) continue; // stale entry\n  for (const [v, w] of adj[u]) {\n    if (d + w < dist[v]) {\n      dist[v] = d + w;\n      heap.push([d + w, v]);\n    }\n  }\n}', note: 'Swap the O(n²) "scan for the minimum" loop for a heap once the graph is sparse — same algorithm, just faster.' },
    { title: 'Grid cell as a hashable key', code: 'const key = r * cols + c;\n// or: const key = `${r},${c}`;\nvisited.add(key);', note: 'A Set can\'t hash an [r, c] array by value — encode the coordinate as a single number or string first.' },
  ],
};
