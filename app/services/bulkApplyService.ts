import {
  BulkApplyConfig,
  BulkApplyResult,
  BulkApplyValidation,
  ConflictPolicy,
  MonthlyEnrollment,
  MonthlySnapshot,
  MissingMonthStrategy,
  BulkApplyAuditEntry
} from '../types/bulkApply';
import { FeeItem, FeesConfig, RateBasis } from '../components/forms/FeesConfigurator';
import { parseNumericValue } from '../utils/chartDataProcessors';

const padMonth = (value: number): string => value.toString().padStart(2, '0');

const parseYearMonth = (value: string): { year: number; month: number } | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{4})-(\d{1,2})$/);
  if (match) {
    const year = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    if (month >= 1 && month <= 12) {
      return { year, month };
    }
  }

  const fallback = new Date(trimmed.length === 7 ? `${trimmed}-01` : trimmed);
  if (!Number.isNaN(fallback.getTime())) {
    return { year: fallback.getUTCFullYear(), month: fallback.getUTCMonth() + 1 };
  }

  return null;
};

/**
 * Expands a date range into an array of month strings
 */
export function expandMonths(startMonth: string, duration?: number, endMonth?: string): string[] {
  const startParts = parseYearMonth(startMonth);
  if (!startParts) return [];

  let endParts: { year: number; month: number } | null = null;

  if (endMonth) {
    endParts = parseYearMonth(endMonth);
  } else if (duration && duration > 0) {
    const addedMonths = duration - 1;
    const totalMonths = startParts.month - 1 + addedMonths;
    const year = startParts.year + Math.floor(totalMonths / 12);
    const month = (totalMonths % 12) + 1;
    endParts = { year, month };
  }

  if (!endParts) {
    endParts = { ...startParts };
  }

  const months: string[] = [];
  let currentYear = startParts.year;
  let currentMonth = startParts.month;

  while (
    currentYear < endParts.year ||
    (currentYear === endParts.year && currentMonth <= endParts.month)
  ) {
    months.push(`${currentYear}-${padMonth(currentMonth)}`);
    currentMonth += 1;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear += 1;
    }
  }

  return months;
}

/**
 * Calculates monthly value based on rate basis and enrollment
 */
export function monthlyFromBasis(
  amount: number,
  basis: RateBasis,
  employees: number,
  members: number
): number {
  switch (basis) {
    case 'PMPM':
      return amount * Math.max(0, Math.floor(members || 0));
    case 'PEPM':
      return amount * Math.max(0, Math.floor(employees || 0));
    case 'Monthly':
      return amount;
    case 'Annual':
      return amount / 12;
    default:
      return amount;
  }
}

/**
 * Applies fees to a month based on conflict policy
 */
function applyFeesWithPolicy(
  currentFees: FeeItem[],
  sourceFees: FeeItem[],
  policy: ConflictPolicy
): FeeItem[] {
  switch (policy) {
    case ConflictPolicy.OVERWRITE:
      // Replace all fees with source fees
      return sourceFees.map(f => ({ ...f }));
    
    case ConflictPolicy.FILL_BLANKS_ONLY:
      // Only apply if no fees exist
      return currentFees.length === 0 ? sourceFees.map(f => ({ ...f })) : currentFees;
    
    case ConflictPolicy.ADDITIVE:
      // Add source fees to existing fees
      // For matching labels, combine amounts
      const result = [...currentFees];
      for (const sourceFee of sourceFees) {
        const existing = result.find(f => f.label === sourceFee.label);
        if (existing) {
          // Add to existing fee amount
          existing.amount = (existing.amount || 0) + (sourceFee.amount || 0);
        } else {
          // Add new fee
          result.push({ ...sourceFee, id: `${sourceFee.id}-${Date.now()}` });
        }
      }
      return result;
    
    default:
      return currentFees;
  }
}

/**
 * Applies a scalar value (budget, rebates, reimbursements) based on policy
 */
function applyScalarWithPolicy(
  currentValue: number | null,
  sourceValue: number | undefined,
  policy: ConflictPolicy
): number | null {
  if (sourceValue === undefined) return currentValue;
  
  switch (policy) {
    case ConflictPolicy.OVERWRITE:
      return sourceValue;
    
    case ConflictPolicy.FILL_BLANKS_ONLY:
      return currentValue === null || currentValue === 0 ? sourceValue : currentValue;
    
    case ConflictPolicy.ADDITIVE:
      return (currentValue || 0) + sourceValue;
    
    default:
      return currentValue;
  }
}

/**
 * Extracts enrollment data from CSV rows for specific months
 */
