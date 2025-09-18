'use client';

import { useEffect, useState } from 'react';
import { usePerformanceMonitoring } from '@/app/hooks/usePerformanceMonitoring';
import { performanceMonitoringService } from '@/app/services/performanceMonitoringService';

const PerformanceMonitor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [lastReport, setLastReport] = useState<any>(null);
  
  const {
    metrics,
    getPerformanceScore,
    getPerformanceWarnings,
    isPerformanceGood,
    exportMetrics
  } = usePerformanceMonitoring();

  // Subscribe to performance reports
  useEffect(() => {
    const unsubscribe = performanceMonitoringService.subscribe((report) => {
      setLastReport(report);
    });

    return unsubscribe;
  }, []);

  // Generate report periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const report = performanceMonitoringService.generateReport(metrics);
      setLastReport(report);
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [metrics]);

  const getMetricColor = (score: number) => {
    if (score >= 80) return 'text-[var(--accent)]';
    if (score >= 60) return 'text-[#FFC76A]';
    return 'text-[#FF8D8D]';
  };

  const formatMetricValue = (value: number | null, unit: string = 'ms') => {
    if (value === null) return 'N/A';
    if (unit === 'ms') return `${Math.round(value)}ms`;
    if (unit === 'MB') return `${(value / 1024 / 1024).toFixed(1)}MB`;
    if (unit === 's') return `${(value / 1000).toFixed(1)}s`;
    return value.toFixed(3);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[var(--accent)]';
    if (score >= 60) return 'text-[#FFC76A]';
    return 'text-[#FF8D8D]';
  };

  const performanceScore = getPerformanceScore();
  const warnings = getPerformanceWarnings();

  // Only show in development or when explicitly enabled
  if (process.env.NODE_ENV === 'production' && !isVisible) {
    return null;
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-[linear-gradient(135deg,var(--accent),var(--accent-secondary))] text-[var(--button-primary-text)] p-2 rounded-full shadow-[var(--card-elevated-shadow)] hover:shadow-[var(--card-hover-shadow)] transition-all duration-200"
        aria-label="Toggle Performance Monitor"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
        </svg>
      </button>

      {/* Performance panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-40 bg-[var(--surface-elevated)] border border-[var(--surface-border)] rounded-xl shadow-[var(--card-base-shadow)] p-4 max-w-sm w-80 text-[var(--foreground)]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-[var(--foreground)] text-sm">
              Performance Monitor
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono ${getScoreColor(performanceScore.overall)}`}>
                {performanceScore.overall.toFixed(1)}/100
              </span>
              <button
                onClick={() => setIsVisible(false)}
                className="text-[var(--foreground-muted)] hover:text-[var(--accent)]"
              >
                ×
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {/* Performance Score Breakdown */}
            <div className="font-semibold text-[var(--foreground-muted)] border-b border-[var(--surface-border)] pb-1">
              Performance Scores
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[var(--foreground-subtle)]">Load Time:</span>
                <span className={`font-mono ${getScoreColor(performanceScore.breakdown.loadTime)}`}>
                  {performanceScore.breakdown.loadTime.toFixed(0)}/100
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--foreground-subtle)]">Memory:</span>
                <span className={`font-mono ${getScoreColor(performanceScore.breakdown.memory)}`}>
                  {performanceScore.breakdown.memory.toFixed(0)}/100
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--foreground-subtle)]">Data Processing:</span>
                <span className={`font-mono ${getScoreColor(performanceScore.breakdown.dataProcessing)}`}>
                  {performanceScore.breakdown.dataProcessing.toFixed(0)}/100
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--foreground-subtle)]">Web Vitals:</span>
                <span className={`font-mono ${getScoreColor(performanceScore.breakdown.webVitals)}`}>
                  {performanceScore.breakdown.webVitals.toFixed(0)}/100
                </span>
              </div>
            </div>

            {/* Current Metrics */}
            <div className="font-semibold text-[var(--foreground-muted)] border-b border-[var(--surface-border)] pb-1 pt-2">
              Current Metrics
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[var(--foreground-subtle)]">Load Time:</span>
                <span className={`font-mono ${getMetricColor(metrics.loadTime < 3000 ? 90 : 30)}`}>
                  {formatMetricValue(metrics.loadTime, 's')}
                </span>
              </div>
              
              {metrics.memory.usedJSHeapSize && (
                <div className="flex justify-between items-center">
                  <span className="text-[var(--foreground-subtle)]">Memory Usage:</span>
                  <span className={`font-mono ${getMetricColor(metrics.memory.usedJSHeapSize < 100 * 1024 * 1024 ? 90 : 30)}`}>
                    {formatMetricValue(metrics.memory.usedJSHeapSize, 'MB')}
                  </span>
                </div>
              )}
              
              {metrics.webVitals.LCP && (
                <div className="flex justify-between items-center">
                  <span className="text-[var(--foreground-subtle)]">LCP:</span>
                  <span className={`font-mono ${getMetricColor(metrics.webVitals.LCP < 2500 ? 90 : 30)}`}>
                    {formatMetricValue(metrics.webVitals.LCP)}
                  </span>
                </div>
              )}
              
              {metrics.webVitals.CLS && (
                <div className="flex justify-between items-center">
                  <span className="text-[var(--foreground-subtle)]">CLS:</span>
                  <span className={`font-mono ${getMetricColor(metrics.webVitals.CLS < 0.1 ? 90 : 30)}`}>
                    {metrics.webVitals.CLS.toFixed(3)}
                  </span>
                </div>
              )}
              
              {metrics.dataProcessing.csvProcessingTime && (
                <div className="flex justify-between items-center">
                  <span className="text-[var(--foreground-subtle)]">CSV Processing:</span>
                  <span className={`font-mono ${getMetricColor(metrics.dataProcessing.csvProcessingTime < 1000 ? 90 : 30)}`}>
                    {formatMetricValue(metrics.dataProcessing.csvProcessingTime)}
                  </span>
                </div>
              )}
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <>
                <div className="font-semibold text-[#FF8D8D] border-b border-[var(--surface-border)] pb-1 pt-2">
                  Performance Warnings
                </div>
                <div className="space-y-1">
                  {warnings.slice(0, 3).map((warning, index) => (
                    <div key={index} className="text-[#FF8D8D] text-[10px]">
                      ⚠ {warning.replace(/^(Warning|Critical): /, '')}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Optimizations Status */}
            <div className="font-semibold text-[var(--foreground-muted)] border-b border-[var(--surface-border)] pb-1 pt-2">
              Optimizations Applied
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[var(--foreground-subtle)]">Animation Libraries:</span>
                <span className="text-[var(--accent)] text-xs">✓ Removed</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--foreground-subtle)]">Code Splitting:</span>
                <span className="text-[var(--accent)] text-xs">✓ Planned</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--foreground-subtle)]">Virtualization:</span>
                <span className="text-[#FFC76A] text-xs">○ Pending</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--foreground-subtle)]">Component Split:</span>
                <span className="text-[#FFC76A] text-xs">○ Pending</span>
              </div>
            </div>

            {/* Refactoring Targets */}
            <div className="font-semibold text-[var(--foreground-muted)] border-b border-[var(--surface-border)] pb-1 pt-2">
              Refactoring Targets
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[var(--foreground-subtle)]">Load Time:</span>
                <span className="text-[var(--info)] text-xs">&lt;3s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--foreground-subtle)]">Memory:</span>
                <span className="text-[var(--info)] text-xs">&lt;100MB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--foreground-subtle)]">Data Processing:</span>
                <span className="text-[var(--info)] text-xs">&lt;1s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--foreground-subtle)]">PDF Generation:</span>
                <span className="text-[var(--info)] text-xs">&lt;5s</span>
              </div>
            </div>

            {/* Status */}
            <div className="pt-2">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${isPerformanceGood ? 'bg-[var(--accent)]' : 'bg-[#FF8D8D]'}`}></div>
                <span className="text-[10px] text-[var(--foreground-subtle)]">
                  {isPerformanceGood ? 'Performance targets met' : 'Performance needs optimization'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PerformanceMonitor;