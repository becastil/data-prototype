'use client';

import React, { useMemo } from 'react';
import { BarChart } from 'react-gifted-charts';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { GlassCard } from '@/app/components/ui/glass-card';
import { AnimatedNumber } from '@/app/components/ui/animated-number';
import { formatCurrency, parseNumericValue } from '@utils/chartDataProcessors';

interface HighCostClaimantBandChartProps {
  data: any[];
  loading?: boolean;
  error?: string;
}

interface ClaimantBand {
  range: string;
  min: number;
  max: number;
  count: number;
  totalCost: number;
  percentage: number;
  color: string;
}

const HighCostClaimantBandChart: React.FC<HighCostClaimantBandChartProps> = ({ 
  data, 
  loading = false, 
  error = ''
}) => {
  // Define cost bands
  const costBands = [
    { range: '$0-25K', min: 0, max: 25000, color: '#10b981' },
    { range: '$25K-50K', min: 25000, max: 50000, color: '#3b82f6' },
    { range: '$50K-100K', min: 50000, max: 100000, color: '#f59e0b' },
    { range: '$100K-250K', min: 100000, max: 250000, color: '#ef4444' },
    { range: '$250K-500K', min: 250000, max: 500000, color: '#8b5cf6' },
    { range: '$500K+', min: 500000, max: Infinity, color: '#dc2626' }
  ];

  // Process claimant data into bands
  const bandData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group claimants by cost bands
    const bandCounts = costBands.map(band => ({
      ...band,
      count: 0,
      totalCost: 0,
      percentage: 0
    }));

    let totalClaimants = 0;
    let grandTotal = 0;

    data.forEach(row => {
      // Try to find total cost from various field names
      const totalCost = parseNumericValue(row['Total']) || 
                       parseNumericValue(row['Total Cost']) || 
                       parseNumericValue(row['Amount']) ||
                       parseNumericValue(row['Medical']) + parseNumericValue(row['Rx']) ||
                       0;

      if (totalCost > 0) {
        totalClaimants++;
        grandTotal += totalCost;

        // Find which band this claimant belongs to
        const band = bandCounts.find(b => totalCost >= b.min && totalCost < b.max);
        if (band) {
          band.count++;
          band.totalCost += totalCost;
        }
      }
    });

    // Calculate percentages
    bandCounts.forEach(band => {
      band.percentage = totalClaimants > 0 ? (band.count / totalClaimants) * 100 : 0;
    });

    return bandCounts;
  }, [data]);

  // Format data for react-gifted-charts
  const chartData = useMemo(() => {
    return bandData.map((band, index) => ({
      value: band.count,
      label: band.range,
      spacing: 8,
      labelWidth: 60,
      labelTextStyle: { color: '#333', fontSize: 10 },
      frontColor: band.color,
      gradientColor: band.color + '80', // Add transparency
      topLabelComponent: () => (
        <div className="text-xs font-semibold text-gray-700">
          {band.count}
        </div>
      ),
    }));
  }, [bandData]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalClaimants = bandData.reduce((sum, band) => sum + band.count, 0);
    const totalCost = bandData.reduce((sum, band) => sum + band.totalCost, 0);
    const highCostClaimants = bandData
      .filter(band => band.min >= 100000)
      .reduce((sum, band) => sum + band.count, 0);
    const highCostTotal = bandData
      .filter(band => band.min >= 100000)
      .reduce((sum, band) => sum + band.totalCost, 0);
    const highCostPercentage = totalClaimants > 0 ? (highCostClaimants / totalClaimants) * 100 : 0;
    const avgCostPerClaimant = totalClaimants > 0 ? totalCost / totalClaimants : 0;

    return {
      totalClaimants,
      totalCost,
      highCostClaimants,
      highCostTotal,
      highCostPercentage,
      avgCostPerClaimant
    };
  }, [bandData]);

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
              High Cost Claimant Distribution
            </h3>
            <p className="text-sm text-gray-600">
              Claimant count by cost bands
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-600">
              {stats.highCostPercentage.toFixed(1)}% High Cost ($100K+)
            </span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-[280px] relative">
          {bandData.length > 0 && stats.totalClaimants > 0 ? (
            <BarChart
              data={chartData}
              width={600}
              height={260}
              barWidth={40}
              spacing={20}
              isAnimated
              animationDuration={800}
              yAxisThickness={1}
              xAxisThickness={1}
              yAxisColor="#e5e7eb"
              xAxisColor="#e5e7eb"
              yAxisTextStyle={{ color: '#6b7280', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#6b7280', fontSize: 10, textAlign: 'center' }}
              showGradient
              roundedTop
              roundedBottom={false}
              leftShiftForTooltip={15}
              leftShiftForLastIndexTooltip={15}
              renderTooltip={(item: any, index: number) => {
                const band = bandData[index];
                return (
                  <div className="bg-white p-3 rounded-lg shadow-lg border">
                    <p className="font-semibold text-gray-800">{band.range}</p>
                    <p className="text-sm text-gray-600">Count: {band.count}</p>
                    <p className="text-sm text-gray-600">Total: {formatCurrency(band.totalCost)}</p>
                    <p className="text-sm text-gray-600">% of Total: {band.percentage.toFixed(1)}%</p>
                  </div>
                );
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No claimant data available</p>
            </div>
          )}
        </div>

        {/* Key Insights */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-600 font-body">Total Claimants</p>
            <p className="text-lg font-semibold text-gray-800">
              <AnimatedNumber value={stats.totalClaimants} format="number" />
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 font-body">High Cost ($100K+)</p>
            <p className="text-lg font-semibold text-red-600">
              <AnimatedNumber value={stats.highCostClaimants} format="number" />
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 font-body">High Cost Total</p>
            <p className="text-lg font-semibold text-red-600">
              <AnimatedNumber value={stats.highCostTotal} format="currency" />
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 font-body">Avg per Claimant</p>
            <p className="text-lg font-semibold text-gray-800">
              <AnimatedNumber value={stats.avgCostPerClaimant} format="currency" />
            </p>
          </div>
        </div>

        {/* Band Details */}
        <div className="mt-4">
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              View detailed breakdown
            </summary>
            <div className="mt-2 space-y-1">
              {bandData.map((band, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: band.color }}
                    ></div>
                    <span>{band.range}</span>
                  </div>
                  <div className="flex gap-4 text-gray-600">
                    <span>{band.count} claimants</span>
                    <span>{formatCurrency(band.totalCost)}</span>
                    <span>{band.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default HighCostClaimantBandChart;