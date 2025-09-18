'use client';

import { PerformanceData } from '@/app/hooks/usePerformanceMonitoring';

/**
 * Performance Monitoring Service for Healthcare Analytics Dashboard
 * 
 * Centralized service for collecting, analyzing, and reporting performance metrics
 * aligned with the refactoring strategy goals.
 */

interface PerformanceReport {
  sessionId: string;
  timestamp: string;
  metrics: PerformanceData;
  score: {
    overall: number;
    breakdown: {
      loadTime: number;
      memory: number;
      dataProcessing: number;
      webVitals: number;
    };
  };
  targets: {
    loadTime: { target: number; actual: number; passed: boolean };
    memory: { target: number; actual: number | null; passed: boolean };
    dataProcessing: { target: number; actual: number | null; passed: boolean };
  };
  warnings: string[];
  recommendations: string[];
}

interface PerformanceThresholds {
  loadTime: {
    good: number;    // <3s (refactoring target)
    poor: number;    // >8s (current baseline)
  };
  memory: {
    good: number;    // <100MB (refactoring target)
    poor: number;    // >200MB (performance concern)
  };
  dataProcessing: {
    good: number;    // <1s (refactoring target)
    poor: number;    // >5s (current issues)
  };
  webVitals: {
    lcp: { good: number; poor: number };  // Largest Contentful Paint
    fid: { good: number; poor: number };  // First Input Delay
    cls: { good: number; poor: number };  // Cumulative Layout Shift
  };
}

const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  loadTime: {
    good: 3000,    // 3 seconds - refactoring target
    poor: 8000,    // 8 seconds - current baseline
  },
  memory: {
    good: 100 * 1024 * 1024,  // 100MB - refactoring target
    poor: 200 * 1024 * 1024,  // 200MB - critical threshold
  },
  dataProcessing: {
    good: 1000,    // 1 second - refactoring target
    poor: 5000,    // 5 seconds - unacceptable delay
  },
  webVitals: {
    lcp: { good: 2500, poor: 4000 },  // Largest Contentful Paint (ms)
    fid: { good: 100, poor: 300 },    // First Input Delay (ms)
    cls: { good: 0.1, poor: 0.25 },   // Cumulative Layout Shift (score)
  },
};

class PerformanceMonitoringService {
  private sessionId: string;
  private reports: PerformanceReport[] = [];
  private subscribers: Array<(report: PerformanceReport) => void> = [];

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(metrics: PerformanceData): PerformanceReport {
    const score = this.calculatePerformanceScore(metrics);
    const warnings = this.generateWarnings(metrics);
    const recommendations = this.generateRecommendations(metrics);

    const report: PerformanceReport = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      metrics,
      score,
      targets: {
        loadTime: {
          target: PERFORMANCE_THRESHOLDS.loadTime.good,
          actual: metrics.loadTime,
          passed: metrics.loadTime < PERFORMANCE_THRESHOLDS.loadTime.good,
        },
        memory: {
          target: PERFORMANCE_THRESHOLDS.memory.good,
          actual: metrics.memory.usedJSHeapSize,
          passed: (metrics.memory.usedJSHeapSize || 0) < PERFORMANCE_THRESHOLDS.memory.good,
        },
        dataProcessing: {
          target: PERFORMANCE_THRESHOLDS.dataProcessing.good,
          actual: metrics.dataProcessing.csvProcessingTime,
          passed: (metrics.dataProcessing.csvProcessingTime || 0) < PERFORMANCE_THRESHOLDS.dataProcessing.good,
        },
      },
      warnings,
      recommendations,
    };

    this.reports.push(report);
    this.notifySubscribers(report);

