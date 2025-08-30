'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import CircularProgress from './CircularProgress';
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
      title: 'Budget vs Actual',
      value: formatCurrency(metrics.totalActual),
      subtitle: `Budget: ${formatCurrency(metrics.totalBudget)}`,
      change: formatPercent(metrics.variancePercent),
      changeType: metrics.variance >= 0 ? 'positive' : 'negative',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'gradient-primary',
      bgColor: getVarianceColor(metrics.variance),
      detail: `Variance: ${formatCurrency(Math.abs(metrics.variance))}`
    },
    {
      id: 'enrollment',
      title: 'Current Enrollment',
      value: metrics.enrollment.toLocaleString(),
      subtitle: 'Total Members',
      change: formatPercent(metrics.enrollmentChange),
      changeType: metrics.enrollmentChange >= 0 ? 'positive' : 'negative',
      icon: <Users className="w-6 h-6" />,
      color: 'gradient-primary',
      bgColor: metrics.enrollmentChange >= 0 ? 'text-success bg-success' : 'text-danger bg-danger',
      detail: 'vs Previous Month'
    },
    {
      id: 'lossRatio',
      title: 'Loss Ratio',
      value: `${metrics.lossRatio.toFixed(1)}%`,
      subtitle: 'Claims / Premium',
      change: metrics.lossRatio < 85 ? 'Good' : metrics.lossRatio < 95 ? 'Warning' : 'High',
      changeType: 'status',
      icon: <Activity className="w-6 h-6" />,
      color: 'gradient-primary',
      bgColor: getLossRatioColor(metrics.lossRatio),
      statusIcon: getLossRatioIcon(metrics.lossRatio),
      detail: 'Target: < 85%',
      showProgress: true,
      progressValue: metrics.lossRatio,
      progressColor: metrics.lossRatio < 85 ? 'success' : metrics.lossRatio < 95 ? 'warning' : 'danger'
    },
    {
      id: 'claims',
      title: 'Total Claims YTD',
      value: formatCurrency(metrics.totalClaims),
      subtitle: `${metrics.claimsVsBudget.toFixed(1)}% of Budget`,
      change: metrics.claimsVsBudget < 100 ? 'Under Budget' : 'Over Budget',
      changeType: metrics.claimsVsBudget < 100 ? 'positive' : 'negative',
      icon: <FileText className="w-6 h-6" />,
      color: 'gradient-primary',
      bgColor: metrics.claimsVsBudget < 100 ? 'text-success bg-success' : 'text-danger bg-danger',
      detail: 'Medical + Pharmacy',
      showProgress: true,
      progressValue: metrics.claimsVsBudget,
      progressColor: metrics.claimsVsBudget < 100 ? 'success' : 'danger'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {tiles.map((tile, index) => (
        <motion.div
          key={tile.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="panel-elevated overflow-hidden transition-all hover:shadow-xl group relative"
          whileHover={{ scale: 1.02 }}
        >
          {/* Gradient Header Bar */}
          <div className={`h-1 ${tile.color} transition-all group-hover:h-1.5`} />
          
          <div className="p-5">
            {/* Gooey hover blob */}
            <motion.div
              className="absolute -top-10 -right-10 w-20 h-20 rounded-full opacity-0 group-hover:opacity-30 pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${tile.color === 'gradient-primary' ? 'var(--primary-blue)' : 'var(--keenan-tango)'}, transparent)`,
                filter: 'blur(20px)',
              }}
              animate={{
                x: [0, 10, 0],
                y: [0, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Title Row */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 font-body">
                {tile.title}
              </h3>
              <motion.div 
                className={`p-2.5 ${tile.bgColor} transition-all circular flex items-center justify-center`}
                whileHover={{ 
                  rotate: [0, -10, 10, -10, 0],
                  transition: { duration: 0.5 }
                }}
              >
                {tile.icon}
              </motion.div>
            </div>

            {/* Value and Progress */}
            <div className="mb-2 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-data">
                  {tile.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-body mt-1">
                  {tile.subtitle}
                </p>
              </div>
              {tile.showProgress && (
                <CircularProgress 
                  value={tile.progressValue} 
                  max={100}
                  size="sm"
                  color={tile.progressColor as any}
                  showPercentage={false}
                />
              )}
            </div>

            {/* Change Indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`badge ${
                  tile.changeType === 'positive' ? 'badge-success' : 
                  tile.changeType === 'negative' ? 'badge-danger' : 
                  tile.changeType === 'status' ? 
                    (tile.change === 'Good' ? 'badge-success' : 
                     tile.change === 'Warning' ? 'badge-warning' : 'badge-danger') : 
                  'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {tile.changeType === 'positive' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : tile.changeType === 'negative' ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : tile.changeType === 'status' ? (
                    <span className="w-3 h-3">{tile.statusIcon}</span>
                  ) : (
                    <Minus className="w-3 h-3" />
                  )}
                  <span className="text-xs font-medium">
                    {tile.change}
                  </span>
                </div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-body">
                {tile.detail}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default DashboardSummaryTiles;