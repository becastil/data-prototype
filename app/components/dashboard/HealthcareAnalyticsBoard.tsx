'use client';

import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/app/components/ui/glass-card';
import { chartPalette, baseAxisStyles, baseChartGrid, baseTooltip } from './chartTheme';

interface Row extends Record<string, unknown> {}

interface HealthcareAnalyticsBoardProps {
  budgetRows: Row[];
  claimsRows: Row[];
}

type AnalyticsTab = 'overview' | 'budget' | 'claims' | 'detail';

type ServiceSummary = {
  name: string;
  value: number;
  medical: number;
  pharmacy: number;
  count: number;
};

const monthFormatter = new Intl.DateTimeFormat('en', { month: 'short' });
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});
const percentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1
});

const NUMERIC_KEYS: Record<string, string[]> = {
  budget: ['Budget', 'Computed Budget', 'budget'],
  medical: ['Medical Claims', 'medical_claims', 'medical', 'Medical'],
  pharmacy: ['Pharmacy Claims', 'pharmacy_claims', 'Pharmacy', 'Rx'],
  admin: ['Admin Fees', 'admin_fees'],
  stopLoss: ['Stop Loss Premium', 'stop_loss_premium'],
  reimburse: ['Stop Loss Reimbursements', 'stop_loss_reimb'],
  rebates: ['Rx Rebates', 'pharmacy_rebates']
};

const CLAIM_NUMERIC_KEYS: Record<string, string[]> = {
  medical: ['Medical', 'medical'],
  pharmacy: ['Rx', 'Pharmacy', 'rx'],
  total: ['Total', 'total']
};

const CLAIM_STRING_KEYS: Record<string, string[]> = {
  serviceType: ['Service Type', 'service_type', 'ServiceType'],
  claimant: ['Claimant Number', 'claimant_number', 'Claimant'],
  term: ["Layman's Term", 'Laymans Term', 'Condition'],
  serviceDate: ['Service Date', 'service_date', 'Date of Service', 'date_of_service']
};

function num(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[$,\s]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getField<T = unknown>(row: Row, keys: string[], fallback: T): T {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') {
      return value as T;
    }
  }
  return fallback;
}

function getNumeric(row: Row, keys: string[]): number {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return num(row[key]);
    }
  }
  return 0;
}

function deriveMonthLabel(row: Row, fallbackIndex: number): string {
  const explicitMonth = getField<string | number>(row, ['month', 'Month', 'period', 'Period'], '');
  if (explicitMonth && typeof explicitMonth === 'string') {
    return explicitMonth;
  }

  const serviceDate = getField<string>(row, CLAIM_STRING_KEYS.serviceDate, '');
  if (serviceDate) {
    const date = new Date(serviceDate);
    if (!Number.isNaN(date.getTime())) {
      return monthFormatter.format(date);
    }
  }

  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][fallbackIndex % 12] ?? `M${fallbackIndex + 1}`;
}

