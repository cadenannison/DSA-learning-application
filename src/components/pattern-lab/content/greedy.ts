import type { Pattern } from '../types';
import { assignCookiesTrace, jumpGameTrace, gasStationTrace, candyTrace, partitionLabelsTrace } from '../traceBuilders';

export const greedyPattern: Pattern = {
  id: 'greedy',
  label: 'Greedy',
  short: 'Greedy',
  accent: '#3f8c4e',
  accentDark: '#86d99a',
  blurb: 'Make the locally-best choice at every step and never revisit it — fast, but only correct when the problem\'s structure guarantees that local choice never backfires globally.',
  recurrenceGeneral: 'choice = bestLocalOption(currentState)\ncommit(choice)   // never undone, never reconsidered\nstate = apply(state, choice)',

  levels: [
    {
      tier: 'simple',
      tag: 'the basics',
      learnHeading: 'What "greedy" actually means',
      learnBody:
        'A greedy algorithm makes whatever choice looks best <b>right now</b>, commits to it, and moves on — it never goes back to reconsider. That\'s the whole idea, and it\'s exactly what backtracking does <i>not</i> do: backtracking explores an option, and if it turns out badly, undoes it and tries another. Greedy never undoes anything. It trusts that a string of locally-best choices adds up to the globally-best answer.',
      learnFocus: [
        'At each step, take whatever option looks best right now.',
        'Never go back and change an earlier choice.',
        'Greedy vs. backtracking: greedy commits once; backtracking explores and undoes.',
      ],
      cues: [
        'asks for the fewest/most of something using a simple, obvious rule at each step',
        'a single left-to-right (or sorted) pass seems to naturally build the answer',
      ],
      examples: [
        { snippet: '"Each child gets <b>at most one</b> cookie... maximize the number of content children."', tell: 'A simple "use the smallest thing that still works" rule per step, with no need to reconsider past matches, is the greedy signature.' },
        { snippet: '"...determine if you are able to <b>reach the last index</b>."', tell: 'One straightforward decision per step (how far can I reach from here) with no backtracking needed → greedy single pass.' },
      ],
    },
    {
      tier: 'easy',
      tag: 'when it\'s valid',
      learnHeading: 'Greedy works IF...',
      learnBody:
        'Greedy is fast — usually O(n) or O(n log n) — but it\'s only <b>correct</b> when the problem has the right structure: a <b>greedy-choice property</b> (the locally-optimal choice is always part of some globally-optimal solution) plus <b>optimal substructure</b> (once you commit to that choice, what\'s left is a smaller version of the same problem). Most of learning greedy isn\'t writing the loop — it\'s learning to recognize <i>when</i> that local choice is actually safe to lock in.',
      learnFocus: [
        'Greedy-choice property: the best local move is always part of some optimal answer.',
        'Optimal substructure: after committing, what remains is the same problem, smaller.',
        'Speed isn\'t the question — correctness is; always ask "can this choice ever backfire?"',
      ],
      cues: [
        'sorting the input first makes an obvious "take the next one" rule work',
        'the problem statement all but proves the greedy rule ("always pick the earliest/smallest/cheapest")',
      ],
      examples: [
        { snippet: '"Kids\' greed factors and cookie sizes... assign the <b>smallest</b> cookie that still satisfies a kid."', tell: 'Sorting both arrays first, then always matching the smallest-sufficient option, is a textbook greedy-choice property — giving a bigger cookie than necessary can only ever hurt.' },
      ],
    },
    {
      tier: 'medium',
      tag: 'two-pass & reset',
      learnHeading: 'Two-pass and reset-tracking greedy',
      learnBody:
        'Some greedy problems need more than one straight scan. <b>Gas Station</b>: track a running tank in a single pass, but the moment it goes negative, every station from the current start candidate through here is provably invalid — reset the start candidate to the next station and keep going. If total gas ≥ total cost, this single pass is guaranteed to land on the one valid start. <b>Candy</b>: one constraint ("more than your left neighbor if you rate higher") needs a left-to-right pass; the mirror constraint needs a right-to-left pass; take the max of both passes at each position so neither requirement gets violated.',
      learnFocus: [
        'Gas Station: reset the start candidate whenever the running tank dips negative — those stations are provably out.',
        'Candy: left pass and right pass each enforce a one-directional rule; combine with max(), not by re-running either pass.',
        'A single pass with a running best/worst — no backtracking, no revisiting — is still greedy even when it resets a candidate.',
      ],
      cues: [
        'a constraint depends on BOTH neighbors at once → suspect a two-pass greedy',
        '"if a running total ever goes negative/below zero, that starting point is invalid" phrasing',
      ],
      confuse:
        '<b>Greedy vs. DP:</b> DP explores and remembers every subproblem because the locally-best choice isn\'t always safe to commit to. Greedy is only valid when you can <i>prove</i> the locally-best choice never needs reconsidering. If you\'re not sure greedy is correct — if you can\'t articulate why the local choice is safe — that uncertainty is usually a sign the problem actually needs DP\'s "keep every option open" table instead.',
      examples: [
        { snippet: '"...return the starting gas station\'s index if you can travel around the circuit <b>once</b> in the clockwise direction, otherwise <b>-1</b>."', tell: 'A running total that determines validity, with a reset rule when it dips negative, signals single-pass greedy with a reset — not simulate-every-start (which would be O(n²)).' },
      ],
    },
    {
      tier: 'hard',
      tag: 'precompute + greedy',
      learnHeading: 'Non-obvious sort keys and precomputed lookups',
      learnBody:
        'The hardest greedy problems don\'t hand you an obvious rule — you have to <b>derive</b> the right sort key or build a lookup table before the greedy pass can even start. <b>Partition Labels</b> is the clean example: you can\'t greedily decide where a partition ends just by scanning left to right — you first need to know each character\'s <i>last</i> occurrence anywhere in the string. Precompute that lookup, then the greedy pass becomes simple: keep extending the current partition\'s boundary to the last occurrence of every character you\'ve seen, and cut the moment the scan catches up to that boundary.',
      learnFocus: [
        'When no simple per-step rule is visible, ask what you\'d need to know in advance to make one obvious.',
        'A precomputed lookup (last-occurrence index, a custom sort key) often turns a hard problem into a one-line greedy scan.',
        'The greedy PART is still trivial once the lookup exists — the difficulty moved into the setup, not the loop.',
      ],
      cues: [
        'the "obvious" greedy rule needs information ("does this appear again later?") that a single forward pass can\'t see yet',
        'the intended solution sorts by a derived key, not a value straight from the input',
      ],
      examples: [
        { snippet: '"...partition it into as many parts as possible so that each letter appears in <b>at most one</b> part."', tell: '"As many parts as possible" needs to know how far each letter still recurs — that "needs future information" tell means precompute a last-occurrence map before the greedy scan.' },
      ],
    },
  ],

  variants: [
    {
      id: 'assign-cookies',
      label: 'Assign Cookies',
      short: 'array · sort & two-pointer',
      difficulty: 'simple',
      statement: 'Kids\' greed factors <b>g = [1, 2, 3]</b>, cookie sizes <b>s = [1, 1]</b>. Each kid is content only if given a cookie of size ≥ their greed factor. Maximize the number of content kids.',
      recurrence: 'Sort g and s. Walk both with two pointers: if the smallest remaining cookie satisfies the smallest remaining kid, that kid is content and both pointers advance; otherwise only the cookie pointer advances.',
      complexity: 'O(n log n + m log m) time (sorting) · O(1) extra space',
      twist: 'The greedy insight is to never "waste" a big cookie on a low-greed kid — always try the smallest cookie against the smallest unsatisfied kid first.',
      viz: 'array',
      trace: () => assignCookiesTrace([1, 2, 3], [1, 1]),
    },
    {
      id: 'jump-game',
      label: 'Jump Game',
      short: 'array · running max reach',
      difficulty: 'easy',
      statement: 'nums = <b>[2, 3, 1, 1, 4]</b>, where nums[i] is the max jump length from index i. Can you reach the last index?',
      recurrence: 'Scan left to right, tracking farthest = max(farthest, i + nums[i]). If i ever exceeds farthest, that index is unreachable.',
      complexity: 'O(n) time · O(1) space',
      twist: 'No need to try every possible jump length from every index — the single greedy quantity "farthest reachable so far" already captures everything that matters.',
      viz: 'array',
      trace: () => jumpGameTrace([2, 3, 1, 1, 4]),
    },
    {
      id: 'gas-station',
      label: 'Gas Station',
      short: 'array · single pass with reset',
      difficulty: 'medium',
      statement: 'gas = <b>[1, 2, 3, 4, 5]</b>, cost = <b>[3, 4, 5, 1, 2]</b> around a circular route. Find the starting station index that lets you complete the circuit, or know it\'s impossible.',
      recurrence: 'One pass: total += gas[i]-cost[i]; tank += gas[i]-cost[i]. If tank < 0, no station from the current start through i can work — reset start = i+1, tank = 0.',
      complexity: 'O(n) time · O(1) space',
      twist: 'It looks like it needs testing every starting point (O(n²)), but the greedy reset rule proves a single O(n) pass finds the one valid start whenever total gas ≥ total cost.',
      viz: 'array',
      trace: () => gasStationTrace([1, 2, 3, 4, 5], [3, 4, 5, 1, 2]),
    },
    {
      id: 'candy',
      label: 'Candy',
      short: 'array · two-pass greedy',
      difficulty: 'hard',
      statement: 'Children stand in a line with ratings <b>[1, 0, 2]</b>. Each child must get at least 1 candy, and any child with a higher rating than a neighbor must get more candy than that neighbor. Find the minimum total candies.',
      recurrence: 'Left pass: c[i] = c[i-1]+1 if ratings[i] > ratings[i-1]. Right pass: c[i] = max(c[i], c[i+1]+1) if ratings[i] > ratings[i+1]. Sum c.',
      complexity: 'O(n) time · O(n) space',
      twist: 'Neither direction alone satisfies both neighbor constraints — the left pass and right pass are each a clean greedy rule, and max() at each position reconciles them.',
      viz: 'array',
      trace: () => candyTrace([1, 0, 2]),
    },
    {
      id: 'partition-labels',
      label: 'Partition Labels',
      short: 'array · precompute + greedy',
      difficulty: 'hard',
      statement: 'String s = <b>"ababcbacadefegdehijhklij"</b>. Partition it into as many parts as possible so each letter appears in at most one part. Return the size of each part.',
      recurrence: 'Precompute last[ch] = last index of ch in s. Scan left to right, extending end = max(end, last[s[i]]); when i reaches end, cut a partition and start the next one.',
      complexity: 'O(n) time · O(1) extra space (fixed alphabet lookup)',
      twist: 'The greedy scan is trivial — the real work is realizing you need each character\'s last-occurrence index computed up front before a forward pass can know when it\'s safe to cut.',
      viz: 'array',
      trace: () => partitionLabelsTrace('ababcbacadefegdehijhklij'),
    },
  ],

  syntax: [
    {
      title: 'Sort-then-scan skeleton',
      code: 'items.sort((a, b) => a.key - b.key);\nlet result = init;\nfor (const item of items) {\n  if (isBestChoiceNow(item, result)) {\n    result = apply(result, item);\n  }\n}',
      note: 'The most common greedy shape: sort by whatever key makes the local choice obvious, then make one forward pass committing to each choice as it comes.',
    },
    {
      title: 'Single-pass running max/min (Jump Game style)',
      code: 'let best = initialValue;\nfor (let i = 0; i < nums.length; i++) {\n  if (i > best) return false; // fell behind\n  best = Math.max(best, i + nums[i]);\n}',
      note: 'Track one running quantity instead of every possible path — the running value already summarizes every choice made so far.',
    },
    {
      title: 'Reset-tracking single pass (Gas Station style)',
      code: 'let total = 0, running = 0, start = 0;\nfor (let i = 0; i < n; i++) {\n  const diff = gain(i);\n  total += diff;\n  running += diff;\n  if (running < 0) { start = i + 1; running = 0; }\n}\nreturn total >= 0 ? start : -1;',
      note: 'When a running total goes negative, everything up to here is provably invalid — reset the candidate and keep scanning instead of restarting from scratch.',
    },
    {
      title: 'Two-pass left-then-right (Candy style)',
      code: 'const c = new Array(n).fill(1);\nfor (let i = 1; i < n; i++)\n  if (rating[i] > rating[i-1]) c[i] = c[i-1] + 1;\nfor (let i = n - 2; i >= 0; i--)\n  if (rating[i] > rating[i+1]) c[i] = Math.max(c[i], c[i+1] + 1);',
      note: 'One directional constraint per pass. Always combine with Math.max on the second pass — overwriting would silently break the first pass\'s guarantee.',
    },
    {
      title: 'Precompute a lookup, then greedy scan (Partition Labels style)',
      code: 'const last = {};\nfor (let i = 0; i < s.length; i++) last[s[i]] = i;\nlet start = 0, end = 0;\nfor (let i = 0; i < s.length; i++) {\n  end = Math.max(end, last[s[i]]);\n  if (i === end) { /* cut here */ start = i + 1; }\n}',
      note: 'If the greedy rule needs information from later in the input ("does this recur?"), build that lookup first — the scan itself stays a plain greedy pass.',
    },
    {
      title: 'Two-pointer greedy match (Assign Cookies style)',
      code: 'a.sort((x, y) => x - y);\nb.sort((x, y) => x - y);\nlet i = 0, j = 0;\nwhile (i < a.length && j < b.length) {\n  if (b[j] >= a[i]) i++;\n  j++;\n}\nreturn i; // number matched',
      note: 'Sort both sides, then advance the "supply" pointer every step and the "demand" pointer only on a match — never revisit a cookie once you\'ve moved past it.',
    },
  ],
};
