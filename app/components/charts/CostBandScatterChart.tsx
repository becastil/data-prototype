'use client';

import React from 'react';
import {
  ComposedChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';

interface ChartDataPoint {
  claimantNumber: number;
  medical: number;
  rx: number;
  total: number;
  serviceType: string;
  band: string;
  color: string;
}

interface CostBandScatterChartProps {
  data: any[];
}

const CostBandScatterChart: React.FC<CostBandScatterChartProps> = ({ data }) => {
  const processData = (): ChartDataPoint[] => {
    return data.map(row => {
      const medical = parseFloat(String(row.Medical || '0').replace(/[$,]/g, ''));
      const rx = parseFloat(String(row.Rx || '0').replace(/[$,]/g, ''));
      const total = parseFloat(String(row.Total || '0').replace(/[$,]/g, ''));
      
      let band = '';
      let color = '';
      
      if (total <= 25000) {
        band = '$0-25K';
        color = '#10B981'; // green
      } else if (total <= 50000) {
        band = '$25K-50K';
        color = '#F59E0B'; // yellow
      } else if (total <= 75000) {
        band = '$50K-75K';
        color = '#F97316'; // orange
      } else if (total <= 100000) {
        band = '$75K-100K';
        color = '#EF4444'; // red
      } else {
        band = '$100K+';
        color = '#991B1B'; // dark red
      }
      
      return {
        claimantNumber: parseInt(row['Claimant Number']) || 0,
        medical,
        rx,
        total,
        serviceType: row['Service Type'] || 'Unknown',
        band,
        color
      };
    });
  };

  const chartData = processData();
  
  // Calculate band statistics
  const bandStats = chartData.reduce((acc, item) => {
    if (!acc[item.band]) {
      acc[item.band] = { count: 0, total: 0, color: item.color };
    }
    acc[item.band].count++;
    acc[item.band].total += item.total;
    return acc;
  }, {} as Record<string, { count: number; total: number; color: string }>);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded shadow-lg border border-gray-200">
          <p className="font-semibold mb-1">Claimant #{data.claimantNumber}</p>
          <p className="text-sm text-gray-600 mb-2">{data.serviceType}</p>
          <p className="text-sm">Medical: ${data.medical.toLocaleString()}</p>
          <p className="text-sm">Rx: ${data.rx.toLocaleString()}</p>
          <p className="text-sm font-semibold">Total: ${data.total.toLocaleString()}</p>
          <p className="text-sm mt-1" style={{ color: data.color }}>Band: {data.band}</p>
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number) => `$${(value / 1000).toFixed(0)}K`;

  return (
    <div className="w-full h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">HCC Band Distribution</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(bandStats).map(([band, stats]) => (
            <motion.div
              key={band}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-lg"
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stats.color }}
              />
              <span className="text-sm font-medium">{band}:</span>
              <span className="text-sm">{stats.count} claimants</span>
            </motion.div>
          ))}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 80, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          
          <XAxis 
            dataKey="claimantNumber"
            label={{ value: 'Claimant Number', position: 'insideBottom', offset: -10 }}
            tick={{ fontSize: 12 }}
          />
          
          <YAxis 
            yAxisId="left"
            orientation="left"
            tickFormatter={formatYAxis}
            label={{ value: 'Medical Costs', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
            stroke="#3B82F6"
          />
          
          <YAxis 
            yAxisId="right"
            orientation="right"
            tickFormatter={formatYAxis}
            label={{ value: 'Rx Costs', angle: 90, position: 'insideRight' }}
            tick={{ fontSize: 12 }}
            stroke="#10B981"
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            content={() => (
              <div className="flex justify-center space-x-4 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-sm text-black">Medical (Left Axis)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm text-black">Rx (Right Axis)</span>
                </div>
              </div>
            )}
          />
          
          {/* Reference lines for cost bands */}
          <ReferenceLine yAxisId="left" y={25000} stroke="#10B981" strokeDasharray="5 5" />
          <ReferenceLine yAxisId="left" y={50000} stroke="#F59E0B" strokeDasharray="5 5" />
          <ReferenceLine yAxisId="left" y={75000} stroke="#F97316" strokeDasharray="5 5" />
          <ReferenceLine yAxisId="left" y={100000} stroke="#EF4444" strokeDasharray="5 5" />
          
          {/* Medical costs scatter */}
          <Scatter
            yAxisId="left"
            dataKey="medical"
            fill="#3B82F6"
            shape={(props: any) => {
              const { cx, cy, payload } = props;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={Math.min(8, 3 + (payload.total / 50000) * 5)}
                  fill={payload.color}
                  fillOpacity={0.7}
                  stroke={payload.color}
                  strokeWidth={1}
                />
              );
            }}
          />
          
          {/* Rx costs scatter */}
          <Scatter
            yAxisId="right"
            dataKey="rx"
            fill="#10B981"
            shape={(props: any) => {
              const { cx, cy, payload } = props;
              return (
                <diamond
                  cx={cx}
                  cy={cy}
                  size={Math.min(8, 3 + (payload.total / 50000) * 5)}
                  fill={payload.color}
                  fillOpacity={0.5}
                  stroke={payload.color}
                  strokeWidth={1}
                />
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// Diamond shape component for Rx scatter points
const diamond = (props: any) => {
  const { cx, cy, size, fill, fillOpacity, stroke, strokeWidth } = props;
  const halfSize = size / 2;
  
  return (
    <polygon
      points={`${cx},${cy - halfSize} ${cx + halfSize},${cy} ${cx},${cy + halfSize} ${cx - halfSize},${cy}`}
      fill={fill}
      fillOpacity={fillOpacity}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
};

export default CostBandScatterChart;
