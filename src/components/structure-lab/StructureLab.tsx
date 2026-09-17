import { useMemo, useState } from 'react';
import type { DemoState } from './types';
import { STRUCTURES } from './content';
import { StructureStrip } from './StructureStrip';
import { MiniMenu, type StructureSection } from './MiniMenu';
import { LearnSection } from './LearnSection';
import { OperationsSection } from './OperationsSection';
import { UsesSection } from './UsesSection';
import { useAppTheme } from '@/lib/use-app-theme';
import './StructureLab.css';

/**
 * Self-serve reference for the core data structures: pick a structure, pick a section
 * (Learn / Operations / Where It's Used), and run its operations live against real state to
 * see the mechanism and the resulting Big-O. All state is local — no router, no global store.
 */
export function StructureLab() {
  const theme = useAppTheme();
  const [structureId, setStructureId] = useState(STRUCTURES[0].id);
  const [section, setSection] = useState<StructureSection>('learn');
  const [demoStates, setDemoStates] = useState<Record<string, DemoState>>(() =>
    Object.fromEntries(STRUCTURES.map((s) => [s.id, s.init()])),
  );
  const [notes, setNotes] = useState<Record<string, string | null>>({});

  const structure = useMemo(
    () => STRUCTURES.find((s) => s.id === structureId) ?? STRUCTURES[0],
    [structureId],
  );

  function runOp(opId: string) {
    const op = structure.ops.find((o) => o.id === opId);
    if (!op) return;
    const { next, note } = op.run(demoStates[structure.id]);
    setDemoStates((prev) => ({ ...prev, [structure.id]: next }));
    setNotes((prev) => ({ ...prev, [structure.id]: note }));
  }

  function resetDemo() {
    setDemoStates((prev) => ({ ...prev, [structure.id]: structure.init() }));
    setNotes((prev) => ({ ...prev, [structure.id]: null }));
  }

  return (
    <div
      className="structure-lab"
      data-theme={theme}
      style={{ ['--sl-accent-light' as string]: structure.accent, ['--sl-accent-dark' as string]: structure.accentDark }}
    >
      <div className="sl-wrap">
        <div className="sl-masthead">
          <div className="sl-eyebrow-top">Structure Lab · learn → operate → apply</div>
          <h1>What&rsquo;s actually happening under the hood</h1>
          <p>See how each data structure works, run its core operations live, and see where each one shows up in real systems.</p>
        </div>

        <StructureStrip structures={STRUCTURES} activeId={structure.id} onSelect={setStructureId} />
        <MiniMenu section={section} onSelect={setSection} />

        {section === 'learn' && <LearnSection structure={structure} />}
        {section === 'operations' && (
          <OperationsSection
            structure={structure}
            state={demoStates[structure.id]}
            note={notes[structure.id] ?? null}
            onRunOp={runOp}
            onReset={resetDemo}
          />
        )}
        {section === 'uses' && <UsesSection structure={structure} />}
      </div>
    </div>
  );
}
