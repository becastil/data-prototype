'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';

interface EnrollmentLineChartProps {
  budgetData: any[];
}

const EnrollmentLineChart: React.FC<EnrollmentLineChartProps> = ({ budgetData }) => {
  // Generate enrollment data based on budget data months
  const generateEnrollmentData = () => {
    // Base enrollment with some variation
    const baseEnrollment = 1500;
    const variation = 200;
    
    return budgetData.map((item, index) => {
      // Create realistic enrollment fluctuations
      const seasonalFactor = Math.sin((index / 12) * 2 * Math.PI) * 50;
      const growthFactor = index * 5; // Gradual growth over time
      const randomFactor = (Math.random() - 0.5) * variation;
      
      const totalEnrollment = Math.round(
        baseEnrollment + seasonalFactor + growthFactor + randomFactor
      );
      
      // Split into categories
      const activeEmployees = Math.round(totalEnrollment * 0.65);
      const dependents = Math.round(totalEnrollment * 0.30);
      const retirees = Math.round(totalEnrollment * 0.05);
      
      return {
        month: item.month || `Month ${index + 1}`,
        totalEnrollment,
        activeEmployees,
        dependents,
        retirees
      };
    });
  };

  const enrollmentData = generateEnrollmentData();

  // Calculate statistics
  const currentEnrollment = enrollmentData[enrollmentData.length - 1]?.totalEnrollment || 0;
  const previousEnrollment = enrollmentData[enrollmentData.length - 2]?.totalEnrollment || 0;
  const enrollmentChange = currentEnrollment - previousEnrollment;
  const percentageChange = previousEnrollment ? 
    ((enrollmentChange / previousEnrollment) * 100).toFixed(1) : '0';
  
  const avgEnrollment = Math.round(
    enrollmentData.reduce((sum, item) => sum + item.totalEnrollment, 0) / enrollmentData.length
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded shadow-lg border border-gray-200">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with statistics */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Enrollment Trends</h3>
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
                  {currentEnrollment.toLocaleString()}
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
              enrollmentChange >= 0 ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Change</p>
                <p className={`text-lg font-bold ${
                  enrollmentChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {enrollmentChange >= 0 ? '+' : ''}{enrollmentChange} ({percentageChange}%)
                </p>
              </div>
              {enrollmentChange >= 0 ? (
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
                  {avgEnrollment.toLocaleString()}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center">
                <span className="text-purple-600 font-bold text-xs">AVG</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={enrollmentData}
            margin={{ top: 10, right: 30, left: 0, bottom: 40 }}
          >
            <defs>
              <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="employeeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="dependentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            
            <XAxis 
              dataKey="month" 
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 11 }}
            />
            
            <YAxis 
              tick={{ fontSize: 11 }}
              label={{ 
                value: 'Enrollment Count', 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: 12 }
              }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="line"
            />
            
            <Area
              type="monotone"
              dataKey="totalEnrollment"
              stroke="#3B82F6"
              strokeWidth={3}
              fill="url(#totalGradient)"
              name="Total Enrollment"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            
            <Line
              type="monotone"
              dataKey="activeEmployees"
              stroke="#10B981"
              strokeWidth={2}
              name="Active Employees"
              strokeDasharray="5 5"
              dot={false}
            />
            
            <Line
              type="monotone"
              dataKey="dependents"
              stroke="#F59E0B"
              strokeWidth={2}
              name="Dependents"
              strokeDasharray="3 3"
              dot={false}
            />
            
            <Line
              type="monotone"
              dataKey="retirees"
              stroke="#EF4444"
              strokeWidth={2}
              name="Retirees"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex justify-around text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-gray-600">Employees: {enrollmentData[enrollmentData.length - 1]?.activeEmployees || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-gray-600">Dependents: {enrollmentData[enrollmentData.length - 1]?.dependents || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-gray-600">Retirees: {enrollmentData[enrollmentData.length - 1]?.retirees || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentLineChart;
