'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { FixedSizeList as VirtualizedList } from 'react-window';
import { useBoardStore, selectActiveBoard, selectActiveBoardLists } from '@/app/stores/boardStore';
import { useDragStore, selectShouldSuspendCharts } from '@/app/stores/dragStore';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { List as ListType, Card as CardType } from '../types';
import { cn } from '@/app/lib/utils';
import BoardHeader from './BoardHeader';
import BoardList from './List';
import BoardCard from './Card';
import { GlassCard } from '@/app/components/ui/glass-card';
import HealthcareDataProvider from './analytics/HealthcareDataProvider';

// Trello-inspired styling with healthcare optimizations
const boardStyles = {
  background: 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800',
  container: 'min-h-screen overflow-hidden relative',
  scrollArea: 'overflow-x-auto overflow-y-hidden h-full',
  listsContainer: 'flex gap-4 p-6 pb-20 min-h-full',
  addListButton: 'flex-shrink-0 w-72 h-fit',
};

interface BoardProps {
  boardId?: string;
  className?: string;
  
  // Performance configuration
  enableVirtualization?: boolean;
  enableChartSuspension?: boolean;
  
  // Healthcare-specific props
  complianceMode?: boolean;
  enablePHIMasking?: boolean;
  
  // Accessibility
  enableKeyboardNavigation?: boolean;
  screenReaderAnnouncements?: boolean;
}

// Virtualized list item renderer for performance with large boards
const ListItem = memo(({ index, style, data }: { 
  index: number; 
  style: React.CSSProperties; 
  data: { lists: ListType[]; boardId: string } 
}) => {
  const list = data.lists[index];
  if (!list) return null;
  
  return (
    <div style={style}>
      <div className="pr-4">
        <BoardList
          list={list}
          boardId={data.boardId}
        />
      </div>
    </div>
  );
});
ListItem.displayName = 'ListItem';

