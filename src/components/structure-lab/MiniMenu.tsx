export type StructureSection = 'learn' | 'operations' | 'uses';

const ITEMS: { id: StructureSection; label: string; sub: string }[] = [
  { id: 'learn', label: '📖 Learn', sub: 'how it works' },
  { id: 'operations', label: '⚙️ Operations', sub: 'try it live' },
  { id: 'uses', label: "📍 Where It's Used", sub: 'real applications' },
];

export function MiniMenu({ section, onSelect }: { section: StructureSection; onSelect: (s: StructureSection) => void }) {
  return (
    <div className="sl-mini-menu">
      {ITEMS.map((it) => (
        <button
          key={it.id}
          type="button"
          className={section === it.id ? 'sl-active' : ''}
          onClick={() => onSelect(it.id)}
        >
          {it.label}
          <span className="sl-mm-sub">{it.sub}</span>
        </button>
      ))}
    </div>
  );
}
