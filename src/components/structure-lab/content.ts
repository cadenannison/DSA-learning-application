import type {
  Structure,
  ArrayDemoState,
  ListDemoState,
  StackDemoState,
  QueueDemoState,
  HashMapDemoState,
  TreeDemoState,
  HeapDemoState,
  GraphDemoState,
} from './types';
import {
  rnum,
  pick,
  hashOf,
  KEY_POOL,
  bstInsert,
  bstSearch,
  heapSiftUp,
  heapSiftDown,
} from './helpers';

const arrayStructure: Structure<ArrayDemoState> = {
  id: 'array',
  label: 'Arrays',
  short: 'Array',
  accent: '#1f6fb2',
  accentDark: '#6db4f0',
  blurb:
    'A fixed-layout, indexed block of memory — every element sits at a known offset, so reading any slot is instant.',
  analogy:
    "A row of numbered mailboxes bolted to a wall: mailbox #4 is always exactly 4 slots from mailbox #0. You don't search for it — you walk straight there.",
  coreIdea:
    'Because every element is the same size and packed contiguously, the address of index <b>i</b> is just <b>base + i × elementSize</b> — pure arithmetic. That’s what makes access O(1). The cost shows up the moment you need to make room: inserting or removing anywhere but the end forces every following element to physically shift over.',
  complexity: [
    { op: 'Access by index', big: 'O(1)', note: 'Direct address computation — no traversal.' },
    { op: 'Search (unsorted)', big: 'O(n)', note: 'No shortcuts; check slots one at a time.' },
    { op: 'Push / pop at end', big: 'O(1)*', note: 'Amortized — the backing array occasionally has to grow and copy everything.' },
    { op: 'Insert / remove (front or middle)', big: 'O(n)', note: 'Every element after the gap shifts one slot to close or open it.' },
  ],
  useCases: [
    { title: 'Anything you index by position', body: 'Pixel buffers, matrices, lookup tables — anywhere "give me item #k instantly" matters more than resizing.' },
    { title: 'The backing store for other structures', body: 'Dynamic arrays (JS arrays, Python lists, ArrayList) are arrays underneath — heaps and hash tables are usually built on top of one too.' },
    { title: 'Cache-friendly iteration', body: 'Contiguous memory means scanning an array in order is much faster in practice than chasing pointers around memory.' },
  ],
  init: () => ({ values: [4, 17, 42, 8, 23], hi: null }),
  ops: [
    {
      id: 'push', label: 'Push (end)', big: 'O(1)*',
      run(s) {
        const v = rnum();
        const values = [...s.values, v];
        return { next: { values, hi: { current: values.length - 1 } }, note: `Appended ${v} after the last used slot — no shifting needed, so this is O(1) (amortized; the array occasionally must grow and copy).` };
      },
    },
    {
      id: 'pop', label: 'Pop (end)', big: 'O(1)',
      run(s) {
        if (!s.values.length) return { next: s, note: 'Nothing to pop.' };
        const v = s.values[s.values.length - 1];
        return { next: { values: s.values.slice(0, -1), hi: null }, note: `Removed ${v} from the end — O(1), nothing else has to move.` };
      },
    },
    {
      id: 'insertMid', label: 'Insert @ 1', big: 'O(n)',
      run(s) {
        const v = rnum();
        const values = [s.values[0], v, ...s.values.slice(1)];
        return { next: { values, hi: { current: 1 } }, note: `Inserted ${v} at index 1 — every element from index 1 onward had to shift right one slot first. O(n).` };
      },
    },
    {
      id: 'removeMid', label: 'Remove @ 1', big: 'O(n)',
      run(s) {
        if (s.values.length < 2) return { next: s, note: 'Array too small.' };
        const v = s.values[1];
        const values = [s.values[0], ...s.values.slice(2)];
        return { next: { values, hi: { current: 1 } }, note: `Removed ${v} from index 1 — everything after it shifted left to close the gap. O(n).` };
      },
    },
    {
      id: 'search', label: 'Search', big: 'O(n)',
      run(s) {
        if (!s.values.length) return { next: s, note: 'Array is empty.' };
        const target = pick(s.values);
        const idx = s.values.indexOf(target);
        return { next: { ...s, hi: { current: idx } }, note: `Linear scan from index 0: checked ${idx + 1} slot(s) before finding ${target} at index ${idx}. Worst case is checking all n slots.` };
      },
    },
  ],
};

