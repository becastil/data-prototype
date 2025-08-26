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
import { chartColors } from '../constants/chartColors';
import { processFinancialData, formatCurrency } from '../utils/chartDataProcessors';

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
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold mb-2 text-gray-800">{label}</p>
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
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Budget vs Expenses Trend (Rolling 12 Months)
        </h2>
        <div className="flex items-center justify-center h-[400px]">
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
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Budget vs Expenses Trend (Rolling 12 Months)
        </h2>
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-red-500">Error loading chart: {error}</p>
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Budget vs Expenses Trend (Rolling 12 Months)
        </h2>
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Budget vs Expenses Trend (Rolling 12 Months)
      </h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
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
            
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
              formatter={(value: string) => (
                <span style={{ fontSize: '12px' }}>{value}</span>
              )}
            />
            
            {/* Stacked Bars */}
            <Bar 
              dataKey="totalFixedCost" 
              stackId="expenses" 
              fill={chartColors.totalFixedCost}
              name="Total Fixed Cost"
            />
            <Bar 
              dataKey="stopLossReimb" 
              stackId="expenses" 
              fill={chartColors.stopLossReimb}
              name="Stop Loss Reimb"
            />
            <Bar 
              dataKey="rxRebates" 
              stackId="expenses" 
              fill={chartColors.rxRebates}
              name="Rx Rebates"
            />
            <Bar 
              dataKey="medicalClaims" 
              stackId="expenses" 
              fill={chartColors.medicalClaims}
              name="Medical Claims"
            />
            <Bar 
              dataKey="rx" 
              stackId="expenses" 
              fill={chartColors.rx}
              name="Rx"
            />
            
            {/* Budget Line */}
            <Line
              type="monotone"
              dataKey="budget"
              stroke={chartColors.budget}
              strokeWidth={3}
              dot={{ r: 4, fill: chartColors.budget }}
              activeDot={{ r: 6 }}
              name="Budget"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Latest Month:</span>
            <span className="ml-2 font-semibold">{chartData[chartData.length - 1]?.month}</span>
          </div>
          <div>
            <span className="text-gray-600">Total Budget:</span>
            <span className="ml-2 font-semibold">
              {formatCurrency(chartData[chartData.length - 1]?.budget || 0)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total Expenses:</span>
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