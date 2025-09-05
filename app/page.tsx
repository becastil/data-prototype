'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import DualCSVLoader from '@components/loaders/DualCSVLoader';
import {
  EChartsEnterpriseChart,
  ClaimsBreakdownChart,
  MedicalClaimsBreakdownChart,
  CostBandScatterChart,
  MUIEnrollmentChart,
  DomesticVsNonDomesticChart,
  HCCDataTable,
  LazyChartWrapper
} from '@components/charts/LazyCharts';
import FinancialDataTable from '@components/data/FinancialDataTable';
import { Dashboard } from './components/ui/dashboard';
import PerformanceMonitor from '@components/PerformanceMonitor';
import EnterpriseDataExport from '@components/data/EnterpriseDataExport';
import { ThemeToggle } from '@components/ui/theme-toggle';
import GooeyFilter from '@components/loaders/GooeyFilter';
import RiveLoader from '@components/loaders/RiveLoader';
import MetaballSuccess from '@components/loaders/MetaballSuccess';
import RiveSuccess from '@components/loaders/RiveSuccess';
import MotionButton from '@components/MotionButton';
import MotionCard from '@components/MotionCard';
import { Button } from '@components/ui/button';
import SoftDropdown from '@components/ui/soft-dropdown';
import AnimatedVariantsMenu from '@components/navigation/AnimatedVariantsMenu';
import DateRangeDropdown from '@components/ui/date-range-dropdown';
import { DateRangeSelection, filterRowsByRange } from '@/app/utils/dateRange';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/ui/tabs';
// Removed unused imports to reduce bundle size
import { ParsedCSVData } from '@components/loaders/CSVLoader';
import { secureHealthcareStorage } from '@/app/lib/SecureHealthcareStorage';
import { useAutoAnimateCards } from '@/app/hooks/useAutoAnimate';
import { RotateCcw, Table, BarChart3, Bell, Search } from 'lucide-react';
import CommandPalette from '@components/navigation/CommandPalette';
import KeyboardShortcuts from '@components/navigation/KeyboardShortcuts';
import { AccessibleErrorBoundary } from '@components/accessibility/AccessibilityEnhancements';

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
      console.error('Secure storage hydration failed', e);
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
    console.log('[CSV FLOW] handleBothFilesLoaded called with:', {
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
          console.log('[CSV FLOW] Processing data for dashboard...');
          
          // Validate data before setting state
          if (!budget || !budget.rows || budget.rows.length === 0) {
            throw new Error('Budget data is empty or invalid');
          }
          if (!claims || !claims.rows || claims.rows.length === 0) {
            throw new Error('Claims data is empty or invalid');
          }
          
          console.log('[CSV FLOW] Setting budget data...');
          setBudgetData(budget);
          console.log('[CSV FLOW] Setting claims data...');
          setClaimsData(claims);
          
          try {
            console.log('[SecureHealthcareStorage] Storing data securely...');
            await secureHealthcareStorage.storeTemporary('dashboardData', {
              budgetData: budget,
              claimsData: claims,
              savedAt: new Date().toISOString(),
            });
            console.log('[SecureHealthcareStorage] Data stored successfully');
          } catch (storageError) {
            console.warn('[SecureHealthcareStorage] Storage failed (non-critical):', storageError);
          }
          
          setIsLoading(false);
          setShowSuccess(true);
          console.log('[CSV FLOW] Success animation started');
          
          timeoutRefs.current.successTimeout = setTimeout(() => {
            try {
              console.log('[CSV FLOW] Transitioning to dashboard view...');
              setShowDashboard(true);
              setShowSuccess(false);
              setError(''); // Clear any previous errors
              console.log('[CSV FLOW] Dashboard transition complete');
              timeoutRefs.current.successTimeout = null;
            } catch (transitionError) {
              console.error('[CSV FLOW] Dashboard transition failed:', transitionError);
              setError(`Dashboard transition failed: ${transitionError instanceof Error ? transitionError.message : 'Unknown error'}`);
            }
          }, 1500);
          
          timeoutRefs.current.loadingTimeout = null;
        } catch (processingError) {
          console.error('[CSV FLOW] Data processing failed:', processingError);
          setIsLoading(false);
          setShowSuccess(false);
          setError(`Data processing failed: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`);
          timeoutRefs.current.loadingTimeout = null;
        }
      }, 1000);
    } catch (outerError) {
      console.error('[CSV FLOW] Critical error in handleBothFilesLoaded:', outerError);
      setError(`Critical error: ${outerError instanceof Error ? outerError.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    console.error(errorMessage);
  };

  const handleReset = () => {
    setShowDashboard(false);
    setBudgetData(null);
    setClaimsData(null);
    setError('');
    try {
      secureHealthcareStorage.clear('dashboardData');
    } catch {}
  };

  // Advanced component handlers
  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'light' : 'dark');
  };

  const handleExport = (format: string) => {
    console.log(`Exporting data as ${format}`);
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
  const monthsTimeline: string[] = (budgetData?.rows || []).map((r: any) => String(r.month || r.Month || r.period || r.Period || ''));

  // Filtered datasets by selected range
  const filteredBudget = filterRowsByRange(budgetData?.rows || [], monthsTimeline, dateRange);
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
            <DualCSVLoader
              onBothFilesLoaded={handleBothFilesLoaded}
              onError={handleError}
            />
            
            {/* Loading Animation */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
              >
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl">
                  <RiveLoader size="lg" />
                  <p className="text-center mt-4 text-gray-600 dark:text-gray-400 font-subheading">
                    Processing your data...
                  </p>
                </div>
              </motion.div>
            )}
            
            {/* Success Animation */}
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
              >
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl">
                  <RiveSuccess isVisible={true} size="lg" />
                  <p className="text-center mt-4 text-gray-600 dark:text-gray-400 font-subheading">
                    Data loaded successfully!
                  </p>
                </div>
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
            className="min-h-screen gradient-smooth p-6"
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
              {/* Dashboard Summary Tiles */}
              <Dashboard.Root 
                budgetData={filteredBudget} 
                claimsData={filteredClaims}
              >
                <Dashboard.Budget />
                <Dashboard.Claims />
                <Dashboard.Enrollment />
                <Dashboard.LossRatio />
              </Dashboard.Root>

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
                      budgetData={filteredBudget} 
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
                      data={filteredBudget} 
                      rollingMonths={filteredBudget.length}
                      enableWebGL={true}
                      streamingData={true}
                      maxDataPoints={10000}
                    />
                  </LazyChartWrapper>
                </MotionCard>

                {/* Tile 2: Claims Breakdown Chart */}
                <MotionCard delay={0.2}>
                  <LazyChartWrapper chartName="Claims Breakdown">
                    <ClaimsBreakdownChart 
                      budgetData={filteredBudget} 
                      claimsData={filteredClaims}
                    />
                  </LazyChartWrapper>
                </MotionCard>

                {/* Tile 3: Medical Claims Breakdown Pie Chart */}
                <MotionCard delay={0.3}>
                  <LazyChartWrapper chartName="Medical Claims Pie Chart">
                    <MedicalClaimsBreakdownChart 
                      budgetData={filteredBudget} 
                      claimsData={filteredClaims}
                    />
                  </LazyChartWrapper>
                </MotionCard>

                {/* Tile 4: Cost Band Scatter Chart */}
                <MotionCard delay={0.4}>
                  <LazyChartWrapper chartName="Cost Band Scatter Plot">
                    <CostBandScatterChart data={filteredClaims} />
                  </LazyChartWrapper>
                </MotionCard>

                {/* Tile 5: Enrollment Line Chart with MUI */}
                <MotionCard delay={0.5}>
                  <LazyChartWrapper chartName="Enrollment Trends">
                    <MUIEnrollmentChart data={filteredBudget} rollingMonths={filteredBudget.length} />
                  </LazyChartWrapper>
                </MotionCard>

                {/* Tile 6: Domestic vs Non-Domestic Chart */}
                <MotionCard delay={0.6}>
                  <LazyChartWrapper chartName="Domestic vs Non-Domestic">
                    <DomesticVsNonDomesticChart 
                      budgetData={filteredBudget} 
                      claimsData={filteredClaims}
                    />
                  </LazyChartWrapper>
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
            {/* Motion playground (animated variants menu) */}
            <div className="p-8 pt-0">
              <div className="panel-elevated p-4">
                <h2 className="text-lg font-semibold text-black font-heading mb-3">Animated Variants Menu</h2>
                <p className="text-sm text-gray-600 mb-4">Experimental navigation demo integrated into the dashboard.</p>
                <AnimatedVariantsMenu />
              </div>
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
          console.log('[Shortcuts] Emergency mode activated via Ctrl/⌘+Shift+E');
          setEmergencyMode(true);
          setTimeout(() => setEmergencyMode(false), 4000);
        }}
        onPatientSearch={() => {
          console.log('[Shortcuts] Patient search invoked via Ctrl/⌘+P');
          setCommandPaletteOpen(true);
        }}
      />
    </>
  );
};

export default Home;
