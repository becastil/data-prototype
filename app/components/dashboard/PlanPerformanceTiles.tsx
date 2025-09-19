'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clipboard, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { GlassCard } from '@/app/components/ui/glass-card';
import { Textarea } from '@/app/components/ui/textarea';
import { secureHealthcareStorage } from '@/app/lib/SecureHealthcareStorage';
import PerformanceIndicator from './PerformanceIndicator';
import { chartPalette, baseAxisStyles, baseChartGrid, baseTooltip } from './chartTheme';

interface Row extends Record<string, unknown> {}

interface PlanPerformanceTilesProps {
  data: Row[];
  commentaryTitle?: string;
}

interface Metrics {
  budget: number;
  medical: number;
  pharmacy: number;
  admin: number;
  stopLossFees: number;
  reimburse: number;
  rebates: number;
  netPaidClaims: number;
  netPaidPEPM: number;
  totalPlanCost: number;
  planCostPEPM: number;
  surplus: number;
  pctOfBudget: number;
  members: number;
  employees: number;
}

interface MonthlySeries {
  months: string[];
  budget: number[];
  actual: number[];
  paidClaims: number[];
}

const timeframeOptions = [
  { key: '6M', label: '6M', months: 6 },
  { key: '12M', label: '12M', months: 12 }
] as const;

const viewOptions = [
  { key: 'planCost', label: 'Plan cost' },
  { key: 'paidClaims', label: 'Paid claims' }
] as const;

type TimeframeKey = typeof timeframeOptions[number]['key'];
type ViewKey = typeof viewOptions[number]['key'];

