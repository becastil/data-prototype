'use client';

import React from 'react';
import { GlassCard } from '@/app/components/ui/glass-card';
import { TrendingUp, TrendingDown, DollarSign, Activity, Target, Users } from 'lucide-react';

interface KPIMetrics {
  pctOfBudget: number;
  totalBudget: number;
  totalPlanCost: number;
  surplus: number;
  planCostPEPM: number;
  budgetPEPM: number;
  netPaidPEPM: number;
  members: number;
}

interface KPITilesProps {
  metrics: KPIMetrics;
  period?: string; // e.g., "Rolling 12 Months" or "YTD"
}

function formatCurrency(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

// Determine color based on budget percentage thresholds
function getBudgetStatusColor(pct: number): { bg: string; border: string; text: string; icon: React.ReactNode } {
  if (pct < 95) {
    return {
      bg: 'bg-green-50',
      border: 'border-l-4 border-green-500',
      text: 'text-green-700',
      icon: <TrendingDown className="w-4 h-4 text-green-600" />
    };
  } else if (pct <= 105) {
    return {
      bg: 'bg-yellow-50',
      border: 'border-l-4 border-yellow-500',
      text: 'text-yellow-700',
      icon: <Activity className="w-4 h-4 text-yellow-600" />
    };
  } else {
    return {
      bg: 'bg-red-50',
      border: 'border-l-4 border-red-500',
      text: 'text-red-700',
      icon: <TrendingUp className="w-4 h-4 text-red-600" />
    };
  }
}

export default function KPITiles({ metrics, period = "Rolling 12 Months" }: KPITilesProps) {
  const budgetStatus = getBudgetStatusColor(metrics.pctOfBudget);
  const isSurplus = metrics.surplus >= 0;

  // Individual KPI Tile Component
  const KPITile = ({ 
    label, 
    value, 
    subLabel, 
    icon, 
    colorClass = '', 
    borderClass = '',
    bgClass = 'bg-white'
  }: {
    label: string;
    value: string;
    subLabel?: string;
    icon?: React.ReactNode;
    colorClass?: string;
    borderClass?: string;
    bgClass?: string;
  }) => (
    <GlassCard 
      variant="elevated" 
      className={`p-4 ${bgClass} ${borderClass} transition-all duration-200 hover:shadow-lg`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className={`text-2xl font-bold ${colorClass || 'text-gray-900'}`}>
            {value}
          </p>
          {subLabel && (
            <p className="text-xs text-gray-500 mt-1">{subLabel}</p>
          )}
        </div>
        {icon && (
          <div className="ml-3 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );

  return (
    <div className="w-full mb-6">
      {/* Period indicator */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Key Performance Indicators</h2>
        <span className="text-sm text-black bg-white border border-gray-300 px-3 py-1 rounded-full">
          {period}
        </span>
      </div>

      {/* KPI Tiles Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* % of Budget - with color coding */}
        <KPITile
          label="% of Budget"
          value={formatPercent(metrics.pctOfBudget)}
          subLabel={metrics.pctOfBudget < 95 ? "Under budget" : metrics.pctOfBudget <= 105 ? "Near budget" : "Over budget"}
          icon={budgetStatus.icon}
          colorClass={budgetStatus.text}
          borderClass={budgetStatus.border}
          bgClass={budgetStatus.bg}
        />

        {/* Total Budget */}
        <KPITile
          label="Total Budget"
          value={formatCurrency(metrics.totalBudget)}
          icon={<Target className="w-4 h-4 text-blue-600" />}
        />

        {/* Total Plan Cost */}
        <KPITile
          label="Plan Cost"
          value={formatCurrency(metrics.totalPlanCost)}
          icon={<DollarSign className="w-4 h-4 text-indigo-600" />}
        />

        {/* Surplus/Deficit - with color coding */}
        <KPITile
          label="Surplus/Deficit"
          value={formatCurrency(Math.abs(metrics.surplus))}
          subLabel={isSurplus ? "Surplus" : "Deficit"}
          icon={isSurplus ? 
            <TrendingUp className="w-4 h-4 text-green-600" /> : 
            <TrendingDown className="w-4 h-4 text-red-600" />
          }
          colorClass={isSurplus ? 'text-green-700' : 'text-red-700'}
          borderClass={isSurplus ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}
          bgClass={isSurplus ? 'bg-green-50' : 'bg-red-50'}
        />

        {/* Plan Cost PEPM */}
        <KPITile
          label="Cost PEPM"
          value={formatCurrency(metrics.planCostPEPM, 2)}
          subLabel="Per member"
          icon={<Users className="w-4 h-4 text-purple-600" />}
        />

        {/* Members */}
        <KPITile
          label="Members"
          value={formatNumber(metrics.members)}
          subLabel="Total enrolled"
          icon={<Users className="w-4 h-4 text-gray-600" />}
        />
      </div>

      {/* Optional: Budget Status Bar */}
      <div className="mt-4 bg-white border border-gray-300 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Budget Utilization</span>
          <span className={`text-sm font-bold ${budgetStatus.text}`}>
            {formatPercent(metrics.pctOfBudget)}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-300">
          <div 
            className={`h-full transition-all duration-500 ${
              metrics.pctOfBudget < 95 ? 'bg-green-500' :
              metrics.pctOfBudget <= 105 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(metrics.pctOfBudget, 130)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">0%</span>
          <span className="text-xs text-gray-500">95%</span>
          <span className="text-xs text-gray-500">105%</span>
          <span className="text-xs text-gray-500">130%</span>
        </div>
      </div>
    </div>
  );
}