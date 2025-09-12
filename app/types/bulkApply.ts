import { FeeItem, RateBasis } from '@/app/components/forms/FeesConfigurator';

/**
 * Conflict resolution policies for bulk apply operations
 */
export enum ConflictPolicy {
  OVERWRITE = 'OVERWRITE', // Replace existing values in target months
  FILL_BLANKS_ONLY = 'FILL_BLANKS_ONLY', // Only set months where no value exists
  ADDITIVE = 'ADDITIVE' // Add new fee rows or add numeric delta to existing values
}

/**
 * Components that can be bulk applied
 */
export interface BulkApplyComponents {
  fees: boolean;
  budget: boolean;
  stopLossReimb: boolean;
  rebates: boolean;
}

/**
 * Configuration for a bulk apply operation
 */
export interface BulkApplyConfig {
  startMonth: string; // YYYY-MM format
  endMonth?: string; // YYYY-MM format (mutually exclusive with duration)
  duration?: number; // Number of months (mutually exclusive with endMonth)
  components: BulkApplyComponents;
  conflictPolicy: ConflictPolicy;
  
  // Source values to apply
  sourceFees: FeeItem[];
  sourceBudget?: { amount: number; basis: RateBasis };
  sourceStopLossReimb?: number;
  sourceRebates?: number;
}

/**
 * Monthly enrollment data from CSV
 */
export interface MonthlyEnrollment {
  month: string; // YYYY-MM
  employeeCount: number;
  memberCount: number;
}

/**
 * Preview data for a single month
 */
export interface MonthlySnapshot {
  month: string;
  enrollment: MonthlyEnrollment | null;
  
  // Current values (before bulk apply)
  currentFees: FeeItem[];
  currentBudget: number | null;
  currentStopLossReimb: number | null;
  currentRebates: number | null;
  currentTotalFixed: number;
  
  // New values (after bulk apply)
  newFees: FeeItem[];
  newBudget: number | null;
  newStopLossReimb: number | null;
  newRebates: number | null;
  newTotalFixed: number;
  
  // Change indicators
  hasChanges: boolean;
  warnings: string[];
}

/**
 * Result of a bulk apply operation
 */
export interface BulkApplyResult {
  success: boolean;
  monthsUpdated: string[];
  monthsSkipped: string[];
  errors: string[];
  auditLog: BulkApplyAuditEntry;
}

/**
 * Audit log entry for tracking bulk operations
 */
export interface BulkApplyAuditEntry {
  id: string;
  timestamp: string;
  userId?: string;
  startMonth: string;
  endMonth: string;
  componentsApplied: string[];
  conflictPolicy: ConflictPolicy;
  monthsAffected: number;
  previousState?: Record<string, any>; // Snapshot of previous values for rollback
}

/**
 * Validation result for bulk apply operations
 */
export interface BulkApplyValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingEnrollmentMonths: string[];
}

/**
 * Options for handling missing months
 */
export enum MissingMonthStrategy {
  CREATE = 'CREATE', // Create missing months with applied values
  SKIP = 'SKIP', // Skip missing months and continue
  BLOCK = 'BLOCK' // Block operation and show error
}