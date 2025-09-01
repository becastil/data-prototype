'use client';

import React, { useState, useRef, useEffect } from 'react';
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
} from '@components/LazyCharts';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/ui/tabs';
// Removed unused imports to reduce bundle size
import { ParsedCSVData } from '@components/loaders/CSVLoader';
import { useAutoAnimateCards } from '@/app/hooks/useAutoAnimate';
import { RotateCcw, Table, BarChart3, Bell, Search } from 'lucide-react';
import CommandPalette from '@components/CommandPalette';
import KeyboardShortcuts from '@components/KeyboardShortcuts';

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
    setIsLoading(true);
    
    // Clear any existing timeouts
    if (timeoutRefs.current.loadingTimeout) {
      clearTimeout(timeoutRefs.current.loadingTimeout);
    }
    if (timeoutRefs.current.successTimeout) {
      clearTimeout(timeoutRefs.current.successTimeout);
    }
    
    timeoutRefs.current.loadingTimeout = setTimeout(() => {
      setBudgetData(budget);
      setClaimsData(claims);
      setIsLoading(false);
      setShowSuccess(true);
      
      timeoutRefs.current.successTimeout = setTimeout(() => {
        setShowDashboard(true);
        setShowSuccess(false);
        timeoutRefs.current.successTimeout = null;
      }, 1500);
      
      setError('');
      timeoutRefs.current.loadingTimeout = null;
    }, 1000);
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

  return (
    <>
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
              <Tabs value={currentPage} onValueChange={setCurrentPage} className="w-fit">
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

            {/* Main Content Area */}
            <div className="p-8">
              {/* Dashboard Summary Tiles */}
              <Dashboard.Root 
                budgetData={budgetData?.rows || []} 
                claimsData={claimsData?.rows || []}
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
                      budgetData={budgetData?.rows || []} 
                      claimsData={claimsData?.rows || []}
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
                  <LazyChartWrapper>
                    <EChartsEnterpriseChart 
                      data={budgetData?.rows || []} 
                      enableWebGL={true}
                      streamingData={true}
                      maxDataPoints={10000}
                    />
                  </LazyChartWrapper>
                </MotionCard>

                {/* Tile 2: Claims Breakdown Chart */}
                <MotionCard delay={0.2}>
                  <LazyChartWrapper>
                    <ClaimsBreakdownChart 
                      budgetData={budgetData?.rows || []} 
                      claimsData={claimsData?.rows || []}
                    />
                  </LazyChartWrapper>
                </MotionCard>

                {/* Tile 3: Medical Claims Breakdown Pie Chart */}
                <MotionCard delay={0.3}>
                  <LazyChartWrapper>
                    <MedicalClaimsBreakdownChart 
                      budgetData={budgetData?.rows || []} 
                      claimsData={claimsData?.rows || []}
                    />
                  </LazyChartWrapper>
                </MotionCard>

                {/* Tile 4: Cost Band Scatter Chart */}
                <MotionCard delay={0.4}>
                  <LazyChartWrapper>
                    <CostBandScatterChart data={claimsData?.rows || []} />
                  </LazyChartWrapper>
                </MotionCard>

                {/* Tile 5: Enrollment Line Chart with MUI */}
                <MotionCard delay={0.5}>
                  <LazyChartWrapper>
                    <MUIEnrollmentChart data={budgetData?.rows || []} />
                  </LazyChartWrapper>
                </MotionCard>

                {/* Tile 6: Domestic vs Non-Domestic Chart */}
                <MotionCard delay={0.6}>
                  <LazyChartWrapper>
                    <DomesticVsNonDomesticChart 
                      budgetData={budgetData?.rows || []} 
                      claimsData={claimsData?.rows || []}
                    />
                  </LazyChartWrapper>
                </MotionCard>

                {/* Tile 7: HCC Data Table */}
                <MotionCard delay={0.7}>
                  <LazyChartWrapper>
                    <HCCDataTable data={claimsData?.rows || []} />
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
      />
    </>
  );
};

export default Home;
