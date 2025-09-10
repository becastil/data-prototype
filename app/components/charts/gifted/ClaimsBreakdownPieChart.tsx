'use client';

import React, { useMemo } from 'react';
import { PieChart } from 'react-gifted-charts';
import { motion } from 'framer-motion';
import { Activity, Pill, Building2, UserX } from 'lucide-react';
import { GlassCard } from '@/app/components/ui/glass-card';
import { AnimatedNumber } from '@/app/components/ui/animated-number';
import { formatCurrency, parseNumericValue } from '@utils/chartDataProcessors';

interface ClaimsBreakdownPieChartProps {
  data: any[];
  loading?: boolean;
  error?: string;
}

interface ClaimsBreakdown {
  category: string;
  subcategory?: string;
  amount: number;
  percentage: number;
  color: string;
  icon?: React.ReactNode;
}

const ClaimsBreakdownPieChart: React.FC<ClaimsBreakdownPieChartProps> = ({ 
  data, 
  loading = false, 
  error = ''
}) => {
  // Process claims data into breakdown
  const claimsBreakdown = useMemo(() => {
    if (!data || data.length === 0) return { pieData: [], totalClaims: 0, breakdown: [] };

    // Aggregate all claims data
    let totalMedical = 0;
    let totalPharmacy = 0;
    let inpatient = 0;
    let outpatient = 0;
    let professional = 0;
    let emergency = 0;
    let genericRx = 0;
    let specialtyRx = 0;

    data.forEach(row => {
      // Medical claims breakdown
      totalMedical += parseNumericValue(row['Medical Claims']) || parseNumericValue(row['Medical']) || 0;
      inpatient += parseNumericValue(row['Inpatient']) || 0;
      outpatient += parseNumericValue(row['Outpatient']) || 0;
      professional += parseNumericValue(row['Professional']) || 0;
      emergency += parseNumericValue(row['Emergency']) || 0;

      // Pharmacy claims breakdown
      totalPharmacy += parseNumericValue(row['Pharmacy Claims']) || 
                      parseNumericValue(row['Rx Claims']) || 
                      parseNumericValue(row['Rx']) || 
                      parseNumericValue(row['Pharmacy']) || 0;
      genericRx += parseNumericValue(row['Generic Rx']) || parseNumericValue(row['Generic']) || 0;
      specialtyRx += parseNumericValue(row['Specialty Rx']) || parseNumericValue(row['Specialty']) || 0;
    });

    const totalClaims = totalMedical + totalPharmacy;

    // If we don't have subcategory data, estimate based on typical distributions
    if (inpatient === 0 && outpatient === 0 && professional === 0 && emergency === 0 && totalMedical > 0) {
      inpatient = totalMedical * 0.45;      // 45% typically inpatient
      outpatient = totalMedical * 0.35;     // 35% outpatient
      professional = totalMedical * 0.15;   // 15% professional
      emergency = totalMedical * 0.05;      // 5% emergency
    }

    if (genericRx === 0 && specialtyRx === 0 && totalPharmacy > 0) {
      genericRx = totalPharmacy * 0.75;     // 75% typically generic
      specialtyRx = totalPharmacy * 0.25;   // 25% specialty
    }

    // Create breakdown data
    const breakdown: ClaimsBreakdown[] = [
      // Medical subcategories
      {
        category: 'Medical',
        subcategory: 'Inpatient',
        amount: inpatient,
        percentage: totalClaims > 0 ? (inpatient / totalClaims) * 100 : 0,
        color: '#1f2937',
        icon: <Building2 className="w-4 h-4" />
      },
      {
        category: 'Medical',
        subcategory: 'Outpatient',
        amount: outpatient,
        percentage: totalClaims > 0 ? (outpatient / totalClaims) * 100 : 0,
        color: '#374151',
        icon: <Activity className="w-4 h-4" />
      },
      {
        category: 'Medical',
        subcategory: 'Professional',
        amount: professional,
        percentage: totalClaims > 0 ? (professional / totalClaims) * 100 : 0,
        color: '#4b5563',
        icon: <UserX className="w-4 h-4" />
      },
      {
        category: 'Medical',
        subcategory: 'Emergency',
        amount: emergency,
        percentage: totalClaims > 0 ? (emergency / totalClaims) * 100 : 0,
        color: '#6b7280',
        icon: <Activity className="w-4 h-4" />
      },
      // Pharmacy subcategories
      {
        category: 'Pharmacy',
        subcategory: 'Generic',
        amount: genericRx,
        percentage: totalClaims > 0 ? (genericRx / totalClaims) * 100 : 0,
        color: '#059669',
        icon: <Pill className="w-4 h-4" />
      },
      {
        category: 'Pharmacy',
        subcategory: 'Specialty',
        amount: specialtyRx,
        percentage: totalClaims > 0 ? (specialtyRx / totalClaims) * 100 : 0,
        color: '#dc2626',
        icon: <Pill className="w-4 h-4" />
      }
    ].filter(item => item.amount > 0);

    // Format data for react-gifted-charts
    const pieData = breakdown.map(item => ({
      value: item.amount,
      color: item.color,
      text: `${item.percentage.toFixed(1)}%`,
      textColor: 'white',
      textSize: 12,
      shiftTextX: 0,
      shiftTextY: 0,
      label: item.subcategory,
      labelPosition: 'outward' as const,
    }));

    return { pieData, totalClaims, breakdown };
  }, [data]);

  // Calculate main category totals
  const categoryTotals = useMemo(() => {
    const medical = claimsBreakdown.breakdown
      .filter(item => item.category === 'Medical')
      .reduce((sum, item) => sum + item.amount, 0);
    
    const pharmacy = claimsBreakdown.breakdown
      .filter(item => item.category === 'Pharmacy')
      .reduce((sum, item) => sum + item.amount, 0);

    const medicalPercent = claimsBreakdown.totalClaims > 0 ? (medical / claimsBreakdown.totalClaims) * 100 : 0;
    const pharmacyPercent = claimsBreakdown.totalClaims > 0 ? (pharmacy / claimsBreakdown.totalClaims) * 100 : 0;

    return { medical, pharmacy, medicalPercent, pharmacyPercent };
  }, [claimsBreakdown]);

  if (loading) {
    return (
      <GlassCard variant="elevated" className="p-6 h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4 mx-auto"></div>
            <div className="w-64 h-64 bg-gray-200 rounded-full mb-4 mx-auto"></div>
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
              Claims Breakdown
            </h3>
            <p className="text-sm text-gray-600">
              Medical vs Pharmacy distribution
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">
              Total Claims
            </p>
            <p className="text-xl font-bold text-gray-800">
              <AnimatedNumber value={claimsBreakdown.totalClaims} format="currency" />
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="flex items-center justify-center">
            {claimsBreakdown.pieData.length > 0 ? (
              <PieChart
                data={claimsBreakdown.pieData}
                donut
                innerRadius={60}
                radius={100}
                isAnimated
                animationDuration={800}
                showGradient
                gradientCenterColor="white"
                centerLabelComponent={() => (
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Total</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {formatCurrency(claimsBreakdown.totalClaims)}
                    </p>
                  </div>
                )}
              />
            ) : (
              <div className="flex items-center justify-center h-48">
                <p className="text-gray-500">No claims data available</p>
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="space-y-4">
            {/* Medical */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-gray-700" />
                  <h4 className="font-semibold text-gray-800">Medical Claims</h4>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">
                    {formatCurrency(categoryTotals.medical)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {categoryTotals.medicalPercent.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {claimsBreakdown.breakdown
                  .filter(item => item.category === 'Medical')
                  .map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-gray-700">{item.subcategory}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-800 font-medium">
                          {formatCurrency(item.amount)}
                        </span>
                        <span className="text-gray-500 ml-2">
                          ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Pharmacy */}
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-green-700" />
                  <h4 className="font-semibold text-gray-800">Pharmacy Claims</h4>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">
                    {formatCurrency(categoryTotals.pharmacy)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {categoryTotals.pharmacyPercent.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {claimsBreakdown.breakdown
                  .filter(item => item.category === 'Pharmacy')
                  .map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-gray-700">{item.subcategory}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-800 font-medium">
                          {formatCurrency(item.amount)}
                        </span>
                        <span className="text-gray-500 ml-2">
                          ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default ClaimsBreakdownPieChart;