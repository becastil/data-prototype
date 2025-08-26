'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DualCSVLoader from './components/DualCSVLoader';
import CostBandScatterChart from './components/CostBandScatterChart';
import HCCDataTable from './components/HCCDataTable';
import EnrollmentLineChart from './components/EnrollmentLineChart';
import { ParsedCSVData } from './components/CSVLoader';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded shadow-lg border border-gray-200">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Process budget data for the chart
  const processChartData = () => {
    if (!budgetData) return [];
    
    return budgetData.rows.map(row => {
      const processedRow: any = {};
      Object.keys(row).forEach(key => {
        const value = row[key];
        // Try to parse as number for numeric columns
        if (key.toLowerCase() === 'month') {
          processedRow.month = value;
        } else {
          const numValue = parseFloat(String(value).replace(/[$,]/g, ''));
          processedRow[key] = isNaN(numValue) ? value : numValue;
        }
      });
      return processedRow;
    });
  };

  const chartData = processChartData();

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
                Healthcare Analytics Dashboard
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
            {/* Tile 1: Budget vs Expenses Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Budget vs Expenses Trend
              </h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="month"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    
                    {/* Dynamically render bars for numeric columns */}
                    {chartData[0] && Object.keys(chartData[0])
                      .filter(key => 
                        key !== 'month' && 
                        typeof chartData[0][key] === 'number' &&
                        !key.toLowerCase().includes('total') &&
                        !key.toLowerCase().includes('budget')
                      )
                      .map((key, index) => (
                        <Bar
                          key={key}
                          dataKey={key}
                          stackId="expenses"
                          fill={`hsl(${index * 60}, 70%, 50%)`}
                          name={key.replace(/([A-Z])/g, ' $1').trim()}
                        />
                      ))
                    }
                    
                    {/* Budget line if exists */}
                    {chartData[0] && 'budget' in chartData[0] && (
                      <Line
                        type="monotone"
                        dataKey="budget"
                        stroke="#DC2626"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        name="Budget"
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
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

            {/* Tile 3: Enrollment Line Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <EnrollmentLineChart budgetData={chartData} />
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