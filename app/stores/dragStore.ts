import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { DragState } from '@/app/features/boards/types';
import { useBoardStore } from './boardStore';

// Enhanced drag state for healthcare board system
interface EnhancedDragState extends DragState {
  // Performance tracking
  dragStartTime: Date | null;
  dragDistance: number;
  
  // Multi-select support
  multiSelectDrag: {
    isDraggingMultiple: boolean;
    selectedIds: string[];
    draggedIds: string[];
  };
  
  // Accessibility support
  keyboardNavigation: {
    isKeyboardDrag: boolean;
    focusedItemId: string | null;
    announcementText: string | null;
  };
  
  // Touch and mobile support
  touchSupport: {
    isTouchDrag: boolean;
    touchStartPos: { x: number; y: number } | null;
    hasExceededThreshold: boolean;
  };
  
  // Auto-scroll during drag
  autoScroll: {
    isScrolling: boolean;
    direction: 'up' | 'down' | 'left' | 'right' | null;
    speed: number;
  };
  
  // Drop zones and visual feedback
  dropZones: {
    validDropZones: string[];
    activeDropZone: string | null;
    dropPreview: {
      type: 'card' | 'list';
      position: number;
      listId?: string;
    } | null;
  };
  
  // Performance optimization
  shouldSuspendCharts: boolean;
  shouldReduceAnimations: boolean;
}

interface DragActions {
  // Basic drag operations
  startDrag: (type: 'card' | 'list', id: string, sourceId: string, options?: {
    isKeyboard?: boolean;
    isTouch?: boolean;
    multiSelect?: string[];
  }) => void;
  
  updateDragPosition: (x: number, y: number) => void;
  
  setDropTarget: (type: 'card' | 'list', id: string, position: 'above' | 'below' | 'inside') => void;
  
  clearDropTarget: () => void;
  
  endDrag: (dropResult?: {
    targetId: string;
    targetType: 'card' | 'list';
    position: number;
  }) => Promise<void>;
  
  cancelDrag: () => void;
  
  // Multi-select operations
  toggleMultiSelect: (id: string) => void;
  setMultiSelect: (ids: string[]) => void;
  clearMultiSelect: () => void;
  
  // Keyboard navigation
  setKeyboardFocus: (id: string | null) => void;
  announceToScreenReader: (text: string) => void;
  
  // Auto-scroll
  startAutoScroll: (direction: 'up' | 'down' | 'left' | 'right', speed: number) => void;
  stopAutoScroll: () => void;
  
  // Performance controls
  setSuspendCharts: (suspend: boolean) => void;
  setReduceAnimations: (reduce: boolean) => void;
  
  // Drop zone management
  setValidDropZones: (zones: string[]) => void;
  setActiveDropZone: (zoneId: string | null) => void;
  setDropPreview: (preview: EnhancedDragState['dropZones']['dropPreview']) => void;
  
  // Utility functions
  getDragDuration: () => number;
  isDraggedItem: (id: string) => boolean;
  isValidDropTarget: (targetId: string) => boolean;
  
  // Reset and cleanup
  resetDragState: () => void;
}

