import type { Trace, CodeLine, NodeItem, NodeEdge } from '../types';

/**
 * Trie trace builders — run the real algorithm, record a step at every
 * meaningful moment. See ../../README.md for the authoring checklist.
 *
 * A real trie is built out of nested nodes (a Map<char, node> of children
 * plus an isWord flag) — never faked. Each node's `id` is the path-so-far
 * string ("" for the root, "c", "ca", "car", ...), which both uniquely
 * identifies it and doubles as a human-readable label for edges/notes.
 * Nodes are laid out top-down (root at the top, depth increasing downward)
 * and re-derived from the live tree on every step, so shared-prefix nodes
 * (e.g. "c", "ca", "car" for {cat, car, card}) are visibly reused, not
 * recreated, across every word that passes through them.
 */

interface TNode {
  id: string;
  ch: string;
  isWord: boolean;
  children: Map<string, TNode>;
}

function makeNode(id: string, ch: string): TNode {
  return { id, ch, isWord: false, children: new Map() };
}

/** Runs the real insert — creates nodes only where the path doesn't already exist. */
function insertWord(root: TNode, word: string): TNode {
  let node = root;
  for (const ch of word) {
    let child = node.children.get(ch);
    if (!child) {
      child = makeNode(node.id + ch, ch);
      node.children.set(ch, child);
    }
    node = child;
  }
  node.isWord = true;
  return node;
}

function countLeaves(n: TNode): number {
  if (n.children.size === 0) return 1;
  let sum = 0;
  for (const c of n.children.values()) sum += countLeaves(c);
  return sum;
}

/** Top-down layout: root near the top, children spread horizontally beneath their parent. */
function layoutTrie(root: TNode): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  const assign = (n: TNode, depth: number, xLo: number, xHi: number) => {
    const y = Math.min(94, 10 + depth * 16);
    if (n.children.size === 0) {
      pos.set(n.id, { x: (xLo + xHi) / 2, y });
      return;
    }
    const total = countLeaves(n);
    let cursor = xLo;
    for (const child of n.children.values()) {
      const share = (countLeaves(child) / total) * (xHi - xLo);
      assign(child, depth + 1, cursor, cursor + share);
      cursor += share;
    }
    const xs = [...n.children.values()].map((c) => pos.get(c.id)!.x);
    pos.set(n.id, { x: xs.reduce((a, b) => a + b, 0) / xs.length, y });
  };
  assign(root, 0, 6, 94);
  return pos;
}

/** Snapshots the CURRENT live trie into NodeItem/NodeEdge arrays for one step. */
function snapshot(
  root: TNode,
  opts: { current?: string; doneNodes?: Set<string>; activeEdge?: string; doneEdges?: Set<string> } = {},
): { nodes: NodeItem[]; edges: NodeEdge[] } {
  const pos = layoutTrie(root);
  const nodes: NodeItem[] = [];
  const edges: NodeEdge[] = [];
  const walk = (n: TNode) => {
    const p = pos.get(n.id)!;
    let state: NodeItem['state'] = '';
    if (opts.current === n.id) state = 'current';
    else if (opts.doneNodes?.has(n.id)) state = 'done';
    // Label is the character this node was reached by (empty for the root);
    // a trailing bullet flags a complete word so the diagram stays readable.
    const label = n.ch + (n.isWord ? ' •' : '');
    nodes.push({ id: n.id, label, state, x: p.x, y: p.y });
    for (const child of n.children.values()) {
      const ekey = `${n.id}>${child.id}`;
      let estate: NodeEdge['state'] = '';
      if (opts.activeEdge === ekey) estate = 'active';
      else if (opts.doneEdges?.has(ekey)) estate = 'done';
      edges.push({ from: n.id, to: child.id, label: child.ch, state: estate, directed: true });
      walk(child);
    }
  };
  walk(root);
  return { nodes, edges };
}

// ---- Implement Trie — Insert ----------------------------------------------

