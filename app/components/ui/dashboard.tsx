'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/app/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Dashboard Context
interface DashboardContextValue {
  budgetData?: any[];
  claimsData?: any[];
  metrics?: Record<string, any>;
}

const DashboardContext = React.createContext<DashboardContextValue>({});

const useDashboard = () => {
  const context = React.useContext(DashboardContext);
  if (!context) {
    throw new Error('Dashboard compound components must be used within Dashboard.Root');
  }
  return context;
};

// Helper function to parse values
const parseValue = (value: any): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  return parseFloat(String(value).replace(/[$,]/g, '')) || 0;
};

// Helper function to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper function to format percentage
const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Dashboard Root Component
interface DashboardRootProps extends React.HTMLAttributes<HTMLDivElement> {
  budgetData?: any[];
  claimsData?: any[];
}

const DashboardRoot = React.forwardRef<HTMLDivElement, DashboardRootProps>(
  ({ budgetData = [], claimsData = [], children, className, ...props }, ref) => {
    // Calculate metrics
    const metrics = React.useMemo(() => {
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

      // Get recent data for calculations
      const recentData = budgetData.slice(-12);
      const currentMonth = recentData[recentData.length - 1] || {};
      const previousMonth = recentData[recentData.length - 2] || {};

      // Calculate totals
      let totalBudget = 0;
      let totalMedical = 0;
      let totalPharmacy = 0;
      let totalFixed = 0;
      let totalClaims = 0;

      recentData.forEach(row => {
        totalBudget += parseValue(row['Budget'] || row['budget'] || 0);
        const medical = parseValue(row['Medical Claims'] || row['medical_claims'] || 0);
        const pharmacy = parseValue(row['Rx'] || row['Pharmacy'] || row['rx_claims'] || 0);
        totalMedical += medical;
        totalPharmacy += pharmacy;
        totalClaims += medical + pharmacy;
      });

      const currentEnrollment = parseValue(currentMonth['total_enrollment'] || 0);
      const previousEnrollment = parseValue(previousMonth['total_enrollment'] || 0);
      const enrollmentChange = previousEnrollment ? 
        ((currentEnrollment - previousEnrollment) / previousEnrollment) * 100 : 0;

      const variance = totalClaims - totalBudget;
      const variancePercent = totalBudget ? (variance / totalBudget) * 100 : 0;
      const lossRatio = totalBudget ? (totalClaims / totalBudget) * 100 : 0;

      return {
        totalBudget,
        totalActual: totalClaims,
        variance,
        variancePercent,
        enrollment: currentEnrollment,
        enrollmentChange,
        lossRatio,
        totalClaims,
        claimsVsBudget: lossRatio,
      };
    }, [budgetData, claimsData]);

    const contextValue = React.useMemo(() => ({
      budgetData,
      claimsData,
      metrics,
    }), [budgetData, claimsData, metrics]);

    return (
      <DashboardContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", className)}
          {...props}
        >
          {children}
        </div>
      </DashboardContext.Provider>
    );
  }
);
DashboardRoot.displayName = 'Dashboard';

// Metric Tile Variants
const metricVariants = cva('', {
  variants: {
    trend: {
      positive: 'text-green-600',
      negative: 'text-red-600',
      neutral: 'text-gray-600',
    },
  },
  defaultVariants: {
    trend: 'neutral',
  },
});

interface DashboardMetricProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  formatter?: 'currency' | 'percent' | 'number';
}

const DashboardMetric = React.forwardRef<HTMLDivElement, DashboardMetricProps>(
  ({ title, value, subtitle, trend = 'neutral', icon, formatter = 'number', className, ...props }, ref) => {
    const { metrics } = useDashboard();
    
    const formatValue = (val: string | number) => {
      const numVal = typeof val === 'string' ? parseFloat(val) : val;
      
      switch (formatter) {
        case 'currency':
          return formatCurrency(numVal);
        case 'percent':
          return formatPercent(numVal);
        default:
          return typeof val === 'number' ? val.toLocaleString() : val;
      }
    };

    const getTrendIcon = () => {
      switch (trend) {
        case 'positive':
          return <TrendingUp className="h-4 w-4" />;
        case 'negative':
          return <TrendingDown className="h-4 w-4" />;
        default:
          return <Minus className="h-4 w-4" />;
      }
    };

    return (
      <Card ref={ref} variant="elevated" className={cn("stagger-item", className)} {...props}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          {icon || getTrendIcon()}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-heading text-black">
            {formatValue(value)}
          </div>
          {subtitle && (
            <p className={cn(
              "text-xs flex items-center gap-1 mt-1 font-body",
              metricVariants({ trend })
            )}>
              {getTrendIcon()}
              {subtitle}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }
);
DashboardMetric.displayName = 'DashboardMetric';

// Pre-built metric components using the context
const DashboardBudgetMetric = () => {
  const { metrics } = useDashboard();
  return (
    <DashboardMetric
      title="Total Budget"
      value={metrics?.totalBudget || 0}
      formatter="currency"
      trend="neutral"
    />
  );
};

const DashboardClaimsMetric = () => {
  const { metrics } = useDashboard();
  return (
    <DashboardMetric
      title="Total Claims"
      value={metrics?.totalClaims || 0}
      formatter="currency"
      trend={metrics?.variancePercent > 0 ? 'negative' : 'positive'}
      subtitle={`${Math.abs(metrics?.variancePercent || 0).toFixed(1)}% vs budget`}
    />
  );
};

const DashboardEnrollmentMetric = () => {
  const { metrics } = useDashboard();
  return (
    <DashboardMetric
      title="Enrollment"
      value={metrics?.enrollment || 0}
      formatter="number"
      trend={
        metrics?.enrollmentChange > 0 
          ? 'positive' 
          : metrics?.enrollmentChange < 0 
          ? 'negative' 
          : 'neutral'
      }
      subtitle={`${Math.abs(metrics?.enrollmentChange || 0).toFixed(1)}% vs last month`}
    />
  );
};

const DashboardLossRatioMetric = () => {
  const { metrics } = useDashboard();
  return (
    <DashboardMetric
      title="Loss Ratio"
      value={metrics?.lossRatio || 0}
      formatter="percent"
      trend={metrics?.lossRatio > 100 ? 'negative' : 'positive'}
    />
  );
};

export {
  DashboardRoot,
  DashboardMetric,
  DashboardBudgetMetric,
  DashboardClaimsMetric,
  DashboardEnrollmentMetric,
  DashboardLossRatioMetric,
  useDashboard,
};

// Compound component pattern
export const Dashboard = {
  Root: DashboardRoot,
  Metric: DashboardMetric,
  Budget: DashboardBudgetMetric,
  Claims: DashboardClaimsMetric,
  Enrollment: DashboardEnrollmentMetric,
  LossRatio: DashboardLossRatioMetric,
};