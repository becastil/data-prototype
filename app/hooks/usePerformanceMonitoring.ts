'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { PerformanceMetrics } from '@components/shared/interfaces';

/**
 * Performance monitoring hook for Healthcare Analytics Dashboard
 * 
 * Tracks key performance metrics aligned with refactoring strategy goals:
 * - Initial load time: <3 seconds
 * - Memory usage: <100MB per session  
 * - Data processing: <1 second for 12-month periods
 * - PDF generation: <5 seconds
 */

interface PerformanceConfig {
  enableMemoryTracking?: boolean;
  enableWebVitals?: boolean;
  enableDataProcessingMetrics?: boolean;
  sampleRate?: number; // 0-1, percentage of sessions to track
}

interface WebVitalsMetrics {
  CLS: number | null;  // Cumulative Layout Shift
  FID: number | null;  // First Input Delay  
  FCP: number | null;  // First Contentful Paint
  LCP: number | null;  // Largest Contentful Paint
  TTFB: number | null; // Time to First Byte
}

interface DataProcessingMetrics {
  csvProcessingTime: number | null;
  effectiveBudgetComputeTime: number | null;
  chartRenderTime: number | null;
  pdfGenerationTime: number | null;
}

interface MemoryMetrics {
  usedJSHeapSize: number | null;
  totalJSHeapSize: number | null;
  jsHeapSizeLimit: number | null;
}

export interface PerformanceData {
  loadTime: number;
  webVitals: WebVitalsMetrics;
  dataProcessing: DataProcessingMetrics;
  memory: MemoryMetrics;
  componentCounts: {
    rendered: number;
    memoized: number;
    suspended: number;
  };
  bundleSize?: number;
}

const defaultConfig: PerformanceConfig = {
  enableMemoryTracking: true,
  enableWebVitals: true,
  enableDataProcessingMetrics: true,
  sampleRate: 1.0, // Track 100% in development, reduce in production
};

