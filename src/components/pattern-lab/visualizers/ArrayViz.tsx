import type { ArrayStep, Trace } from '../types';

export function ArrayViz({ trace, step }: { trace: Trace; step: ArrayStep }) {
  return (
    <>
      <div className="pl-array-row">
        {step.cells.map((v, i) => {
          let cls = 'pl-cell';
          cls += v !== null && v !== undefined ? ' pl-filled' : ' pl-empty';
          if (step.current === i) cls += ' pl-current';
          else if (step.source === i) cls += ' pl-source';
          const label = trace.colLabels ? trace.colLabels[i] : i;
          return (
            <div className="pl-cellcol" key={i}>
              <div className="pl-lbl">{label}</div>
              <div className={cls}>{v === null || v === undefined ? '' : v === Infinity ? '∞' : v}</div>
            </div>
          );
        })}
      </div>
      <div className="pl-viz-legend">
        <span><span className="pl-swatch pl-swatch-accent" /> current index</span>
        <span><span className="pl-swatch pl-swatch-dashed" /> source index read</span>
      </div>
    </>
  );
}
