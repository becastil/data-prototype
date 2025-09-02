'use client';

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as echarts from 'echarts';
import { motion } from 'framer-motion';
import { chartColors, getChartColors, type ChartColors } from '@/app/constants/chartColors';
import { processFinancialData, formatCurrency } from '@utils/chartDataProcessors';
import { ChartDescription, LiveRegion, useReducedMotion } from '@components/accessibility/AccessibilityEnhancements';

interface EChartsEnterpriseChartProps {
  data: any[];
  loading?: boolean;
  error?: string;
  enableWebGL?: boolean;
  streamingData?: boolean;
  maxDataPoints?: number;
}

const EChartsEnterpriseChart: React.FC<EChartsEnterpriseChartProps> = ({ 
  data, 
  loading = false, 
  error = '',
  enableWebGL = true,
  streamingData = false,
  maxDataPoints = 10000
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  // Track theme changes to avoid recreating color object every render
  const [themeKey, setThemeKey] = React.useState<string>('');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const update = () => setThemeKey(root.getAttribute('data-theme') || 'light');
    update();
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-theme') {
          update();
        }
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  const colors: ChartColors = useMemo(
    () => (typeof window !== 'undefined' ? getChartColors() : chartColors),
    [themeKey]
  );
  const prefersReducedMotion = useReducedMotion();
  const [chartStatus, setChartStatus] = React.useState<string>('');

  // Process data with 12-month rolling window
  const chartData = useMemo(() => {
    return processFinancialData(data, 12);
  }, [data]);

  // Prepare ECharts data format
  const echartsData = useMemo(() => {
    if (!chartData.length) return null;

    const categories = chartData.map(d => d.month);
    const adminData = chartData.map(d => d.totalFixedCost);
    // Net claims = (medical + rx) - (rx rebates + stop loss reimbursements)
    const netClaimsData = chartData.map(d => {
      const net = (d.medicalClaims + d.rx) - (d.rxRebates + d.stopLossReimb);
      return Math.max(0, net);
    });
    const budgetData = chartData.map(d => d.budget);

    return {
      categories,
      series: [
        { name: 'Claims (Net)', data: netClaimsData, type: 'bar', stack: 'expenses' },
        { name: 'Admin', data: adminData, type: 'bar', stack: 'expenses' },
        { name: 'Budget', data: budgetData, type: 'line' }
      ]
    };
  }, [chartData]);

  // Helpers for vibrant gradients
  const hexToRgba = (hex: string, alpha: number) => {
    const h = hex.replace('#', '');
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Generate accessible chart description
  const chartDescription = useMemo(() => {
    if (!chartData.length) return null;

    const latestData = chartData[chartData.length - 1];
    const latestNetClaims = Math.max(0, (latestData.medicalClaims + latestData.rx) - (latestData.rxRebates + latestData.stopLossReimb));
    const totalExpenses = latestData.totalFixedCost + latestNetClaims;
    
    const dataPoints = [
      `Latest month: ${latestData.month}`,
      `Budget: ${formatCurrency(latestData.budget)}`,
      `Total expenses (net): ${formatCurrency(totalExpenses)}`,
      `Budget vs expenses: ${totalExpenses > latestData.budget ? 'Over budget' : 'Under budget'} by ${formatCurrency(Math.abs(totalExpenses - latestData.budget))}`
    ];

    const trends = [];
    if (chartData.length > 1) {
      const previousData = chartData[chartData.length - 2];
      const previousNetClaims = Math.max(0, (previousData.medicalClaims + previousData.rx) - (previousData.rxRebates + previousData.stopLossReimb));
      const previousExpenses = previousData.totalFixedCost + previousNetClaims;
      
      if (totalExpenses > previousExpenses) {
        trends.push(`Expenses increased from previous month by ${formatCurrency(totalExpenses - previousExpenses)}`);
      } else if (totalExpenses < previousExpenses) {
        trends.push(`Expenses decreased from previous month by ${formatCurrency(previousExpenses - totalExpenses)}`);
      } else {
        trends.push('Expenses remained stable from previous month');
      }
    }

    return {
      title: 'Budget vs Expenses Trend Chart',
      description: `Interactive chart showing budget performance over ${chartData.length} months. Stacked bars display Claims (Medical + Rx net of rebates and reimbursements) with Admin on top, plus a Budget line overlay.`,
      dataPoints,
      trends
    };
  }, [chartData]);

  // Initialize chart with enterprise configuration
  const initChart = useCallback(() => {
    if (!chartRef.current || !echartsData) return;

    setChartStatus('Initializing chart...');

    // Dispose existing chart instance before creating new one
    if (chartInstance.current) {
      chartInstance.current.dispose();
      chartInstance.current = null;
    }

    // ECharts supports 'canvas' and 'svg' renderers; WebGL requires extra packages.
    // Use canvas renderer for broad compatibility and performance.
    const renderer: echarts.RendererType = 'canvas';
    
    chartInstance.current = echarts.init(chartRef.current, undefined, {
      renderer,
      useDirtyRect: true, // Performance optimization for partial updates
      useCoarsePointer: true // Better touch support
    });

    const option: echarts.EChartsOption = {
      title: {
        text: 'Budget vs Expenses Trend',
        subtext: 'Enterprise Dashboard - Rolling 12 Months',
        left: 'left',
        textStyle: {
          color: colors.textColor || '#1F2937',
          fontSize: 20,
          fontWeight: 'bold',
          fontFamily: 'var(--font-heading)'
        },
        subtextStyle: {
          color: colors.textColor || '#6B7280',
          fontSize: 14,
          fontFamily: 'var(--font-subheading)'
        }
      },
      
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        textStyle: {
          color: '#374151',
          fontSize: 12,
          fontFamily: 'var(--font-body)'
        },
        formatter: function (params: any) {
          let html = `<div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #111827;">
              ${params[0]?.name}
            </div>`;
          
          params.forEach((param: any) => {
            const value = formatCurrency(param.value);
            html += `
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background-color: ${param.color}; margin-right: 8px; border-radius: 2px;"></div>
                <span style="color: #374151; font-size: 12px;">${param.seriesName}: ${value}</span>
              </div>`;
          });
          
          html += '</div>';
          return html;
        }
      },

      legend: {
        top: 40,
        right: 20,
        orient: 'vertical',
        textStyle: {
          color: colors.textColor || '#374151',
          fontSize: 12,
          fontFamily: 'var(--font-body)'
        },
        itemGap: 12,
        itemWidth: 14,
        itemHeight: 14,
        icon: 'roundRect'
      },

      grid: {
        left: '8%',
        right: '25%',
        bottom: '15%',
        top: '20%',
        containLabel: true
      },

      xAxis: {
        type: 'category',
        data: echartsData.categories,
        axisLine: {
          lineStyle: { color: colors.gridColor || '#E5E7EB' }
        },
        axisTick: {
          lineStyle: { color: colors.gridColor || '#E5E7EB' }
        },
        axisLabel: {
          color: '#6B7280',
          fontSize: 11,
          fontFamily: 'var(--font-body)',
          rotate: 45,
          margin: 12
        }
      },

      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: { color: colors.gridColor || '#E5E7EB' }
        },
        axisTick: {
          lineStyle: { color: colors.gridColor || '#E5E7EB' }
        },
        axisLabel: {
          color: colors.textColor || '#6B7280',
          fontSize: 11,
          fontFamily: 'var(--font-data)',
          formatter: (value: number) => `$${(value / 1000).toFixed(0)}K`
        },
        splitLine: {
          lineStyle: {
            color: colors.gridColor || '#F3F4F6',
            type: 'dashed'
          }
        }
      },

      series: [
        // Stacked bars (Claims net + Admin)
        {
          name: 'Claims (Net)',
          type: 'bar',
          stack: 'expenses',
          data: echartsData.series[0].data,
          itemStyle: {
            color: new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: hexToRgba(colors.medicalClaims, 0.85) },
              { offset: 1, color: colors.medicalClaims }
            ]),
            borderRadius: [0, 0, 2, 2]
          },
          emphasis: { focus: 'series' },
          animationDelay: (idx: number) => idx * 50
        },
        {
          name: 'Admin',
          type: 'bar',
          stack: 'expenses',
          data: echartsData.series[1].data,
          itemStyle: {
            color: new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: hexToRgba(colors.totalFixedCost, 0.85) },
              { offset: 1, color: colors.totalFixedCost }
            ]),
            borderRadius: [2, 2, 0, 0]
          },
          emphasis: { focus: 'series' },
          animationDelay: (idx: number) => idx * 50 + 100
        },
        // Budget line
        {
          name: 'Budget',
          type: 'line',
          data: echartsData.series[2].data,
          lineStyle: {
            color: colors.budget,
            width: 3,
            type: 'solid'
          },
          itemStyle: {
            color: colors.budget,
            borderWidth: 2,
            borderColor: '#FFFFFF'
          },
          symbol: 'circle',
          symbolSize: 8,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: colors.budget
            }
          },
          animationDelay: 300
        }
      ],

      // Enterprise-grade animations (respect reduced motion)
      animation: !prefersReducedMotion,
      animationDuration: prefersReducedMotion ? 0 : 800,
      animationEasing: 'cubicOut',
      animationThreshold: maxDataPoints,

      // Performance optimizations
      progressive: streamingData ? 500 : 0, // Incremental rendering for large datasets
      progressiveThreshold: maxDataPoints,

      // Comprehensive accessibility support
      aria: {
        enabled: true,
        label: {
          enabled: true,
          description: chartDescription?.description || 'Budget vs Expenses Chart'
        },
        decal: {
          show: true,
          decals: [
            {
              dashArrayX: [1, 0],
              dashArrayY: [2, 5],
              symbolSize: 1,
              rotation: Math.PI / 6
            },
            {
              dashArrayX: [2, 5],
              dashArrayY: [1, 0],
              symbolSize: 1,
              rotation: -Math.PI / 2
            }
          ]
        }
      },

      // Data zoom for large datasets
      dataZoom: echartsData.categories.length > 24 ? [
        {
          type: 'inside',
          start: 50,
          end: 100
        },
        {
          start: 50,
          end: 100,
          height: 20,
          bottom: 40
        }
      ] : [],

      // Responsive design
      media: [
        {
          query: { maxWidth: 768 },
          option: {
            grid: { right: '5%' },
            legend: { top: 50, right: 10 },
            title: { textStyle: { fontSize: 16 } }
          }
        }
      ]
    };

    chartInstance.current.setOption(option);
    
    // Announce chart completion for screen readers
    setChartStatus('Chart loaded successfully. Use Tab to navigate chart elements.');

    // Handle resize for responsive behavior
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    
    // Chart event handlers for accessibility
    chartInstance.current.on('finished', () => {
      setChartStatus('Chart rendering complete');
    });

    chartInstance.current.on('dataZoom', () => {
      setChartStatus('Chart view updated');
    });

    chartInstance.current.on('legendselectchanged', (params: any) => {
      const action = params.selected[params.name] ? 'shown' : 'hidden';
      setChartStatus(`${params.name} series ${action}`);
    });
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [echartsData, enableWebGL, streamingData, maxDataPoints, themeKey]);

  // Initialize chart and re-initialize on data/theme changes (captured by initChart deps)
  useEffect(() => {
    const cleanup = initChart();
    return cleanup;
  }, [initChart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="panel-elevated p-6">
        <div className="flex items-center justify-center h-[500px]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-3 border-black dark:border-white border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="panel-elevated p-6">
        <div className="flex items-center justify-center h-[500px]">
          <div className="text-center">
            <p className="text-danger text-lg font-semibold">Chart Error</p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!echartsData) {
    return (
      <div className="panel-elevated p-6">
        <div className="flex items-center justify-center h-[500px]">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No data available</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Upload budget data to see visualizations</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-elevated rounded-xl p-6">
      {/* Live region for screen reader announcements */}
      <LiveRegion message={chartStatus} priority="polite" />
      
      {/* Chart description for screen readers */}
      {chartDescription && (
        <ChartDescription
          title={chartDescription.title}
          description={chartDescription.description}
          dataPoints={chartDescription.dataPoints}
          trends={chartDescription.trends}
        />
      )}

      {/* Chart container */}
      <div 
        ref={chartRef} 
        className="w-full h-[500px]"
        role="img"
        aria-label={chartDescription?.description || "Budget vs Expenses trend chart showing financial data over time"}
        tabIndex={0}
        onKeyDown={(e) => {
          // Basic keyboard navigation
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const newStatus = `Chart focused. ${chartDescription?.dataPoints?.[0] || 'Financial data visualization'}`;
            setChartStatus(newStatus);
          }
        }}
      />
      
      {/* Enterprise summary statistics */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-black dark:text-white font-data">
              {chartData.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-body">
              Months Analyzed
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-black dark:text-white font-data">
              {formatCurrency(chartData[chartData.length - 1]?.budget || 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-body">
              Current Budget
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-black dark:text-white font-data">
              Canvas
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-body">
              Rendering Mode
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-black dark:text-white font-data">
              {streamingData ? 'ON' : 'OFF'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-body">
              Streaming Data
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EChartsEnterpriseChart;
