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
      bg: 'bg-[var(--accent-soft)]',
      border: 'border-l-4 border-[var(--accent)]',
      text: 'text-[var(--accent)]',
      icon: <TrendingDown className="w-4 h-4 text-[var(--accent)]" />
    };
  }

  if (pct <= 105) {
    return {
      bg: 'bg-[var(--surface-muted)]',
      border: 'border-l-4 border-[var(--surface-border)]',
      text: 'text-[var(--foreground-muted)]',
      icon: <Activity className="w-4 h-4 text-[var(--foreground-muted)]" />
    };
  }

  return {
    bg: 'bg-[var(--surface-muted)]',
    border: 'border-l-4 border-[var(--danger)]',
    text: 'text-[var(--danger)]',
    icon: <TrendingUp className="w-4 h-4 text-[var(--danger)]" />
  };
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
      className={`p-4 ${bgClass} ${borderClass} transition-all duration-200 hover:shadow-[var(--card-hover-shadow)]`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)] mb-1">
            {label}
          </p>
          <p className={`text-2xl font-bold ${colorClass || 'text-[var(--foreground)]'}`}>
            {value}
          </p>
          {subLabel && (
            <p className="text-xs text-[var(--foreground-subtle)] mt-1">{subLabel}</p>
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
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Key Performance Indicators</h2>
        <span className="text-sm text-[var(--accent)] bg-[var(--accent-soft)] border border-[var(--card-hover-border)] px-3 py-1 rounded-full">
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
          icon={<Target className="w-4 h-4 text-[var(--accent)]" />}
        />

        {/* Total Plan Cost */}
        <KPITile
          label="Plan Cost"
          value={formatCurrency(metrics.totalPlanCost)}
          icon={<DollarSign className="w-4 h-4 text-[#18BFFF]" />}
        />

        {/* Surplus/Deficit - with color coding */}
        <KPITile
          label="Surplus/Deficit"
          value={formatCurrency(Math.abs(metrics.surplus))}
          subLabel={isSurplus ? "Surplus" : "Deficit"}
          icon={isSurplus ? 
            <TrendingUp className="w-4 h-4 text-[var(--accent)]" /> : 
            <TrendingDown className="w-4 h-4 text-[var(--danger)]" />
          }
          colorClass={isSurplus ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}
          borderClass={isSurplus ? 'border-l-4 border-[var(--accent)]' : 'border-l-4 border-[var(--danger)]'}
          bgClass={isSurplus ? 'bg-[var(--accent-soft)]' : 'bg-[var(--surface-muted)]'}
        />

        {/* Plan Cost PEPM */}
        <KPITile
          label="Cost PEPM"
          value={formatCurrency(metrics.planCostPEPM, 2)}
          subLabel="Per member"
          icon={<Users className="w-4 h-4 text-[#46A3FF]" />}
        />

        {/* Members */}
        <KPITile
          label="Members"
          value={formatNumber(metrics.members)}
          subLabel="Total enrolled"
          icon={<Users className="w-4 h-4 text-[var(--foreground-muted)]" />}
        />
      </div>

      {/* Optional: Budget Status Bar */}
      <div className="mt-4 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--foreground-muted)]">Budget Utilization</span>
          <span className={`text-sm font-bold ${budgetStatus.text}`}>
            {formatPercent(metrics.pctOfBudget)}
          </span>
        </div>
        <div className="w-full bg-[var(--surface-muted)] rounded-full h-2 overflow-hidden border border-[var(--surface-border)]">
          <div 
            className={`h-full transition-all duration-500 ${
              metrics.pctOfBudget < 95 ? 'bg-[var(--accent)]' :
              metrics.pctOfBudget <= 105 ? 'bg-[var(--foreground-muted)]' : 'bg-[var(--danger)]'
            }`}
            style={{ width: `${Math.min(metrics.pctOfBudget, 130)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-[var(--foreground-subtle)]">0%</span>
          <span className="text-xs text-[var(--foreground-subtle)]">95%</span>
          <span className="text-xs text-[var(--foreground-subtle)]">105%</span>
          <span className="text-xs text-[var(--foreground-subtle)]">130%</span>
        </div>
      </div>
    </div>
  );
}
