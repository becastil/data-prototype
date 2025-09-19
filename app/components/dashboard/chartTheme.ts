export const chartPalette = {
  accent: '#2563eb',
  accentSoft: 'rgba(37, 99, 235, 0.12)',
  accentMuted: '#93c5fd',
  neutral: '#dfe4ed',
  neutralMuted: '#f1f5f9',
  foreground: '#111827',
  foregroundMuted: '#4b5563',
  foregroundSubtle: '#9ca3af',
  tooltipBg: 'rgba(15, 23, 42, 0.95)',
  tooltipText: '#f8fafc',
  positive: '#16a34a',
  caution: '#f59e0b',
  warn: '#f97316',
  negative: '#dc2626',
  medical: '#14b8a6',
  pharmacy: '#8b5cf6'
};

export const baseChartGrid = {
  left: 24,
  right: 16,
  top: 36,
  bottom: 32,
  containLabel: true
};

export const baseTooltip = {
  trigger: 'axis',
  backgroundColor: chartPalette.tooltipBg,
  borderColor: 'transparent',
  borderWidth: 0,
  textStyle: {
    color: chartPalette.tooltipText,
    fontFamily: 'Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: 12,
    fontWeight: 500
  },
  padding: [8, 12]
};

export const baseAxisStyles = {
  axisLine: {
    lineStyle: {
      color: chartPalette.neutral
    }
  },
  axisLabel: {
    color: chartPalette.foregroundMuted,
    fontSize: 11,
    fontFamily: 'Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  splitLine: {
    lineStyle: {
      color: 'rgba(148, 163, 184, 0.18)'
    }
  }
};

export const gaugeRanges = [
  { label: '<95%', max: 95, color: chartPalette.positive },
  { label: '95-105%', max: 105, color: chartPalette.caution },
  { label: '105-115%', max: 115, color: chartPalette.warn },
  { label: '>115%', max: 130, color: chartPalette.negative }
];
