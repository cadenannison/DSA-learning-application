import type { MatrixStep, Trace } from '../types';

export function MatrixViz({ trace, step }: { trace: Trace; step: MatrixStep }) {
  const rows = step.cells.length;
  const cols = step.cells[0].length;
  const isSource = (i: number, j: number) => step.sources?.some(([sr, sc]) => sr === i && sc === j);

  const cells: React.ReactNode[] = [<div className="pl-mcell pl-head" key="corner" />];
  for (let j = 0; j < cols; j++) {
    cells.push(<div className="pl-mcell pl-head" key={`ch${j}`}>{trace.colLabels?.[j]}</div>);
  }
  for (let i = 0; i < rows; i++) {
    cells.push(<div className="pl-mcell pl-head" key={`rh${i}`}>{trace.rowLabels?.[i]}</div>);
    for (let j = 0; j < cols; j++) {
      const v = step.cells[i][j];
      let cls = 'pl-mcell';
      if (v !== null && v !== undefined) cls += ' pl-filled';
      if (step.current && step.current[0] === i && step.current[1] === j) cls += ' pl-current';
      else if (isSource(i, j)) cls += ' pl-source';
      cells.push(<div className={cls} key={`c${i}-${j}`}>{v === null || v === undefined ? '' : v}</div>);
    }
  }

  return (
    <>
      <div className="pl-matrix-scroll">
        <div className="pl-matrix-wrap" style={{ gridTemplateColumns: `38px repeat(${cols}, 38px)` }}>
          {cells}
        </div>
      </div>
      <div className="pl-viz-legend">
        <span><span className="pl-swatch pl-swatch-accent" /> current cell</span>
        <span><span className="pl-swatch pl-swatch-dashed" /> source cell(s) read</span>
      </div>
    </>
  );
}