export function usePerformanceMonitoring(config: PerformanceConfig = defaultConfig) {
  const [metrics, setMetrics] = useState<PerformanceData>({
    loadTime: 0,
    webVitals: {
      CLS: null,
      FID: null,
      FCP: null,
      LCP: null,
      TTFB: null,
    },
    dataProcessing: {
      csvProcessingTime: null,
      effectiveBudgetComputeTime: null,
      chartRenderTime: null,
      pdfGenerationTime: null,
    },
    memory: {
      usedJSHeapSize: null,
      totalJSHeapSize: null,
      jsHeapSizeLimit: null,
    },
    componentCounts: {
      rendered: 0,
      memoized: 0,
      suspended: 0,
    },
  });

  const startTimeRef = useRef<number>(performance.now());
  const processingTimersRef = useRef<Map<string, number>>(new Map());
  const componentCountsRef = useRef(metrics.componentCounts);

  // Track page load time
  useEffect(() => {
    const loadTime = performance.now() - startTimeRef.current;
    setMetrics(prev => ({ ...prev, loadTime }));
  }, []);

  // Memory monitoring
  useEffect(() => {
    if (!config.enableMemoryTracking) return;

    const updateMemoryMetrics = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memory: {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
          },
        }));
      }
    };

    // Update memory metrics every 5 seconds
    const interval = setInterval(updateMemoryMetrics, 5000);
    updateMemoryMetrics(); // Initial measurement

    return () => clearInterval(interval);
  }, [config.enableMemoryTracking]);

  // Web Vitals monitoring
  useEffect(() => {
    if (!config.enableWebVitals) return;

    const observeWebVitals = async () => {
      try {
        const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');

        getCLS((metric) => {
          setMetrics(prev => ({
            ...prev,
            webVitals: { ...prev.webVitals, CLS: metric.value },
          }));
        });

        getFID((metric) => {
          setMetrics(prev => ({
            ...prev,
            webVitals: { ...prev.webVitals, FID: metric.value },
          }));
        });

        getFCP((metric) => {
          setMetrics(prev => ({
            ...prev,
            webVitals: { ...prev.webVitals, FCP: metric.value },
          }));
        });

        getLCP((metric) => {
          setMetrics(prev => ({
            ...prev,
            webVitals: { ...prev.webVitals, LCP: metric.value },
          }));
        });

        getTTFB((metric) => {
          setMetrics(prev => ({
            ...prev,
            webVitals: { ...prev.webVitals, TTFB: metric.value },
          }));
        });
      } catch (error) {
        console.warn('[Performance] Web Vitals unavailable:', error);
      }
    };

    observeWebVitals();
  }, [config.enableWebVitals]);

  // Data processing time tracking
  const startDataProcessing = useCallback((operation: string) => {
    if (!config.enableDataProcessingMetrics) return;
    processingTimersRef.current.set(operation, performance.now());
  }, [config.enableDataProcessingMetrics]);

  const endDataProcessing = useCallback((operation: string) => {
    if (!config.enableDataProcessingMetrics) return;
    
    const startTime = processingTimersRef.current.get(operation);
    if (startTime) {
      const duration = performance.now() - startTime;
      processingTimersRef.current.delete(operation);
      
      setMetrics(prev => ({
        ...prev,
        dataProcessing: {
          ...prev.dataProcessing,
          [operation]: duration,
        },
      }));
    }
  }, [config.enableDataProcessingMetrics]);

  // Component render tracking
  const trackComponentRender = useCallback((type: 'rendered' | 'memoized' | 'suspended') => {
    componentCountsRef.current[type]++;
    setMetrics(prev => ({
      ...prev,
      componentCounts: { ...componentCountsRef.current },
    }));
  }, []);

  // Performance assessment based on strategy targets
  const getPerformanceScore = useCallback(() => {
    const scores = {
      loadTime: metrics.loadTime < 3000 ? 100 : Math.max(0, 100 - (metrics.loadTime - 3000) / 50),
      memory: metrics.memory.usedJSHeapSize ? 
        (metrics.memory.usedJSHeapSize < 100 * 1024 * 1024 ? 100 : 
         Math.max(0, 100 - (metrics.memory.usedJSHeapSize - 100 * 1024 * 1024) / (1024 * 1024))) : 100,
      dataProcessing: metrics.dataProcessing.csvProcessingTime ? 
        (metrics.dataProcessing.csvProcessingTime < 1000 ? 100 :
         Math.max(0, 100 - (metrics.dataProcessing.csvProcessingTime - 1000) / 20)) : 100,
      webVitals: calculateWebVitalsScore(),
    };

    return {
      overall: (scores.loadTime + scores.memory + scores.dataProcessing + scores.webVitals) / 4,
      breakdown: scores,
    };
  }, [metrics]);

  const calculateWebVitalsScore = () => {
    const { webVitals } = metrics;
    let score = 0;
    let count = 0;

    // LCP score (Good: <2.5s, Needs Improvement: <4s, Poor: >=4s)
    if (webVitals.LCP !== null) {
      if (webVitals.LCP < 2500) score += 100;
      else if (webVitals.LCP < 4000) score += 75;
      else score += 25;
      count++;
    }

    // FID score (Good: <100ms, Needs Improvement: <300ms, Poor: >=300ms)
    if (webVitals.FID !== null) {
      if (webVitals.FID < 100) score += 100;
      else if (webVitals.FID < 300) score += 75;
      else score += 25;
      count++;
    }

    // CLS score (Good: <0.1, Needs Improvement: <0.25, Poor: >=0.25)
    if (webVitals.CLS !== null) {
      if (webVitals.CLS < 0.1) score += 100;
      else if (webVitals.CLS < 0.25) score += 75;
      else score += 25;
      count++;
    }

    return count > 0 ? score / count : 100;
  };

  // Export performance data for analytics
  const exportMetrics = useCallback(() => {
    const score = getPerformanceScore();
    return {
      timestamp: new Date().toISOString(),
      metrics,
      score,
      targets: {
        loadTime: { target: 3000, actual: metrics.loadTime, passed: metrics.loadTime < 3000 },
        memory: { 
          target: 100 * 1024 * 1024, 
          actual: metrics.memory.usedJSHeapSize, 
          passed: (metrics.memory.usedJSHeapSize || 0) < 100 * 1024 * 1024 
        },
        dataProcessing: {
          target: 1000,
          actual: metrics.dataProcessing.csvProcessingTime,
          passed: (metrics.dataProcessing.csvProcessingTime || 0) < 1000,
        },
      },
    };
  }, [metrics, getPerformanceScore]);

  // Warning system for performance issues
  const getPerformanceWarnings = useCallback(() => {
    const warnings: string[] = [];

    if (metrics.loadTime > 3000) {
      warnings.push(`Load time ${(metrics.loadTime / 1000).toFixed(1)}s exceeds 3s target`);
    }

    if (metrics.memory.usedJSHeapSize && metrics.memory.usedJSHeapSize > 100 * 1024 * 1024) {
      warnings.push(`Memory usage ${(metrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB exceeds 100MB target`);
    }

    if (metrics.dataProcessing.csvProcessingTime && metrics.dataProcessing.csvProcessingTime > 1000) {
      warnings.push(`CSV processing ${metrics.dataProcessing.csvProcessingTime.toFixed(0)}ms exceeds 1s target`);
    }

    if (metrics.webVitals.LCP && metrics.webVitals.LCP > 4000) {
      warnings.push(`Largest Contentful Paint ${metrics.webVitals.LCP.toFixed(0)}ms is poor (>4s)`);
    }

    return warnings;
  }, [metrics]);

  return {
    metrics,
    startDataProcessing,
    endDataProcessing,
    trackComponentRender,
    getPerformanceScore,
    exportMetrics,
    getPerformanceWarnings,
    isPerformanceGood: getPerformanceScore().overall > 80,
  };
}

/**
 * Higher-order component for automatic performance tracking
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: P) {
    const { trackComponentRender } = usePerformanceMonitoring();
    
    useEffect(() => {
      trackComponentRender('rendered');
    }, [trackComponentRender]);

    return <Component {...props} />;
  };
}

/**
 * React DevTools Profiler integration for production builds
 */
export function useProfiler(id: string, onRender?: (id: string, phase: 'mount' | 'update', actualDuration: number) => void) {
  const onRenderCallback = useCallback((
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Profiler] ${id} ${phase}:`, {
        actualDuration: `${actualDuration.toFixed(2)}ms`,
        baseDuration: `${baseDuration.toFixed(2)}ms`,
        startTime: `${startTime.toFixed(2)}ms`,
        commitTime: `${commitTime.toFixed(2)}ms`,
      });
    }
    
    onRender?.(id, phase, actualDuration);
  }, [onRender]);

  return { onRenderCallback };
}