// Main Board component
const Board: React.FC<BoardProps> = memo(({
  boardId,
  className,
  enableVirtualization = false,
  enableChartSuspension = true,
  complianceMode = true,
  enablePHIMasking = true,
  enableKeyboardNavigation = true,
  screenReaderAnnouncements = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Store selectors with performance optimization
  const activeBoard = useBoardStore(selectActiveBoard);
  const lists = useBoardStore(selectActiveBoardLists);
  const shouldSuspendCharts = useDragStore(selectShouldSuspendCharts);
  
  // Get board data or use provided boardId
  const currentBoardId = boardId || activeBoard?.id;
  const currentBoard = useBoardStore(state => 
    currentBoardId ? state.getBoardById(currentBoardId) : null
  );
  
  // Drag and drop configuration
  const dragConfig = useMemo(() => ({
    enableChartSuspension,
    enablePHIProtection: enablePHIMasking,
    enableScreenReaderAnnouncements: screenReaderAnnouncements,
    mouseActivationConstraint: { distance: 8 },
    touchActivationConstraint: { delay: 150, tolerance: 5 },
    customAnnouncementMessages: {
      onDragStart: (id: string, type: string) => 
        `Started moving ${type} ${id}. Use arrow keys to navigate, space to drop, escape to cancel.`,
      onDragEnd: (id: string, type: string, success: boolean) =>
        success 
          ? `Successfully moved ${type} ${id}` 
          : `Failed to move ${type} ${id}. Please try again.`,
    },
  }), [enableChartSuspension, enablePHIMasking, screenReaderAnnouncements]);
  
  const {
    sensors,
    collisionDetection,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    isDragging,
    draggedItem,
    keyboardAnnouncement,
  } = useDragAndDrop(dragConfig);
  
  // Auto-scroll during drag near edges
  const handleAutoScroll = useCallback((event: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    const scrollThreshold = 50;
    const scrollSpeed = 10;
    
    const { clientX, clientY } = event;
    const { left, right, top, bottom } = rect;
    
    let scrollDirection: 'up' | 'down' | 'left' | 'right' | null = null;
    
    if (clientY < top + scrollThreshold) {
      scrollDirection = 'up';
    } else if (clientY > bottom - scrollThreshold) {
      scrollDirection = 'down';
    } else if (clientX < left + scrollThreshold) {
      scrollDirection = 'left';
    } else if (clientX > right - scrollThreshold) {
      scrollDirection = 'right';
    }
    
    if (scrollDirection) {
      useDragStore.getState().startAutoScroll(scrollDirection, scrollSpeed);
    } else {
      useDragStore.getState().stopAutoScroll();
    }
  }, [isDragging]);
  
  // Handle board focus for keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!enableKeyboardNavigation) return;
    
    // Escape key cancels drag or clears selection
    if (event.key === 'Escape') {
      if (isDragging) {
        useDragStore.getState().cancelDrag();
      } else {
        useBoardStore.getState().clearSelection();
      }
    }
    
    // Ctrl/Cmd + A selects all cards
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault();
      useBoardStore.getState().selectAll();
    }
  }, [enableKeyboardNavigation, isDragging]);
  
  // Performance optimization: memoize list data for virtualization
  const virtualizedData = useMemo(() => ({
    lists,
    boardId: currentBoardId || '',
  }), [lists, currentBoardId]);
  
  // Effect for setting up board when boardId changes
  useEffect(() => {
    if (boardId && boardId !== activeBoard?.id) {
      useBoardStore.getState().setActiveBoard(boardId);
    }
  }, [boardId, activeBoard?.id]);
  
  // Create new list handler
  const handleCreateList = useCallback(async () => {
    if (!currentBoardId) return;
    
    const boardStore = useBoardStore.getState();
    const existingLists = boardStore.getListsByBoard(currentBoardId);
    const newPosition = existingLists.length > 0 
      ? Math.max(...existingLists.map(l => l.position)) + 1000 
      : 1000;
    
    await boardStore.createList({
      boardId: currentBoardId,
      title: 'New List',
      position: newPosition,
      createdBy: 'current-user', // TODO: Get from auth context
    });
  }, [currentBoardId]);
  
  // Render drag overlay
  const renderDragOverlay = useCallback(() => {
    if (!draggedItem) return null;
    
    if (draggedItem.type === 'card') {
      const card = useBoardStore.getState().getCardById(draggedItem.id);
      return card ? <BoardCard card={card} isDragging /> : null;
    }
    
    if (draggedItem.type === 'list') {
      const list = lists.find(l => l.id === draggedItem.id);
      return list ? (
        <div className="w-72 opacity-50">
          <BoardList list={list} boardId={currentBoardId || ''} isDragging />
        </div>
      ) : null;
    }
    
    return null;
  }, [draggedItem, lists, currentBoardId]);
  
  if (!currentBoard) {
    return (
      <div className={cn(boardStyles.container, boardStyles.background, className)}>
        <div className="flex items-center justify-center h-full">
          <GlassCard variant="elevated" className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No Board Selected</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Select a board or create a new one to get started
            </p>
          </GlassCard>
        </div>
      </div>
    );
  }
  
  return (
    <HealthcareDataProvider>
      <div 
        ref={containerRef}
        className={cn(boardStyles.container, boardStyles.background, className)}
        data-board-container
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="main"
        aria-label={`Board: ${currentBoard.title}`}
      >
      {/* HIPAA Compliance indicator */}
      {complianceMode && currentBoard.settings.hipaaMode && (
        <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-xs text-center py-1 z-50">
          HIPAA Mode Active - Enhanced security enabled
        </div>
      )}
      
      {/* Board Header */}
      <BoardHeader 
        board={currentBoard}
        onCreateList={handleCreateList}
        complianceMode={complianceMode}
      />
      
      {/* Screen reader announcements */}
      {keyboardAnnouncement && (
        <div 
          role="status" 
          aria-live="polite" 
          className="sr-only"
          aria-atomic="true"
        >
          {keyboardAnnouncement}
        </div>
      )}
      
      {/* Main board content with drag and drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div 
          ref={scrollContainerRef}
          className={boardStyles.scrollArea}
          onMouseMove={handleAutoScroll}
          style={{ 
            paddingTop: complianceMode && currentBoard.settings.hipaaMode ? '2rem' : '1rem' 
          }}
        >
          <div className={boardStyles.listsContainer}>
            {enableVirtualization && lists.length > 10 ? (
              // Virtualized rendering for performance with large boards
              <VirtualizedList
                height={600}
                width={300}
                itemCount={lists.length}
                itemSize={300}
                itemData={virtualizedData}
                layout="horizontal"
              >
                {ListItem}
              </VirtualizedList>
            ) : (
              // Standard rendering for normal-sized boards
              <AnimatePresence mode="popLayout">
                {lists.map((list, index) => (
                  <motion.div
                    key={list.id}
                    layout
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ 
                      duration: shouldSuspendCharts ? 0.1 : 0.3,
                      delay: shouldSuspendCharts ? 0 : index * 0.05 
                    }}
                    className="flex-shrink-0"
                  >
                    <BoardList
                      list={list}
                      boardId={currentBoardId}
                      enableChartSuspension={shouldSuspendCharts}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            
            {/* Add List Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={boardStyles.addListButton}
            >
              <GlassCard 
                variant="subtle" 
                className="p-4 cursor-pointer hover:bg-white/20 transition-colors"
                onClick={handleCreateList}
                role="button"
                tabIndex={0}
                aria-label="Add new list"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCreateList();
                  }
                }}
              >
                <div className="flex items-center justify-center text-gray-600 dark:text-gray-300">
                  <span className="text-2xl mr-2">+</span>
                  <span className="font-medium">Add List</span>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
        
        {/* Drag Overlay */}
        <DragOverlay dropAnimation={null}>
          {renderDragOverlay()}
        </DragOverlay>
      </DndContext>
      
      {/* Performance indicator during drag */}
      {isDragging && shouldSuspendCharts && (
        <div className="fixed bottom-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium z-50">
          Performance Mode Active
        </div>
      )}
      </div>
    </HealthcareDataProvider>
  );
});

Board.displayName = 'Board';

export default Board;