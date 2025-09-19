'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { animate, type AnimationPlaybackControls } from 'framer-motion';

type FormatType = 'number' | 'currency' | 'percentage';

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  format?: FormatType | ((value: number) => string);
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: boolean;
  className?: string;
};

const DEFAULT_DECIMALS: Record<FormatType, number> = {
  number: 0,
  currency: 2,
  percentage: 1,
};

export function AnimatedNumber({
  value,
  duration = 0.6,
  format = 'number',
  decimals,
  prefix = '',
  suffix = '',
  separator = true,
  className,
}: AnimatedNumberProps) {
  const previousValue = useRef(value);
  const animationControls = useRef<AnimationPlaybackControls | null>(null);

  const formatValue = useCallback(
    (val: number) => {
      const safeValue = Number.isFinite(val) ? val : 0;

      if (typeof format === 'function') {
        const formatted = format(safeValue);
        return `${prefix}${formatted}${suffix}`;
      }

      const resolvedDecimals =
        typeof decimals === 'number' ? decimals : DEFAULT_DECIMALS[format];

      if (format === 'currency') {
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: resolvedDecimals,
          maximumFractionDigits: resolvedDecimals,
        }).format(safeValue);
        return `${prefix}${formatted}${suffix}`;
      }

      if (format === 'percentage') {
        const formatted = safeValue.toFixed(resolvedDecimals);
        return `${prefix}${formatted}%${suffix}`;
      }

      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: resolvedDecimals,
        maximumFractionDigits: resolvedDecimals,
        useGrouping: separator,
      }).format(safeValue);

      return `${prefix}${formatted}${suffix}`;
    },
    [decimals, format, prefix, separator, suffix],
  );

  const [displayValue, setDisplayValue] = useState(() => formatValue(value));

  useEffect(() => {
    return () => {
      animationControls.current?.stop();
    };
  }, []);

  useEffect(() => {
    animationControls.current?.stop();

    const start = previousValue.current;

    if (!Number.isFinite(value) || duration <= 0 || start === value) {
      setDisplayValue(formatValue(value));
      previousValue.current = value;
      return;
    }

    animationControls.current = animate(start, value, {
      duration,
      ease: 'easeOut',
      onUpdate: latest => {
        setDisplayValue(formatValue(latest));
      },
    });

    previousValue.current = value;

    return () => {
      animationControls.current?.stop();
    };
  }, [duration, formatValue, value]);

  useEffect(() => {
    setDisplayValue(formatValue(value));
  }, [formatValue, value]);

  return <span className={className}>{displayValue}</span>;
}