export function trieInsertTrace(words: string[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function insert(word) {' },
    { k: 'start', t: '  let node = root;' },
    { k: 'loop', t: '  for (const ch of word) {' },
    { k: 'create', t: '    if (!node.children.has(ch)) node.children.set(ch, new TrieNode());' },
    { k: 'advance', t: '    node = node.children.get(ch);' },
    { k: 'endloop', t: '  }' },
    { k: 'mark', t: '  node.isWord = true;' },
    { k: 'end', t: '}' },
  ];
  const root = makeNode('', '');
  const doneEdges = new Set<string>();
  const doneNodes = new Set<string>();
  const steps: Trace['steps'] = [];
  const push = (line: string, current: string | undefined, activeEdge: string | undefined, note: string) => {
    const { nodes, edges } = snapshot(root, { current, doneNodes, activeEdge, doneEdges });
    steps.push({ kind: 'nodes', line, nodes, edges, panels: [], note });
  };

  push('init', root.id, undefined, 'Start with an empty trie — just a root, no words inserted yet.');
  for (const word of words) {
    let node = root;
    push('start', node.id, undefined, `Insert "${word}": begin walking from the root.`);
    for (const ch of word) {
      const existed = node.children.has(ch);
      let child = node.children.get(ch);
      if (!child) {
        child = makeNode(node.id + ch, ch);
        node.children.set(ch, child);
      }
      const ekey = `${node.id}>${child.id}`;
      push(
        existed ? 'advance' : 'create',
        child.id,
        ekey,
        existed
          ? `"${child.id}" already exists — "${word}" shares this prefix with an earlier word, so we reuse the node instead of creating a new one.`
          : `No child for "${ch}" yet at this point in the trie — create a new node "${child.id}".`,
      );
      doneEdges.add(ekey);
      node = child;
    }
    node.isWord = true;
    doneNodes.add(node.id);
    push('mark', node.id, undefined, `Finished "${word}" — flag node "${node.id}" as a complete word (isWord = true).`);
  }
  push(
    'end',
    undefined,
    undefined,
    `All ${words.length} words inserted. "c", "ca", and "car" were each created once and reused by every word that shares that prefix — that sharing is the entire point of a trie.`,
  );
  return { lines, steps };
}

// ---- Implement Trie — Search ----------------------------------------------

export function trieSearchTrace(words: string[], queries: string[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function search(word) {' },
    { k: 'start', t: '  let node = root;' },
    { k: 'loop', t: '  for (const ch of word) {' },
    { k: 'miss', t: '    if (!node.children.has(ch)) return false;' },
    { k: 'advance', t: '    node = node.children.get(ch);' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: "  return node.isWord;   // path existing isn't enough — the LAST node must be flagged" },
    { k: 'end', t: '}' },
  ];
  const root = makeNode('', '');
  for (const w of words) insertWord(root, w);
  const steps: Trace['steps'] = [];
  const push = (line: string, current: string | undefined, activeEdge: string | undefined, note: string) => {
    const { nodes, edges } = snapshot(root, { current, activeEdge });
    steps.push({ kind: 'nodes', line, nodes, edges, panels: [], note });
  };

  push(
    'init',
    undefined,
    undefined,
    `Trie already built from {${words.join(', ')}}. Search walks the exact same path insert would take, then checks one extra thing at the very end.`,
  );
  for (const q of queries) {
    let node = root;
    push('start', node.id, undefined, `search("${q}"): begin at the root.`);
    let broke = false;
    for (const ch of q) {
      const child = node.children.get(ch);
      if (!child) {
        push('miss', node.id, undefined, `No child "${ch}" from here — the path breaks. search("${q}") → false.`);
        broke = true;
        break;
      }
      const ekey = `${node.id}>${child.id}`;
      push('advance', child.id, ekey, `Follow "${ch}" → node "${child.id}" exists — keep walking.`);
      node = child;
    }
    if (!broke) {
      push(
        'ret',
        node.id,
        undefined,
        node.isWord
          ? `Path for "${q}" ends at node "${node.id}", which IS flagged isWord → search("${q}") → true.`
          : `Path for "${q}" exists — node "${node.id}" is reachable — but it is NOT flagged isWord (it's only a prefix of "card", never inserted on its own) → search("${q}") → false. This is the classic gotcha: a node existing on the path is not the same as that word having been inserted.`,
      );
    }
  }
  return { lines, steps };
}

// ---- startsWith / prefix count ---------------------------------------------

export function trieStartsWithTrace(words: string[], prefix: string, countPrefix: string): Trace {
  const lines: CodeLine[] = [
    { k: 'swinit', t: 'function startsWith(prefix) {' },
    { k: 'swstart', t: '  let node = root;' },
    { k: 'swloop', t: '  for (const ch of prefix) {' },
    { k: 'swmiss', t: '    if (!node.children.has(ch)) return false;' },
    { k: 'swadvance', t: '    node = node.children.get(ch);' },
    { k: 'swendloop', t: '  }' },
    { k: 'swret', t: '  return true;   // just reaching the node is enough — no isWord check' },
    { k: 'swend', t: '}' },
    { k: 'cpinit', t: 'function countWordsWithPrefix(prefix) {' },
    { k: 'cpwalk', t: '  const node = walkTo(prefix);   // same walk as startsWith' },
    { k: 'cpdfs', t: '  function dfs(n) { let c = n.isWord ? 1 : 0; for (const ch of n.children.values()) c += dfs(ch); return c; }' },
    { k: 'cpret', t: '  return dfs(node);' },
    { k: 'cpend', t: '}' },
  ];
  const root = makeNode('', '');
  for (const w of words) insertWord(root, w);
  const steps: Trace['steps'] = [];
  const push = (line: string, current: string | undefined, activeEdge: string | undefined, doneNodes: Set<string> | undefined, note: string) => {
    const { nodes, edges } = snapshot(root, { current, activeEdge, doneNodes });
    steps.push({ kind: 'nodes', line, nodes, edges, panels: [], note });
  };

  push('swinit', undefined, undefined, undefined, `Trie built from {${words.join(', ')}}. startsWith("${prefix}") is almost the same walk as search — just without the final isWord check.`);
  let node = root;
  push('swstart', node.id, undefined, undefined, `startsWith("${prefix}"): begin at the root.`);
  for (const ch of prefix) {
    const child = node.children.get(ch)!;
    const ekey = `${node.id}>${child.id}`;
    push('swadvance', child.id, ekey, undefined, `Follow "${ch}" → node "${child.id}" exists.`);
    node = child;
  }
  push('swret', node.id, undefined, undefined, `Reached node "${node.id}" — the path exists, so startsWith("${prefix}") → true. Notice we never looked at isWord: a hash set of whole words can't answer this without scanning everything, because "${prefix}" was never inserted as a word by itself.`);

  let cnode = root;
  push('cpinit', cnode.id, undefined, undefined, `Now count how many inserted words start with "${countPrefix}" — walk to that node first, exactly like startsWith.`);
  for (const ch of countPrefix) {
    const child = cnode.children.get(ch)!;
    const ekey = `${cnode.id}>${child.id}`;
    push('cpwalk', child.id, ekey, undefined, `Follow "${ch}" → node "${child.id}".`);
    cnode = child;
  }
  const found = new Set<string>();
  let count = 0;
  const dfs = (n: TNode) => {
    if (n.isWord) {
      count++;
      found.add(n.id);
      push('cpdfs', n.id, undefined, new Set(found), `Node "${n.id}" is flagged isWord → running count becomes ${count}.`);
    } else {
      push('cpdfs', n.id, undefined, new Set(found), `Node "${n.id}" is not itself a complete word — keep descending into its subtree.`);
    }
    for (const child of n.children.values()) dfs(child);
  };
  dfs(cnode);
  push('cpret', undefined, undefined, new Set(found), `DFS over the "${countPrefix}" subtree found ${count} word(s) → ${count} inserted words share the prefix "${countPrefix}" (${[...found].join(', ')}).`);
  return { lines, steps };
}

// ---- Add and Search Word — with '.' wildcards ------------------------------

export function trieWildcardSearchTrace(words: string[], queries: string[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function search(word) {' },
    { k: 'dfshead', t: '  function dfs(node, i) {' },
    { k: 'base', t: '    if (i === word.length) return node.isWord;' },
    { k: 'chvar', t: '    const ch = word[i];' },
    { k: 'wild', t: '    if (ch === ".") {' },
    { k: 'wildloop', t: '      for (const child of node.children.values()) {' },
    { k: 'trywild', t: '        if (dfs(child, i + 1)) return true;   // try this branch' },
    { k: 'endwildloop', t: '      }   // that branch failed — backtrack, try the next child edge' },
    { k: 'wildfail', t: '      return false;   // no child edge worked' },
    { k: 'lit', t: '    } else {' },
    { k: 'litcheck', t: '      if (!node.children.has(ch)) return false;' },
    { k: 'littry', t: '      return dfs(node.children.get(ch), i + 1);' },
    { k: 'litend', t: '    }' },
    { k: 'dfsend', t: '  }' },
    { k: 'call', t: '  return dfs(root, 0);' },
    { k: 'end', t: '}' },
  ];
  const root = makeNode('', '');
  for (const w of words) insertWord(root, w);
  const steps: Trace['steps'] = [];
  const push = (line: string, current: string | undefined, activeEdge: string | undefined, note: string) => {
    const { nodes, edges } = snapshot(root, { current, activeEdge });
    steps.push({ kind: 'nodes', line, nodes, edges, panels: [], note });
  };

  push('init', undefined, undefined, `Trie built from {${words.join(', ')}}. A '.' matches any single character, so at a wildcard position the DFS must try every existing child edge instead of following one — that's what makes this backtracking, not a plain walk.`);

  for (const q of queries) {
    push('call', root.id, undefined, `search("${q}"): begin the wildcard DFS at the root.`);
    const dfs = (node: TNode, i: number): boolean => {
      if (i === q.length) {
        push(
          'base',
          node.id,
          undefined,
          node.isWord
            ? `End of "${q}" reached at node "${node.id}", which IS a word → this branch succeeds.`
            : `End of "${q}" reached at node "${node.id}", which is NOT a word → this branch fails.`,
        );
        return node.isWord;
      }
      const ch = q[i];
      if (ch === '.') {
        const candidates = [...node.children.values()];
        push('wild', node.id, undefined, `Position ${i} is '.' — try all ${candidates.length} child edge(s) of "${node.id || '(root)'}": [${candidates.map((c) => c.ch).join(', ')}].`);
        for (const child of candidates) {
          const ekey = `${node.id}>${child.id}`;
          push('trywild', child.id, ekey, `Try '${child.ch}' → descend into "${child.id}".`);
          if (dfs(child, i + 1)) return true;
          push('endwildloop', node.id, undefined, `Branch '${child.ch}' from "${node.id || '(root)'}" failed — backtrack and try the next child edge.`);
        }
        push('wildfail', node.id, undefined, `Every child edge of "${node.id || '(root)'}" failed at this wildcard position → this branch fails.`);
        return false;
      } else {
        const child = node.children.get(ch);
        if (!child) {
          push('litcheck', node.id, undefined, `No child "${ch}" from "${node.id || '(root)'}" — this branch fails immediately.`);
          return false;
        }
        const ekey = `${node.id}>${child.id}`;
        push('littry', child.id, ekey, `Position ${i} is literal '${ch}' — the only edge to follow is "${child.id}".`);
        return dfs(child, i + 1);
      }
    };
    const result = dfs(root, 0);
    push('end', undefined, undefined, `search("${q}") → ${result}.`);
  }
  return { lines, steps };
}

// ---- Longest Word That Can Be Built One Character at a Time ----------------

export function trieLongestWordTrace(words: string[]): Trace {
  const lines: CodeLine[] = [
    { k: 'ins', t: 'for (const w of words) insert(w);   // build the trie, flagging isWord along the way' },
    { k: 'dfshead', t: 'function dfs(node, path) {' },
    { k: 'update', t: '  if (path.length > best.length) best = path;' },
    { k: 'forchild', t: '  for (const [ch, child] of node.children) {' },
    { k: 'prune', t: '    if (child.isWord) dfs(child, path + ch);   // only descend if buildable' },
    { k: 'endfor', t: '  }' },
    { k: 'dfsend', t: '}' },
    { k: 'call', t: 'dfs(root, "");' },
  ];
  const root = makeNode('', '');
  const steps: Trace['steps'] = [];
  const push = (line: string, current: string | undefined, doneNodes: Set<string> | undefined, note: string) => {
    const { nodes, edges } = snapshot(root, { current, doneNodes });
    steps.push({ kind: 'nodes', line, nodes, edges, panels: [], note });
  };

  const wordNodes = new Set<string>();
  for (const w of words) {
    const end = insertWord(root, w);
    wordNodes.add(end.id);
    push('ins', end.id, new Set(wordNodes), `Insert "${w}" — node "${end.id}" is flagged isWord.`);
  }
  push('call', root.id, new Set(wordNodes), `Trie built. Now DFS from the root, but only step into a child if THAT child is itself a complete word — that's what "buildable one character at a time" means.`);

  let best = '';
  const dfs = (node: TNode, path: string) => {
    if (path.length > best.length) best = path;
    push('update', node.id, new Set(wordNodes), `At "${node.id || '(root)'}" (path so far: "${path}") — longest buildable word found so far: "${best || '(none)'}".`);
    for (const [ch, child] of node.children) {
      if (child.isWord) {
        push('prune', child.id, new Set(wordNodes), `Child "${child.id}" IS a complete word → we can build through it, continue the DFS.`);
        dfs(child, path + ch);
      } else {
        push('prune', child.id, new Set(wordNodes), `Child "${child.id}" exists but is NOT a complete word → can't build it one character at a time, so this branch is pruned.`);
      }
    }
  };
  dfs(root, '');
  push('call', undefined, new Set(wordNodes), `DFS complete. Longest word that can be built one character at a time: "${best}".`);
  return { lines, steps };
}
