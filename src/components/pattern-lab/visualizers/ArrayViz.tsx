import type { ArrayStep, Trace } from '../types';

export function ArrayViz({ trace, step }: { trace: Trace; step: ArrayStep }) {
  const inWindow = (i: number) => step.left !== undefined && step.right !== undefined && i >= step.left && i <= step.right;

  return (
    <>
      <div className="pl-array-row">
        {step.cells.map((v, i) => {
          let cls = 'pl-cell';
          cls += v !== null && v !== undefined ? ' pl-filled' : ' pl-empty';
          if (step.current === i) cls += ' pl-current';
          else if (step.source === i) cls += ' pl-source';
          if (inWindow(i)) cls += ' pl-in-window';
          const label = trace.colLabels ? trace.colLabels[i] : i;
          return (
            <div className={`pl-cellcol ${inWindow(i) ? 'pl-window-col' : ''}`} key={i}>
              <div className="pl-lbl">{label}</div>
              <div className={cls}>{v === null || v === undefined ? '' : v === Infinity ? '∞' : v}</div>
            </div>
          );
        })}
      </div>
      {step.panels?.map((p) => (
        <div className="pl-queue-row" key={p.label}>
          <span className="pl-ql-label">{p.label}</span>
          <div className="pl-chip-list">
            {p.items.length
              ? p.items.map((x, i) => <span className={`pl-chip ${x.hot ? 'pl-hot' : ''}`} key={i}>{x.text}</span>)
              : <span className="pl-chip">—</span>}
          </div>
        </div>
      ))}
      <div className="pl-viz-legend">
        <span><span className="pl-swatch pl-swatch-accent" /> current index</span>
        <span><span className="pl-swatch pl-swatch-dashed" /> source index read</span>
        {step.left !== undefined && <span><span className="pl-swatch" style={{ background: 'var(--pl-warn-soft)', border: '1px solid var(--pl-warn)' }} /> window [{step.left}, {step.right}]</span>}
      </div>
    </>
  );
}
