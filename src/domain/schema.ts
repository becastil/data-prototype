import { z } from 'zod';
import type { BudgetRow, ClaimsRow } from './types';

const NON_ALPHANUMERIC = /[^a-z0-9]/g;

export const BUDGET_CANONICAL_FIELDS = [
  'month',
  'budget',
  'medicalClaims',
  'pharmacyClaims',
  'adminFees',
  'stopLossPremium',
  'stopLossReimbursements',
  'rxRebates',
  'inpatient',
  'outpatient',
  'professional',
  'emergency',
  'domesticClaims',
  'nonDomesticClaims',
  'netPaid',
  'netCost',
  'variance',
  'variancePercent',
  'lossRatio',
  'employeeCount',
  'memberCount',
  'totalEnrollment',
  'createdAt',
  'updatedAt'
] as const;

export type BudgetField = typeof BUDGET_CANONICAL_FIELDS[number];

export const BUDGET_REQUIRED_FIELDS: readonly BudgetField[] = ['month'];

export const BUDGET_FIELD_ALIASES: Record<BudgetField, readonly string[]> = {
  month: ['month', 'Month', 'period', 'Period', 'period_label', 'Period Label', 'billing_month', 'Billing Month', 'coverage_month', 'Coverage Month', 'month_label', 'Month Label'],
  budget: ['budget', 'Budget', 'total_budget', 'Total Budget', 'budget_amount', 'Budget Amount', 'monthly_budget', 'Monthly Budget', 'plan_budget', 'Plan Budget'],
  medicalClaims: ['medical_claims', 'medicalClaims', 'Medical Claims', 'Medical', 'medical expenses', 'Medical Expenses', 'total medical claims', 'Total Medical Claims'],
  pharmacyClaims: ['rx_claims', 'rxClaims', 'Rx Claims', 'pharmacy_claims', 'Pharmacy Claims', 'Rx', 'Pharmacy'],
  adminFees: ['admin_fees', 'Admin Fees', 'administrative_fees', 'Administrative Fees', 'Total Admin Fee', 'total_admin_fee', 'admin fee # 1', 'admin fee # 2'],
  stopLossPremium: ['stop_loss_premium', 'Stop Loss Premium', 'stop loss fees', 'Stop Loss Fees', 'stoploss_premium', 'Stoploss Premium'],
  stopLossReimbursements: ['stop_loss_reimb', 'stop_loss_reimbursements', 'Stop Loss Reimb', 'Stop Loss Reimbursements'],
  rxRebates: ['rx_rebates', 'Rx Rebates', 'pharmacy_rebates', 'Pharmacy Rebates', 'rebates', 'Rebates'],
  inpatient: ['inpatient', 'Inpatient', 'inpatient_claims', 'Inpatient Claims'],
  outpatient: ['outpatient', 'Outpatient', 'outpatient_claims', 'Outpatient Claims'],
  professional: ['professional', 'Professional', 'professional_claims', 'Professional Claims'],
  emergency: ['emergency', 'Emergency', 'er_claims', 'ER Claims'],
  domesticClaims: ['domestic_claims', 'Domestic Claims', 'domestic medical facility claims', 'Domestic Medical Facility Claims'],
  nonDomesticClaims: ['non_domestic_claims', 'Non Domestic Claims', 'non domestic medical claims', 'Non Domestic Medical Claims'],
  netPaid: ['net_paid', 'Net Paid'],
  netCost: ['net_cost', 'Net Cost'],
  variance: ['variance', 'Variance', 'budget_variance', 'Budget Variance'],
  variancePercent: ['variance_percent', 'Variance Percent', 'Variance %', 'variance_pct'],
  lossRatio: ['loss_ratio', 'Loss Ratio'],
  employeeCount: ['employee_count', 'Employee Count', 'employees', 'Employees'],
  memberCount: ['member_count', 'Member Count', 'members', 'Members', 'enrollment', 'Enrollment'],
  totalEnrollment: ['total_enrollment', 'Total Enrollment', 'total members', 'Total Members'],
  createdAt: ['created_at', 'Created At'],
  updatedAt: ['updated_at', 'Updated At']
};

