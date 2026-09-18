import type { Pattern } from '../types';
import { treeInorderTrace, maxDepthTrace, levelOrderTrace, validateBSTTrace, lcaBSTTrace } from '../traceBuilders';

export const treesPattern: Pattern = {
  id: 'trees',
  label: 'Trees',
  short: 'Trees',
  accent: '#1f9e7a',
  accentDark: '#6fe0bd',
  blurb: 'A connected, cycle-free hierarchy of nodes with a single root — most tree problems boil down to combining an answer from a node\'s children with the node itself.',
  recurrenceGeneral: 'solve(node) = combine( node.val, solve(node.left), solve(node.right) )',

  levels: [
    {
      tier: 'simple',
      tag: 'the basics',
      learnHeading: 'What a tree actually is',
      learnBody:
        'A tree is nodes connected by edges, where every node has exactly one parent (except a single root, which has none) and no path ever loops back on itself — that "no cycles, one root" shape is what makes a tree a tree and not just a graph. To explore one, you visit a node and decide <b>when</b> to process it relative to its children: process it before them (preorder), between them (inorder), or after them (postorder). Those three orders are the entire vocabulary of "walking a tree" — everything else is what you do at each visit.',
      learnFocus: [
        'One root, no cycles, every other node has exactly one parent.',
        'Preorder / inorder / postorder = process the node before / between / after its children.',
        'A linked list is a tree with one child per node — trees generalize it.',
      ],
      cues: [
        'the problem hands you a "root" and nodes with left/right (or children) pointers',
        'the structure is explicitly described as hierarchical: parent/child, ancestor/descendant',
      ],
      examples: [
        { snippet: '"Given the <b>root</b> of a binary tree, return its <b>inorder traversal</b>."', tell: 'A named root plus a named traversal order is the most literal tree signal there is — walk left, self, right.' },
      ],
    },
    {
      tier: 'easy',
      tag: 'recursion is the tool',
      learnHeading: 'Recursion is the natural shape for a tree',
      learnBody:
        'Almost every tree problem is really: "compute something about this node, using the something I\'ve already computed about its children." That\'s postorder-shaped thinking even when nobody calls it postorder — recurse into left, recurse into right, then combine those two answers with the current node to produce this node\'s answer. Max depth, sum of values, whether the tree is balanced, whether two trees are identical — all the same shape: ask the children first, then answer for yourself.',
      learnFocus: [
        'The recursive call IS the traversal — you don\'t need a separate loop.',
        '"Compute for me using what my children already computed" = postorder-shaped, whether or not you push anything.',
        'Base case is almost always the null child: an empty subtree contributes the identity value (0, true, -Infinity, ...).',
      ],
      cues: [
        '"return the maximum/minimum/sum/height/diameter of the tree"',
        'the answer for a node clearly depends on the answer for its children first',
      ],
      examples: [
        { snippet: '"Given a binary tree, find its <b>maximum depth</b>."', tell: 'Depth of a node = 1 + the deeper of its two children\'s depths — you can\'t know it before you know theirs, so recurse down first.' },
      ],
    },
    {
      tier: 'medium',
      tag: 'BFS when depth matters',
      learnHeading: 'BFS / level-order: the tool for "by depth"',
      learnBody:
        'Recursion naturally answers "what\'s true about this subtree" — it has no built-in sense of how deep it currently is unless you thread a depth argument through. The moment a question is inherently about <b>depth or levels</b> — print each level, find the widest level, find the deepest node — a queue-based, level-by-level walk (BFS) is the more direct tool than DFS. Process a whole queue\'s worth of nodes (one level), enqueue their children, repeat; the queue\'s size right before each pass tells you exactly where one level ends and the next begins.',
      learnFocus: [
        'BFS = queue, level by level; DFS = recursion, subtree by subtree.',
        'Snapshot queue.length before the loop to know where a level ends.',
        'Reach for BFS specifically when the question is about depth/levels, not just "compute something."',
      ],
      cues: [
        '"level by level", "level order", "by depth", "row"',
        '"find the deepest/widest level" or "the last node at the last level"',
      ],
      confuse:
        '<b>Recursive DFS vs. iterative BFS on a tree:</b> DFS/recursion is usually simplest whenever the question is "combine info from my children" (depth, sum, balance, diameter) — you don\'t need to know which level you\'re on. BFS/queue is the right tool the instant the question is inherently about depth or levels itself: "print the tree level by level" or "find the deepest node" both signal BFS, because DFS would have to thread a depth counter through every call just to fake what BFS gets for free.',
      examples: [
        { snippet: '"Return the <b>level order traversal</b> of its nodes\' values. (i.e., from left to right, level by level)."', tell: '<b>"level by level"</b> is the unambiguous BFS signal — use a queue, not recursion.' },
      ],
    },
    {
      tier: 'hard',
      tag: 'passing state down',
      learnHeading: 'Passing state down, and BST-specific shortcuts',
      learnBody:
        'So far, information has flowed <b>up</b> from children to parent (return values). The harder tree problems flow information <b>down</b> instead: pass bounds, an ancestor list, or a running path as extra recursion arguments, so each node can answer using context only its ancestors know (e.g. "is this value still inside the range my ancestors constrained me to?"). Separately, a <b>binary search tree</b> earns its own bag of tricks: because left < node < right holds everywhere, you can often prune an entire subtree without even looking at it — going left when both targets are smaller, right when both are bigger — instead of exploring both sides like you would on a general tree.',
      learnFocus: [
        'Return values carry info UP; extra recursion parameters carry info DOWN.',
        'A BST\'s sorted-order property lets you skip whole subtrees instead of visiting both.',
        '"Validate a BST" needs a passed-down (lo, hi) range, not just "is each node bigger than its left child."',
      ],
      cues: [
        '"binary search tree" (BST) explicitly named → the sorted-order property is fair game',
        'the correct answer for a node depends on something above it in the tree, not just below',
      ],
      examples: [
        { snippet: '"Given the root of a binary tree, determine if it is a <b>valid binary search tree</b>."', tell: 'Checking "left child < node < right child" locally isn\'t enough — a node two levels down can still violate an ancestor\'s bound. Pass (lo, hi) down through the recursion. (A valid but pricier alternative: do a full inorder traversal and check the result is sorted.)' },
        { snippet: '"Find the <b>lowest common ancestor</b> of two nodes in a BST."', tell: 'On a general tree this needs a full search; on a BST the sorted property tells you which direction to go without exploring the other side at all.' },
      ],
    },
  ],

  variants: [
    {
      id: 'tree-inorder',
      label: 'Binary Tree Inorder Traversal',
      short: 'DFS · inorder',
      difficulty: 'simple',
      statement: 'Insert <b>4, 2, 6, 1, 3, 5, 7</b> into a BST, in that order. Return the inorder traversal of the result.',
      recurrence: 'inorder(node) = inorder(node.left), then node.val, then inorder(node.right).',
      complexity: 'O(n) time · O(h) space (recursion stack, h = tree height)',
      twist: 'The three DFS orders are all this same recursive shape — inorder just happens to visit a BST\'s values in sorted order, which is why it\'s the one worth memorizing first.',
      viz: 'nodes',
      trace: () => treeInorderTrace([4, 2, 6, 1, 3, 5, 7]),
    },
    {
      id: 'max-depth',
      label: 'Maximum Depth of Binary Tree',
      short: 'DFS · postorder-shaped',
      difficulty: 'easy',
      statement: 'Given the tree <b>[3,9,20,null,null,15,7]</b> (LeetCode array form), find its maximum depth.',
      recurrence: 'maxDepth(node) = 0 if node is null, else 1 + max(maxDepth(node.left), maxDepth(node.right)).',
      complexity: 'O(n) time · O(h) space',
      twist: 'You can\'t answer for a node until you\'ve answered for both children first — the recursive call has to bottom out and unwind before any node knows its own depth.',
      viz: 'nodes',
      trace: () => maxDepthTrace([3, 9, 20, null, null, 15, 7]),
    },
    {
      id: 'level-order',
      label: 'Binary Tree Level Order Traversal',
      short: 'BFS · by level',
      difficulty: 'medium',
      statement: 'Given the tree <b>[3,9,20,null,null,15,7]</b>, return its values level by level, left to right.',
      recurrence: 'Queue-based BFS: process everything currently in the queue as one level, enqueueing children for the next.',
      complexity: 'O(n) time · O(n) space (widest level, worst case)',
      twist: 'This is exactly the moment DFS stops being the simplest tool — "level by level" is a question about depth, and a queue answers it directly instead of threading a depth counter through every recursive call.',
      viz: 'nodes',
      trace: () => levelOrderTrace([3, 9, 20, null, null, 15, 7]),
    },
    {
      id: 'validate-bst',
      label: 'Validate Binary Search Tree',
      short: 'bound-passing recursion',
      difficulty: 'hard',
      statement: 'Is <b>[5,1,4,null,null,3,6]</b> a valid binary search tree?',
      recurrence: 'isValidBST(node, lo, hi) = true if node is null; else lo < node.val < hi AND both children pass down the tightened range.',
      complexity: 'O(n) time · O(h) space',
      twist: 'Node 3 looks fine against its immediate parent (4) — the violation only shows up once you pass root 5\'s range down two levels, which is exactly why a purely local "child < parent" check isn\'t enough.',
      viz: 'nodes',
      trace: () => validateBSTTrace([5, 1, 4, null, null, 3, 6]),
    },
    {
      id: 'lca-bst',
      label: 'Lowest Common Ancestor of a BST',
      short: 'BST · prune, don\'t explore',
      difficulty: 'hard',
      statement: 'In the BST <b>[6,2,8,0,4,7,9,null,null,3,5]</b>, find the lowest common ancestor of <b>p=2</b> and <b>q=8</b>.',
      recurrence: 'From the root: go left if both p,q < node.val; go right if both p,q > node.val; otherwise node is the LCA.',
      complexity: 'O(h) time · O(1) space (iterative)',
      twist: 'On a general tree this needs a full search of both paths from the root. A BST\'s sorted property tells you which single direction to go at every step, so you never even look at the other subtree.',
      viz: 'nodes',
      trace: () => lcaBSTTrace([6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 2, 8),
    },
  ],

  syntax: [
    {
      title: 'Recursive traversal skeleton',
      code: 'function dfs(node) {\n  if (!node) return;      // base case: empty subtree\n  // preorder work here\n  dfs(node.left);\n  // inorder work here\n  dfs(node.right);\n  // postorder work here\n}',
      note: 'One skeleton, three orders — where you put your line of work relative to the two recursive calls decides pre/in/postorder.',
    },
    {
      title: 'Node shape',
      code: 'interface TreeNode {\n  val: number;\n  left: TreeNode | null;\n  right: TreeNode | null;\n}',
      note: 'Everything below assumes this shape. A null child is the base case for every recursive tree function.',
    },
    {
      title: 'Iterative inorder, explicit stack',
      code: 'const stack = [];\nlet node = root, out = [];\nwhile (node || stack.length) {\n  while (node) { stack.push(node); node = node.left; }\n  node = stack.pop();\n  out.push(node.val);\n  node = node.right;\n}',
      note: 'Simulates the recursion\'s call stack by hand — walk all the way left, visit, then step right and repeat. Avoids recursion depth limits on very deep/unbalanced trees.',
    },
    {
      title: 'BFS level order, with the level-boundary trick',
      code: 'let queue = [root];\nconst levels = [];\nwhile (queue.length) {\n  const level = [];\n  for (let i = 0, len = queue.length; i < len; i++) {\n    const node = queue[i];\n    level.push(node.val);\n    if (node.left) queue.push(node.left);\n    if (node.right) queue.push(node.right);\n  }\n  queue = queue.slice(level.length);\n  levels.push(level);\n}',
      note: 'Snapshotting `queue.length` into `len` before the loop is what separates "this level" from the children you\'re about to enqueue for the next one.',
    },
    {
      title: 'Top-down bound-passing (BST validation)',
      code: 'function isValidBST(node, lo = -Infinity, hi = Infinity) {\n  if (!node) return true;\n  if (node.val <= lo || node.val >= hi) return false;\n  return isValidBST(node.left, lo, node.val)\n      && isValidBST(node.right, node.val, hi);\n}',
      note: 'The extra (lo, hi) parameters carry information DOWN from ancestors — the piece a plain "compare to my children" check can\'t see.',
    },
    {
      title: 'BST search direction (no need to explore both sides)',
      code: 'let node = root;\nwhile (node) {\n  if (target < node.val) node = node.left;\n  else if (target > node.val) node = node.right;\n  else break;   // found it\n}',
      note: 'The sorted-order property of a BST is what makes this O(h) instead of O(n) — every comparison eliminates one whole subtree.',
    },
  ],
};