export function extractEnrollmentData(
  csvRows: any[],
  targetMonths: string[]
): Map<string, MonthlyEnrollment> {
  const enrollmentMap = new Map<string, MonthlyEnrollment>();
  
  for (const row of csvRows) {
    const month = row.month || row.Month || row.period || row.Period;
    if (!month || !targetMonths.includes(month)) continue;
    
    const employeeCount = parseNumericValue(
      row['Employee Count'] || row['Employees'] || row['employee_count'] || 0
    );
    const memberCount = parseNumericValue(
      row['Member Count'] || row['Enrollment'] || row['Total Enrollment'] || 
      row['members'] || row['Lives'] || 0
    );
    
    enrollmentMap.set(month, {
      month,
      employeeCount,
      memberCount
    });
  }
  
  return enrollmentMap;
}

/**
 * Validates a bulk apply configuration
 */
export function validateBulkApply(
  config: BulkApplyConfig,
  existingMonths: string[],
  enrollmentData: Map<string, MonthlyEnrollment>
): BulkApplyValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingEnrollmentMonths: string[] = [];
  
  // Validate date range
  if (!config.startMonth) {
    errors.push('Start month is required');
  }
  
  if (config.duration && config.endMonth) {
    errors.push('Cannot specify both duration and end month');
  }
  
  if (!config.duration && !config.endMonth) {
    warnings.push('No duration or end month specified, will apply to single month');
  }
  
  if (config.duration && config.duration < 1) {
    errors.push('Duration must be at least 1 month');
  }
  
  if (config.endMonth && config.endMonth < config.startMonth) {
    errors.push('End month must be after or equal to start month');
  }
  
  // Check for components
  const hasComponents = Object.values(config.components).some(v => v);
  if (!hasComponents) {
    errors.push('At least one component must be selected');
  }
  
  // Check enrollment data for PMPM/PEPM fees
  const targetMonths = expandMonths(config.startMonth, config.duration, config.endMonth);
  const hasPmpmFees = config.sourceFees.some(f => f.basis === 'PMPM' || f.basis === 'PEPM');
  
  if (hasPmpmFees || (config.sourceBudget && ['PMPM', 'PEPM'].includes(config.sourceBudget.basis))) {
    for (const month of targetMonths) {
      if (!enrollmentData.has(month)) {
        missingEnrollmentMonths.push(month);
      }
    }
    
    if (missingEnrollmentMonths.length > 0) {
      warnings.push(`Missing enrollment data for ${missingEnrollmentMonths.length} month(s)`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingEnrollmentMonths
  };
}

/**
 * Generates preview snapshots for bulk apply operation
 */
export function generatePreview(
  config: BulkApplyConfig,
  currentFeesConfig: FeesConfig,
  enrollmentData: Map<string, MonthlyEnrollment>
): MonthlySnapshot[] {
  const targetMonths = expandMonths(config.startMonth, config.duration, config.endMonth);
  const snapshots: MonthlySnapshot[] = [];
  
  for (const month of targetMonths) {
    const enrollment = enrollmentData.get(month) || null;
    const monthOverrides = currentFeesConfig.perMonth?.[month];
    
    // Current state
    const currentFees = monthOverrides?.fees 
      ? Object.entries(monthOverrides.fees).map(([id, override]) => {
          const baseFee = currentFeesConfig.fees.find(f => f.id === id);
          return baseFee ? { ...baseFee, ...override } : null;
        }).filter(Boolean) as FeeItem[]
      : [];
    
    const currentBudget = monthOverrides?.budgetOverride?.amount ?? null;
    const currentStopLossReimb = monthOverrides?.stopLossReimb ?? null;
    const currentRebates = monthOverrides?.rebates ?? null;
    
    // Calculate current total fixed costs
    const currentTotalFixed = currentFees.reduce((sum, fee) => {
      return sum + monthlyFromBasis(
        fee.amount,
        fee.basis,
        enrollment?.employeeCount || 0,
        enrollment?.memberCount || 0
      );
    }, 0);
    
    // New state after applying
    let newFees = currentFees;
    let newBudget = currentBudget;
    let newStopLossReimb = currentStopLossReimb;
    let newRebates = currentRebates;
    
    if (config.components.fees) {
      newFees = applyFeesWithPolicy(currentFees, config.sourceFees, config.conflictPolicy);
    }
    
    if (config.components.budget && config.sourceBudget) {
      newBudget = applyScalarWithPolicy(currentBudget, config.sourceBudget.amount, config.conflictPolicy);
    }
    
    if (config.components.stopLossReimb) {
      newStopLossReimb = applyScalarWithPolicy(currentStopLossReimb, config.sourceStopLossReimb, config.conflictPolicy);
    }
    
    if (config.components.rebates) {
      newRebates = applyScalarWithPolicy(currentRebates, config.sourceRebates, config.conflictPolicy);
    }
    
    // Calculate new total fixed costs
    const newTotalFixed = newFees.reduce((sum, fee) => {
      return sum + monthlyFromBasis(
        fee.amount,
        fee.basis,
        enrollment?.employeeCount || 0,
        enrollment?.memberCount || 0
      );
    }, 0);
    
    // Warnings
    const warnings: string[] = [];
    if (!enrollment && (newFees.some(f => ['PMPM', 'PEPM'].includes(f.basis)))) {
      warnings.push('Missing enrollment data for PMPM/PEPM calculations');
    }
    
    const hasChanges = 
      JSON.stringify(currentFees) !== JSON.stringify(newFees) ||
      currentBudget !== newBudget ||
      currentStopLossReimb !== newStopLossReimb ||
      currentRebates !== newRebates;
    
    snapshots.push({
      month,
      enrollment,
      currentFees,
      currentBudget,
      currentStopLossReimb,
      currentRebates,
      currentTotalFixed,
      newFees,
      newBudget,
      newStopLossReimb,
      newRebates,
      newTotalFixed,
      hasChanges,
      warnings
    });
  }
  
  return snapshots;
}

/**
 * Executes the bulk apply operation
 */
export function executeBulkApply(
  config: BulkApplyConfig,
  currentFeesConfig: FeesConfig,
  enrollmentData: Map<string, MonthlyEnrollment>,
  missingMonthStrategy: MissingMonthStrategy = MissingMonthStrategy.CREATE
): BulkApplyResult {
  const targetMonths = expandMonths(config.startMonth, config.duration, config.endMonth);
  const updatedMonths: string[] = [];
  const skippedMonths: string[] = [];
  const errors: string[] = [];
  
  // Create a deep copy of the current config to modify
  const newFeesConfig: FeesConfig = JSON.parse(JSON.stringify(currentFeesConfig));
  newFeesConfig.perMonth = newFeesConfig.perMonth || {};
  
  // Store previous state for audit
  const previousState: Record<string, any> = {};
  for (const month of targetMonths) {
    if (newFeesConfig.perMonth[month]) {
      previousState[month] = JSON.parse(JSON.stringify(newFeesConfig.perMonth[month]));
    }
  }
  
  for (const month of targetMonths) {
    try {
      const enrollment = enrollmentData.get(month);
      
      // Handle missing enrollment based on strategy
      if (!enrollment && missingMonthStrategy === MissingMonthStrategy.BLOCK) {
        errors.push(`Missing enrollment data for ${month}`);
        continue;
      }
      
      if (!enrollment && missingMonthStrategy === MissingMonthStrategy.SKIP) {
        skippedMonths.push(month);
        continue;
      }
      
      // Initialize month data if it doesn't exist
      if (!newFeesConfig.perMonth[month]) {
        newFeesConfig.perMonth[month] = {};
      }
      
      const monthData = newFeesConfig.perMonth[month];
      
      // Apply fees
      if (config.components.fees) {
        const currentFees = monthData.fees || {};
        monthData.fees = {};
        
        const appliedFees = applyFeesWithPolicy(
          Object.values(currentFees) as FeeItem[],
          config.sourceFees,
          config.conflictPolicy
        );
        
        for (const fee of appliedFees) {
          monthData.fees[fee.id] = {
            amount: fee.amount,
            basis: fee.basis
          };
        }
      }
      
      // Apply budget
      if (config.components.budget && config.sourceBudget) {
        const currentBudget = monthData.budgetOverride?.amount ?? null;
        const newBudget = applyScalarWithPolicy(currentBudget, config.sourceBudget.amount, config.conflictPolicy);
        
        if (newBudget !== null) {
          monthData.budgetOverride = {
            amount: newBudget,
            basis: config.sourceBudget.basis
          };
        }
      }
      
      // Apply stop loss reimbursements
      if (config.components.stopLossReimb) {
        monthData.stopLossReimb = applyScalarWithPolicy(
          monthData.stopLossReimb ?? null,
          config.sourceStopLossReimb,
          config.conflictPolicy
        ) ?? undefined;
      }
      
      // Apply rebates
      if (config.components.rebates) {
        monthData.rebates = applyScalarWithPolicy(
          monthData.rebates ?? null,
          config.sourceRebates,
          config.conflictPolicy
        ) ?? undefined;
      }
      
      updatedMonths.push(month);
    } catch (error) {
      errors.push(`Failed to update ${month}: ${error}`);
      skippedMonths.push(month);
    }
  }
  
  // Create audit log entry
  const auditLog: BulkApplyAuditEntry = {
    id: `bulk-apply-${Date.now()}`,
    timestamp: new Date().toISOString(),
    startMonth: config.startMonth,
    endMonth: targetMonths[targetMonths.length - 1],
    componentsApplied: Object.entries(config.components)
      .filter(([_, enabled]) => enabled)
      .map(([component]) => component),
    conflictPolicy: config.conflictPolicy,
    monthsAffected: updatedMonths.length,
    previousState
  };
  
  return {
    success: errors.length === 0,
    monthsUpdated: updatedMonths,
    monthsSkipped: skippedMonths,
    errors,
    auditLog,
    updatedConfig: newFeesConfig
  };
}