const listStructure: Structure<ListDemoState> = {
  id: 'list',
  label: 'Linked Lists',
  short: 'List',
  accent: '#b23a6b',
  accentDark: '#f096bb',
  blurb:
    'A chain of nodes, each holding a value and a pointer to the next — no contiguous memory required, so growing or shrinking never means shifting neighbors.',
  analogy:
    "A treasure hunt: each clue tells you where to find the next one. You can't jump straight to clue #5 — you have to walk the chain from the start.",
  coreIdea:
    "Every node only knows about the next one, so the list has no fixed size and insertion/removal is cheap once you're at the right spot — it's just re-pointing a couple of links, not shifting memory. The tradeoff is that reaching position <b>i</b> means walking <b>i</b> links one at a time; there's no arithmetic shortcut like an array has.",
  complexity: [
    { op: 'Access by index', big: 'O(n)', note: 'Must walk from the head, one link at a time.' },
    { op: 'Search', big: 'O(n)', note: 'Same walk — no shortcuts.' },
    { op: 'Insert / delete at head', big: 'O(1)', note: 'Just re-point the head pointer.' },
    { op: 'Insert / delete at tail', big: 'O(n)*', note: 'O(n) to walk there — O(1) if you keep a tail pointer.' },
    { op: 'Insert / delete once positioned', big: 'O(1)', note: 'Re-linking two pointers, regardless of list length.' },
  ],
  useCases: [
    { title: 'LRU caches', body: "A doubly linked list lets you move a node to the front or evict the back in O(1) — arrays can't do that without shifting." },
    { title: 'Undo history / browser back-forward', body: 'Each state points to the previous one; no need to know the size up front or shift anything to add a new state.' },
    { title: 'Implementing stacks, queues, and adjacency lists', body: 'When size is unpredictable and you mostly add/remove at the ends, a linked list avoids array resize costs entirely.' },
  ],
  init: () => ({ nodes: [{ id: 1, val: 9 }, { id: 2, val: 4 }, { id: 3, val: 17 }], nextId: 4, hi: null }),
  ops: [
    {
      id: 'pushFront', label: 'Push Front', big: 'O(1)',
      run(s) {
        const v = rnum();
        const n = { id: s.nextId, val: v };
        return { next: { nodes: [n, ...s.nodes], nextId: s.nextId + 1, hi: { newId: n.id } }, note: `Pushed ${v} onto the front — re-point head to the new node, done. O(1), no walking required.` };
      },
    },
    {
      id: 'pushBack', label: 'Push Back', big: 'O(n)*',
      run(s) {
        const v = rnum();
        const n = { id: s.nextId, val: v };
        return { next: { nodes: [...s.nodes, n], nextId: s.nextId + 1, hi: { newId: n.id } }, note: `Pushed ${v} onto the back — walked all ${s.nodes.length} existing nodes to find the tail, then linked the new one. O(n) (O(1) with a maintained tail pointer).` };
      },
    },
    {
      id: 'popFront', label: 'Pop Front', big: 'O(1)',
      run(s) {
        if (!s.nodes.length) return { next: s, note: 'List is empty.' };
        const n = s.nodes[0];
        return { next: { ...s, nodes: s.nodes.slice(1), hi: null }, note: `Popped ${n.val} off the front — just move the head pointer to the next node. O(1).` };
      },
    },
    {
      id: 'insertAfter', label: 'Insert After Head', big: 'O(1)',
      run(s) {
        if (!s.nodes.length) return { next: s, note: 'List is empty.' };
        const v = rnum();
        const n = { id: s.nextId, val: v };
        const nodes = [s.nodes[0], n, ...s.nodes.slice(1)];
        return { next: { nodes, nextId: s.nextId + 1, hi: { newId: n.id, current: s.nodes[0].id } }, note: `Inserted ${v} right after the head — re-point head.next to the new node, and the new node's .next to the old head.next. O(1) once you're at the spot.` };
      },
    },
    {
      id: 'deleteValue', label: 'Delete a Value', big: 'O(n)',
      run(s) {
        if (!s.nodes.length) return { next: s, note: 'List is empty.' };
        const target = pick(s.nodes);
        const idx = s.nodes.findIndex((n) => n.id === target.id);
        const nodes = [...s.nodes.slice(0, idx), ...s.nodes.slice(idx + 1)];
        return { next: { ...s, nodes, hi: null }, note: `Deleted value ${target.val}: walked from the head counting ${idx + 1} node(s) to find it, then re-linked its neighbor around it. O(n) to find + O(1) to unlink.` };
      },
    },
  ],
};

