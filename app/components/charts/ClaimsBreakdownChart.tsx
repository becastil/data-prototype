'use client';

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface ClaimsBreakdownChartProps {
  budgetData: any[];
  claimsData: any[];
}

const ClaimsBreakdownChart: React.FC<ClaimsBreakdownChartProps> = ({ 
  budgetData, 
  claimsData 
}) => {
  // Process data for claims breakdown over time
  const chartData = useMemo(() => {
    if (!budgetData || budgetData.length === 0) return [];
    
    // Get last 12 months of data
    const recentData = budgetData.slice(-12);
    
    return recentData.map(row => {
      const parseValue = (value: any): number => {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        return parseFloat(String(value).replace(/[$,]/g, '')) || 0;
      };
      
      // Extract different claim types
      const inpatient = parseValue(row['Inpatient'] || row['inpatient'] || 0);
      const outpatient = parseValue(row['Outpatient'] || row['outpatient'] || 0);
      const professional = parseValue(row['Professional'] || row['professional'] || 0);
      const emergency = parseValue(row['Emergency'] || row['emergency'] || 0);
      const pharmacy = parseValue(row['Rx'] || row['Pharmacy'] || row['rx_claims'] || 0);
      const specialtyRx = parseValue(row['Specialty Rx'] || row['specialty_rx'] || 0);
      
      // If no breakdown available, estimate from total medical claims
      let medicalClaims = parseValue(row['Medical Claims'] || row['medical_claims'] || 0);
      
      return {
        month: row.month || row.Month || row.period || '',
        inpatient: inpatient || medicalClaims * 0.40,
        outpatient: outpatient || medicalClaims * 0.35,
        professional: professional || medicalClaims * 0.20,
        emergency: emergency || medicalClaims * 0.05,
        pharmacy: pharmacy,
        specialtyRx: specialtyRx,
        total: medicalClaims + pharmacy + specialtyRx
      };
    });
  }, [budgetData, claimsData]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return { totalClaims: 0, avgMonthly: 0, trend: 0, maxMonth: '' };
    
    const totalClaims = chartData.reduce((sum, d) => sum + d.total, 0);
    const avgMonthly = totalClaims / chartData.length;
    
    // Calculate trend (compare last 3 months to previous 3 months)
    const recent3 = chartData.slice(-3).reduce((sum, d) => sum + d.total, 0) / 3;
    const previous3 = chartData.slice(-6, -3).reduce((sum, d) => sum + d.total, 0) / 3;
    const trend = previous3 > 0 ? ((recent3 - previous3) / previous3) * 100 : 0;
    
    // Find month with highest claims
    const maxClaims = Math.max(...chartData.map(d => d.total));
    const maxMonth = chartData.find(d => d.total === maxClaims)?.month || '';
    
    return { totalClaims, avgMonthly, trend, maxMonth };
  }, [chartData]);

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold mb-2 text-gray-800 font-subheading">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-body" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
          <div className="border-t mt-2 pt-2">
            <p className="text-sm font-semibold font-data">
              Total: {formatCurrency(total)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Chart colors
  const colors = {
    inpatient: '#FF6B6B',     // Red
    outpatient: '#4ECDC4',    // Teal
    professional: '#45B7D1',   // Light Blue
    emergency: '#FFA07A',      // Light Salmon
    pharmacy: '#98D8C8',       // Mint
    specialtyRx: '#F7DC6F'     // Yellow
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className="panel-elevated rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 font-heading">
          Claims Breakdown by Month
        </h2>
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel-elevated rounded-xl shadow-lg p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 font-heading">
          Claims Breakdown by Month
        </h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 font-body">Rolling 12 Months</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[400px] mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            
            <XAxis
              dataKey="month"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              interval={0}
            />
            
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              tick={{ fontSize: 11, fill: '#6B7280' }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              verticalAlign="bottom" 
              height={36}
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
            
            {/* Stacked Areas */}
            <Area
              type="monotone"
              dataKey="inpatient"
              stackId="1"
              stroke={colors.inpatient}
              fill={colors.inpatient}
              fillOpacity={0.8}
              name="Inpatient"
            />
            <Area
              type="monotone"
              dataKey="outpatient"
              stackId="1"
              stroke={colors.outpatient}
              fill={colors.outpatient}
              fillOpacity={0.8}
              name="Outpatient"
            />
            <Area
              type="monotone"
              dataKey="professional"
              stackId="1"
              stroke={colors.professional}
              fill={colors.professional}
              fillOpacity={0.8}
              name="Professional"
            />
            <Area
              type="monotone"
              dataKey="emergency"
              stackId="1"
              stroke={colors.emergency}
              fill={colors.emergency}
              fillOpacity={0.8}
              name="Emergency"
            />
            <Area
              type="monotone"
              dataKey="pharmacy"
              stackId="1"
              stroke={colors.pharmacy}
              fill={colors.pharmacy}
              fillOpacity={0.8}
              name="Pharmacy"
            />
            <Area
              type="monotone"
              dataKey="specialtyRx"
              stackId="1"
              stroke={colors.specialtyRx}
              fill={colors.specialtyRx}
              fillOpacity={0.8}
              name="Specialty Rx"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-600 font-body">Total Claims (12M)</p>
          <p className="text-lg font-semibold text-gray-900 font-data">
            {formatCurrency(stats.totalClaims)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-body">Avg Monthly</p>
          <p className="text-lg font-semibold text-gray-900 font-data">
            {formatCurrency(stats.avgMonthly)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-body">Trend (3M)</p>
          <div className="flex items-center gap-1">
            {stats.trend > 0 ? (
              <TrendingUp className="w-4 h-4 text-red-500" />
            ) : (
              <TrendingUp className="w-4 h-4 text-green-500 transform rotate-180" />
            )}
            <p className={`text-lg font-semibold font-data ${
              stats.trend > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {Math.abs(stats.trend).toFixed(1)}%
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-body">Peak Month</p>
          <p className="text-lg font-semibold text-gray-900 font-data">
            {stats.maxMonth}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ClaimsBreakdownChart;
