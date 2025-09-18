'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';

// Development-only logging utility
const isDev = process.env.NODE_ENV === 'development';
const devLog = (...args: any[]) => isDev && console.log(...args);
const devError = (...args: any[]) => isDev && console.error(...args);
const devWarn = (...args: any[]) => isDev && console.warn(...args);
import { motion, AnimatePresence } from 'framer-motion';
import DualCSVLoader from '@components/loaders/DualCSVLoader';
import {
  EChartsEnterpriseChart,
  HCCDataTable,
  LazyChartWrapper
} from '@components/charts/LazyCharts';
import FinancialDataTable from '@components/data/FinancialDataTable';
import { Dashboard } from './components/ui/dashboard';
import PerformanceMonitor from '@components/PerformanceMonitor';
import { GlassCard } from '@components/ui/glass-card';
import PlanPerformanceTiles from '@components/dashboard/PlanPerformanceTiles';
import KPITiles from '@components/dashboard/KPITiles';

// Helper function for numeric parsing
const num = (val: unknown): number => {
  if (typeof val === 'number') return isFinite(val) ? val : 0;
  if (val == null) return 0;
  const n = parseFloat(String(val).replace(/[$,\s]/g, ''));
  return isFinite(n) ? n : 0;
};

const normalizeMonthKey = (value: unknown): string | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear();
    const month = value.getUTCMonth() + 1;
    return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`;
  }

  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const yM = trimmed.match(/^(\d{4})[-\/]?(\d{1,2})$/);
  if (yM) {
    const year = Number.parseInt(yM[1], 10);
    const month = Number.parseInt(yM[2], 10);
    if (month >= 1 && month <= 12) {
      return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`;
    }
  }

  const mY = trimmed.match(/^([01]?\d)[-/](\d{4})$/);
  if (mY) {
    const month = Number.parseInt(mY[1], 10);
    const year = Number.parseInt(mY[2], 10);
    if (month >= 1 && month <= 12) {
      return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`;
    }
  }

  const ymd = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymd) {
    const year = Number.parseInt(ymd[1], 10);
    const month = Number.parseInt(ymd[2], 10);
    if (month >= 1 && month <= 12) {
      return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`;
    }
  }

  const monthText = trimmed.match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (monthText) {
    const parsed = new Date(`${monthText[1]} 1, ${monthText[2]}`);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getUTCFullYear().toString().padStart(4, '0')}-${(parsed.getUTCMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
    }
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getUTCFullYear().toString().padStart(4, '0')}-${(parsed.getUTCMonth() + 1)
      .toString()
      .padStart(2, '0')}`;
  }

  return null;
};
import { LottieLoader } from '@components/ui/lottie-loader';
import { DateRangeSelection, filterRowsByRange } from '@/app/utils/dateRange';
import { TabsContent } from '@components/ui/tabs';
import { ParsedCSVData } from '@components/loaders/CSVLoader';
import { secureHealthcareStorage } from '@/app/lib/SecureHealthcareStorage';
import { useAutoAnimateCards } from '@/app/hooks/useAutoAnimate';
import { Bell, Users, DollarSign, TrendingUp, Activity } from 'lucide-react';
import CommandPalette from '@components/navigation/CommandPalette';
import KeyboardShortcuts from '@components/navigation/KeyboardShortcuts';
import { AccessibleErrorBoundary } from '@components/accessibility/AccessibilityEnhancements';
import GooeyFilter from '@components/loaders/GooeyFilter';
import MotionCard from '@components/MotionCard';
import FeesConfigurator, { FeesConfig } from '@components/forms/FeesConfigurator';
import { parseNumericValue } from '@utils/chartDataProcessors';
import DashboardLayout from '@components/dashboard/DashboardLayout';

const Home: React.FC = () => {
  const chartsGridRef = useAutoAnimateCards<HTMLDivElement>();
  const [showDashboard, setShowDashboard] = useState(false);
  const [budgetData, setBudgetData] = useState<ParsedCSVData | null>(null);
  const [claimsData, setClaimsData] = useState<ParsedCSVData | null>(null);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeSelection>({ preset: '12M' });
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [showFeesForm, setShowFeesForm] = useState(false);
  const [feesConfig, setFeesConfig] = useState<FeesConfig | null>(null);
  
  // HIPAA-aligned hydration: use in-memory token reference (no PHI in localStorage)
  useEffect(() => {
    try {
      const saved = secureHealthcareStorage.retrieve<{ budgetData?: ParsedCSVData; claimsData?: ParsedCSVData }>('dashboardData');
      if (saved?.budgetData && saved?.claimsData) {
        setBudgetData(saved.budgetData);
        setClaimsData(saved.claimsData);
        setShowDashboard(true);
      }
    } catch (e) {
      devError('Secure storage hydration failed', e);
    }
  }, []);
  
  // Refs for timeout cleanup
  const timeoutRefs = useRef<{
    loadingTimeout: ReturnType<typeof setTimeout> | null;
    successTimeout: ReturnType<typeof setTimeout> | null;
  }>({
    loadingTimeout: null,
    successTimeout: null
  });

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRefs.current.loadingTimeout) {
        clearTimeout(timeoutRefs.current.loadingTimeout);
      }
      if (timeoutRefs.current.successTimeout) {
        clearTimeout(timeoutRefs.current.successTimeout);
      }
    };
  }, []);

  const handleBothFilesLoaded = (budget: ParsedCSVData, claims: ParsedCSVData) => {
    devLog('[CSV FLOW] handleBothFilesLoaded called with:', {
      budgetHeaders: budget?.headers,
      budgetRows: budget?.rowCount,
      claimsHeaders: claims?.headers, 
      claimsRows: claims?.rowCount
    });
    
    try {
      setIsLoading(true);
      
      // Clear any existing timeouts
      if (timeoutRefs.current.loadingTimeout) {
        clearTimeout(timeoutRefs.current.loadingTimeout);
      }
      if (timeoutRefs.current.successTimeout) {
        clearTimeout(timeoutRefs.current.successTimeout);
      }
      
      timeoutRefs.current.loadingTimeout = setTimeout(async () => {
        try {
          devLog('[CSV FLOW] Processing data for dashboard...');
          
          // Validate data before setting state
          if (!budget || !budget.rows || budget.rows.length === 0) {
            throw new Error('Budget data is empty or invalid');
          }
          if (!claims || !claims.rows || claims.rows.length === 0) {
            throw new Error('Claims data is empty or invalid');
          }
          
          devLog('[CSV FLOW] Setting budget data...');
          setBudgetData(budget);
          devLog('[CSV FLOW] Setting claims data...');
          setClaimsData(claims);
          
          try {
            devLog('[SecureHealthcareStorage] Storing data securely...');
            await secureHealthcareStorage.storeTemporary('dashboardData', {
              budgetData: budget,
              claimsData: claims,
              savedAt: new Date().toISOString(),
            });
            devLog('[SecureHealthcareStorage] Data stored successfully');
          } catch (storageError) {
            devWarn('[SecureHealthcareStorage] Storage failed (non-critical):', storageError);
          }
          
          setIsLoading(false);
          setShowSuccess(true);
          devLog('[CSV FLOW] Success animation started');
          
          timeoutRefs.current.successTimeout = setTimeout(() => {
            try {
              devLog('[CSV FLOW] Transitioning to fees configuration view...');
              setShowFeesForm(true);
              setShowSuccess(false);
              setError(''); // Clear any previous errors
              devLog('[CSV FLOW] Dashboard transition complete');
              timeoutRefs.current.successTimeout = null;
            } catch (transitionError) {
              devError('[CSV FLOW] Dashboard transition failed:', transitionError);
              setError(`Dashboard transition failed: ${transitionError instanceof Error ? transitionError.message : 'Unknown error'}`);
            }
          }, 1500);
          
          timeoutRefs.current.loadingTimeout = null;
        } catch (processingError) {
          devError('[CSV FLOW] Data processing failed:', processingError);
          setIsLoading(false);
          setShowSuccess(false);
          setError(`Data processing failed: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`);
          timeoutRefs.current.loadingTimeout = null;
        }
      }, 1000);
    } catch (outerError) {
      devError('[CSV FLOW] Critical error in handleBothFilesLoaded:', outerError);
      setError(`Critical error: ${outerError instanceof Error ? outerError.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    devError(errorMessage);
  };

  const handleReset = () => {
    setShowDashboard(false);
    setShowFeesForm(false);
    setBudgetData(null);
    setClaimsData(null);
    setError('');
    try {
      secureHealthcareStorage.clear('dashboardData');
      secureHealthcareStorage.clear('dashboardFees');
    } catch {}
  };

  // Handle fees form submit
  const handleFeesSubmit = async (config: FeesConfig, computed: { monthlyFixed: number; monthlyBudget: number }) => {
    setFeesConfig(config);
    try {
      await secureHealthcareStorage.storeTemporary('dashboardFees', { config, computed, savedAt: new Date().toISOString() });
    } catch {}
    setShowFeesForm(false);
    setShowDashboard(true);
  };

  // Advanced component handlers
  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'light' : 'dark');
  };

  const handleExport = (format: string) => {
    devLog(`Exporting data as ${format}`);
    // Implementation would depend on the selected format
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };


  // Build ordered month labels from budget data
  const monthsTimeline: string[] = (budgetData?.rows || []).map((r: Record<string, string>) => String(r.month || r.Month || r.period || r.Period || ''));

  // Filtered datasets by selected range
  const filteredBudget = filterRowsByRange(budgetData?.rows || [], monthsTimeline, dateRange);

  // Apply computed overrides from fees form when present
  const effectiveBudget = React.useMemo(() => {
    if (!feesConfig) return filteredBudget;

    const monthlyFromBasis = (amount: number, basis: string, employees: number, members: number) => {
      switch (basis) {
        case 'PMPM':
          return amount * Math.max(0, Math.floor(members));
        case 'PEPM':
          return amount * Math.max(0, Math.floor(employees));
        case 'Annual':
          return amount / 12;
        case 'Monthly':
        default:
          return amount;
      }
    };

    const rows = (filteredBudget || []) as Record<string, unknown>[];
    devLog('[EFFECTIVE BUDGET] Processing rows with feesConfig:', feesConfig);
    devLog('[EFFECTIVE BUDGET] First row field names:', Object.keys(rows[0] || {}));

    return rows.map((row) => {
      const rowEmployees = parseNumericValue(row['Employee Count'] as any) || parseNumericValue(row['Employees'] as any) || 0;
      const rowMembers =
        parseNumericValue(row['Member Count'] as any) ||
        parseNumericValue(row['Enrollment'] as any) ||
        parseNumericValue(row['Total Enrollment'] as any) ||
        0;

      const rawMonth =
        row['month'] ||
        row['Month'] ||
        row['period'] ||
        row['Period'] ||
        row['Month Label'] ||
        row['Period Label'];
      const monthKey = normalizeMonthKey(rawMonth);
      const monthOverrides = monthKey ? feesConfig.perMonth?.[monthKey] : undefined;
      const feeOverrides = monthOverrides?.fees || {};

      const effectiveFeeEntries = (feesConfig.fees || []).map((fee) => {
        const override = feeOverrides?.[fee.id];
        const merged = override ? { ...fee, ...override } : fee;
        const monthlyAmount = monthlyFromBasis(merged.amount || 0, merged.basis as string, rowEmployees, rowMembers);
        return { fee: merged, monthlyAmount };
      });

      const totalFixedCosts = effectiveFeeEntries.reduce((sum, entry) => sum + entry.monthlyAmount, 0);
      const findMonthlyFeeAmount = (predicate: (label: string) => boolean) => {
        const entry = effectiveFeeEntries.find(({ fee }) => predicate(fee.label.toLowerCase()));
        return entry ? entry.monthlyAmount : 0;
      };

      const adminFees = findMonthlyFeeAmount((label) => label.includes('admin'));
      const tpaFees = findMonthlyFeeAmount((label) => label.includes('tpa'));
      const stopLossPremium = findMonthlyFeeAmount((label) => label.includes('stop loss'));

      const fallbackBudget = num(row['Budget'] ?? row['Computed Budget'] ?? row['budget'] ?? 0);
      const budgetSource = monthOverrides?.budgetOverride ?? feesConfig.budgetOverride;
      const budget = budgetSource
        ? monthlyFromBasis(budgetSource.amount || 0, budgetSource.basis, rowEmployees, rowMembers)
        : fallbackBudget;

      const fallbackStopLossReimb = num(
        row['Stop Loss Reimbursements'] ?? row['Computed Stop Loss Reimb'] ?? row['stop_loss_reimb'] ?? 0
      );
      const stopLossReimb = monthOverrides?.stopLossReimb ?? (feesConfig.stopLossReimb ?? fallbackStopLossReimb);

      const fallbackRebates = num(row['Rx Rebates'] ?? row['Computed Rebates'] ?? row['pharmacy_rebates'] ?? 0);
      const rebates = monthOverrides?.rebates ?? (feesConfig.rebates ?? fallbackRebates);

      const medicalClaims =
        parseNumericValue(row['medicalClaims'] as any) ||
        parseNumericValue(row['Medical Claims'] as any) ||
        parseNumericValue(row['medical_claims'] as any) ||
        parseNumericValue(row['Medical'] as any) ||
        parseNumericValue(row['medical'] as any) ||
        parseNumericValue(row['Med Claims'] as any) ||
        0;

      const pharmacyClaims =
        parseNumericValue(row['rxClaims'] as any) ||
        parseNumericValue(row['Pharmacy Claims'] as any) ||
        parseNumericValue(row['pharmacy_claims'] as any) ||
        parseNumericValue(row['Rx Claims'] as any) ||
        parseNumericValue(row['Pharmacy'] as any) ||
        parseNumericValue(row['pharmacy'] as any) ||
        parseNumericValue(row['Rx'] as any) ||
        parseNumericValue(row['rx'] as any) ||
        0;

      devLog('[CLAIMS DATA]', row['month'] || row['Month'], 'Medical:', medicalClaims, 'Pharmacy:', pharmacyClaims);

      const totalExpenses = medicalClaims + pharmacyClaims + totalFixedCosts;
      const totalRevenues = stopLossReimb + rebates;
      const netCost = totalExpenses - totalRevenues;
      const variance = budget - netCost;
      const variancePercent = budget > 0 ? (variance / budget) * 100 : 0;

      return {
        ...row,
        'Fixed Costs': totalFixedCosts,
        'Admin Fees': adminFees,
        'TPA Fee': tpaFees,
        'Stop Loss Premium': stopLossPremium,
        Budget: budget,
        'Stop Loss Reimbursements': stopLossReimb,
        'Rx Rebates': rebates,
        pharmacy_rebates: rebates,
        'Total Expenses': totalExpenses,
        'Total Revenues': totalRevenues,
        'Net Cost': netCost,
        Variance: variance,
        'Variance %': variancePercent,
        'Medical Claims': medicalClaims,
        'Pharmacy Claims': pharmacyClaims,
        medical_claims: medicalClaims,
        pharmacy_claims: pharmacyClaims,
        'Computed Fixed Cost': totalFixedCosts,
        'Computed Budget': budget,
        'Computed Stop Loss Reimb': stopLossReimb,
        'Computed Rebates': rebates
      };
    });
  }, [filteredBudget, feesConfig]);
  const filteredClaims = filterRowsByRange(claimsData?.rows || [], monthsTimeline, dateRange);

  return (
    <>
      {emergencyMode && (
        <div className="fixed top-0 inset-x-0 z-50 bg-red-600 text-white text-center py-2 text-sm">
          Emergency Mode Active
        </div>
      )}
      <GooeyFilter />
      <AnimatePresence mode="wait">
        {!showDashboard ? (
          <motion.div
            key="uploader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            {!showFeesForm ? (
              <DualCSVLoader
                onBothFilesLoaded={handleBothFilesLoaded}
                onError={handleError}
              />
            ) : (
              <FeesConfigurator
                defaultEmployees={parseNumericValue((budgetData?.rows || []).slice(-1)[0]?.['Employee Count'] as any) || 0}
                defaultMembers={parseNumericValue((budgetData?.rows || []).slice(-1)[0]?.['Member Count'] as any) || parseNumericValue((budgetData?.rows || []).slice(-1)[0]?.['Enrollment'] as any) || 0}
                defaultBudget={parseNumericValue((budgetData?.rows || []).slice(-1)[0]?.['Budget'] as any) || 0}
                csvData={budgetData?.rows || []}
                onSubmit={handleFeesSubmit}
              />
            )}
            
            {/* Premium Loading Animation */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
              >
                <GlassCard variant="elevated" className="p-12 text-center max-w-md">
                  <LottieLoader type="pulse" size="xl" />
                  <h3 className="mt-6 text-xl font-semibold text-[var(--foreground)]">
                    Processing your data
                  </h3>
                  <p className="mt-2 text-[var(--foreground-muted)]">
                    Applying premium analytics transformations...
                  </p>
                </GlassCard>
              </motion.div>
            )}
            
            {/* Premium Success Animation */}
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
              >
                <GlassCard variant="vibrant" glow className="p-12 text-center max-w-md">
                  <LottieLoader type="success" size="xl" />
                  <h3 className="mt-6 text-xl font-semibold text-[var(--foreground)]">
                    Analytics Ready!
                  </h3>
                  <p className="mt-2 text-[var(--foreground-muted)]">
                    Your premium dashboard is now live
                  </p>
                </GlassCard>
              </motion.div>
            )}
            
            {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-8 right-8 bg-[var(--surface-elevated)] border border-[var(--surface-border)] rounded-xl p-4 max-w-md shadow-[var(--card-base-shadow)]"
            >
              <p className="text-[var(--foreground)] font-semibold">Error</p>
              <p className="text-[var(--foreground-muted)] text-sm mt-1">{error}</p>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <Suspense fallback={<div className="p-8 text-[var(--foreground-muted)]">Loading analytics...</div>}>
          <AccessibleErrorBoundary>
            <DashboardLayout
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onThemeToggle={handleThemeToggle}
              onExport={handleExport}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              debugMode={debugMode}
              emergencyMode={emergencyMode}
              monthsTimeline={monthsTimeline}
              budgetData={budgetData}
              claimsData={claimsData}
              onReset={handleReset}
              onDebugToggle={() => setDebugMode(!debugMode)}
            >
              {/* Page Content */}
              <AnimatePresence mode="wait">
                {(currentPage === 'table' || currentPage === 'dashboard') ? (
                  <motion.div
                    key="table-page"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FinancialDataTable 
                      budgetData={effectiveBudget} 
                      claimsData={filteredClaims}
                    />
                  </motion.div>
                ) : currentPage === 'report' ? (
                  <motion.div
                    key="report-page"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* KPI Tiles - Top Level Metrics */}
                    <KPITiles 
                      metrics={{
                        pctOfBudget: (() => {
                          const totalBudget = effectiveBudget.reduce((sum, r) => sum + num(r['Budget'] || r['Computed Budget'] || 0), 0);
                          const totalCost = effectiveBudget.reduce((sum, r) => {
                            const medical = num(r['Medical Claims'] || r['medical_claims'] || 0);
                            const pharmacy = num(r['Pharmacy Claims'] || r['pharmacy_claims'] || 0);
                            const admin = num(r['Admin Fees'] || r['admin_fees'] || 0);
                            const stopLoss = num(r['Stop Loss Premium'] || r['stop_loss_premium'] || 0);
                            const reimb = num(r['Stop Loss Reimbursements'] || r['stop_loss_reimb'] || 0);
                            const rebates = num(r['Rx Rebates'] || r['pharmacy_rebates'] || 0);
                            return sum + medical + pharmacy + admin + stopLoss - reimb - rebates;
                          }, 0);
                          return totalBudget > 0 ? (totalCost / totalBudget) * 100 : 0;
                        })(),
                        totalBudget: effectiveBudget.reduce((sum, r) => sum + num(r['Budget'] || r['Computed Budget'] || 0), 0),
                        totalPlanCost: effectiveBudget.reduce((sum, r) => {
                          const medical = num(r['Medical Claims'] || r['medical_claims'] || 0);
                          const pharmacy = num(r['Pharmacy Claims'] || r['pharmacy_claims'] || 0);
                          const admin = num(r['Admin Fees'] || r['admin_fees'] || 0);
                          const stopLoss = num(r['Stop Loss Premium'] || r['stop_loss_premium'] || 0);
                          const reimb = num(r['Stop Loss Reimbursements'] || r['stop_loss_reimb'] || 0);
                          const rebates = num(r['Rx Rebates'] || r['pharmacy_rebates'] || 0);
                          return sum + medical + pharmacy + admin + stopLoss - reimb - rebates;
                        }, 0),
                        surplus: (() => {
                          const totalBudget = effectiveBudget.reduce((sum, r) => sum + num(r['Budget'] || r['Computed Budget'] || 0), 0);
                          const totalCost = effectiveBudget.reduce((sum, r) => {
                            const medical = num(r['Medical Claims'] || r['medical_claims'] || 0);
                            const pharmacy = num(r['Pharmacy Claims'] || r['pharmacy_claims'] || 0);
                            const admin = num(r['Admin Fees'] || r['admin_fees'] || 0);
                            const stopLoss = num(r['Stop Loss Premium'] || r['stop_loss_premium'] || 0);
                            const reimb = num(r['Stop Loss Reimbursements'] || r['stop_loss_reimb'] || 0);
                            const rebates = num(r['Rx Rebates'] || r['pharmacy_rebates'] || 0);
                            return sum + medical + pharmacy + admin + stopLoss - reimb - rebates;
                          }, 0);
                          return totalBudget - totalCost;
                        })(),
                        planCostPEPM: (() => {
                          const totalMembers = effectiveBudget.reduce((sum, r) => sum + num(r['Member Count'] || r['Enrollment'] || r['members'] || 0), 0);
                          const totalCost = effectiveBudget.reduce((sum, r) => {
                            const medical = num(r['Medical Claims'] || r['medical_claims'] || 0);
                            const pharmacy = num(r['Pharmacy Claims'] || r['pharmacy_claims'] || 0);
                            const admin = num(r['Admin Fees'] || r['admin_fees'] || 0);
                            const stopLoss = num(r['Stop Loss Premium'] || r['stop_loss_premium'] || 0);
                            const reimb = num(r['Stop Loss Reimbursements'] || r['stop_loss_reimb'] || 0);
                            const rebates = num(r['Rx Rebates'] || r['pharmacy_rebates'] || 0);
                            return sum + medical + pharmacy + admin + stopLoss - reimb - rebates;
                          }, 0);
                          return totalMembers > 0 ? totalCost / totalMembers : 0;
                        })(),
                        budgetPEPM: (() => {
                          const totalMembers = effectiveBudget.reduce((sum, r) => sum + num(r['Member Count'] || r['Enrollment'] || r['members'] || 0), 0);
                          const totalBudget = effectiveBudget.reduce((sum, r) => sum + num(r['Budget'] || r['Computed Budget'] || 0), 0);
                          return totalMembers > 0 ? totalBudget / totalMembers : 0;
                        })(),
                        netPaidPEPM: (() => {
                          const totalMembers = effectiveBudget.reduce((sum, r) => sum + num(r['Member Count'] || r['Enrollment'] || r['members'] || 0), 0);
                          const netPaid = effectiveBudget.reduce((sum, r) => {
                            const medical = num(r['Medical Claims'] || r['medical_claims'] || 0);
                            const pharmacy = num(r['Pharmacy Claims'] || r['pharmacy_claims'] || 0);
                            const reimb = num(r['Stop Loss Reimbursements'] || r['stop_loss_reimb'] || 0);
                            const rebates = num(r['Rx Rebates'] || r['pharmacy_rebates'] || 0);
                            return sum + medical + pharmacy - reimb - rebates;
                          }, 0);
                          return totalMembers > 0 ? netPaid / totalMembers : 0;
                        })(),
                        members: effectiveBudget.reduce((sum, r) => sum + num(r['Member Count'] || r['Enrollment'] || r['members'] || 0), 0)
                      }}
                      period={dateRange.preset === '12M' ? 'Rolling 12 Months' : dateRange.preset || 'Custom Period'}
                    />

                    {/* Plan Performance Tiles - Comprehensive Visualizations */}
                    <PlanPerformanceTiles 
                      data={effectiveBudget}
                      commentaryTitle="Keenan Reporting Dashboard"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="default-page"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center h-96"
                  >
                    <p className="text-[var(--foreground-muted)]">Select a page from the sidebar</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </DashboardLayout>
          </AccessibleErrorBoundary>
        </Suspense>
      )}
    </AnimatePresence>
      {/* Performance Monitoring */}
      <PerformanceMonitor />
      
      {/* Command Palette - ⌘K Modern Treasury Pattern */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNavigate={handleNavigate}
        onExport={handleExport}
        onThemeToggle={handleThemeToggle}
      />
      
      {/* Keyboard Shortcuts System */}
      <KeyboardShortcuts
        onNavigate={handleNavigate}
        onExport={handleExport}
        onThemeToggle={handleThemeToggle}
        onCommandPaletteOpen={() => setCommandPaletteOpen(true)}
        onEmergencyMode={() => {
          devLog('[Shortcuts] Emergency mode activated via Ctrl/⌘+Shift+E');
          setEmergencyMode(true);
          setTimeout(() => setEmergencyMode(false), 4000);
        }}
        onPatientSearch={() => {
          devLog('[Shortcuts] Patient search invoked via Ctrl/⌘+P');
          setCommandPaletteOpen(true);
        }}
      />
    </>
  );
};

export default Home;
