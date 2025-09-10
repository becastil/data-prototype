'use client';

import React, { useMemo } from 'react';
import { BarChart, LineChart } from 'react-gifted-charts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { GlassCard } from '@/app/components/ui/glass-card';
import { AnimatedNumber } from '@/app/components/ui/animated-number';
import { formatCurrency, parseNumericValue } from '@utils/chartDataProcessors';

interface GiftedStackedBarChartProps {
  data: any[];
  loading?: boolean;
  error?: string;
  rollingMonths?: number;
}

interface ProcessedChartData {
  label: string;
  medical: number;
  pharmacy: number;
  fixed: number;
  budget: number;
  variance: number;
}

const GiftedStackedBarChart: React.FC<GiftedStackedBarChartProps> = ({ 
  data, 
  loading = false, 
  error = '',
  rollingMonths
}) => {
  // Process data for stacked bar chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const processedData: ProcessedChartData[] = data.map(row => {
      const month = row.month || row.Month || '';
      const medical = parseNumericValue(row['Medical Claims']) || 0;
      const pharmacy = parseNumericValue(row['Pharmacy Claims']) || parseNumericValue(row['Rx Claims']) || 0;
      const fixed = parseNumericValue(row['Fixed Costs']) || 0;
      const budget = parseNumericValue(row['Budget']) || 0;
      const variance = budget - (medical + pharmacy + fixed);
      
      return {
        label: month,
        medical,
        pharmacy,
        fixed,
        budget,
        variance
      };
    });
    
    return processedData;
  }, [data]);

  // Format data for react-gifted-charts
  const barData = useMemo(() => {
    return chartData.map((item, index) => ({
      value: item.medical,
      label: item.label,
      spacing: 8,
      labelWidth: 50,
      labelTextStyle: { color: '#333', fontSize: 10 },
      frontColor: '#1f2937', // Medical - dark gray
      stackData: [
        {
          value: item.pharmacy,
          color: '#4b5563', // Pharmacy - medium gray
        },
        {
          value: item.fixed,
          color: '#9ca3af', // Fixed costs - light gray
        }
      ]
    }));
  }, [chartData]);

  // Budget line data
  const budgetLineData = useMemo(() => {
    return chartData.map(item => ({
      value: item.budget,
      dataPointText: formatCurrency(item.budget),
      textColor: '#000000',
      textShiftY: -10,
      textShiftX: -10,
    }));
  }, [chartData]);

  // Calculate totals and statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return { totalClaims: 0, totalBudget: 0, variance: 0, variancePercent: 0 };
    
    const totalClaims = chartData.reduce((sum, item) => sum + item.medical + item.pharmacy + item.fixed, 0);
    const totalBudget = chartData.reduce((sum, item) => sum + item.budget, 0);
    const variance = totalBudget - totalClaims;
    const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;
    
    return { totalClaims, totalBudget, variance, variancePercent };
  }, [chartData]);

  if (loading) {
    return (
      <GlassCard variant="elevated" className="p-6 h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4 mx-auto"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard variant="elevated" className="p-6 h-[500px] flex items-center justify-center border-l-4 border-red-500">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">📊⚠️</div>
          <h3 className="text-lg font-semibold text-red-600 mb-2">Chart Error</h3>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassCard variant="elevated" className="p-6 h-[500px]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 font-heading">
              Budget vs Actual Claims
            </h3>
            <p className="text-sm text-gray-600">
              Monthly breakdown with budget comparison
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              {stats.variance >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                stats.variance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.variance >= 0 ? 'Under Budget' : 'Over Budget'}
              </span>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-[300px] relative">
          {chartData.length > 0 ? (
            <>
              {/* Stacked Bar Chart */}
              <BarChart
                data={barData}
                width={600}
                height={280}
                barWidth={32}
                spacing={16}
                isAnimated
                animationDuration={800}
                yAxisThickness={1}
                xAxisThickness={1}
                yAxisColor="#e5e7eb"
                xAxisColor="#e5e7eb"
                yAxisTextStyle={{ color: '#6b7280', fontSize: 10 }}
                xAxisLabelTextStyle={{ color: '#6b7280', fontSize: 10, textAlign: 'center' }}
                showReferenceLine1
                referenceLine1Position={stats.totalBudget / chartData.length}
                referenceLine1Config={{
                  color: '#000000',
                  dashWidth: 4,
                  dashGap: 4,
                  thickness: 2,
                }}
                leftShiftForTooltip={10}
                leftShiftForLastIndexTooltip={10}
              />
              
              {/* Budget Line Overlay */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <LineChart
                  data={budgetLineData}
                  width={600}
                  height={280}
                  thickness={3}
                  color="#000000"
                  curved
                  showDataPoints
                  dataPointsShape="circular"
                  dataPointsColor="#000000"
                  dataPointsRadius={4}
                  hideAxes
                  hideRules
                  isAnimated
                  animationDuration={1000}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-800 rounded"></div>
            <span>Medical Claims</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-600 rounded"></div>
            <span>Pharmacy Claims</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span>Fixed Costs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-black rounded-full"></div>
            <span>Budget Line</span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-600 font-body">Total Claims</p>
            <p className="text-lg font-semibold text-gray-800">
              <AnimatedNumber value={stats.totalClaims} format="currency" />
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 font-body">Total Budget</p>
            <p className="text-lg font-semibold text-gray-800">
              <AnimatedNumber value={stats.totalBudget} format="currency" />
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 font-body">Variance</p>
            <p className={`text-lg font-semibold ${
              stats.variance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <AnimatedNumber value={stats.variance} format="currency" />
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default GiftedStackedBarChart;