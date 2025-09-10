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
import PremiumEnrollmentChart from '@components/charts/PremiumEnrollmentChart';
import FinancialDataTable from '@components/data/FinancialDataTable';
import { Dashboard } from './components/ui/dashboard';
import PerformanceMonitor from '@components/PerformanceMonitor';
import EnterpriseDataExport from '@components/data/EnterpriseDataExport';
import { ThemeToggle } from '@components/ui/theme-toggle';
import { GlassCard } from '@components/ui/glass-card';
import { PremiumDashboardCard } from '@components/ui/premium-dashboard-card';
import { AnimatedNumber } from '@components/ui/animated-number';
import { LottieLoader } from '@components/ui/lottie-loader';
import { Button } from '@components/ui/button';
import { DateRangeSelection, filterRowsByRange } from '@/app/utils/dateRange';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/ui/tabs';
import SoftDropdown from '@components/ui/soft-dropdown';
import DateRangeDropdown from '@components/ui/date-range-dropdown';
import { ParsedCSVData } from '@components/loaders/CSVLoader';
import { secureHealthcareStorage } from '@/app/lib/SecureHealthcareStorage';
import { useAutoAnimateCards } from '@/app/hooks/useAutoAnimate';
import { RotateCcw, Table, BarChart3, Bell, Users, DollarSign, TrendingUp, Activity } from 'lucide-react';
import CommandPalette from '@components/navigation/CommandPalette';
import KeyboardShortcuts from '@components/navigation/KeyboardShortcuts';
import { AccessibleErrorBoundary } from '@components/accessibility/AccessibilityEnhancements';
import GooeyFilter from '@components/loaders/GooeyFilter';
import MotionCard from '@components/MotionCard';
import FeesConfigurator, { FeesConfig } from '@components/forms/FeesConfigurator';
import { parseNumericValue } from '@utils/chartDataProcessors';

