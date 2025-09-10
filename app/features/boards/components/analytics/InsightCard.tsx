'use client';

import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card as CardType } from '../../types';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import { AnimatedNumber } from '@/app/components/ui/animated-number';
import { 
  Expand, 
  Download, 
  RefreshCw, 
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign,
  Users,
  Activity,
  BarChart3
} from 'lucide-react';

export interface InsightMetric {
  id: string;
  label: string;
  value: number | string;
  previousValue?: number | string;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  format?: 'number' | 'currency' | 'percentage' | 'duration' | 'text';
  target?: number;
  status?: 'good' | 'warning' | 'danger' | 'info';
  icon?: 'dollar' | 'users' | 'activity' | 'chart' | 'alert' | 'check' | 'info';
  description?: string;
}

export interface InsightCardProps {
  card: CardType;
  data?: {
    metrics: InsightMetric[];
    title?: string;
    description?: string;
    period?: string;
    lastUpdated?: Date;
  };
  config: {
    compact?: boolean;
    interactive?: boolean;
    cardId: string;
    onExpand?: () => void;
    onRefresh?: () => void;
    onExport?: (format: 'csv' | 'pdf') => void;
    exportable?: boolean;
    refreshable?: boolean;
    layout?: 'grid' | 'list' | 'tiles';
    showTrends?: boolean;
    showTargets?: boolean;
    animateNumbers?: boolean;
  };
  component: string;
}

// Icon mapping for metrics
const iconMap = {
  dollar: DollarSign,
  users: Users,
  activity: Activity,
  chart: BarChart3,
  alert: AlertTriangle,
  check: CheckCircle,
  info: Info,
};

// Format value based on type
const formatValue = (value: number | string, format?: string, compact = false): string => {
  if (typeof value === 'string') return value;
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: compact ? 'compact' : 'standard',
        maximumFractionDigits: compact ? 1 : 2,
      }).format(value);
    
    case 'percentage':
      return `${value.toFixed(1)}%`;
    
    case 'duration':
      const days = Math.floor(value);
      const hours = Math.floor((value % 1) * 24);
      return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
    
    case 'number':
    default:
      return new Intl.NumberFormat('en-US', {
        notation: compact ? 'compact' : 'standard',
        maximumFractionDigits: 1,
      }).format(value);
  }
};

// Get trend color classes
const getTrendColor = (trend?: 'up' | 'down' | 'stable', status?: string) => {
  if (status) {
    switch (status) {
      case 'good':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'danger':
        return 'text-red-600 dark:text-red-400';
      case 'info':
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  }
  
  switch (trend) {
    case 'up':
      return 'text-green-600 dark:text-green-400';
    case 'down':
      return 'text-red-600 dark:text-red-400';
    case 'stable':
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

// Individual metric component
const MetricTile = memo(({ 
  metric, 
  compact, 
  showTrends, 
  showTargets,
  animateNumbers 
}: { 
  metric: InsightMetric;
  compact: boolean;
  showTrends: boolean;
  showTargets: boolean;
  animateNumbers: boolean;
}) => {
  const Icon = metric.icon ? iconMap[metric.icon] : BarChart3;
  const TrendIcon = metric.trend === 'up' ? TrendingUp : 
                   metric.trend === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
        "hover:shadow-md transition-shadow duration-200",
        compact ? "p-3" : "p-4"
      )}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={cn(
            compact ? "w-3 h-3" : "w-4 h-4",
            getTrendColor(metric.trend, metric.status)
          )} />
          <span className={cn(
            "font-medium text-gray-900 dark:text-gray-100",
            compact ? "text-xs" : "text-sm"
          )}>
            {metric.label}
          </span>
        </div>
        
        {showTrends && metric.trend && (
          <TrendIcon className={cn(
            "w-3 h-3",
            getTrendColor(metric.trend, metric.status)
          )} />
        )}
      </div>

      {/* Main Value */}
      <div className="mb-2">
        {animateNumbers && typeof metric.value === 'number' ? (
          <AnimatedNumber
            value={metric.value}
            className={cn(
              "font-bold text-gray-900 dark:text-white",
              compact ? "text-lg" : "text-2xl"
            )}
            format={(val) => formatValue(val, metric.format, compact)}
          />
        ) : (
          <div className={cn(
            "font-bold text-gray-900 dark:text-white",
            compact ? "text-lg" : "text-2xl"
          )}>
            {formatValue(metric.value, metric.format, compact)}
          </div>
        )}
      </div>

      {/* Trend Information */}
      {showTrends && (metric.trendPercentage !== undefined || metric.previousValue !== undefined) && (
        <div className="flex items-center gap-1 mb-2">
          <span className={cn(
            "text-xs font-medium",
            getTrendColor(metric.trend, metric.status)
          )}>
            {metric.trendPercentage !== undefined && (
              <>
                {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}
                {Math.abs(metric.trendPercentage).toFixed(1)}%
              </>
            )}
          </span>
          {metric.previousValue !== undefined && (
            <span className="text-xs text-gray-500">
              from {formatValue(metric.previousValue, metric.format, true)}
            </span>
          )}
        </div>
      )}

      {/* Target Progress */}
      {showTargets && metric.target !== undefined && typeof metric.value === 'number' && (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.round((metric.value / metric.target) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
            <div
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                metric.value >= metric.target 
                  ? "bg-green-500" 
                  : metric.value >= metric.target * 0.8 
                    ? "bg-yellow-500" 
                    : "bg-blue-500"
              )}
              style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Description */}
      {!compact && metric.description && (
        <p className="text-xs text-gray-500 mt-2">
          {metric.description}
        </p>
      )}
    </motion.div>
  );
});
MetricTile.displayName = 'MetricTile';

