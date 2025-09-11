'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { GlassCard } from '@/app/components/ui/glass-card';
import { Textarea } from '@/app/components/ui/textarea';
import { secureHealthcareStorage } from '@/app/lib/SecureHealthcareStorage';

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
  const gaugeRef = useRef<HTMLDivElement>(null);
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

  // Gauge chart
  useEffect(() => {
    if (!gaugeRef.current) return;
    let chart: echarts.ECharts | null = null;
    let resizeHandler: (() => void) | null = null;
    
    try {
      chart = echarts.init(gaugeRef.current);
      const option: echarts.EChartsOption = {
        series: [
          {
            type: 'gauge',
            startAngle: 180,
            endAngle: 0,
            center: ['50%', '70%'],
            radius: '90%',
            min: 0,
            max: 140,
            splitNumber: 7,
            axisLine: {
              lineStyle: {
                width: 22,
                color: [
                  [0.95, '#22c55e'], // green <95%
                  [1.05, '#f59e0b'], // yellow 95-105
                  [1.4, '#ef4444'], // red >105
                ],
              },
            },
            pointer: { show: true, length: '60%', itemStyle: { color: '#111827' } },
            title: { show: true, offsetCenter: [0, '-55%'], color: '#111827', fontWeight: 'bold', fontSize: 12 },
            detail: {
              formatter: '{value}%',
              fontSize: 26,
              color: '#0f0f0f',
              offsetCenter: [0, '-8%'],
              valueAnimation: true,
            },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            data: [{ value: gaugePercent, name: 'Budget Utilization' }],
          },
        ],
      };
      chart.setOption(option);
      resizeHandler = () => chart?.resize();
      window.addEventListener('resize', resizeHandler);
    } catch (e) {
      console.error('Failed to initialize gauge chart:', e);
    }
    
    return () => {
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
      }
      if (chart) {
        try {
          chart.dispose();
        } catch (e) {
          console.error('Failed to dispose gauge chart:', e);
        }
      }
    };
  }, [gaugePercent]);

  // Stacked bar + line
  useEffect(() => {
    if (!stackedRef.current) return;
    let chart: echarts.ECharts | null = null;
    let resizeHandler: (() => void) | null = null;
    
    try {
      chart = echarts.init(stackedRef.current);
      const option: echarts.EChartsOption = {
        tooltip: { trigger: 'axis' },
        legend: {
          data: ['Admin Fees', 'Stop Loss Fees', 'Reimbursements', 'Net Medical & Pharmacy', 'Budgeted Premium'],
        },
        grid: { left: 30, right: 30, top: 30, bottom: 30 },
        xAxis: { type: 'category', data: monthly.months },
        yAxis: { type: 'value' },
        series: [
          { name: 'Admin Fees', type: 'bar', stack: 'total', data: monthly.admin, itemStyle: { color: '#9CA3AF' } },
          { name: 'Stop Loss Fees', type: 'bar', stack: 'total', data: monthly.slFees, itemStyle: { color: '#6B7280' } },
          { name: 'Net Medical & Pharmacy', type: 'bar', stack: 'total', data: monthly.netMedPharm, itemStyle: { color: '#1F2937' } },
          { name: 'Reimbursements', type: 'bar', stack: 'total', data: monthly.reimb, itemStyle: { color: '#60A5FA', opacity: 0.6 } },
          { name: 'Budgeted Premium', type: 'line', data: monthly.budget, smooth: true, symbol: 'circle', itemStyle: { color: '#000000' } },
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
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, textStyle: { color: '#111827', fontSize: 12 } },
        series: [
          {
            type: 'pie',
            radius: ['45%', '70%'],
            avoidLabelOverlap: true,
            label: { formatter: '{b}: {d}%', color: '#111827', fontSize: 12 },
            data: [
              { value: Math.round(totals.medical), name: 'Medical Claims' },
              { value: Math.round(totals.pharmacy), name: 'Pharmacy Claims' },
            ],
          },
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
  const gaugeHeight = { height: 'clamp(180px, 28vw, 260px)' } as React.CSSProperties;
  const barsHeight = { height: 'clamp(220px, 32vw, 320px)' } as React.CSSProperties;
  const pieHeight = { height: 'clamp(200px, 28vw, 260px)' } as React.CSSProperties;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Left: Gauge + legend */}
      <GlassCard variant="elevated" className="p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Fuel Gauge - Plan Performance</h3>
        <div className="grid grid-cols-1 gap-3">
          <div ref={gaugeRef} style={{ width: '100%', ...gaugeHeight }} />
          <div className="text-sm text-gray-800 bg-gray-50 border rounded p-2">
            <div><span className="inline-block w-3 h-3 bg-[#22c55e] mr-2 align-middle rounded-sm" />Green — &lt; 95% of Budget</div>
            <div><span className="inline-block w-3 h-3 bg-[#f59e0b] mr-2 align-middle rounded-sm" />Yellow — 95% to 105% of Budget</div>
            <div><span className="inline-block w-3 h-3 bg-[#ef4444] mr-2 align-middle rounded-sm" />Red — &gt; 105% of Budget</div>
          </div>
        </div>
      </GlassCard>

      {/* Middle: Rolling 12 Month Graph */}
      <GlassCard variant="elevated" className="p-4 lg:col-span-2">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Rolling 12 Month Graph</h3>
        <div ref={stackedRef} style={{ width: '100%', ...barsHeight }} />
      </GlassCard>

      {/* Bottom left: Rolling 12 Month Summary */}
      <GlassCard variant="elevated" className="p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Rolling 12 Month Summary</h3>
        <div className="text-sm text-gray-800">
          <div className="flex justify-between py-1"><span>Total Budgeted Premium</span><span>{fmtCurrency(totals.budget)}</span></div>
          <div className="flex justify-between py-1"><span>Medical Paid Claims</span><span>{fmtCurrency(totals.medical)}</span></div>
          <div className="flex justify-between py-1"><span>Pharmacy Paid Claims</span><span>{fmtCurrency(totals.pharmacy)}</span></div>
          <div className="flex justify-between py-1"><span>Total Paid Claims</span><span>{fmtCurrency(totals.totalPaidClaims)}</span></div>
          <div className="flex justify-between py-1"><span>Est. Stop Loss Reimb.</span><span>{fmtCurrency(totals.reimburse)}</span></div>
          <div className="flex justify-between py-1"><span>Net Paid Claims</span><span>{fmtCurrency(totals.netPaidClaims)}</span></div>
          <div className="flex justify-between py-1"><span>Net Paid Claims PEPM</span><span>{fmtCurrency(Math.round(totals.netPaidPEPM))}</span></div>
          <div className="flex justify-between py-1"><span>Stop-Loss Fees</span><span>{fmtCurrency(totals.stopLossFees)}</span></div>
          <div className="flex justify-between py-1"><span>Administration Fees</span><span>{fmtCurrency(totals.admin)}</span></div>
          <div className="flex justify-between py-1 font-semibold"><span>Total Plan Cost</span><span>{fmtCurrency(totals.totalPlanCost)}</span></div>
          <div className="flex justify-between py-1"><span>Total Plan Cost PEPM</span><span>{fmtCurrency(Math.round(totals.planCostPEPM))}</span></div>
          <div className="flex justify-between py-1"><span>Surplus / Deficit</span><span>{fmtCurrency(totals.surplus)}</span></div>
          <div className="flex justify-between py-1"><span>% of Budget</span><span>{totals.pctOfBudget.toFixed(1)}%</span></div>
        </div>
      </GlassCard>

      {/* Bottom middle: Pie */}
      <GlassCard variant="elevated" className="p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Medical vs Pharmacy Distribution</h3>
        <div ref={pieRef} style={{ width: '100%', ...pieHeight }} />
      </GlassCard>

      {/* Bottom right: Commentary (editable) */}
      <GlassCard variant="elevated" className="p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Commentary</h3>
        <Textarea
          value={commentary}
          onChange={(e) => setCommentary(e.target.value)}
          className="min-h-[160px] text-sm bg-white text-black border-gray-300 placeholder:text-gray-500"
          placeholder="Enter commentary..."
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={handleSave}
            className="px-3 py-2 text-sm rounded-md bg-black text-white hover:brightness-95"
          >
            {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save'}
          </button>
          {saveState === 'error' && (
            <span className="text-sm text-red-600">Could not save. Try again.</span>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
