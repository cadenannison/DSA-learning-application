import type { Pattern } from '../types';
import {
  trieInsertTrace,
  trieSearchTrace,
  trieStartsWithTrace,
  trieWildcardSearchTrace,
  trieLongestWordTrace,
} from '../traceBuilders';

export const triesPattern: Pattern = {
  id: 'tries',
  label: 'Tries',
  short: 'Tries',
  accent: '#8c5a2f',
  accentDark: '#e0a86f',
  blurb: 'A tree where the path from the root spells out a prefix — words that share a beginning literally share nodes, which is what makes prefix questions fast.',
  recurrenceGeneral: 'walk(node, chars):\n  for ch of chars:\n    node = node.children[ch]   // create it first, if inserting\n  // insert: node.isWord = true\n  // search: return node.isWord\n  // startsWith: return true (path existed)',

  levels: [
    {
      tier: 'simple',
      tag: 'the basics',
      learnHeading: 'What a trie actually is',
      learnBody:
        'A trie (say "try", from re<b>trie</b>val) is a tree built out of characters. Each edge is labeled with one character, and the path from the root down to any node spells out a prefix — walk root → c → a → r and you\'ve spelled "car". The idea that makes tries worth learning: words that start the same way <b>share</b> the nodes for that shared beginning. "cat", "car", and "card" all reuse the same "c" node and the same "ca" node — only where they diverge do the paths split apart. A whole dictionary compresses down to one structure by its common beginnings.',
      learnFocus: [
        'Each edge is one character; the path from the root spells a prefix.',
        'Shared prefixes literally share nodes — "car" and "card" both pass through the same "c" → "ca" → "car" chain.',
        'A node also carries an isWord flag marking "a real inserted word ends here."',
      ],
      cues: [
        'the problem is fundamentally about strings and their prefixes, not single lookups',
        'words are inserted once and then queried many times',
      ],
      examples: [
        { snippet: '"Design a data structure that supports <b>insert</b> and <b>search</b> for a word."', tell: 'Repeated insert/search over a growing set of words, phrased generically like this, is the trie setup — LeetCode literally calls it "Implement Trie."' },
      ],
    },
    {
      tier: 'easy',
      tag: 'insert & search',
      learnHeading: 'Insert and exact search are both just tree walks',
      learnBody:
        '<b>insert(word)</b> walks from the root one character at a time, creating a child node only when that character\'s edge doesn\'t already exist, then flags the last node isWord = true. <b>search(word)</b> walks the exact same path — but here\'s the gotcha: reaching the last node isn\'t enough. If the path exists but that final node\'s isWord flag is false, the word was never actually inserted; some other word just happens to pass through it as a prefix. Insert {"mad"} and search("ma") walks a real, valid path to a real node — and still correctly returns false, because "ma" was only ever a prefix, never a word on its own.',
      learnFocus: [
        'insert: create missing nodes along the path, then flag the last one isWord.',
        'search: walk the same path, but check BOTH that the path exists AND that the final node is flagged isWord.',
        '"the path exists" ≠ "the word was inserted" — that\'s the whole gotcha.',
      ],
      cues: [
        '"implement a dictionary / word set with insert and search"',
        'exact-match lookup against a set of strings that gets built up incrementally',
      ],
      examples: [
        { snippet: '"Return <b>true</b> if the word is in the trie (was inserted before), <b>false</b> otherwise."', tell: 'Exact "was this exact word inserted" phrasing → walk the path AND check isWord on the last node, not just reachability.' },
      ],
      confuse:
        '<b>Trie vs. a plain hash set of strings:</b> for exact membership only ("is this exact word in my set?"), a hash set is simpler and just as fast. Reach for a trie the moment the question becomes about <b>prefixes</b> — autocomplete, "starts with", "how many words begin with X" — because that\'s exactly where a hash set falls apart: it can\'t answer a prefix question without scanning every entry, while a trie gets there by construction.',
    },
    {
      tier: 'medium',
      tag: 'prefixes',
      learnHeading: 'startsWith — the one-line difference from search',
      learnBody:
        '<b>startsWith(prefix)</b> is the same walk as search, minus one check: once you reach the end of the walk, you\'re done — return true. You don\'t care whether that node is itself a complete word, only that the path exists. That single dropped condition is the entire difference in code, but it\'s a completely different question: "does anything in my dictionary start with this?" A hash set of whole words genuinely cannot answer that without iterating every stored word and checking its prefix by hand — O(total characters stored) every single query. A trie answers it in O(length of the prefix), because the shared structure already did the work at insert time. That same shared structure is why counting "how many words share this prefix" is just a small DFS from one node, tallying isWord flags in its subtree.',
      learnFocus: [
        'startsWith = search\'s walk, but skip the final isWord check — reaching the node is enough.',
        'A hash set can\'t answer prefix questions without scanning everything; a trie answers in O(prefix length).',
        '"count words with prefix X" = walk to X\'s node, then DFS counting isWord flags in its subtree.',
      ],
      cues: [
        '"implement autocomplete"',
        '"starts with" / "begins with" phrasing on a set of strings',
        '"how many words share this prefix"',
      ],
      examples: [
        { snippet: '"As the user types, suggest words that <b>begin with</b> what they\'ve typed so far."', tell: 'Autocomplete is startsWith at scale — walk to the typed prefix\'s node once, then everything below it is a candidate.' },
      ],
    },
    {
      tier: 'hard',
      tag: 'backtracking + pruning',
      learnHeading: 'Tries combined with backtracking',
      learnBody:
        'The hard tier is where tries stop being a plain walk. <b>Wildcard search</b> ("." matches any character) turns the walk into backtracking DFS: on a literal character there\'s still only one edge to follow, but on a wildcard you must try <i>every existing child edge</i>, recurse, and — if that branch doesn\'t pan out — revert and try the next one. It\'s the same shape as any other backtracking problem; the trie just supplies the branches. <b>isWord-guided pruning</b> is the other direction: use the flag not just to answer "is this a word" but to decide whether a DFS is even allowed to continue into a subtree at all — e.g. "longest word buildable one character at a time" only recurses into a child if that child is itself a complete word, which silently prunes away entire branches that are structurally present in the trie but never buildable.',
      learnFocus: [
        'Wildcard search = DFS where a literal char has one edge to try, but "." tries every child edge and backtracks on failure.',
        'isWord isn\'t just a leaf-check — it can gate whether a DFS is even allowed to descend into a subtree.',
        'Both techniques still cost you nothing extra to set up: same trie, same node shape, different traversal.',
      ],
      cues: [
        '"search a word that may contain wildcard/unknown characters"',
        '"every prefix of the answer must also be a valid word" — a buildability / prunability constraint',
      ],
      examples: [
        { snippet: '"search(word) should return true if word is in the trie, or if it matches any string with the <b>wildcard character \'.\'</b>."', tell: 'The wildcard forces multiple candidate edges at one position → wildcard search is trie traversal wearing backtracking\'s clothes.' },
        { snippet: '"Find the longest word such that <b>every prefix</b> of it is also in the word list."', tell: '"Every prefix must qualify" is an isWord-gated DFS — you may only step into a child that is itself flagged as a complete word.' },
      ],
    },
  ],

  variants: [
    {
      id: 'trie-insert',
      label: 'Implement Trie — Insert',
      short: 'insert · shared prefixes',
      difficulty: 'simple',
      statement: 'Insert the words <b>"cat"</b>, <b>"car"</b>, and <b>"card"</b> into an initially empty trie, one at a time.',
      recurrence: 'insert(word): walk from root, creating a child only where the path doesn\'t already exist, then flag the last node isWord.',
      complexity: 'O(word length) time per insert · O(total distinct characters of prefixes) space',
      twist: 'Watch "c", "ca", and "car" get created exactly once each, then reused — by "car" for the first two, and by "card" for all three — instead of being rebuilt from scratch.',
      viz: 'nodes',
      trace: () => trieInsertTrace(['cat', 'car', 'card']),
    },
    {
      id: 'trie-search',
      label: 'Implement Trie — Search',
      short: 'exact search · isWord',
      difficulty: 'easy',
      statement: 'Using the trie built from <b>{"cat", "car", "card"}</b>, run <b>search("car")</b> and then <b>search("ca")</b>.',
      recurrence: 'search(word): walk the same path insert would take; return true only if the path exists AND the final node is flagged isWord.',
      complexity: 'O(word length) time · O(1) extra space',
      twist: '"ca" is a real, reachable node in this trie — it just was never itself flagged as a complete word, so search must return false even though the walk never breaks.',
      viz: 'nodes',
      trace: () => trieSearchTrace(['cat', 'car', 'card'], ['car', 'ca']),
    },
    {
      id: 'trie-startswith',
      label: 'startsWith / Prefix Count',
      short: 'prefix query · subtree DFS',
      difficulty: 'medium',
      statement: 'Using the same trie <b>{"cat", "car", "card"}</b>, check <b>startsWith("ca")</b>, then count how many inserted words start with <b>"car"</b>.',
      recurrence: 'startsWith(prefix): walk the path, return true once reached (no isWord check). countPrefix(p): walk to p\'s node, then DFS counting isWord flags in its subtree.',
      complexity: 'O(prefix length) for the walk · O(nodes in subtree) for the count',
      twist: 'The prefix-count DFS is the payoff for building a trie in the first place — a hash set of {"cat","car","card"} could never answer "how many start with car" without scanning all three strings by hand.',
      viz: 'nodes',
      trace: () => trieStartsWithTrace(['cat', 'car', 'card'], 'ca', 'car'),
    },
    {
      id: 'trie-wildcard',
      label: 'Add and Search Word (wildcards)',
      short: "backtracking · '.' matches any char",
      difficulty: 'hard',
      statement: 'Insert <b>{"bad", "dad", "mad"}</b>, then run <b>search(".ad")</b> and <b>search("b..")</b>, where <b>\'.\'</b> matches any single character.',
      recurrence: "dfs(node, i): at a literal character follow the one matching edge; at '.', try every child edge in turn and backtrack on failure.",
      complexity: 'O(26^d · word length) worst case (d = number of wildcards) · O(word length) recursion depth',
      twist: 'At position 0 of ".ad" the root has three candidate edges (b, d, m) — the walk becomes a small backtracking search instead of one deterministic path.',
      viz: 'nodes',
      trace: () => trieWildcardSearchTrace(['bad', 'dad', 'mad'], ['.ad', 'b..']),
    },
    {
      id: 'trie-longest-buildable',
      label: 'Longest Word Built One Character at a Time',
      short: 'isWord-gated DFS',
      difficulty: 'hard',
      statement: 'Given <b>{"w", "wo", "wor", "worl", "world", "worse"}</b>, find the longest word where every one of its prefixes is also in the list.',
      recurrence: 'Insert all words. dfs(node, path): only recurse into a child if that child is itself flagged isWord; track the longest path reached.',
      complexity: 'O(total characters across all words) time · O(longest word) recursion depth',
      twist: '"worse" is a dead end even though its nodes exist in the trie — "wors" was never inserted as its own word, so the isWord-gated DFS refuses to step into it, and "world" wins.',
      viz: 'nodes',
      trace: () => trieLongestWordTrace(['w', 'wo', 'wor', 'worl', 'world', 'worse']),
    },
  ],

  syntax: [
    {
      title: 'Trie node shape',
      code: 'class TrieNode {\n  constructor() {\n    this.children = new Map();  // char -> TrieNode\n    this.isWord = false;\n  }\n}',
      note: 'A Map (or a plain object) keyed by character. isWord is what turns "a node exists here" into "a real word ends here."',
    },
    {
      title: 'Insert',
      code: 'function insert(root, word) {\n  let node = root;\n  for (const ch of word) {\n    if (!node.children.has(ch)) node.children.set(ch, new TrieNode());\n    node = node.children.get(ch);\n  }\n  node.isWord = true;\n}',
      note: 'Create a child only when that edge is missing — an existing child means an earlier word already carved this path, so reuse it.',
    },
    {
      title: 'Exact search vs. prefix search — the one-line difference',
      code: 'function walk(root, s) {\n  let node = root;\n  for (const ch of s) {\n    node = node.children.get(ch);\n    if (!node) return null;\n  }\n  return node;\n}\n// search:      const n = walk(root, word);   return n != null && n.isWord;\n// startsWith:  const n = walk(root, prefix); return n != null;',
      note: 'Same walk, shared by both. search adds "...and is it flagged as a word"; startsWith stops at "...and did we reach it at all."',
    },
    {
      title: 'Count words under a prefix',
      code: 'function countPrefix(root, prefix) {\n  const node = walk(root, prefix);\n  if (!node) return 0;\n  let count = 0;\n  (function dfs(n) {\n    if (n.isWord) count++;\n    for (const child of n.children.values()) dfs(child);\n  })(node);\n  return count;\n}',
      note: 'Walk to the prefix once, then a small DFS tallies isWord flags in its subtree — the shared structure means this never revisits a node outside that subtree.',
    },
    {
      title: 'Wildcard search — backtracking DFS',
      code: 'function search(root, word) {\n  return dfs(root, 0);\n  function dfs(node, i) {\n    if (i === word.length) return node.isWord;\n    const ch = word[i];\n    if (ch === \'.\') {\n      for (const child of node.children.values()) {\n        if (dfs(child, i + 1)) return true;\n      }\n      return false;\n    }\n    const next = node.children.get(ch);\n    return next ? dfs(next, i + 1) : false;\n  }\n}',
      note: "A literal character has exactly one edge to try; '.' tries them all and backtracks — that loop is the entire difference from plain search.",
    },
    {
      title: 'isWord-gated DFS (only descend into buildable children)',
      code: 'let best = "";\nfunction dfs(node, path) {\n  if (path.length > best.length) best = path;\n  for (const [ch, child] of node.children) {\n    if (child.isWord) dfs(child, path + ch);   // skip it otherwise\n  }\n}',
      note: 'The isWord check gates recursion itself, not just the answer — a child can exist in the trie and still be unreachable to this DFS.',
    },
  ],
};
