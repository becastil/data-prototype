'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RotateCcw, Table, BarChart3 } from 'lucide-react';

// UI Components
import { Button } from '@components/ui/button';
import { ThemeToggle } from '@components/ui/theme-toggle';
import { Tabs, TabsList, TabsTrigger } from '@components/ui/tabs';
import DateRangeDropdown from '@components/ui/date-range-dropdown';
import SoftDropdown from '@components/ui/soft-dropdown';
import EnterpriseDataExport from '@components/data/EnterpriseDataExport';
import ProfessionalPDFExporter from '@components/exports/ProfessionalPDFExporter';

// Hooks and utilities
import { useAutoAnimateCards } from '@/app/hooks/useAutoAnimate';

// Types
import { DashboardLayoutProps } from '@components/shared/interfaces';
import { DateRangeSelection } from '@/app/utils/dateRange';

interface DashboardLayoutState {
  debugMode: boolean;
  monthsTimeline: Array<{ value: string; label: string }>;
  budgetData: any;
  claimsData: any;
}

interface LayoutProps extends DashboardLayoutProps {
  // Additional props specific to healthcare dashboard
  debugMode?: boolean;
  monthsTimeline?: Array<{ value: string; label: string }>;
  budgetData?: any;
  claimsData?: any;
  onReset?: () => void;
  onDebugToggle?: () => void;
}

const DashboardLayout: React.FC<LayoutProps> = ({
  children,
  currentPage,
  onPageChange,
  onThemeToggle,
  onExport,
  dateRange,
  onDateRangeChange,
  debugMode = false,
  emergencyMode = false,
  monthsTimeline = [],
  budgetData,
  claimsData,
  onReset,
  onDebugToggle,
}) => {
  const navigationRef = useAutoAnimateCards<HTMLDivElement>();

  // Quick navigation items for soft dropdown (dashboard views)
  const quickNavItems = [
    { id: 'table', label: 'Data Table', description: 'Detailed financial records' },
    { id: 'report', label: 'Performance Report', description: 'Visual analytics and KPIs' },
  ];

  const handleNavigate = (pageId: string) => {
    onPageChange(pageId);
  };

  const handleExportData = () => {
    if (onExport) {
      onExport();
    }
  };

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 text-[var(--foreground)] p-6"
    >
      {/* Emergency Mode Banner */}
      {emergencyMode && (
        <div className="fixed top-0 inset-x-0 z-50 bg-red-600 text-white text-center py-2 text-sm">
          Emergency Mode Active
        </div>
      )}

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto mb-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2 h-8 bg-[var(--accent)] shadow-[0_0_18px_rgba(0,229,137,0.55)]"
              style={{ borderRadius: 'var(--radius-full)' }}
            />
            <motion.h1
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-3xl font-bold text-[var(--foreground)] font-heading tracking-tight"
            >
              Keenan Reporting Dashboard
            </motion.h1>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DateRangeDropdown 
              months={monthsTimeline} 
              value={dateRange} 
              onChange={onDateRangeChange} 
            />
            
            {/* Debug Mode Toggle */}
            {onDebugToggle && (
              <Button
                onClick={onDebugToggle}
                variant={debugMode ? "default" : "soft"}
                size="sm"
                className="shadow-sm"
                title="Toggle debug mode for detailed error information"
              >
                🐛 Debug
              </Button>
            )}

            {/* Quick Navigation Dropdown */}
            <SoftDropdown
              label="Quick Navigate"
              items={quickNavItems}
              selectedId={currentPage}
              onSelect={handleNavigate}
            />

            {/* Demos Link */}
            <Button asChild variant="soft" className="shadow-sm">
              <Link href="/demos">Demos</Link>
            </Button>

            {/* Reset Button */}
            {onReset && (
              <Button
                onClick={onReset}
                className="shadow-lg"
                variant="default"
                size="default"
              >
                <RotateCcw className="w-4 h-4" />
                Upload New Data
              </Button>
            )}
          </div>
        </div>
        
        {/* Navigation and Export Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Page Navigation Tabs */}
          <Tabs 
            value={currentPage === 'dashboard' ? 'table' : currentPage} 
            onValueChange={onPageChange} 
            className="w-fit"
          >
            <TabsList ref={navigationRef}>
              <TabsTrigger value="table" className="flex items-center gap-2">
                <Table className="w-4 h-4" />
                Data Table
              </TabsTrigger>
              <TabsTrigger value="report" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Performance Report
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Export Controls */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <ProfessionalPDFExporter
              budgetData={budgetData?.rows || []}
              claimsData={claimsData?.rows || []}
              dateRange={dateRange}
            />
            <EnterpriseDataExport 
              data={{
                budgetData: budgetData?.rows,
                claimsData: claimsData?.rows,
                metrics: {
                  totalBudgetRecords: budgetData?.rows?.length || 0,
                  totalClaimsRecords: claimsData?.rows?.length || 0,
                  lastUpdated: new Date().toISOString()
                }
              }}
              title="Healthcare Analytics Dashboard Data"
            />
          </div>
        </div>

        {/* Debug Panel */}
        {debugMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-[var(--accent-soft)] border border-[var(--card-hover-border)] rounded-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[var(--accent)] font-semibold">🐛 Debug Mode Active</span>
            </div>
            <div className="text-sm text-[var(--foreground)] space-y-1">
              <p><strong>Budget Data:</strong> {budgetData?.rowCount || 0} rows, {budgetData?.headers?.length || 0} columns</p>
              <p><strong>Claims Data:</strong> {claimsData?.rowCount || 0} rows, {claimsData?.headers?.length || 0} columns</p>
              <p><strong>Date Filter:</strong> {dateRange.preset || 'Custom'}</p>
              <p><strong>Current Page:</strong> {currentPage}</p>
              
              {budgetData?.headers && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-[var(--foreground-muted)]">
                    Budget Headers
                  </summary>
                  <p className="text-xs mt-1 font-mono bg-[var(--surface)] text-[var(--foreground)] border border-[var(--surface-border)] p-2 rounded">
                    {budgetData.headers.join(', ')}
                  </p>
                </details>
              )}
              
              {claimsData?.headers && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-[var(--foreground-muted)]">
                    Claims Headers
                  </summary>
                  <p className="text-xs mt-1 font-mono bg-[var(--surface)] text-[var(--foreground)] border border-[var(--surface-border)] p-2 rounded">
                    {claimsData.headers.join(', ')}
                  </p>
                </details>
              )}
            </div>
          </motion.div>
        )}

        {/* Main Content Area */}
        <div className="p-8">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardLayout;