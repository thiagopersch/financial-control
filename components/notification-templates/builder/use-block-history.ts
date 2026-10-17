'use client';

import type { BlockTree } from '@/lib/notification-templates/block-types';
import { useCallback, useReducer, type Dispatch, type SetStateAction } from 'react';

const MAX_HISTORY = 50;

interface HistoryState {
  past: BlockTree[];
  present: BlockTree;
  future: BlockTree[];
}

type HistoryAction =
  { type: 'set'; update: SetStateAction<BlockTree> } | { type: 'undo' } | { type: 'redo' };

function reducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'set': {
      const next =
        typeof action.update === 'function' ? action.update(state.present) : action.update;
      if (next === state.present) return state;
      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY),
        present: next,
        future: [],
      };
    }
    case 'undo': {
      if (!state.past.length) return state;
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
      };
    }
    case 'redo': {
      if (!state.future.length) return state;
      return {
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
      };
    }
  }
}

/** Block tree state with undo/redo; `setBlocks` keeps the useState setter signature. */
export function useBlockHistory(initial: BlockTree) {
  const [state, dispatch] = useReducer(reducer, {
    past: [],
    present: initial,
    future: [],
  });

  const setBlocks: Dispatch<SetStateAction<BlockTree>> = useCallback(
    (update) => dispatch({ type: 'set', update }),
    [],
  );
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);

  return {
    blocks: state.present,
    setBlocks,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