const stackStructure: Structure<StackDemoState> = {
  id: 'stack',
  label: 'Stacks',
  short: 'Stack',
  accent: '#6d5bd0',
  accentDark: '#a394ff',
  blurb: 'Last-in, first-out. You can only add or remove from one end — the "top" — which makes every operation O(1).',
  analogy: "A stack of plates: you always take the top one off, and you always put a new one on top. Grabbing a plate from the middle isn't an option.",
  coreIdea:
    'All access happens at a single end, so a stack needs no shifting and no traversal — push and pop just touch the top pointer/index. The restriction (no random access, no peeking into the middle) is exactly what makes it fast and exactly what makes it the right tool whenever "most recent first" is the rule you need to enforce.',
  complexity: [
    { op: 'Push', big: 'O(1)', note: 'Add to the top only.' },
    { op: 'Pop', big: 'O(1)', note: 'Remove from the top only.' },
    { op: 'Peek (top)', big: 'O(1)', note: 'Read without removing.' },
    { op: 'Search for a value', big: 'O(n)', note: 'Have to pop through (or scan) everything above it.' },
  ],
  useCases: [
    { title: 'Function call stack', body: 'Every function call pushes a frame; returning pops it. This is why deep recursion overflows — the stack runs out of room.' },
    { title: 'Undo / redo', body: 'Each action pushes onto an undo stack; undoing pops the most recent one — inherently last-in-first-out.' },
    { title: 'Matching brackets / balanced parentheses', body: 'Push opening brackets, pop on a closing one and check it matches — the classic interview use of a stack.' },
    { title: 'DFS (iterative)', body: 'An explicit stack replaces the recursive call stack when you traverse depth-first without recursion.' },
  ],
  init: () => ({ values: [12, 45, 7], hi: null }),
  ops: [
    {
      id: 'push', label: 'Push', big: 'O(1)',
      run(s) {
        const v = rnum();
        return { next: { values: [...s.values, v], hi: null }, note: `Pushed ${v} on top. O(1) — only the top pointer moves.` };
      },
    },
    {
      id: 'pop', label: 'Pop', big: 'O(1)',
      run(s) {
        if (!s.values.length) return { next: s, note: 'Stack is empty — nothing to pop.' };
        const v = s.values[s.values.length - 1];
        return { next: { values: s.values.slice(0, -1), hi: null }, note: `Popped ${v} off the top. O(1) — whatever's now on top was already there, no shifting.` };
      },
    },
    {
      id: 'peek', label: 'Peek', big: 'O(1)',
      run(s) {
        if (!s.values.length) return { next: s, note: 'Stack is empty.' };
        return { next: s, note: `Top of stack is ${s.values[s.values.length - 1]} — read without removing it. O(1).` };
      },
    },
  ],
};

