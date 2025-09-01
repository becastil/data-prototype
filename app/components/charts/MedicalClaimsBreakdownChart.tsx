'use client';

import React, { useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Sector
} from 'recharts';
import { motion } from 'framer-motion';
import { Activity, DollarSign, PieChart as PieIcon } from 'lucide-react';

interface MedicalClaimsBreakdownChartProps {
  budgetData: any[];
  claimsData: any[];
}

const MedicalClaimsBreakdownChart: React.FC<MedicalClaimsBreakdownChartProps> = ({ 
  budgetData, 
  claimsData 
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<'current' | 'ytd' | 'all'>('ytd');

  // Process data for pie chart
  const pieData = useMemo(() => {
    if (!budgetData || budgetData.length === 0) return [];
    
    let dataToProcess = [];
    
    // Select data based on time range
    switch (timeRange) {
      case 'current':
        dataToProcess = budgetData.slice(-1); // Last month only
        break;
      case 'ytd':
        dataToProcess = budgetData.slice(-12); // Last 12 months
        break;
      case 'all':
        dataToProcess = budgetData; // All available data
        break;
    }
    
    // Aggregate totals
    const totals = {
      inpatient: 0,
      outpatient: 0,
      professional: 0,
      emergency: 0,
      other: 0
    };
    
    dataToProcess.forEach(row => {
      const parseValue = (value: any): number => {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        return parseFloat(String(value).replace(/[$,]/g, '')) || 0;
      };
      
      // Extract medical subcategories
      const inpatient = parseValue(row['Inpatient'] || row['inpatient'] || 0);
      const outpatient = parseValue(row['Outpatient'] || row['outpatient'] || 0);
      const professional = parseValue(row['Professional'] || row['professional'] || 0);
      const emergency = parseValue(row['Emergency'] || row['emergency'] || 0);
      
      // If no breakdown available, estimate from total medical claims
      const medicalClaims = parseValue(row['Medical Claims'] || row['medical_claims'] || 0);
      
      if (inpatient || outpatient || professional || emergency) {
        totals.inpatient += inpatient;
        totals.outpatient += outpatient;
        totals.professional += professional;
        totals.emergency += emergency;
      } else if (medicalClaims > 0) {
        // Estimate breakdown if not available
        totals.inpatient += medicalClaims * 0.40;
        totals.outpatient += medicalClaims * 0.35;
        totals.professional += medicalClaims * 0.20;
        totals.emergency += medicalClaims * 0.05;
      }
    });
    
    // Convert to pie chart format
    const data = [
      { name: 'Inpatient', value: totals.inpatient, percentage: 0 },
      { name: 'Outpatient', value: totals.outpatient, percentage: 0 },
      { name: 'Professional', value: totals.professional, percentage: 0 },
      { name: 'Emergency', value: totals.emergency, percentage: 0 }
    ].filter(item => item.value > 0);
    
    // Calculate percentages
    const total = data.reduce((sum, item) => sum + item.value, 0);
    data.forEach(item => {
      item.percentage = total > 0 ? (item.value / total) * 100 : 0;
    });
    
    return data;
  }, [budgetData, timeRange]);

  // Calculate total value
  const totalValue = useMemo(() => {
    return pieData.reduce((sum, item) => sum + item.value, 0);
  }, [pieData]);

  // Colors for each category
  const COLORS = {
    'Inpatient': '#FF6B6B',      // Red
    'Outpatient': '#4ECDC4',     // Teal
    'Professional': '#45B7D1',    // Light Blue
    'Emergency': '#FFA07A',       // Light Salmon
    'Other': '#95A5A6'            // Gray
  };

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Custom active shape for interactive pie
  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const {
      cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-semibold">
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-sm font-data">
          {formatCurrency(value)}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs">
          {`${(percent * 100).toFixed(1)}%`}
        </text>
      </g>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800 font-subheading">{data.name}</p>
          <p className="text-sm font-data">{formatCurrency(data.value)}</p>
          <p className="text-xs text-gray-600">{data.payload.percentage.toFixed(1)}% of total</p>
        </div>
      );
    }
    return null;
  };

  if (!pieData || pieData.length === 0) {
    return (
      <div className="panel-elevated rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 font-heading">
          Medical Claims Breakdown
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
          Medical Claims Breakdown
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('current')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              timeRange === 'current'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md'
                : 'bg-white/70 text-gray-700 hover:bg-white/90'
            }`}
          >
            Current Month
          </button>
          <button
            onClick={() => setTimeRange('ytd')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              timeRange === 'ytd'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md'
                : 'bg-white/70 text-gray-700 hover:bg-white/90'
            }`}
          >
            YTD
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              timeRange === 'all'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md'
                : 'bg-white/70 text-gray-700 hover:bg-white/90'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex">
        {/* Pie Chart */}
        <div className="flex-1 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend and Stats */}
        <div className="w-48 pl-4">
          <div className="space-y-3">
            {pieData.map((entry, index) => (
              <div 
                key={entry.name}
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] }}
                  />
                  <span className="text-sm text-gray-700 font-body">{entry.name}</span>
                </div>
                <span className="text-xs text-gray-600 font-data">
                  {entry.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 mt-4 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 font-body">Total Medical</span>
              <Activity className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-lg font-bold text-gray-900 font-data">
              {formatCurrency(totalValue)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {timeRange === 'current' ? 'Current Month' : 
               timeRange === 'ytd' ? 'Year to Date' : 'All Time'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200">
        {pieData.map(item => (
          <div key={item.name}>
            <p className="text-xs text-gray-600 font-body">{item.name}</p>
            <p className="text-sm font-semibold text-gray-900 font-data">
              {formatCurrency(item.value)}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default MedicalClaimsBreakdownChart;
