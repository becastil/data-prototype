import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  HealthcareCard, 
  HealthcareDataImport, 
  HealthcareSearchFilters, 
  HealthcareExportOptions,
  ClaimData,
  BudgetData,
  MemberData,
  ProviderData,
  ComplianceCheck,
  HEALTHCARE_BOARD_TEMPLATES
} from '@/app/bridges/healthcare/types';
import { ParsedCSVData } from '@/app/components/loaders/CSVLoader';
import { secureHealthcareStorage } from '@/app/lib/SecureHealthcareStorage';
import { useBoardStore } from './boardStore';

// Healthcare-specific store state
interface HealthcareState {
  // Healthcare data cache
  claimsData: ClaimData[];
  budgetData: BudgetData[];
  memberData: MemberData[];
  providerData: ProviderData[];

  // Authenticated context
  currentUserId: string | null;
  
  // Import tracking
  activeImports: Map<string, HealthcareDataImport>;
  importProgress: Record<string, {
    status: 'preparing' | 'processing' | 'creating_cards' | 'completed' | 'error';
    progress: number;
    totalRecords: number;
    processedRecords: number;
    errors: string[];
  }>;
  
  // HIPAA and compliance
  complianceChecks: ComplianceCheck[];
  phiAccessLog: {
    userId: string;
    cardId: string;
    action: string;
    timestamp: Date;
    justification?: string;
  }[];
  
  // Healthcare-specific UI state
  selectedTemplate: string | null;
  maskedFields: Set<string>;
  complianceMode: boolean;
  
  // Analytics and metrics
  metrics: {
    totalClaims: number;
    totalBudget: number;
    activeMembers: number;
    complianceScore: number;
    lastUpdated: Date | null;
  };
}

interface HealthcareActions {
  // Data import and transformation
  importCSVData: (data: ParsedCSVData, type: 'claims' | 'budget' | 'member' | 'provider', options: {
    boardTitle: string;
    template: string;
    autoCreateLists: boolean;
  }) => Promise<string>;
  
  transformDataToCards: (importId: string) => Promise<string[]>;
  
  // Healthcare card operations
  createHealthcareCard: (data: ClaimData | BudgetData | MemberData | ProviderData, type: string, listId: string) => Promise<string>;
  updateHealthcareCard: (cardId: string, updates: Partial<HealthcareCard>) => Promise<void>;
  
  // PHI and compliance
  maskPHI: (cardId: string, fields: string[]) => void;
  unmaskPHI: (cardId: string, fields: string[], justification: string) => void;
  runComplianceCheck: (cardId: string) => Promise<ComplianceCheck[]>;
  logPHIAccess: (cardId: string, action: string, justification?: string) => void;
  
  // Healthcare-specific search and filtering
  searchHealthcareCards: (filters: HealthcareSearchFilters) => Promise<HealthcareCard[]>;
  
  // Export functionality
  exportHealthcareData: (options: HealthcareExportOptions) => Promise<string>;
  
  // Template management
  setSelectedTemplate: (templateId: string) => void;
  createBoardFromTemplate: (templateId: string, title: string) => Promise<string>;
  
  // Analytics
  calculateMetrics: () => void;
  
  // Compliance utilities
  setComplianceMode: (enabled: boolean) => void;
  getComplianceStatus: () => 'compliant' | 'warning' | 'violation';

  // Data synchronization
  syncWithSecureStorage: () => Promise<void>;
  clearHealthcareData: () => void;

  // Auth integration
  setCurrentUser: (userId: string | null) => void;
}

