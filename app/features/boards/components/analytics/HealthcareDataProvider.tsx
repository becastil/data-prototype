'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useHealthcareStore, selectMetrics } from '@/app/stores/healthcareStore';
import { useBoardStore } from '@/app/stores/boardStore';
import { Card as CardType } from '../../types';
import { InsightMetric } from './InsightCard';

// Context for providing healthcare data to analytics cards
interface HealthcareDataContextType {
  // Raw healthcare data
  claimsData: any[];
  budgetData: any[];
  memberData: any[];
  
  // Processed analytics data
  getTableData: (cardId: string, component: string) => any[];
  getChartData: (cardId: string, component: string) => any;
  getInsightData: (cardId: string, component: string) => {
    metrics: InsightMetric[];
    title?: string;
    description?: string;
    period?: string;
    lastUpdated?: Date;
  };
  
  // Data refresh and management
  refreshData: () => Promise<void>;
  exportData: (format: 'csv' | 'pdf', cardId?: string) => Promise<void>;
  
  // Metrics and status
  metrics: {
    totalClaims: number;
    totalBudget: number;
    activeMembers: number;
    complianceScore: number;
    lastUpdated: Date | null;
  };
  complianceStatus: 'compliant' | 'warning' | 'violation';
}

const HealthcareDataContext = createContext<HealthcareDataContextType | null>(null);

// Hook to use healthcare data in analytics components
export const useHealthcareData = () => {
  const context = useContext(HealthcareDataContext);
  if (!context) {
    throw new Error('useHealthcareData must be used within a HealthcareDataProvider');
  }
  return context;
};

