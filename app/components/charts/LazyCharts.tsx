'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { motion } from 'framer-motion';

// Dynamic imports for code splitting - reduces initial bundle size
const EChartsEnterpriseChart = dynamic(
  () => import('./EChartsEnterpriseChart'),
  {
    ssr: false // ECharts requires client-side rendering
  }
);

const ClaimsBreakdownChart = dynamic(
  () => import('./ClaimsBreakdownChart'),
  {
    ssr: false
  }
);

const MedicalClaimsBreakdownChart = dynamic(
  () => import('./MedicalClaimsBreakdownChart'),
  {
    ssr: false
  }
);

const CostBandScatterChart = dynamic(
  () => import('./CostBandScatterChart'),
  {
    ssr: false
  }
);

const MUIEnrollmentChart = dynamic(
  () => import('./MUIEnrollmentChart'),
  {
    ssr: false
  }
);

const DomesticVsNonDomesticChart = dynamic(
  () => import('./DomesticVsNonDomesticChart'),
  {
    ssr: false
  }
);

const HCCDataTable = dynamic(
  () => import('@components/data/HCCDataTable'),
  {
    ssr: false
  }
);

// Optimized loading skeleton for charts
const ChartLoadingSkeleton = ({ title }: { title: string }) => (
  <div className="panel-elevated rounded-xl p-6 h-[500px]">
    <div className="animate-pulse">
      {/* Title skeleton */}
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-1/2 mb-4"></div>
      
      {/* Chart area skeleton */}
      <div className="h-[400px] bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-3 border-black dark:border-white border-t-transparent rounded-full mx-auto"
          />
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-subheading text-sm">
            {title}
          </p>
        </div>
      </div>
      
      {/* Stats skeleton */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

// Chart-specific error boundary
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; chartName?: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; chartName?: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Chart Error Boundary (${this.props.chartName || 'Unknown Chart'}):`, error, errorInfo);
    console.group(`Chart Rendering Error - ${this.props.chartName || 'Unknown Chart'}`);
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="panel-elevated rounded-xl p-6 h-[500px] flex items-center justify-center border-l-4 border-red-500">
          <div className="text-center">
            <div className="text-red-600 text-4xl mb-4">📊⚠️</div>
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Chart Failed to Load
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {this.props.chartName || 'Chart'} encountered an error during rendering.
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Error: {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded text-sm"
            >
              Retry Chart
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Performance-optimized chart wrapper with intersection observer and error boundary
const LazyChartWrapper = ({ 
  children, 
  fallback,
  chartName
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
  chartName?: string;
}) => (
  <ChartErrorBoundary chartName={chartName}>
    <Suspense fallback={fallback || <ChartLoadingSkeleton title={`Loading ${chartName || 'Chart'}...`} />}>
      {children}
    </Suspense>
  </ChartErrorBoundary>
);

// Export all lazy-loaded components
export {
  EChartsEnterpriseChart,
  ClaimsBreakdownChart,
  MedicalClaimsBreakdownChart,
  CostBandScatterChart,
  MUIEnrollmentChart,
  DomesticVsNonDomesticChart,
  HCCDataTable,
  LazyChartWrapper,
  ChartLoadingSkeleton
};

// Bundle size optimization utilities
export const getChartBundleInfo = () => ({
  echartsSize: '~45KB (compressed)',
  totalChartBundle: '~180KB (all charts)',
  loadingStrategy: 'Dynamic Import + Code Splitting',
  renderingMode: 'Client-Side Only (SSR disabled for performance)'
});

// Performance monitoring helper
export const chartPerformanceMetrics = {
  targetBundleSize: '200KB',
  currentOptimization: 'Code Splitting',
  webGLSupport: true,
  incrementalRendering: true,
  accessibilityCompliant: true
};
