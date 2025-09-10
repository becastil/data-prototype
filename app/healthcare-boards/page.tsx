'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Board from '@/app/features/boards/components/Board';
import { useBoardStore } from '@/app/stores/boardStore';
import { useHealthcareStore } from '@/app/stores/healthcareStore';
import { Button } from '@/app/components/ui/button';
import { GlassCard } from '@/app/components/ui/glass-card';
import CardExpandedModal from '@/app/features/boards/components/CardExpandedModal';
import { 
  Plus, 
  Upload, 
  BarChart3, 
  Shield, 
  Users,
  TrendingUp,
  FileText,
  Database
} from 'lucide-react';

// Sample healthcare data for demonstration
const sampleClaimsData = [
  {
    claimId: 'CLM001',
    memberId: 'MBR123',
    providerId: 'PRV456',
    serviceDate: '2024-01-15',
    amount: 2500.00,
    status: 'approved',
    serviceType: 'Surgery',
    diagnosis: 'Appendectomy',
    procedure: 'Laparoscopic appendectomy'
  },
  {
    claimId: 'CLM002',
    memberId: 'MBR124',
    providerId: 'PRV457',
    serviceDate: '2024-01-16',
    amount: 750.00,
    status: 'pending',
    serviceType: 'Consultation',
    diagnosis: 'Diabetes Type 2',
    procedure: 'Annual checkup'
  },
  {
    claimId: 'CLM003',
    memberId: 'MBR125',
    providerId: 'PRV458',
    serviceDate: '2024-01-17',
    amount: 12000.00,
    status: 'review',
    serviceType: 'Emergency',
    diagnosis: 'Heart Attack',
    procedure: 'Cardiac catheterization'
  },
];

const sampleBudgetData = [
  {
    period: '2024-Q1',
    month: 'January',
    employees: 1250,
    members: 45000,
    budget: 2500000,
    actual: 2650000,
    variance: 6.0,
    category: 'Medical Services'
  },
  {
    period: '2024-Q1',
    month: 'January',
    employees: 1250,
    members: 45000,
    budget: 800000,
    actual: 740000,
    variance: -7.5,
    category: 'Pharmacy'
  },
];

