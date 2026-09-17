import type { ListDemoState } from '../types';

export function ListViz({ state }: { state: ListDemoState }) {
  if (!state.nodes.length) {
    return (
      <div className="sl-list-row">
        <span className="sl-list-null">head → NULL</span>
      </div>
    );
  }
  return (
    <div className="sl-list-row">
      {state.nodes.map((n, i) => {
        const isCurrent = state.hi?.current === n.id;
        const isNew = state.hi?.newId === n.id;
        const lbl = i === 0 ? 'HEAD' : i === state.nodes.length - 1 ? 'TAIL' : '';
        return (
          <span key={n.id} style={{ display: 'contents' }}>
            <div className={`sl-list-node ${isCurrent ? 'sl-current' : ''} ${isNew ? 'sl-new' : ''}`}>
              {lbl && <div className="sl-ln-lbl">{lbl}</div>}
              {n.val}
            </div>
            <div className="sl-list-arrow">→</div>
            {i === state.nodes.length - 1 && <div className="sl-list-null">NULL</div>}
          </span>
        );
      })}
    </div>
  );
}
