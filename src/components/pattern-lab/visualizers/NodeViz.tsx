import type { NodeStep } from '../types';

export function NodeViz({ step }: { step: NodeStep }) {
  return (
    <>
      <div className="pl-node-grid">
        {step.nodes.map((nd) => (
          <div className={`pl-node ${nd.state}`} key={nd.id}>
            <div className="pl-id">{nd.id}</div>
            <div className="pl-indeg">{nd.label}</div>
          </div>
        ))}
      </div>
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
