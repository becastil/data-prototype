import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Board, List, Card, User, DragState, SearchFilters, SearchResult } from '@/app/features/boards/types';

// Store state interface
interface BoardState {
  // Data state
  boards: Board[];
  lists: List[];
  cards: Card[];
  users: User[];
  
  // UI state
  activeBoard: string | null;
  selectedCards: string[];
  searchFilters: SearchFilters;
  searchResults: SearchResult | null;
  
  // Drag state
  dragState: DragState;
  
  // Performance and caching
  loadingStates: Record<string, boolean>;
  errors: Record<string, string | null>;
  lastSyncTime: Date | null;
  
  // Optimistic updates tracking
  optimisticOperations: Map<string, {
    type: string;
    originalState: any;
    timestamp: Date;
  }>;
}

// Actions interface
interface BoardActions {
  // Board management
  createBoard: (board: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateBoard: (boardId: string, updates: Partial<Board>) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  setActiveBoard: (boardId: string | null) => void;
  
  // List management
  createList: (list: Omit<List, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateList: (listId: string, updates: Partial<List>) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  moveList: (listId: string, newPosition: number) => Promise<void>;
  
  // Card management
  createCard: (card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateCard: (cardId: string, updates: Partial<Card>) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  moveCard: (cardId: string, targetListId: string, newPosition: number) => Promise<void>;
  bulkMoveCards: (cardIds: string[], targetListId: string) => Promise<void>;
  
  // Selection management
  selectCard: (cardId: string, isMultiSelect?: boolean) => void;
  clearSelection: () => void;
  selectAll: (listId?: string) => void;
  
  // Search and filtering
  setSearchFilters: (filters: SearchFilters) => void;
  clearSearch: () => void;
  searchCards: (query: string, filters?: SearchFilters) => Promise<void>;
  
  // Drag and drop
  setDragState: (dragState: Partial<DragState>) => void;
  clearDragState: () => void;
  
  // Data fetching and synchronization
  fetchBoard: (boardId: string) => Promise<void>;
  fetchBoards: () => Promise<void>;
  syncWithServer: () => Promise<void>;
  
  // Optimistic updates and rollback
  optimisticUpdate: (operationId: string, operation: () => void) => void;
  rollbackOperation: (operationId: string) => void;
  confirmOperation: (operationId: string) => void;
  
  // Utility actions
  getCardsByList: (listId: string) => Card[];
  getListsByBoard: (boardId: string) => List[];
  getBoardById: (boardId: string) => Board | undefined;
  getCardById: (cardId: string) => Card | undefined;
  
  // Bulk operations
  duplicateCard: (cardId: string, targetListId?: string) => Promise<string>;
  archiveList: (listId: string) => Promise<void>;
  restoreList: (listId: string) => Promise<void>;
  
  // Error handling
  setError: (key: string, error: string | null) => void;
  clearErrors: () => void;
  
  // Loading states
  setLoading: (key: string, loading: boolean) => void;
}

// Helper functions
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function calculateNewPosition(items: { position: number }[], targetIndex: number): number {
  if (items.length === 0) return 1000;
  
  if (targetIndex === 0) {
    return items[0].position / 2;
  }
  
  if (targetIndex >= items.length) {
    return items[items.length - 1].position + 1000;
  }
  
  const prevPos = items[targetIndex - 1].position;
  const nextPos = items[targetIndex].position;
  return (prevPos + nextPos) / 2;
}

// Create the store
export const useBoardStore = create<BoardState & BoardActions>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        boards: [],
        lists: [],
        cards: [],
        users: [],
        activeBoard: null,
        selectedCards: [],
        searchFilters: {},
        searchResults: null,
        dragState: {
          isDragging: false,
        },
        loadingStates: {},
        errors: {},
        lastSyncTime: null,
        optimisticOperations: new Map(),

        // Board actions
        createBoard: async (boardData) => {
          const boardId = generateId();
          const now = new Date();
          
          const newBoard: Board = {
            ...boardData,
            id: boardId,
            createdAt: now,
            updatedAt: now,
            activity: [],
            members: boardData.members || [],
            settings: {
              allowComments: true,
              allowAttachments: true,
              enableAutomation: false,
              requireApproval: false,
              hipaaMode: false,
              ...boardData.settings,
            },
          };

          set((state) => {
            state.boards.push(newBoard);
            state.lastSyncTime = now;
          });

          // TODO: API call to create board on server
          // await api.createBoard(newBoard);
          
          return boardId;
        },

        updateBoard: async (boardId, updates) => {
          const now = new Date();
          
          set((state) => {
            const board = state.boards.find(b => b.id === boardId);
            if (board) {
              Object.assign(board, updates, { updatedAt: now });
            }
            state.lastSyncTime = now;
          });

          // TODO: API call
        },

        deleteBoard: async (boardId) => {
          set((state) => {
            state.boards = state.boards.filter(b => b.id !== boardId);
            // Also remove associated lists and cards
            const listIds = state.lists.filter(l => l.boardId === boardId).map(l => l.id);
            state.lists = state.lists.filter(l => l.boardId !== boardId);
            state.cards = state.cards.filter(c => !listIds.includes(c.listId));
            
            if (state.activeBoard === boardId) {
              state.activeBoard = null;
            }
          });
        },

        setActiveBoard: (boardId) => {
          set((state) => {
            state.activeBoard = boardId;
            state.selectedCards = [];
            state.searchResults = null;
          });
        },

        // List actions
        createList: async (listData) => {
          const listId = generateId();
          const now = new Date();
          
          const newList: List = {
            ...listData,
            id: listId,
            createdAt: now,
            updatedAt: now,
            isCollapsed: false,
          };

          set((state) => {
            state.lists.push(newList);
            state.lastSyncTime = now;
          });

          return listId;
        },

        updateList: async (listId, updates) => {
          const now = new Date();
          
          set((state) => {
            const list = state.lists.find(l => l.id === listId);
            if (list) {
              Object.assign(list, updates, { updatedAt: now });
            }
            state.lastSyncTime = now;
          });
        },

        deleteList: async (listId) => {
          set((state) => {
            state.lists = state.lists.filter(l => l.id !== listId);
            state.cards = state.cards.filter(c => c.listId !== listId);
          });
        },

        moveList: async (listId, newPosition) => {
          set((state) => {
            const list = state.lists.find(l => l.id === listId);
            if (list) {
              list.position = newPosition;
              list.updatedAt = new Date();
            }
          });
        },

        // Card actions
        createCard: async (cardData) => {
          const cardId = generateId();
          const now = new Date();
          
          const newCard: Card = {
            ...cardData,
            id: cardId,
            createdAt: now,
            updatedAt: now,
            labels: cardData.labels || [],
            assignees: cardData.assignees || [],
            attachments: cardData.attachments || [],
            activity: [],
            comments: [],
            isCompleted: false,
            priority: cardData.priority || 'normal',
            status: cardData.status || 'pending',
            customFields: cardData.customFields || {},
            lastModifiedBy: cardData.createdBy,
          };

          set((state) => {
            state.cards.push(newCard);
            state.lastSyncTime = now;
          });

          return cardId;
        },

        updateCard: async (cardId, updates) => {
          const now = new Date();
          
          set((state) => {
            const card = state.cards.find(c => c.id === cardId);
            if (card) {
              Object.assign(card, updates, { updatedAt: now });
            }
            state.lastSyncTime = now;
          });
        },

        deleteCard: async (cardId) => {
          set((state) => {
            state.cards = state.cards.filter(c => c.id !== cardId);
            state.selectedCards = state.selectedCards.filter(id => id !== cardId);
          });
        },

        moveCard: async (cardId, targetListId, newPosition) => {
          set((state) => {
            const card = state.cards.find(c => c.id === cardId);
            if (card) {
              card.listId = targetListId;
              card.position = newPosition;
              card.updatedAt = new Date();
            }
          });
        },

        bulkMoveCards: async (cardIds, targetListId) => {
          const targetList = get().lists.find(l => l.id === targetListId);
          if (!targetList) return;

          const cardsInTargetList = get().cards
            .filter(c => c.listId === targetListId)
            .sort((a, b) => a.position - b.position);

          set((state) => {
            cardIds.forEach((cardId, index) => {
              const card = state.cards.find(c => c.id === cardId);
              if (card) {
                card.listId = targetListId;
                card.position = cardsInTargetList.length > 0 
                  ? cardsInTargetList[cardsInTargetList.length - 1].position + 1000 * (index + 1)
                  : 1000 * (index + 1);
                card.updatedAt = new Date();
              }
            });
          });
        },

        // Selection actions
        selectCard: (cardId, isMultiSelect = false) => {
          set((state) => {
            if (isMultiSelect) {
              if (state.selectedCards.includes(cardId)) {
                state.selectedCards = state.selectedCards.filter(id => id !== cardId);
              } else {
                state.selectedCards.push(cardId);
              }
            } else {
              state.selectedCards = [cardId];
            }
          });
        },

        clearSelection: () => {
          set((state) => {
            state.selectedCards = [];
          });
        },

        selectAll: (listId) => {
          set((state) => {
            const cards = listId 
              ? state.cards.filter(c => c.listId === listId)
              : state.cards.filter(c => {
                  const list = state.lists.find(l => l.id === c.listId);
                  return list?.boardId === state.activeBoard;
                });
            
            state.selectedCards = cards.map(c => c.id);
          });
        },

        // Search actions
        setSearchFilters: (filters) => {
          set((state) => {
            state.searchFilters = filters;
          });
        },

        clearSearch: () => {
          set((state) => {
            state.searchFilters = {};
            state.searchResults = null;
          });
        },

        searchCards: async (query, filters = {}) => {
          set((state) => {
            state.loadingStates.search = true;
          });

          try {
            // TODO: Implement search logic with Fuse.js
            const allCards = get().cards;
            const filteredCards = allCards.filter(card => 
              card.title.toLowerCase().includes(query.toLowerCase()) ||
              card.description?.toLowerCase().includes(query.toLowerCase())
            );

            set((state) => {
              state.searchResults = {
                cards: filteredCards,
                totalCount: filteredCards.length,
                hasMore: false,
              };
              state.loadingStates.search = false;
            });
          } catch (error) {
            set((state) => {
              state.errors.search = 'Search failed';
              state.loadingStates.search = false;
            });
          }
        },

        // Drag actions
        setDragState: (dragState) => {
          set((state) => {
            Object.assign(state.dragState, dragState);
          });
        },

        clearDragState: () => {
          set((state) => {
            state.dragState = { isDragging: false };
          });
        },

        // Data fetching
        fetchBoard: async (boardId) => {
          set((state) => {
            state.loadingStates[`board-${boardId}`] = true;
          });

          try {
            // TODO: API calls to fetch board data
            set((state) => {
              state.loadingStates[`board-${boardId}`] = false;
            });
          } catch (error) {
            set((state) => {
              state.errors[`board-${boardId}`] = 'Failed to load board';
              state.loadingStates[`board-${boardId}`] = false;
            });
          }
        },

        fetchBoards: async () => {
          set((state) => {
            state.loadingStates.boards = true;
          });

          try {
            // TODO: API call
            set((state) => {
              state.loadingStates.boards = false;
            });
          } catch (error) {
            set((state) => {
              state.errors.boards = 'Failed to load boards';
              state.loadingStates.boards = false;
            });
          }
        },

        syncWithServer: async () => {
          // TODO: Implement server sync
        },

        // Optimistic updates
        optimisticUpdate: (operationId, operation) => {
          const currentState = get();
          
          set((state) => {
            state.optimisticOperations.set(operationId, {
              type: 'generic',
              originalState: JSON.parse(JSON.stringify({
                boards: currentState.boards,
                lists: currentState.lists,
                cards: currentState.cards,
              })),
              timestamp: new Date(),
            });
          });

          operation();
        },

        rollbackOperation: (operationId) => {
          const operation = get().optimisticOperations.get(operationId);
          if (!operation) return;

          set((state) => {
            state.boards = operation.originalState.boards;
            state.lists = operation.originalState.lists;
            state.cards = operation.originalState.cards;
            state.optimisticOperations.delete(operationId);
          });
        },

        confirmOperation: (operationId) => {
          set((state) => {
            state.optimisticOperations.delete(operationId);
          });
        },

        // Utility functions
        getCardsByList: (listId) => {
          return get().cards
            .filter(card => card.listId === listId)
            .sort((a, b) => a.position - b.position);
        },

        getListsByBoard: (boardId) => {
          return get().lists
            .filter(list => list.boardId === boardId)
            .sort((a, b) => a.position - b.position);
        },

        getBoardById: (boardId) => {
          return get().boards.find(board => board.id === boardId);
        },

        getCardById: (cardId) => {
          return get().cards.find(card => card.id === cardId);
        },

        // Additional actions
        duplicateCard: async (cardId, targetListId) => {
          const originalCard = get().getCardById(cardId);
          if (!originalCard) return '';

          const newCard = {
            ...originalCard,
            title: `${originalCard.title} (Copy)`,
            listId: targetListId || originalCard.listId,
            createdBy: originalCard.createdBy, // TODO: Replace with current user
          };

          return await get().createCard(newCard);
        },

        archiveList: async (listId) => {
          // TODO: Implement archiving (soft delete)
        },

        restoreList: async (listId) => {
          // TODO: Implement restore from archive
        },

        // Error handling
        setError: (key, error) => {
          set((state) => {
            if (error) {
              state.errors[key] = error;
            } else {
              delete state.errors[key];
            }
          });
        },

        clearErrors: () => {
          set((state) => {
            state.errors = {};
          });
        },

        // Loading state management
        setLoading: (key, loading) => {
          set((state) => {
            if (loading) {
              state.loadingStates[key] = true;
            } else {
              delete state.loadingStates[key];
            }
          });
        },
      }))
    ),
    {
      name: 'board-store',
      // Only enable devtools in development
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Selectors for performance optimization
export const selectActiveBoard = (state: BoardState & BoardActions) => 
  state.activeBoard ? state.getBoardById(state.activeBoard) : null;

export const selectActiveBoardLists = (state: BoardState & BoardActions) => 
  state.activeBoard ? state.getListsByBoard(state.activeBoard) : [];

export const selectSelectedCards = (state: BoardState & BoardActions) =>
  state.selectedCards.map(cardId => state.getCardById(cardId)).filter(Boolean) as Card[];

export const selectIsLoading = (key: string) => (state: BoardState & BoardActions) =>
  state.loadingStates[key] || false;

export const selectError = (key: string) => (state: BoardState & BoardActions) =>
  state.errors[key] || null;