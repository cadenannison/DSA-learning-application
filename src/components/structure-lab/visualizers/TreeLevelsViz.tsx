import type { Highlight } from '../types';

/** Renders a level-order layout of numeric node values — shared by Trees (BST) and Heaps,
 * which both display as a binary-tree shape even though the heap is array-backed. */
export function TreeLevelsViz({ levels, hi }: { levels: number[][]; hi: Highlight | null }) {
  if (!levels.length) return <div className="sl-op-note">Empty.</div>;
  const highlightPath = hi?.path ?? [];
  const current = hi?.current;
  const order = hi?.order;
  return (
    <div className="sl-tree-levels">
      {levels.map((level, li) => (
        <div className="sl-tree-level" key={li}>
          {level.map((v, vi) => {
            const visited = highlightPath.includes(v);
            const isCurrent = current === v;
            const badge = order?.has(v) ? <sub style={{ fontSize: 8 }}>{order.get(v)}</sub> : null;
            return (
              <div className={`sl-tree-node ${visited ? 'sl-visited' : ''} ${isCurrent ? 'sl-current' : ''}`} key={`${li}-${vi}`}>
                {v}
                {badge}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
