import { useCallback, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  getFirstCollision,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useDragStore } from '@/app/stores/dragStore';
import { useBoardStore } from '@/app/stores/boardStore';

// Custom collision detection for healthcare board system
const customCollisionDetection: CollisionDetection = (args) => {
  // First, let's see if there are any collisions with the pointer
  const pointerCollisions = pointerWithin(args);
  
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  
  // If there are no collisions with the pointer, return rectangle intersections
  const intersections = rectIntersection(args);
  
  if (intersections.length > 0) {
    return intersections;
  }
  
  // Fallback to closest corners
  return closestCorners(args);
};

// Custom keyboard coordinates for healthcare workflow
const healthcareKeyboardCoordinates = (event: KeyboardEvent, { currentCoordinates }: any) => {
  const delta = 20; // Increased for better healthcare data visibility
  
  switch (event.code) {
    case 'ArrowDown':
      return {
        ...currentCoordinates,
        y: currentCoordinates.y + delta,
      };
    case 'ArrowUp':
      return {
        ...currentCoordinates,
        y: currentCoordinates.y - delta,
      };
    case 'ArrowLeft':
      return {
        ...currentCoordinates,
        x: currentCoordinates.x - delta,
      };
    case 'ArrowRight':
      return {
        ...currentCoordinates,
        x: currentCoordinates.x + delta,
      };
  }
  
  return undefined;
};

export interface DragAndDropConfig {
  // Sensitivity settings
  mouseActivationConstraint?: {
    distance: number;
  };
  touchActivationConstraint?: {
    delay: number;
    tolerance: number;
  };
  
  // Performance settings
  enableChartSuspension?: boolean;
  enableAnimationReduction?: boolean;
  
  // Healthcare-specific settings
  enablePHIProtection?: boolean;
  requireDropConfirmation?: boolean;
  
  // Accessibility
  enableScreenReaderAnnouncements?: boolean;
  customAnnouncementMessages?: {
    onDragStart?: (id: string, type: string) => string;
    onDragEnd?: (id: string, type: string, success: boolean) => string;
  };
}

