'use client';

import React, { memo, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card as CardType } from '../../types';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import { 
  Expand, 
  Download, 
  RefreshCw, 
  BarChart3,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

// Import existing chart components
import EChartsEnterpriseChart from '@/app/components/charts/EChartsEnterpriseChart';
import PremiumEnrollmentChart from '@/app/components/charts/PremiumEnrollmentChart';
import MorphingChart from '@/app/components/charts/MorphingChart';

export interface ChartCardProps {
  card: CardType;
  data?: any;
  config: {
    compact?: boolean;
    interactive?: boolean;
    cardId: string;
    onExpand?: () => void;
    onRefresh?: () => void;
    onExport?: (format: 'csv' | 'pdf') => void;
    exportable?: boolean;
    refreshable?: boolean;
    chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'area';
    theme?: 'light' | 'dark' | 'auto';
    showLegend?: boolean;
    showGrid?: boolean;
    showTooltip?: boolean;
  };
  component: string;
}

// Chart component mapping
const chartComponents = {
  'EChartsEnterpriseChart': EChartsEnterpriseChart,
  'PremiumEnrollmentChart': PremiumEnrollmentChart,
  'MorphingChart': MorphingChart,
} as const;

const ChartCard: React.FC<ChartCardProps> = memo(({
  card,
  data,
  config,
  component,
}) => {
  const [isLegendVisible, setIsLegendVisible] = useState(config.showLegend ?? true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  // Get the appropriate chart component
  const ChartComponent = chartComponents[component as keyof typeof chartComponents];
  
  if (!ChartComponent) {
    return (
      <div className="p-4 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded">
        <BarChart3 className="w-6 h-6 mx-auto mb-2" />
        <p>Unknown chart component: {component}</p>
      </div>
    );
  }

  // Handle refresh action
  const handleRefresh = async () => {
    if (!config.onRefresh) return;
    
    setIsRefreshing(true);
    setChartError(null);
    try {
      await config.onRefresh();
    } catch (error) {
      setChartError(error instanceof Error ? error.message : 'Failed to refresh chart');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Chart configuration for compact/expanded modes
  const chartConfig = useMemo(() => ({
    width: '100%',
    height: config.compact ? 200 : 400,
    interactive: config.interactive ?? true,
    theme: config.theme ?? 'auto',
    showLegend: isLegendVisible,
    showGrid: config.showGrid ?? true,
    showTooltip: config.showTooltip ?? true,
    animation: !config.compact, // Disable animations in compact mode for performance
    responsive: true,
    compact: config.compact,
    // Pass through any additional config
    ...config,
  }), [config, isLegendVisible]);

  // Data processing for chart
  const processedData = useMemo(() => {
    if (!data) return null;
    
    // Add any data transformations needed for compact mode
    if (config.compact && Array.isArray(data) && data.length > 50) {
      // Limit data points in preview mode for performance
      return data.slice(0, 50);
    }
    
    return data;
  }, [data, config.compact]);

  return (
    <div className="w-full">
      {/* Card Header with Actions */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {card.title}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded capitalize">
            {config.chartType || 'chart'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Legend toggle */}
          {config.showLegend !== false && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLegendVisible(!isLegendVisible)}
              className="h-6 w-6 p-0"
              title={isLegendVisible ? 'Hide legend' : 'Show legend'}
            >
              {isLegendVisible ? (
                <EyeOff className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
            </Button>
          )}

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

      {/* Chart Content */}
      <div className={cn(
        "relative",
        config.compact ? "h-52" : "h-96"
      )}>
        {chartError ? (
          <div className="h-full flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-900/20">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Chart Error</p>
              <p className="text-xs mt-1">{chartError}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="mt-2"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        ) : !processedData ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chart data available</p>
            </div>
          </div>
        ) : (
          <motion.div
            className="h-full p-2"
            initial={false}
            animate={{ opacity: isRefreshing ? 0.5 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <ChartComponent
              data={processedData}
              {...chartConfig}
              onError={(error: Error) => setChartError(error.message)}
            />
          </motion.div>
        )}

        {/* Loading overlay */}
        {isRefreshing && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Updating chart...</p>
            </div>
          </div>
        )}

        {/* Compact mode indicator */}
        {config.compact && processedData && Array.isArray(data) && data.length > 50 && (
          <div className="absolute top-2 right-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded">
            Preview: {processedData.length} of {data.length} points
          </div>
        )}
      </div>

      {/* Footer with chart metadata */}
      {config.compact && processedData && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
          <div className="flex justify-between items-center">
            <span>
              {Array.isArray(processedData) 
                ? `${processedData.length} data points`
                : 'Interactive chart'
              }
            </span>
            <span className="capitalize">
              {config.chartType || 'chart'} visualization
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

ChartCard.displayName = 'ChartCard';

export default ChartCard;
