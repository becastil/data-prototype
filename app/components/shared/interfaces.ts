/**
 * Shared TypeScript Interfaces for Healthcare Analytics Dashboard
 * 
 * These interfaces define the contract between components after refactoring
 * the monolithic page.tsx into focused, reusable modules.
 */

import { ParsedCSVData } from '@components/loaders/CSVLoader';
import { FeesConfig } from '@components/forms/FeesConfigurator';
import { DateRangeSelection } from '@/app/utils/dateRange';

// ============================================================================
// CORE DATA INTERFACES
// ============================================================================

/**
 * Processed healthcare data row with computed fields
 */
export interface ProcessedHealthcareRow extends Record<string, unknown> {
  // Core financial data
  'Medical Claims': number;
  'Pharmacy Claims': number;
  'Fixed Costs': number;
  'Admin Fees': number;
  'TPA Fee': number;
  'Stop Loss Premium': number;
  'Stop Loss Reimbursements': number;
  'Rx Rebates': number;
  
  // Computed totals
  'Total Expenses': number;
  'Total Revenues': number;
  'Net Cost': number;
  'Budget': number;
  'Variance': number;
  'Variance %': number;
  
  // Member/employee data
  'Member Count'?: number;
  'Employee Count'?: number;
  'Enrollment'?: number;
  
  // Computed fallback fields
  'Computed Fixed Cost': number;
  'Computed Budget': number;
  'Computed Stop Loss Reimb': number;
  'Computed Rebates': number;
}

/**
 * Healthcare KPI metrics for dashboard tiles
 */
export interface HealthcareKPIMetrics {
  pctOfBudget: number;        // Percentage of budget used
  totalBudget: number;        // Total budget amount
  totalPlanCost: number;      // Total plan cost
  surplus: number;            // Budget surplus/deficit
  planCostPEPM: number;       // Plan cost per employee per month
  budgetPEPM: number;         // Budget per employee per month  
  netPaidPEPM: number;        // Net paid per employee per month
  members: number;            // Total member count
}

// ============================================================================
// COMPONENT INTERFACES
// ============================================================================

/**
 * Data Uploader Component - Handles CSV upload and initial processing
 */
export interface DataUploaderProps {
  onDataLoaded: (budget: ParsedCSVData, claims: ParsedCSVData) => void;
  onError: (error: string) => void;
  onLoadingChange: (loading: boolean) => void;
  onFeesConfigured: (config: FeesConfig) => void;
}

export interface DataUploaderState {
  isLoading: boolean;
  showSuccess: boolean;
  showFeesForm: boolean;
  error: string;
}

/**
 * Dashboard Layout Component - Main layout and navigation
 */
export interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onThemeToggle: () => void;
  onExport: () => void;
  dateRange: DateRangeSelection;
  onDateRangeChange: (range: DateRangeSelection) => void;
  debugMode?: boolean;
  emergencyMode?: boolean;
}

export interface DashboardLayoutState {
  commandPaletteOpen: boolean;
  isDarkMode: boolean;
  emergencyMode: boolean;
  debugMode: boolean;
}

/**
 * Report Table Component - Data table with virtualization
 */
export interface ReportTableProps {
  budgetData: ProcessedHealthcareRow[];
  claimsData: ParsedCSVData['rows'];
  dateRange: DateRangeSelection;
  onRowSelect?: (row: ProcessedHealthcareRow) => void;
  virtualizeThreshold?: number; // Rows count to trigger virtualization
}

/**
 * Report Charts Component - Data visualizations
 */
export interface ReportChartsProps {
  data: ProcessedHealthcareRow[];
  metrics: HealthcareKPIMetrics;
  period: string;
  chartTypes?: Array<'kpi' | 'performance' | 'trends'>;
  commentaryTitle?: string;
}

/**
 * Export Manager Component - PDF and data export functionality
 */
