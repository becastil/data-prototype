'use client';

import React, { memo, useCallback, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FixedSizeList as VirtualizedList } from 'react-window';
import { MoreVertical, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { List as ListType } from '../types';
import { useBoardStore } from '@/app/stores/boardStore';
import { useDragStore } from '@/app/stores/dragStore';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import { GlassCard } from '@/app/components/ui/glass-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import BoardCard from './Card';

interface ListProps {
  list: ListType;
  boardId: string;
  isDragging?: boolean;
  enableChartSuspension?: boolean;
  className?: string;
}

// Trello-style constants
const LIST_WIDTH = 272; // Trello's list width
const CARD_HEIGHT = 120; // Average card height for virtualization
const VIRTUAL_THRESHOLD = 50; // Virtualize when more than 50 cards

// Virtualized card item renderer
const CardItem = memo(({ index, style, data }: {
  index: number;
  style: React.CSSProperties;
  data: { cards: any[]; listId: string; enableChartSuspension: boolean };
}) => {
  const card = data.cards[index];
  if (!card) return null;

  return (
    <div style={style}>
      <div className="px-2 pb-2">
        <BoardCard 
          card={card} 
          enableChartSuspension={data.enableChartSuspension}
        />
      </div>
    </div>
  );
});
CardItem.displayName = 'CardItem';

const List: React.FC<ListProps> = memo(({
  list,
  boardId,
  isDragging = false,
  enableChartSuspension = false,
  className,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);
  const [isCollapsed, setIsCollapsed] = useState(list.isCollapsed);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Store selectors
  const cards = useBoardStore(state => state.getCardsByList(list.id));
  const updateList = useBoardStore(state => state.updateList);
  const createCard = useBoardStore(state => state.createCard);
  const deleteList = useBoardStore(state => state.deleteList);
  const isDragActive = useDragStore(state => state.isDragging);
  
  // Sortable setup for drag and drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isOver,
  } = useSortable({
    id: list.id,
    data: {
      type: 'list',
      sourceId: boardId,
    },
    disabled: isDragging,
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  // Handle title editing
  const handleTitleSubmit = useCallback(async () => {
    if (editTitle.trim() && editTitle !== list.title) {
      await updateList(list.id, { title: editTitle.trim() });
    } else {
      setEditTitle(list.title);
    }
    setIsEditingTitle(false);
  }, [editTitle, list.title, list.id, updateList]);
  
  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditTitle(list.title);
      setIsEditingTitle(false);
    }
  }, [list.title, handleTitleSubmit]);
  
  // Handle card creation
  const handleCreateCard = useCallback(async () => {
    if (!newCardTitle.trim()) return;
    
    const maxPosition = cards.length > 0 ? Math.max(...cards.map(c => c.position)) : 0;
    
    await createCard({
      title: newCardTitle.trim(),
      listId: list.id,
      boardId,
      position: maxPosition + 1000,
      createdBy: 'current-user', // TODO: Get from auth context
    });
    
    setNewCardTitle('');
    setShowAddCard(false);
  }, [newCardTitle, cards, list.id, boardId, createCard]);
  
  const handleNewCardKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateCard();
    } else if (e.key === 'Escape') {
      setNewCardTitle('');
      setShowAddCard(false);
    }
  }, [handleCreateCard]);
  
  // Toggle collapse
  const toggleCollapse = useCallback(async () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    await updateList(list.id, { isCollapsed: newCollapsed });
  }, [isCollapsed, list.id, updateList]);
  
  // Handle list deletion
  const handleDeleteList = useCallback(async () => {
    if (window.confirm(`Are you sure you want to delete "${list.title}"? This will also delete all cards in this list.`)) {
      await deleteList(list.id);
    }
  }, [list.id, list.title, deleteList]);
  
  // Memoize virtualization data
  const virtualizationData = useMemo(() => ({
    cards,
    listId: list.id,
    enableChartSuspension,
  }), [cards, list.id, enableChartSuspension]);
  
  const shouldVirtualize = cards.length > VIRTUAL_THRESHOLD;
  const listHeight = isCollapsed ? 0 : Math.min(cards.length * CARD_HEIGHT, 600);
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "select-none w-72 flex-shrink-0",
        isDragActive && "pointer-events-none",
        className
      )}
      {...attributes}
    >
      <GlassCard 
        variant={isOver ? "vibrant" : "elevated"}
        className={cn(
          "w-full bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm",
          "border border-gray-200/50 dark:border-gray-700/50",
          "transition-all duration-200",
          isDragging && "opacity-50 rotate-2 scale-105",
          isOver && "ring-2 ring-blue-400 ring-opacity-50"
        )}
      >
        {/* List Header */}
        <div 
          className="px-3 py-3 border-b border-gray-200/50 dark:border-gray-700/50"
          {...listeners}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Collapse toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCollapse}
                className="p-1 h-6 w-6 hover:bg-gray-200/50"
                aria-label={isCollapsed ? "Expand list" : "Collapse list"}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </Button>
              
              {/* List Title */}
              {isEditingTitle ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={handleTitleKeyDown}
                  className={cn(
                    "flex-1 bg-transparent text-sm font-semibold",
                    "focus:outline-none focus:bg-white/50 dark:focus:bg-gray-700/50",
                    "rounded px-2 py-1 min-w-0"
                  )}
                  placeholder="List title"
                  autoFocus
                />
              ) : (
                <h3
                  onClick={() => setIsEditingTitle(true)}
                  className={cn(
                    "flex-1 text-sm font-semibold cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-700/50",
                    "rounded px-2 py-1 truncate min-w-0 transition-colors"
                  )}
                  title={list.title}
                >
                  {list.title}
                </h3>
              )}
              
              {/* Card count badge */}
              <div className="bg-gray-200 dark:bg-gray-700 text-xs px-2 py-1 rounded-full font-medium">
                {cards.length}
              </div>
            </div>
            
            {/* List menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-6 w-6 hover:bg-gray-200/50"
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowAddCard(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Card
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleCollapse}>
                  {isCollapsed ? (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Expand List
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-4 h-4 mr-2" />
                      Collapse List
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDeleteList}
                  className="text-red-600 focus:text-red-600"
                >
                  Delete List
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Cards Area */}
        {!isCollapsed && (
          <div className="min-h-[50px]">
            {shouldVirtualize ? (
              /* Virtualized cards for performance */
              <div className="h-[600px] overflow-hidden">
                <VirtualizedList
                  height={600}
                  width={LIST_WIDTH}
                  itemCount={cards.length}
                  itemSize={CARD_HEIGHT}
                  itemData={virtualizationData}
                  className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
                >
                  {CardItem}
                </VirtualizedList>
              </div>
            ) : (
              /* Standard cards rendering */
              <div className="space-y-0 py-2">
                <AnimatePresence mode="popLayout">
                  {cards.map((card, index) => (
                    <motion.div
                      key={card.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ 
                        duration: enableChartSuspension ? 0.1 : 0.2,
                        delay: enableChartSuspension ? 0 : index * 0.02 
                      }}
                      className="px-2 pb-2"
                    >
                      <BoardCard 
                        card={card} 
                        enableChartSuspension={enableChartSuspension}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            
            {/* Add Card Section */}
            {showAddCard ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-3 py-2"
              >
                <textarea
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  onKeyDown={handleNewCardKeyDown}
                  placeholder="Enter a title for this card..."
                  className={cn(
                    "w-full p-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600",
                    "rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500",
                    "min-h-[80px]"
                  )}
                  autoFocus
                />
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={handleCreateCard}
                    disabled={!newCardTitle.trim()}
                  >
                    Add Card
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddCard(false);
                      setNewCardTitle('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddCard(true)}
                  className={cn(
                    "w-full justify-start text-gray-600 hover:text-gray-800",
                    "hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                  )}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add a card
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* List limit indicator */}
        {list.cardLimit && cards.length >= list.cardLimit && (
          <div className="px-3 py-2 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Card limit reached ({cards.length}/{list.cardLimit})
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
});

List.displayName = 'List';

export default List;