// Helper functions for healthcare data transformation
function transformClaimToCard(claim: ClaimData, listId: string): Omit<HealthcareCard, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title: `Claim ${claim.claimId} - ${claim.serviceType}`,
    description: `Member: ${claim.memberId}\nProvider: ${claim.providerId}\nAmount: $${claim.amount.toLocaleString()}`,
    boardId: '', // Will be set by caller
    listId,
    position: 0, // Will be calculated
    labels: [
      {
        id: `status-${claim.status}`,
        name: claim.status.toUpperCase(),
        color: getStatusColor(claim.status),
        description: `Claim status: ${claim.status}`
      }
    ],
    assignees: [],
    attachments: [],
    activity: [],
    comments: [],
    isCompleted: claim.status === 'approved',
    priority: claim.amount > 10000 ? 'high' : claim.amount > 1000 ? 'normal' : 'low',
    status: claim.status as any,
    createdBy: 'system',
    lastModifiedBy: 'system',
    customFields: {},
    
    // Healthcare-specific fields
    claimData: claim,
    healthcare: {
      type: 'claim',
      phi: {
        containsPHI: true,
        maskedFields: [],
        accessLevel: 'restricted'
      },
      financial: {
        claimAmount: claim.amount,
        paidAmount: claim.status === 'approved' ? claim.amount : 0,
      },
      workflow: {
        requiresAuthorization: claim.amount > 5000,
        reviewLevel: claim.amount > 10000 ? 'medical_director' : 'standard',
      }
    }
  };
}

function transformBudgetToCard(budget: BudgetData, listId: string): Omit<HealthcareCard, 'id' | 'createdAt' | 'updatedAt'> {
  const variance = budget.actual ? ((budget.actual - budget.budget) / budget.budget) * 100 : 0;
  
  return {
    title: `Budget ${budget.period} - ${budget.category || 'General'}`,
    description: `Period: ${budget.month}\nBudget: $${budget.budget.toLocaleString()}\nActual: $${(budget.actual || 0).toLocaleString()}\nVariance: ${variance.toFixed(1)}%`,
    boardId: '',
    listId,
    position: 0,
    labels: [
      {
        id: `variance-${variance > 0 ? 'over' : 'under'}`,
        name: variance > 0 ? 'OVER BUDGET' : 'UNDER BUDGET',
        color: variance > 10 ? 'red' : variance > 0 ? 'yellow' : 'green',
      }
    ],
    assignees: [],
    attachments: [],
    activity: [],
    comments: [],
    isCompleted: false,
    priority: Math.abs(variance) > 20 ? 'urgent' : Math.abs(variance) > 10 ? 'high' : 'normal',
    status: 'pending',
    createdBy: 'system',
    lastModifiedBy: 'system',
    customFields: {
      variance: variance,
      employees: budget.employees,
      members: budget.members,
    },
    
    budgetData: budget,
    healthcare: {
      type: 'budget',
      phi: {
        containsPHI: false,
        maskedFields: [],
        accessLevel: 'public'
      },
      financial: {
        claimAmount: budget.budget,
        paidAmount: budget.actual || 0,
      }
    }
  };
}

function getStatusColor(status: string): 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'gray' {
  switch (status) {
    case 'approved': return 'green';
    case 'denied': return 'red';
    case 'pending': return 'yellow';
    case 'processing': return 'blue';
    default: return 'gray';
  }
}