export function useDragAndDrop(config: DragAndDropConfig = {}) {
  const dragStore = useDragStore();
  const boardStore = useBoardStore();
  
  // Configure sensors with healthcare-optimized settings
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: config.mouseActivationConstraint || {
      distance: 8, // Slightly higher for precision with healthcare data
    },
  });
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: config.touchActivationConstraint || {
      delay: 150, // Prevent accidental drags on mobile
      tolerance: 5,
    },
  });
  
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: healthcareKeyboardCoordinates,
  });
  
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);
  
  // Drag event handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;
    
    if (!activeData) return;
    
    const type = activeData.type as 'card' | 'list';
    const sourceId = activeData.sourceId;
    
    // Check for multi-select
    const selectedCards = boardStore.selectedCards;
    const isMultiSelect = type === 'card' && selectedCards.includes(active.id as string) && selectedCards.length > 1;
    
    dragStore.startDrag(type, active.id as string, sourceId, {
      isKeyboard: event.activatorEvent instanceof KeyboardEvent,
      isTouch: event.activatorEvent instanceof TouchEvent,
      multiSelect: isMultiSelect ? selectedCards : undefined,
    });
    
    // Performance optimization: suspend charts during drag
    if (config.enableChartSuspension) {
      dragStore.setSuspendCharts(true);
    }
    
    // Set valid drop zones based on item type and healthcare rules
    const validDropZones = getValidDropZones(type, active.id as string);
    dragStore.setValidDropZones(validDropZones);
    
    // Screen reader announcement
    if (config.enableScreenReaderAnnouncements) {
      const message = config.customAnnouncementMessages?.onDragStart?.(
        active.id as string, 
        type
      ) || `Started dragging ${type} ${active.id}`;
      dragStore.announceToScreenReader(message);
    }
  }, [dragStore, boardStore, config]);
  
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || !active.data.current) return;
    
    const activeType = active.data.current.type as 'card' | 'list';
    const overType = over.data.current?.type as 'card' | 'list';
    
    // Determine drop position
    let position: 'above' | 'below' | 'inside' = 'below';
    
    if (activeType === 'card') {
      if (overType === 'list') {
        position = 'inside';
      } else if (overType === 'card') {
        // Calculate position based on mouse position
        const overRect = over.rect;
        const dragY = event.delta.y;
        position = dragY < overRect.height / 2 ? 'above' : 'below';
      }
    }
    
    dragStore.setDropTarget(overType || 'card', over.id as string, position);
    dragStore.setActiveDropZone(over.id as string);
    
    // Update ghost position
    if (event.activatorEvent instanceof MouseEvent) {
      dragStore.updateDragPosition(
        event.activatorEvent.clientX,
        event.activatorEvent.clientY
      );
    }
  }, [dragStore]);
  
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !active.data.current) {
      dragStore.cancelDrag();
      return;
    }
    
    const activeType = active.data.current.type as 'card' | 'list';
    const overType = over.data.current?.type as 'card' | 'list';
    
    try {
      // Calculate drop position and target
      let targetListId: string;
      let position: number;
      
      if (activeType === 'card') {
        if (overType === 'list') {
          targetListId = over.id as string;
          const cardsInList = boardStore.getCardsByList(targetListId);
          position = cardsInList.length > 0 ? cardsInList[cardsInList.length - 1].position + 1000 : 1000;
        } else if (overType === 'card') {
          const overCard = boardStore.getCardById(over.id as string);
          if (!overCard) return;
          
          targetListId = overCard.listId;
          const cardsInList = boardStore.getCardsByList(targetListId);
          const overIndex = cardsInList.findIndex(c => c.id === over.id);
          
          // Calculate position based on drop indicator
          const dropPosition = dragStore.dragOverItem?.position || 'below';
          if (dropPosition === 'above') {
            position = overIndex > 0 ? 
              (cardsInList[overIndex - 1].position + overCard.position) / 2 : 
              overCard.position / 2;
          } else {
            position = overIndex < cardsInList.length - 1 ? 
              (overCard.position + cardsInList[overIndex + 1].position) / 2 : 
              overCard.position + 1000;
          }
        } else {
          return;
        }
        
        // PHI protection check for healthcare cards
        if (config.enablePHIProtection) {
          const movedCard = boardStore.getCardById(active.id as string);
          if (movedCard && (movedCard as any).healthcare?.phi?.containsPHI) {
            // TODO: Add confirmation dialog for PHI movement
            console.warn('Moving card with PHI - ensure compliance');
          }
        }
        
        await dragStore.endDrag({
          targetId: targetListId,
          targetType: 'card',
          position,
        });
      } else if (activeType === 'list') {
        const allLists = boardStore.getListsByBoard(boardStore.activeBoard!);
        const overIndex = allLists.findIndex(l => l.id === over.id);
        const activeIndex = allLists.findIndex(l => l.id === active.id);
        
        if (overIndex !== -1 && activeIndex !== -1 && overIndex !== activeIndex) {
          const newLists = arrayMove(allLists, activeIndex, overIndex);
          const targetList = newLists[overIndex];
          
          await dragStore.endDrag({
            targetId: targetList.id,
            targetType: 'list',
            position: (overIndex + 1) * 1000,
          });
        }
      }
      
      // Screen reader announcement for success
      if (config.enableScreenReaderAnnouncements) {
        const message = config.customAnnouncementMessages?.onDragEnd?.(
          active.id as string,
          activeType,
          true
        ) || `Successfully moved ${activeType}`;
        dragStore.announceToScreenReader(message);
      }
      
    } catch (error) {
      console.error('Drag operation failed:', error);
      dragStore.cancelDrag();
      
      if (config.enableScreenReaderAnnouncements) {
        const message = config.customAnnouncementMessages?.onDragEnd?.(
          active.id as string,
          activeType,
          false
        ) || `Failed to move ${activeType}`;
        dragStore.announceToScreenReader(message);
      }
    }
  }, [dragStore, boardStore, config]);
  
  // Helper function to determine valid drop zones
  const getValidDropZones = useCallback((type: 'card' | 'list', itemId: string): string[] => {
    if (type === 'card') {
      const activeBoard = boardStore.activeBoard;
      if (!activeBoard) return [];
      
      const lists = boardStore.getListsByBoard(activeBoard);
      const cards = lists.flatMap(list => boardStore.getCardsByList(list.id));
      
      // All lists and cards in the same board are valid drop zones
      return [...lists.map(l => l.id), ...cards.map(c => c.id).filter(id => id !== itemId)];
    } else if (type === 'list') {
      const activeBoard = boardStore.activeBoard;
      if (!activeBoard) return [];
      
      const lists = boardStore.getListsByBoard(activeBoard);
      
      // All other lists in the same board are valid drop zones
      return lists.map(l => l.id).filter(id => id !== itemId);
    }
    
    return [];
  }, [boardStore]);
  
  // Auto-scroll effect
  useEffect(() => {
    if (!dragStore.autoScroll.isScrolling) return;
    
    const scrollContainer = document.querySelector('[data-board-container]');
    if (!scrollContainer) return;
    
    const interval = setInterval(() => {
      const { direction, speed } = dragStore.autoScroll;
      
      switch (direction) {
        case 'up':
          (scrollContainer as HTMLElement).scrollTop -= speed;
          break;
        case 'down':
          (scrollContainer as HTMLElement).scrollTop += speed;
          break;
        case 'left':
          (scrollContainer as HTMLElement).scrollLeft -= speed;
          break;
        case 'right':
          (scrollContainer as HTMLElement).scrollLeft += speed;
          break;
      }
    }, 16); // 60fps
    
    return () => clearInterval(interval);
  }, [dragStore.autoScroll.isScrolling, dragStore.autoScroll.direction, dragStore.autoScroll.speed]);
  
  // Performance optimization: reduce animations during drag
  useEffect(() => {
    if (dragStore.shouldReduceAnimations) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [dragStore.shouldReduceAnimations]);
  
  return {
    sensors,
    collisionDetection: customCollisionDetection,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    
    // Expose drag state for components
    isDragging: dragStore.isDragging,
    draggedItem: dragStore.draggedItem,
    shouldSuspendCharts: dragStore.shouldSuspendCharts,
    multiSelectDrag: dragStore.multiSelectDrag,
    keyboardAnnouncement: dragStore.keyboardNavigation.announcementText,
    
    // Utilities
    isValidDropTarget: dragStore.isValidDropTarget,
    isDraggedItem: dragStore.isDraggedItem,
  };
}

// Hook for sortable contexts
export function useSortableContext(items: { id: string }[], strategy: 'vertical' | 'horizontal' = 'vertical') {
  const sortingStrategy = strategy === 'vertical' ? verticalListSortingStrategy : horizontalListSortingStrategy;
  
  const sortableItems = useMemo(() => items.map(item => item.id), [items]);
  
  return {
    SortableContext: ({ children }: { children: React.ReactNode }) => (
      <SortableContext items={sortableItems} strategy={sortingStrategy}>
        {children}
      </SortableContext>
    ),
    items: sortableItems,
  };
}

