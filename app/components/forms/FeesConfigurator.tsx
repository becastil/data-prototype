'use client';

// touched by PR-008: UI surface polish for configuration flows
import React, { useMemo, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Plus, X, Copy, ArrowRight, CheckCircle2, Info, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/app/components/ui/glass-card';
import BulkApplyModal from './BulkApplyModal';
import { BulkApplyConfig, MissingMonthStrategy } from '@/app/types/bulkApply';
import { executeBulkApply, extractEnrollmentData } from '@/app/services/bulkApplyService';
// import { toast } from 'sonner'; // Optional: Uncomment if sonner is installed
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/components/ui/tooltip';
import { Progress } from '@/app/components/ui/progress';
import { cn } from '@/app/lib/utils';

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

const FieldLabel: React.FC<{ id: string; label: string; tooltip?: string; helper?: string; className?: string }> = ({
  id,
  label,
  tooltip,
  helper,
  className,
}) => (
  <label
    htmlFor={id}
    className={cn('flex flex-col gap-1 text-sm font-medium text-slate-600', className)}
  >
    <span className="flex items-center gap-2">
      {label}
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600"
              aria-label={tooltip}
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs border border-slate-700/60 bg-slate-900 px-3 py-2 text-left text-xs font-normal leading-relaxed text-white">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </span>
    {helper ? (
      <span className="text-xs font-normal leading-snug text-slate-500">{helper}</span>
    ) : null}
  </label>
);

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

  const flowSteps = [
    { label: 'Upload files', status: 'complete' },
    { label: 'Configure fees', status: 'active' },
    { label: 'Launch dashboard', status: 'pending' },
  ] as const;
  const totalSteps = flowSteps.length;
  const currentStepIndex = flowSteps.findIndex((step) => step.status === 'active');
  const stepProgress = Math.round(((currentStepIndex + 1) / totalSteps) * 100);
  const budgetAmountId = 'budget-amount';
  const budgetBasisId = 'budget-basis';
  const stopLossId = 'stop-loss';
  const rebatesId = 'rebates';

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
    <TooltipProvider delayDuration={120}>
      <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-12">
        <GlassCard
          variant="elevated"
          blur="xl"
          className="space-y-6 border-slate-200/60 bg-white/85 p-6 shadow-[0_26px_70px_rgba(15,23,42,0.12)]"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Step {currentStepIndex + 1} of {totalSteps}
              </span>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                Configure fees & budget
              </h2>
              <p className="text-sm text-slate-600">
                Tune fixed costs and overrides before launching your analytics workspace.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              <Progress value={stepProgress} className="h-1.5 bg-slate-200/70 [&>div]:bg-sky-500" />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Upload complete
                </span>
                <span>Next: Dashboard</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
            {flowSteps.map((step, index) => (
              <React.Fragment key={step.label}>
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors',
                    step.status === 'complete' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                    step.status === 'active' && 'border-sky-200 bg-sky-50 text-sky-700',
                    step.status === 'pending' && 'border-slate-200 bg-white text-slate-500'
                  )}
                >
                  {step.status === 'complete' ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  ) : (
                    <span
                      className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        step.status === 'active' ? 'bg-sky-500' : 'bg-slate-300'
                      )}
                    />
                  )}
                  {step.label}
                </span>
                {index < flowSteps.length - 1 ? (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden />
                ) : null}
              </React.Fragment>
            ))}
          </div>
        </GlassCard>

        <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <GlassCard
            variant="elevated"
            blur="xl"
            className="space-y-4 border-slate-200/60 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Enrollment snapshot</h3>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">From CSV</span>
            </div>
            <p className="text-sm text-slate-600">
              PMPM and PEPM calculations lean on the latest uploaded counts.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Employees</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{employees.toLocaleString()}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Members</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{members.toLocaleString()}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Budget preview</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">${defaultBudget.toLocaleString()}</div>
              </div>
            </div>
          </GlassCard>

          <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                ?
              </span>
              <div className="space-y-3 text-sm text-slate-600">
                <p>
                  Configure the financial levers that power the dashboard—fees can scale by member or employee counts, while budgets override CSV totals when needed.
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1">PMPM × members</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">PEPM × employees</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">Annual ÷ 12 months</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Fees */}
        <GlassCard
          variant="elevated"
          blur="xl"
          className="space-y-6 border-slate-200/60 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">Base fees</h3>
              <p className="text-sm text-slate-600">Define recurring costs and choose how each one scales.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
                Monthly total ${monthlyFixed.toLocaleString()}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={addFee}
                className="gap-2 rounded-full border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                <Plus className="h-4 w-4" /> Add fee
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {fees.map((f, i) => {
              const labelId = `fee-label-${f.id}`;
              const amountId = `fee-amount-${f.id}`;
              const basisId = `fee-basis-${f.id}`;
              const monthlyValue = monthlyFromBasis(f.amount, f.basis, employees, members) || 0;

              return (
                <div
                  key={f.id}
                  className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm"
                >
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto] md:items-end">
                    <div className="space-y-2">
                      <FieldLabel
                        id={labelId}
                        label="Fee name"
                        helper="Visible in dashboards"
                      />
                      <Input
                        id={labelId}
                        className="h-11 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                        value={f.label}
                        placeholder="e.g. Admin fee"
                        onChange={(e) => updateFee(i, { label: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel
                        id={amountId}
                        label="Amount"
                        helper="Enter the raw value"
                      />
                      <Input
                        id={amountId}
                        type="number"
                        inputMode="decimal"
                        className="h-11 rounded-xl border-slate-200 bg-white text-slate-900"
                        value={f.amount}
                        onChange={(e) => updateFee(i, { amount: toNumber(e.target.value) })}
                        placeholder="25"
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel
                        id={basisId}
                        label="Applied as"
                        tooltip="Pick how we translate the amount into a monthly figure."
                        helper="We auto-convert using current headcounts."
                      />
                      <select
                        id={basisId}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-sky-400 focus:outline-none"
                        value={f.basis}
                        onChange={(e) => updateFee(i, { basis: e.target.value as RateBasis })}
                      >
                        <option value="PMPM">Per member (PMPM)</option>
                        <option value="PEPM">Per employee (PEPM)</option>
                        <option value="Monthly">Flat monthly</option>
                        <option value="Annual">Annual / 12</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-slate-500">Monthly impact</span>
                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
                        ${monthlyValue.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex justify-end pt-6 md:pt-8">
                      <button
                        type="button"
                        onClick={() => removeFee(i)}
                        className="text-slate-400 transition-colors hover:text-rose-500"
                        aria-label={`Remove ${f.label}`}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500">
            Monthly impact updates automatically when you adjust amounts, headcounts, or bases.
          </p>
        </GlassCard>

        {/* Budget, Stop Loss & Rebates (Global Defaults) */}
        <GlassCard
          variant="elevated"
          blur="xl"
          className="space-y-6 border-slate-200/60 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
        >
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">Budget & reimbursements</h3>
            <p className="text-sm text-slate-600">Set organization-wide defaults. Per-month overrides layer on top.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <FieldLabel
                id={budgetAmountId}
                label="Budget amount"
                tooltip="Provide a blended monthly or annual budget to benchmark against claims."
                helper="Overrides CSV totals when present."
              />
              <Input
                id={budgetAmountId}
                type="number"
                inputMode="decimal"
                className="h-11 rounded-xl border-slate-200 bg-white text-slate-900"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(toNumber(e.target.value))}
                placeholder="250000"
              />
            </div>
            <div className="space-y-2">
              <FieldLabel
                id={budgetBasisId}
                label="Budget basis"
                tooltip="Select how the budget amount should convert into a monthly value."
                helper="We normalize before analytics run."
              />
              <select
                id={budgetBasisId}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-sky-400 focus:outline-none"
                value={budgetBasis}
                onChange={(e) => setBudgetBasis(e.target.value as RateBasis)}
              >
                <option value="Monthly">Monthly</option>
                <option value="Annual">Annual</option>
                <option value="PMPM">Per member (PMPM)</option>
                <option value="PEPM">Per employee (PEPM)</option>
              </select>
            </div>
            <div className="space-y-2">
              <FieldLabel
                id={stopLossId}
                label="Stop loss reimbursements"
                tooltip="Monthly reimbursements that offset net cost before variance calculations."
                helper="Enter as a monthly dollar amount."
              />
              <Input
                id={stopLossId}
                type="number"
                inputMode="decimal"
                className="h-11 rounded-xl border-slate-200 bg-white text-slate-900"
                value={stopLossReimb}
                onChange={(e) => setStopLossReimb(toNumber(e.target.value))}
                placeholder="50000"
              />
            </div>
            <div className="space-y-2">
              <FieldLabel
                id={rebatesId}
                label="Rebates received"
                tooltip="Monthly rebates or credits that reduce pharmacy cost."
                helper="Optional but recommended for net cost accuracy."
              />
              <Input
                id={rebatesId}
                type="number"
                inputMode="decimal"
                className="h-11 rounded-xl border-slate-200 bg-white text-slate-900"
                value={rebates}
                onChange={(e) => setRebates(toNumber(e.target.value))}
                placeholder="25000"
              />
            </div>
          </div>
        </GlassCard>

        {/* Per-Month Overrides */}
        <GlassCard
          variant="elevated"
          blur="xl"
          className="space-y-6 border-slate-200/60 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">Per-month overrides</h3>
              <p className="text-sm text-slate-600">Handle exceptions like one-time credits, renewals, or seasonal stop-loss adjustments.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenBulkApply}
                className="gap-2 rounded-full border-slate-200 text-slate-700 hover:bg-slate-100"
              >
                <Copy className="h-4 w-4" /> Bulk apply
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={addOverride}
                className="gap-2 rounded-full border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                <Plus className="h-4 w-4" /> Add override
              </Button>
            </div>
          </div>
          {overrides.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-600">
              Add your first override to adjust a specific month—for example, increase the admin fee in May or capture a one-time rebate.
            </div>
          ) : (
            <div className="space-y-3">
              {overrides.map((o) => {
                const monthId = `override-month-${o.id}`;
                const typeId = `override-type-${o.id}`;
                const feeId = `override-fee-${o.id}`;
                const amountId = `override-amount-${o.id}`;
                const basisId = `override-basis-${o.id}`;

                return (
                  <div
                    key={o.id}
                    className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap gap-4">
                      <div className="flex min-w-[180px] flex-1 flex-col gap-2">
                        <FieldLabel id={monthId} label="Month" helper="YYYY-MM" />
                        <Input
                          id={monthId}
                          type="month"
                          className="h-11 rounded-xl border-slate-200 bg-white text-slate-900"
                          value={o.month}
                          onChange={(e) => updateOverride(o.id, { month: e.target.value })}
                        />
                      </div>
                      <div className="flex min-w-[180px] flex-1 flex-col gap-2">
                        <FieldLabel
                          id={typeId}
                          label="Applies to"
                          tooltip="Choose what this override should adjust for the selected month."
                        />
                        <select
                          id={typeId}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-sky-400 focus:outline-none"
                          value={o.type}
                          onChange={(e) => {
                            const t = e.target.value as OverrideType;
                            updateOverride(o.id, {
                              type: t,
                              feeId: t === 'fee' ? fees[0]?.id : undefined,
                              basis: t === 'fee' || t === 'budget' ? (o.basis || 'Monthly') : undefined,
                            });
                          }}
                        >
                          <option value="budget">Budget</option>
                          <option value="stopLossReimb">Stop loss reimbursement</option>
                          <option value="rebates">Rebates</option>
                          <option value="fee">Specific fee</option>
                        </select>
                      </div>
                      {o.type === 'fee' ? (
                        <div className="flex min-w-[200px] flex-1 flex-col gap-2">
                          <FieldLabel
                            id={feeId}
                            label="Fee to adjust"
                            helper="Select from the base fees above."
                          />
                          <select
                            id={feeId}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-sky-400 focus:outline-none"
                            value={o.feeId || fees[0]?.id || ''}
                            onChange={(e) => updateOverride(o.id, { feeId: e.target.value })}
                          >
                            {fees.map((fee) => (
                              <option key={fee.id} value={fee.id}>
                                {fee.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                      <div className="flex min-w-[160px] flex-1 flex-col gap-2">
                        <FieldLabel
                          id={amountId}
                          label="Amount"
                          helper={o.type === 'rebates' ? 'Positive values reduce net cost.' : undefined}
                        />
                        <Input
                          id={amountId}
                          type="number"
                          inputMode="decimal"
                          className="h-11 rounded-xl border-slate-200 bg-white text-slate-900"
                          value={o.amount}
                          onChange={(e) => updateOverride(o.id, { amount: toNumber(e.target.value) })}
                        />
                      </div>
                      {(o.type === 'fee' || o.type === 'budget') ? (
                        <div className="flex min-w-[160px] flex-1 flex-col gap-2">
                          <FieldLabel
                            id={basisId}
                            label="Applied as"
                            tooltip="Overrides follow the same scaling logic as base fees."
                          />
                          <select
                            id={basisId}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-sky-400 focus:outline-none"
                            value={o.basis || 'Monthly'}
                            onChange={(e) => updateOverride(o.id, { basis: e.target.value as RateBasis })}
                          >
                            <option value="PMPM">Per member (PMPM)</option>
                            <option value="PEPM">Per employee (PEPM)</option>
                            <option value="Monthly">Flat monthly</option>
                            <option value="Annual">Annual / 12</option>
                          </select>
                        </div>
                      ) : null}
                      <div className="flex shrink-0 items-end">
                        <button
                          type="button"
                          onClick={() => removeOverride(o.id)}
                          className="rounded-full border border-transparent p-2 text-slate-400 transition-colors hover:border-rose-200 hover:text-rose-500"
                          aria-label="Remove override"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Summary */}
        <GlassCard
          variant="elevated"
          blur="xl"
          className="space-y-6 border-slate-200/60 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">Review totals</h3>
              <p className="text-sm text-slate-600">These values are what the dashboard will use once you continue.</p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">All amounts in USD</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Monthly fixed costs</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">${monthlyFixed.toLocaleString()}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Monthly budget</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">${monthlyBudget.toLocaleString()}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Stop loss reimb.</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">${(stopLossReimb || 0).toLocaleString()}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Rebates</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">${(rebates || 0).toLocaleString()}</div>
            </div>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-600">Need to tweak something? You can always return after launching the dashboard.</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Button
                type="button"
                disabled={!canContinue}
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
                className="gap-2 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-sky-400 px-8 py-3 text-base font-semibold text-slate-900 shadow-[0_18px_40px_rgba(45,212,191,0.45)] transition hover:opacity-90 disabled:cursor-not-allowed"
              >
                Launch dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
              {!canContinue ? (
                <span className="text-xs text-slate-500">Fill in required amounts to continue.</span>
              ) : (
                <span className="text-xs text-emerald-600">Looks good—ready when you are.</span>
              )}
            </div>
          </div>
        </GlassCard>
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
  </TooltipProvider>
  );
}
