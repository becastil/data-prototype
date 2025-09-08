import type { ServiceType } from '@/app/types/healthcare';

// Healthcare service types
export const SERVICE_TYPES: readonly ServiceType[] = [
  'Professional',
  'Outpatient',
  'Inpatient',
  'Emergency',
  'Pharmacy',
  'Lab',
  'Radiology',
  'Surgery',
  'Therapy',
  'Preventive',
  'Specialty',
  'Mental Health',
  'Dental',
  'Vision',
  'DME',
  'Home Health',
] as const;

// ICD-10 validation pattern
export const ICD10_PATTERN = /^[A-Z][0-9]{2}(?:\.[A-Z0-9]{1,4})?$/i;

// Common header mappings for CSV files
export const CSV_HEADER_MAPPINGS = {
  CLAIMS: {
    claimantNumber: ['claimant number', 'claimant_number', 'member id', 'member_id'],
    serviceDate: ['service date', 'service_date', 'date of service', 'dos'],
    serviceType: ['service type', 'service_type', 'type of service'],
    icd10Code: ['icd-10-cm code', 'icd-10-cm', 'icd-10', 'icd10', 'icd code', 'icd'],
    medicalAmount: ['medical', 'medical cost', 'medical amount', 'medical_amount'],
    rxAmount: ['rx', 'pharmacy', 'rx cost', 'pharmacy cost'],
    totalAmount: ['total', 'total amount', 'total cost', 'total_amount'],
  },
  BUDGET: {
    month: ['month', 'period', 'month_year', 'reporting_period'],
    budget: ['budget', 'budgeted amount', 'budget_amount'],
    medicalClaims: ['medical claims', 'medical_claims', 'medical'],
    rxClaims: ['rx claims', 'rx_claims', 'pharmacy claims', 'pharmacy'],
    employeeCount: ['employee count', 'employee_count', 'employees'],
    totalEnrollment: ['total enrollment', 'total_enrollment', 'enrollment'],
  },
} as const;

// Validation limits
export const VALIDATION_LIMITS = {
  MAX_CLAIM_AMOUNT: 1_000_000,
  MIN_CLAIM_AMOUNT: 0,
  MAX_BUDGET_AMOUNT: 50_000_000,
  MAX_ENROLLMENT: 100_000,
  MAX_CSV_ROWS: 100_000,
  MAX_FILE_SIZE_MB: 50,
} as const;

// Performance constants
export const PERFORMANCE_LIMITS = {
  CSV_CHUNK_SIZE: 1000,
  VALIDATION_SAMPLE_SIZE: 50,
  DEBOUNCE_DELAY_MS: 300,
  CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes
} as const;

// Healthcare-specific business rules
export const BUSINESS_RULES = {
  RISK_SCORE_RANGE: { min: 0.1, max: 5.0 },
  AGE_RANGE: { min: 0, max: 120 },
  DEPENDENT_LIMIT: 10,
  CALCULATION_TOLERANCE: 1.0, // $1.00 tolerance for medical + rx = total
} as const;