'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import { vars } from '../../styles';
import { 
  MillionDollarAnimations,
  createGPUOptimizedStyle 
} from '../../utils/theatreAnimations';

/**
 * MorphingChart - Theatre.js powered data visualization
 * 
 * Creates smooth, frame-perfect transitions between different chart states
 * that demonstrate the sophisticated animation capabilities mentioned in 
 * the Million-Dollar UI document.
 * 
 * Features:
 * - 60fps data morphing animations
 * - GPU-accelerated transforms
 * - Intelligent transition detection
 * - Accessibility-compliant reduced motion support
 * - Professional spring physics
 */

interface ChartDataPoint {
  name: string;
  value: number;
  category?: string;
}

interface MorphingChartProps {
  data: ChartDataPoint[];
  previousData?: ChartDataPoint[];
  chartType: 'line' | 'bar' | 'area' | 'pie';
  title?: string;
  height?: number;
  animationDuration?: number;
  className?: string;
}

const MorphingChart: React.FC<MorphingChartProps> = ({
  data,
  previousData,
  chartType = 'line',
  title,
  height = 300,
  animationDuration = 1000,
  className = '',
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(chartRef, { once: true, margin: "-100px" });
  const controls = useAnimation();
  
  // Chart state management
  const [currentData, setCurrentData] = useState<ChartDataPoint[]>(previousData || data);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Respect user's motion preferences
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  // Data morphing animation using Theatre.js principles
  useEffect(() => {
    if (previousData && JSON.stringify(previousData) !== JSON.stringify(data)) {
      setIsAnimating(true);
      
      if (prefersReducedMotion) {
        // Instant update for reduced motion
        setCurrentData(data);
        setIsAnimating(false);
        return;
      }

      // Create morphing frames for smooth 60fps animation
      const morphFrames = MillionDollarAnimations.createDataMorph(
        previousData.map(d => d.value),
        data.map(d => d.value)
      );

      // Animate through each frame
      morphFrames.forEach((frame, index) => {
        setTimeout(() => {
          const morphedData = data.map((item, dataIndex) => ({
            ...item,
            value: frame[dataIndex] || item.value
          }));
          setCurrentData(morphedData);
          
          // Animation complete
          if (index === morphFrames.length - 1) {
            setIsAnimating(false);
          }
        }, (index * animationDuration) / morphFrames.length);
      });
    } else {
      setCurrentData(data);
    }
  }, [data, previousData, animationDuration, prefersReducedMotion]);

  // Chart entrance animation
  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  // Generate ECharts configuration based on chart type
  const generateChartOption = () => {
    const baseOption = {
      backgroundColor: 'transparent',
      textStyle: {
        fontFamily: vars.fonts.body,
        color: vars.colors.text,
      },
      animation: !prefersReducedMotion,
      animationDuration: prefersReducedMotion ? 0 : animationDuration,
      animationEasing: 'cubicOut',
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: title ? '15%' : '3%',
        containLabel: true,
      },
      tooltip: {
        backgroundColor: vars.colors.background,
        borderColor: vars.colors.border,
        textStyle: {
          color: vars.colors.text,
          fontFamily: vars.fonts.body,
        },
        extraCssText: `
          box-shadow: ${vars.shadows.lg};
          border-radius: ${vars.radii.lg};
        `,
      },
    };

    const xAxisData = currentData.map(item => item.name);
    const seriesData = currentData.map(item => item.value);

    switch (chartType) {
      case 'line':
        return {
          ...baseOption,
          title: title ? {
            text: title,
            textStyle: {
              fontFamily: vars.fonts.heading,
              fontSize: 16,
              fontWeight: 600,
              color: vars.colors.text,
            },
            left: 'center',
            top: 20,
          } : undefined,
          xAxis: {
            type: 'category',
            data: xAxisData,
            axisLine: {
              lineStyle: { color: vars.colors.border }
            },
            axisLabel: {
              color: vars.colors.textSecondary,
              fontFamily: vars.fonts.body,
            },
          },
          yAxis: {
            type: 'value',
            axisLine: {
              lineStyle: { color: vars.colors.border }
            },
            axisLabel: {
              color: vars.colors.textSecondary,
              fontFamily: vars.fonts.data,
            },
            splitLine: {
              lineStyle: { color: vars.colors.border, opacity: 0.3 }
            },
          },
          series: [{
            data: seriesData,
            type: 'line',
            smooth: true,
            lineStyle: {
              color: vars.colors.chart.primary,
              width: 2,
            },
            itemStyle: {
              color: vars.colors.chart.primary,
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: vars.colors.chart.primary + '20' },
                  { offset: 1, color: vars.colors.chart.primary + '05' }
                ]
              }
            },
            emphasis: {
              scale: 1.1,
            },
          }],
        };

      case 'bar':
        return {
          ...baseOption,
          title: title ? {
            text: title,
            textStyle: {
              fontFamily: vars.fonts.heading,
              fontSize: 16,
              fontWeight: 600,
              color: vars.colors.text,
            },
            left: 'center',
            top: 20,
          } : undefined,
          xAxis: {
            type: 'category',
            data: xAxisData,
            axisLine: {
              lineStyle: { color: vars.colors.border }
            },
            axisLabel: {
              color: vars.colors.textSecondary,
              fontFamily: vars.fonts.body,
            },
          },
          yAxis: {
            type: 'value',
            axisLine: {
              lineStyle: { color: vars.colors.border }
            },
            axisLabel: {
              color: vars.colors.textSecondary,
              fontFamily: vars.fonts.data,
            },
            splitLine: {
              lineStyle: { color: vars.colors.border, opacity: 0.3 }
            },
          },
          series: [{
            data: seriesData,
            type: 'bar',
            itemStyle: {
              color: vars.colors.chart.primary,
              borderRadius: [4, 4, 0, 0],
            },
            emphasis: {
              itemStyle: {
                color: vars.colors.chart.secondary,
              }
            },
          }],
        };

      case 'pie':
        return {
          ...baseOption,
          title: title ? {
            text: title,
            textStyle: {
              fontFamily: vars.fonts.heading,
              fontSize: 16,
              fontWeight: 600,
              color: vars.colors.text,
            },
            left: 'center',
            top: 20,
          } : undefined,
          series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '60%'],
            data: currentData.map((item, index) => ({
              name: item.name,
              value: item.value,
              itemStyle: {
                color: [
                  vars.colors.chart.primary,
                  vars.colors.chart.secondary,
                  vars.colors.chart.tertiary,
                  vars.colors.chart.quaternary,
                  vars.colors.chart.quinary,
                ][index % 5]
              }
            })),
            label: {
              color: vars.colors.text,
              fontFamily: vars.fonts.body,
            },
            emphasis: {
              scale: 1.1,
              scaleSize: 10,
            },
          }],
        };

      default:
        return baseOption;
    }
  };

  // Sophisticated container animation variants
  const containerVariants = {
    hidden: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.95,
      rotateX: prefersReducedMotion ? 0 : 5,
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotateX: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
        duration: prefersReducedMotion ? 0.2 : 0.8,
      }
    }
  };

  // Loading animation for data transitions
  const loadingVariants = {
    animate: {
      opacity: [0.3, 0.8, 0.3],
      scale: [1, 1.02, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }
    }
  };

  return (
    <motion.div
      ref={chartRef}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      style={{
        ...createGPUOptimizedStyle(),
        transformStyle: 'preserve-3d',
        perspective: 1000,
        position: 'relative',
      }}
    >
      {/* Chart container with morphing capabilities */}
      <div
        style={{
          height: `${height}px`,
          position: 'relative',
          borderRadius: vars.radii.lg,
          overflow: 'hidden',
        }}
      >
        {/* Loading overlay during morphing */}
        {isAnimating && !prefersReducedMotion && (
          <motion.div
            variants={loadingVariants}
            animate="animate"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(45deg, transparent, ${vars.colors.paleGray}20, transparent)`,
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* ECharts with morphing data */}
        <ReactECharts
          option={generateChartOption()}
          style={{ 
            height: '100%', 
            width: '100%',
            transform: 'translateZ(0)', // GPU acceleration
          }}
          opts={{
            renderer: 'canvas', // Better performance than SVG
            devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 2,
          }}
          notMerge={!isAnimating} // Prevent conflicts during morphing
          lazyUpdate={true} // Optimize re-renders
        />
      </div>

      {/* Subtle glow effect during animation */}
      {isAnimating && !prefersReducedMotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.1, 0] }}
          transition={{ duration: 1, repeat: 2 }}
          style={{
            position: 'absolute',
            inset: -2,
            background: `linear-gradient(45deg, ${vars.colors.chart.primary}10, transparent, ${vars.colors.chart.secondary}10)`,
            borderRadius: vars.radii.lg,
            filter: 'blur(4px)',
            zIndex: -1,
            pointerEvents: 'none',
          }}
        />
      )}
    </motion.div>
  );
};

/**
 * Advanced Chart Grid - Multiple morphing charts in harmony
 */

interface MorphingChartGridProps {
  charts: Array<{
    id: string;
    data: ChartDataPoint[];
    previousData?: ChartDataPoint[];
    type: 'line' | 'bar' | 'area' | 'pie';
    title?: string;
  }>;
  columns?: number;
  className?: string;
}

export const MorphingChartGrid: React.FC<MorphingChartGridProps> = ({
  charts,
  columns = 2,
  className = '',
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(gridRef, { once: true, margin: "-50px" });
  
  // Staggered entrance for multiple charts
  const staggeredVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
      }
    }
  };

  return (
    <motion.div
      ref={gridRef}
      className={className}
      variants={staggeredVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: vars.spacing.lg,
      }}
    >
      {charts.map((chart, index) => (
        <motion.div
          key={chart.id}
          variants={itemVariants}
        >
          <MorphingChart
            data={chart.data}
            previousData={chart.previousData}
            chartType={chart.type}
            title={chart.title}
            height={250}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default MorphingChart;
