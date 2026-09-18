import type { Pattern } from '../types';
import {
  reverseListTrace,
  mergeTwoListsTrace,
  hasCycleTrace,
  removeNthFromEndTrace,
  lruCacheTrace,
} from '../traceBuilders/linkedList';

export const linkedListPattern: Pattern = {
  id: 'linked-list',
  label: 'Linked List',
  short: 'Linked List',
  accent: '#1f8c8c',
  accentDark: '#6fd6d6',
  blurb: 'A chain of nodes, each holding a value and a pointer to the next — no random access, but O(1) insert/delete once you\'re already at the right node.',
  recurrenceGeneral: 'while (node):\n  visit(node)\n  node = node.next   // that\'s the entire shape of every list traversal',

  levels: [
    {
      tier: 'simple',
      tag: 'the basics',
      learnHeading: 'What a linked list actually is',
      learnBody:
        'An array lives in one contiguous block of memory, so nums[7] jumps straight there. A linked list is the opposite: it\'s a chain of separate node objects scattered anywhere in memory, and the only thing connecting node <b>i</b> to node <b>i+1</b> is an explicit pointer — a <b>.next</b> field stored on the node itself. There\'s no index 7 to jump to; to reach the 7th node you walk 7 hops from the head, one <b>.next</b> at a time. That trade — no random access, in exchange for O(1) insertion and deletion once you\'re standing at the right node (no shifting every element over) — is the entire reason this data structure exists.',
      learnFocus: [
        'A node is just { value, next } — that\'s the whole unit.',
        'No index lookup: reaching node k always costs k hops.',
        'Insert/delete is O(1) at a known position — nothing has to shift.',
      ],
      cues: [
        '"linked list" or "node" is literally named in the problem',
        'you need to insert/delete a lot without shifting every other element',
      ],
      examples: [
        { snippet: '"Given the <b>head</b> of a singly linked list, reverse the list..."', tell: '<b>"head"</b> + a chain of <b>.next</b> pointers is the standard linked-list setup — you\'ll be walking and rewiring pointers, not indexing.' },
      ],
    },
    {
      tier: 'easy',
      tag: 'dummy head & rewiring',
      learnHeading: 'The dummy head, and rewiring pointers without losing the rest of the list',
      learnBody:
        'Two idioms make almost every list problem easier. First: a <b>dummy node</b> placed just before the real head turns "the answer might start with a different node than head" (deletions at the front, merges, reversals) into zero special cases — you always return <b>dummy.next</b> instead of juggling "is this the first node?" logic. Second, and more dangerous if you skip it: whenever you\'re about to overwrite a node\'s <b>.next</b>, you have to save the old <b>.next</b> in a variable <i>first</i> — the moment you write <code>curr.next = somethingElse</code>, your only path to the rest of the original list is gone unless you grabbed it beforehand.',
      learnFocus: [
        'Dummy node before head → no special-casing "removing/inserting at the front".',
        'Always save next = curr.next before you touch curr.next.',
        'Return dummy.next, not head, once a dummy is in play.',
      ],
      cues: [
        '"remove the nth node", "insert before/after", "merge two lists" → dummy head pays off',
        'any problem that reverses or splices links → save-next-first is the rule that prevents you from losing the tail',
      ],
      examples: [
        { snippet: '"Remove all elements from a linked list that have value <b>val</b>."', tell: 'Deletions can happen at the head itself — a dummy node before head removes that special case entirely.' },
      ],
    },
    {
      tier: 'medium',
      tag: 'two pointers, list-style',
      learnHeading: 'Two-pointer techniques that only make sense on a list',
      learnBody:
        'Because you can\'t index backward or jump to an arbitrary position, lists get their own two-pointer idioms. <b>Slow/fast</b> (the tortoise and hare): advance slow by 1 hop and fast by 2 each iteration — if there\'s a cycle they\'re guaranteed to meet inside it, and with no cycle, fast reaches the halfway point exactly when slow does (this is also how you find a list\'s middle in one pass). The <b>lead/trail gap</b> technique: advance a lead pointer n steps ahead first, then move lead and trail together until lead falls off the end — trail is now exactly n nodes from the end, which is the only way to do "distance from the end" without first counting the list\'s length.',
      learnFocus: [
        'Slow/fast: 1 hop vs 2 hops per iteration → cycle detection and finding the middle.',
        'Lead/trail: open an n-node gap first, then walk both together → "kth from the end" in one pass.',
        'Both techniques exist specifically because a list has no O(1) index access.',
      ],
      cues: [
        '"detect a cycle", "find the middle", "does the list loop back on itself"',
        '"remove/return the nth node from the end" — without knowing the length up front',
      ],
      confuse:
        '<b>Linked-list two pointers vs. array two pointers:</b> in an array, lo/hi can jump to any index instantly (binary search, sorted two-sum), so they close in on each other from opposite ends. In a list you can only move one hop at a time and there\'s no "index from the end" — that\'s exactly why the list idiom is slow/fast (or lead/trail with a fixed gap), never lo/hi.',
      examples: [
        { snippet: '"Given head, determine if the linked list has a <b>cycle</b> in it."', tell: '<b>"cycle"</b> on a list, with no extra memory implied, is the direct signal for Floyd\'s slow/fast pointers.' },
        { snippet: '"Remove the <b>nth node from the end</b> of the list in one pass."', tell: '<b>"from the end"</b> + <b>"one pass"</b> (can\'t just count length first) signals the lead/trail gap technique.' },
      ],
    },
    {
      tier: 'hard',
      tag: 'list + hash map',
      learnHeading: 'Combining a list with another structure',
      learnBody:
        'The hardest list problems pair the list with a second structure to get two guarantees at once that neither one gives alone. The canonical example is an <b>LRU cache</b>: you need O(1) lookup by key (a hash map alone gives you that) <i>and</i> O(1) "move this to the front / evict the back" (a plain array or list alone gives you that) — together, a <b>hash map of key → node</b> plus a <b>doubly linked list</b> (so you can remove a node in O(1) without walking from the head to find its neighbor) give you both at once. The map never stores values directly; it stores pointers into the list, and the list order is the real source of truth for "which key is least recently used."',
      learnFocus: [
        'Hash map alone: O(1) lookup, no ordering. List alone: ordering, no O(1) lookup by key.',
        'Map<key, node> + doubly linked list gets you both — the map points into the list.',
        'Doubly linked (prev AND next) is what makes removing an arbitrary node O(1) — you don\'t need to walk to find its neighbor.',
      ],
      cues: [
        '"O(1) get and put" together with "least recently used" / "most recently used" → hash map + doubly linked list',
        'need to jump to a known node instantly, then splice it out without a scan → the node needs a .prev too',
      ],
      examples: [
        { snippet: '"Design a data structure that follows the constraints of a <b>Least Recently Used (LRU) cache</b>... get and put must each run in O(1) average time complexity."', tell: 'O(1) for <i>both</i> lookup and reordering is impossible with either structure alone — that combination is the LRU signature.' },
      ],
    },
  ],

  variants: [
    {
      id: 'reverse-list',
      label: 'Reverse Linked List',
      short: 'iterative · prev/curr/next',
      difficulty: 'simple',
      statement: 'Given the head of a singly linked list <b>[1,2,3,4,5]</b>, reverse it and return the new head.',
      recurrence: 'save next = curr.next; curr.next = prev; prev = curr; curr = next — repeat until curr is null.',
      complexity: 'O(n) time · O(1) space',
      twist: 'The whole trick is a save you do before the overwrite that would otherwise lose the rest of the list — nothing fancier than that, repeated n times.',
      viz: 'nodes',
      trace: () => reverseListTrace([1, 2, 3, 4, 5]),
    },
    {
      id: 'merge-two-lists',
      label: 'Merge Two Sorted Lists',
      short: 'two pointers · in place',
      difficulty: 'easy',
      statement: 'Merge sorted lists <b>A = [1,2,4]</b> and <b>B = [1,3,4]</b> into one sorted list by splicing the existing nodes together.',
      recurrence: 'Walk both lists with a pointer each; repeatedly attach the smaller (or equal) node to the tail of the merged chain, then splice in whatever\'s left.',
      complexity: 'O(n + m) time · O(1) extra space (nodes are relinked, not copied)',
      twist: 'No new nodes get created — every link you see form is a real .next pointer getting overwritten on an existing node, which is why a node can end up pointing across from list A into list B.',
      viz: 'nodes',
      trace: () => mergeTwoListsTrace([1, 2, 4], [1, 3, 4]),
    },
    {
      id: 'detect-cycle',
      label: "Detect Cycle (Floyd's)",
      short: 'slow/fast · tortoise & hare',
      difficulty: 'medium',
      statement: 'List <b>[3,2,0,-4]</b> where the last node\'s next points back to the node holding <b>2</b> (index 1). Does the list have a cycle?',
      recurrence: 'slow moves 1 hop, fast moves 2 hops, each iteration; if they ever land on the same node, there\'s a cycle.',
      complexity: 'O(n) time · O(1) space',
      twist: 'Fast gains exactly 1 extra hop on slow per iteration, so inside a loop of any size it\'s guaranteed to lap slow eventually — no map of visited nodes needed.',
      viz: 'nodes',
      trace: () => hasCycleTrace([3, 2, 0, -4], 1),
    },
    {
      id: 'remove-nth-from-end',
      label: 'Remove Nth Node From End',
      short: 'lead/trail gap',
      difficulty: 'medium',
      statement: 'Given <b>[1,2,3,4,5]</b> and <b>n = 2</b>, remove the 2nd node from the end and return the resulting list.',
      recurrence: 'Advance lead n+1 steps ahead of trail (both starting at a dummy before head), then move both together until lead is null — trail.next is the node to remove.',
      complexity: 'O(n) time, one pass · O(1) space',
      twist: 'The dummy node before head means "remove the head itself" needs no special case — trail can legitimately end up sitting on the dummy.',
      viz: 'nodes',
      trace: () => removeNthFromEndTrace([1, 2, 3, 4, 5], 2),
    },
    {
      id: 'lru-cache',
      label: 'LRU Cache',
      short: 'hash map + doubly linked list',
      difficulty: 'hard',
      statement: 'Capacity 2. Run <b>put(1,1), put(2,2), get(1), put(3,3), get(2), put(4,4), get(1), get(3), get(4)</b> in order — track every hit, miss, and eviction.',
      recurrence: 'A Map<key, node> gives O(1) lookup; a doubly linked list (MRU at the front) gives O(1) move-to-front and O(1) evict-from-back.',
      complexity: 'O(1) time per get/put · O(capacity) space',
      twist: 'Every touch (get or put) moves that key\'s node to the MRU end; every put past capacity evicts whatever\'s sitting at the LRU end — the list order is the real "recently used" ranking, the map is just a fast way in.',
      viz: 'nodes',
      trace: () => lruCacheTrace(2, [
        { kind: 'put', key: 1, val: 1 },
        { kind: 'put', key: 2, val: 2 },
        { kind: 'get', key: 1 },
        { kind: 'put', key: 3, val: 3 },
        { kind: 'get', key: 2 },
        { kind: 'put', key: 4, val: 4 },
        { kind: 'get', key: 1 },
        { kind: 'get', key: 3 },
        { kind: 'get', key: 4 },
      ]),
    },
  ],

  syntax: [
    {
      title: 'Dummy head node',
      code: 'const dummy = { val: 0, next: head };\nlet curr = dummy;\n// ...operate using curr, never head, for the special-casing...\nreturn dummy.next;',
      note: 'Turns "the answer might not start with the original head" into a non-issue — always return dummy.next.',
    },
    {
      title: 'Save next before you overwrite it',
      code: 'let prev = null, curr = head;\nwhile (curr) {\n  const next = curr.next;   // grab it FIRST\n  curr.next = prev;         // now safe to overwrite\n  prev = curr;\n  curr = next;\n}\nreturn prev;   // new head',
      note: 'The one line that makes iterative reversal work: lose next before you save it, and the rest of the list is gone forever.',
    },
    {
      title: 'Slow/fast pointer skeleton',
      code: 'let slow = head, fast = head;\nwhile (fast && fast.next) {\n  slow = slow.next;\n  fast = fast.next.next;\n  if (slow === fast) return true;   // cycle\n}\nreturn false;',
      note: 'Same skeleton finds the middle too — when fast hits the end, slow is at (or just past) the midpoint.',
    },
    {
      title: 'Lead/trail gap for "kth from the end"',
      code: 'let lead = dummy, trail = dummy;\nfor (let i = 0; i <= n; i++) lead = lead.next;\nwhile (lead) { lead = lead.next; trail = trail.next; }\ntrail.next = trail.next.next;',
      note: 'Opening a fixed (n+1)-gap first, then walking both together, finds "n from the end" in one pass with no length count.',
    },
    {
      title: 'Doubly linked node for O(1) removal',
      code: 'const node = { key, val, prev: null, next: null };\n// unlink in O(1), no scan needed:\nnode.prev.next = node.next;\nnode.next.prev = node.prev;',
      note: 'The .prev field is exactly what lets you splice a node out without walking from the head to find its neighbor — this is what an LRU cache\'s list needs.',
    },
    {
      title: 'Map<key, node> pointing into the list',
      code: 'const map = new Map();       // key -> node reference\nmap.set(key, node);\n// later: O(1) jump straight to the node, then relink it\nconst node = map.get(key);',
      note: 'The map never stores the value directly — it stores a pointer into the list, so touching a key can move its node in O(1) too.',
    },
  ],
};
