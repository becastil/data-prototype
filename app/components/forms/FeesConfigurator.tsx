'use client';

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
      // Update the overrides with the new per-month data
      const newOverrides: OverrideRow[] = [];
      const updatedFeesConfig = JSON.parse(JSON.stringify(feesConfig));
      
      // Apply the bulk changes to the fees config
      for (const month of result.monthsUpdated) {
        const monthData = updatedFeesConfig.perMonth?.[month];
        if (monthData) {
          // Convert back to override rows for display
          if (monthData.budgetOverride) {
            newOverrides.push({
              id: `bulk-budget-${month}`,
              month,
              type: 'budget',
              amount: monthData.budgetOverride.amount,
              basis: monthData.budgetOverride.basis
            });
          }
          if (monthData.stopLossReimb !== undefined) {
            newOverrides.push({
              id: `bulk-stoploss-${month}`,
              month,
              type: 'stopLossReimb',
              amount: monthData.stopLossReimb
            });
          }
          if (monthData.rebates !== undefined) {
            newOverrides.push({
              id: `bulk-rebates-${month}`,
              month,
              type: 'rebates',
              amount: monthData.rebates
            });
          }
          if (monthData.fees) {
            Object.entries(monthData.fees).forEach(([feeId, fee]) => {
              newOverrides.push({
                id: `bulk-fee-${month}-${feeId}`,
                month,
                type: 'fee',
                feeId,
                amount: fee.amount,
                basis: fee.basis
              });
            });
          }
        }
      }
      
      setOverrides(prev => [...prev, ...newOverrides]);
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
    <div className="min-h-screen bg-[#f5f7fa] p-6 fees-configurator">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-2 text-black">Configure Fees & Budget</h2>
        <details className="mb-4">
          <summary className="text-sm text-black cursor-pointer font-medium">What is this?</summary>
          <div className="mt-2 text-sm text-black">
            <p>Configure your budget parameters and fixed costs here. All financial data (budget, fees, reimbursements) comes from this form - your CSV only needs claims and enrollment data.</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li><strong>PMPM:</strong> Per Member Per Month (multiplied by member count)</li>
              <li><strong>PEPM:</strong> Per Employee Per Month (multiplied by employee count)</li>
              <li><strong>Monthly:</strong> Fixed amount per month</li>
              <li><strong>Annual:</strong> Yearly amount (divided by 12 for monthly)</li>
            </ul>
          </div>
        </details>

        {/* Data Source Preview (non-editable) */}
        <GlassCard variant="subtle" className="p-6 mb-6 bg-white shadow-sm rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-black">Enrollment Data from CSV</h3>
          <p className="text-sm text-black">PMPM/PEPM calculations will use these enrollment counts per month. Preview from latest CSV data:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-3 rounded-lg bg-[#FFFBEB]">
              <div className="text-xs text-black font-medium">Employees (preview)</div>
              <div className="text-lg font-semibold text-black">{employees.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#FFFBEB]">
              <div className="text-xs text-black font-medium">Members (preview)</div>
              <div className="text-lg font-semibold text-black">{members.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#FFFBEB]">
              <div className="text-xs text-black font-medium">Budget (override below)</div>
              <div className="text-lg font-semibold text-black">${defaultBudget.toLocaleString()}</div>
            </div>
          </div>
        </GlassCard>

        {/* Fees */}
        <GlassCard variant="elevated" className="p-6 mb-6 bg-white shadow-sm rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">Fees</h3>
            <Button variant="default" onClick={addFee} className="gap-2">
              <Plus className="w-4 h-4" /> Add Fee
            </Button>
          </div>

          <div className="space-y-3">
            {fees.map((f, i) => (
              <div key={f.id} className="grid grid-cols-12 gap-3 items-end bg-white/80 p-3 rounded-md border border-[#e0e0e0]">
                <div className="col-span-4">
                  <label className="block text-sm text-black font-medium mb-1">Label</label>
                  <Input 
                    className="h-10 text-base"
                    value={f.label} 
                    placeholder="e.g. Admin Fee"
                    onChange={(e) => updateFee(i, { label: e.target.value })} 
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm text-black font-medium mb-1">Amount</label>
                  <Input 
                    type="number"
                    className="h-10 text-base"
                    value={f.amount}
                    onChange={(e) => updateFee(i, { amount: toNumber(e.target.value) })}
                    placeholder="e.g. 25" 
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm text-black font-medium mb-1">Basis</label>
                  <select 
                    className="w-full h-10 border border-gray-300 rounded-md px-3 py-2 text-base bg-white text-black focus:outline-none focus:border-black transition-colors"
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
                  <label className="block text-sm text-black font-medium mb-1">Monthly</label>
                  <div className="text-sm font-mono text-black">${(monthlyFromBasis(f.amount, f.basis, employees, members) || 0).toLocaleString()}</div>
                </div>
                <div className="col-span-1 flex justify-end pb-2">
                  <button
                    type="button"
                    onClick={() => removeFee(i)}
                    className="text-gray-500 hover:text-red-600 transition-colors"
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
        <GlassCard variant="elevated" className="p-6 mb-6 bg-white shadow-sm rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-black">Budget, Stop Loss & Rebates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm text-black font-medium mb-1">
                Budget Amount
                <span className="text-xs text-gray-600 font-normal ml-1">(overrides CSV)</span>
              </label>
              <Input 
                type="number" 
                className="h-10 text-base"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(toNumber(e.target.value))}
                placeholder="e.g. 250000" 
              />
            </div>
            <div>
              <label className="block text-sm text-black font-medium mb-1">Budget Basis</label>
              <select 
                className="w-full h-10 border border-gray-300 rounded-md px-3 py-2 text-base bg-white text-black focus:outline-none focus:border-black transition-colors"
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
              <label className="block text-sm text-black font-medium mb-1">
                Stop Loss Reimbursements
                <span className="text-xs text-gray-600 font-normal ml-1">(monthly)</span>
              </label>
              <Input 
                type="number" 
                className="h-10 text-base"
                value={stopLossReimb}
                onChange={(e) => setStopLossReimb(toNumber(e.target.value))}
                placeholder="e.g. 50000" 
              />
            </div>
            <div>
              <label className="block text-sm text-black font-medium mb-1">
                Rebates Received
                <span className="text-xs text-gray-600 font-normal ml-1">(monthly)</span>
              </label>
              <Input 
                type="number" 
                className="h-10 text-base"
                value={rebates}
                onChange={(e) => setRebates(toNumber(e.target.value))}
                placeholder="e.g. 25000" 
              />
            </div>
          </div>
        </GlassCard>

        {/* Per-Month Overrides */}
        <GlassCard variant="elevated" className="p-6 mb-6 bg-white shadow-sm rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">Per-Month Overrides</h3>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleOpenBulkApply}>
                <Copy className="w-4 h-4 mr-2" /> Apply to Multiple Months
              </Button>
              <Button type="button" variant="outline" onClick={addOverride}>
                <Plus className="w-4 h-4 mr-2" /> Add Override
              </Button>
            </div>
          </div>
          {overrides.length === 0 ? (
            <p className="text-sm text-gray-600">Add overrides to target specific months (e.g., change Admin Fee in May 2025).</p>
          ) : (
            <div className="space-y-3">
              {overrides.map((o) => (
                <div key={o.id} className="grid grid-cols-12 gap-3 items-end border rounded-md p-3">
                  <div className="col-span-3">
                    <label className="block text-sm text-black font-medium mb-1">Month</label>
                    <Input
                      type="month"
                      className="h-10 text-base"
                      value={o.month}
                      onChange={(e) => updateOverride(o.id, { month: e.target.value })}
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm text-black font-medium mb-1">Type</label>
                    <select
                      className="w-full h-10 border border-gray-300 rounded-md px-3 py-2 text-base bg-white text-black focus:outline-none focus:border-black transition-colors"
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
                      <label className="block text-sm text-black font-medium mb-1">Fee</label>
                      <select
                        className="w-full h-10 border border-gray-300 rounded-md px-3 py-2 text-base bg-white text-black focus:outline-none focus:border-black transition-colors"
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
                    <label className="block text-sm text-black font-medium mb-1">Amount</label>
                    <Input
                      type="number"
                      className="h-10 text-base"
                      value={o.amount}
                      onChange={(e) => updateOverride(o.id, { amount: toNumber(e.target.value) })}
                      placeholder="e.g. 25000"
                    />
                  </div>
                  {(o.type === 'budget' || o.type === 'fee') && (
                    <div className="col-span-2">
                      <label className="block text-sm text-black font-medium mb-1">Basis</label>
                      <select
                        className="w-full h-10 border border-gray-300 rounded-md px-3 py-2 text-base bg-white text-black focus:outline-none focus:border-black transition-colors"
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
                      className="text-gray-500 hover:text-red-600 transition-colors"
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
        <GlassCard variant="elevated" className="p-6 mb-6 bg-white shadow-sm rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-black">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-gray-100">
              <div className="text-xs text-black font-medium">Monthly Fixed Costs</div>
              <div className="text-xl font-bold text-black">${monthlyFixed.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-100">
              <div className="text-xs text-black font-medium">Monthly Budget</div>
              <div className="text-xl font-bold text-black">${monthlyBudget.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-100">
              <div className="text-xs text-black font-medium">Stop Loss Reimb.</div>
              <div className="text-xl font-bold text-black">${(stopLossReimb || 0).toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-100">
              <div className="text-xs text-black font-medium">Rebates</div>
              <div className="text-xl font-bold text-black">${(rebates || 0).toLocaleString()}</div>
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
