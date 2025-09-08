import { z } from 'zod';

// Healthcare-specific validation schemas
export const ClaimantNumberSchema = z
  .string()
  .min(1, 'Claimant number is required')
  .max(50, 'Claimant number too long')
  .regex(/^[A-Za-z0-9-_]+$/, 'Invalid claimant number format');

export const ICD10Schema = z
  .string()
  .regex(/^[A-Z][0-9]{2}(?:\.[A-Z0-9]{1,4})?$/i, 'Invalid ICD-10 code format');

export const ServiceTypeSchema = z.enum([
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
  'Home Health'
]);

export const MonetaryAmountSchema = z
  .number()
  .min(0, 'Amount cannot be negative')
  .max(1000000, 'Amount exceeds maximum allowed');

export const ClaimsRowSchema = z.object({
  claimantNumber: ClaimantNumberSchema,
  serviceDate: z.string().datetime().or(z.string().date()),
  serviceType: ServiceTypeSchema,
  icd10Code: ICD10Schema,
  medicalAmount: MonetaryAmountSchema,
  rxAmount: MonetaryAmountSchema,
  totalAmount: MonetaryAmountSchema,
});

export const BudgetRowSchema = z.object({
  month: z.string().min(1, 'Month is required'),
  budget: MonetaryAmountSchema,
  medicalClaims: MonetaryAmountSchema,
  rxClaims: MonetaryAmountSchema,
  employeeCount: z.number().int().min(0),
  totalEnrollment: z.number().int().min(0),
});

export type ClaimsRow = z.infer<typeof ClaimsRowSchema>;
export type BudgetRow = z.infer<typeof BudgetRowSchema>;

// Sanitization utilities
export const sanitizeString = (input: unknown): string => {
  if (typeof input !== 'string') {
    return '';
  }
  // Remove potentially harmful characters and normalize whitespace
  return input.trim().replace(/[<>'"&]/g, '').replace(/\s+/g, ' ');
};

export const sanitizeNumeric = (input: unknown): number | null => {
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : null;
  }
  if (typeof input === 'string') {
    // Remove common currency symbols and whitespace
    const cleaned = input.replace(/[$,\s]/g, '');
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

// Environment variable validation
export const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ANALYZE: z.string().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
});

export const validateEnvironment = () => {
  try {
    return EnvironmentSchema.parse(process.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw new Error('Invalid environment configuration');
  }
};