const queueStructure: Structure<QueueDemoState> = {
  id: 'queue',
  label: 'Queues',
  short: 'Queue',
  accent: '#a5720f',
  accentDark: '#e0b866',
  blurb: "First-in, first-out. New items join the back; the next one out is always whichever has been waiting longest.",
  analogy: "A checkout line: you join at the back, and whoever's been waiting longest at the front gets served next. No cutting.",
  coreIdea:
    "A queue needs two live ends — front (where you remove) and back (where you add) — instead of a stack's single end. Implemented on a plain array, removing from the front naively costs O(n) because everything shifts; real implementations use a circular buffer or a linked list with head/tail pointers so both ends stay O(1).",
  complexity: [
    { op: 'Enqueue (add to back)', big: 'O(1)', note: 'Amortized, with a proper implementation.' },
    { op: 'Dequeue (remove from front)', big: 'O(1)*', note: 'O(1) with a circular buffer or linked list; O(n) with a naive array shift.' },
    { op: 'Peek (front)', big: 'O(1)', note: 'Read without removing.' },
  ],
  useCases: [
    { title: 'BFS traversal', body: 'Breadth-first search visits level by level — a queue naturally processes "oldest discovered node first," which is exactly level order.' },
    { title: 'Task / job scheduling', body: 'Print queues, request queues, task runners — first request in gets served first, fairly.' },
    { title: 'Rate limiting & buffering', body: 'Streaming data, message brokers (Kafka, SQS) — producers enqueue, consumers dequeue in arrival order.' },
  ],
  init: () => ({ values: [3, 21, 9], hi: null }),
  ops: [
    {
      id: 'enqueue', label: 'Enqueue', big: 'O(1)',
      run(s) {
        const v = rnum();
        return { next: { values: [...s.values, v], hi: null }, note: `Enqueued ${v} at the back. O(1) — joins the line behind everyone already waiting.` };
      },
    },
    {
      id: 'dequeue', label: 'Dequeue', big: 'O(1)*',
      run(s) {
        if (!s.values.length) return { next: s, note: 'Queue is empty — nothing to dequeue.' };
        const v = s.values[0];
        return { next: { values: s.values.slice(1), hi: null }, note: `Dequeued ${v} from the front — whoever waited longest leaves first. O(1) with a proper ring buffer/linked-list queue (a plain array .shift() is actually O(n) since it re-indexes everything).` };
      },
    },
    {
      id: 'peek', label: 'Peek Front', big: 'O(1)',
      run(s) {
        if (!s.values.length) return { next: s, note: 'Queue is empty.' };
        return { next: s, note: `Front of the queue is ${s.values[0]} — next one out. O(1).` };
      },
    },
  ],
};