function num(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value == null) return 0;
  const parsed = parseFloat(String(value).replace(/[$,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat('en-US');

function formatCurrency(value: number) {
  return currencyFormatter.format(Math.round(value));
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function computeMetrics(rows: Row[]): Metrics {
  return rows.reduce<Metrics>((acc, row) => {
    const budget = num(row['Budget'] ?? row['Computed Budget']);
    const medical = num(row['Medical Claims'] ?? row['medical_claims'] ?? row['Medical']);
    const pharmacy = num(row['Pharmacy Claims'] ?? row['pharmacy_claims'] ?? row['Rx']);
    const admin = num(row['Admin Fees'] ?? row['admin_fees']);
    const stopLossFees = num(row['Stop Loss Premium'] ?? row['stop_loss_premium']);
    const reimburse = num(row['Stop Loss Reimbursements'] ?? row['stop_loss_reimb']);
    const rebates = num(row['Rx Rebates'] ?? row['pharmacy_rebates']);
    const members = num(row['Member Count'] ?? row['Enrollment'] ?? row['members']);
    const employees = num(row['Employee Count'] ?? row['employees']);

    acc.budget += budget;
    acc.medical += medical;
    acc.pharmacy += pharmacy;
    acc.admin += admin;
    acc.stopLossFees += stopLossFees;
    acc.reimburse += reimburse;
    acc.rebates += rebates;
    acc.members += members;
    acc.employees += employees;

    return acc;
  }, {
    budget: 0,
    medical: 0,
    pharmacy: 0,
    admin: 0,
    stopLossFees: 0,
    reimburse: 0,
    rebates: 0,
    netPaidClaims: 0,
    netPaidPEPM: 0,
    totalPlanCost: 0,
    planCostPEPM: 0,
    surplus: 0,
    pctOfBudget: 0,
    members: 0,
    employees: 0
  });
}

function enrichMetrics(rows: Row[], metrics: Metrics): Metrics {
  const netPaidClaims = metrics.medical + metrics.pharmacy - metrics.reimburse - metrics.rebates;
  const totalPlanCost = netPaidClaims + metrics.admin + metrics.stopLossFees;
  const surplus = metrics.budget - totalPlanCost;
  const pctOfBudget = metrics.budget > 0 ? (totalPlanCost / metrics.budget) * 100 : 0;
  const denominator = metrics.members || metrics.employees || rows.length || 1;

  return {
    ...metrics,
    reimburse: metrics.reimburse,
    netPaidClaims,
    netPaidPEPM: denominator ? netPaidClaims / denominator : 0,
    totalPlanCost,
    planCostPEPM: denominator ? totalPlanCost / denominator : 0,
    surplus,
    pctOfBudget,
  };
}

function computeMonthlySeries(rows: Row[]): MonthlySeries {
  const months = rows.map(row => String(row.month ?? row.Month ?? row.period ?? row.Period ?? ''));
  const budget = rows.map(row => num(row['Budget'] ?? row['Computed Budget']));

  const actual = rows.map(row => {
    const medical = num(row['Medical Claims'] ?? row['medical_claims'] ?? row['Medical']);
    const pharmacy = num(row['Pharmacy Claims'] ?? row['pharmacy_claims'] ?? row['Rx']);
    const admin = num(row['Admin Fees'] ?? row['admin_fees']);
    const stopLossFees = num(row['Stop Loss Premium'] ?? row['stop_loss_premium']);
    const reimburse = num(row['Stop Loss Reimbursements'] ?? row['stop_loss_reimb']);
    const rebates = num(row['Rx Rebates'] ?? row['pharmacy_rebates']);
    return medical + pharmacy + admin + stopLossFees - reimburse - rebates;
  });

  const paidClaims = rows.map(row => {
    const medical = num(row['Medical Claims'] ?? row['medical_claims'] ?? row['Medical']);
    const pharmacy = num(row['Pharmacy Claims'] ?? row['pharmacy_claims'] ?? row['Rx']);
    return medical + pharmacy;
  });

  return { months, budget, actual, paidClaims };
}

function getTimeframeSlice(data: Row[], months: number): Row[] {
  return data.slice(-months);
}

export default function PlanPerformanceTiles({ data, commentaryTitle = 'Commentary' }: PlanPerformanceTilesProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeKey>('12M');
  const [viewMode, setViewMode] = useState<ViewKey>('planCost');
  const [commentary, setCommentary] = useState('');
  const [commentaryOpen, setCommentaryOpen] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const timeframeMap = useMemo(() => {
    const map = new Map<TimeframeKey, { rows: Row[]; metrics: Metrics; series: MonthlySeries }>();
    timeframeOptions.forEach(option => {
      const slice = getTimeframeSlice(data, option.months);
      const metrics = enrichMetrics(slice, computeMetrics(slice));
      const series = computeMonthlySeries(slice);
      map.set(option.key, { rows: slice, metrics, series });
    });
    return map;
  }, [data]);

  const current = timeframeMap.get(selectedTimeframe) ?? timeframeMap.get('12M');
  const currentMetrics = current?.metrics ?? enrichMetrics(data, computeMetrics(data));
  const currentSeries = current?.series ?? computeMonthlySeries(data);

  const gaugeTimeframes = useMemo(() => timeframeOptions.map(option => {
    const timeframe = timeframeMap.get(option.key);
    const value = timeframe ? timeframe.metrics.pctOfBudget : 0;
    return { key: option.key, label: option.label, value: parseFloat(value.toFixed(1)) };
  }), [timeframeMap]);

  useEffect(() => {
    try {
      const stored = secureHealthcareStorage.retrieve<{ text: string }>('planCommentary');
      if (stored?.text) {
        setCommentary(stored.text);
      } else {
        const baselineValue = gaugeTimeframes.find(tf => tf.key === '12M')?.value ?? 0;
        setCommentary(`${commentaryTitle} is running at ${baselineValue.toFixed(1)}% of budget over the rolling period.\n\nHighlight notable claim activity or utilisation changes here.`);
      }
    } catch {
      setCommentary(`${commentaryTitle} insights will appear here.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!commentary) return;
    const timeout = setTimeout(async () => {
      try {
        setSaveState('saving');
        await secureHealthcareStorage.storeTemporary('planCommentary', { text: commentary, savedAt: new Date().toISOString() }, { ttlMs: 7 * 24 * 60 * 60 * 1000 });
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 1200);
      } catch {
        setSaveState('error');
        setTimeout(() => setSaveState('idle'), 2000);
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [commentary]);

  const actualSeries = viewMode === 'planCost' ? currentSeries.actual : currentSeries.paidClaims;
  const chartTitle = viewMode === 'planCost' ? 'Net plan cost' : 'Paid claims';

  const monthLegend = currentSeries.months.length > 0 ? `Last ${currentSeries.months.length} months` : '';

  const rollingChartOption = useMemo(() => ({
    color: [chartPalette.accent, '#cbd5f5'],
    grid: baseChartGrid,
    tooltip: {
      ...baseTooltip,
      formatter: (params: any[]) => {
        if (!params?.length) return '';
        const [actual, budget] = params;
        const month = actual?.axisValue ?? budget?.axisValue;
        const actualValue = actual ? formatCurrency(actual.data) : '';
        const budgetValue = budget ? formatCurrency(budget.data) : '';
        return [
          `<strong>${month}</strong>`,
          `${chartTitle}: ${actualValue}`,
          `Budget: ${budgetValue}`
        ].join('<br/>');
      }
    },
    legend: {
      show: true,
      top: 0,
      right: 0,
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        color: chartPalette.foregroundMuted,
        fontSize: 11
      },
      data: [chartTitle, 'Budget']
    },
    xAxis: {
      type: 'category',
      data: currentSeries.months,
      ...baseAxisStyles,
      axisLabel: {
        ...baseAxisStyles.axisLabel,
        rotate: 0,
        margin: 12
      }
    },
    yAxis: {
      type: 'value',
      ...baseAxisStyles,
      splitLine: { show: false },
      axisLabel: {
        ...baseAxisStyles.axisLabel,
        formatter: (value: number) => `$${(value / 1000).toFixed(0)}k`
      }
    },
    series: [
      {
        name: chartTitle,
        type: 'bar',
        barWidth: 18,
        data: actualSeries,
        itemStyle: {
          borderRadius: [6, 6, 0, 0]
        }
      },
      {
        name: 'Budget',
        type: 'line',
        data: currentSeries.budget,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: '#aebdff'
        },
        itemStyle: {
          color: '#aebdff'
        }
      }
    ]
  }), [actualSeries, chartTitle, currentSeries.budget, currentSeries.months]);

  const share = useMemo(() => {
    const totalClaims = currentMetrics.medical + currentMetrics.pharmacy;
    if (totalClaims === 0) {
      return { medical: 0, pharmacy: 0 };
    }
    return {
      medical: (currentMetrics.medical / totalClaims) * 100,
      pharmacy: (currentMetrics.pharmacy / totalClaims) * 100
    };
  }, [currentMetrics.medical, currentMetrics.pharmacy]);

  const shareOption = useMemo(() => ({
    grid: { left: 0, right: 0, top: 10, bottom: 10 },
    xAxis: {
      type: 'value',
      show: false,
      max: 100
    },
    yAxis: {
      type: 'category',
      show: false,
      data: ['Distribution']
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => `${params.seriesName}: ${params.value.toFixed(1)}%`,
      backgroundColor: chartPalette.tooltipBg,
      borderWidth: 0,
      textStyle: {
        color: chartPalette.tooltipText,
        fontSize: 12
      },
      padding: [6, 10]
    },
    series: [
      {
        name: 'Medical',
        type: 'bar',
        stack: 'share',
        data: [share.medical],
        itemStyle: {
          color: chartPalette.medical,
          borderRadius: [12, 0, 0, 12]
        },
        label: {
          show: true,
          formatter: `${share.medical.toFixed(0)}%`,
          color: '#fff',
          position: 'insideLeft',
          fontWeight: 600
        }
      },
      {
        name: 'Pharmacy',
        type: 'bar',
        stack: 'share',
        data: [share.pharmacy],
        itemStyle: {
          color: chartPalette.pharmacy,
          borderRadius: [0, 12, 12, 0]
        },
        label: {
          show: true,
          formatter: `${share.pharmacy.toFixed(0)}%`,
          color: '#fff',
          position: 'insideRight',
          fontWeight: 600
        }
      }
    ]
  }), [share.medical, share.pharmacy]);

  const summaryBlocks = useMemo(() => ([
    {
      label: 'Total budget',
      value: formatCurrency(currentMetrics.budget),
      helper: monthLegend
    },
    {
      label: 'Net plan cost',
      value: formatCurrency(currentMetrics.totalPlanCost)
    },
    {
      label: 'Surplus / deficit',
      value: formatCurrency(currentMetrics.surplus),
      accent: currentMetrics.surplus >= 0 ? 'text-emerald-600' : 'text-rose-600'
    },
    {
      label: 'Net paid claims',
      value: formatCurrency(currentMetrics.netPaidClaims)
    },
    {
      label: 'Admin & stop-loss',
      value: formatCurrency(currentMetrics.admin + currentMetrics.stopLossFees)
    },
    {
      label: 'Members covered',
      value: numberFormatter.format(currentMetrics.members || currentMetrics.employees)
    }
  ]), [currentMetrics, monthLegend]);

  const copyCommentary = async () => {
    try {
      await navigator.clipboard.writeText(commentary);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1200);
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 1500);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <PerformanceIndicator
        title="Plan performance"
        timeframes={gaugeTimeframes}
        selectedTimeframe={selectedTimeframe}
        onTimeframeChange={key => setSelectedTimeframe(key as TimeframeKey)}
      />

      <GlassCard variant="elevated" className="lg:col-span-2 flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[var(--foreground)]">Rolling {selectedTimeframe === '6M' ? '6' : '12'} month trend</h3>
            <p className="text-xs text-[var(--foreground-subtle)]">{chartTitle} compared with budgeted premium</p>
          </div>
          <div className="flex items-center gap-2"
          >
            <div className="flex rounded-full border border-[var(--surface-border)] bg-[var(--surface)] px-1 py-1 text-xs font-medium text-[var(--foreground-muted)]">
              {viewOptions.map(option => {
                const active = option.key === viewMode;
                return (
                  <motion.button
                    key={option.key}
                    type="button"
                    onClick={() => setViewMode(option.key)}
                    className={`relative rounded-full px-2.5 py-1 transition-colors ${active ? 'text-[var(--accent)]' : ''}`}
                    whileHover={{ scale: active ? 1 : 1.05 }}
                    whileTap={{ scale: 0.94 }}
                  >
                    {active && (
                      <motion.span
                        layoutId="view-toggle"
                        className="absolute inset-0 rounded-full bg-[var(--accent-soft)]"
                        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{option.label}</span>
                  </motion.button>
                );
              })}
            </div>
            <div className="flex rounded-full border border-[var(--surface-border)] bg-[var(--surface)] px-1 py-1 text-xs font-medium text-[var(--foreground-muted)]">
              {timeframeOptions.map(option => {
                const active = option.key === selectedTimeframe;
                return (
                  <motion.button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedTimeframe(option.key)}
                    className={`relative rounded-full px-2.5 py-1 transition-colors ${active ? 'text-[var(--accent)]' : ''}`}
                    whileHover={{ scale: active ? 1 : 1.05 }}
                    whileTap={{ scale: 0.94 }}
                  >
                    {active && (
                      <motion.span
                        layoutId="timeframe-toggle"
                        className="absolute inset-0 rounded-full bg-[var(--accent-soft)]"
                        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{option.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
        <ReactECharts option={rollingChartOption} style={{ width: '100%', height: 280 }} notMerge lazyUpdate />
        <details className="rounded-xl bg-[var(--surface-muted)]/60 p-3 text-xs text-[var(--foreground-muted)]">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-[var(--foreground)]">
            <Filter className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden />
            Insights
          </summary>
          <p className="mt-2 leading-relaxed">
            {`Plan cost is tracking at ${currentMetrics.pctOfBudget.toFixed(1)}% of budget across the selected period. Switch between metrics or timeframes to surface utilisation swings and seasonality.`}
          </p>
        </details>
      </GlassCard>

      <GlassCard variant="elevated" className="p-5">
        <h3 className="text-base font-semibold text-[var(--foreground)] mb-3">Rolling summary</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {summaryBlocks.map(block => (
            <div key={block.label} className="rounded-xl bg-[var(--surface-muted)]/70 p-3">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--foreground-subtle)]">{block.label}</p>
              <p className={`mt-2 text-lg font-semibold text-right text-[var(--foreground)] ${block.accent ?? ''}`}>{block.value}</p>
              {block.helper ? <p className="text-[10px] text-[var(--foreground-subtle)]">{block.helper}</p> : null}
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard variant="elevated" className="p-5">
        <h3 className="text-base font-semibold text-[var(--foreground)] mb-3">Medical vs pharmacy share</h3>
        <ReactECharts option={shareOption} style={{ width: '100%', height: 120 }} notMerge lazyUpdate />
        <div className="mt-3 flex items-center justify-between text-xs text-[var(--foreground-muted)]">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartPalette.medical }} />
            <span>Medical</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartPalette.pharmacy }} />
            <span>Pharmacy</span>
          </div>
        </div>
      </GlassCard>

      <GlassCard variant="elevated" className="p-5 lg:col-span-3">
        <button
          type="button"
          onClick={() => setCommentaryOpen(prev => !prev)}
          className="flex w-full items-center justify-between rounded-xl bg-[var(--surface-muted)]/70 px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
        >
          <span>{commentaryTitle}</span>
          {commentaryOpen ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
        </button>
        <AnimatePresence initial={false}>
          {commentaryOpen ? (
            <motion.div
              key="commentary-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3">
                <Textarea
                  value={commentary}
                  onChange={event => setCommentary(event.target.value)}
                  className="min-h-[160px] resize-vertical border border-[var(--surface-border)] bg-[var(--surface)] text-sm text-[var(--foreground)]"
                  placeholder="Summarise the rolling results in plain language"
                />
                <div className="flex items-center justify-between text-xs text-[var(--foreground-subtle)]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyCommentary}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--surface-border)] bg-[var(--surface)] text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                      title="Copy to clipboard"
                    >
                      <Clipboard className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <span>{saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Unable to save' : 'Auto-saves'}</span>
                  </div>
                  <span className="text-[var(--foreground-subtle)]">Use natural language. Avoid repeating figures already shown above.</span>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}
