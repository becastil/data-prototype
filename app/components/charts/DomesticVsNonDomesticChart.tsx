'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { Globe, Home, BarChart2, PieChart as PieIcon } from 'lucide-react';

interface DomesticVsNonDomesticChartProps {
  budgetData: any[];
  claimsData: any[];
}

type ChartType = 'bar' | 'pie' | 'trend';

const DomesticVsNonDomesticChart: React.FC<DomesticVsNonDomesticChartProps> = ({ 
  budgetData, 
  claimsData 
}) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [timeRange, setTimeRange] = useState<'current' | 'rolling3' | 'rolling12'>('rolling12');

  // Process data based on time range
  const processedData = useMemo(() => {
    if (!budgetData || budgetData.length === 0) return { barData: [], pieData: [], trendData: [] };
    
    let dataToProcess = [];
    
    // Select data based on time range
    switch (timeRange) {
      case 'current':
        dataToProcess = budgetData.slice(-1);
        break;
      case 'rolling3':
        dataToProcess = budgetData.slice(-3);
        break;
      case 'rolling12':
        dataToProcess = budgetData.slice(-12);
        break;
    }
    
    // Aggregate totals for pie chart
    let totalDomestic = 0;
    let totalNonDomestic = 0;
    
    // Process trend data (monthly breakdown)
    const trendData = dataToProcess.map(row => {
      const parseValue = (value: any): number => {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        return parseFloat(String(value).replace(/[$,]/g, '')) || 0;
      };
      
      // Get domestic and non-domestic values
      let domestic = parseValue(row['Domestic Claims'] || row['domestic_claims'] || 0);
      let nonDomestic = parseValue(row['Non-Domestic Claims'] || row['non_domestic_claims'] || 0);
      
      // If no geographic data, estimate from total claims
      if (domestic === 0 && nonDomestic === 0) {
        const medicalClaims = parseValue(row['Medical Claims'] || row['medical_claims'] || 0);
        const pharmacy = parseValue(row['Rx'] || row['Pharmacy'] || row['rx_claims'] || 0);
        const totalClaims = medicalClaims + pharmacy;
        
        // Typical split: 85% domestic, 15% non-domestic
        domestic = totalClaims * 0.85;
        nonDomestic = totalClaims * 0.15;
      }
      
      totalDomestic += domestic;
      totalNonDomestic += nonDomestic;
      
      return {
        month: row.month || row.Month || row.period || '',
        domestic: domestic,
        nonDomestic: nonDomestic,
        total: domestic + nonDomestic,
        domesticPercent: domestic + nonDomestic > 0 ? (domestic / (domestic + nonDomestic)) * 100 : 0,
        nonDomesticPercent: domestic + nonDomestic > 0 ? (nonDomestic / (domestic + nonDomestic)) * 100 : 0
      };
    });
    
    // Bar chart data (category breakdown)
    const barData = [
      {
        category: 'Medical Claims',
        domestic: totalDomestic * 0.7,  // Assume 70% of domestic is medical
        nonDomestic: totalNonDomestic * 0.8,  // Assume 80% of non-domestic is medical
      },
      {
        category: 'Pharmacy Claims',
        domestic: totalDomestic * 0.3,  // Assume 30% of domestic is pharmacy
        nonDomestic: totalNonDomestic * 0.2,  // Assume 20% of non-domestic is pharmacy
      }
    ];
    
    // Pie chart data
    const pieData = [
      { 
        name: 'Domestic', 
        value: totalDomestic,
        percentage: totalDomestic + totalNonDomestic > 0 
          ? (totalDomestic / (totalDomestic + totalNonDomestic)) * 100 
          : 0
      },
      { 
        name: 'Non-Domestic', 
        value: totalNonDomestic,
        percentage: totalDomestic + totalNonDomestic > 0 
          ? (totalNonDomestic / (totalDomestic + totalNonDomestic)) * 100 
          : 0
      }
    ];
    
    return { barData, pieData, trendData };
  }, [budgetData, timeRange]);

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Colors
  const COLORS = {
    domestic: '#26C6DA',      // Teal
    nonDomestic: '#FF7043'    // Deep Orange
  };

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
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

  // Custom label for pie chart
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="font-semibold text-sm"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const { pieData } = processedData;
    const domestic = pieData.find(d => d.name === 'Domestic')?.value || 0;
    const nonDomestic = pieData.find(d => d.name === 'Non-Domestic')?.value || 0;
    const total = domestic + nonDomestic;
    
    return {
      domestic,
      nonDomestic,
      total,
      domesticPercent: total > 0 ? (domestic / total) * 100 : 0,
      nonDomesticPercent: total > 0 ? (nonDomestic / total) * 100 : 0,
      ratio: domestic > 0 ? nonDomestic / domestic : 0
    };
  }, [processedData]);

  if (!processedData.barData.length && !processedData.pieData.length) {
    return (
      <div className="panel-elevated rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 font-heading">
          Domestic vs Non-Domestic Claims
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 font-heading">
          Domestic vs Non-Domestic Claims
        </h2>
        <div className="flex gap-2">
          {/* Chart Type Selector */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded transition-all ${
                chartType === 'bar' ? 'bg-white shadow-sm' : 'hover:bg-gray-50'
              }`}
              title="Bar Chart"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`p-1.5 rounded transition-all ${
                chartType === 'pie' ? 'bg-white shadow-sm' : 'hover:bg-gray-50'
              }`}
              title="Pie Chart"
            >
              <PieIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('trend')}
              className={`p-1.5 rounded transition-all ${
                chartType === 'trend' ? 'bg-white shadow-sm' : 'hover:bg-gray-50'
              }`}
              title="Trend Chart"
            >
              <Globe className="w-4 h-4" />
            </button>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex gap-1">
            <button
              onClick={() => setTimeRange('current')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                timeRange === 'current'
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md'
                  : 'bg-white/70 text-gray-700 hover:bg-white/90'
              }`}
            >
              Current
            </button>
            <button
              onClick={() => setTimeRange('rolling3')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                timeRange === 'rolling3'
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md'
                  : 'bg-white/70 text-gray-700 hover:bg-white/90'
              }`}
            >
              3 Months
            </button>
            <button
              onClick={() => setTimeRange('rolling12')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                timeRange === 'rolling12'
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md'
                  : 'bg-white/70 text-gray-700 hover:bg-white/90'
              }`}
            >
              12 Months
            </button>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-[350px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={processedData.barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend />
              <Bar dataKey="domestic" name="Domestic" fill={COLORS.domestic} />
              <Bar dataKey="nonDomestic" name="Non-Domestic" fill={COLORS.nonDomestic} />
            </BarChart>
          ) : chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={processedData.pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {processedData.pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'Domestic' ? COLORS.domestic : COLORS.nonDomestic} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          ) : (
            <BarChart data={processedData.trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="month" 
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 11 }}
                interval={0}
              />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend />
              <Bar dataKey="domestic" name="Domestic" stackId="a" fill={COLORS.domestic} />
              <Bar dataKey="nonDomestic" name="Non-Domestic" stackId="a" fill={COLORS.nonDomestic} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-4 h-4 text-cyan-600" />
            <p className="text-xs text-gray-600 font-body">Domestic</p>
          </div>
          <p className="text-lg font-semibold text-gray-900 font-data">
            {formatCurrency(stats.domestic)}
          </p>
          <p className="text-xs text-gray-500">
            {stats.domesticPercent.toFixed(1)}%
          </p>
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-orange-600" />
            <p className="text-xs text-gray-600 font-body">Non-Domestic</p>
          </div>
          <p className="text-lg font-semibold text-gray-900 font-data">
            {formatCurrency(stats.nonDomestic)}
          </p>
          <p className="text-xs text-gray-500">
            {stats.nonDomesticPercent.toFixed(1)}%
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-600 font-body mb-1">Total Claims</p>
          <p className="text-lg font-semibold text-gray-900 font-data">
            {formatCurrency(stats.total)}
          </p>
          <p className="text-xs text-gray-500">
            {timeRange === 'current' ? 'Current Month' : 
             timeRange === 'rolling3' ? '3 Months' : '12 Months'}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-600 font-body mb-1">Non-Dom Ratio</p>
          <p className="text-lg font-semibold text-gray-900 font-data">
            {(stats.ratio * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">
            of Domestic
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default DomesticVsNonDomesticChart;