const hashMapStructure: Structure<HashMapDemoState> = {
  id: 'hashmap',
  label: 'Hash Maps',
  short: 'Hash Map',
  accent: '#0f8f83',
  accentDark: '#4fd6c6',
  blurb:
    'Keys are run through a hash function to compute a bucket index directly — so lookup, insert, and delete are all O(1) on average, without any searching.',
  analogy: 'A coat check: your ticket number (the hash of your key) tells the attendant exactly which hook to check — no walking the rack looking for your coat.',
  coreIdea:
    "A hash function converts any key into a bucket index (here, sum the key's character codes and take it mod 8). Two different keys can land on the same bucket — a <b>collision</b> — which is handled by chaining: each bucket holds a small list, and a collision just makes that one bucket's list slightly longer instead of breaking anything. As long as the hash function spreads keys evenly, each bucket stays short and every operation stays close to O(1).",
  complexity: [
    { op: 'Insert (put)', big: 'O(1) avg', note: 'O(n) worst case if every key collides into one bucket.' },
    { op: 'Lookup (get)', big: 'O(1) avg', note: 'Compute the hash, scan a short chain.' },
    { op: 'Delete', big: 'O(1) avg', note: 'Same as lookup, then unlink from the chain.' },
  ],
  useCases: [
    { title: 'Counting / frequency maps', body: 'Character counts, word frequencies — "have I seen this key before, and how many times" in O(1) per check.' },
    { title: 'Deduplication & membership tests', body: 'Sets are hash maps under the hood — "is this element already in here" without scanning a list.' },
    { title: 'Caching (memoization)', body: 'Map an input to its already-computed output so you never redo the same expensive work twice.' },
    { title: 'Object/dictionary types themselves', body: 'Python dicts, JS objects/Maps, Java HashMaps — this is the structure powering the language feature.' },
  ],
  init: () => {
    const buckets: HashMapDemoState['buckets'] = Array.from({ length: 8 }, () => []);
    ['cat', 'dog', 'fox'].forEach((k) => buckets[hashOf(k)].push({ k, v: rnum() }));
    return { buckets, hi: null };
  },
  ops: [
    {
      id: 'put', label: 'Put', big: 'O(1) avg',
      run(s) {
        const key = pick(KEY_POOL);
        const val = rnum();
        const b = hashOf(key);
        const buckets = s.buckets.map((bucket, i) => (i === b ? [...bucket] : bucket));
        const existing = buckets[b].find((e) => e.k === key);
        if (existing) existing.v = val;
        else buckets[b].push({ k: key, v: val });
        const collided = buckets[b].length > 1;
        return {
          next: { buckets, hi: { bucket: b, key } },
          note: `hash("${key}") → bucket ${b}. ${collided ? `Bucket ${b} already had an entry — this is a <b>collision</b>, handled by chaining onto the same bucket.` : `Bucket ${b} was empty — stored directly.`} O(1) average.`,
        };
      },
    },
    {
      id: 'get', label: 'Get', big: 'O(1) avg',
      run(s) {
        const nonEmpty = s.buckets.map((b, i) => ({ b, i })).filter((x) => x.b.length);
        if (!nonEmpty.length) return { next: s, note: 'Map is empty.' };
        const chosen = pick(nonEmpty);
        const entry = pick(chosen.b);
        return {
          next: { ...s, hi: { bucket: chosen.i, key: entry.k } },
          note: `hash("${entry.k}") → bucket ${chosen.i}. Scanned ${chosen.b.length} entr${chosen.b.length === 1 ? 'y' : 'ies'} in that bucket's chain and found ${entry.k}:${entry.v}. O(1) average since chains stay short.`,
        };
      },
    },
    {
      id: 'delete', label: 'Delete', big: 'O(1) avg',
      run(s) {
        const nonEmpty = s.buckets.map((b, i) => ({ b, i })).filter((x) => x.b.length);
        if (!nonEmpty.length) return { next: s, note: 'Map is empty.' };
        const chosen = pick(nonEmpty);
        const entry = pick(chosen.b);
        const buckets = s.buckets.map((bucket, i) => (i === chosen.i ? bucket.filter((e) => e !== entry) : bucket));
        return { next: { buckets, hi: null }, note: `Deleted "${entry.k}" from bucket ${chosen.i} — jump straight to its bucket via the hash, then unlink it from the chain. O(1) average.` };
      },
    },
  ],
};

