'use client';

import { useState, useCallback, useRef } from 'react';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UndoRedoActions {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  push: (newState: any) => void;
  getHistoryLength: () => number;
}

/**
 * Enhanced undo/redo hook for fee configuration safety
 * Implements command pattern with state snapshots for fee changes
 */
export function useUndoRedo<T>(
  initialState: T,
  maxHistorySize: number = 50
): [T, UndoRedoActions] {
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: []
  });

  const actionInProgress = useRef(false);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const undo = useCallback(() => {
    if (!canUndo || actionInProgress.current) return;

    actionInProgress.current = true;
    
    setState(currentState => {
      const { past, present, future } = currentState;
      if (past.length === 0) return currentState;

      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: [present, ...future]
      };
    });

    // Reset action flag after state update
    setTimeout(() => {
      actionInProgress.current = false;
    }, 0);
  }, [canUndo]);

  const redo = useCallback(() => {
    if (!canRedo || actionInProgress.current) return;

    actionInProgress.current = true;

    setState(currentState => {
      const { past, present, future } = currentState;
      if (future.length === 0) return currentState;

      const next = future[0];
      const newFuture = future.slice(1);

      return {
        past: [...past, present],
        present: next,
        future: newFuture
      };
    });

    // Reset action flag after state update
    setTimeout(() => {
      actionInProgress.current = false;
    }, 0);
  }, [canRedo]);

  const push = useCallback((newState: T) => {
    if (actionInProgress.current) return;

    setState(currentState => {
      const { past, present } = currentState;
      
      // Don't add to history if state hasn't actually changed
      if (JSON.stringify(present) === JSON.stringify(newState)) {
        return currentState;
      }

      let newPast = [...past, present];
      
      // Limit history size to prevent memory issues
      if (newPast.length > maxHistorySize) {
        newPast = newPast.slice(1);
      }

      return {
        past: newPast,
        present: newState,
        future: [] // Clear future when new action is taken
      };
    });
  }, [maxHistorySize]);

  const reset = useCallback(() => {
    setState({
      past: [],
      present: initialState,
      future: []
    });
  }, [initialState]);

  const getHistoryLength = useCallback(() => {
    return state.past.length + 1 + state.future.length;
  }, [state.past.length, state.future.length]);

  const actions: UndoRedoActions = {
    canUndo,
    canRedo,
    undo,
    redo,
    reset,
    push,
    getHistoryLength
  };

  return [state.present, actions];
}

/**
 * Keyboard shortcut hook for undo/redo functionality
 * Enables Ctrl+Z / Cmd+Z for undo and Ctrl+Y / Cmd+Shift+Z for redo
 */
export function useUndoRedoKeyboard(actions: UndoRedoActions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { ctrlKey, metaKey, key, shiftKey } = event;
    const isCtrlOrCmd = ctrlKey || metaKey;

    if (!isCtrlOrCmd) return;

    if (key === 'z' || key === 'Z') {
      if (shiftKey) {
        // Ctrl+Shift+Z or Cmd+Shift+Z for redo
        if (actions.canRedo) {
          event.preventDefault();
          actions.redo();
        }
      } else {
        // Ctrl+Z or Cmd+Z for undo
        if (actions.canUndo) {
          event.preventDefault();
          actions.undo();
        }
      }
    } else if (key === 'y' || key === 'Y') {
      // Ctrl+Y for redo (Windows style)
      if (actions.canRedo) {
        event.preventDefault();
        actions.redo();
      }
    }
  }, [actions]);

  // Return the handler so components can attach it to specific elements or use globally
  return handleKeyDown;
}