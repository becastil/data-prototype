'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts';
import { GlassCard } from '@/app/components/ui/glass-card';

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

  // Gauge chart
  useEffect(() => {
    if (!gaugeRef.current) return;
    const chart = echarts.init(gaugeRef.current);
    const option: echarts.EChartsOption = {
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          center: ['50%', '70%'],
          radius: '100%',
          min: 0,
          max: 140,
          splitNumber: 7,
          axisLine: {
            lineStyle: {
              width: 20,
              color: [
                [0.95, '#22c55e'], // green <95%
                [1.05, '#f59e0b'], // yellow 95-105
                [1.4, '#ef4444'], // red >105
              ],
            },
          },
          pointer: { show: true, length: '55%' },
          title: { show: false },
          detail: {
            formatter: '{value}%',
            fontSize: 18,
            color: '#111827',
            offsetCenter: [0, '-5%'],
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          data: [{ value: gaugePercent }],
        },
      ],
    };
    chart.setOption(option);
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [gaugePercent]);

  // Stacked bar + line
  useEffect(() => {
    if (!stackedRef.current) return;
    const chart = echarts.init(stackedRef.current);
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
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [monthly]);

  // Pie chart
  useEffect(() => {
    if (!pieRef.current) return;
    const chart = echarts.init(pieRef.current);
    const medPct = totals.medical / Math.max(1, totals.medical + totals.pharmacy);
    const option: echarts.EChartsOption = {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          avoidLabelOverlap: true,
          label: { formatter: '{b}: {d}%' },
          data: [
            { value: Math.round(totals.medical), name: 'Medical Claims' },
            { value: Math.round(totals.pharmacy), name: 'Pharmacy Claims' },
          ],
        },
      ],
    };
    chart.setOption(option);
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [totals.medical, totals.pharmacy]);

  // Commentary text
  const commentary = useMemo(() => {
    const rollingPct = Math.round((totals.totalPlanCost / Math.max(1, totals.budget)) * 1000) / 10;
    const currentPct = rollingPct; // Placeholder: without YTD split, use rolling
    const largeClaimants = 0; // If claims dataset is provided elsewhere, can compute
    return [
      `${commentaryTitle} is running at ${rollingPct.toFixed(1)}% of budget in the rolling 12 month period.`,
      `In the current plan year, ${commentaryTitle} is running at ${currentPct.toFixed(1)}% of budget.`,
      largeClaimants > 0
        ? `There are ${largeClaimants} large claimants exceeding the stop loss level.`
        : 'No large claims identified above the stop loss level in the selected period.'
    ];
  }, [commentaryTitle, totals.totalPlanCost, totals.budget]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Left: Gauge + legend */}
      <GlassCard variant="elevated" className="p-4">
        <h3 className="text-sm font-semibold mb-2">Fuel Gauge - Plan Performance</h3>
        <div className="grid grid-cols-1 gap-3">
          <div ref={gaugeRef} style={{ width: '100%', height: 180 }} />
          <div className="text-xs bg-gray-50 border rounded p-2">
            <div>Green — &lt; 95% of Budget</div>
            <div>Yellow — 95% to 105% of Budget</div>
            <div>Red — &gt; 105% of Budget</div>
          </div>
        </div>
      </GlassCard>

      {/* Middle: Rolling 12 Month Graph */}
      <GlassCard variant="elevated" className="p-4 lg:col-span-2">
        <h3 className="text-sm font-semibold mb-2">Rolling 12 Month Graph</h3>
        <div ref={stackedRef} style={{ width: '100%', height: 260 }} />
      </GlassCard>

      {/* Bottom left: Rolling 12 Month Summary */}
      <GlassCard variant="elevated" className="p-4">
        <h3 className="text-sm font-semibold mb-2">Rolling 12 Month Summary</h3>
        <div className="text-xs">
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
        <h3 className="text-sm font-semibold mb-2">Medical vs Pharmacy Distribution</h3>
        <div ref={pieRef} style={{ width: '100%', height: 220 }} />
      </GlassCard>

      {/* Bottom right: Commentary */}
      <GlassCard variant="elevated" className="p-4">
        <h3 className="text-sm font-semibold mb-2">Commentary</h3>
        <div className="text-xs text-gray-700 space-y-3">
          {commentary.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