const treeStructure: Structure<TreeDemoState> = {
  id: 'tree',
  label: 'Trees (BST)',
  short: 'BST',
  accent: '#4a5578',
  accentDark: '#aab2d6',
  blurb: 'A binary search tree keeps every left subtree smaller and every right subtree larger than its root — so each comparison eliminates half the remaining tree.',
  analogy: 'Guessing a number with "higher or lower": each guess (node) tells you which half to search next, so you close in fast instead of checking every possibility.',
  coreIdea:
    'Starting at the root, comparing your target against the current node tells you to go left (smaller) or right (larger) — exactly like binary search, but on a linked structure instead of a sorted array. If the tree stays roughly balanced, each comparison halves the remaining search space, giving O(log n). But nothing forces balance: inserting sorted data in order degenerates the tree into a straight line — a linked list in disguise — and every operation drops to O(n). (Self-balancing variants like AVL or red-black trees fix this by rotating nodes to stay balanced.)',
  complexity: [
    { op: 'Search', big: 'O(log n)*', note: 'O(n) worst case if the tree degenerates into a line (e.g. inserted in sorted order).' },
    { op: 'Insert', big: 'O(log n)*', note: 'Same balanced-vs-skewed caveat as search.' },
    { op: 'Delete', big: 'O(log n)*', note: 'Find the node (O(log n)), then relink around it.' },
    { op: 'In-order traversal', big: 'O(n)', note: 'Visits left, root, right — always visits every node once, and always in sorted order.' },
  ],
  useCases: [
    { title: 'Ordered maps / sets', body: 'When you need sorted iteration and O(log n) insert/search/delete together — TreeMap, std::map, database indexes.' },
    { title: 'Autocomplete & range queries', body: '"Give me everything between X and Y" is a natural BST traversal, unlike a hash map which has no notion of order.' },
    { title: 'Filesystem & DOM-like hierarchies', body: 'Not every tree is a BST, but the parent/child recursive structure underlies file systems, org charts, and the DOM itself.' },
  ],
  init: () => {
    let root: TreeDemoState['root'] = null;
    [8, 3, 10, 1, 6, 14].forEach((v) => { root = bstInsert(root, v, []); });
    return { root, hi: null };
  },
  ops: [
    {
      id: 'insert', label: 'Insert', big: 'O(log n)*',
      run(s) {
        let v = rnum() % 30;
        let tries = 0;
        let path: number[] = [];
        while (tries < 5) {
          path = [];
          const found = bstSearch(s.root, v, []);
          if (!found) break;
          v = rnum() % 30;
          tries++;
        }
        const root = bstInsert(s.root, v, path);
        return { next: { root, hi: { path, current: v } }, note: `Inserted ${v}: compared against ${path.length} node(s) on the way down (${path.join(' → ') || 'empty tree'}), going left or right each time, until an empty spot opened up. O(log n) if the tree is balanced.` };
      },
    },
    {
      id: 'search', label: 'Search', big: 'O(log n)*',
      run(s) {
        if (!s.root) return { next: s, note: 'Tree is empty.' };
        const all: number[] = [];
        const rootForOrder = s.root;
        function inOrder(n: TreeDemoState['root']) { if (!n) return; inOrder(n.left); all.push(n.val); inOrder(n.right); }
        inOrder(rootForOrder);
        const target = Math.random() < 0.7 ? pick(all) : rnum() % 30;
        const path: number[] = [];
        const found = bstSearch(s.root, target, path);
        return {
          next: { ...s, hi: { path, current: found ? target : null } },
          note: found
            ? `Searched for ${target}: followed ${path.length} comparison(s) — ${path.join(' → ')} — straight to it. O(log n) on a balanced tree.`
            : `Searched for ${target}: followed ${path.length} comparison(s) down to a dead end — not in the tree. Still O(log n) to determine that.`,
        };
      },
    },
    {
      id: 'traverse', label: 'In-Order Traverse', big: 'O(n)',
      run(s) {
        if (!s.root) return { next: s, note: 'Tree is empty.' };
        const order: number[] = [];
        const root = s.root;
        function inOrder(n: TreeDemoState['root']) { if (!n) return; inOrder(n.left); order.push(n.val); inOrder(n.right); }
        inOrder(root);
        const map = new Map<number, number>();
        order.forEach((v, i) => map.set(v, i + 1));
        return { next: { ...s, hi: { path: order, order: map, current: null } }, note: `In-order traversal (left → root → right) visits every node exactly once and always produces sorted output: ${order.join(', ')}. That "always sorted" property is the whole point of a BST. O(n).` };
      },
    },
  ],
};

