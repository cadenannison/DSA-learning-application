import type { Pattern } from '../types';
import { floodFillTrace, pathSumTrace, shortestPathBinaryMatrixTrace, cloneGraphTrace, wordLadderTrace } from '../traceBuilders';

export const bfsDfsPattern: Pattern = {
  id: 'bfs-dfs',
  label: 'BFS / DFS',
  short: 'BFS / DFS',
  accent: '#3f6fb0',
  accentDark: '#8ab4f0',
  blurb: 'Systematically visit every node reachable from a starting point — level by level with a queue, or as deep as possible with recursion — while never revisiting one twice.',
  recurrenceGeneral: 'BFS(start):\n  queue=[start]; visited={start}\n  while queue: node=dequeue; for neighbor: if unvisited, enqueue\n\nDFS(node):\n  mark visited\n  for neighbor: if unvisited, recurse',

  levels: [
    {
      tier: 'simple',
      tag: 'the basics',
      learnHeading: 'What traversal actually does',
      learnBody:
        'A traversal visits a node, looks at what\'s reachable from it — its neighbors, its children, the cells next to it — and decides what to do with each one. The one rule that makes this work at all: never revisit a node you\'ve already handled, or you\'ll loop forever. Every BFS and DFS on this page is that same idea, just with a different order of "what do I look at next."',
      learnFocus: [
        'Visit a node, then look at what\'s reachable from it.',
        'Track visited nodes so you never process the same one twice.',
        'A tree, a grid, and a graph are all "things connected to other things" — same idea, different shape.',
      ],
      cues: [
        '"visit every node/cell reachable from...", "explore all connected..."',
        'a tree you walk down, or a grid you move through cell by cell',
      ],
      examples: [
        { snippet: '"Starting from cell (sr, sc), <b>fill every connected pixel</b> that shares its color."', tell: '"Connected" + "fill" is a flood-fill traversal — visit a cell, spread to its unvisited same-colored neighbors.' },
      ],
    },
    {
      tier: 'easy',
      tag: 'BFS vs DFS',
      learnHeading: 'BFS (queue) vs. DFS (stack/recursion)',
      learnBody:
        'BFS uses a queue and explores level by level — everything at distance 1 from the start, then everything at distance 2, and so on. That layer-by-layer order is exactly why BFS gives the shortest path (fewest steps) once every edge costs the same. DFS uses a stack, or just recursion, and commits to going as deep as possible before backing up. It\'s usually the simpler tool when you don\'t care about distance — you just need to know "does a path exist," or you want to explore every path (backtracking).',
      learnFocus: [
        'BFS = queue = level-by-level = shortest path on equal-weight edges.',
        'DFS = stack/recursion = goes deep first = simpler for existence / all-paths / backtracking.',
        'Both visit the same set of nodes eventually — only the order differs.',
      ],
      cues: [
        '"fewest steps", "shortest transformation", "minimum moves" → BFS',
        '"does a path exist", "all possible paths", "sum along a path" → DFS',
      ],
      confuse:
        '<b>BFS vs. DFS:</b> pick BFS whenever the question wants the SHORTEST path or fewest steps on unweighted edges — its queue explores in strict distance order, so the first time you reach a target is guaranteed the shortest way there. Pick DFS when you just need to know a path exists, want to enumerate all paths, or you\'re naturally recursing through a structure like a tree (backtracking). Using DFS for a "shortest path" question can find *a* path, but not necessarily the shortest one.',
      examples: [
        { snippet: '"Return the length of the <b>shortest transformation sequence</b> from beginWord to endWord."', tell: '"Shortest" on a graph where every step (one letter change) costs the same is the BFS signature.' },
      ],
    },
    {
      tier: 'medium',
      tag: 'grids & layers',
      learnHeading: 'A grid is a graph with implicit edges',
      learnBody:
        'Nothing hands you an adjacency list for a grid — you generate it on the fly: each cell has up to 4 neighbors (orthogonal) or up to 8 (if diagonals count), and "in bounds + not an obstacle + not visited" is the edge-exists check. The other medium-level pattern to recognize: BFS starting from more than one cell at once — a "multi-source" or "layered" BFS, where every layer of the queue represents everyone reached at the same distance, simultaneously.',
      learnFocus: [
        '4-directional vs. 8-directional changes only the neighbor list, nothing else about the algorithm.',
        'Seed the BFS queue with ALL sources at once for a "spreads simultaneously" problem.',
        'The visited/distance grid you build alongside the input is doing the same job a Set does for a graph.',
      ],
      cues: [
        '"moving up/down/left/right", "in any of 8 directions" → grid BFS/DFS with implicit edges',
        'multiple starting points that spread "at the same time" → multi-source, layered BFS',
      ],
      examples: [
        { snippet: '"You may move up, down, left, right, or <b>diagonally</b>."', tell: 'Diagonal movement means 8 neighbors instead of 4 — same BFS, bigger neighbor list.' },
      ],
    },
    {
      tier: 'hard',
      tag: 'disguised graphs',
      learnHeading: 'When the graph is never handed to you',
      learnBody:
        'The hardest traversal problems don\'t say the word "graph" anywhere. A word is a node; changing one letter is an edge. A game state is a node; a legal move is an edge. Nothing about the input looks like a grid or an adjacency list — you have to notice the graph hiding inside the problem and define what a "neighbor" even means before you can traverse anything. And because these implicit graphs are rarely trees, they can contain cycles: a visited Set (not an array, since nodes are often strings or objects) is what keeps the traversal from looping forever once you\'re past simple parent-child structures.',
      learnFocus: [
        'Ask "what\'s a node, and what\'s an edge?" before writing any traversal code.',
        'Once the graph isn\'t a tree, cycles are possible — a visited Set is non-negotiable.',
        'State-space search (word ladders, puzzle solving) is BFS/DFS with the graph defined implicitly.',
      ],
      cues: [
        '"change one letter at a time", "each move must be...", transformations between states',
        'a graph that can contain a cycle → visited tracking matters, not optional',
      ],
      examples: [
        { snippet: '"Given adjList[i] is a list of node i\'s neighbors... <b>return a deep copy</b> of the graph."', tell: 'Copying a graph that may contain a cycle means remembering what you\'ve already cloned — a visited map keyed by the original node.' },
      ],
    },
  ],

  variants: [
    {
      id: 'flood-fill',
      label: 'Flood Fill',
      short: 'grid · DFS',
      difficulty: 'simple',
      statement: 'A 3×3 image, starting pixel (<b>sr=1, sc=1</b>), new color <b>2</b>. Fill every pixel connected to the start that shares its color.',
      recurrence: 'dfs(r, c): if out of bounds or the color doesn\'t match the start color, stop; otherwise paint the cell and recurse into all 4 neighbors.',
      complexity: 'O(rows × cols) time and space',
      twist: 'This is DFS wearing a grid costume — "connected pixels of the same color" is just "reachable nodes," with 4 implicit edges per cell.',
      viz: 'grid',
      trace: () => floodFillTrace([[1, 1, 1], [1, 1, 0], [1, 0, 1]], 1, 1, 2),
    },
    {
      id: 'path-sum',
      label: 'Path Sum',
      short: 'tree · DFS backtrack',
      difficulty: 'easy',
      statement: 'Given this binary tree, does any root-to-leaf path sum to exactly <b>22</b>?',
      recurrence: 'DFS down the tree, subtracting each node\'s value from the running target; at a leaf, check whether the node\'s value hits the remaining target exactly.',
      complexity: 'O(n) time · O(h) space for the call stack',
      twist: 'No queue, no adjacency list — the "graph" here is just parent→child pointers, and DFS naturally backtracks the running sum the moment a branch doesn\'t pan out.',
      viz: 'nodes',
      trace: () => pathSumTrace(22),
    },
    {
      id: 'shortest-binary-matrix',
      label: 'Shortest Path in Binary Matrix',
      short: 'grid · 8-directional BFS',
      difficulty: 'medium',
      statement: 'In this 3×3 grid of open (0) and blocked (1) cells, what\'s the shortest path from the top-left to the bottom-right, moving in any of <b>8 directions</b>?',
      recurrence: 'BFS from (0,0); each layer of the queue is one more step; the first time the bottom-right cell is dequeued, its distance is the answer.',
      complexity: 'O(rows × cols) time and space',
      twist: 'The only thing that changes from a 4-directional grid BFS is the neighbor list — diagonals count too, and "shortest" only means anything because every move costs 1.',
      viz: 'grid',
      trace: () => shortestPathBinaryMatrixTrace([[0, 0, 0], [1, 1, 0], [1, 1, 0]]),
    },
    {
      id: 'clone-graph',
      label: 'Clone Graph',
      short: 'graph · DFS + visited map',
      difficulty: 'hard',
      statement: 'Given a connected undirected graph — 4 nodes wired into a single cycle, each connected to its two neighbors — return a deep copy of it.',
      recurrence: 'DFS from any node; before recursing into a neighbor, check a visited map — if that neighbor is already being (or already was) cloned, reuse the existing clone instead of recursing again.',
      complexity: 'O(V + E) time and space',
      twist: 'This graph has a cycle — recurse without a visited check and DFS never terminates. The visited map is what makes traversal safe once the graph isn\'t a tree.',
      viz: 'nodes',
      trace: () => cloneGraphTrace([[2, 4], [1, 3], [2, 4], [1, 3]]),
    },
    {
      id: 'word-ladder',
      label: 'Word Ladder',
      short: 'implicit graph · layered BFS',
      difficulty: 'hard',
      statement: 'Transform <b>"hit"</b> into <b>"cog"</b>, changing one letter at a time, with every intermediate word required to be in <b>[hot, dot, dog, lot, log, cog]</b>. What\'s the shortest transformation length?',
      recurrence: 'BFS where a "neighbor" of a word is any other word in the list exactly one letter different from it; layer-by-layer BFS gives the shortest sequence length.',
      complexity: 'O(N × L) to find neighbors per word (N = word count, L = word length) · O(N) BFS space',
      twist: 'Nobody hands you an adjacency list — the graph is implicit in "one letter apart," and you have to define what a neighbor even means before you can BFS at all.',
      viz: 'nodes',
      trace: () => wordLadderTrace('hit', 'cog', ['hot', 'dot', 'dog', 'lot', 'log', 'cog']),
    },
  ],

  syntax: [
    { title: 'Iterative BFS with a queue', code: 'const queue = [start];\nconst visited = new Set([start]);\nwhile (queue.length) {\n  const node = queue.shift();\n  for (const next of adj[node]) {\n    if (!visited.has(next)) {\n      visited.add(next);\n      queue.push(next);\n    }\n  }\n}', note: 'Mark a node visited the moment it\'s enqueued, not when it\'s dequeued — otherwise the same node can be pushed twice before it\'s ever processed.' },
    { title: 'Recursive DFS', code: 'function dfs(node, visited = new Set()) {\n  if (visited.has(node)) return;\n  visited.add(node);\n  for (const next of adj[node]) {\n    dfs(next, visited);\n  }\n}', note: 'The call stack does the job a stack normally would — clean for trees, but can blow the stack on a very deep or very large graph.' },
    { title: 'Iterative DFS, explicit stack', code: 'const stack = [start];\nconst visited = new Set([start]);\nwhile (stack.length) {\n  const node = stack.pop();\n  for (const next of adj[node]) {\n    if (!visited.has(next)) {\n      visited.add(next);\n      stack.push(next);\n    }\n  }\n}', note: 'Same traversal as recursive DFS, but it won\'t blow the call stack on a graph that\'s thousands of nodes deep.' },
    { title: 'Grid neighbor loop (4-directional)', code: 'const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];\nfor (const [dr, dc] of DIRS) {\n  const nr = r + dr, nc = c + dc;\n  if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {\n    // treat (nr, nc) as a neighbor\n  }\n}', note: 'Add the 4 diagonal deltas ([1,1],[1,-1],[-1,1],[-1,-1]) for 8-directional movement — nothing else about the traversal changes.' },
    { title: 'Visited Set for non-integer nodes', code: 'const visited = new Set();\nvisited.add(word);         // strings work directly\nvisited.add(`${r},${c}`);  // encode a coordinate as one key\nif (!visited.has(next)) { /* ... */ }', note: 'A plain array only works when nodes are small dense integers — words, objects, and coordinates all need a Set/Map keyed by a hashable value.' },
  ],
};