export default function HealthcareBoardsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [activeDemo, setActiveDemo] = useState<'claims' | 'budget' | null>(null);
  
  // Store hooks
  const createBoard = useBoardStore(state => state.createBoard);
  const createList = useBoardStore(state => state.createList);
  const createCard = useBoardStore(state => state.createCard);
  const setActiveBoard = useBoardStore(state => state.setActiveBoard);
  const activeBoard = useBoardStore(state => state.activeBoard);
  const cards = useBoardStore(state => state.cards);
  
  const importCSVData = useHealthcareStore(state => state.importCSVData);
  const metrics = useHealthcareStore(state => state.metrics);

  // Create sample healthcare analytics board
  const createSampleBoard = async (type: 'claims' | 'budget') => {
    setIsLoading(true);
    setActiveDemo(type);
    
    try {
      // Create board
      const boardId = await createBoard({
        title: type === 'claims' ? 'Q1 2024 Claims Processing' : 'Q1 2024 Budget Management',
        description: `Healthcare ${type} analytics with Trello-style workflow management`,
        visibility: 'team',
        members: [],
        settings: {
          allowComments: true,
          allowAttachments: true,
          enableAutomation: true,
          requireApproval: type === 'claims',
          hipaaMode: true,
        },
      });

      // Set as active board
      setActiveBoard(boardId);

      // Create lists based on type
      let lists: string[] = [];
      if (type === 'claims') {
        lists = [
          await createList({ boardId, title: 'Pending Review', position: 1000, createdBy: 'system' }),
          await createList({ boardId, title: 'Under Medical Review', position: 2000, createdBy: 'system' }),
          await createList({ boardId, title: 'Approved Claims', position: 3000, createdBy: 'system' }),
          await createList({ boardId, title: 'Requires Action', position: 4000, createdBy: 'system' }),
        ];
      } else {
        lists = [
          await createList({ boardId, title: 'Current Period', position: 1000, createdBy: 'system' }),
          await createList({ boardId, title: 'Over Budget', position: 2000, createdBy: 'system' }),
          await createList({ boardId, title: 'Under Budget', position: 3000, createdBy: 'system' }),
          await createList({ boardId, title: 'Needs Review', position: 4000, createdBy: 'system' }),
        ];
      }

      // Create sample cards with analytics
      if (type === 'claims') {
        for (let i = 0; i < sampleClaimsData.length; i++) {
          const claim = sampleClaimsData[i];
          const targetList = claim.status === 'approved' ? lists[2] 
                           : claim.status === 'pending' ? lists[0]
                           : claim.status === 'review' ? lists[1] 
                           : lists[3];

          await createCard({
            boardId,
            listId: targetList,
            title: `Claim ${claim.claimId} - ${claim.serviceType}`,
            description: `Member: ${claim.memberId} | Provider: ${claim.providerId}\nAmount: $${claim.amount.toLocaleString()} | Service: ${claim.serviceDate}`,
            position: (i + 1) * 1000,
            labels: [{
              id: `status-${claim.status}`,
              name: claim.status.toUpperCase(),
              color: claim.status === 'approved' ? 'green' : claim.status === 'pending' ? 'yellow' : 'red',
              description: `Claim status: ${claim.status}`
            }],
            assignees: [],
            attachments: [],
            activity: [],
            comments: [],
            isCompleted: claim.status === 'approved',
            priority: claim.amount > 10000 ? 'urgent' : claim.amount > 1000 ? 'high' : 'normal',
            status: claim.status === 'approved' ? 'completed' : claim.status === 'pending' ? 'pending' : 'review',
            createdBy: 'system',
            lastModifiedBy: 'system',
            customFields: {
              // Table data for ClaimsExpensesTable
              tableData: [claim],
              tableComponent: 'ClaimsExpensesTable',
              // Chart data for trend analysis
              chartData: {
                categories: ['Jan', 'Feb', 'Mar'],
                series: [{
                  name: 'Amount',
                  data: [claim.amount, claim.amount * 0.9, claim.amount * 1.1],
                  type: 'line'
                }]
              },
              chartComponent: 'EChartsEnterpriseChart',
              chartType: 'line',
              // Insight metrics
              metrics: [
                {
                  id: 'claim-amount',
                  label: 'Claim Amount',
                  value: claim.amount,
                  format: 'currency',
                  trend: 'stable',
                  icon: 'dollar',
                  status: 'info'
                },
                {
                  id: 'processing-time',
                  label: 'Processing Days',
                  value: Math.floor(Math.random() * 14) + 1,
                  format: 'number',
                  trend: 'down',
                  icon: 'clock',
                  status: 'good'
                }
              ],
              // Analytics configuration
              analytics: {
                type: 'table',
                component: 'ClaimsExpensesTable',
                config: {
                  compact: true,
                  interactive: true,
                  exportable: true,
                  refreshable: true,
                  sortable: true,
                  filterable: true,
                  searchable: true,
                }
              }
            },
          });
        }
      } else {
        for (let i = 0; i < sampleBudgetData.length; i++) {
          const budget = sampleBudgetData[i];
          const targetList = budget.variance > 5 ? lists[1] 
                           : budget.variance < -5 ? lists[2] 
                           : lists[0];

          await createCard({
            boardId,
            listId: targetList,
            title: `${budget.category} Budget - ${budget.period}`,
            description: `Budget: $${budget.budget.toLocaleString()}\nActual: $${budget.actual.toLocaleString()}\nVariance: ${budget.variance.toFixed(1)}%`,
            position: (i + 1) * 1000,
            labels: [{
              id: `variance-${budget.variance > 0 ? 'over' : 'under'}`,
              name: budget.variance > 0 ? 'OVER BUDGET' : 'UNDER BUDGET',
              color: budget.variance > 10 ? 'red' : budget.variance > 0 ? 'yellow' : 'green'
            }],
            assignees: [],
            attachments: [],
            activity: [],
            comments: [],
            isCompleted: false,
            priority: Math.abs(budget.variance) > 15 ? 'urgent' : Math.abs(budget.variance) > 5 ? 'high' : 'normal',
            status: 'pending',
            createdBy: 'system',
            lastModifiedBy: 'system',
            customFields: {
              // Chart data for budget visualization
              chartData: {
                categories: ['Budget', 'Actual'],
                series: [{
                  name: budget.category,
                  data: [budget.budget, budget.actual],
                  type: 'bar'
                }]
              },
              chartComponent: 'EChartsEnterpriseChart',
              chartType: 'bar',
              // Insight metrics
              metrics: [
                {
                  id: 'budget-amount',
                  label: 'Budget',
                  value: budget.budget,
                  format: 'currency',
                  trend: 'stable',
                  icon: 'dollar',
                  status: 'info'
                },
                {
                  id: 'actual-amount',
                  label: 'Actual Spend',
                  value: budget.actual,
                  format: 'currency',
                  trend: budget.variance > 0 ? 'up' : 'down',
                  trendPercentage: Math.abs(budget.variance),
                  icon: 'activity',
                  status: budget.variance > 10 ? 'warning' : 'good'
                },
                {
                  id: 'variance-pct',
                  label: 'Variance',
                  value: budget.variance,
                  format: 'percentage',
                  trend: budget.variance > 0 ? 'up' : 'down',
                  icon: budget.variance > 0 ? 'alert' : 'check',
                  status: Math.abs(budget.variance) > 10 ? 'danger' : 'good'
                }
              ],
              // Analytics configuration
              analytics: {
                type: 'insight',
                component: 'InsightCard',
                config: {
                  compact: true,
                  interactive: true,
                  exportable: true,
                  refreshable: true,
                  showTrends: true,
                  showTargets: true,
                  animateNumbers: true,
                }
              }
            },
          });
        }
      }

    } catch (error) {
      console.error('Failed to create sample board:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const expandedCard = expandedCardId ? cards[expandedCardId] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                Healthcare Analytics Boards
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Trello-style workflow management with embedded healthcare analytics
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => createSampleBoard('claims')}
                disabled={isLoading}
                className="flex items-center gap-2"
                variant={activeDemo === 'claims' ? 'default' : 'outline'}
              >
                <FileText className="w-4 h-4" />
                Claims Demo
              </Button>
              
              <Button
                onClick={() => createSampleBoard('budget')}
                disabled={isLoading}
                className="flex items-center gap-2"
                variant={activeDemo === 'budget' ? 'default' : 'outline'}
              >
                <TrendingUp className="w-4 h-4" />
                Budget Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {activeBoard && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <GlassCard variant="subtle" className="p-4">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Records</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {activeDemo === 'claims' ? sampleClaimsData.length : sampleBudgetData.length}
                  </p>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard variant="subtle" className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Analytics Cards</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Object.keys(cards).length}
                  </p>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard variant="subtle" className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Members</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.activeMembers.toLocaleString()}
                  </p>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard variant="subtle" className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Compliance</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.complianceScore}%
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Main Board */}
      {activeBoard ? (
        <Board 
          boardId={activeBoard.id}
          complianceMode={true}
          enablePHIMasking={true}
          enableKeyboardNavigation={true}
          screenReaderAnnouncements={true}
          onExpand={(cardId) => setExpandedCardId(cardId)}
        />
      ) : (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <GlassCard variant="elevated" className="p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Healthcare Analytics Boards</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Experience the power of Trello-style workflow management combined with sophisticated healthcare analytics.
              Each card contains rich data visualizations, tables, and insights.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="text-left">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Claims Processing Demo
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Interactive claims data tables</li>
                  <li>• Real-time processing status</li>
                  <li>• Approval workflow management</li>
                  <li>• HIPAA compliance indicators</li>
                </ul>
              </div>
              
              <div className="text-left">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Budget Management Demo
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Budget vs actual visualizations</li>
                  <li>• Variance analysis charts</li>
                  <li>• KPI and metrics dashboards</li>
                  <li>• Financial trend indicators</li>
                </ul>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              Select a demo above to see healthcare analytics embedded directly in Trello-style cards
            </p>
          </GlassCard>
        </div>
      )}

      {/* Expanded Card Modal */}
      {expandedCard && (
        <CardExpandedModal
          card={expandedCard}
          isOpen={!!expandedCardId}
          onClose={() => setExpandedCardId(null)}
          onUpdate={async (updates) => {
            // Handle card updates
            console.log('Updating card:', expandedCardId, updates);
          }}
          onAddComment={async (cardId, content) => {
            // Handle comment addition
            console.log('Adding comment to card:', cardId, content);
          }}
          onRefreshData={async () => {
            // Handle data refresh
            console.log('Refreshing data for card:', expandedCardId);
          }}
          onExportData={async (format) => {
            // Handle data export
            console.log('Exporting data in format:', format);
          }}
        />
      )}
    </div>
  );
}