const heapStructure: Structure<HeapDemoState> = {
  id: 'heap',
  label: 'Heaps',
  short: 'Heap',
  accent: '#6d5bd0',
  accentDark: '#a394ff',
  blurb: 'A complete binary tree, stored in a plain array, where every parent is ≤ (min-heap) or ≥ (max-heap) both of its children — so the smallest (or largest) element is always the root.',
  analogy: "A tournament bracket where the champion always sits at the top: you never need to know the full ranking of everyone else, just who's currently #1.",
  coreIdea:
    "A heap only guarantees order between a parent and its own children — not full sorted order like a BST. That weaker guarantee is what makes it cheap: because the tree is always <b>complete</b> (filled left to right, no gaps), it can live in a plain array with no pointers at all — node i's children are just at indices 2i+1 and 2i+2. Inserting appends to the end then \"bubbles up\" swapping with its parent while it's smaller; removing the root moves the last element to the top then \"bubbles down\" swapping with its smaller child — both O(log n) since that's the height of a complete tree.",
  recurrenceGeneral: 'parent(i) = ⌊(i-1)/2⌋      children(i) = 2i+1, 2i+2',
  complexity: [
    { op: 'Peek min/max', big: 'O(1)', note: 'Always sitting at index 0.' },
    { op: 'Insert', big: 'O(log n)', note: 'Append then sift up — at most tree-height swaps.' },
    { op: 'Extract min/max', big: 'O(log n)', note: 'Replace root with the last element, then sift down.' },
    { op: 'Build heap from n items', big: 'O(n)', note: 'Surprisingly linear, not O(n log n) — a classic interview fact.' },
  ],
  useCases: [
    { title: 'Priority queues', body: 'Task schedulers, Dijkstra\'s algorithm, A* — anywhere you repeatedly need "give me the most urgent item right now."' },
    { title: 'Top-K / K-th largest problems', body: 'A heap of size K lets you track the K largest (or smallest) elements seen so far in O(log K) per item instead of re-sorting.' },
    { title: 'Merge K sorted lists', body: 'A min-heap holding the current front of each list always tells you which element comes next across all of them.' },
    { title: 'Heapsort', body: 'Repeatedly extracting the min/max from a heap yields a fully sorted array in O(n log n).' },
  ],
  init: () => ({ values: [3, 9, 5, 18, 12, 8], hi: null }),
  ops: [
    {
      id: 'insert', label: 'Insert', big: 'O(log n)',
      run(s) {
        const v = rnum() % 40;
        const values = [...s.values, v];
        const swaps = heapSiftUp(values, values.length - 1);
        return {
          next: { values, hi: { current: v } },
          note: swaps
            ? `Appended ${v} at the end, then bubbled it up past ${swaps} larger parent(s) until it settled in place. O(log n) — at most the height of the tree.`
            : `Appended ${v} at the end — it was already ≥ its parent, so no bubbling needed. O(log n) worst case, O(1) here.`,
        };
      },
    },
    {
      id: 'extract', label: 'Extract Min', big: 'O(log n)',
      run(s) {
        if (!s.values.length) return { next: s, note: 'Heap is empty.' };
        const min = s.values[0];
        const values = s.values.slice(0, -1);
        const last = s.values[s.values.length - 1];
        if (values.length) {
          values[0] = last;
          const swaps = heapSiftDown(values, 0);
          return { next: { values, hi: { current: values[0] } }, note: `Removed the root (${min}, the minimum). Moved the last element (${last}) to the root, then sifted it down past ${swaps} smaller child/children until the min-heap property was restored. O(log n).` };
        }
        return { next: { values, hi: null }, note: `Removed the only element (${min}). Heap is now empty. O(log n).` };
      },
    },
    {
      id: 'peek', label: 'Peek Min', big: 'O(1)',
      run(s) {
        if (!s.values.length) return { next: s, note: 'Heap is empty.' };
        return { next: { ...s, hi: { current: s.values[0] } }, note: `The minimum is always at index 0 — here, ${s.values[0]}. No search needed. O(1).` };
      },
    },
  ],
};

