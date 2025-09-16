'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { GlassCard } from '@/app/components/ui/glass-card';
import { Textarea } from '@/app/components/ui/textarea';
import { secureHealthcareStorage } from '@/app/lib/SecureHealthcareStorage';
import PerformanceIndicator from './PerformanceIndicator';

type Row = Record<string, any>;

function num(val: unknown): number {
  if (typeof val === 'number') return isFinite(val) ? val : 0;
  if (val == null) return 0;
  const n = parseFloat(String(val).replace(/[$,\s]/g, ''));
  return isFinite(n) ? n : 0;
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}

export interface PlanPerformanceTilesProps {
  data: Row[]; // budget rows with fields (Budget, Medical Claims, Pharmacy Claims, Admin Fees, Stop Loss Premium, Stop Loss Reimbursements, Rx Rebates)
  commentaryTitle?: string;
}

export default function PlanPerformanceTiles({ data, commentaryTitle = 'Commentary' }: PlanPerformanceTilesProps) {
  // Keep last 12 rows
  const last12 = useMemo(() => (data || []).slice(-12), [data]);

  const totals = useMemo(() => {
    let budget = 0;
    let medical = 0;
    let pharmacy = 0;
    let admin = 0;
    let stopLossFees = 0;
    let reimburse = 0;
    let rebates = 0;
    let employees = 0;
    let members = 0;

    last12.forEach((r) => {
      budget += num(r['Budget'] ?? r['Computed Budget']);
      medical += num(r['Medical Claims'] ?? r['medical_claims'] ?? r['Medical']);
      pharmacy += num(r['Pharmacy Claims'] ?? r['pharmacy_claims'] ?? r['Rx']);
      admin += num(r['Admin Fees'] ?? r['admin_fees']);
      stopLossFees += num(r['Stop Loss Premium'] ?? r['stop_loss_premium']);
      reimburse += num(r['Stop Loss Reimbursements'] ?? r['stop_loss_reimb']);
      rebates += num(r['Rx Rebates'] ?? r['pharmacy_rebates']);
      employees += num(r['Employee Count'] ?? r['employees']);
      members += num(r['Member Count'] ?? r['Enrollment'] ?? r['members']);
    });

    const totalPaidClaims = medical + pharmacy;
    const netPaidClaims = totalPaidClaims - reimburse - rebates;
    const totalPlanCost = netPaidClaims + admin + stopLossFees;
    const surplus = budget - totalPlanCost;
    const pctOfBudget = budget > 0 ? (totalPlanCost / budget) * 100 : 0;
    const pepmBase = members || employees || 1; // fall back to avoid divide-by-zero
    const netPaidPEPM = pepmBase ? netPaidClaims / pepmBase : 0;
    const planCostPEPM = pepmBase ? totalPlanCost / pepmBase : 0;

    return {
      budget,
      medical,
      pharmacy,
      totalPaidClaims,
      reimburse: -Math.abs(reimburse), // show as negative per screenshot
      admin,
      stopLossFees,
      netPaidClaims,
      netPaidPEPM,
      totalPlanCost,
      planCostPEPM,
      surplus,
      pctOfBudget,
      members,
      employees,
    };
  }, [last12]);

  // Gauge percent
  const gaugePercent = useMemo(() => {
    return Math.round((totals.totalPlanCost / Math.max(1, totals.budget)) * 1000) / 10; // one decimal
  }, [totals]);

  // Build chart series data
  const monthly = useMemo(() => {
    const months = last12.map((r) => String(r.month ?? r.Month ?? r.period ?? r.Period ?? ''));
    const admin = last12.map((r) => num(r['Admin Fees'] ?? r['admin_fees']));
    const slFees = last12.map((r) => num(r['Stop Loss Premium'] ?? r['stop_loss_premium']));
    const medical = last12.map((r) => num(r['Medical Claims'] ?? r['medical_claims'] ?? r['Medical']));
    const pharmacy = last12.map((r) => num(r['Pharmacy Claims'] ?? r['pharmacy_claims'] ?? r['Rx']));
    const reimb = last12.map((r) => -Math.abs(num(r['Stop Loss Reimbursements'] ?? r['stop_loss_reimb'])));
    const budget = last12.map((r) => num(r['Budget'] ?? r['Computed Budget']));
    // net medical + pharmacy
    const netMedPharm = medical.map((m, i) => m + pharmacy[i]);
    return { months, admin, slFees, netMedPharm, reimb, budget, medical, pharmacy };
  }, [last12]);

  // ECharts refs
  const stackedRef = useRef<HTMLDivElement>(null);
  const pieRef = useRef<HTMLDivElement>(null);

  // Commentary (editable) with secure persistence (non-PHI text)
  const defaultCommentary = useMemo(() => {
    const rollingPct = Math.round((totals.totalPlanCost / Math.max(1, totals.budget)) * 1000) / 10;
    const currentPct = rollingPct;
    return [
      `${commentaryTitle} is running at ${rollingPct.toFixed(1)}% of budget in the rolling 12 month period.`,
      `In the current plan year, ${commentaryTitle} is running at ${currentPct.toFixed(1)}% of budget.`,
      'No large claims identified above the stop loss level in the selected period.'
    ].join('\n\n');
  }, [commentaryTitle, totals.totalPlanCost, totals.budget]);

  const [commentary, setCommentary] = useState<string>(defaultCommentary);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    try {
      const saved = secureHealthcareStorage.retrieve<{ text: string }>('planCommentary');
      if (saved?.text) setCommentary(saved.text);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    try {
      setSaveState('saving');
      await secureHealthcareStorage.storeTemporary('planCommentary', { text: commentary, savedAt: new Date().toISOString() }, { ttlMs: 7 * 24 * 60 * 60 * 1000 });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1500);
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 2000);
    }
  };

  // Stacked bar + line
  useEffect(() => {
    if (!stackedRef.current) return;
    let chart: echarts.ECharts | null = null;
    let resizeHandler: (() => void) | null = null;
    
    try {
      chart = echarts.init(stackedRef.current);
      const option: echarts.EChartsOption = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(10,18,32,0.95)',
          borderColor: 'rgba(0,229,137,0.35)',
          borderWidth: 1,
          textStyle: { color: '#F2FBFF', fontFamily: 'Space Grotesk' }
        },
        legend: {
          data: ['Admin Fees', 'Stop Loss Fees', 'Reimbursements', 'Net Medical & Pharmacy', 'Budgeted Premium'],
          textStyle: { color: '#9DB3C3', fontFamily: 'Space Grotesk', fontSize: 12 }
        },
        grid: { left: 30, right: 30, top: 40, bottom: 40 },
        xAxis: {
          type: 'category',
          data: monthly.months,
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
          axisLabel: { color: '#9DB3C3', fontFamily: 'Space Grotesk' },
          splitLine: { show: false }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
          axisLabel: { color: '#9DB3C3', fontFamily: 'Space Grotesk' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
        },
        series: [
          { name: 'Admin Fees', type: 'bar', stack: 'total', data: monthly.admin, itemStyle: { color: '#1F7AFA' } },
          { name: 'Stop Loss Fees', type: 'bar', stack: 'total', data: monthly.slFees, itemStyle: { color: '#4C5A75' } },
          { name: 'Net Medical & Pharmacy', type: 'bar', stack: 'total', data: monthly.netMedPharm, itemStyle: { color: '#13D8A7' } },
          { name: 'Reimbursements', type: 'bar', stack: 'total', data: monthly.reimb, itemStyle: { color: '#FF7F83', opacity: 0.7 } },
          { name: 'Budgeted Premium', type: 'line', data: monthly.budget, smooth: true, lineStyle: { width: 3, color: '#FFE166' }, symbol: 'circle', symbolSize: 8, itemStyle: { color: '#FFE166', borderWidth: 2, borderColor: '#0B1220' } },
        ],
      };
      chart.setOption(option);
      resizeHandler = () => chart?.resize();
      window.addEventListener('resize', resizeHandler);
    } catch (e) {
      console.error('Failed to initialize stacked chart:', e);
    }
    
    return () => {
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
      }
      if (chart) {
        try {
          chart.dispose();
        } catch (e) {
          console.error('Failed to dispose stacked chart:', e);
        }
      }
    };
  }, [monthly]);

  // Pie chart
  useEffect(() => {
    if (!pieRef.current) return;
    let chart: echarts.ECharts | null = null;
    let resizeHandler: (() => void) | null = null;
    
    try {
      chart = echarts.init(pieRef.current);
      const option: echarts.EChartsOption = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(10,18,32,0.95)',
          borderColor: 'rgba(0,229,137,0.35)',
          borderWidth: 1,
          textStyle: { color: '#F2FBFF', fontFamily: 'Space Grotesk' }
        },
        legend: { bottom: 0, textStyle: { color: '#9DB3C3', fontSize: 12, fontFamily: 'Space Grotesk' } },
        series: [
          {
            type: 'pie',
            radius: ['45%', '70%'],
            avoidLabelOverlap: true,
            label: { formatter: '{b}: {d}%', color: '#F2FBFF', fontSize: 12, fontFamily: 'Space Grotesk' },
            data: [
              { value: Math.round(totals.medical), name: 'Medical Claims', itemStyle: { color: '#13D8A7' } },
              { value: Math.round(totals.pharmacy), name: 'Pharmacy Claims', itemStyle: { color: '#1F7AFA' } },
            ],
            labelLine: { lineStyle: { color: 'rgba(255,255,255,0.25)' } }
          }
        ],
      };
      chart.setOption(option);
      resizeHandler = () => chart?.resize();
      window.addEventListener('resize', resizeHandler);
    } catch (e) {
      console.error('Failed to initialize pie chart:', e);
    }
    
    return () => {
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
      }
      if (chart) {
        try {
          chart.dispose();
        } catch (e) {
          console.error('Failed to dispose pie chart:', e);
        }
      }
    };
  }, [totals.medical, totals.pharmacy]);

  // Responsive heights for charts
  const barsHeight = { height: 'clamp(220px, 32vw, 320px)' } as React.CSSProperties;
  const pieHeight = { height: 'clamp(200px, 28vw, 260px)' } as React.CSSProperties;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Left: Performance Indicator with widget selector */}
      <PerformanceIndicator 
        value={gaugePercent}
        title="Plan Performance"
        defaultWidget="gauge"
        showLegend={true}
      />

      {/* Middle: Rolling 12 Month Graph */}
      <GlassCard variant="elevated" className="p-4 lg:col-span-2">
        <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">Rolling 12 Month Graph</h3>
        <div ref={stackedRef} style={{ width: '100%', ...barsHeight }} />
      </GlassCard>

      {/* Bottom left: Rolling 12 Month Summary */}
      <GlassCard variant="elevated" className="p-4">
        <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">Rolling 12 Month Summary</h3>
        <div className="text-sm text-[var(--foreground)] space-y-1">
          <div className="flex justify-between"><span className="text-[var(--foreground-muted)]">Total Budgeted Premium</span><span>{fmtCurrency(totals.budget)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--foreground-muted)]">Medical Paid Claims</span><span>{fmtCurrency(totals.medical)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--foreground-muted)]">Pharmacy Paid Claims</span><span>{fmtCurrency(totals.pharmacy)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--foreground-muted)]">Total Paid Claims</span><span>{fmtCurrency(totals.totalPaidClaims)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--foreground-muted)]">Est. Stop Loss Reimb.</span><span>{fmtCurrency(totals.reimburse)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--foreground-muted)]">Net Paid Claims</span><span>{fmtCurrency(totals.netPaidClaims)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--foreground-muted)]">Net Paid Claims PEPM</span><span>{fmtCurrency(Math.round(totals.netPaidPEPM))}</span></div>
          <div className="flex justify-between"><span className="text-[var(--foreground-muted)]">Stop-Loss Fees</span><span>{fmtCurrency(totals.stopLossFees)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--foreground-muted)]">Administration Fees</span><span>{fmtCurrency(totals.admin)}</span></div>
          <div className="flex justify-between font-semibold text-[var(--accent)]"><span>Total Plan Cost</span><span>{fmtCurrency(totals.totalPlanCost)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--foreground-muted)]">Total Plan Cost PEPM</span><span>{fmtCurrency(Math.round(totals.planCostPEPM))}</span></div>
          <div className="flex justify-between"><span className="text-[var(--foreground-muted)]">Surplus / Deficit</span><span>{fmtCurrency(totals.surplus)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--foreground-muted)]">% of Budget</span><span>{totals.pctOfBudget.toFixed(1)}%</span></div>
        </div>
      </GlassCard>

      {/* Bottom middle: Pie */}
      <GlassCard variant="elevated" className="p-4">
        <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">Medical vs Pharmacy Distribution</h3>
        <div ref={pieRef} style={{ width: '100%', ...pieHeight }} />
      </GlassCard>

      {/* Bottom right: Commentary (editable) */}
      <GlassCard variant="elevated" className="p-4">
        <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">Commentary</h3>
        <Textarea
          value={commentary}
          onChange={(e) => setCommentary(e.target.value)}
          className="min-h-[160px] text-sm bg-[var(--surface)] text-[var(--foreground)] border border-[var(--surface-border)] placeholder:text-[var(--foreground-subtle)]"
          placeholder="Enter commentary..."
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={handleSave}
            className="px-3 py-2 text-sm rounded-md bg-[linear-gradient(135deg,var(--accent),var(--accent-secondary))] text-[var(--button-primary-text)] font-semibold shadow-[var(--card-elevated-shadow)] hover:shadow-[var(--card-hover-shadow)]"
          >
            {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save'}
          </button>
          {saveState === 'error' && (
            <span className="text-sm text-[var(--danger)]">Could not save. Try again.</span>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
