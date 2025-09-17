'use client';

// touched by PR-008: UI surface polish for configuration flows
import React, { useMemo, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Plus, X, Copy } from 'lucide-react';
import { GlassCard } from '@/app/components/ui/glass-card';
import BulkApplyModal from './BulkApplyModal';
import { BulkApplyConfig, MissingMonthStrategy } from '@/app/types/bulkApply';
import { executeBulkApply, extractEnrollmentData } from '@/app/services/bulkApplyService';
// import { toast } from 'sonner'; // Optional: Uncomment if sonner is installed

export type RateBasis = 'PMPM' | 'PEPM' | 'Monthly' | 'Annual';

export interface FeeItem {
  id: string;
  label: string;
  amount: number;
  basis: RateBasis;
}

export interface FeesConfig {
  fees: FeeItem[];
  budgetOverride?: { amount: number; basis: RateBasis };
  stopLossReimb?: number; // reimbursements received for the month
  rebates?: number; // monthly rebates received
  // Optional per-month overrides keyed by YYYY-MM
  perMonth?: Record<string, {
    // Override individual fees by fee id
    fees?: Partial<Record<string, { amount: number; basis: RateBasis }>>;
    // Override budget for the month
    budgetOverride?: { amount: number; basis: RateBasis };
    // Override reimbursements and rebates for the month
    stopLossReimb?: number;
    rebates?: number;
  }>;
}

type OverrideType = 'budget' | 'stopLossReimb' | 'rebates' | 'fee';

interface OverrideRow {
  id: string;
  month: string; // YYYY-MM
  type: OverrideType;
  feeId?: string; // when type === 'fee'
  amount: number;
  basis?: RateBasis; // for fee/budget rows
}

const perMonthToOverrideRows = (perMonth?: FeesConfig['perMonth']): OverrideRow[] => {
  if (!perMonth) return [];

  const overrides: OverrideRow[] = [];

  const months = Object.keys(perMonth).sort();

  for (const month of months) {
    const data = perMonth[month];
    if (!data) continue;

    if (data.budgetOverride) {
      overrides.push({
        id: `override-budget-${month}`,
        month,
        type: 'budget',
        amount: data.budgetOverride.amount,
        basis: data.budgetOverride.basis
      });
    }

    if (data.stopLossReimb !== undefined) {
      overrides.push({
        id: `override-stoploss-${month}`,
        month,
        type: 'stopLossReimb',
        amount: data.stopLossReimb
      });
    }

    if (data.rebates !== undefined) {
      overrides.push({
        id: `override-rebates-${month}`,
        month,
        type: 'rebates',
        amount: data.rebates
      });
    }

    if (data.fees) {
      for (const [feeId, feeOverride] of Object.entries(data.fees)) {
        overrides.push({
          id: `override-fee-${month}-${feeId}`,
          month,
          type: 'fee',
          feeId,
          amount: feeOverride.amount,
          basis: feeOverride.basis
        });
      }
    }
  }

  return overrides;
};

