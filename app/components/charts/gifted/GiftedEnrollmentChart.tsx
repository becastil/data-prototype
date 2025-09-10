'use client';

import React, { useMemo } from 'react';
import { LineChart } from 'react-gifted-charts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, UserPlus, UserMinus } from 'lucide-react';
import { GlassCard } from '@/app/components/ui/glass-card';
import { AnimatedNumber } from '@/app/components/ui/animated-number';
import { parseNumericValue, formatPercentage } from '@utils/chartDataProcessors';

interface GiftedEnrollmentChartProps {
  data: any[];
  loading?: boolean;
  error?: string;
  rollingMonths?: number;
}

interface ProcessedEnrollmentData {
  month: string;
  employeeCount: number;
  memberCount: number;
  change: number;
  percentageChange: number;
}

const GiftedEnrollmentChart: React.FC<GiftedEnrollmentChartProps> = ({ 
  data, 
  loading = false, 
  error = '',
  rollingMonths
}) => {
  // Process enrollment data
  const enrollmentData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const processedData: ProcessedEnrollmentData[] = data.map((row, index) => {
      const month = row.month || row.Month || '';
      const employeeCount = parseNumericValue(row['Employee Count']) || 
                           parseNumericValue(row['Employees']) || 0;
      const memberCount = parseNumericValue(row['Member Count']) || 
                         parseNumericValue(row['Enrollment']) || 
                         parseNumericValue(row['Total Enrollment']) || 0;

      // Calculate change from previous month
      let change = 0;
      let percentageChange = 0;
      
      if (index > 0) {
        const prevCount = parseNumericValue(data[index - 1]['Employee Count']) || 
                         parseNumericValue(data[index - 1]['Employees']) || 0;
        change = employeeCount - prevCount;
        percentageChange = prevCount > 0 ? (change / prevCount) * 100 : 0;
      }

      return {
        month,
        employeeCount,
        memberCount,
        change,
        percentageChange
      };
    });
    
    return processedData;
  }, [data]);

  // Format data for react-gifted-charts
  const chartData = useMemo(() => {
    return enrollmentData.map((item, index) => ({
      value: item.employeeCount,
      label: item.month,
      dataPointText: item.employeeCount.toString(),
      textColor: '#000000',
      textShiftY: -15,
      textShiftX: -10,
      // Color points based on trend
      dataPointColor: item.change > 0 ? '#10b981' : item.change < 0 ? '#ef4444' : '#6b7280',
      dataPointRadius: 5,
      // Add custom label for significant changes
      customDataPoint: item.change !== 0 ? () => (
        <div className="relative">
          <div className={`w-3 h-3 rounded-full ${
            item.change > 0 ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {Math.abs(item.change) > 10 && (
              <div className={`absolute -top-6 -left-6 text-xs font-semibold ${
                item.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {item.change > 0 ? '+' : ''}{item.change}
              </div>
            )}
          </div>
        </div>
      ) : undefined,
    }));
  }, [enrollmentData]);

  // Calculate enrollment statistics
  const stats = useMemo(() => {
    if (enrollmentData.length === 0) return {
      currentEmployees: 0,
      currentMembers: 0,
      totalChange: 0,
      avgMonthlyChange: 0,
      trend: 'stable' as const,
      maxEnrollment: 0,
      minEnrollment: 0
    };

    const current = enrollmentData[enrollmentData.length - 1];
    const first = enrollmentData[0];
    const totalChange = current.employeeCount - first.employeeCount;
    const avgMonthlyChange = enrollmentData.length > 1 ? 
      enrollmentData.slice(1).reduce((sum, item) => sum + item.change, 0) / (enrollmentData.length - 1) : 0;
    
    const employeeCounts = enrollmentData.map(item => item.employeeCount);
    const maxEnrollment = Math.max(...employeeCounts);
    const minEnrollment = Math.min(...employeeCounts);
    
    // Determine trend
    const recentChanges = enrollmentData.slice(-3).map(item => item.change);
    const recentAvg = recentChanges.reduce((sum, change) => sum + change, 0) / recentChanges.length;
    const trend = recentAvg > 1 ? 'growing' : recentAvg < -1 ? 'declining' : 'stable';

    return {
      currentEmployees: current.employeeCount,
      currentMembers: current.memberCount,
      totalChange,
      avgMonthlyChange,
      trend,
      maxEnrollment,
      minEnrollment
    };
  }, [enrollmentData]);

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
              Enrollment Trends
            </h3>
            <p className="text-sm text-gray-600">
              Employee and member count over time
            </p>
          </div>
          <div className="flex items-center gap-2">
            {stats.trend === 'growing' ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : stats.trend === 'declining' ? (
              <TrendingDown className="w-4 h-4 text-red-600" />
            ) : (
              <Users className="w-4 h-4 text-gray-600" />
            )}
            <span className={`text-sm font-medium ${
              stats.trend === 'growing' ? 'text-green-600' : 
              stats.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {stats.trend === 'growing' ? 'Growing' : stats.trend === 'declining' ? 'Declining' : 'Stable'}
            </span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-[280px] relative">
          {enrollmentData.length > 0 ? (
            <LineChart
              data={chartData}
              width={600}
              height={260}
              thickness={3}
              color="#1f2937"
              curved
              isAnimated
              animationDuration={1000}
              showDataPoints
              dataPointsShape="circular"
              dataPointsRadius={4}
              showGradient
              gradientDirection="vertical"
              startColor="#1f2937"
              endColor="#1f293710"
              yAxisThickness={1}
              xAxisThickness={1}
              yAxisColor="#e5e7eb"
              xAxisColor="#e5e7eb"
              yAxisTextStyle={{ color: '#6b7280', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#6b7280', fontSize: 10 }}
              leftShiftForTooltip={10}
              leftShiftForLastIndexTooltip={10}
              renderTooltip={(item: any, index: number) => {
                const enrollment = enrollmentData[index];
                return (
                  <div className="bg-white p-3 rounded-lg shadow-lg border">
                    <p className="font-semibold text-gray-800">{enrollment.month}</p>
                    <p className="text-sm text-gray-600">Employees: {enrollment.employeeCount.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Members: {enrollment.memberCount.toLocaleString()}</p>
                    {enrollment.change !== 0 && (
                      <p className={`text-sm font-medium ${
                        enrollment.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {enrollment.change > 0 ? '+' : ''}{enrollment.change} ({formatPercentage(enrollment.percentageChange)})
                      </p>
                    )}
                  </div>
                );
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No enrollment data available</p>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-600 font-body">Current Employees</p>
            <p className="text-lg font-semibold text-gray-800">
              <AnimatedNumber value={stats.currentEmployees} format="number" />
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 font-body">Current Members</p>
            <p className="text-lg font-semibold text-gray-800">
              <AnimatedNumber value={stats.currentMembers} format="number" />
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 font-body">Total Change</p>
            <p className={`text-lg font-semibold ${
              stats.totalChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.totalChange >= 0 ? '+' : ''}
              <AnimatedNumber value={stats.totalChange} format="number" />
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 font-body">Avg Monthly</p>
            <p className={`text-lg font-semibold ${
              stats.avgMonthlyChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.avgMonthlyChange >= 0 ? '+' : ''}
              <AnimatedNumber value={Math.round(stats.avgMonthlyChange)} format="number" />
            </p>
          </div>
        </div>

        {/* Trend Indicators */}
        <div className="flex justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Growth</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Decline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span>Stable</span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default GiftedEnrollmentChart;