export default function HealthcareAnalyticsBoard({ budgetRows, claimsRows }: HealthcareAnalyticsBoardProps) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [selectedServiceType, setSelectedServiceType] = useState<string | null>(null);

  const months = useMemo(() => {
    const labels = budgetRows.map((row, index) => deriveMonthLabel(row, index));
    return labels.length > 0 ? labels : ['Jan', 'Feb', 'Mar'];
  }, [budgetRows]);

  const budgetTotals = useMemo(() => {
    return budgetRows.reduce(
      (acc, row) => {
        const budget = getNumeric(row, NUMERIC_KEYS.budget);
        const medical = getNumeric(row, NUMERIC_KEYS.medical);
        const pharmacy = getNumeric(row, NUMERIC_KEYS.pharmacy);
        const admin = getNumeric(row, NUMERIC_KEYS.admin);
        const stopLoss = getNumeric(row, NUMERIC_KEYS.stopLoss);
        const reimburse = getNumeric(row, NUMERIC_KEYS.reimburse);
        const rebates = getNumeric(row, NUMERIC_KEYS.rebates);

        acc.budget += budget;
        acc.medical += medical;
        acc.pharmacy += pharmacy;
        acc.admin += admin;
        acc.stopLoss += stopLoss;
        acc.reimburse += reimburse;
        acc.rebates += rebates;

        return acc;
      },
      {
        budget: 0,
        medical: 0,
        pharmacy: 0,
        admin: 0,
        stopLoss: 0,
        reimburse: 0,
        rebates: 0
      }
    );
  }, [budgetRows]);

  const totalPlanCost = useMemo(() => {
    const netPaidClaims = budgetTotals.medical + budgetTotals.pharmacy - budgetTotals.reimburse - budgetTotals.rebates;
    return netPaidClaims + budgetTotals.admin + budgetTotals.stopLoss;
  }, [budgetTotals]);

  const budgetUtilisation = budgetTotals.budget > 0 ? (totalPlanCost / budgetTotals.budget) * 100 : 0;

  const monthlyBudgetSeries = useMemo(() => {
    return {
      months,
      budget: budgetRows.map(row => getNumeric(row, NUMERIC_KEYS.budget)),
      actual: budgetRows.map(row => {
        const medical = getNumeric(row, NUMERIC_KEYS.medical);
        const pharmacy = getNumeric(row, NUMERIC_KEYS.pharmacy);
        const admin = getNumeric(row, NUMERIC_KEYS.admin);
        const stopLoss = getNumeric(row, NUMERIC_KEYS.stopLoss);
        const reimburse = getNumeric(row, NUMERIC_KEYS.reimburse);
        const rebates = getNumeric(row, NUMERIC_KEYS.rebates);
        return medical + pharmacy + admin + stopLoss - reimburse - rebates;
      })
    };
  }, [budgetRows, months]);

  const claimsByService = useMemo(() => {
    const map = new Map<string, ServiceSummary>();

    claimsRows.forEach(row => {
      const serviceType = String(getField(row, CLAIM_STRING_KEYS.serviceType, 'Other') || 'Other');
      const medical = getNumeric(row, CLAIM_NUMERIC_KEYS.medical);
      const pharmacy = getNumeric(row, CLAIM_NUMERIC_KEYS.pharmacy);
      const totalFromRow = getNumeric(row, CLAIM_NUMERIC_KEYS.total);
      const total = totalFromRow || medical + pharmacy;

      const entry = map.get(serviceType) ?? { name: serviceType, value: 0, medical: 0, pharmacy: 0, count: 0 };
      entry.value += total;
      entry.medical += medical;
      entry.pharmacy += pharmacy;
      entry.count += 1;
      map.set(serviceType, entry);
    });

    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [claimsRows]);

  const rxRatio = useMemo(() => {
    const totalMedical = claimsByService.reduce((sum, entry) => sum + entry.medical, 0);
    const totalPharmacy = claimsByService.reduce((sum, entry) => sum + entry.pharmacy, 0);
    const denom = totalMedical + totalPharmacy;
    return denom > 0 ? (totalPharmacy / denom) * 100 : 0;
  }, [claimsByService]);

  const claimsHeatmapData = useMemo(() => {
    if (claimsRows.length === 0) return { months: months.slice(0, 6), services: ['Inpatient', 'Outpatient', 'Emergency', 'Pharmacy'], values: [] };

    const serviceTypes = Array.from(new Set(claimsRows.map(row => String(getField(row, CLAIM_STRING_KEYS.serviceType, 'Other') || 'Other'))));
    const monthOrder = Array.from(new Set(claimsRows.map((row, index) => deriveMonthLabel(row, index))));
    const values: [number, number, number][] = [];

    monthOrder.forEach((monthLabel, xIndex) => {
      serviceTypes.forEach((service, yIndex) => {
        const total = claimsRows.reduce((sum, row, idx) => {
          const rowMonth = deriveMonthLabel(row, idx);
          const rowService = String(getField(row, CLAIM_STRING_KEYS.serviceType, 'Other') || 'Other');
          if (rowMonth === monthLabel && rowService === service) {
            return sum + getNumeric(row, CLAIM_NUMERIC_KEYS.total);
          }
          return sum;
        }, 0);
        values.push([xIndex, yIndex, total]);
      });
    });

    return { months: monthOrder, services: serviceTypes, values };
  }, [claimsRows, months]);

  const topClaims = useMemo(() => {
    return [...claimsRows]
      .map(row => {
        const total = getNumeric(row, CLAIM_NUMERIC_KEYS.total);
        const medical = getNumeric(row, CLAIM_NUMERIC_KEYS.medical);
        const pharmacy = getNumeric(row, CLAIM_NUMERIC_KEYS.pharmacy);
        const serviceType = String(getField(row, CLAIM_STRING_KEYS.serviceType, 'Other') || 'Other');
        const claimant = String(getField(row, CLAIM_STRING_KEYS.claimant, ''));
        const description = String(getField(row, CLAIM_STRING_KEYS.term, serviceType));
        return { total, medical, pharmacy, serviceType, claimant, description };
      })
      .filter(entry => entry.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [claimsRows]);

  const medicalVsPharmacyShare = useMemo(() => {
    const totalMedical = budgetTotals.medical;
    const totalPharmacy = budgetTotals.pharmacy;
    const total = totalMedical + totalPharmacy;
    return total > 0
      ? {
          medical: (totalMedical / total) * 100,
          pharmacy: (totalPharmacy / total) * 100
        }
      : { medical: 0, pharmacy: 0 };
  }, [budgetTotals.medical, budgetTotals.pharmacy]);

  const budgetGaugeOption = useMemo(() => ({
    tooltip: {
      formatter: () => `Budget used: ${percentFormatter.format(budgetUtilisation)}%`,
      backgroundColor: chartPalette.tooltipBg,
      borderWidth: 0,
      textStyle: {
        color: chartPalette.tooltipText,
        fontSize: 12
      },
      padding: [8, 12]
    },
    series: [
      {
        type: 'gauge',
        startAngle: 220,
        endAngle: -40,
        min: 0,
        max: 140,
        splitNumber: 14,
        axisLine: {
          lineStyle: {
            width: 12,
            color: [
              [0.8, chartPalette.positive],
              [0.95, chartPalette.caution],
              [1, chartPalette.negative]
            ]
          }
        },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          distance: 20,
          fontSize: 10,
          color: chartPalette.foregroundMuted,
          formatter: (val: number) => `${val}%`
        },
        detail: {
          valueAnimation: true,
          fontSize: 28,
          color: chartPalette.foreground,
          formatter: (val: number) => `${val.toFixed(1)}%`
        },
        title: {
          fontSize: 12,
          color: chartPalette.foregroundMuted,
          offsetCenter: [0, '65%']
        },
        data: [
          { value: budgetUtilisation, name: 'Budget used' }
        ]
      }
    ]
  }), [budgetUtilisation]);

  const rxGaugeOption = useMemo(() => ({
    tooltip: {
      formatter: () => `Rx share: ${percentFormatter.format(rxRatio)}%`,
      backgroundColor: chartPalette.tooltipBg,
      borderWidth: 0,
      textStyle: {
        color: chartPalette.tooltipText,
        fontSize: 12
      },
      padding: [8, 12]
    },
    series: [
      {
        type: 'gauge',
        startAngle: 220,
        endAngle: -40,
        min: 0,
        max: 100,
        splitNumber: 10,
        axisLine: {
          lineStyle: {
            width: 12,
            color: [
              [0.3, chartPalette.negative],
              [0.6, chartPalette.caution],
              [1, chartPalette.positive]
            ]
          }
        },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          distance: 20,
          fontSize: 10,
          color: chartPalette.foregroundMuted,
          formatter: (val: number) => `${val}%`
        },
        detail: {
          valueAnimation: true,
          fontSize: 28,
          color: chartPalette.foreground,
          formatter: (val: number) => `${val.toFixed(1)}%`
        },
        title: {
          fontSize: 12,
          color: chartPalette.foregroundMuted,
          offsetCenter: [0, '65%']
        },
        data: [
          { value: rxRatio, name: 'Rx share' }
        ]
      }
    ]
  }), [rxRatio]);

  const budgetPerformanceOption = useMemo(() => ({
    color: [chartPalette.accent, chartPalette.neutral],
    grid: baseChartGrid,
    tooltip: {
      ...baseTooltip,
      formatter: (params: any[]) => {
        if (!params?.length) return '';
        const [actual, budget] = params;
        const month = actual?.axisValue ?? budget?.axisValue;
        const actualVal = actual ? currencyFormatter.format(actual.data) : '';
        const budgetVal = budget ? currencyFormatter.format(budget.data) : '';
        return [`<strong>${month}</strong>`, `Actual: ${actualVal}`, `Budget: ${budgetVal}`].join('<br/>');
      }
    },
    legend: {
      show: true,
      top: 0,
      data: ['Actual', 'Budget'],
      textStyle: {
        color: chartPalette.foregroundMuted,
        fontSize: 11
      }
    },
    xAxis: {
      type: 'category',
      data: monthlyBudgetSeries.months,
      ...baseAxisStyles
    },
    yAxis: {
      type: 'value',
      ...baseAxisStyles,
      axisLabel: {
        ...baseAxisStyles.axisLabel,
        formatter: (value: number) => `$${(value / 1000).toFixed(0)}k`
      }
    },
    series: [
      {
        name: 'Actual',
        type: 'bar',
        data: monthlyBudgetSeries.actual,
        barWidth: 18,
        itemStyle: {
          borderRadius: [6, 6, 0, 0]
        }
      },
      {
        name: 'Budget',
        type: 'line',
        data: monthlyBudgetSeries.budget,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: chartPalette.neutral
        },
        itemStyle: { color: chartPalette.neutral }
      }
    ]
  }), [monthlyBudgetSeries.actual, monthlyBudgetSeries.budget, monthlyBudgetSeries.months]);

  const heatmapOption = useMemo(() => ({
    tooltip: {
      position: 'top',
      backgroundColor: chartPalette.tooltipBg,
      borderWidth: 0,
      textStyle: {
        color: chartPalette.tooltipText,
        fontSize: 12
      },
      formatter: (params: any) => `${claimsHeatmapData.services[params.data[1]]}<br/>${claimsHeatmapData.months[params.data[0]]}: ${currencyFormatter.format(params.data[2])}`
    },
    grid: {
      top: 40,
      left: 60,
      right: 20,
      bottom: 20
    },
    xAxis: {
      type: 'category',
      data: claimsHeatmapData.months,
      splitArea: { show: true }
    },
    yAxis: {
      type: 'category',
      data: claimsHeatmapData.services,
      splitArea: { show: true }
    },
    visualMap: {
      min: 0,
      max: Math.max(...claimsHeatmapData.values.map(item => item[2] || 0), 1),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: {
        color: ['#eff6ff', '#bfdbfe', '#60a5fa', '#1d4ed8']
      }
    },
    series: [
      {
        name: 'Claims',
        type: 'heatmap',
        data: claimsHeatmapData.values,
        label: { show: false }
      }
    ]
  }), [claimsHeatmapData]);

  const sankeyOption = useMemo(() => {
    const nodes = [
      { name: 'Total Budget' },
      { name: 'Medical Claims' },
      { name: 'Pharmacy Claims' },
      { name: 'Administration' },
      { name: 'Stop Loss' },
      { name: 'Net Paid Claims' },
      { name: 'Plan Cost' }
    ];

    const netPaid = budgetTotals.medical + budgetTotals.pharmacy - budgetTotals.reimburse - budgetTotals.rebates;
    const links = [
      { source: 'Total Budget', target: 'Medical Claims', value: budgetTotals.medical },
      { source: 'Total Budget', target: 'Pharmacy Claims', value: budgetTotals.pharmacy },
      { source: 'Total Budget', target: 'Administration', value: budgetTotals.admin },
      { source: 'Total Budget', target: 'Stop Loss', value: budgetTotals.stopLoss },
      { source: 'Medical Claims', target: 'Net Paid Claims', value: budgetTotals.medical - budgetTotals.reimburse / 2 },
      { source: 'Pharmacy Claims', target: 'Net Paid Claims', value: budgetTotals.pharmacy - budgetTotals.rebates / 2 },
      { source: 'Net Paid Claims', target: 'Plan Cost', value: netPaid },
      { source: 'Administration', target: 'Plan Cost', value: budgetTotals.admin },
      { source: 'Stop Loss', target: 'Plan Cost', value: budgetTotals.stopLoss }
    ];

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: chartPalette.tooltipBg,
        borderWidth: 0,
        textStyle: {
          color: chartPalette.tooltipText,
          fontSize: 12
        }
      },
      series: [
        {
          type: 'sankey',
          layout: 'none',
          emphasis: { focus: 'adjacency' },
          lineStyle: { color: 'source', curveness: 0.4 },
          data: nodes,
          links
        }
      ]
    };
  }, [budgetTotals.admin, budgetTotals.medical, budgetTotals.pharmacy, budgetTotals.rebates, budgetTotals.reimburse, budgetTotals.stopLoss]);

  const claimsDistributionOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      backgroundColor: chartPalette.tooltipBg,
      borderWidth: 0,
      textStyle: {
        color: chartPalette.tooltipText,
        fontSize: 12
      },
      formatter: (params: any) => {
        const data = params.data as ServiceSummary;
        return `<strong>${data.name}</strong><br/>Total: ${currencyFormatter.format(data.value)}<br/>Medical: ${currencyFormatter.format(data.medical)}<br/>Pharmacy: ${currencyFormatter.format(data.pharmacy)}<br/>Claims: ${data.count}`;
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: chartPalette.foregroundMuted
      }
    },
    series: [
      {
        name: 'Service type',
        type: 'pie',
        radius: ['40%', '70%'],
        label: {
          position: 'outside',
          formatter: '{b}: {d}%'
        },
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        data: claimsByService
      }
    ]
  }), [claimsByService]);

  const topClaimsOption = useMemo(() => ({
    color: [chartPalette.accent, chartPalette.medical],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: chartPalette.tooltipBg,
      borderWidth: 0,
      textStyle: {
        color: chartPalette.tooltipText,
        fontSize: 12
      }
    },
    grid: {
      left: 80,
      right: 20,
      top: 20,
      bottom: 20
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `$${(value / 1000).toFixed(0)}k`
      }
    },
    yAxis: {
      type: 'category',
      data: topClaims.map(entry => `#${entry.claimant || '—'} · ${entry.description}`)
    },
    series: [
      {
        name: 'Medical',
        type: 'bar',
        stack: 'total',
        data: topClaims.map(entry => entry.medical),
        label: { show: false }
      },
      {
        name: 'Pharmacy',
        type: 'bar',
        stack: 'total',
        data: topClaims.map(entry => entry.pharmacy),
        label: { show: false }
      }
    ]
  }), [topClaims]);

  const claimsDetail = useMemo(() => (
    claimsRows
      .filter(row => {
        if (!selectedServiceType) return true;
        const service = String(getField(row, CLAIM_STRING_KEYS.serviceType, 'Other') || 'Other');
        return service === selectedServiceType;
      })
      .map(row => {
        const claimant = String(getField(row, CLAIM_STRING_KEYS.claimant, '—') || '—');
        const condition = String(getField(row, CLAIM_STRING_KEYS.term, '—') || '—');
        const medical = getNumeric(row, CLAIM_NUMERIC_KEYS.medical);
        const pharmacy = getNumeric(row, CLAIM_NUMERIC_KEYS.pharmacy);
        const total = getNumeric(row, CLAIM_NUMERIC_KEYS.total) || medical + pharmacy;
        return { claimant, condition, medical, pharmacy, total };
      })
      .sort((a, b) => b.total - a.total)
  ), [claimsRows, selectedServiceType]);

  const noBudgetData = budgetRows.length === 0;
  const noClaimsData = claimsRows.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full border border-[var(--surface-border)] bg-[var(--surface)] px-1 py-1 text-xs font-medium text-[var(--foreground-muted)]">
          {(['overview', 'budget', 'claims'] as AnalyticsTab[]).map(tab => (
            <motion.button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                if (tab !== 'detail') setSelectedServiceType(null);
              }}
              className={`relative rounded-full px-3 py-1 transition-colors ${activeTab === tab ? 'text-[var(--accent)]' : ''}`}
              whileHover={{ scale: activeTab === tab ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {activeTab === tab && (
                <motion.span
                  layoutId="analytics-tab"
                  className="absolute inset-0 rounded-full bg-[var(--accent-soft)]"
                  transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                />
              )}
              <span className="relative z-10 capitalize">{tab}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <GlassCard variant="elevated" className="p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--foreground-subtle)]">Total budget</p>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{currencyFormatter.format(budgetTotals.budget)}</p>
            </GlassCard>
            <GlassCard variant="elevated" className="p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--foreground-subtle)]">Plan cost</p>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{currencyFormatter.format(totalPlanCost)}</p>
            </GlassCard>
            <GlassCard variant="elevated" className="p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--foreground-subtle)]">Medical claims</p>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{currencyFormatter.format(budgetTotals.medical)}</p>
            </GlassCard>
            <GlassCard variant="elevated" className="p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--foreground-subtle)]">Pharmacy claims</p>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{currencyFormatter.format(budgetTotals.pharmacy)}</p>
            </GlassCard>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <GlassCard variant="elevated" className="p-5">
              <h4 className="mb-3 text-sm font-semibold text-[var(--foreground-muted)]">Budget utilisation</h4>
              {noBudgetData ? (
                <p className="text-sm text-[var(--foreground-subtle)]">Upload budget data to see utilisation.</p>
              ) : (
                <ReactECharts option={budgetGaugeOption} style={{ width: '100%', height: 220 }} notMerge lazyUpdate />
              )}
            </GlassCard>
            <GlassCard variant="elevated" className="p-5">
              <h4 className="mb-3 text-sm font-semibold text-[var(--foreground-muted)]">Rx share of claims</h4>
              {noClaimsData ? (
                <p className="text-sm text-[var(--foreground-subtle)]">Upload claims data to view pharmacy share.</p>
              ) : (
                <ReactECharts option={rxGaugeOption} style={{ width: '100%', height: 220 }} notMerge lazyUpdate />
              )}
            </GlassCard>
          </div>

          <GlassCard variant="elevated" className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[var(--foreground-muted)]">Actual vs budget</h4>
              <span className="text-xs text-[var(--foreground-subtle)]">Bar = actual · Line = budget</span>
            </div>
            {noBudgetData ? (
              <p className="text-sm text-[var(--foreground-subtle)]">Budget data required to render this chart.</p>
            ) : (
              <ReactECharts option={budgetPerformanceOption} style={{ width: '100%', height: 280 }} notMerge lazyUpdate />
            )}
          </GlassCard>

          <GlassCard variant="elevated" className="p-5">
            <h4 className="mb-3 text-sm font-semibold text-[var(--foreground-muted)]">Claims heatmap</h4>
            {noClaimsData ? (
              <p className="text-sm text-[var(--foreground-subtle)]">Upload claims data to analyse intensity by service type.</p>
            ) : (
              <ReactECharts option={heatmapOption} style={{ width: '100%', height: 320 }} notMerge lazyUpdate />
            )}
          </GlassCard>
        </div>
      )}

      {activeTab === 'budget' && (
        <div className="space-y-5">
          <GlassCard variant="elevated" className="p-5">
            <h4 className="mb-3 text-sm font-semibold text-[var(--foreground-muted)]">Budget flow</h4>
            {noBudgetData ? (
              <p className="text-sm text-[var(--foreground-subtle)]">Budget data required for budget flow analysis.</p>
            ) : (
              <ReactECharts option={sankeyOption} style={{ width: '100%', height: 320 }} notMerge lazyUpdate />
            )}
          </GlassCard>

          <GlassCard variant="elevated" className="p-5">
            <h4 className="mb-3 text-sm font-semibold text-[var(--foreground-muted)]">Medical vs pharmacy share</h4>
            {noBudgetData ? (
              <p className="text-sm text-[var(--foreground-subtle)]">Upload budget data to view distribution.</p>
            ) : (
              <div className="space-y-4">
                <ReactECharts option={{
                  tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    backgroundColor: chartPalette.tooltipBg,
                    borderWidth: 0,
                    textStyle: { color: chartPalette.tooltipText }
                  },
                  grid: { left: 0, right: 0, top: 10, bottom: 0 },
                  xAxis: { show: false, max: 100 },
                  yAxis: { type: 'category', show: false, data: ['Share'] },
                  series: [
                    {
                      name: 'Medical',
                      type: 'bar',
                      stack: 'share',
                      data: [medicalVsPharmacyShare.medical],
                      itemStyle: { color: chartPalette.medical, borderRadius: [12, 0, 0, 12] },
                      label: { show: true, position: 'insideLeft', formatter: `${medicalVsPharmacyShare.medical.toFixed(0)}%`, color: '#fff', fontWeight: 600 }
                    },
                    {
                      name: 'Pharmacy',
                      type: 'bar',
                      stack: 'share',
                      data: [medicalVsPharmacyShare.pharmacy],
                      itemStyle: { color: chartPalette.pharmacy, borderRadius: [0, 12, 12, 0] },
                      label: { show: true, position: 'insideRight', formatter: `${medicalVsPharmacyShare.pharmacy.toFixed(0)}%`, color: '#fff', fontWeight: 600 }
                    }
                  ]
                }} style={{ width: '100%', height: 120 }} notMerge lazyUpdate />
                <div className="flex items-center justify-between text-xs text-[var(--foreground-subtle)]">
                  <span>Medical claims</span>
                  <span>Pharmacy claims</span>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {activeTab === 'claims' && (
        <div className="space-y-5">
          <GlassCard variant="elevated" className="p-5">
            <h4 className="mb-3 text-sm font-semibold text-[var(--foreground-muted)]">Service-type distribution</h4>
            {noClaimsData ? (
              <p className="text-sm text-[var(--foreground-subtle)]">Upload claims data to see distribution.</p>
            ) : (
              <ReactECharts
                option={claimsDistributionOption}
                style={{ width: '100%', height: 320 }}
                notMerge
                lazyUpdate
                onEvents={{
                  click: (params: any) => {
                    setSelectedServiceType(params.data?.name ?? null);
                    setActiveTab('detail');
                  }
                }}
              />
            )}
          </GlassCard>

          <GlassCard variant="elevated" className="p-5">
            <h4 className="mb-3 text-sm font-semibold text-[var(--foreground-muted)]">Top claims</h4>
            {noClaimsData ? (
              <p className="text-sm text-[var(--foreground-subtle)]">Upload claims data to analyse claimants.</p>
            ) : (
              <ReactECharts option={topClaimsOption} style={{ width: '100%', height: 360 }} notMerge lazyUpdate />
            )}
          </GlassCard>
        </div>
      )}

      {activeTab === 'detail' && selectedServiceType && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-[var(--foreground)]">Claims detail · {selectedServiceType}</h4>
            <button
              type="button"
              onClick={() => setActiveTab('claims')}
              className="rounded-full border border-[var(--surface-border)] px-3 py-1 text-xs font-medium text-[var(--accent)] hover:bg-[var(--surface-muted)]"
            >
              Back to claims overview
            </button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[var(--surface-border)]">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--surface-muted)] text-[var(--foreground-muted)]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Claimant</th>
                  <th className="px-4 py-3 text-left font-semibold">Condition</th>
                  <th className="px-4 py-3 text-right font-semibold">Medical</th>
                  <th className="px-4 py-3 text-right font-semibold">Pharmacy</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {claimsDetail.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-[var(--foreground-subtle)]">No claims found for this service type.</td>
                  </tr>
                ) : (
                  claimsDetail.map((row, index) => (
                    <tr key={`${row.claimant}-${index}`} className="border-t border-[var(--surface-border)]">
                      <td className="px-4 py-2 text-[var(--foreground)]">{row.claimant}</td>
                      <td className="px-4 py-2 text-[var(--foreground-muted)]">{row.condition}</td>
                      <td className="px-4 py-2 text-right text-[var(--foreground)]">{currencyFormatter.format(row.medical)}</td>
                      <td className="px-4 py-2 text-right text-[var(--foreground)]">{currencyFormatter.format(row.pharmacy)}</td>
                      <td className="px-4 py-2 text-right font-semibold text-[var(--foreground)]">{currencyFormatter.format(row.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