export interface ExportManagerProps {
  budgetData: ProcessedHealthcareRow[];
  claimsData: ParsedCSVData['rows'];
  metrics: HealthcareKPIMetrics;
  title?: string;
  period?: string;
  onExportComplete?: (success: boolean, format: ExportFormat) => void;
}

export type ExportFormat = 'csv' | 'json' | 'pdf' | 'excel';

// ============================================================================
// SHARED STATE INTERFACES  
// ============================================================================

/**
 * Core application state for the healthcare dashboard
 */
export interface HealthcareDashboardState {
  // Data states
  budgetData: ParsedCSVData | null;
  claimsData: ParsedCSVData | null;
  feesConfig: FeesConfig | null;
  
  // UI states
  showDashboard: boolean;
  currentPage: string;
  dateRange: DateRangeSelection;
  
  // Loading states
  isLoading: boolean;
  showSuccess: boolean;
  error: string;
}

/**
 * Data processing context for components
 */
export interface HealthcareDataContext {
  // Raw data
  budgetData: ParsedCSVData | null;
  claimsData: ParsedCSVData | null;
  feesConfig: FeesConfig | null;
  
  // Processed data
  effectiveBudget: ProcessedHealthcareRow[];
  filteredClaims: ParsedCSVData['rows'];
  metrics: HealthcareKPIMetrics;
  
  // Data operations
  updateFeesConfig: (config: FeesConfig) => void;
  setDateRange: (range: DateRangeSelection) => void;
  refreshData: () => void;
}

// ============================================================================
// EVENT HANDLER INTERFACES
// ============================================================================

/**
 * Navigation event handlers
 */
export interface NavigationHandlers {
  onNavigate: (page: string) => void;
  onExport: () => void;
  onThemeToggle: () => void;
  onCommandPaletteOpen?: () => void;
  onEmergencyMode?: () => void;
  onPatientSearch?: () => void;
}

/**
 * Data manipulation event handlers  
 */
export interface DataHandlers {
  onBothFilesLoaded: (budget: ParsedCSVData, claims: ParsedCSVData) => void;
  onFeesConfigUpdate: (config: FeesConfig) => void;
  onDateRangeChange: (range: DateRangeSelection) => void;
  onError: (error: string) => void;
  onLoadingChange: (loading: boolean) => void;
}

// ============================================================================
// UTILITY INTERFACES
// ============================================================================

/**
 * Performance monitoring data
 */
export interface PerformanceMetrics {
  loadTime: number;
  bundleSize?: number;
  memoryUsage?: number;
  renderTime?: number;
  dataProcessingTime?: number;
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

/**
 * Accessibility context
 */
export interface AccessibilityContext {
  announceMessage: (message: string) => void;
  setFocusTarget: (elementId: string) => void;
  keyboardNavigation: boolean;
  highContrast: boolean;
}

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

/**
 * Component configuration for customization
 */
export interface ComponentConfig {
  theme: 'light' | 'dark' | 'auto';
  animations: boolean;
  virtualization: {
    enabled: boolean;
    threshold: number;
    itemHeight: number;
  };
  accessibility: {
    announcements: boolean;
    keyboardNavigation: boolean;
    highContrast: boolean;
  };
}

/**
 * Healthcare-specific configuration
 */
export interface HealthcareConfig {
  hipaaCompliance: boolean;
  dataRetentionPolicy: 'session' | 'persistent' | 'none';
  phiHandling: 'strict' | 'standard';
  auditLogging: boolean;
}

// ============================================================================
// EXPORT AGGREGATION
// ============================================================================

export type {
  // Re-export from existing types
  ParsedCSVData,
  FeesConfig,
  DateRangeSelection,
};

/**
 * Main props interface for the root dashboard component
 */
export interface HealthcareDashboardProps {
  config?: Partial<ComponentConfig>;
  healthcareConfig?: Partial<HealthcareConfig>;
  onStateChange?: (state: HealthcareDashboardState) => void;
  initialData?: {
    budgetData?: ParsedCSVData;
    claimsData?: ParsedCSVData;
    feesConfig?: FeesConfig;
  };
}