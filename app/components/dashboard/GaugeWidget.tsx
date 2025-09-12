'use client';

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import './widget-animations.css';

interface GaugeWidgetProps {
  value: number; // Percentage value (0-140)
  title?: string;
  height?: string;
  showLegend?: boolean;
}

export default function GaugeWidget({ 
  value, 
  title = 'Budget Utilization',
  height = '260px',
  showLegend = true 
}: GaugeWidgetProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    
    let chart: echarts.ECharts | null = null;
    let resizeHandler: (() => void) | null = null;
    
    try {
      chart = echarts.init(chartRef.current);
      
      // Create segmented gauge with gaps
      const option: echarts.EChartsOption = {
        series: [
          // Background arc segments
          {
            type: 'gauge',
            startAngle: 200,
            endAngle: -20,
            center: ['50%', '65%'],
            radius: '100%',
            min: 0,
            max: 140,
            splitNumber: 0,
            axisLine: {
              lineStyle: {
                width: 30,
                color: [
                  [0.679, '#22c55e'], // Green: 0-95% (0.679 = 95/140)
                  [0.75, 'transparent'], // Gap
                  [0.75, 'transparent'],
                  [0.785, '#facc15'], // Yellow: 95-110% (0.785 = 110/140)
                  [0.82, 'transparent'], // Gap
                  [0.82, 'transparent'],
                  [0.857, '#fb923c'], // Orange: 110-120% (0.857 = 120/140)
                  [0.893, 'transparent'], // Gap
                  [0.893, 'transparent'],
                  [1, '#ef4444'], // Red: 120-140%
                ],
              },
            },
            pointer: {
              show: true,
              length: '75%',
              width: 6,
              offsetCenter: [0, '-5%'],
              itemStyle: {
                color: '#1f2937',
                shadowColor: 'rgba(0, 0, 0, 0.3)',
                shadowBlur: 5,
                shadowOffsetY: 2,
              },
            },
            axisTick: {
              show: false,
            },
            splitLine: {
              show: false,
            },
            axisLabel: {
              show: false,
            },
            title: {
              show: true,
              offsetCenter: [0, '30%'],
              fontSize: 14,
              fontWeight: 'bold',
              color: '#374151',
            },
            detail: {
              show: true,
              offsetCenter: [0, '0%'],
              fontSize: 32,
              fontWeight: 'bold',
              color: value > 105 ? '#ef4444' : value > 95 ? '#f59e0b' : '#22c55e',
              formatter: '{value}%',
              valueAnimation: true,
            },
            data: [
              {
                value: Math.round(value * 10) / 10,
                name: title,
              },
            ],
          },
          // Inner decorative circle
          {
            type: 'gauge',
            center: ['50%', '65%'],
            radius: '35%',
            startAngle: 0,
            endAngle: 360,
            axisLine: {
              lineStyle: {
                width: 1,
                color: [[1, '#e5e7eb']],
              },
            },
            splitLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            pointer: { show: false },
            title: { show: false },
            detail: { show: false },
          },
          // Center dot
          {
            type: 'gauge',
            center: ['50%', '65%'],
            radius: '8%',
            startAngle: 0,
            endAngle: 360,
            axisLine: {
              lineStyle: {
                width: 10,
                color: [[1, '#374151']],
              },
            },
            splitLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            pointer: { show: false },
            title: { show: false },
            detail: { show: false },
          },
        ],
      };
      
      chart.setOption(option);
      
      resizeHandler = () => chart?.resize();
      window.addEventListener('resize', resizeHandler);
    } catch (e) {
      console.error('Failed to initialize gauge widget:', e);
    }
    
    return () => {
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
      }
      if (chart) {
        try {
          chart.dispose();
        } catch (e) {
          console.error('Failed to dispose gauge widget:', e);
        }
      }
    };
  }, [value, title]);

  // Animate legend items on mount
  useEffect(() => {
    if (!legendRef.current || !showLegend) return;
    
    const items = legendRef.current.querySelectorAll('.legend-item');
    items.forEach((item, index) => {
      (item as HTMLElement).style.animation = `fadeInUp 0.3s ease-out ${index * 0.1}s both`;
    });
  }, [showLegend]);

  return (
    <div className="gauge-widget">
      <div 
        ref={chartRef} 
        style={{ width: '100%', height }}
        className="gauge-chart"
      />
      
      {showLegend && (
        <div ref={legendRef} className="text-sm text-black bg-white border border-gray-300 rounded p-3 mt-3">
          <div className="legend-item flex items-center mb-1">
            <span className="inline-block w-3 h-3 bg-[#22c55e] mr-2 rounded-sm" />
            <span>Green — &lt; 95% of Budget</span>
          </div>
          <div className="legend-item flex items-center mb-1">
            <span className="inline-block w-3 h-3 bg-[#facc15] mr-2 rounded-sm" />
            <span>Yellow — 95% to 105% of Budget</span>
          </div>
          <div className="legend-item flex items-center mb-1">
            <span className="inline-block w-3 h-3 bg-[#fb923c] mr-2 rounded-sm" />
            <span>Orange — 105% to 115% of Budget</span>
          </div>
          <div className="legend-item flex items-center">
            <span className="inline-block w-3 h-3 bg-[#ef4444] mr-2 rounded-sm" />
            <span>Red — &gt; 115% of Budget</span>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}