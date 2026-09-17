export type Section = 'learn' | 'recognize' | 'practice';

const ITEMS: { id: Section; label: string; sub: string }[] = [
  { id: 'learn', label: '📖 Learn', sub: 'concept + syntax' },
  { id: 'recognize', label: '🔍 Recognize It', sub: 'spot the tells' },
  { id: 'practice', label: '🧪 Practice', sub: 'simple → hard' },
];

export function MiniMenu({ section, onSelect }: { section: Section; onSelect: (s: Section) => void }) {
  return (
    <div className="pl-mini-menu">
      {ITEMS.map((it) => (
        <button
          key={it.id}
          type="button"
          className={section === it.id ? 'pl-active' : ''}
          onClick={() => onSelect(it.id)}
        >
          {it.label}
          <span className="pl-mm-sub">{it.sub}</span>
        </button>
      ))}
    </div>
  );
}