function toNumber(val: string | number): number {
  if (typeof val === 'number') return val;
  const s = (val || '').toString().replace(/[$,\s]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function monthlyFromBasis(amount: number, basis: RateBasis, employees: number, members: number): number {
  switch (basis) {
    case 'PMPM':
      return amount * Math.max(0, Math.floor(members || 0));
    case 'PEPM':
      return amount * Math.max(0, Math.floor(employees || 0));
    case 'Monthly':
      return amount;
    case 'Annual':
      return amount / 12;
    default:
      return amount;
  }
}

export default function FeesConfigurator({
  defaultEmployees = 0,
  defaultMembers = 0,
  defaultBudget = 0,
  csvData = [],
  onSubmit,
}: {
  defaultEmployees?: number; // preview only, calculated from CSV
  defaultMembers?: number;   // preview only, calculated from CSV
  defaultBudget?: number;
  csvData?: any[]; // CSV data for enrollment extraction
  onSubmit: (config: FeesConfig, computed: { monthlyFixed: number; monthlyBudget: number }) => void;
}) {
  // Note: employees/members are not editable; we compute per-month from CSV later
  const employees = defaultEmployees || 0;
  const members = defaultMembers || 0;
  const [fees, setFees] = useState<FeeItem[]>([
    { id: 'admin', label: 'Admin Fee', amount: 0, basis: 'PEPM' },
    { id: 'tpa', label: 'TPA Fee', amount: 0, basis: 'PEPM' },
    { id: 'stoploss', label: 'Stop Loss Premium', amount: 0, basis: 'Monthly' },
  ]);
  const [budgetAmount, setBudgetAmount] = useState<number>(defaultBudget || 0);
  const [budgetBasis, setBudgetBasis] = useState<RateBasis>('Monthly');
  const [stopLossReimb, setStopLossReimb] = useState<number>(0);
  const [rebates, setRebates] = useState<number>(0);
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [showBulkApplyModal, setShowBulkApplyModal] = useState(false);
  const [currentFeesConfig, setCurrentFeesConfig] = useState<FeesConfig | null>(null);

  const monthlyFixed = useMemo(() => {
    return fees.reduce((sum, f) => sum + monthlyFromBasis(f.amount, f.basis, employees, members), 0);
  }, [fees, employees, members]);

  const monthlyBudget = useMemo(() => {
    return monthlyFromBasis(budgetAmount, budgetBasis, employees, members);
  }, [budgetAmount, budgetBasis, employees, members]);

  const updateFee = (index: number, patch: Partial<FeeItem>) => {
    setFees(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch } as FeeItem;
      return next;
    });
  };

  const addFee = () => {
    setFees(prev => [...prev, { id: `fee-${prev.length + 1}`, label: 'Custom Fee', amount: 0, basis: 'Monthly' }]);
  };

  const removeFee = (index: number) => {
    setFees(prev => prev.filter((_, i) => i !== index));
  };

  const addOverride = () => {
    setOverrides(prev => [
      ...prev, 
      {
        id: `ovr-${Date.now()}-${prev.length + 1}`,
        month: '',
        type: 'budget',
        amount: 0,
        basis: 'Monthly',
      }
    ]);
  };

  const updateOverride = (id: string, patch: Partial<OverrideRow>) => {
    setOverrides(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));
  };

  const removeOverride = (id: string) => {
    setOverrides(prev => prev.filter(o => o.id !== id));
  };

  const toPerMonth = () => {
    const byMonth: FeesConfig['perMonth'] = {};
    for (const o of overrides) {
      if (!o.month) continue;
      const key = o.month;
      byMonth[key] ||= {};
      switch (o.type) {
        case 'budget':
          if (o.basis != null)
            byMonth[key]!.budgetOverride = { amount: o.amount || 0, basis: o.basis! };
          break;
        case 'stopLossReimb':
          byMonth[key]!.stopLossReimb = o.amount || 0;
          break;
        case 'rebates':
          byMonth[key]!.rebates = o.amount || 0;
          break;
        case 'fee':
          if (o.feeId) {
            byMonth[key]!.fees ||= {};
            byMonth[key]!.fees![o.feeId] = { amount: o.amount || 0, basis: o.basis || 'Monthly' };
          }
          break;
      }
    }
    return byMonth;
  };

  const canContinue = fees.every(f => Number.isFinite(f.amount)) && Number.isFinite(budgetAmount);

  // Build current fees config for bulk apply
  const buildCurrentFeesConfig = (): FeesConfig => ({
    fees,
    budgetOverride: { amount: budgetAmount, basis: budgetBasis },
    stopLossReimb,
    rebates,
    perMonth: toPerMonth()
  });

  const handleOpenBulkApply = () => {
    setCurrentFeesConfig(buildCurrentFeesConfig());
    setShowBulkApplyModal(true);
  };

  const handleBulkApply = (config: BulkApplyConfig) => {
    const feesConfig = buildCurrentFeesConfig();
    const targetMonths = config.endMonth 
      ? expandMonths(config.startMonth, undefined, config.endMonth)
      : expandMonths(config.startMonth, config.duration);
    
    const enrollmentData = extractEnrollmentData(csvData, targetMonths);
    
    const result = executeBulkApply(
      config,
      feesConfig,
      enrollmentData,
      MissingMonthStrategy.CREATE
    );
    
    if (result.success) {
      setOverrides(perMonthToOverrideRows(result.updatedConfig.perMonth));
      setCurrentFeesConfig(result.updatedConfig);
      // toast?.success(`Successfully applied settings to ${result.monthsUpdated.length} month(s)`);
      console.log(`Successfully applied settings to ${result.monthsUpdated.length} month(s)`);
    } else {
      // toast?.error(`Failed to apply settings: ${result.errors.join(', ')}`);
      console.error(`Failed to apply settings: ${result.errors.join(', ')}`);
    }
    
    setShowBulkApplyModal(false);
  };

  // Import the expandMonths function for use
  const { expandMonths } = require('@/app/services/bulkApplyService');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#04060D] via-[#0B1220] to-[#02040A] px-6 py-16 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight">Configure Fees & Budget</h2>
          <details className="inline-block">
            <summary className="text-sm cursor-pointer text-slate-300 font-medium inline-flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-slate-200">?</span>
              What is this?
            </summary>
            <div className="mt-3 text-sm text-slate-200/90 bg-white/10 border border-white/15 rounded-2xl px-5 py-4 max-w-xl backdrop-blur-xl">
              <p>Configure budgets, fixed fees, and reimbursements used throughout analytics. Claims uploads only need experience data—financial overrides stay here.</p>
              <ul className="mt-3 space-y-1 text-xs text-slate-200/70">
                <li><strong>PMPM:</strong> Per Member Per Month (multiplies member count)</li>
                <li><strong>PEPM:</strong> Per Employee Per Month (multiplies employee count)</li>
                <li><strong>Monthly:</strong> Fixed monthly amount</li>
                <li><strong>Annual:</strong> Yearly amount distributed across 12 months</li>
              </ul>
            </div>
          </details>
        </div>

        {/* Data Source Preview (non-editable) */}
        <GlassCard variant="elevated" blur="xl" className="p-8 border-white/15 bg-white/6 shadow-[0_30px_80px_rgba(7,14,35,0.45)]">
          <h3 className="text-lg font-semibold mb-3 text-slate-100">Enrollment Data from CSV</h3>
          <p className="text-sm text-slate-300">PMPM/PEPM calculations pull from these counts each month. Snapshot from your latest upload:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            <div className="p-4 rounded-2xl bg-white/12 border border-white/15 backdrop-blur-lg">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Employees</div>
              <div className="text-2xl font-semibold text-white mt-2">{employees.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/12 border border-white/15 backdrop-blur-lg">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Members</div>
              <div className="text-2xl font-semibold text-white mt-2">{members.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/12 border border-white/15 backdrop-blur-lg">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Budget Preview</div>
              <div className="text-2xl font-semibold text-white mt-2">${defaultBudget.toLocaleString()}</div>
            </div>
          </div>
        </GlassCard>

        {/* Fees */}
        <GlassCard variant="elevated" blur="xl" className="p-8 border-white/15 bg-white/6 shadow-[0_30px_80px_rgba(7,14,35,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Fees</h3>
              <p className="text-xs text-slate-300 leading-tight mt-1">Create monthly fees and choose whether they scale by members, employees, or stay flat.</p>
            </div>
            <Button variant="default" onClick={addFee} className="gap-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900 shadow-[0_12px_30px_rgba(56,189,248,0.45)] hover:opacity-90">
              <Plus className="w-4 h-4" /> Add Fee
            </Button>
          </div>

          <div className="space-y-3">
            {fees.map((f, i) => (
              <div key={f.id} className="grid grid-cols-12 gap-4 items-end bg-white/10 border border-white/15 backdrop-blur-lg p-4 rounded-2xl">
                <div className="col-span-4">
                  <label className="block text-xs uppercase tracking-[0.18em] text-slate-300 mb-2">Label</label>
                  <Input 
                    className="h-11 text-base rounded-xl border-white/20 bg-white/20 text-white placeholder:text-slate-400"
                    value={f.label} 
                    placeholder="e.g. Admin Fee"
                    onChange={(e) => updateFee(i, { label: e.target.value })} 
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs uppercase tracking-[0.18em] text-slate-300 mb-2">Amount</label>
                  <Input 
                    type="number"
                    className="h-11 text-base rounded-xl border-white/20 bg-white/20 text-white placeholder:text-slate-400"
                    value={f.amount}
                    onChange={(e) => updateFee(i, { amount: toNumber(e.target.value) })}
                    placeholder="e.g. 25" 
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs uppercase tracking-[0.18em] text-slate-300 mb-2">Basis</label>
                  <select 
                    className="w-full h-11 border border-white/20 rounded-xl px-3 py-2 text-base bg-white/15 text-white focus:outline-none focus:border-sky-300 transition-all"
                    value={f.basis}
                    onChange={(e) => updateFee(i, { basis: e.target.value as RateBasis })}
                  >
                    <option value="PMPM">Per Member Per Month (PMPM)</option>
                    <option value="PEPM">Per Employee Per Month (PEPM)</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">Monthly</label>
                  <div className="text-sm font-mono text-slate-100">${(monthlyFromBasis(f.amount, f.basis, employees, members) || 0).toLocaleString()}</div>
                </div>
                <div className="col-span-1 flex justify-end pb-2">
                  <button
                    type="button"
                    onClick={() => removeFee(i)}
                    className="text-slate-400 hover:text-rose-400 transition-colors"
                    aria-label={`Remove ${f.label}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Budget, Stop Loss & Rebates (Global Defaults) */}
        <GlassCard variant="elevated" blur="xl" className="p-8 border-white/15 bg-white/6 shadow-[0_30px_80px_rgba(7,14,35,0.45)]">
          <h3 className="text-lg font-semibold mb-4 text-white">Budget, Stop Loss & Rebates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs uppercase tracking-[0.18em] text-slate-300 mb-2">
                Budget Amount
                <span className="text-[10px] text-slate-400 font-normal ml-2">(overrides CSV)</span>
              </label>
              <Input 
                type="number" 
                className="h-11 text-base rounded-xl border-white/20 bg-white/20 text-white placeholder:text-slate-400"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(toNumber(e.target.value))}
                placeholder="e.g. 250000" 
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.18em] text-slate-300 mb-2">Budget Basis</label>
              <select 
                className="w-full h-11 border border-white/20 rounded-xl px-3 py-2 text-base bg-white/15 text-white focus:outline-none focus:border-sky-300 transition-all"
                value={budgetBasis}
                onChange={(e) => setBudgetBasis(e.target.value as RateBasis)}
              >
                <option value="Monthly">Monthly</option>
                <option value="Annual">Annual</option>
                <option value="PMPM">PMPM</option>
                <option value="PEPM">PEPM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.18em] text-slate-300 mb-2">
                Stop Loss Reimbursements
                <span className="text-[10px] text-slate-400 font-normal ml-2">(monthly)</span>
              </label>
              <Input 
                type="number" 
                className="h-11 text-base rounded-xl border-white/20 bg-white/20 text-white placeholder:text-slate-400"
                value={stopLossReimb}
                onChange={(e) => setStopLossReimb(toNumber(e.target.value))}
                placeholder="e.g. 50000" 
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.18em] text-slate-300 mb-2">
                Rebates Received
                <span className="text-[10px] text-slate-400 font-normal ml-2">(monthly)</span>
              </label>
              <Input 
                type="number" 
                className="h-11 text-base rounded-xl border-white/20 bg-white/20 text-white placeholder:text-slate-400"
                value={rebates}
                onChange={(e) => setRebates(toNumber(e.target.value))}
                placeholder="e.g. 25000" 
              />
            </div>
          </div>
        </GlassCard>

        {/* Per-Month Overrides */}
        <GlassCard variant="elevated" blur="xl" className="p-8 border-white/15 bg-white/6 shadow-[0_30px_80px_rgba(7,14,35,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Per-Month Overrides</h3>
              <p className="text-xs text-slate-300 leading-tight mt-1">Target specific months with fee, budget, or reimbursement tweaks.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={handleOpenBulkApply} className="rounded-full border-white/30 text-white hover:text-slate-900 hover:bg-white/90 transition-colors">
                <Copy className="w-4 h-4 mr-2" /> Apply to Multiple Months
              </Button>
              <Button type="button" variant="outline" onClick={addOverride} className="rounded-full border-white/30 text-white hover:text-slate-900 hover:bg-white/90 transition-colors">
                <Plus className="w-4 h-4 mr-2" /> Add Override
              </Button>
            </div>
          </div>
          {overrides.length === 0 ? (
            <p className="text-sm text-slate-300">Add overrides to target specific months (e.g., adjust Admin Fee in May 2025).</p>
          ) : (
            <div className="space-y-3">
              {overrides.map((o) => (
                <div key={o.id} className="grid grid-cols-12 gap-4 items-end bg-white/10 border border-white/15 backdrop-blur-lg p-4 rounded-2xl">
                  <div className="col-span-3">
                    <label className="block text-xs uppercase tracking-[0.18em] text-slate-300 mb-2">Month</label>
                    <Input
                      type="month"
                      className="h-11 text-base rounded-xl border-white/20 bg-white/20 text-white"
                      value={o.month}
                      onChange={(e) => updateOverride(o.id, { month: e.target.value })}
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs uppercase tracking-[0.18em] text-slate-300 mb-2">Type</label>
                    <select
                      className="w-full h-11 border border-white/20 rounded-xl px-3 py-2 text-base bg-white/15 text-white focus:outline-none focus:border-sky-300 transition-all"
                      value={o.type}
                      onChange={(e) => {
                        const t = e.target.value as OverrideType;
                        updateOverride(o.id, { type: t, feeId: t === 'fee' ? fees[0]?.id : undefined, basis: (t === 'fee' || t === 'budget') ? (o.basis || 'Monthly') : undefined });
                      }}
                    >
                      <option value="budget">Budget</option>
                      <option value="stopLossReimb">Stop Loss Reimb</option>
                      <option value="rebates">Rebates</option>
                      <option value="fee">Specific Fee</option>
                    </select>
                  </div>
                  {o.type === 'fee' && (
                    <div className="col-span-3">
                      <label className="block text-xs uppercase tracking-[0.18em] text-slate-300 mb-2">Fee</label>
                      <select
                        className="w-full h-11 border border-white/20 rounded-xl px-3 py-2 text-base bg-white/15 text-white focus:outline-none focus:border-sky-300 transition-all"
                        value={o.feeId || ''}
                        onChange={(e) => updateOverride(o.id, { feeId: e.target.value })}
                      >
                        {fees.map(f => (
                          <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className={o.type === 'fee' ? 'col-span-2' : 'col-span-3'}>
                    <label className="block text-xs uppercase tracking-[0.18em] text-slate-300 mb-2">Amount</label>
                    <Input
                      type="number"
                      className="h-11 text-base rounded-xl border-white/20 bg-white/20 text-white placeholder:text-slate-400"
                      value={o.amount}
                      onChange={(e) => updateOverride(o.id, { amount: toNumber(e.target.value) })}
                      placeholder="e.g. 25000"
                    />
                  </div>
                  {(o.type === 'budget' || o.type === 'fee') && (
                    <div className="col-span-2">
                      <label className="block text-xs uppercase tracking-[0.18em] text-slate-300 mb-2">Basis</label>
                      <select
                        className="w-full h-11 border border-white/20 rounded-xl px-3 py-2 text-base bg-white/15 text-white focus:outline-none focus:border-sky-300 transition-all"
                        value={o.basis || 'Monthly'}
                        onChange={(e) => updateOverride(o.id, { basis: e.target.value as RateBasis })}
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Annual">Annual</option>
                        <option value="PMPM">PMPM</option>
                        <option value="PEPM">PEPM</option>
                      </select>
                    </div>
                  )}
                  <div className="col-span-1 flex justify-end pb-2">
                    <button
                      type="button"
                      onClick={() => removeOverride(o.id)}
                      className="text-slate-400 hover:text-rose-400 transition-colors"
                      aria-label="Remove override"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Summary */}
        <GlassCard variant="elevated" blur="xl" className="p-8 border-white/15 bg-white/6 shadow-[0_30px_80px_rgba(7,14,35,0.45)]">
          <h3 className="text-lg font-semibold mb-4 text-white">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white/12 border border-white/15 backdrop-blur-lg">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Monthly Fixed Costs</div>
              <div className="text-2xl font-semibold text-white mt-2">${monthlyFixed.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/12 border border-white/15 backdrop-blur-lg">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Monthly Budget</div>
              <div className="text-2xl font-semibold text-white mt-2">${monthlyBudget.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/12 border border-white/15 backdrop-blur-lg">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Stop Loss Reimb.</div>
              <div className="text-2xl font-semibold text-white mt-2">${(stopLossReimb || 0).toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/12 border border-white/15 backdrop-blur-lg">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Rebates</div>
              <div className="text-2xl font-semibold text-white mt-2">${(rebates || 0).toLocaleString()}</div>
            </div>
          </div>
        </GlassCard>

        <div className="flex justify-end">
          <Button
            onClick={() => onSubmit(
              {
                fees,
                budgetOverride: { amount: budgetAmount, basis: budgetBasis },
                stopLossReimb,
                rebates,
                perMonth: toPerMonth(),
              },
              { monthlyFixed, monthlyBudget }
            )}
            disabled={!canContinue}
            className="rounded-full px-8 py-3 text-base font-semibold bg-gradient-to-r from-emerald-400 via-cyan-300 to-sky-400 text-slate-900 shadow-[0_18px_40px_rgba(45,212,191,0.45)] hover:opacity-90"
          >
            Continue to Dashboard
          </Button>
        </div>
      </div>
      
      {/* Bulk Apply Modal */}
      {currentFeesConfig && (
        <BulkApplyModal
          open={showBulkApplyModal}
          onOpenChange={setShowBulkApplyModal}
          feesConfig={currentFeesConfig}
          csvData={csvData}
          onApply={handleBulkApply}
        />
      )}
    </div>
  );
}
