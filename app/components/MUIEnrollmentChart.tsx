'use client';

import React, { useMemo } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';
import { chartColors } from '../constants/chartColors';
import { 
  processEnrollmentData, 
  calculateEnrollmentStats,
  formatPercentage 
} from '../utils/chartDataProcessors';
import MUIChartContainer from './MUIChartContainer';

interface MUIEnrollmentChartProps {
  data: any[];
  loading?: boolean;
  error?: string;
}

const MUIEnrollmentChart: React.FC<MUIEnrollmentChartProps> = ({ 
  data, 
  loading = false, 
  error = '' 
}) => {
  // Process enrollment data with 12-month rolling window
  const chartData = useMemo(() => {
    return processEnrollmentData(data, 12);
  }, [data]);

  // Calculate statistics
  const stats = useMemo(() => {
    return calculateEnrollmentStats(chartData);
  }, [chartData]);

  // Extract data for chart
  const months = chartData.map(d => d.month);
  const employeeCounts = chartData.map(d => d.employeeCount);

  if (!chartData || chartData.length === 0) {
    return (
      <MUIChartContainer 
        title="Enrollment Trends (Rolling 12 Months)"
        loading={loading}
        error={error || "No enrollment data available"}
      >
        <div className="h-[400px]" />
      </MUIChartContainer>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with statistics */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Enrollment Trends (Rolling 12 Months)
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-blue-50 rounded-lg p-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Current</p>
                <p className="text-lg font-bold text-blue-600">
                  {stats.current.toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`rounded-lg p-3 ${
              stats.change >= 0 ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Change</p>
                <p className={`text-lg font-bold ${
                  stats.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.change >= 0 ? '+' : ''}{stats.change} 
                  <span className="text-sm ml-1">
                    ({formatPercentage(stats.percentageChange)})
                  </span>
                </p>
              </div>
              {stats.change >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-400" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-400" />
              )}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-purple-50 rounded-lg p-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Average</p>
                <p className="text-lg font-bold text-purple-600">
                  {stats.average.toLocaleString()}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center">
                <span className="text-purple-600 font-bold text-xs">AVG</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* MUI Line Chart */}
      <div className="flex-1 bg-white rounded-xl shadow-lg p-6">
        <div className="h-[350px] w-full mui-chart-isolation">
          <LineChart
            series={[
              {
                data: employeeCounts,
                label: 'Employee Count',
                color: chartColors.enrollment,
                showMark: true,
                area: true,
                valueFormatter: (value: number | null) => 
                  value !== null ? value.toLocaleString() : '',
              },
            ]}
            xAxis={[
              {
                data: months,
                scaleType: 'point',
                tickLabelStyle: {
                  angle: -45,
                  textAnchor: 'end',
                  fontSize: 11,
                },
              },
            ]}
            yAxis={[
              {
                label: 'Employee Count',
                tickLabelStyle: {
                  fontSize: 11,
                },
                valueFormatter: (value: number) => value.toLocaleString(),
              },
            ]}
            margin={{ top: 20, right: 30, bottom: 80, left: 70 }}
            grid={{ horizontal: true, vertical: true }}
            slotProps={{
              legend: {
                direction: 'row',
                position: { vertical: 'bottom', horizontal: 'middle' },
                padding: 0,
                itemMarkWidth: 12,
                itemMarkHeight: 12,
                markGap: 4,
                itemGap: 10,
                labelStyle: {
                  fontSize: 12,
                },
              },
            }}
          />
        </div>
        
        {/* Summary stats at bottom */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex justify-around text-xs">
            <div className="flex items-center space-x-1">
              <span className="text-gray-600">Min: {stats.min.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-600">Max: {stats.max.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-600">
                Trend: {stats.percentageChange >= 0 ? '↑' : '↓'} {Math.abs(stats.percentageChange).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MUIEnrollmentChart;