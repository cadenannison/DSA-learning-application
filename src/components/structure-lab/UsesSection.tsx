import type { Structure } from './types';

export function UsesSection({ structure }: { structure: Structure }) {
  return (
    <div className="sl-section-body">
      <div>
        <h2 className="sl-eyebrow">Where {structure.label.toLowerCase()} actually show up</h2>
        <div className="sl-use-grid">
          {structure.useCases.map((u, i) => (
            <div className="sl-use-card" key={i}>
              <h4>{u.title}</h4>
              <p dangerouslySetInnerHTML={{ __html: u.body }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
