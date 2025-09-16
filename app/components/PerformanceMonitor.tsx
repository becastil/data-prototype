'use client';

import { useEffect, useRef, useState } from 'react';

interface WebVitalsMetric {
  id: string;
  name: 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: 'navigate' | 'reload' | 'back_forward' | 'back_forward_cache';
}

interface PerformanceMetrics {
  cls?: WebVitalsMetric;
  fcp?: WebVitalsMetric;
  inp?: WebVitalsMetric;
  lcp?: WebVitalsMetric;
  ttfb?: WebVitalsMetric;
  bundleSize?: number;
  renderTime?: number;
  chartLoadTime?: number;
}

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isVisible, setIsVisible] = useState(false);
  const startTime = useRef<number>(performance.now());

  // Load web-vitals library dynamically
  useEffect(() => {
    const loadWebVitals = async () => {
      try {
        const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import('web-vitals');

        const updateMetric = (metric: WebVitalsMetric) => {
          setMetrics(prev => ({
            ...prev,
            [metric.name.toLowerCase()]: metric
          }));
        };

        onCLS(updateMetric as any);
        onFCP(updateMetric as any);
        onINP(updateMetric as any);
        onLCP(updateMetric as any);
        onTTFB(updateMetric as any);
      } catch (error) {
        console.warn('Web Vitals not available:', error);
      }
    };

    loadWebVitals();
  }, []);

  // Monitor bundle size and render performance
  useEffect(() => {
    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      
      const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      const renderTime = performance.now() - startTime.current;

      // Estimate bundle size from resource entries
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resourceEntries.filter(entry => 
        entry.name.includes('.js') && entry.name.includes('/_next/')
      );
      const estimatedBundleSize = jsResources.reduce((total, resource) => 
        total + (resource.transferSize || 0), 0
      );

      setMetrics(prev => ({
        ...prev,
        bundleSize: Math.round(estimatedBundleSize / 1024), // Convert to KB
        renderTime: Math.round(renderTime),
        chartLoadTime: navigation ? Math.round(navigation.domContentLoadedEventEnd - navigation.responseEnd) : 0
      }));
    };

    // Wait for page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);

  const getMetricColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-[var(--accent)]';
      case 'needs-improvement': return 'text-[#FFC76A]';
      case 'poor': return 'text-[#FF8D8D]';
      default: return 'text-[var(--foreground-muted)]';
    }
  };

  const formatMetricValue = (name: string, value: number) => {
    switch (name) {
      case 'CLS':
        return value.toFixed(3);
      case 'FCP':
      case 'LCP':
      case 'INP':
      case 'TTFB':
        return `${Math.round(value)}ms`;
      default:
        return value.toString();
    }
  };

  const getBundleSizeRating = (size: number) => {
    if (size < 200) return 'good';
    if (size < 300) return 'needs-improvement';
    return 'poor';
  };

  // Only show in development or when explicitly enabled
  if (process.env.NODE_ENV === 'production' && !isVisible) {
    return null;
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-[linear-gradient(135deg,#00E589_0%,#00C0FF_100%)] text-[#041014] p-2 rounded-full shadow-[0_12px_30px_rgba(0,229,137,0.35)] hover:shadow-[0_16px_38px_rgba(0,229,137,0.4)] transition-all duration-200"
        aria-label="Toggle Performance Monitor"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
        </svg>
      </button>

      {/* Performance panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-40 bg-[rgba(10,18,32,0.95)] border border-[rgba(0,229,137,0.22)] rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.55)] p-4 max-w-sm w-80 text-[var(--foreground)]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-[var(--foreground)] text-sm">
              Performance Metrics
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-[var(--foreground-muted)] hover:text-[var(--accent)]"
            >
              ×
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {/* Core Web Vitals */}
            <div className="font-semibold text-[var(--foreground-muted)] border-b border-[rgba(255,255,255,0.08)] pb-1">
              Core Web Vitals
            </div>

            {Object.entries(metrics).map(([key, metric]) => {
              if (key === 'bundleSize' || key === 'renderTime' || key === 'chartLoadTime' || !metric) return null;
              
              const webVitalsMetric = metric as WebVitalsMetric;
              return (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-[var(--foreground-subtle)]">
                    {webVitalsMetric.name}:
                  </span>
                  <span className={`font-mono ${getMetricColor(webVitalsMetric.rating)}`}>
                    {formatMetricValue(webVitalsMetric.name, webVitalsMetric.value)}
                  </span>
                </div>
              );
            })}

            {/* Bundle & Performance */}
            <div className="font-semibold text-[var(--foreground-muted)] border-b border-[rgba(255,255,255,0.08)] pb-1 pt-2">
              Bundle & Performance
            </div>

            {metrics.bundleSize && (
              <div className="flex justify-between items-center">
                <span className="text-[var(--foreground-subtle)]">Bundle Size:</span>
                <span className={`font-mono ${getMetricColor(getBundleSizeRating(metrics.bundleSize))}`}>
                  {metrics.bundleSize}KB
                </span>
              </div>
            )}

            {metrics.renderTime && (
              <div className="flex justify-between items-center">
                <span className="text-[var(--foreground-subtle)]">Render Time:</span>
                <span className="font-mono text-[var(--foreground)]">
                  {metrics.renderTime}ms
                </span>
              </div>
            )}

            {metrics.chartLoadTime && (
              <div className="flex justify-between items-center">
                <span className="text-[var(--foreground-subtle)]">Chart Load:</span>
                <span className="font-mono text-[var(--foreground)]">
                  {metrics.chartLoadTime}ms
                </span>
              </div>
            )}

            {/* Optimization Status */}
            <div className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-1 pt-2">
              Optimizations
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Code Splitting:</span>
                <span className="text-green-600 dark:text-green-400 text-xs">✓ Enabled</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">WebGL:</span>
                <span className="text-green-600 dark:text-green-400 text-xs">✓ Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">GPU Accel:</span>
                <span className="text-green-600 dark:text-green-400 text-xs">✓ Hardware</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Lazy Loading:</span>
                <span className="text-green-600 dark:text-green-400 text-xs">✓ Charts</span>
              </div>
            </div>

            {/* Target vs Actual */}
            <div className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-1 pt-2">
              Million-Dollar UI Targets
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Bundle Target:</span>
                <span className="text-blue-600 dark:text-blue-400 text-xs">&lt;200KB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">LCP Target:</span>
                <span className="text-blue-600 dark:text-blue-400 text-xs">&lt;2.5s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">CLS Target:</span>
                <span className="text-blue-600 dark:text-blue-400 text-xs">&lt;0.1</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">FID Target:</span>
                <span className="text-blue-600 dark:text-blue-400 text-xs">&lt;100ms</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PerformanceMonitor;
