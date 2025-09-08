"use client";

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from './glass-card';
import { AnimatedNumber } from './animated-number';
import { LottieLoader } from './lottie-loader';
import { useGSAP, animations, gsap } from '@/app/lib/gsapConfig';
import { cn } from '@/app/lib/utils';
import { LucideIcon } from 'lucide-react';

interface PremiumDashboardCardProps {
  title: string;
  value?: number;
  previousValue?: number;
  prefix?: string;
  suffix?: string;
  format?: 'currency' | 'percentage' | 'number' | 'compact';
  decimals?: number;
  icon?: LucideIcon;
  loading?: boolean;
  error?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  subtitle?: string;
  variant?: 'default' | 'premium' | 'success' | 'warning' | 'danger';
  gradient?: string;
  className?: string;
  children?: React.ReactNode;
  onCardClick?: () => void;
}

const variants = {
  default: {
    gradient: 'from-blue-500/10 to-purple-500/10',
    iconColor: 'text-blue-500',
    valueColor: 'text-blue-600 dark:text-blue-400'
  },
  premium: {
    gradient: 'from-indigo-500/10 to-purple-500/10',
    iconColor: 'text-indigo-500',
    valueColor: 'text-indigo-600 dark:text-indigo-400'
  },
  success: {
    gradient: 'from-green-500/10 to-emerald-500/10',
    iconColor: 'text-green-500',
    valueColor: 'text-green-600 dark:text-green-400'
  },
  warning: {
    gradient: 'from-yellow-500/10 to-orange-500/10',
    iconColor: 'text-yellow-500',
    valueColor: 'text-yellow-600 dark:text-yellow-400'
  },
  danger: {
    gradient: 'from-red-500/10 to-pink-500/10',
    iconColor: 'text-red-500',
    valueColor: 'text-red-600 dark:text-red-400'
  }
};

const trendIcons = {
  up: '↗',
  down: '↘',
  neutral: '→'
};

const trendColors = {
  up: 'text-green-500',
  down: 'text-red-500',
  neutral: 'text-gray-500'
};

const PremiumDashboardCard: React.FC<PremiumDashboardCardProps> = ({
  title,
  value = 0,
  previousValue,
  prefix = '',
  suffix = '',
  format = 'number',
  decimals = 0,
  icon: Icon,
  loading = false,
  error,
  trend,
  trendValue,
  subtitle,
  variant = 'default',
  gradient,
  className,
  children,
  onCardClick
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const variantConfig = variants[variant];

  // GSAP entrance animation
  useGSAP(() => {
    if (!cardRef.current) return () => {};

    const tl = gsap.timeline();
    
    // Staggered entrance animation
    tl.fromTo(cardRef.current, 
      animations.fadeInUp.from,
      {
        ...animations.fadeInUp.to,
        delay: 0.2
      }
    );

    return () => {
      tl.kill();
    };
  }, []);

  // Calculate trend percentage if we have both values
  const trendPercentage = previousValue && previousValue !== 0 
    ? ((value - previousValue) / previousValue) * 100
    : trendValue || 0;

  const determineTrend = (): 'up' | 'down' | 'neutral' => {
    if (trend) return trend;
    if (trendPercentage > 0) return 'up';
    if (trendPercentage < 0) return 'down';
    return 'neutral';
  };

  const actualTrend = determineTrend();

  if (loading) {
    return (
      <GlassCard 
        ref={cardRef}
        variant="elevated" 
        className={cn("p-6 min-h-[180px] flex flex-col justify-center", className)}
      >
        <div className="text-center">
          <LottieLoader type="pulse" size="md" />
          <div className="mt-4 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard 
        ref={cardRef}
        variant="subtle" 
        className={cn("p-6 min-h-[180px] flex flex-col justify-center", className)}
      >
        <div className="text-center">
          <LottieLoader type="error" size="md" />
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      ref={cardRef}
      variant="elevated"
      interactive={!!onCardClick}
      onClick={onCardClick}
      className={cn(
        "p-6 min-h-[180px] cursor-default transition-all duration-300",
        onCardClick && "cursor-pointer hover:scale-[1.02]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
        
        {Icon && (
          <motion.div
            className={cn(
              "p-3 rounded-lg bg-gradient-to-br",
              gradient || variantConfig.gradient
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon className={cn("w-6 h-6", variantConfig.iconColor)} />
          </motion.div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center">
        {children || (
          <div className="space-y-2">
            {/* Primary Value */}
            <div className="flex items-baseline space-x-2">
              <AnimatedNumber
                value={value}
                from={previousValue || 0}
                prefix={prefix}
                suffix={suffix}
                format={format}
                decimals={decimals}
                className={cn(
                  "text-3xl font-bold tabular-nums",
                  variantConfig.valueColor
                )}
              />
            </div>

            {/* Trend Indicator */}
            {(trend || trendValue !== undefined || previousValue !== undefined) && (
              <motion.div 
                className="flex items-center space-x-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <span className={cn("text-sm font-medium", trendColors[actualTrend])}>
                  {trendIcons[actualTrend]}
                </span>
                <span className={cn("text-sm", trendColors[actualTrend])}>
                  {Math.abs(trendPercentage).toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500">vs last period</span>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Premium Accent Line */}
      <motion.div
        className={cn(
          "h-1 rounded-full bg-gradient-to-r mt-4",
          gradient || variantConfig.gradient.replace('/10', '/30')
        )}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
        style={{ transformOrigin: 'left' }}
      />
    </GlassCard>
  );
};

export { PremiumDashboardCard };