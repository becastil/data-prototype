'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { 
  ModernCard, 
  ModernContainer, 
  ModernHeader, 
  ModernText, 
  ModernGrid, 
  ModernBadge,
  ModernMetric 
} from './modern-layout';
import { cn } from '@/app/lib/utils';

/**
 * Modern Dashboard Components - Clean, Minimalist Healthcare Analytics
 */

interface DashboardMetricsProps {
  metrics: {
    totalBudget: number;
    totalCost: number;
    surplus: number;
    utilizationRate: number;
    memberCount: number;
    avgCostPerMember: number;
  };
  className?: string;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ metrics, className }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getSurplusType = (surplus: number) => {
    if (surplus > 0) return 'positive';
    if (surplus < 0) return 'negative';
    return 'neutral';
  };

  const getSurplusIcon = (surplus: number) => {
    if (surplus > 0) return <ArrowUpRight className="w-4 h-4" />;
    if (surplus < 0) return <ArrowDownRight className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const metricsData = [
    {
      label: 'Total Budget',
      value: formatCurrency(metrics.totalBudget),
      icon: <DollarSign className="w-6 h-6" />,
      change: null,
      changeType: 'neutral' as const
    },
    {
      label: 'Total Cost',
      value: formatCurrency(metrics.totalCost),
      icon: <BarChart3 className="w-6 h-6" />,
      change: null,
      changeType: 'neutral' as const
    },
    {
      label: 'Surplus/Deficit',
      value: formatCurrency(Math.abs(metrics.surplus)),
      icon: getSurplusIcon(metrics.surplus),
      change: metrics.surplus >= 0 ? 'Surplus' : 'Deficit',
      changeType: getSurplusType(metrics.surplus)
    },
    {
      label: 'Budget Utilization',
      value: formatPercentage(metrics.utilizationRate),
      icon: <Activity className="w-6 h-6" />,
      change: metrics.utilizationRate > 100 ? 'Over Budget' : 'Under Budget',
      changeType: metrics.utilizationRate > 100 ? 'negative' : 'positive'
    },
    {
      label: 'Total Members',
      value: metrics.memberCount.toLocaleString(),
      icon: <Users className="w-6 h-6" />,
      change: null,
      changeType: 'neutral' as const
    },
    {
      label: 'Cost Per Member',
      value: formatCurrency(metrics.avgCostPerMember),
      icon: <TrendingUp className="w-6 h-6" />,
      change: null,
      changeType: 'neutral' as const
    },
  ];

  return (
    <ModernContainer className={className}>
      <div className="mb-8">
        <ModernHeader size="lg" className="mb-2">
          Key Performance Indicators
        </ModernHeader>
        <ModernText color="muted">
          Real-time insights into your healthcare plan performance
        </ModernText>
      </div>
      
      <ModernGrid cols={3} gap="lg" responsive>
        {metricsData.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <ModernMetric
              label={metric.label}
              value={metric.value}
              change={metric.change}
              changeType={metric.changeType}
              icon={metric.icon}
            />
          </motion.div>
        ))}
      </ModernGrid>
    </ModernContainer>
  );
};

interface DashboardTableProps {
  data: any[];
  className?: string;
}

export const DashboardTable: React.FC<DashboardTableProps> = ({ data, className }) => {
  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  if (!data || data.length === 0) {
    return (
      <ModernCard className={className}>
        <div className="text-center py-12">
          <ModernText color="muted">
            No data available to display
          </ModernText>
        </div>
      </ModernCard>
    );
  }

  // Get first row to determine columns
  const sampleRow = data[0];
  const columns = Object.keys(sampleRow).filter(key => {
    const value = sampleRow[key];
    return value !== null && value !== undefined && value !== '';
  });

  // Prioritize important columns
  const importantColumns = ['month', 'Month', 'Medical Claims', 'Pharmacy Claims', 'Budget', 'Net Cost', 'Variance'];
  const sortedColumns = columns.sort((a, b) => {
    const aIndex = importantColumns.indexOf(a);
    const bIndex = importantColumns.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  // Take first 8 columns to avoid overcrowding
  const displayColumns = sortedColumns.slice(0, 8);

  return (
    <ModernCard padding="none" className={cn('overflow-hidden', className)}>
      <div className="p-6 border-b border-slate-100">
        <ModernHeader size="md" className="mb-1">
          Financial Data Overview
        </ModernHeader>
        <ModernText size="sm" color="muted">
          Monthly breakdown of plan performance and costs
        </ModernText>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50/80">
            <tr>
              {displayColumns.map((column) => (
                <th
                  key={column}
                  className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-100"
                >
                  {column.replace(/([A-Z])/g, ' $1').trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.slice(0, 12).map((row, index) => ( // Limit to 12 rows
              <motion.tr
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="hover:bg-slate-50/50 transition-colors duration-200"
              >
                {displayColumns.map((column) => {
                  const value = row[column];
                  const isNumeric = typeof value === 'number' || 
                    (typeof value === 'string' && /^[\d,.$-]+$/.test(value.replace(/\s/g, '')));
                  
                  return (
                    <td key={column} className="px-6 py-4 whitespace-nowrap text-sm">
                      {isNumeric && column.toLowerCase().includes('claim') || 
                       column.toLowerCase().includes('budget') || 
                       column.toLowerCase().includes('cost') || 
                       column.toLowerCase().includes('variance') ? (
                        <span className="font-medium text-slate-900">
                          {formatCurrency(value)}
                        </span>
                      ) : (
                        <span className="text-slate-700">
                          {value || '-'}
                        </span>
                      )}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {data.length > 12 && (
        <div className="p-4 bg-slate-50/30 border-t border-slate-100">
          <ModernText size="sm" color="muted" className="text-center">
            Showing 12 of {data.length} records
          </ModernText>
        </div>
      )}
    </ModernCard>
  );
};

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  title, 
  subtitle, 
  actions, 
  className 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('flex items-center justify-between mb-8', className)}
    >
      <div>
        <ModernHeader size="xl" className="mb-1">
          {title}
        </ModernHeader>
        {subtitle && (
          <ModernText color="muted" size="lg">
            {subtitle}
          </ModernText>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </motion.div>
  );
};

interface DashboardStatusProps {
  status: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  className?: string;
}

export const DashboardStatus: React.FC<DashboardStatusProps> = ({ 
  status, 
  title, 
  message, 
  className 
}) => {
  const statusConfig = {
    success: {
      icon: <TrendingUp className="w-5 h-5" />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600'
    },
    warning: {
      icon: <Activity className="w-5 h-5" />,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-800',
      iconColor: 'text-amber-600'
    },
    error: {
      icon: <TrendingDown className="w-5 h-5" />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600'
    },
    info: {
      icon: <BarChart3 className="w-5 h-5" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600'
    }
  };

  const config = statusConfig[status];

  return (
    <ModernCard 
      className={cn(
        'border-l-4', 
        config.bgColor, 
        config.borderColor,
        className
      )}
      padding="md"
    >
      <div className="flex items-start gap-3">
        <div className={config.iconColor}>
          {config.icon}
        </div>
        <div>
          <h3 className={cn('font-semibold text-sm mb-1', config.textColor)}>
            {title}
          </h3>
          <p className={cn('text-sm', config.textColor)}>
            {message}
          </p>
        </div>
      </div>
    </ModernCard>
  );
};

export default {
  DashboardMetrics,
  DashboardTable,
  DashboardHeader,
  DashboardStatus
};