// Create the healthcare store
export const useHealthcareStore = create<HealthcareState & HealthcareActions>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        claimsData: [],
        budgetData: [],
        memberData: [],
        providerData: [],
        currentUserId: null,
        activeImports: new Map(),
        importProgress: {},
        complianceChecks: [],
        phiAccessLog: [],
        selectedTemplate: null,
        maskedFields: new Set(),
        complianceMode: true, // Start in compliance mode for healthcare
        metrics: {
          totalClaims: 0,
          totalBudget: 0,
          activeMembers: 0,
          complianceScore: 100,
          lastUpdated: null,
        },

        // Import CSV data and create board
        importCSVData: async (data, type, options) => {
          const importId = `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const importJob: HealthcareDataImport = {
            source: 'csv',
            type,
            data,
            mapping: [], // TODO: Smart field mapping
            boardSettings: {
              title: options.boardTitle,
              template: options.template,
              autoCreateLists: options.autoCreateLists,
            },
            cardRules: {
              titleTemplate: type === 'claims' ? 'Claim {{claimId}} - {{serviceType}}' : 
                           type === 'budget' ? 'Budget {{period}} - {{category}}' :
                           'Record {{id}}',
            },
          };

          set((state) => {
            state.activeImports.set(importId, importJob);
            state.importProgress[importId] = {
              status: 'preparing',
              progress: 0,
              totalRecords: data.rows.length,
              processedRecords: 0,
              errors: [],
            };
          });

          try {
            // Create board first
            const boardStore = useBoardStore.getState();
            const boardId = await boardStore.createBoard({
              title: options.boardTitle,
              description: `Healthcare ${type} data imported from CSV`,
              visibility: 'team',
              members: [],
              settings: {
                allowComments: true,
                allowAttachments: true,
                enableAutomation: false,
                requireApproval: true,
                hipaaMode: true, // Enable HIPAA mode for healthcare boards
              },
            });

            // Create default lists based on template
            const lists = await get().createListsFromTemplate(boardId, options.template);
            
            // Transform data to cards
            await get().transformDataToCards(importId);

            set((state) => {
              state.importProgress[importId].status = 'completed';
              state.importProgress[importId].progress = 100;
            });

            return boardId;
          } catch (error) {
            set((state) => {
              state.importProgress[importId].status = 'error';
              state.importProgress[importId].errors.push(error instanceof Error ? error.message : 'Unknown error');
            });
            throw error;
          }
        },

        createListsFromTemplate: async (boardId: string, templateId: string) => {
          const boardStore = useBoardStore.getState();
          const lists: string[] = [];

          switch (templateId) {
            case HEALTHCARE_BOARD_TEMPLATES.CLAIMS_PROCESSING:
              lists.push(
                await boardStore.createList({ boardId, title: 'Pending Review', position: 1000, createdBy: 'system' }),
                await boardStore.createList({ boardId, title: 'Under Review', position: 2000, createdBy: 'system' }),
                await boardStore.createList({ boardId, title: 'Approved', position: 3000, createdBy: 'system' }),
                await boardStore.createList({ boardId, title: 'Denied', position: 4000, createdBy: 'system' }),
              );
              break;
              
            case HEALTHCARE_BOARD_TEMPLATES.BUDGET_MANAGEMENT:
              lists.push(
                await boardStore.createList({ boardId, title: 'Current Period', position: 1000, createdBy: 'system' }),
                await boardStore.createList({ boardId, title: 'Over Budget', position: 2000, createdBy: 'system' }),
                await boardStore.createList({ boardId, title: 'Under Budget', position: 3000, createdBy: 'system' }),
                await boardStore.createList({ boardId, title: 'Needs Review', position: 4000, createdBy: 'system' }),
              );
              break;
              
            default:
              lists.push(
                await boardStore.createList({ boardId, title: 'To Do', position: 1000, createdBy: 'system' }),
                await boardStore.createList({ boardId, title: 'In Progress', position: 2000, createdBy: 'system' }),
                await boardStore.createList({ boardId, title: 'Completed', position: 3000, createdBy: 'system' }),
              );
          }
          
          return lists;
        },

        transformDataToCards: async (importId) => {
          const importJob = get().activeImports.get(importId);
          if (!importJob) return [];

          const boardStore = useBoardStore.getState();
          const createdCards: string[] = [];
          
          set((state) => {
            state.importProgress[importId].status = 'creating_cards';
          });

          try {
            for (let i = 0; i < importJob.data.rows.length; i++) {
              const row = importJob.data.rows[i];
              
              // Transform based on data type
              let cardData: Omit<HealthcareCard, 'id' | 'createdAt' | 'updatedAt'> | null = null;
              
              if (importJob.type === 'claims') {
                const claimData: ClaimData = {
                  claimId: row['claimId'] || row['claim_id'] || `CLM-${i + 1}`,
                  memberId: row['memberId'] || row['member_id'] || '',
                  providerId: row['providerId'] || row['provider_id'] || '',
                  serviceDate: row['serviceDate'] || row['service_date'] || '',
                  amount: parseFloat(row['amount'] || '0'),
                  status: (row['status'] || 'pending') as any,
                  serviceType: row['serviceType'] || row['service_type'] || 'General',
                  diagnosis: row['diagnosis'],
                  procedure: row['procedure'],
                };
                
                // Store in healthcare data cache
                set((state) => {
                  state.claimsData.push(claimData);
                });
                
                // Determine target list based on status
                const lists = boardStore.getListsByBoard(boardStore.activeBoard!);
                const targetList = lists.find(l => 
                  l.title.toLowerCase().includes(claimData.status) ||
                  (claimData.status === 'pending' && l.title.toLowerCase().includes('pending'))
                ) || lists[0];
                
                cardData = transformClaimToCard(claimData, targetList.id);
              }
              
              if (importJob.type === 'budget') {
                const budgetData: BudgetData = {
                  period: row['period'] || '',
                  month: row['month'] || '',
                  employees: parseInt(row['employees'] || '0'),
                  members: parseInt(row['members'] || '0'),
                  budget: parseFloat(row['budget'] || '0'),
                  actual: parseFloat(row['actual'] || '0'),
                  variance: parseFloat(row['variance'] || '0'),
                  category: row['category'],
                };
                
                set((state) => {
                  state.budgetData.push(budgetData);
                });
                
                const lists = boardStore.getListsByBoard(boardStore.activeBoard!);
                const variance = ((budgetData.actual || 0) - budgetData.budget) / budgetData.budget * 100;
                const targetList = variance > 5 
                  ? lists.find(l => l.title.toLowerCase().includes('over')) || lists[0]
                  : variance < -5 
                    ? lists.find(l => l.title.toLowerCase().includes('under')) || lists[0]
                    : lists[0];
                
                cardData = transformBudgetToCard(budgetData, targetList.id);
              }

              if (cardData) {
                cardData.boardId = boardStore.activeBoard!;
                cardData.position = (i + 1) * 1000;
                
                const cardId = await boardStore.createCard(cardData as any);
                createdCards.push(cardId);
              }

              // Update progress
              set((state) => {
                state.importProgress[importId].processedRecords = i + 1;
                state.importProgress[importId].progress = Math.round(((i + 1) / importJob.data.rows.length) * 100);
              });
            }

            // Calculate metrics after import
            get().calculateMetrics();
            
            return createdCards;
          } catch (error) {
            set((state) => {
              state.importProgress[importId].status = 'error';
              state.importProgress[importId].errors.push(error instanceof Error ? error.message : 'Card creation failed');
            });
            throw error;
          }
        },

        createHealthcareCard: async (data, type, listId) => {
          const boardStore = useBoardStore.getState();
          let cardData: Omit<HealthcareCard, 'id' | 'createdAt' | 'updatedAt'>;

          if (type === 'claim' && 'claimId' in data) {
            cardData = transformClaimToCard(data as ClaimData, listId);
          } else if (type === 'budget' && 'period' in data) {
            cardData = transformBudgetToCard(data as BudgetData, listId);
          } else {
            throw new Error(`Unsupported data type: ${type}`);
          }

          cardData.boardId = boardStore.activeBoard!;
          return await boardStore.createCard(cardData as any);
        },

        updateHealthcareCard: async (cardId, updates) => {
          const boardStore = useBoardStore.getState();
          await boardStore.updateCard(cardId, updates);
          
          // Log PHI access if updating healthcare data
          if (updates.claimData || updates.memberData) {
            get().logPHIAccess(cardId, 'modify', 'Card data updated');
          }
        },

        // PHI and compliance methods
        maskPHI: (cardId, fields) => {
          set((state) => {
            fields.forEach(field => state.maskedFields.add(`${cardId}:${field}`));
          });
        },

        unmaskPHI: (cardId, fields, justification) => {
          set((state) => {
            fields.forEach(field => state.maskedFields.delete(`${cardId}:${field}`));
          });
          
          get().logPHIAccess(cardId, 'unmask', justification);
        },

        runComplianceCheck: async (cardId) => {
          // TODO: Implement comprehensive compliance checking
          const checks: ComplianceCheck[] = [
            {
              type: 'phi_scan',
              status: 'compliant',
              details: 'No unmasked PHI detected',
              checkedAt: new Date(),
              checkedBy: 'system',
            }
          ];
          
          set((state) => {
            state.complianceChecks.push(...checks);
          });
          
          return checks;
        },

        logPHIAccess: (cardId, action, justification) => {
          set((state) => {
            const userId = state.currentUserId ?? 'anonymous';
            state.phiAccessLog.push({
              userId,
              cardId,
              action,
              timestamp: new Date(),
              justification,
            });
          });
        },

        searchHealthcareCards: async (filters) => {
          const boardStore = useBoardStore.getState();
          const allCards = boardStore.cards as HealthcareCard[];
          
          // TODO: Implement sophisticated filtering based on healthcare criteria
          return allCards.filter(card => {
            if (filters.claimAmount) {
              const amount = card.healthcare?.financial?.claimAmount || 0;
              if (filters.claimAmount.min && amount < filters.claimAmount.min) return false;
              if (filters.claimAmount.max && amount > filters.claimAmount.max) return false;
            }
            
            return true;
          });
        },

        exportHealthcareData: async (options) => {
          // TODO: Implement secure healthcare data export
          return 'export-url';
        },

        setSelectedTemplate: (templateId) => {
          set((state) => {
            state.selectedTemplate = templateId;
          });
        },

        createBoardFromTemplate: async (templateId, title) => {
          return await get().importCSVData(
            { headers: [], rows: [], rowCount: 0 }, 
            'claims', 
            { boardTitle: title, template: templateId, autoCreateLists: true }
          );
        },

        calculateMetrics: () => {
          const state = get();
          
          set((draft) => {
            draft.metrics = {
              totalClaims: state.claimsData.length,
              totalBudget: state.budgetData.reduce((sum, b) => sum + b.budget, 0),
              activeMembers: new Set(state.claimsData.map(c => c.memberId)).size,
              complianceScore: state.complianceChecks.length > 0 
                ? (state.complianceChecks.filter(c => c.status === 'compliant').length / state.complianceChecks.length) * 100 
                : 100,
              lastUpdated: new Date(),
            };
          });
        },

        setComplianceMode: (enabled) => {
          set((state) => {
            state.complianceMode = enabled;
          });
        },

        getComplianceStatus: () => {
          const checks = get().complianceChecks;
          if (checks.some(c => c.status === 'violation')) return 'violation';
          if (checks.some(c => c.status === 'warning')) return 'warning';
          return 'compliant';
        },

        syncWithSecureStorage: async () => {
          try {
            // Store healthcare data in secure storage
            await secureHealthcareStorage.storeTemporary('healthcareData', {
              claimsData: get().claimsData,
              budgetData: get().budgetData,
              memberData: get().memberData,
              providerData: get().providerData,
              metrics: get().metrics,
              lastSync: new Date().toISOString(),
            });
          } catch (error) {
            console.error('Failed to sync with secure storage:', error);
          }
        },

        clearHealthcareData: () => {
          set((state) => {
            state.claimsData = [];
            state.budgetData = [];
            state.memberData = [];
            state.providerData = [];
            state.complianceChecks = [];
            state.phiAccessLog = [];
            state.maskedFields.clear();
            state.currentUserId = null;
            state.metrics = {
              totalClaims: 0,
              totalBudget: 0,
              activeMembers: 0,
              complianceScore: 100,
              lastUpdated: null,
            };
          });
        },

        setCurrentUser: (userId) => {
          set((state) => {
            state.currentUserId = userId;
          });
        },
      }))
    ),
    {
      name: 'healthcare-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Selectors
export const selectImportProgress = (importId: string) => (state: HealthcareState & HealthcareActions) =>
  state.importProgress[importId];

export const selectComplianceStatus = (state: HealthcareState & HealthcareActions) =>
  state.getComplianceStatus();

export const selectMetrics = (state: HealthcareState & HealthcareActions) =>
  state.metrics;