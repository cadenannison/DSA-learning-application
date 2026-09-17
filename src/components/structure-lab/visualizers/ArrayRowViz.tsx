import type { Highlight } from '../types';

/** Renders a row of value cells with index/role labels underneath. Shared by Array (index
 * labels) and Queue (FRONT/BACK labels) — see `labelFor`. */
export function ArrayRowViz({
  values, hi, labelFor,
}: {
  values: number[];
  hi: Highlight | null;
  labelFor: (i: number, total: number) => string;
}) {
  if (!values.length) return <div className="sl-op-note">Empty.</div>;
  return (
    <div className="sl-array-row">
      {values.map((v, i) => {
        const isCurrent = hi?.current === i;
        const isSource = hi?.source === i;
        return (
          <div className="sl-cellcol" key={i}>
            <div className={`sl-cell sl-filled ${isCurrent ? 'sl-current' : ''} ${isSource ? 'sl-source' : ''}`}>{v}</div>
            <div className="sl-lbl">{labelFor(i, values.length)}</div>
          </div>
        );
      })}
    </div>
  );
}
