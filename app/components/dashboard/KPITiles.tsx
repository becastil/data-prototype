'use client';

import React from 'react';
import { ModernMetric, type MetricAccent } from '@components/index';
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
function getBudgetStatus(
  pct: number
): { accent: MetricAccent; icon: React.ReactNode; status: string } {
  if (pct < 95) {
    return {
      accent: 'accent',
      status: 'Under budget',
      icon: <TrendingDown className="h-4 w-4 text-[var(--accent)]" />,
    };
  }

  if (pct <= 105) {
    return {
      accent: 'neutral',
      status: 'Near budget',
      icon: <Activity className="h-4 w-4 text-[var(--foreground-muted)]" />,
    };
  }

  return {
    accent: 'danger',
    status: 'Over budget',
    icon: <TrendingUp className="h-4 w-4 text-[var(--danger)]" />,
  };
}

const accentTextClass: Record<MetricAccent, string> = {
  accent: 'text-[var(--accent)]',
  info: 'text-[var(--info)]',
  warning: 'text-[var(--warning)]',
  danger: 'text-[var(--danger)]',
  neutral: 'text-[var(--foreground-muted)]',
};

export default function KPITiles({ metrics, period = "Rolling 12 Months" }: KPITilesProps) {
  const budgetStatus = getBudgetStatus(metrics.pctOfBudget);
  const isSurplus = metrics.surplus >= 0;

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <ModernMetric
          label="% of budget"
          value={formatPercent(metrics.pctOfBudget)}
          secondary={budgetStatus.status}
          icon={budgetStatus.icon}
          accent={budgetStatus.accent}
          helper="Rolling 12-month actual vs budget"
          tone="translucent"
          padding="sm"
        />

        <ModernMetric
          label="Total budget"
          value={formatCurrency(metrics.totalBudget)}
          secondary="Rolling 12 months"
          icon={<Target className="h-4 w-4 text-[var(--accent)]" />}
          accent="info"
          tone="translucent"
          padding="sm"
        />

        <ModernMetric
          label="Plan cost"
          value={formatCurrency(metrics.totalPlanCost)}
          secondary="Actual spend"
          icon={<DollarSign className="h-4 w-4 text-[var(--accent)]" />}
          accent="accent"
          tone="translucent"
          padding="sm"
        />

        <ModernMetric
          label="Surplus / deficit"
          value={formatCurrency(Math.abs(metrics.surplus))}
          secondary={isSurplus ? 'Surplus' : 'Deficit'}
          icon={isSurplus ? (
            <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
          ) : (
            <TrendingDown className="h-4 w-4 text-[var(--danger)]" />
          )}
          accent={isSurplus ? 'accent' : 'danger'}
          trend={{
            value: isSurplus ? 'Positive variance vs. budget' : 'Over budget',
            direction: isSurplus ? 'up' : 'down',
          }}
          tone="translucent"
          padding="sm"
        />

        <ModernMetric
          label="Cost PEPM"
          value={formatCurrency(metrics.planCostPEPM, 2)}
          secondary="Per member"
          icon={<Users className="h-4 w-4 text-[var(--info)]" />}
          accent="info"
          tone="translucent"
          padding="sm"
        />

        <ModernMetric
          label="Members"
          value={formatNumber(metrics.members)}
          secondary="Total enrolled"
          icon={<Users className="h-4 w-4 text-[var(--foreground-muted)]" />}
          accent="neutral"
          tone="translucent"
          padding="sm"
        />
      </div>

      {/* Optional: Budget Status Bar */}
      <div className="mt-4 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--foreground-muted)]">Budget Utilization</span>
          <span className={`text-sm font-bold ${accentTextClass[budgetStatus.accent]}`}>
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
