'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';

/**
 * Modern Layout Components - Minimalist & Clean Design System
 */

interface ModernContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const ModernContainer: React.FC<ModernContainerProps> = ({ 
  children, 
  className,
  size = 'lg' 
}) => {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl', 
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-none'
  };

  return (
    <div className={cn(
      'mx-auto px-4 sm:px-6 lg:px-8',
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  );
};

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  onClick?: () => void;
}

export const ModernCard: React.FC<ModernCardProps> = ({ 
  children, 
  className,
  variant = 'default',
  padding = 'lg',
  hover = false,
  onClick
}) => {
  const variantClasses = {
    default: 'bg-white border border-slate-200/60 shadow-sm',
    elevated: 'bg-white border border-slate-200/60 shadow-lg',
    outlined: 'bg-transparent border-2 border-slate-200',
    ghost: 'bg-slate-50/50 border-0'
  };
  
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6', 
    lg: 'p-8',
    xl: 'p-10'
  };
  
  const hoverClasses = hover ? 'hover:shadow-xl hover:border-slate-300/80 hover:-translate-y-1' : '';
  
  return (
    <motion.div
      className={cn(
        'rounded-2xl transition-all duration-300 ease-out',
        variantClasses[variant],
        paddingClasses[padding],
        hoverClasses,
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      initial={hover ? { y: 0 } : false}
      whileHover={hover ? { y: -2 } : undefined}
    >
      {children}
    </motion.div>
  );
};

interface ModernHeaderProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'muted' | 'accent';
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({ 
  children, 
  className,
  size = 'lg',
  weight = 'semibold',
  color = 'default'
}) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };
  
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium', 
    semibold: 'font-semibold',
    bold: 'font-bold'
  };
  
  const colorClasses = {
    default: 'text-slate-900',
    muted: 'text-slate-600',
    accent: 'text-blue-600'
  };
  
  return (
    <h1 className={cn(
      'tracking-tight leading-tight',
      sizeClasses[size],
      weightClasses[weight],
      colorClasses[color],
      className
    )}>
      {children}
    </h1>
  );
};

interface ModernTextProps {
  children: React.ReactNode;
  className?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg';
  color?: 'default' | 'muted' | 'subtle';
  weight?: 'normal' | 'medium' | 'semibold';
}

export const ModernText: React.FC<ModernTextProps> = ({ 
  children, 
  className,
  size = 'base',
  color = 'default',
  weight = 'normal'
}) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg'
  };
  
  const colorClasses = {
    default: 'text-slate-900',
    muted: 'text-slate-600',
    subtle: 'text-slate-500'
  };
  
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold'
  };
  
  return (
    <p className={cn(
      'leading-relaxed',
      sizeClasses[size],
      colorClasses[color],
      weightClasses[weight],
      className
    )}>
      {children}
    </p>
  );
};

interface ModernGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
}

export const ModernGrid: React.FC<ModernGridProps> = ({ 
  children, 
  className,
  cols = 3,
  gap = 'lg',
  responsive = true
}) => {
  const colsClasses = {
    1: 'grid-cols-1',
    2: responsive ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2',
    3: responsive ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-3',
    4: responsive ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-4',
    6: responsive ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-6'
  };
  
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  };
  
  return (
    <div className={cn(
      'grid',
      colsClasses[cols],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
};

interface ModernBadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export const ModernBadge: React.FC<ModernBadgeProps> = ({ 
  children, 
  className,
  variant = 'default',
  size = 'md'
}) => {
  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200'
  };
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  return (
    <span className={cn(
      'inline-flex items-center font-medium border rounded-full',
      variantClasses[variant],
      sizeClasses[size],
      className
    )}>
      {children}
    </span>
  );
};

interface ModernDividerProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ModernDivider: React.FC<ModernDividerProps> = ({ 
  className,
  orientation = 'horizontal',
  spacing = 'md'
}) => {
  const spacingClasses = {
    horizontal: {
      sm: 'my-4',
      md: 'my-6',
      lg: 'my-8',
      xl: 'my-12'
    },
    vertical: {
      sm: 'mx-4',
      md: 'mx-6', 
      lg: 'mx-8',
      xl: 'mx-12'
    }
  };
  
  return (
    <div className={cn(
      'border-slate-200',
      orientation === 'horizontal' ? 'border-t w-full' : 'border-l h-full',
      spacingClasses[orientation][spacing],
      className
    )} />
  );
};

interface ModernSectionProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ModernSection: React.FC<ModernSectionProps> = ({ 
  children, 
  className,
  spacing = 'lg'
}) => {
  const spacingClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-24'
  };
  
  return (
    <section className={cn(
      spacingClasses[spacing],
      className
    )}>
      {children}
    </section>
  );
};

// Modern metric card component
interface ModernMetricProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
}

export const ModernMetric: React.FC<ModernMetricProps> = ({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  className
}) => {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600', 
    neutral: 'text-slate-600'
  };
  
  return (
    <ModernCard variant="default" padding="lg" hover className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <ModernText size="sm" color="muted" weight="medium" className="uppercase tracking-wide mb-2">
            {label}
          </ModernText>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {change && (
            <div className={cn('text-sm font-medium flex items-center gap-1', changeColors[changeType])}>
              {change}
            </div>
          )}
        </div>
        {icon && (
          <div className="text-slate-400 opacity-50">
            {icon}
          </div>
        )}
      </div>
    </ModernCard>
  );
};