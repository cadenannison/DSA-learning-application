import type { Structure } from './types';

export function StructureStrip({
  structures, activeId, onSelect,
}: {
  structures: Structure[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="sl-structure-strip">
      {structures.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`sl-structure-tab ${s.id === activeId ? 'sl-active' : ''}`}
          style={{ ['--sl-tab-accent' as string]: s.accent, ['--sl-tab-accent-dark' as string]: s.accentDark }}
          onClick={() => onSelect(s.id)}
        >
          <span className="sl-dot" /> {s.label}
        </button>
      ))}
    </div>
  );
}