export const CLAIMS_CANONICAL_FIELDS = [
  'claimId',
  'claimantNumber',
  'memberId',
  'serviceDate',
  'paidDate',
  'status',
  'serviceType',
  'providerId',
  'diagnosisCode',
  'diagnosisDescription',
  'laymanTerm',
  'medicalAmount',
  'pharmacyAmount',
  'totalAmount',
  'domesticFlag',
  'planTypeId',
  'diagnosisCategory',
  'hccCode',
  'riskScore',
  'createdAt',
  'updatedAt'
] as const;

export type ClaimsField = typeof CLAIMS_CANONICAL_FIELDS[number];

export const CLAIMS_REQUIRED_FIELDS: readonly ClaimsField[] = ['claimId', 'serviceDate'];

export const CLAIMS_FIELD_ALIASES: Record<ClaimsField, readonly string[]> = {
  claimId: ['claim_id', 'Claim ID', 'ClaimID'],
  claimantNumber: ['claimant_number', 'Claimant Number'],
  memberId: ['member_id', 'Member ID'],
  serviceDate: ['service_date', 'Service Date'],
  paidDate: ['paid_date', 'Paid Date'],
  status: ['status', 'Status', 'claim_status', 'Claim Status'],
  serviceType: ['service_type', 'Service Type'],
  providerId: ['provider_id', 'Provider ID'],
  diagnosisCode: ['diagnosis_code', 'Diagnosis Code', 'icd-10-cm code', 'ICD-10-CM Code', 'icd10', 'ICD10'],
  diagnosisDescription: ['diagnosis_description', 'Diagnosis Description', 'medical description', 'Medical Description'],
  laymanTerm: ["layman's term", 'Layman\'s Term', 'Laymans Term', 'layman_term'],
  medicalAmount: ['medical', 'Medical', 'medical_amount', 'Medical Amount'],
  pharmacyAmount: ['rx', 'Rx', 'pharmacy', 'Pharmacy', 'rx_amount', 'Rx Amount'],
  totalAmount: ['total', 'Total', 'total_amount', 'Total Amount', 'claim_total', 'Claim Total'],
  domesticFlag: ['domestic_flag', 'Domestic Flag'],
  planTypeId: ['plan_type_id', 'Plan Type ID'],
  diagnosisCategory: ['diagnosis_category', 'Diagnosis Category'],
  hccCode: ['hcc_code', 'HCC Code'],
  riskScore: ['risk_score', 'Risk Score'],
  createdAt: ['created_at', 'Created At'],
  updatedAt: ['updated_at', 'Updated At']
};

const isoMonth = /^\d{4}-\d{2}$/;
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export const budgetRowSchema: z.ZodType<BudgetRow> = z.object({
  month: z.string().regex(isoMonth),
  sourceMonthLabel: z.string(),
  budget: z.number().finite().nullable(),
  medicalClaims: z.number().finite().nullable(),
  pharmacyClaims: z.number().finite().nullable(),
  adminFees: z.number().finite().nullable(),
  stopLossPremium: z.number().finite().nullable(),
  stopLossReimbursements: z.number().finite().nullable(),
  rxRebates: z.number().finite().nullable(),
  inpatient: z.number().finite().nullable(),
  outpatient: z.number().finite().nullable(),
  professional: z.number().finite().nullable(),
  emergency: z.number().finite().nullable(),
  domesticClaims: z.number().finite().nullable(),
  nonDomesticClaims: z.number().finite().nullable(),
  netPaid: z.number().finite().nullable(),
  netCost: z.number().finite().nullable(),
  variance: z.number().finite().nullable(),
  variancePercent: z.number().finite().nullable(),
  lossRatio: z.number().finite().nullable(),
  employeeCount: z.number().int().nullable(),
  memberCount: z.number().int().nullable(),
  totalEnrollment: z.number().int().nullable(),
  createdAt: z.string().regex(isoDate).nullable(),
  updatedAt: z.string().regex(isoDate).nullable()
});

