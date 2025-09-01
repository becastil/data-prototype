'use client';

import React, { useMemo } from 'react';
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
import { motion } from 'framer-motion';
import { chartColors, getChartColors } from '@/app/constants/chartColors';
import { processFinancialData, formatCurrency } from '@utils/chartDataProcessors';

interface RechartsBudgetChartProps {
  data: any[];
  loading?: boolean;
  error?: string;
}

const RechartsBudgetChart: React.FC<RechartsBudgetChartProps> = ({ 
  data, 
  loading = false, 
  error = '' 
}) => {
  // Use dynamic colors that adapt to theme
  const colors = typeof window !== 'undefined' ? getChartColors() : chartColors;
  // Process data with 12-month rolling window
  const chartData = useMemo(() => {
    return processFinancialData(data, 12);
  }, [data]);

  // Calculate max value for Y-axis
  const maxValue = Math.max(
    ...chartData.map(d => 
      d.totalFixedCost + d.stopLossReimb + d.rxRebates + d.medicalClaims + d.rx
    ),
    ...chartData.map(d => d.budget)
  );

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold mb-2 text-gray-800 dark:text-gray-200">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="panel-elevated p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 font-heading">
          Budget vs Expenses Trend (Rolling 12 Months)
        </h2>
        <div className="flex items-center justify-center h-[500px]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-elevated p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 font-heading">
          Budget vs Expenses Trend (Rolling 12 Months)
        </h2>
        <div className="flex items-center justify-center h-[500px]">
          <p className="text-danger">Error loading chart: {error}</p>
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="panel-elevated p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 font-heading">
          Budget vs Expenses Trend (Rolling 12 Months)
        </h2>
        <div className="flex items-center justify-center h-[500px]">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 font-heading">
        Budget vs Expenses Trend (Rolling 12 Months)
      </h2>
      <div className="h-[500px] flex">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              
              <XAxis
                dataKey="month"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 11 }}
                interval={0}
              />
              
              <YAxis
                domain={[0, maxValue * 1.1]}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                tick={{ fontSize: 11 }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* Stacked Bars */}
              <Bar 
                dataKey="totalFixedCost" 
                stackId="expenses" 
                fill={colors.totalFixedCost}
                name="Total Fixed Cost"
              />
              <Bar 
                dataKey="stopLossReimb" 
                stackId="expenses" 
                fill={colors.stopLossReimb}
                name="Stop Loss Reimb"
              />
              <Bar 
                dataKey="rxRebates" 
                stackId="expenses" 
                fill={colors.rxRebates}
                name="Rx Rebates"
              />
              <Bar 
                dataKey="medicalClaims" 
                stackId="expenses" 
                fill={colors.medicalClaims}
                name="Medical Claims"
              />
              <Bar 
                dataKey="rx" 
                stackId="expenses" 
                fill={colors.rx}
                name="Rx"
              />
              
              {/* Budget Line */}
              <Line
                type="monotone"
                dataKey="budget"
                stroke={colors.budget}
                strokeWidth={3}
                dot={{ r: 4, fill: colors.budget }}
                activeDot={{ r: 6 }}
                name="Budget"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Custom Legend */}
        <div className="w-36 pl-2 flex flex-col justify-center">
          <div className="space-y-1">
            {/* Expense items */}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.totalFixedCost }}></div>
              <span className="text-xs text-gray-700 dark:text-gray-300">Total Fixed Cost</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.stopLossReimb }}></div>
              <span className="text-xs text-gray-700 dark:text-gray-300">Stop Loss Reimb</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.rxRebates }}></div>
              <span className="text-xs text-gray-700 dark:text-gray-300">Rx Rebates</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.medicalClaims }}></div>
              <span className="text-xs text-gray-700 dark:text-gray-300">Medical Claims</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.rx }}></div>
              <span className="text-xs text-gray-700 dark:text-gray-300">Rx</span>
            </div>
            
            {/* Divider */}
            <div className="border-t border-gray-200 my-2"></div>
            
            {/* Budget line */}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded" style={{ backgroundColor: colors.budget }}></div>
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Budget</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Latest Month:</span>
            <span className="ml-2 font-semibold">{chartData[chartData.length - 1]?.month}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total Budget:</span>
            <span className="ml-2 font-semibold">
              {formatCurrency(chartData[chartData.length - 1]?.budget || 0)}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total Expenses:</span>
            <span className="ml-2 font-semibold">
              {formatCurrency(
                chartData[chartData.length - 1]
                  ? chartData[chartData.length - 1].totalFixedCost +
                    chartData[chartData.length - 1].stopLossReimb +
                    chartData[chartData.length - 1].rxRebates +
                    chartData[chartData.length - 1].medicalClaims +
                    chartData[chartData.length - 1].rx
                  : 0
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RechartsBudgetChart;
