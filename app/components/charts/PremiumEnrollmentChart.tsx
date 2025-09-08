'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';
import { GlassCard } from '@/app/components/ui/glass-card';
import { AnimatedNumber } from '@/app/components/ui/animated-number';
import { LottieLoader } from '@/app/components/ui/lottie-loader';
import { 
  processEnrollmentData, 
  calculateEnrollmentStats,
  formatPercentage 
} from '@utils/chartDataProcessors';

interface PremiumEnrollmentChartProps {
  data: any[];
  loading?: boolean;
  error?: string;
  rollingMonths?: number;
}

const PremiumEnrollmentChart: React.FC<PremiumEnrollmentChartProps> = ({ 
  data, 
  loading = false, 
  error = '',
  rollingMonths,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // Process enrollment data with rolling window
  const chartData = useMemo(() => {
    const window = typeof rollingMonths === 'number' ? rollingMonths : (Array.isArray(data) ? data.length : 12);
    return processEnrollmentData(data, window);
  }, [data, rollingMonths]);

  // Calculate statistics
  const stats = useMemo(() => {
    return calculateEnrollmentStats(chartData);
  }, [chartData]);

  // Prepare ECharts data
  const echartsData = useMemo(() => {
    if (!chartData.length) return null;

    const months = chartData.map(d => d.month);
    const employeeCounts = chartData.map(d => d.employeeCount);

    return {
      categories: months,
      series: [
        {
          name: 'Enrollment',
          data: employeeCounts,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 4,
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#667eea' },
                { offset: 1, color: '#764ba2' }
              ]
            }
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(102, 126, 234, 0.4)' },
                { offset: 1, color: 'rgba(118, 75, 162, 0.1)' }
              ]
            }
          },
          emphasis: {
            focus: 'series'
          }
        }
      ]
    };
  }, [chartData]);

  // Initialize chart
  useEffect(() => {
    if (!chartRef.current || loading || error || !echartsData) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    const chart = echarts.init(chartRef.current, null, { renderer: 'svg' });
    chartInstance.current = chart;

    const option = {
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
      grid: {
        top: 60,
        right: 30,
        bottom: 60,
        left: 60,
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 12
        },
        formatter: (params: any) => {
          const point = params[0];
          return `
            <div style="padding: 8px;">
              <strong>${point.axisValue}</strong><br/>
              Enrollment: <strong style="color: #667eea;">${point.value.toLocaleString()}</strong>
            </div>
          `;
        }
      },
      xAxis: {
        type: 'category',
        data: echartsData.categories,
        boundaryGap: false,
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          fontFamily: 'Inter, sans-serif'
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(100, 116, 139, 0.2)'
          }
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
          formatter: (value: number) => value.toLocaleString()
        },
        axisLine: {
          show: false
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(100, 116, 139, 0.1)',
            type: 'dashed'
          }
        }
      },
      series: echartsData.series
    };

    chart.setOption(option);

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [echartsData, loading, error]);

  if (loading) {
    return (
      <GlassCard variant="elevated" className="h-[500px] flex items-center justify-center">
        <div className="text-center">
          <LottieLoader type="pulse" size="lg" />
          <p className="mt-4 text-sm text-gray-600">Loading enrollment data...</p>
        </div>
      </GlassCard>
    );
  }

  if (error || !chartData.length) {
    return (
      <GlassCard variant="elevated" className="h-[500px] flex items-center justify-center">
        <div className="text-center">
          <LottieLoader type="error" size="lg" />
          <p className="mt-4 text-sm text-red-600">{error || "No enrollment data available"}</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="elevated" interactive className="h-[500px]">
      {/* Header with Premium Statistics */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Enrollment Trends
          </h3>
          <div className="px-3 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Premium Analytics
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-effect p-4 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Current</p>
                <AnimatedNumber 
                  value={stats.current} 
                  className="text-xl font-bold text-blue-600 dark:text-blue-400"
                  separator
                />
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`glass-effect p-4 rounded-xl ${
              stats.change >= 0 ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Change</p>
                <div className="flex items-center space-x-1">
                  <AnimatedNumber 
                    value={stats.change} 
                    prefix={stats.change >= 0 ? '+' : ''}
                    className={`text-xl font-bold ${
                      stats.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}
                    separator
                  />
                  <span className={`text-sm ${
                    stats.change >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    ({formatPercentage(stats.percentageChange)})
                  </span>
                </div>
              </div>
              <div className={`p-2 rounded-lg ${
                stats.change >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
              }`}>
                {stats.change >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-effect p-4 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Average</p>
                <AnimatedNumber 
                  value={stats.average} 
                  className="text-xl font-bold text-purple-600 dark:text-purple-400"
                  separator
                  decimals={0}
                />
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Premium Chart Container */}
      <div 
        ref={chartRef} 
        className="flex-1 min-h-[300px] glass-subtle rounded-xl p-4"
        style={{ height: 'calc(100% - 200px)' }}
      />
    </GlassCard>
  );
};

export default PremiumEnrollmentChart;