import type { DemoState, Structure } from './types';
import { StructureStage } from './visualizers/StructureStage';

export function OperationsSection<S extends DemoState>({
  structure, state, note, onRunOp, onReset,
}: {
  structure: Structure<S>;
  state: S;
  note: string | null;
  onRunOp: (opId: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="sl-section-body">
      <div className="sl-op-bar">
        {structure.ops.map((op) => (
          <button type="button" className="sl-op-btn" key={op.id} onClick={() => onRunOp(op.id)}>
            {op.label}
            <span className="sl-ob-o">{op.big}</span>
          </button>
        ))}
        <button type="button" className="sl-op-btn" style={{ marginLeft: 'auto' }} onClick={onReset}>
          ⟲ Reset
        </button>
      </div>
      <div className="sl-ds-stage">
        <StructureStage structureId={structure.id} state={state} />
      </div>
      <div className="sl-op-note" dangerouslySetInnerHTML={{
        __html: note ?? 'Click an operation above to see it run on the structure — the explanation of what happened, and why it’s that Big-O, shows up here.',
      }}
      />
    </div>
  );
}
