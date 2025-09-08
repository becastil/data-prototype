"use client";

import React, { useEffect, useRef } from 'react';
import { animateNumber } from '@/app/lib/gsapConfig';
import { cn } from '@/app/lib/utils';

interface AnimatedNumberProps {
  value: number;
  from?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  separator?: boolean;
  format?: 'currency' | 'percentage' | 'number' | 'compact';
  trigger?: boolean;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  from = 0,
  duration = 2,
  className,
  prefix = '',
  suffix = '',
  decimals = 0,
  separator = true,
  format = 'number',
  trigger = true
}) => {
  const numberRef = useRef<HTMLSpanElement>(null);

  const formatNumber = (num: number): string => {
    let formatted: string;
    
    switch (format) {
      case 'currency':
        formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(num);
        break;
        
      case 'percentage':
        formatted = new Intl.NumberFormat('en-US', {
          style: 'percent',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(num / 100);
        break;
        
      case 'compact':
        formatted = new Intl.NumberFormat('en-US', {
          notation: 'compact',
          compactDisplay: 'short',
          minimumFractionDigits: 0,
          maximumFractionDigits: 1
        }).format(num);
        break;
        
      default:
        formatted = separator 
          ? new Intl.NumberFormat('en-US', {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals
            }).format(num)
          : num.toFixed(decimals);
    }
    
    return `${prefix}${formatted}${suffix}`;
  };

  useEffect(() => {
    if (!numberRef.current || !trigger) return;

    const element = numberRef.current;
    
    // Set initial value
    element.textContent = formatNumber(from);
    
    // Animate to target value
    const animation = animateNumber(
      element,
      from,
      value,
      duration,
      formatNumber
    );

    return () => {
      animation.kill();
    };
  }, [value, from, duration, format, decimals, separator, prefix, suffix, trigger]);

  return (
    <span 
      ref={numberRef} 
      className={cn(
        "font-mono tabular-nums transition-colors duration-200",
        className
      )}
    >
      {formatNumber(trigger ? from : value)}
    </span>
  );
};

export { AnimatedNumber };