const graphStructure: Structure<GraphDemoState> = {
  id: 'graph',
  label: 'Graphs (structure)',
  short: 'Graph',
  accent: '#0f8f83',
  accentDark: '#4fd6c6',
  blurb: 'A set of nodes plus a set of edges describing which nodes connect to which — the shape itself, separate from any traversal algorithm run on top of it.',
  analogy: "A city's road map: intersections are nodes, roads are edges. How you'd actually plan a route (BFS/DFS/Dijkstra — covered in Pattern Lab) is a separate question from how the map itself is stored.",
  coreIdea:
    'The two standard representations trade memory for speed differently. An <b>adjacency list</b> (used here) stores, for each node, just the list of neighbors it connects to — memory-efficient (O(V + E)) and fast to iterate "who does this node connect to." An <b>adjacency matrix</b> instead stores a V×V grid of 0/1s — O(V²) memory, but checking "are these two specific nodes connected" is O(1) instead of scanning a list. Most interview problems default to adjacency lists because real graphs are usually sparse (E ≪ V²).',
  complexity: [
    { op: 'Add a node', big: 'O(1)', note: 'Just append an empty neighbor list for it.' },
    { op: 'Add an edge', big: 'O(1)', note: 'Append to the neighbor list (adjacency list rep).' },
    { op: 'Check if u → v exists', big: 'O(degree of u)', note: "Scan u's neighbor list — O(1) instead with an adjacency matrix, at the cost of O(V²) memory." },
    { op: 'Iterate all edges from u', big: 'O(degree of u)', note: 'This is exactly what BFS/DFS lean on at every step.' },
  ],
  useCases: [
    { title: 'Social networks & recommendation graphs', body: 'People/accounts as nodes, follows/friendships as edges — "friends of friends" is a 2-hop traversal.' },
    { title: 'Maps & routing', body: 'Intersections as nodes, roads as weighted edges — shortest-path algorithms run on exactly this structure.' },
    { title: 'Dependency resolution', body: 'Build systems, package managers, course prerequisites — a directed edge means "must come before," and topological sort needs this representation.' },
    { title: 'Network topology', body: 'Servers/routers as nodes, connections as edges — used to detect reachability and points of failure.' },
  ],
  init: () => ({ nodes: [0, 1, 2, 3], adj: { 0: [1, 2], 1: [2], 2: [3], 3: [] }, hi: null }),
  ops: [
    {
      id: 'addNode', label: 'Add Node', big: 'O(1)',
      run(s) {
        const id = s.nodes.length;
        return { next: { nodes: [...s.nodes, id], adj: { ...s.adj, [id]: [] }, hi: { current: id } }, note: `Added node ${id} with an empty neighbor list. O(1) — no edges to touch yet.` };
      },
    },
    {
      id: 'addEdge', label: 'Add Edge', big: 'O(1)',
      run(s) {
        if (s.nodes.length < 2) return { next: s, note: 'Need at least 2 nodes first.' };
        const u = pick(s.nodes);
        let v = pick(s.nodes);
        let tries = 0;
        while ((v === u || s.adj[u].includes(v)) && tries < 6) { v = pick(s.nodes); tries++; }
        if (v === u || s.adj[u].includes(v)) return { next: s, note: 'Every pair is already connected — add another node first.' };
        return { next: { ...s, adj: { ...s.adj, [u]: [...s.adj[u], v] }, hi: { current: u } }, note: `Added a directed edge ${u} → ${v}: just appended ${v} to node ${u}'s neighbor list. O(1).` };
      },
    },
    {
      id: 'removeEdge', label: 'Remove Edge', big: 'O(deg)',
      run(s) {
        const withEdges = s.nodes.filter((n) => s.adj[n] && s.adj[n].length);
        if (!withEdges.length) return { next: s, note: 'No edges to remove.' };
        const u = pick(withEdges);
        const v = pick(s.adj[u]);
        return { next: { ...s, adj: { ...s.adj, [u]: s.adj[u].filter((x) => x !== v) }, hi: { current: u } }, note: `Removed edge ${u} → ${v}: scanned node ${u}'s neighbor list to find and drop ${v}. O(degree of ${u}), not O(1), since a list has to be searched.` };
      },
    },
  ],
};

// Each structure's `run` only ever gets called with that same structure's own state (see
// StructureLab.tsx, which looks up both by the same structure.id), so it's safe to erase the
// specific S here to store them together — same shape as an array of closures over different
// captured types, just made explicit for TS since Structure<S> isn't safely covariant in S.
export const STRUCTURES: Structure[] = [
  arrayStructure,
  listStructure,
  stackStructure,
  queueStructure,
  hashMapStructure,
  treeStructure,
  heapStructure,
  graphStructure,
] as unknown as Structure[];