const InsightCard: React.FC<InsightCardProps> = memo(({
  card,
  data,
  config,
  component,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!data?.metrics?.length) {
    return (
      <div className="p-4 text-center text-gray-500">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No insights data available</p>
      </div>
    );
  }

  // Handle refresh action
  const handleRefresh = async () => {
    if (!config.onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await config.onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Determine layout
  const layout = config.layout || 'grid';
  const metrics = config.compact ? data.metrics.slice(0, 4) : data.metrics;

  return (
    <div className="w-full">
      {/* Card Header with Actions */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {data.title || card.title}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {data.metrics.length} insights
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Refresh button */}
          {config.refreshable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={cn(
                "w-3 h-3",
                isRefreshing && "animate-spin"
              )} />
            </Button>
          )}

          {/* Export button */}
          {config.exportable && config.onExport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => config.onExport?.('pdf')}
              className="h-6 w-6 p-0"
            >
              <Download className="w-3 h-3" />
            </Button>
          )}

          {/* Expand button for compact mode */}
          {config.compact && config.onExpand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={config.onExpand}
              className="h-6 w-6 p-0"
            >
              <Expand className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Insights Content */}
      <motion.div
        className="p-3"
        initial={false}
        animate={{ opacity: isRefreshing ? 0.5 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Description */}
        {data.description && !config.compact && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {data.description}
          </p>
        )}

        {/* Metrics Grid */}
        <div className={cn(
          layout === 'grid' 
            ? config.compact 
              ? "grid grid-cols-2 gap-2"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            : "space-y-2"
        )}>
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <MetricTile
                metric={metric}
                compact={config.compact || false}
                showTrends={config.showTrends ?? true}
                showTargets={config.showTargets ?? true}
                animateNumbers={config.animateNumbers ?? true}
              />
            </motion.div>
          ))}
        </div>

        {/* Truncation indicator */}
        {config.compact && data.metrics.length > 4 && (
          <div className="mt-3 text-center">
            <span className="text-xs text-gray-500">
              Showing 4 of {data.metrics.length} insights
            </span>
          </div>
        )}
      </motion.div>

      {/* Footer with metadata */}
      {(data.period || data.lastUpdated) && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
          <div className="flex justify-between items-center">
            {data.period && <span>Period: {data.period}</span>}
            {data.lastUpdated && (
              <span>Updated: {data.lastUpdated.toLocaleString()}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

InsightCard.displayName = 'InsightCard';

export default InsightCard;