export const claimsRowSchema: z.ZodType<ClaimsRow> = z.object({
  claimId: z.string().min(1),
  claimantNumber: z.string().nullable(),
  memberId: z.string().nullable(),
  serviceDate: z.string().regex(isoDate),
  serviceMonth: z.string().regex(isoMonth),
  paidDate: z.string().regex(isoDate).nullable(),
  status: z.string().nullable(),
  serviceType: z.string().nullable(),
  providerId: z.string().nullable(),
  diagnosisCode: z.string().nullable(),
  diagnosisDescription: z.string().nullable(),
  laymanTerm: z.string().nullable(),
  medicalAmount: z.number().finite().nullable(),
  pharmacyAmount: z.number().finite().nullable(),
  totalAmount: z.number().finite().nullable(),
  domesticFlag: z.boolean().nullable(),
  planTypeId: z.string().nullable(),
  diagnosisCategory: z.string().nullable(),
  hccCode: z.string().nullable(),
  riskScore: z.number().finite().nullable(),
  createdAt: z.string().regex(isoDate).nullable(),
  updatedAt: z.string().regex(isoDate).nullable()
});

export interface NumberResult {
  value: number | null;
  rawWasPresent: boolean;
  error?: string;
}

export interface IntegerResult {
  value: number | null;
  rawWasPresent: boolean;
  error?: string;
}

export interface DateResult {
  value: string | null;
  rawWasPresent: boolean;
  error?: string;
}

export interface MonthResult {
  value: string | null;
  label: string;
  rawWasPresent: boolean;
  error?: string;
}

export interface BooleanResult {
  value: boolean | null;
  rawWasPresent: boolean;
  error?: string;
}

export interface StringResult {
  value: string | null;
  rawWasPresent: boolean;
  error?: string;
}

export function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(NON_ALPHANUMERIC, '');
}

function hasMeaningfulValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

export function coerceNumber(value: unknown): NumberResult {
  if (!hasMeaningfulValue(value)) {
    return { value: null, rawWasPresent: false };
  }

  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return { value, rawWasPresent: true };
    }
    return { value: null, rawWasPresent: true, error: 'Non-finite number' };
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return { value: null, rawWasPresent: false };
    }

    let sanitized = trimmed.replace(/[$,%]/g, '').replace(/,/g, '');
    let isNegative = false;

    const parenthesesMatch = sanitized.match(/^\((.*)\)$/);
    if (parenthesesMatch) {
      isNegative = true;
      sanitized = parenthesesMatch[1];
    }

    if (sanitized === '') {
      return { value: null, rawWasPresent: true, error: 'Empty after sanitization' };
    }

    const numeric = Number(sanitized);
    if (Number.isFinite(numeric)) {
      return { value: isNegative ? -numeric : numeric, rawWasPresent: true };
    }

    return { value: null, rawWasPresent: true, error: 'Invalid number format' };
  }

  if (typeof value === 'boolean') {
    return { value: value ? 1 : 0, rawWasPresent: true };
  }

  return { value: null, rawWasPresent: true, error: 'Unsupported value type' };
}

export function coerceInteger(value: unknown): IntegerResult {
  const numeric = coerceNumber(value);
  if (numeric.value === null) {
    return { ...numeric };
  }
  return { value: Math.round(numeric.value), rawWasPresent: numeric.rawWasPresent };
}

