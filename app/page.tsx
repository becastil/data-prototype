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
              className="fixed bottom-8 right-8 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md"
            >
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gray-50 flex"
        >
          {/* Sidebar */}
          <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
          
          {/* Main Content */}
          <div className="flex-1 ml-[280px]">
            {/* CEO Gradient Header */}
            <div className="gradient-ceo-header h-32 relative overflow-hidden">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex items-center justify-between px-8"
              >
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">CEO Dashboard</h1>
                  <p className="text-white/80 text-sm">
                    Accrual basis Tuesday, April 25, 2023 03:44 AM
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search for anything..."
                      className="w-80 px-4 py-2.5 pl-10 bg-white/20 backdrop-blur-md text-white placeholder-white/60 rounded-full border border-white/30 focus:outline-none focus:border-white/50 transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                  </div>
                  
                  {/* Notifications */}
                  <button className="relative p-2.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 hover:bg-white/30 transition-all">
                    <Bell className="w-5 h-5 text-white" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>
                  
                  {/* Export Button */}
                  <button className="px-6 py-2.5 bg-white/20 backdrop-blur-md text-white rounded-full border border-white/30 hover:bg-white/30 transition-all font-medium text-sm">
                    Export
                  </button>
                  
                  {/* Share Button */}
                  <button className="px-6 py-2.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all font-medium text-sm">
                    Share
                  </button>
                </div>
              </motion.div>
            </div>
            
            {/* Time Period Selector */}
            <div className="bg-white border-b px-8 py-3">
              <div className="flex items-center justify-between">
                <select className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option>All time</option>
                  <option>Last 12 months</option>
                  <option>Last 6 months</option>
                  <option>Last month</option>
                  <option>Custom range</option>
                </select>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">View:</span>
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    <button className="px-3 py-1.5 bg-white rounded text-sm font-medium text-gray-700 shadow-sm">
                      Monthly
                    </button>
                    <button className="px-3 py-1.5 rounded text-sm font-medium text-gray-500 hover:text-gray-700">
                      Quarterly
                    </button>
                    <button className="px-3 py-1.5 rounded text-sm font-medium text-gray-500 hover:text-gray-700">
                      Yearly
                    </button>
                  </div>
                </div>
              </div>
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