    return report;
  }

  /**
   * Calculate overall performance score (0-100)
   */
  private calculatePerformanceScore(metrics: PerformanceData) {
    const scores = {
      loadTime: this.scoreMetric(
        metrics.loadTime,
        PERFORMANCE_THRESHOLDS.loadTime.good,
        PERFORMANCE_THRESHOLDS.loadTime.poor
      ),
      memory: this.scoreMetric(
        metrics.memory.usedJSHeapSize || 0,
        PERFORMANCE_THRESHOLDS.memory.good,
        PERFORMANCE_THRESHOLDS.memory.poor
      ),
      dataProcessing: this.scoreMetric(
        metrics.dataProcessing.csvProcessingTime || 0,
        PERFORMANCE_THRESHOLDS.dataProcessing.good,
        PERFORMANCE_THRESHOLDS.dataProcessing.poor
      ),
      webVitals: this.calculateWebVitalsScore(metrics.webVitals),
    };

    const overall = (scores.loadTime + scores.memory + scores.dataProcessing + scores.webVitals) / 4;

    return { overall, breakdown: scores };
  }

  /**
   * Score individual metric (100 = excellent, 0 = poor)
   */
  private scoreMetric(actual: number, goodThreshold: number, poorThreshold: number): number {
    if (actual <= goodThreshold) return 100;
    if (actual >= poorThreshold) return 0;
    
    // Linear interpolation between good and poor
    const range = poorThreshold - goodThreshold;
    const distance = actual - goodThreshold;
    return Math.max(0, 100 - (distance / range) * 100);
  }

  /**
   * Calculate Web Vitals score
   */
  private calculateWebVitalsScore(webVitals: PerformanceData['webVitals']): number {
    let totalScore = 0;
    let metricCount = 0;

    // Largest Contentful Paint
    if (webVitals.LCP !== null) {
      totalScore += this.scoreMetric(
        webVitals.LCP,
        PERFORMANCE_THRESHOLDS.webVitals.lcp.good,
        PERFORMANCE_THRESHOLDS.webVitals.lcp.poor
      );
      metricCount++;
    }

    // First Input Delay
    if (webVitals.FID !== null) {
      totalScore += this.scoreMetric(
        webVitals.FID,
        PERFORMANCE_THRESHOLDS.webVitals.fid.good,
        PERFORMANCE_THRESHOLDS.webVitals.fid.poor
      );
      metricCount++;
    }

    // Cumulative Layout Shift (inverted - lower is better)
    if (webVitals.CLS !== null) {
      if (webVitals.CLS <= PERFORMANCE_THRESHOLDS.webVitals.cls.good) {
        totalScore += 100;
      } else if (webVitals.CLS >= PERFORMANCE_THRESHOLDS.webVitals.cls.poor) {
        totalScore += 0;
      } else {
        const range = PERFORMANCE_THRESHOLDS.webVitals.cls.poor - PERFORMANCE_THRESHOLDS.webVitals.cls.good;
        const distance = webVitals.CLS - PERFORMANCE_THRESHOLDS.webVitals.cls.good;
        totalScore += Math.max(0, 100 - (distance / range) * 100);
      }
      metricCount++;
    }

    return metricCount > 0 ? totalScore / metricCount : 100;
  }

  /**
   * Generate performance warnings
   */
  private generateWarnings(metrics: PerformanceData): string[] {
    const warnings: string[] = [];

    // Load time warnings
    if (metrics.loadTime > PERFORMANCE_THRESHOLDS.loadTime.poor) {
      warnings.push(`Critical: Load time ${(metrics.loadTime / 1000).toFixed(1)}s is severely degraded`);
    } else if (metrics.loadTime > PERFORMANCE_THRESHOLDS.loadTime.good) {
      warnings.push(`Warning: Load time ${(metrics.loadTime / 1000).toFixed(1)}s exceeds target of ${PERFORMANCE_THRESHOLDS.loadTime.good / 1000}s`);
    }

    // Memory warnings
    if (metrics.memory.usedJSHeapSize) {
      if (metrics.memory.usedJSHeapSize > PERFORMANCE_THRESHOLDS.memory.poor) {
        warnings.push(`Critical: Memory usage ${(metrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB is critically high`);
      } else if (metrics.memory.usedJSHeapSize > PERFORMANCE_THRESHOLDS.memory.good) {
        warnings.push(`Warning: Memory usage ${(metrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB exceeds target of ${PERFORMANCE_THRESHOLDS.memory.good / 1024 / 1024}MB`);
      }
    }

    // Data processing warnings
    if (metrics.dataProcessing.csvProcessingTime) {
      if (metrics.dataProcessing.csvProcessingTime > PERFORMANCE_THRESHOLDS.dataProcessing.poor) {
        warnings.push(`Critical: CSV processing ${metrics.dataProcessing.csvProcessingTime.toFixed(0)}ms is unacceptably slow`);
      } else if (metrics.dataProcessing.csvProcessingTime > PERFORMANCE_THRESHOLDS.dataProcessing.good) {
        warnings.push(`Warning: CSV processing ${metrics.dataProcessing.csvProcessingTime.toFixed(0)}ms exceeds target of ${PERFORMANCE_THRESHOLDS.dataProcessing.good}ms`);
      }
    }

    // Web Vitals warnings
    if (metrics.webVitals.LCP && metrics.webVitals.LCP > PERFORMANCE_THRESHOLDS.webVitals.lcp.poor) {
      warnings.push(`Warning: Largest Contentful Paint ${metrics.webVitals.LCP.toFixed(0)}ms needs improvement`);
    }

    if (metrics.webVitals.FID && metrics.webVitals.FID > PERFORMANCE_THRESHOLDS.webVitals.fid.poor) {
      warnings.push(`Warning: First Input Delay ${metrics.webVitals.FID.toFixed(0)}ms affects interactivity`);
    }

    if (metrics.webVitals.CLS && metrics.webVitals.CLS > PERFORMANCE_THRESHOLDS.webVitals.cls.poor) {
      warnings.push(`Warning: Cumulative Layout Shift ${metrics.webVitals.CLS.toFixed(3)} causes visual instability`);
    }

    return warnings;
  }

  /**
   * Generate performance improvement recommendations
   */
  private generateRecommendations(metrics: PerformanceData): string[] {
    const recommendations: string[] = [];

    // Load time recommendations
    if (metrics.loadTime > PERFORMANCE_THRESHOLDS.loadTime.good) {
      recommendations.push('Implement component lazy loading to reduce initial bundle size');
      recommendations.push('Remove unused animation libraries (Theatre.js, GSAP already removed)');
      recommendations.push('Enable code splitting for non-critical routes');
    }

    // Memory recommendations  
    if (metrics.memory.usedJSHeapSize && metrics.memory.usedJSHeapSize > PERFORMANCE_THRESHOLDS.memory.good) {
      recommendations.push('Implement React virtualization for large data tables');
      recommendations.push('Add data pagination for datasets >1000 rows');
      recommendations.push('Clear unused state and memoization caches');
    }

    // Data processing recommendations
    if (metrics.dataProcessing.csvProcessingTime && metrics.dataProcessing.csvProcessingTime > PERFORMANCE_THRESHOLDS.dataProcessing.good) {
      recommendations.push('Move heavy calculations to Web Workers');
      recommendations.push('Implement streaming CSV processing');
      recommendations.push('Cache computed effectiveBudget results');
    }

    // Web Vitals recommendations
    if (metrics.webVitals.LCP && metrics.webVitals.LCP > PERFORMANCE_THRESHOLDS.webVitals.lcp.good) {
      recommendations.push('Optimize critical rendering path');
      recommendations.push('Preload essential fonts and resources');
    }

    if (metrics.webVitals.CLS && metrics.webVitals.CLS > PERFORMANCE_THRESHOLDS.webVitals.cls.good) {
      recommendations.push('Reserve space for dynamic content');
      recommendations.push('Use CSS aspect-ratio for images and charts');
    }

    // Component-specific recommendations
    if (metrics.componentCounts.rendered > 50) {
      recommendations.push('Consider component virtualization for large lists');
    }

    return recommendations;
  }

  /**
   * Subscribe to performance reports
   */
  subscribe(callback: (report: PerformanceReport) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  /**
   * Notify all subscribers of new report
   */
  private notifySubscribers(report: PerformanceReport) {
    this.subscribers.forEach(callback => {
      try {
        callback(report);
      } catch (error) {
        console.error('[PerformanceMonitoring] Subscriber error:', error);
      }
    });
  }

  /**
   * Get performance trend analysis
   */
  getPerformanceTrend(): {
    improving: boolean;
    degrading: boolean;
    stable: boolean;
    analysis: string;
  } {
    if (this.reports.length < 2) {
      return { improving: false, degrading: false, stable: true, analysis: 'Insufficient data for trend analysis' };
    }

    const recent = this.reports.slice(-5); // Last 5 reports
    const scores = recent.map(r => r.score.overall);
    
    const firstScore = scores[0];
    const lastScore = scores[scores.length - 1];
    const trend = lastScore - firstScore;

    if (trend > 5) {
      return { improving: true, degrading: false, stable: false, analysis: `Performance improving by ${trend.toFixed(1)} points` };
    } else if (trend < -5) {
      return { improving: false, degrading: true, stable: false, analysis: `Performance degrading by ${Math.abs(trend).toFixed(1)} points` };
    } else {
      return { improving: false, degrading: false, stable: true, analysis: 'Performance is stable' };
    }
  }

  /**
   * Export performance data for analytics
   */
  exportData() {
    return {
      sessionId: this.sessionId,
      reports: this.reports,
      summary: this.reports.length > 0 ? {
        latestScore: this.reports[this.reports.length - 1].score.overall,
        averageScore: this.reports.reduce((sum, r) => sum + r.score.overall, 0) / this.reports.length,
        totalWarnings: this.reports.reduce((sum, r) => sum + r.warnings.length, 0),
        trend: this.getPerformanceTrend(),
      } : null,
    };
  }

  /**
   * Reset session data
   */
  reset() {
    this.reports = [];
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const performanceMonitoringService = new PerformanceMonitoringService();

// Console logging for development
if (process.env.NODE_ENV === 'development') {
  performanceMonitoringService.subscribe((report) => {
    console.group(`[Performance Report] Score: ${report.score.overall.toFixed(1)}/100`);
    console.log('Metrics:', report.metrics);
    console.log('Targets:', report.targets);
    if (report.warnings.length > 0) {
      console.warn('Warnings:', report.warnings);
    }
    if (report.recommendations.length > 0) {
      console.info('Recommendations:', report.recommendations);
    }
    console.groupEnd();
  });
}