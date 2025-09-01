'use client';

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as echarts from 'echarts';
import { motion } from 'framer-motion';
import { chartColors, getChartColors } from '../constants/chartColors';
import { processFinancialData, formatCurrency } from '../utils/chartDataProcessors';
import { ChartDescription, LiveRegion, useReducedMotion } from './AccessibilityEnhancements';

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
  const colors = typeof window !== 'undefined' ? getChartColors() : chartColors;
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
    const totalFixedCostData = chartData.map(d => d.totalFixedCost);
    const stopLossReimbData = chartData.map(d => d.stopLossReimb);
    const rxRebatesData = chartData.map(d => d.rxRebates);
    const medicalClaimsData = chartData.map(d => d.medicalClaims);
    const rxData = chartData.map(d => d.rx);
    const budgetData = chartData.map(d => d.budget);

    return {
      categories,
      series: [
        { name: 'Total Fixed Cost', data: totalFixedCostData, type: 'bar', stack: 'expenses' },
        { name: 'Stop Loss Reimb', data: stopLossReimbData, type: 'bar', stack: 'expenses' },
        { name: 'Rx Rebates', data: rxRebatesData, type: 'bar', stack: 'expenses' },
        { name: 'Medical Claims', data: medicalClaimsData, type: 'bar', stack: 'expenses' },
        { name: 'Rx', data: rxData, type: 'bar', stack: 'expenses' },
        { name: 'Budget', data: budgetData, type: 'line' }
      ]
    };
  }, [chartData]);

  // Generate accessible chart description
  const chartDescription = useMemo(() => {
    if (!chartData.length) return null;

    const latestData = chartData[chartData.length - 1];
    const totalExpenses = latestData.totalFixedCost + latestData.stopLossReimb + 
                         latestData.rxRebates + latestData.medicalClaims + latestData.rx;
    
    const dataPoints = [
      `Latest month: ${latestData.month}`,
      `Budget: ${formatCurrency(latestData.budget)}`,
      `Total expenses: ${formatCurrency(totalExpenses)}`,
      `Budget vs expenses: ${totalExpenses > latestData.budget ? 'Over budget' : 'Under budget'} by ${formatCurrency(Math.abs(totalExpenses - latestData.budget))}`
    ];

    const trends = [];
    if (chartData.length > 1) {
      const previousData = chartData[chartData.length - 2];
      const previousExpenses = previousData.totalFixedCost + previousData.stopLossReimb + 
                              previousData.rxRebates + previousData.medicalClaims + previousData.rx;
      
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
      description: `Interactive chart showing budget performance over ${chartData.length} months. Chart displays stacked bars for expenses (Total Fixed Cost, Stop Loss Reimbursements, Rx Rebates, Medical Claims, and Rx costs) with budget line overlay.`,
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

    // Use WebGL renderer for performance when enabled
    const renderer = enableWebGL ? 'webgl' : 'canvas';
    
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
          color: (colors as any).textColor || '#1F2937',
          fontSize: 20,
          fontWeight: 'bold',
          fontFamily: 'var(--font-heading)'
        },
        subtextStyle: {
          color: (colors as any).textColor || '#6B7280',
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
          color: (colors as any).textColor || '#374151',
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
          lineStyle: { color: (colors as any).gridColor || '#E5E7EB' }
        },
        axisTick: {
          lineStyle: { color: (colors as any).gridColor || '#E5E7EB' }
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
          lineStyle: { color: (colors as any).gridColor || '#E5E7EB' }
        },
        axisTick: {
          lineStyle: { color: (colors as any).gridColor || '#E5E7EB' }
        },
        axisLabel: {
          color: (colors as any).textColor || '#6B7280',
          fontSize: 11,
          fontFamily: 'var(--font-data)',
          formatter: (value: number) => `$${(value / 1000).toFixed(0)}K`
        },
        splitLine: {
          lineStyle: {
            color: (colors as any).gridColor || '#F3F4F6',
            type: 'dashed'
          }
        }
      },

      series: [
        // Stacked bars
        {
          name: 'Total Fixed Cost',
          type: 'bar',
          stack: 'expenses',
          data: echartsData.series[0].data,
          itemStyle: { 
            color: colors.totalFixedCost,
            borderRadius: [0, 0, 2, 2]
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.3)'
            }
          },
          animationDelay: (idx: number) => idx * 50
        },
        {
          name: 'Stop Loss Reimb',
          type: 'bar',
          stack: 'expenses',
          data: echartsData.series[1].data,
          itemStyle: { color: colors.stopLossReimb },
          emphasis: { focus: 'series' },
          animationDelay: (idx: number) => idx * 50 + 100
        },
        {
          name: 'Rx Rebates',
          type: 'bar',
          stack: 'expenses',
          data: echartsData.series[2].data,
          itemStyle: { color: colors.rxRebates },
          emphasis: { focus: 'series' },
          animationDelay: (idx: number) => idx * 50 + 200
        },
        {
          name: 'Medical Claims',
          type: 'bar',
          stack: 'expenses',
          data: echartsData.series[3].data,
          itemStyle: { color: colors.medicalClaims },
          emphasis: { focus: 'series' },
          animationDelay: (idx: number) => idx * 50 + 300
        },
        {
          name: 'Rx',
          type: 'bar',
          stack: 'expenses',
          data: echartsData.series[4].data,
          itemStyle: { 
            color: colors.rx,
            borderRadius: [2, 2, 0, 0]
          },
          emphasis: { focus: 'series' },
          animationDelay: (idx: number) => idx * 50 + 400
        },
        // Budget line
        {
          name: 'Budget',
          type: 'line',
          data: echartsData.series[5].data,
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
          animationDelay: 500
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
  }, [echartsData, colors, enableWebGL, streamingData, maxDataPoints]);

  // Initialize chart on mount
  useEffect(() => {
    const cleanup = initChart();
    return cleanup;
  }, [initChart]);

  // Handle theme changes
  useEffect(() => {
    if (chartInstance.current && echartsData) {
      // Re-initialize with new colors when theme changes
      const cleanup = initChart();
      return cleanup;
    }
  }, [colors, initChart, echartsData]);

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
              {enableWebGL ? 'WebGL' : 'Canvas'}
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
