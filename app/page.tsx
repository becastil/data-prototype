'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DualCSVLoader from './components/DualCSVLoader';
import CostBandScatterChart from './components/CostBandScatterChart';
import HCCDataTable from './components/HCCDataTable';
import RechartsBudgetChart from './components/RechartsBudgetChart';
import MUIEnrollmentChart from './components/MUIEnrollmentChart';
import { ParsedCSVData } from './components/CSVLoader';
import { RotateCcw } from 'lucide-react';

const Home: React.FC = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [budgetData, setBudgetData] = useState<ParsedCSVData | null>(null);
  const [claimsData, setClaimsData] = useState<ParsedCSVData | null>(null);
  const [error, setError] = useState<string>('');

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
          className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6"
        >
          {/* Header */}
          <div className="max-w-7xl mx-auto mb-6">
            <div className="flex justify-between items-center">
              <motion.h1
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl font-bold text-gray-800"
              >
                Reporting Dashboard
              </motion.h1>
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Upload New Data
              </motion.button>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tile 1: Budget vs Expenses Chart with Recharts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <RechartsBudgetChart data={budgetData?.rows || []} />
            </motion.div>

            {/* Tile 2: Cost Band Scatter Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <CostBandScatterChart data={claimsData?.rows || []} />
            </motion.div>

            {/* Tile 3: Enrollment Line Chart with MUI */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <MUIEnrollmentChart data={budgetData?.rows || []} />
            </motion.div>

            {/* Tile 4: HCC Data Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-lg p-6 overflow-hidden"
            >
              <HCCDataTable data={claimsData?.rows || []} />
            </motion.div>
          </div>

          {/* Summary Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="max-w-7xl mx-auto mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Budget Rows</p>
              <p className="text-2xl font-bold text-blue-600">
                {budgetData?.rowCount || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Claims</p>
              <p className="text-2xl font-bold text-purple-600">
                {claimsData?.rowCount || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Data Columns</p>
              <p className="text-2xl font-bold text-green-600">
                {(budgetData?.headers.length || 0) + (claimsData?.headers.length || 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Files Loaded</p>
              <p className="text-2xl font-bold text-orange-600">2</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Home;