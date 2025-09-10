'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { GlassCard } from '@/app/components/ui/glass-card';

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
  onSubmit,
}: {
  defaultEmployees?: number; // preview only, calculated from CSV
  defaultMembers?: number;   // preview only, calculated from CSV
  defaultBudget?: number;
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

  const canContinue = fees.every(f => Number.isFinite(f.amount)) && Number.isFinite(budgetAmount);

  return (
    <div className="min-h-screen bg-[#FFFDF5] p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Configure Fees & Budget</h2>
        <p className="text-gray-700 mb-6">Enter your fees and basis. Enrollment and employees are read from your CSV per month automatically.</p>

        {/* Data Source Preview (non-editable) */}
        <GlassCard variant="subtle" className="p-6 mb-6 bg-white">
          <h3 className="text-lg font-semibold mb-2">Using CSV Enrollment</h3>
          <p className="text-sm text-gray-600">We’ll compute PMPM/PEPM values per month from your CSV. Latest known values:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-3 rounded-lg bg-[#FFFBEB]">
              <div className="text-xs text-gray-600">Employees (preview)</div>
              <div className="text-lg font-semibold">{employees.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#FFFBEB]">
              <div className="text-xs text-gray-600">Members (preview)</div>
              <div className="text-lg font-semibold">{members.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#FFFBEB]">
              <div className="text-xs text-gray-600">Budget (preview)</div>
              <div className="text-lg font-semibold">${defaultBudget.toLocaleString()}</div>
            </div>
          </div>
        </GlassCard>

        {/* Fees */}
        <GlassCard variant="elevated" className="p-6 mb-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Fees</h3>
            <Button variant="secondary" onClick={addFee}>Add Fee</Button>
          </div>

          <div className="space-y-3">
            {fees.map((f, i) => (
              <div key={f.id} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-4">
                  <label className="block text-sm text-gray-600 mb-1">Label</label>
                  <Input value={f.label} onChange={(e) => updateFee(i, { label: e.target.value })} />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm text-gray-600 mb-1">Amount</label>
                  <Input type="number" value={f.amount}
                         onChange={(e) => updateFee(i, { amount: toNumber(e.target.value) })}
                         placeholder="e.g. 25" />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm text-gray-600 mb-1">Basis</label>
                  <select className="w-full border rounded-md px-3 py-2"
                          value={f.basis}
                          onChange={(e) => updateFee(i, { basis: e.target.value as RateBasis })}>
                    <option value="PMPM">Per Member Per Month (PMPM)</option>
                    <option value="PEPM">Per Employee Per Month (PEPM)</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div className="col-span-2 text-right">
                  <label className="block text-sm text-gray-600 mb-1">Monthly</label>
                  <div className="text-sm font-mono">
                    ${(monthlyFromBasis(f.amount, f.basis, employees, members) || 0).toLocaleString()}
                  </div>
                </div>
                <div className="col-span-12 text-right">
                  <Button variant="ghost" onClick={() => removeFee(i)}>Remove</Button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Budget & Stop Loss */}
        <GlassCard variant="elevated" className="p-6 mb-6 bg-white">
          <h3 className="text-lg font-semibold mb-4">Budget & Stop Loss</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Budget Amount</label>
              <Input type="number" value={budgetAmount}
                     onChange={(e) => setBudgetAmount(toNumber(e.target.value))}
                     placeholder="e.g. 250000" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Budget Basis</label>
              <select className="w-full border rounded-md px-3 py-2"
                      value={budgetBasis}
                      onChange={(e) => setBudgetBasis(e.target.value as RateBasis)}>
                <option value="Monthly">Monthly</option>
                <option value="Annual">Annual</option>
                <option value="PMPM">PMPM</option>
                <option value="PEPM">PEPM</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Stop Loss Reimbursements (month)</label>
              <Input type="number" value={stopLossReimb}
                     onChange={(e) => setStopLossReimb(toNumber(e.target.value))}
                     placeholder="e.g. 50000" />
            </div>
          </div>
        </GlassCard>

        {/* Summary */}
        <GlassCard variant="elevated" className="p-6 mb-6 bg-white">
          <h3 className="text-lg font-semibold mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gray-100">
              <div className="text-xs text-gray-600">Monthly Fixed Costs</div>
              <div className="text-xl font-bold">${monthlyFixed.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-100">
              <div className="text-xs text-gray-600">Monthly Budget</div>
              <div className="text-xl font-bold">${monthlyBudget.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-100">
              <div className="text-xs text-gray-600">Stop Loss Reimb.</div>
              <div className="text-xl font-bold">${(stopLossReimb || 0).toLocaleString()}</div>
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
              },
              { monthlyFixed, monthlyBudget }
            )}
            disabled={!canContinue}
          >
            Continue to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
