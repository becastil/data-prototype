'use client';

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import { ChartNoAxesCombined } from 'lucide-react';
import { GlassCard } from '@/app/components/ui/glass-card';
import { chartPalette, gaugeRanges } from './chartTheme';

type TimeframeOption = {
  key: string;
  label: string;
  value: number;
};

interface PerformanceIndicatorProps {
  title?: string;
  timeframes: TimeframeOption[];
  selectedTimeframe: string;
  onTimeframeChange: (key: string) => void;
  ranges?: typeof gaugeRanges;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function PerformanceIndicator({
  title = 'Plan Performance',
  timeframes,
  selectedTimeframe,
  onTimeframeChange,
  ranges = gaugeRanges
}: PerformanceIndicatorProps) {
  const current = useMemo(() => {
    const fallback = timeframes[0];
    const active = timeframes.find(option => option.key === selectedTimeframe);
    return active ?? fallback;
  }, [selectedTimeframe, timeframes]);

  const maxRange = ranges[ranges.length - 1]?.max ?? 130;
  const minRange = ranges[0]?.min ?? 0;
  const value = clamp(current.value, minRange, maxRange);

  const axisLineColors = ranges.reduce<Array<[number, string]>>((acc, range, index) => {
    const prevMax = index === 0 ? minRange : ranges[index - 1].max;
    const segmentMax = range.max;
    const end = segmentMax / maxRange;
    acc.push([end, range.color]);
    return acc;
  }, []);

  const tickLabels = ranges.map((range, index) => {
    const start = index === 0 ? minRange : ranges[index - 1].max;
    const end = range.max;
    const midPoint = (start + end) / 2;
    return {
      value: midPoint,
      label: range.label
    };
  });

  const option = useMemo(() => ({
    tooltip: {
      show: true,
      trigger: 'item',
      formatter: () => `${current.value.toFixed(1)}% of budget`,
      backgroundColor: chartPalette.tooltipBg,
      borderWidth: 0,
      textStyle: {
        color: chartPalette.tooltipText,
        fontSize: 12,
        fontFamily: 'Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
      },
      padding: [8, 12]
    },
    series: [
      {
        type: 'gauge',
        startAngle: 220,
        endAngle: -40,
        min: minRange,
        max: maxRange,
        splitNumber: ranges.length * 4,
        progress: {
          show: true,
          width: 14,
          itemStyle: {
            color: chartPalette.accent,
            shadowBlur: 0
          }
        },
        axisLine: {
          roundCap: true,
          lineStyle: {
            width: 14,
            color: axisLineColors,
            cap: 'round'
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          length: 10,
          lineStyle: {
            color: 'rgba(17,24,39,0.1)',
            width: 2
          }
        },
        axisLabel: {
          distance: 24,
          color: chartPalette.foregroundMuted,
          fontSize: 10,
          fontFamily: 'Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          formatter: (val: number) => {
            const label = tickLabels.find(tick => Math.abs(tick.value - val) < 1);
            return label ? label.label : '';
          }
        },
        pointer: {
          show: false
        },
        anchor: {
          show: false
        },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '0%'],
          formatter: (val: number) => `${val.toFixed(1)}%`,
          fontSize: 32,
          fontWeight: 600,
          color: chartPalette.foreground
        },
        title: {
          offsetCenter: [0, '58%'],
          fontSize: 12,
          color: chartPalette.foregroundMuted,
          fontFamily: 'Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
        },
        data: [
          {
            value,
            name: 'of budget'
          }
        ]
      }
    ]
  }), [axisLineColors, current.value, maxRange, minRange, ranges.length, tickLabels, value]);

  return (
    <GlassCard variant="elevated" className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <ChartNoAxesCombined className="h-4 w-4 text-[var(--accent)]" aria-hidden />
          <span>{title}</span>
        </div>
        {timeframes.length > 1 ? (
          <div className="flex items-center gap-1 rounded-full border border-[var(--surface-border)] bg-[var(--surface)] px-2 py-1 text-xs font-medium text-[var(--foreground-muted)]">
            {timeframes.map(option => {
              const active = option.key === current.key;
              return (
                <motion.button
                  key={option.key}
                  type="button"
                  onClick={() => onTimeframeChange(option.key)}
                  className={`relative rounded-full px-2.5 py-1 transition-colors ${active ? 'text-[var(--accent)]' : ''}`}
                  whileHover={{ scale: active ? 1 : 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  aria-pressed={active}
                >
                  {active && (
                    <motion.span
                      layoutId="performance-timeframe"
                      className="absolute inset-0 rounded-full bg-[var(--accent-soft)]"
                      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                      aria-hidden
                    />
                  )}
                  <span className="relative z-10">{option.label}</span>
                </motion.button>
              );
            })}
          </div>
        ) : null}
      </div>

      <ReactECharts
        option={option}
        style={{ width: '100%', height: 260 }}
        notMerge
        lazyUpdate
      />
    </GlassCard>
  );
}