// Helper functions
function calculateDragDistance(startPos: { x: number; y: number }, currentPos: { x: number; y: number }): number {
  const dx = currentPos.x - startPos.x;
  const dy = currentPos.y - startPos.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function shouldSuspendCharts(dragDistance: number, dragDuration: number): boolean {
  // Suspend charts if dragging for more than 200ms or moved more than 50px
  return dragDuration > 200 || dragDistance > 50;
}

export const useDragStore = create<EnhancedDragState & DragActions>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      isDragging: false,
      dragStartTime: null,
      dragDistance: 0,
      
      multiSelectDrag: {
        isDraggingMultiple: false,
        selectedIds: [],
        draggedIds: [],
      },
      
      keyboardNavigation: {
        isKeyboardDrag: false,
        focusedItemId: null,
        announcementText: null,
      },
      
      touchSupport: {
        isTouchDrag: false,
        touchStartPos: null,
        hasExceededThreshold: false,
      },
      
      autoScroll: {
        isScrolling: false,
        direction: null,
        speed: 0,
      },
      
      dropZones: {
        validDropZones: [],
        activeDropZone: null,
        dropPreview: null,
      },
      
      shouldSuspendCharts: false,
      shouldReduceAnimations: false,

      // Actions
      startDrag: (type, id, sourceId, options = {}) => {
        const now = new Date();
        
        set((state) => {
          state.isDragging = true;
          state.dragStartTime = now;
          state.dragDistance = 0;
          
          state.draggedItem = {
            type,
            id,
            sourceId,
          };
          
          // Handle multi-select
          if (options.multiSelect && options.multiSelect.length > 1) {
            state.multiSelectDrag.isDraggingMultiple = true;
            state.multiSelectDrag.selectedIds = options.multiSelect;
            state.multiSelectDrag.draggedIds = options.multiSelect;
          } else {
            state.multiSelectDrag.isDraggingMultiple = false;
            state.multiSelectDrag.draggedIds = [id];
          }
          
          // Handle keyboard drag
          if (options.isKeyboard) {
            state.keyboardNavigation.isKeyboardDrag = true;
            state.keyboardNavigation.focusedItemId = id;
            get().announceToScreenReader(`Started dragging ${type} ${id}`);
          }
          
          // Handle touch drag
          if (options.isTouch) {
            state.touchSupport.isTouchDrag = true;
            state.touchSupport.hasExceededThreshold = false;
          }
        });
      },

      updateDragPosition: (x, y) => {
        set((state) => {
          if (!state.isDragging || !state.dragStartTime) return;
          
          state.ghostPosition = { x, y };
          
          // Calculate drag distance for performance optimization
          if (state.touchSupport.touchStartPos) {
            state.dragDistance = calculateDragDistance(state.touchSupport.touchStartPos, { x, y });
            
            // Exceed threshold for touch
            if (!state.touchSupport.hasExceededThreshold && state.dragDistance > 10) {
              state.touchSupport.hasExceededThreshold = true;
            }
          }
          
          // Update performance flags
          const dragDuration = Date.now() - state.dragStartTime.getTime();
          state.shouldSuspendCharts = shouldSuspendCharts(state.dragDistance, dragDuration);
          state.shouldReduceAnimations = dragDuration > 300;
        });
      },

      setDropTarget: (type, id, position) => {
        set((state) => {
          state.dragOverItem = { type, id, position };
          state.dropZones.activeDropZone = id;
        });
      },

      clearDropTarget: () => {
        set((state) => {
          state.dragOverItem = undefined;
          state.dropZones.activeDropZone = null;
          state.dropZones.dropPreview = null;
        });
      },

      endDrag: async (dropResult) => {
        const dragState = get();
        if (!dragState.isDragging || !dragState.draggedItem) return;

        try {
          if (dropResult && dragState.draggedItem) {
            const boardStore = useBoardStore.getState();
            
            if (dragState.draggedItem.type === 'card') {
              // Handle single or multi-card drop
              if (dragState.multiSelectDrag.isDraggingMultiple) {
                await boardStore.bulkMoveCards(
                  dragState.multiSelectDrag.draggedIds,
                  dropResult.targetId
                );
              } else {
                await boardStore.moveCard(
                  dragState.draggedItem.id,
                  dropResult.targetId,
                  dropResult.position
                );
              }
            } else if (dragState.draggedItem.type === 'list') {
              await boardStore.moveList(dragState.draggedItem.id, dropResult.position);
            }
            
            // Announce success for screen readers
            if (dragState.keyboardNavigation.isKeyboardDrag) {
              get().announceToScreenReader(
                `Successfully moved ${dragState.draggedItem.type} to ${dropResult.targetId}`
              );
            }
          }
        } catch (error) {
          console.error('Failed to complete drag operation:', error);
          
          if (dragState.keyboardNavigation.isKeyboardDrag) {
            get().announceToScreenReader('Failed to move item. Please try again.');
          }
        } finally {
          get().resetDragState();
        }
      },

      cancelDrag: () => {
        const dragState = get();
        
        if (dragState.keyboardNavigation.isKeyboardDrag) {
          get().announceToScreenReader('Drag operation cancelled');
        }
        
        get().resetDragState();
      },

      // Multi-select operations
      toggleMultiSelect: (id) => {
        set((state) => {
          const selectedIds = state.multiSelectDrag.selectedIds;
          if (selectedIds.includes(id)) {
            state.multiSelectDrag.selectedIds = selectedIds.filter(selectedId => selectedId !== id);
          } else {
            state.multiSelectDrag.selectedIds.push(id);
          }
        });
      },

      setMultiSelect: (ids) => {
        set((state) => {
          state.multiSelectDrag.selectedIds = ids;
        });
      },

      clearMultiSelect: () => {
        set((state) => {
          state.multiSelectDrag.selectedIds = [];
          state.multiSelectDrag.isDraggingMultiple = false;
          state.multiSelectDrag.draggedIds = [];
        });
      },

      // Keyboard navigation
      setKeyboardFocus: (id) => {
        set((state) => {
          state.keyboardNavigation.focusedItemId = id;
        });
      },

      announceToScreenReader: (text) => {
        set((state) => {
          state.keyboardNavigation.announcementText = text;
        });
        
        // Clear announcement after a delay
        setTimeout(() => {
          set((state) => {
            state.keyboardNavigation.announcementText = null;
          });
        }, 1000);
      },

      // Auto-scroll
      startAutoScroll: (direction, speed) => {
        set((state) => {
          state.autoScroll.isScrolling = true;
          state.autoScroll.direction = direction;
          state.autoScroll.speed = speed;
        });
      },

      stopAutoScroll: () => {
        set((state) => {
          state.autoScroll.isScrolling = false;
          state.autoScroll.direction = null;
          state.autoScroll.speed = 0;
        });
      },

      // Performance controls
      setSuspendCharts: (suspend) => {
        set((state) => {
          state.shouldSuspendCharts = suspend;
        });
      },

      setReduceAnimations: (reduce) => {
        set((state) => {
          state.shouldReduceAnimations = reduce;
        });
      },

      // Drop zone management
      setValidDropZones: (zones) => {
        set((state) => {
          state.dropZones.validDropZones = zones;
        });
      },

      setActiveDropZone: (zoneId) => {
        set((state) => {
          state.dropZones.activeDropZone = zoneId;
        });
      },

      setDropPreview: (preview) => {
        set((state) => {
          state.dropZones.dropPreview = preview;
        });
      },

      // Utility functions
      getDragDuration: () => {
        const startTime = get().dragStartTime;
        return startTime ? Date.now() - startTime.getTime() : 0;
      },

      isDraggedItem: (id) => {
        const dragState = get();
        return dragState.multiSelectDrag.draggedIds.includes(id);
      },

      isValidDropTarget: (targetId) => {
        return get().dropZones.validDropZones.includes(targetId);
      },

      // Reset and cleanup
      resetDragState: () => {
        set((state) => {
          state.isDragging = false;
          state.draggedItem = undefined;
          state.dragOverItem = undefined;
          state.ghostPosition = undefined;
          state.dragStartTime = null;
          state.dragDistance = 0;
          
          state.multiSelectDrag.isDraggingMultiple = false;
          state.multiSelectDrag.draggedIds = [];
          
          state.keyboardNavigation.isKeyboardDrag = false;
          state.keyboardNavigation.focusedItemId = null;
          
          state.touchSupport.isTouchDrag = false;
          state.touchSupport.touchStartPos = null;
          state.touchSupport.hasExceededThreshold = false;
          
          state.autoScroll.isScrolling = false;
          state.autoScroll.direction = null;
          state.autoScroll.speed = 0;
          
          state.dropZones.activeDropZone = null;
          state.dropZones.dropPreview = null;
          
          state.shouldSuspendCharts = false;
          state.shouldReduceAnimations = false;
        });
      },
    })),
    {
      name: 'drag-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Selectors for performance
export const selectIsDragging = (state: EnhancedDragState & DragActions) => state.isDragging;
export const selectShouldSuspendCharts = (state: EnhancedDragState & DragActions) => state.shouldSuspendCharts;
export const selectIsMultiDrag = (state: EnhancedDragState & DragActions) => state.multiSelectDrag.isDraggingMultiple;
export const selectDraggedIds = (state: EnhancedDragState & DragActions) => state.multiSelectDrag.draggedIds;
export const selectKeyboardAnnouncement = (state: EnhancedDragState & DragActions) => state.keyboardNavigation.announcementText;