const Home: React.FC = () => {
  const chartsGridRef = useAutoAnimateCards<HTMLDivElement>();
  const navigationRef = useAutoAnimateCards<HTMLDivElement>();
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

  // Quick navigation items for soft dropdown (dashboard views)
  const quickNavItems = [
    { id: 'dashboard', label: 'Dashboard', description: 'Summary tiles & metrics' },
    { id: 'table', label: 'Financial Table', description: 'Browse raw financial data' },
    { id: 'charts', label: 'Charts & Analytics', description: 'Visualize trends' },
  ];

  // Build ordered month labels from budget data
  const monthsTimeline: string[] = (budgetData?.rows || []).map((r: Record<string, string>) => String(r.month || r.Month || r.period || r.Period || ''));

  // Filtered datasets by selected range
  const filteredBudget = filterRowsByRange(budgetData?.rows || [], monthsTimeline, dateRange);

  // Apply computed overrides from fees form when present
  const effectiveBudget = React.useMemo(() => {
    if (!feesConfig) return filteredBudget;
    const employees = feesConfig.employees || 0;
    const members = feesConfig.members || 0;
    const monthlyFromBasis = (amount: number, basis: string) => {
      switch (basis) {
        case 'PMPM': return amount * Math.max(0, Math.floor(members));
        case 'PEPM': return amount * Math.max(0, Math.floor(employees));
        case 'Annual': return amount / 12;
        case 'Monthly':
        default: return amount;
      }
    };
    const monthlyFixed = (feesConfig.fees || []).reduce((sum, f) => sum + monthlyFromBasis(f.amount || 0, f.basis), 0);
    const monthlyBudget = feesConfig.budgetOverride ? monthlyFromBasis(feesConfig.budgetOverride.amount || 0, feesConfig.budgetOverride.basis) : 0;
    const reimb = feesConfig.stopLossReimb || 0;
    return (filteredBudget || []).map((row: any) => ({
      ...row,
      'Computed Fixed Cost': monthlyFixed,
      'Computed Budget': monthlyBudget > 0 ? monthlyBudget : row['Budget'] || row['budget'] || 0,
      'Computed Stop Loss Reimb': reimb,
    }));
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
                  <h3 className="mt-6 text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Processing your data
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
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
                  <h3 className="mt-6 text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Analytics Ready!
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Your premium dashboard is now live
                  </p>
                </GlassCard>
              </motion.div>
            )}
            
            {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-8 right-8 bg-gray-100 border border-gray-400 rounded-lg p-4 max-w-md"
            >
              <p className="text-gray-800 font-medium">Error</p>
              <p className="text-gray-700 text-sm mt-1">{error}</p>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <Suspense fallback={<div className="p-8 text-gray-600">Loading analytics...</div>}>
          <AccessibleErrorBoundary>
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen bg-gray-50 p-6"
            >
              {/* Header */}
              <div className="max-w-7xl mx-auto mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-8 bg-black"
                  style={{ borderRadius: 'var(--radius-full)' }}
                />
                <motion.h1
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-3xl font-bold text-black font-heading"
                >
                  Keenan Reporting Dashboard
                </motion.h1>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <DateRangeDropdown months={monthsTimeline} value={dateRange} onChange={setDateRange} />
                {/* Debug Mode Toggle */}
                <Button
                  onClick={() => setDebugMode(!debugMode)}
                  variant={debugMode ? "default" : "soft"}
                  size="sm"
                  className="shadow-sm"
                  title="Toggle debug mode for detailed error information"
                >
                  🐛 Debug
                </Button>
                {/* Soft gray quick navigation dropdown */}
                <SoftDropdown
                  label="Quick Navigate"
                  items={quickNavItems}
                  selectedId={currentPage}
                  onSelect={handleNavigate}
                />
                <Button asChild variant="soft" className="shadow-sm">
                  <Link href="/demos">Demos</Link>
                </Button>
                <Button
                  onClick={handleReset}
                  className="shadow-lg"
                  variant="default"
                  size="default"
                >
                  <RotateCcw className="w-4 h-4" />
                  Upload New Data
                </Button>
              </div>
            </div>
            
            {/* Page Navigation Tabs and Export Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Map 'dashboard' to 'table' to keep Radix Tabs value valid */}
              <Tabs value={currentPage === 'dashboard' ? 'table' : currentPage} onValueChange={setCurrentPage} className="w-fit">
                <TabsList ref={navigationRef}>
                  <TabsTrigger value="table" className="flex items-center gap-2">
                    <Table className="w-4 h-4" />
                    Financial Table
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Charts & Analytics
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Enterprise Data Export */}
              <div className="flex-shrink-0">
                <EnterpriseDataExport 
                  data={{
                    budgetData: budgetData?.rows,
                    claimsData: claimsData?.rows,
                    metrics: {
                      totalBudgetRecords: budgetData?.rows?.length || 0,
                      totalClaimsRecords: claimsData?.rows?.length || 0,
                      lastUpdated: new Date().toISOString()
                    }
                  }}
                  title="Healthcare Analytics Dashboard Data"
                />
              </div>
            </div>

            {/* Debug Panel */}
            {debugMode && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-600 font-semibold">🐛 Debug Mode Active</span>
                  <button
                    onClick={() => console.clear()}
                    className="text-xs bg-yellow-100 hover:bg-yellow-200 px-2 py-1 rounded"
                  >
                    Clear Console
                  </button>
                </div>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p><strong>Budget Data:</strong> {budgetData?.rowCount || 0} rows, {budgetData?.headers?.length || 0} columns</p>
                  <p><strong>Claims Data:</strong> {claimsData?.rowCount || 0} rows, {claimsData?.headers?.length || 0} columns</p>
                  <p><strong>Date Filter:</strong> {dateRange.preset || 'Custom'}</p>
                  <p><strong>Current Page:</strong> {currentPage}</p>
                  {budgetData?.headers && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-medium">Budget Headers</summary>
                      <p className="text-xs mt-1 font-mono bg-yellow-100 p-2 rounded">
                        {budgetData.headers.join(', ')}
                      </p>
                    </details>
                  )}
                  {claimsData?.headers && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-medium">Claims Headers</summary>
                      <p className="text-xs mt-1 font-mono bg-yellow-100 p-2 rounded">
                        {claimsData.headers.join(', ')}
                      </p>
                    </details>
                  )}
                </div>
              </motion.div>
            )}

            {/* Main Content Area */}
            <div className="p-8">
              {/* Premium Dashboard Summary Tiles */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <PremiumDashboardCard
                  title="Total Budget"
                  value={(effectiveBudget || []).reduce((sum: number, row: any) => sum + (parseNumericValue((row['Computed Budget'] as any) ?? (row['Budget'] as any)) || 0), 0) || 0}
                  format="currency"
                  icon={DollarSign}
                  variant="premium"
                  trend="up"
                  trendValue={8.2}
                  subtitle="Monthly allocation"
                />
                <PremiumDashboardCard
                  title="Active Members"
                  value={filteredBudget?.reduce((sum, row) => sum + (parseInt(row['Employee Count']) || 0), 0) || 0}
                  format="number"
                  icon={Users}
                  variant="success"
                  trend="up"
                  trendValue={3.1}
                  subtitle="Current enrollment"
                />
                <PremiumDashboardCard
                  title="Claims Processed"
                  value={filteredClaims?.length || 0}
                  format="compact"
                  icon={Activity}
                  variant="default"
                  trend="up"
                  trendValue={12.4}
                  subtitle="This period"
                />
                <PremiumDashboardCard
                  title="Loss Ratio"
                  value={85.6}
                  format="percentage"
                  decimals={1}
                  icon={TrendingUp}
                  variant="warning"
                  trend="down"
                  trendValue={2.3}
                  subtitle="Claims vs premium"
                />
              </div>

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
                ) : currentPage === 'charts' || currentPage === 'analytics' ? (
                  <motion.div
                    key="charts-page"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    ref={chartsGridRef}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                {/* Tile 1: Enterprise Budget vs Expenses Chart with ECharts WebGL */}
                <MotionCard delay={0.1}>
                  <LazyChartWrapper chartName="Enterprise Budget vs Expenses">
                    <EChartsEnterpriseChart 
                      data={effectiveBudget} 
                      rollingMonths={effectiveBudget.length}
                      enableWebGL={true}
                      streamingData={true}
                      maxDataPoints={10000}
                    />
                  </LazyChartWrapper>
                </MotionCard>

                {/* Tile 2: Claims Analytics Preview */}
                <MotionCard delay={0.2}>
                  <GlassCard variant="elevated" className="p-6 h-[400px] flex flex-col justify-center text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold mb-2">Claims Analytics</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Advanced claims breakdown analysis coming soon</p>
                  </GlassCard>
                </MotionCard>

                {/* Tile 3: Medical Claims Preview */}
                <MotionCard delay={0.3}>
                  <GlassCard variant="elevated" className="p-6 h-[400px] flex flex-col justify-center text-center">
                    <div className="text-6xl mb-4">🏥</div>
                    <h3 className="text-lg font-semibold mb-2">Medical Claims</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Medical claims breakdown visualization coming soon</p>
                  </GlassCard>
                </MotionCard>

                {/* Tile 4: Cost Analysis Preview */}
                <MotionCard delay={0.4}>
                  <GlassCard variant="elevated" className="p-6 h-[400px] flex flex-col justify-center text-center">
                    <div className="text-6xl mb-4">💰</div>
                    <h3 className="text-lg font-semibold mb-2">Cost Analysis</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cost band scatter analysis coming soon</p>
                  </GlassCard>
                </MotionCard>

                {/* Tile 5: Premium Enrollment Chart */}
                <PremiumEnrollmentChart 
                  data={effectiveBudget} 
                  rollingMonths={effectiveBudget.length}
                />

                {/* Tile 6: Geographic Analytics Preview */}
                <MotionCard delay={0.6}>
                  <GlassCard variant="elevated" className="p-6 h-[400px] flex flex-col justify-center text-center">
                    <div className="text-6xl mb-4">🌍</div>
                    <h3 className="text-lg font-semibold mb-2">Geographic Analytics</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Domestic vs non-domestic analysis coming soon</p>
                  </GlassCard>
                </MotionCard>

                {/* Tile 7: HCC Data Table */}
                <MotionCard delay={0.7}>
                  <LazyChartWrapper chartName="HCC Data Table">
                    <HCCDataTable data={filteredClaims} />
                  </LazyChartWrapper>
                </MotionCard>
                </motion.div>
                ) : (
                  <motion.div
                    key="default-page"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center h-96"
                  >
                    <p className="text-gray-500">Select a page from the sidebar</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
              </div>
            </motion.div>
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
