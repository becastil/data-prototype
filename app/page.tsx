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
import { ParsedCSVData } from './components/CSVLoader';
import { RotateCcw, TableIcon, ChartBar, ArrowLeft, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [budgetData, setBudgetData] = useState<ParsedCSVData | null>(null);
  const [claimsData, setClaimsData] = useState<ParsedCSVData | null>(null);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<'table' | 'charts'>('table');

  const handleBothFilesLoaded = (budget: ParsedCSVData, claims: ParsedCSVData) => {
    setBudgetData(budget);
    setClaimsData(claims);
    setShowDashboard(true);
    setError('');
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
    <AnimatePresence mode="wait">
      {!showDashboard ? (
        <motion.div
          key="uploader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <DualCSVLoader
            onBothFilesLoaded={handleBothFilesLoaded}
            onError={handleError}
          />
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
          className="min-h-screen gradient-teal-smooth p-6"
        >
          {/* Header */}
          <div className="max-w-7xl mx-auto mb-6">
            <div className="flex justify-between items-center mb-4">
              <motion.h1
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl font-bold text-white font-heading drop-shadow-lg"
              >
                Reporting Dashboard
              </motion.h1>
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg hover:from-cyan-700 hover:to-teal-700 transition-all shadow-lg flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Upload New Data
              </motion.button>
            </div>
            
            {/* Page Navigation Tabs */}
            <div className="flex gap-2 panel-elevated rounded-lg shadow-lg p-1 inline-flex">
              <button
                onClick={() => setCurrentPage('table')}
                className={`px-6 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  currentPage === 'table'
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100/50'
                }`}
              >
                <TableIcon className="w-4 h-4" />
                Financial Table
              </button>
              <button
                onClick={() => setCurrentPage('charts')}
                className={`px-6 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  currentPage === 'charts'
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100/50'
                }`}
              >
                <ChartBar className="w-4 h-4" />
                Charts & Analytics
              </button>
            </div>
          </div>

          {/* Dashboard Summary Tiles - Always visible */}
          <div className="max-w-7xl mx-auto">
            <DashboardSummaryTiles 
              budgetData={budgetData?.rows || []} 
              claimsData={claimsData?.rows || []}
            />
          </div>

          {/* Page Content */}
          <AnimatePresence mode="wait">
            {currentPage === 'table' ? (
              <motion.div
                key="table-page"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto"
              >
                <FinancialDataTable 
                  budgetData={budgetData?.rows || []} 
                  claimsData={claimsData?.rows || []}
                />
              </motion.div>
            ) : (
              <motion.div
                key="charts-page"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6"
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
            )}
          </AnimatePresence>

          {/* Summary Stats - Only show on charts page */}
          {currentPage === 'charts' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="max-w-7xl mx-auto mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div className="panel-elevated rounded-lg shadow-lg p-4">
                <p className="text-sm text-gray-600 font-body">Total Budget Rows</p>
                <p className="text-2xl font-bold text-cyan-600 font-data">
                  {budgetData?.rowCount || 0}
                </p>
              </div>
              <div className="panel-elevated rounded-lg shadow-lg p-4">
                <p className="text-sm text-gray-600 font-body">Total Claims</p>
                <p className="text-2xl font-bold text-teal-600 font-data">
                  {claimsData?.rowCount || 0}
                </p>
              </div>
              <div className="panel-elevated rounded-lg shadow-lg p-4">
                <p className="text-sm text-gray-600 font-body">Data Columns</p>
                <p className="text-2xl font-bold text-cyan-700 font-data">
                  {(budgetData?.headers.length || 0) + (claimsData?.headers.length || 0)}
                </p>
              </div>
              <div className="panel-elevated rounded-lg shadow-lg p-4">
                <p className="text-sm text-gray-600 font-body">Files Loaded</p>
                <p className="text-2xl font-bold text-teal-700 font-data">2</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Home;