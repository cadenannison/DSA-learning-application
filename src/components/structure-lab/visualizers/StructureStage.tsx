import type {
  DemoState,
  ArrayDemoState,
  ListDemoState,
  StackDemoState,
  QueueDemoState,
  HashMapDemoState,
  TreeDemoState,
  HeapDemoState,
  GraphDemoState,
} from '../types';
import { bstLevels, heapLevels } from '../helpers';
import { ArrayRowViz } from './ArrayRowViz';
import { ListViz } from './ListViz';
import { StackViz } from './StackViz';
import { HashMapViz } from './HashMapViz';
import { TreeLevelsViz } from './TreeLevelsViz';
import { GraphViz } from './GraphViz';

/** Picks the right visualization for whichever structure is active. Array and Queue share
 * ArrayRowViz (different labels); Tree and Heap share TreeLevelsViz (different level source). */
export function StructureStage({ structureId, state }: { structureId: string; state: DemoState }) {
  switch (structureId) {
    case 'array': {
      const s = state as ArrayDemoState;
      return <ArrayRowViz values={s.values} hi={s.hi} labelFor={(i) => String(i)} />;
    }
    case 'queue': {
      const s = state as QueueDemoState;
      return (
        <ArrayRowViz
          values={s.values}
          hi={{ ...s.hi, current: 0 }}
          labelFor={(i, total) => (i === 0 ? 'FRONT' : i === total - 1 ? 'BACK' : '')}
        />
      );
    }
    case 'list':
      return <ListViz state={state as ListDemoState} />;
    case 'stack': {
      const s = state as StackDemoState;
      return <StackViz values={s.values} hi={s.hi} />;
    }
    case 'hashmap':
      return <HashMapViz state={state as HashMapDemoState} />;
    case 'tree': {
      const s = state as TreeDemoState;
      return <TreeLevelsViz levels={bstLevels(s.root)} hi={s.hi} />;
    }
    case 'heap': {
      const s = state as HeapDemoState;
      return <TreeLevelsViz levels={heapLevels(s.values)} hi={s.hi} />;
    }
    case 'graph':
      return <GraphViz state={state as GraphDemoState} />;
    default:
      return null;
  }
}
