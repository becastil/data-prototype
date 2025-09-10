'use client';

import React, { Suspense, memo } from 'react';
import { motion } from 'framer-motion';
import { Card as CardType } from '../../types';
import { cn } from '@/app/lib/utils';
import { Skeleton } from '@/app/components/ui/skeleton';
import { useHealthcareData } from './HealthcareDataProvider';

// Lazy imports for performance
const TableCard = React.lazy(() => import('./TableCard'));
const ChartCard = React.lazy(() => import('./ChartCard'));
const InsightCard = React.lazy(() => import('./InsightCard'));

export interface AnalyticsConfig {
  type: 'table' | 'chart' | 'insight';
  component: string;
  data?: any;
  config?: {
    compact?: boolean;
    interactive?: boolean;
    exportable?: boolean;
    refreshable?: boolean;
    [key: string]: any;
  };
}

export interface CardAnalyticsWrapperProps {
  card: CardType;
  analytics: AnalyticsConfig;
  isPreview?: boolean;
  isDragging?: boolean;
  onExpand?: () => void;
  onRefresh?: () => void;
  onExport?: (format: 'csv' | 'pdf') => void;
  className?: string;
}

// Loading skeleton for analytics components
const AnalyticsSkeleton = memo(({ type, compact = false }: { 
  type: 'table' | 'chart' | 'insight'; 
  compact?: boolean; 
}) => {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700 rounded";
  
  switch (type) {
    case 'table':
      return (
        <div className="space-y-2">
          {/* Table header */}
          <div className={cn(baseClasses, "h-8 w-full")} />
          {/* Table rows */}
          {Array.from({ length: compact ? 3 : 6 }).map((_, i) => (
            <div key={i} className={cn(baseClasses, "h-6 w-full")} />
          ))}
        </div>
      );
    
    case 'chart':
      return (
        <div className={cn(
          baseClasses, 
          compact ? "h-32 w-full" : "h-64 w-full"
        )} />
      );
    
    case 'insight':
      return (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: compact ? 2 : 4 }).map((_, i) => (
            <div key={i} className={cn(baseClasses, "h-16 w-full")} />
          ))}
        </div>
      );
    
    default:
      return <div className={cn(baseClasses, "h-32 w-full")} />;
  }
});
AnalyticsSkeleton.displayName = 'AnalyticsSkeleton';

// Performance optimized wrapper with suspense boundaries
const CardAnalyticsWrapper: React.FC<CardAnalyticsWrapperProps> = memo(({
  card,
  analytics,
  isPreview = true,
  isDragging = false,
  onExpand,
  onRefresh,
  onExport,
  className,
}) => {
  // Get healthcare data for this card
  const { getTableData, getChartData, getInsightData, refreshData, exportData } = useHealthcareData();
  // During drag operations, show skeleton for performance
  if (isDragging) {
    return (
      <div className={cn("opacity-50", className)}>
        <AnalyticsSkeleton type={analytics.type} compact={isPreview} />
      </div>
    );
  }

  // Get real-time data for this card
  const cardData = analytics.type === 'table' 
    ? getTableData(card.id, analytics.component)
    : analytics.type === 'chart'
      ? getChartData(card.id, analytics.component)
      : analytics.type === 'insight'
        ? getInsightData(card.id, analytics.component)
        : analytics.data;

  // Analytics configuration with preview mode settings and real data
  const analyticsConfig = {
    ...analytics.config,
    compact: isPreview,
    interactive: !isPreview,
    cardId: card.id,
    onExpand: isPreview ? onExpand : undefined,
    onRefresh: onRefresh || refreshData,
    onExport: onExport || exportData,
  };

  // Render appropriate analytics component based on type
  const renderAnalyticsComponent = () => {
    switch (analytics.type) {
      case 'table':
        return (
          <TableCard
            card={card}
            data={cardData}
            config={analyticsConfig}
            component={analytics.component}
          />
        );
      
      case 'chart':
        return (
          <ChartCard
            card={card}
            data={cardData}
            config={analyticsConfig}
            component={analytics.component}
          />
        );
      
      case 'insight':
        return (
          <InsightCard
            card={card}
            data={cardData}
            config={analyticsConfig}
            component={analytics.component}
          />
        );
      
      default:
        return (
          <div className="p-4 text-center text-gray-500">
            <p>Unsupported analytics type: {analytics.type}</p>
          </div>
        );
    }
  };

  return (
    <motion.div
      className={cn("w-full", className)}
      initial={false}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        scale: isDragging ? 0.98 : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      <Suspense
        fallback={
          <AnalyticsSkeleton type={analytics.type} compact={isPreview} />
        }
      >
        {renderAnalyticsComponent()}
      </Suspense>
    </motion.div>
  );
});

CardAnalyticsWrapper.displayName = 'CardAnalyticsWrapper';

export default CardAnalyticsWrapper;