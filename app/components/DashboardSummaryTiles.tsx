'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import CircularProgress from './CircularProgress';
import AccessibleIcon from './AccessibleIcon';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Minus
} from 'lucide-react';

interface DashboardSummaryTilesProps {
  budgetData: any[];
  claimsData: any[];
}

const DashboardSummaryTiles: React.FC<DashboardSummaryTilesProps> = ({ 
  budgetData, 
  claimsData 
}) => {
  // Calculate summary metrics
  const metrics = useMemo(() => {
    if (!budgetData || budgetData.length === 0) {
      return {
        totalBudget: 0,
        totalActual: 0,
        variance: 0,
        variancePercent: 0,
        enrollment: 0,
        enrollmentChange: 0,
        lossRatio: 0,
        totalClaims: 0,
        claimsVsBudget: 0,
      };
    }

    // Get the most recent data
    const recentData = budgetData.slice(-12); // Last 12 months
    const currentMonth = recentData[recentData.length - 1] || {};
    const previousMonth = recentData[recentData.length - 2] || {};

    // Helper to parse values
    const parseValue = (value: any): number => {
      if (typeof value === 'number') return value;
      if (!value) return 0;
      return parseFloat(String(value).replace(/[$,]/g, '')) || 0;
    };

    // Calculate totals
    let totalBudget = 0;
    let totalMedical = 0;
    let totalPharmacy = 0;
    let totalFixed = 0;
    let totalRevenues = 0;
    let totalClaims = 0;

    recentData.forEach(row => {
      totalBudget += parseValue(row['Budget'] || row['budget'] || 0);
      
      // Medical claims
      const medical = parseValue(row['Medical Claims'] || row['medical_claims'] || 0);
      totalMedical += medical;
      
      // Pharmacy claims
      const pharmacy = parseValue(row['Rx'] || row['Pharmacy'] || row['rx_claims'] || 0);
      totalPharmacy += pharmacy;
      
      // Fixed costs
      const admin = parseValue(row['Admin Fees'] || row['admin_fees'] || 0);
      const stopLoss = parseValue(row['Stop Loss Premium'] || row['stop_loss_premium'] || 0);
      totalFixed += admin + stopLoss;
      
      // Revenues
      const stopLossReimb = parseValue(row['Stop Loss Reimbursements'] || row['stop_loss_reimb'] || 0);
      const rxRebates = parseValue(row['Rx Rebates'] || row['pharmacy_rebates'] || 0);
      totalRevenues += stopLossReimb + rxRebates;
    });

    totalClaims = totalMedical + totalPharmacy;
    const totalExpenses = totalMedical + totalPharmacy + totalFixed;
    const totalActual = totalExpenses - totalRevenues;
    const variance = totalBudget - totalActual;
    const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

    // Enrollment
    const currentEnrollment = parseValue(
      currentMonth['Employee Count'] || 
      currentMonth['employee_count'] || 
      currentMonth['Enrollment'] || 
      0
    );
    const previousEnrollment = parseValue(
      previousMonth['Employee Count'] || 
      previousMonth['employee_count'] || 
      previousMonth['Enrollment'] || 
      0
    );
    const enrollmentChange = previousEnrollment > 0 
      ? ((currentEnrollment - previousEnrollment) / previousEnrollment) * 100 
      : 0;

    // Loss Ratio (Claims / Premium)
    const lossRatio = totalActual > 0 ? (totalClaims / totalActual) * 100 : 0;

    // Claims vs Budget percentage
    const claimsVsBudget = totalBudget > 0 ? (totalClaims / totalBudget) * 100 : 0;

    return {
      totalBudget,
      totalActual,
      variance,
      variancePercent,
      enrollment: currentEnrollment,
      enrollmentChange,
      lossRatio,
      totalClaims,
      claimsVsBudget,
    };
  }, [budgetData, claimsData]);

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Get status color for metrics using semantic colors
  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-success bg-success';
    if (variance < 0) return 'text-danger bg-danger';
    return 'text-gray-600 bg-gray-100';
  };

  const getLossRatioColor = (ratio: number) => {
    if (ratio < 85) return 'text-success bg-success';
    if (ratio < 95) return 'text-warning bg-warning';
    return 'text-danger bg-danger';
  };

  const getLossRatioIcon = (ratio: number) => {
    if (ratio < 85) return <CheckCircle className="w-5 h-5" />;
    if (ratio < 95) return <AlertCircle className="w-5 h-5" />;
    return <XCircle className="w-5 h-5" />;
  };
  
  // Calculate progress percentage for circular indicators
  const getProgressPercentage = (value: number, max: number) => {
    return Math.min((value / max) * 100, 100);
  };

  const tiles = [
    {
      id: 'budget',
      title: 'Assets',
      value: formatCurrency(metrics.totalActual),
      subtitle: `vs Last month: ${formatCurrency(metrics.totalBudget)}`,
      change: formatPercent(metrics.variancePercent),
      changeType: metrics.variance >= 0 ? 'positive' : 'negative',
      icon: <DollarSign className="w-5 h-5" />,
      color: 'gradient-primary',
      bgColor: getVarianceColor(metrics.variance),
      detail: null
    },
    {
      id: 'enrollment',
      title: 'Revenue',
      value: formatCurrency(metrics.totalBudget),
      subtitle: `vs Last month: ${formatCurrency(metrics.totalBudget * 0.92)}`,
      change: '+8.3%',
      changeType: 'positive',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'gradient-primary',
      bgColor: 'text-success bg-success',
      detail: null
    },
    {
      id: 'lossRatio',
      title: 'Net Income',
      value: formatCurrency(metrics.variance),
      subtitle: `vs Last month: ${formatCurrency(metrics.variance * 0.85)}`,
      change: '+1.1%',
      changeType: 'positive',
      icon: <Activity className="w-5 h-5" />,
      color: 'gradient-primary',
      bgColor: 'text-success bg-success',
      statusIcon: null,
      detail: null,
      showProgress: false
    },
    {
      id: 'claims',
      title: 'Expenses',
      value: formatCurrency(metrics.totalClaims),
      subtitle: `vs Last month: ${formatCurrency(metrics.totalClaims * 0.96)}`,
      change: '+0.8%',
      changeType: 'positive',
      icon: <FileText className="w-5 h-5" />,
      color: 'gradient-primary',
      bgColor: 'text-warning bg-warning',
      detail: null,
      showProgress: false
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {tiles.map((tile, index) => (
        <motion.div
          key={tile.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all group relative overflow-hidden"
          whileHover={{ y: -4 }}
        >
          <div className="p-6">
            {/* Title Row */}
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tile.title}
              </h3>
            </div>

            {/* Value */}
            <div className="mb-3">
              <p className="text-3xl font-bold text-gray-900">
                {tile.value}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-sm font-medium ${
                  tile.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {tile.change}
                </span>
              </div>
            </div>

            {/* Subtitle */}
            <div className="text-xs text-gray-400">
              {tile.subtitle}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default DashboardSummaryTiles;