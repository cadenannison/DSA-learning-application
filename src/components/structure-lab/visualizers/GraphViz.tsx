import type { GraphDemoState } from '../types';

export function GraphViz({ state }: { state: GraphDemoState }) {
  return (
    <div className="sl-graph-stage">
      <div className="sl-graph-nodes">
        {state.nodes.map((n) => (
          <div className={`sl-tree-node sl-graph-node ${state.hi?.current === n ? 'sl-current' : ''}`} key={n}>
            {n}
          </div>
        ))}
      </div>
      <div className="sl-adj-list">
        {state.nodes.length
          ? state.nodes.map((n, i) => (
              <span key={n}>
                {n} → [{(state.adj[n] || []).join(', ')}]
                {i < state.nodes.length - 1 && <br />}
              </span>
            ))
          : '(no nodes yet)'}
      </div>
    </div>
  );
}
