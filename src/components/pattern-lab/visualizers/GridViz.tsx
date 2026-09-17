import type { GridStep, GridCellState } from '../types';

const LEGEND_TEXT: Record<GridCellState, string> = {
  land: 'land / fresh', fresh: 'land / fresh', water: 'water', empty: 'empty',
  frontier: 'in queue', visited: 'visited', rotten: 'rotten', current: 'current cell',
};

export function GridViz({ step }: { step: GridStep }) {
  const rows = step.grid.length;
  const cols = step.grid[0].length;
  const present = new Set<GridCellState>();
  step.grid.forEach((row) => row.forEach((s) => present.add(s)));

  return (
    <>
      <div className="pl-grid-wrap" style={{ gridTemplateColumns: `repeat(${cols}, 34px)` }}>
        {step.grid.flatMap((row, r) => row.map((s, c) => <div className={`pl-gcell pl-${s}`} key={`${r}-${c}`} />))}
      </div>
      {step.count !== undefined && (
        <div className="pl-queue-row"><span className="pl-ql-label">islands so far</span><span className="pl-chip pl-hot">{step.count}</span></div>
      )}
      {step.minute !== undefined && (
        <div className="pl-queue-row"><span className="pl-ql-label">minute</span><span className="pl-chip pl-hot">{step.minute}</span></div>
      )}
      <div className="pl-viz-legend">
        {[...present].map((s) => (
          <span key={s}><span className={`pl-swatch pl-gcell pl-${s}`} style={{ width: 12, height: 12 }} /> {LEGEND_TEXT[s] ?? s}</span>
        ))}
      </div>
    </>
  );
}
