import type { NodeStep } from '../types';

/**
 * Renders a positioned tree/graph with drawn SVG edges when every node
 * carries x/y (0-100 viewBox units) and the step has `edges`. Falls back
 * to the original flat chip grid otherwise (topo sort / Dijkstra / DSU).
 */
function PositionedGraph({ step }: { step: NodeStep }) {
  const byId = new Map(step.nodes.map((n) => [String(n.id), n]));
  return (
    <div className="pl-tree-wrap">
      <svg className="pl-tree-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="pl-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="pl-arrow-head" />
          </marker>
        </defs>
        {(step.edges ?? []).map((e, i) => {
          const a = byId.get(String(e.from));
          const b = byId.get(String(e.to));
          if (!a || a.x == null || a.y == null || !b || b.x == null || b.y == null) return null;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          return (
            <g key={i}>
              <line
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                className={`pl-edge ${e.state ?? ''}`}
                markerEnd={e.directed ? 'url(#pl-arrow)' : undefined}
              />
              {e.label != null && (
                <text x={mx} y={my - 2} className="pl-edge-label" textAnchor="middle">{e.label}</text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="pl-tree-nodes">
        {step.nodes.filter((n) => n.x != null && n.y != null).map((nd) => (
          <div
            key={nd.id}
            className={`pl-tnode ${nd.state}`}
            style={{ left: `${nd.x}%`, top: `${nd.y}%` }}
          >
            <div className="pl-id">{nd.id}</div>
            {nd.label && <div className="pl-indeg">{nd.label}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function NodeViz({ step }: { step: NodeStep }) {
  const positioned = step.edges && step.nodes.length > 0 && step.nodes.every((n) => n.x != null && n.y != null);

  return (
    <>
      {positioned ? (
        <PositionedGraph step={step} />
      ) : (
        <div className="pl-node-grid">
          {step.nodes.map((nd) => (
            <div className={`pl-node ${nd.state}`} key={nd.id}>
              <div className="pl-id">{nd.id}</div>
              <div className="pl-indeg">{nd.label}</div>
            </div>
          ))}
        </div>
      )}
      {step.panels.map((p) => (
        <div className="pl-queue-row" key={p.label}>
          <span className="pl-ql-label">{p.label}</span>
          <div className="pl-chip-list">
            {p.items.length
              ? p.items.map((x, i) => <span className={`pl-chip ${x.hot ? 'pl-hot' : ''}`} key={i}>{x.text}</span>)
              : <span className="pl-chip">—</span>}
          </div>
        </div>
      ))}
      {step.adjHtml && <div className="pl-adj-list" dangerouslySetInnerHTML={{ __html: step.adjHtml }} />}
    </>
  );
}
