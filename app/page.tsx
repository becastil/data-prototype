'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DualCSVLoader from './components/DualCSVLoader';
import CostBandScatterChart from './components/CostBandScatterChart';
import HCCDataTable from './components/HCCDataTable';
import RechartsBudgetChart from './components/RechartsBudgetChart';
import MUIEnrollmentChart from './components/MUIEnrollmentChart';
import FinancialDataTable from './components/FinancialDataTable';
import DashboardSummaryTiles from './components/DashboardSummaryTiles';
import ClaimsBreakdownChart from './components/ClaimsBreakdownChart';
import MedicalClaimsBreakdownChart from './components/MedicalClaimsBreakdownChart';
import DomesticVsNonDomesticChart from './components/DomesticVsNonDomesticChart';
import ThemeToggle from './components/ThemeToggle';
import GooeyFilter from './components/GooeyFilter';
import GooeyLoader from './components/GooeyLoader';
import MetaballSuccess from './components/MetaballSuccess';
import AccessibleIcon from './components/AccessibleIcon';
import Sidebar from './components/Sidebar';
import { ParsedCSVData } from './components/CSVLoader';
import { RotateCcw, TableIcon, ChartBar, Bell, Search } from 'lucide-react';

const Home: React.FC = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [budgetData, setBudgetData] = useState<ParsedCSVData | null>(null);
  const [claimsData, setClaimsData] = useState<ParsedCSVData | null>(null);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleBothFilesLoaded = (budget: ParsedCSVData, claims: ParsedCSVData) => {
    setIsLoading(true);
    setTimeout(() => {
      setBudgetData(budget);
      setClaimsData(claims);
      setIsLoading(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowDashboard(true);
        setShowSuccess(false);
      }, 1500);
      setError('');
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
                  <GooeyLoader size="lg" />
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
                  <MetaballSuccess isVisible={true} size="lg" />
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
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  className="px-5 py-2.5 bg-black text-white hover:bg-gray-800 transition-all shadow-lg flex items-center gap-2 btn"
                  aria-label="Upload new data files"
                >
                  <AccessibleIcon
                    icon={<RotateCcw />}
                    label="Reset and upload new files"
                    size="sm"
                    variant="default"
                    showTooltip={false}
                    animate={true}
                    className="!bg-transparent !border-0 !p-0 !shadow-none hover:!bg-transparent"
                  />
                  Upload New Data
                </motion.button>
              </div>
            </div>
            
            {/* Page Navigation Tabs */}
            <div className="flex gap-2 panel-elevated shadow-lg p-1.5 inline-flex">
              <button
                onClick={() => setCurrentPage('table')}
                className={`px-6 py-2 transition-all flex items-center gap-2 btn-squared ${
                  currentPage === 'table'
                    ? 'bg-black text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                }`}
              >
                <TableIcon className="w-4 h-4" />
                Financial Table
              </button>
              <button
                onClick={() => setCurrentPage('charts')}
                className={`px-6 py-2 transition-all flex items-center gap-2 btn-squared ${
                  currentPage === 'charts'
                    ? 'bg-black text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                }`}
              >
                <ChartBar className="w-4 h-4" />
                Charts & Analytics
              </button>
            </div>

            {/* Main Content Area */}
            <div className="p-8">
              {/* Dashboard Summary Tiles */}
              <DashboardSummaryTiles 
                budgetData={budgetData?.rows || []} 
                claimsData={claimsData?.rows || []}
              />

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
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                {/* Tile 1: Budget vs Expenses Chart with Recharts */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <RechartsBudgetChart data={budgetData?.rows || []} />
                </motion.div>

                {/* Tile 2: Claims Breakdown Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <ClaimsBreakdownChart 
                    budgetData={budgetData?.rows || []} 
                    claimsData={claimsData?.rows || []}
                  />
                </motion.div>

                {/* Tile 3: Medical Claims Breakdown Pie Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <MedicalClaimsBreakdownChart 
                    budgetData={budgetData?.rows || []} 
                    claimsData={claimsData?.rows || []}
                  />
                </motion.div>

                {/* Tile 4: Cost Band Scatter Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="panel-elevated rounded-xl shadow-lg p-6"
                >
                  <CostBandScatterChart data={claimsData?.rows || []} />
                </motion.div>

                {/* Tile 5: Enrollment Line Chart with MUI */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <MUIEnrollmentChart data={budgetData?.rows || []} />
                </motion.div>

                {/* Tile 6: Domestic vs Non-Domestic Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <DomesticVsNonDomesticChart 
                    budgetData={budgetData?.rows || []} 
                    claimsData={claimsData?.rows || []}
                  />
                </motion.div>

                {/* Tile 7: HCC Data Table */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="panel-elevated rounded-xl shadow-lg p-6 overflow-hidden"
                >
                  <HCCDataTable data={claimsData?.rows || []} />
                  </motion.div>
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
    </>
  );
};

export default Home;