// Provider component
export const HealthcareDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Healthcare store subscriptions
  const claimsData = useHealthcareStore(state => state.claimsData);
  const budgetData = useHealthcareStore(state => state.budgetData);
  const memberData = useHealthcareStore(state => state.memberData);
  const metrics = useHealthcareStore(selectMetrics);
  const complianceStatus = useHealthcareStore(state => state.getComplianceStatus());
  const calculateMetrics = useHealthcareStore(state => state.calculateMetrics);
  const syncWithSecureStorage = useHealthcareStore(state => state.syncWithSecureStorage);
  
  // Board store for card context
  const cards = useBoardStore(state => state.cards);
  
  // Process table data based on card configuration
  const getTableData = useMemo(() => (cardId: string, component: string) => {
    const card = cards[cardId];
    if (!card?.customFields?.tableData) {
      // Determine data source based on component type
      switch (component) {
        case 'ClaimsExpensesTable':
          return claimsData.map(claim => ({
            id: claim.claimId,
            member: claim.memberId,
            provider: claim.providerId,
            service: claim.serviceType,
            amount: claim.amount,
            status: claim.status,
            date: claim.serviceDate,
          }));
        
        case 'FinancialDataTable':
          return budgetData.map(budget => ({
            period: budget.period,
            category: budget.category || 'General',
            budget: budget.budget,
            actual: budget.actual || 0,
            variance: budget.variance || 0,
            employees: budget.employees,
            members: budget.members,
          }));
          
        case 'HCCDataTable':
          // Generate HCC data from claims
          return claimsData
            .filter(claim => claim.diagnosis)
            .map(claim => ({
              memberId: claim.memberId,
              diagnosis: claim.diagnosis,
              hccCode: `HCC-${Math.floor(Math.random() * 100)}`, // Mock HCC code
              riskScore: Math.random() * 2 + 0.5, // Mock risk score
              amount: claim.amount,
            }));
        
        default:
          return [];
      }
    }
    
    return card.customFields.tableData;
  }, [cards, claimsData, budgetData]);
  
  // Process chart data based on card configuration
  const getChartData = useMemo(() => (cardId: string, component: string) => {
    const card = cards[cardId];
    if (card?.customFields?.chartData) {
      return card.customFields.chartData;
    }
    
    // Generate chart data based on component type
    switch (component) {
      case 'EChartsEnterpriseChart':
        // Claims by status over time
        const claimsByMonth = claimsData.reduce((acc, claim) => {
          const month = claim.serviceDate?.substring(0, 7) || '2024-01';
          if (!acc[month]) acc[month] = {};
          if (!acc[month][claim.status]) acc[month][claim.status] = 0;
          acc[month][claim.status]++;
          return acc;
        }, {} as Record<string, Record<string, number>>);
        
        return {
          categories: Object.keys(claimsByMonth).sort(),
          series: [
            {
              name: 'Approved',
              data: Object.keys(claimsByMonth).sort().map(month => claimsByMonth[month]['approved'] || 0),
              type: 'bar',
            },
            {
              name: 'Pending',
              data: Object.keys(claimsByMonth).sort().map(month => claimsByMonth[month]['pending'] || 0),
              type: 'bar',
            },
            {
              name: 'Denied',
              data: Object.keys(claimsByMonth).sort().map(month => claimsByMonth[month]['denied'] || 0),
              type: 'bar',
            },
          ],
        };
      
      case 'PremiumEnrollmentChart':
        // Budget vs actual over time
        return {
          categories: budgetData.map(b => b.period).slice(0, 12),
          series: [
            {
              name: 'Budget',
              data: budgetData.map(b => b.budget).slice(0, 12),
              type: 'line',
            },
            {
              name: 'Actual',
              data: budgetData.map(b => b.actual || 0).slice(0, 12),
              type: 'line',
            },
          ],
        };
      
      default:
        return null;
    }
  }, [cards, claimsData, budgetData]);
  
  // Process insight data based on card configuration
  const getInsightData = useMemo(() => (cardId: string, component: string) => {
    const card = cards[cardId];
    if (card?.customFields?.metrics) {
      return {
        metrics: card.customFields.metrics,
        title: card.title,
        period: card.customFields.period,
      };
    }
    
    // Generate insights based on current healthcare data
    const totalClaimsAmount = claimsData.reduce((sum, claim) => sum + claim.amount, 0);
    const approvedClaims = claimsData.filter(claim => claim.status === 'approved');
    const approvedAmount = approvedClaims.reduce((sum, claim) => sum + claim.amount, 0);
    const approvalRate = claimsData.length > 0 ? (approvedClaims.length / claimsData.length) * 100 : 0;
    
    const totalBudget = budgetData.reduce((sum, budget) => sum + budget.budget, 0);
    const totalActual = budgetData.reduce((sum, budget) => sum + (budget.actual || 0), 0);
    const budgetVariance = totalBudget > 0 ? ((totalActual - totalBudget) / totalBudget) * 100 : 0;
    
    const metrics: InsightMetric[] = [
      {
        id: 'total-claims',
        label: 'Total Claims',
        value: claimsData.length,
        format: 'number',
        trend: 'stable',
        icon: 'chart',
        status: 'info',
        description: 'Total number of claims processed',
      },
      {
        id: 'claims-amount',
        label: 'Claims Value',
        value: totalClaimsAmount,
        format: 'currency',
        trend: 'up',
        trendPercentage: 5.2,
        icon: 'dollar',
        status: 'good',
        description: 'Total monetary value of all claims',
      },
      {
        id: 'approval-rate',
        label: 'Approval Rate',
        value: approvalRate,
        format: 'percentage',
        trend: approvalRate > 85 ? 'up' : approvalRate < 75 ? 'down' : 'stable',
        target: 85,
        icon: 'check',
        status: approvalRate > 85 ? 'good' : approvalRate < 75 ? 'warning' : 'info',
        description: 'Percentage of claims approved',
      },
      {
        id: 'budget-variance',
        label: 'Budget Variance',
        value: budgetVariance,
        format: 'percentage',
        trend: budgetVariance > 0 ? 'up' : budgetVariance < 0 ? 'down' : 'stable',
        trendPercentage: Math.abs(budgetVariance),
        icon: 'activity',
        status: Math.abs(budgetVariance) > 10 ? 'warning' : 'good',
        description: 'Budget performance vs actual spending',
      },
      {
        id: 'active-members',
        label: 'Active Members',
        value: new Set(claimsData.map(c => c.memberId)).size,
        format: 'number',
        trend: 'stable',
        icon: 'users',
        status: 'info',
        description: 'Unique members with claims activity',
      },
      {
        id: 'compliance-score',
        label: 'Compliance Score',
        value: metrics.complianceScore,
        format: 'percentage',
        trend: 'stable',
        target: 95,
        icon: complianceStatus === 'compliant' ? 'check' : 'alert',
        status: complianceStatus === 'compliant' ? 'good' : 'warning',
        description: 'Overall HIPAA compliance rating',
      },
    ];
    
    return {
      metrics,
      title: 'Healthcare Analytics Overview',
      description: 'Key performance indicators for healthcare operations',
      period: 'Current Period',
      lastUpdated: metrics.lastUpdated,
    };
  }, [cards, claimsData, budgetData, metrics, complianceStatus]);
  
  // Data refresh function
  const refreshData = async () => {
    try {
      calculateMetrics();
      await syncWithSecureStorage();
    } catch (error) {
      console.error('Failed to refresh healthcare data:', error);
      throw error;
    }
  };
  
  // Data export function
  const exportData = async (format: 'csv' | 'pdf', cardId?: string) => {
    try {
      // TODO: Implement secure data export based on card type
      console.log(`Exporting ${format} data for card ${cardId || 'all'}`);
    } catch (error) {
      console.error('Failed to export healthcare data:', error);
      throw error;
    }
  };
  
  // Auto-refresh metrics when data changes
  useEffect(() => {
    calculateMetrics();
  }, [claimsData, budgetData, memberData, calculateMetrics]);
  
  const contextValue: HealthcareDataContextType = {
    claimsData,
    budgetData,
    memberData,
    getTableData,
    getChartData,
    getInsightData,
    refreshData,
    exportData,
    metrics,
    complianceStatus,
  };
  
  return (
    <HealthcareDataContext.Provider value={contextValue}>
      {children}
    </HealthcareDataContext.Provider>
  );
};

export default HealthcareDataProvider;