function formatMonth(year: number, month: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  if (month < 1 || month > 12) return null;
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`;
}

function parseMonthFromDate(date: Date): string {
  return formatMonth(date.getUTCFullYear(), date.getUTCMonth() + 1) ?? '';
}

function parseDateParts(value: string): Date | null {
  const trimmed = value.trim();
  const ym = trimmed.match(/^(\d{4})[\/-](\d{1,2})$/);
  if (ym) {
    const year = Number.parseInt(ym[1], 10);
    const month = Number.parseInt(ym[2], 10);
    return new Date(Date.UTC(year, month - 1, 1));
  }

  const my = trimmed.match(/^(\d{1,2})[\/-](\d{4})$/);
  if (my) {
    const month = Number.parseInt(my[1], 10);
    const year = Number.parseInt(my[2], 10);
    return new Date(Date.UTC(year, month - 1, 1));
  }

  const ymd = trimmed.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (ymd) {
    const year = Number.parseInt(ymd[1], 10);
    const month = Number.parseInt(ymd[2], 10);
    const day = Number.parseInt(ymd[3], 10);
    return new Date(Date.UTC(year, month - 1, day));
  }

  const text = trimmed.match(/^([a-zA-Z]{3,})\s+(\d{4})$/);
  if (text) {
    const month = new Date(`${text[1]} 1, ${text[2]}`);
    if (!Number.isNaN(month.getTime())) {
      return new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
    }
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
  }

  return null;
}

export function coerceMonth(value: unknown): MonthResult {
  if (!hasMeaningfulValue(value)) {
    return { value: null, label: '', rawWasPresent: false };
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return { value: null, label: '', rawWasPresent: true, error: 'Invalid date value' };
    }
    return { value: parseMonthFromDate(value), label: value.toISOString(), rawWasPresent: true };
  }

  const label = typeof value === 'string' ? value.trim() : String(value);
  const parsed = parseDateParts(label);
  if (!parsed) {
    return { value: null, label, rawWasPresent: true, error: 'Unrecognized month format' };
  }

  const month = parseMonthFromDate(parsed);
  if (!month) {
    return { value: null, label, rawWasPresent: true, error: 'Invalid month value' };
  }

  return { value: month, label, rawWasPresent: true };
}

function formatDate(date: Date): string {
  const year = date.getUTCFullYear().toString().padStart(4, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function coerceDate(value: unknown): DateResult {
  if (!hasMeaningfulValue(value)) {
    return { value: null, rawWasPresent: false };
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return { value: null, rawWasPresent: true, error: 'Invalid date value' };
    }
    return { value: formatDate(value), rawWasPresent: true };
  }

  const asString = typeof value === 'string' ? value.trim() : String(value);
  if (asString === '') {
    return { value: null, rawWasPresent: false };
  }

  const parsed = parseDateParts(asString);
  if (!parsed) {
    return { value: null, rawWasPresent: true, error: 'Unrecognized date format' };
  }

  return { value: formatDate(parsed), rawWasPresent: true };
}

export function coerceBoolean(value: unknown): BooleanResult {
  if (!hasMeaningfulValue(value)) {
    return { value: null, rawWasPresent: false };
  }

  if (typeof value === 'boolean') {
    return { value, rawWasPresent: true };
  }

  if (typeof value === 'number') {
    return { value: value !== 0, rawWasPresent: true };
  }

  const stringValue = typeof value === 'string' ? value.trim().toLowerCase() : String(value).toLowerCase();
  if (stringValue === '') {
    return { value: null, rawWasPresent: false };
  }

  if (['true', 't', 'yes', 'y', '1'].includes(stringValue)) {
    return { value: true, rawWasPresent: true };
  }

  if (['false', 'f', 'no', 'n', '0'].includes(stringValue)) {
    return { value: false, rawWasPresent: true };
  }

  return { value: null, rawWasPresent: true, error: 'Unrecognized boolean value' };
}

export function coerceString(value: unknown): StringResult {
  if (!hasMeaningfulValue(value)) {
    return { value: null, rawWasPresent: false };
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? { value: null, rawWasPresent: false } : { value: trimmed, rawWasPresent: true };
  }

  return { value: String(value), rawWasPresent: true };
}
