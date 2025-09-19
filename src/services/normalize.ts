import type { SafeParseReturnType } from 'zod';
import type { BudgetRow, ClaimsRow } from '../domain/types';
import {
  BUDGET_CANONICAL_FIELDS,
  BUDGET_FIELD_ALIASES,
  BUDGET_REQUIRED_FIELDS,
  CLAIMS_CANONICAL_FIELDS,
  CLAIMS_FIELD_ALIASES,
  CLAIMS_REQUIRED_FIELDS,
  MonthResult,
  StringResult,
  budgetRowSchema,
  claimsRowSchema,
  coerceBoolean,
  coerceDate,
  coerceInteger,
  coerceMonth,
  coerceNumber,
  coerceString,
  normalizeHeader,
  type BudgetField,
  type ClaimsField,
} from '../domain/schema';

export type NormalizationIssueType =
  | 'missing_required_field'
  | 'duplicate_header'
  | 'invalid_number'
  | 'invalid_date'
  | 'invalid_boolean'
  | 'invalid_string'
  | 'schema_validation_failed';

export type NormalizationSeverity = 'warning' | 'error';

export interface NormalizationIssue {
  type: NormalizationIssueType;
  severity: NormalizationSeverity;
  message: string;
  column?: string;
  rowIndex?: number;
  rawValue?: unknown;
}

export interface FieldMapping<Field extends string> {
  canonicalField: Field;
  header?: string;
  alias?: string;
  conflicts?: string[];
}

export interface CsvDataset {
  headers: readonly string[];
  rows: ReadonlyArray<Record<string, unknown>>;
}

export interface NormalizationResult<RowType, Field extends string> {
  rows: RowType[];
  fieldMappings: FieldMapping<Field>[];
  unmappedHeaders: string[];
  issues: NormalizationIssue[];
}

interface AliasMatch<Field extends string> {
  canonical: Field;
  alias: string;
}

interface HeaderSelection<Field extends string> {
  header: string;
  alias: string;
}

type LookupMap<Field extends string> = Map<Field, HeaderSelection<Field>>;

type CoercionResult = { value: unknown; rawWasPresent: boolean; error?: string };

type CoerceFn<Result extends CoercionResult> = (value: unknown) => Result;

const BUDGET_NUMBER_FIELDS: readonly BudgetField[] = [
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
] as const;

const BUDGET_INTEGER_FIELDS: readonly BudgetField[] = [
  'employeeCount',
  'memberCount',
  'totalEnrollment',
] as const;

const BUDGET_DATE_FIELDS: readonly BudgetField[] = ['createdAt', 'updatedAt'] as const;

const CLAIMS_STRING_FIELDS: readonly ClaimsField[] = [
  'claimantNumber',
  'memberId',
  'status',
  'serviceType',
  'providerId',
  'diagnosisCode',
  'diagnosisDescription',
  'laymanTerm',
  'planTypeId',
  'diagnosisCategory',
  'hccCode',
] as const;

const CLAIMS_NUMBER_FIELDS: readonly ClaimsField[] = [
  'medicalAmount',
  'pharmacyAmount',
  'totalAmount',
  'riskScore',
] as const;

const CLAIMS_BOOLEAN_FIELDS: readonly ClaimsField[] = ['domesticFlag'] as const;

const CLAIMS_DATE_FIELDS: readonly ClaimsField[] = ['paidDate', 'createdAt', 'updatedAt'] as const;

function buildAliasLookup<Field extends string>(
  aliasMap: Record<Field, readonly string[]>
): Map<string, AliasMatch<Field>> {
  const map = new Map<string, AliasMatch<Field>>();
  for (const [canonical, aliases] of Object.entries(aliasMap) as Array<[Field, readonly string[]]>) {
    for (const alias of aliases) {
      const normalized = normalizeHeader(alias);
      if (!map.has(normalized)) {
        map.set(normalized, { canonical, alias });
      }
    }
  }
  return map;
}

function buildHeaderLookup<Field extends string>(
  headers: readonly string[],
  aliasMap: Record<Field, readonly string[]>,
  canonicalFields: readonly Field[],
  issues: NormalizationIssue[]
): {
  lookup: LookupMap<Field>;
  fieldMappings: FieldMapping<Field>[];
  unmappedHeaders: string[];
} {
  const aliasLookup = buildAliasLookup(aliasMap);
  const lookup: LookupMap<Field> = new Map();
  const conflicts = new Map<Field, string[]>();
  const usedHeaders = new Set<string>();

  for (const header of headers) {
    const normalized = normalizeHeader(header);
    const match = aliasLookup.get(normalized);
    if (!match) continue;

    const existing = lookup.get(match.canonical);
    if (!existing) {
      lookup.set(match.canonical, { header, alias: match.alias });
      usedHeaders.add(header);
    } else {
      const conflictList = conflicts.get(match.canonical) ?? [];
      conflictList.push(header);
      conflicts.set(match.canonical, conflictList);
      const message = `Column '${header}' also matches canonical field '${String(
        match.canonical,
      )}' (already mapped to '${existing.header}')`;
      issues.push({
        type: 'duplicate_header',
        severity: 'warning',
        column: header,
        message,
      });
    }
  }

  const fieldMappings: FieldMapping<Field>[] = canonicalFields.map((field) => {
    const selection = lookup.get(field);
    return {
      canonicalField: field,
      header: selection?.header,
      alias: selection?.alias,
      conflicts: conflicts.get(field),
    };
  });

  const unmappedHeaders = headers.filter((header) => !usedHeaders.has(header));

  return { lookup, fieldMappings, unmappedHeaders };
}

function coerceField<Field extends string, Result extends CoercionResult>(
  field: Field,
  row: Record<string, unknown>,
  mapping: LookupMap<Field>,
  issues: NormalizationIssue[],
  rowIndex: number,
  coerce: CoerceFn<Result>,
  issueType: NormalizationIssueType,
  severity: NormalizationSeverity = 'warning'
): Result {
  const selection = mapping.get(field);
  const rawValue = selection ? row[selection.header] : undefined;
  const result = coerce(rawValue) as Result;

  if (result.error && (result.rawWasPresent || selection)) {
    issues.push({
      type: issueType,
      severity,
      column: selection?.header ?? String(field),
      rowIndex,
      rawValue,
      message: result.error,
    });
  }

  return result;
}

function ensureRequiredFields<Field extends string>(
  required: readonly Field[],
  mapping: LookupMap<Field>,
  issues: NormalizationIssue[]
): void {
  for (const field of required) {
    if (!mapping.has(field)) {
      issues.push({
        type: 'missing_required_field',
        severity: 'error',
        column: String(field),
        message: `Required column for canonical field '${String(field)}' was not found in the uploaded file`,
      });
    }
  }
}

function coerceFields<Field extends string, Result extends CoercionResult>(
  fields: readonly Field[],
  row: Record<string, unknown>,
  mapping: LookupMap<Field>,
  issues: NormalizationIssue[],
  rowIndex: number,
  coerce: CoerceFn<Result>,
  issueType: NormalizationIssueType,
  severity: NormalizationSeverity = 'warning',
): Record<Field, Result> {
  const results = {} as Record<Field, Result>;
  for (const field of fields) {
    results[field] = coerceField(field, row, mapping, issues, rowIndex, coerce, issueType, severity);
  }
  return results;
}

function collectSchemaIssues<RowType>(
  parsed: SafeParseReturnType<RowType, RowType>,
  issues: NormalizationIssue[],
  rowIndex: number,
): RowType | null {
  if (parsed.success) {
    return parsed.data;
  }

  for (const issue of parsed.error.issues) {
    issues.push({
      type: 'schema_validation_failed',
      severity: 'error',
      column: issue.path.map(String).join('.'),
      rowIndex,
      message: issue.message,
    });
  }

  return null;
}

export function normalizeBudgetCSV(dataset: CsvDataset): NormalizationResult<BudgetRow, typeof BUDGET_CANONICAL_FIELDS[number]> {
  const issues: NormalizationIssue[] = [];
  const { lookup, fieldMappings, unmappedHeaders } = buildHeaderLookup(
    dataset.headers,
    BUDGET_FIELD_ALIASES,
    BUDGET_CANONICAL_FIELDS,
    issues,
  );

  ensureRequiredFields(BUDGET_REQUIRED_FIELDS, lookup, issues);

  const rows: BudgetRow[] = [];

  for (const [rowIndex, row] of dataset.rows.entries()) {
    const monthResult: MonthResult = coerceField(
      'month',
      row,
      lookup,
      issues,
      rowIndex,
      coerceMonth,
      'invalid_date',
      'error',
    );

    if (!monthResult.value) {
      // Without a month we cannot safely keep the row.
      continue;
    }

    const numberResults = coerceFields(BUDGET_NUMBER_FIELDS, row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const integerResults = coerceFields(BUDGET_INTEGER_FIELDS, row, lookup, issues, rowIndex, coerceInteger, 'invalid_number');
    const dateResults = coerceFields(BUDGET_DATE_FIELDS, row, lookup, issues, rowIndex, coerceDate, 'invalid_date');

    const candidate: BudgetRow = {
      month: monthResult.value,
      sourceMonthLabel: monthResult.label,
      budget: numberResults.budget.value,
      medicalClaims: numberResults.medicalClaims.value,
      pharmacyClaims: numberResults.pharmacyClaims.value,
      adminFees: numberResults.adminFees.value,
      stopLossPremium: numberResults.stopLossPremium.value,
      stopLossReimbursements: numberResults.stopLossReimbursements.value,
      rxRebates: numberResults.rxRebates.value,
      inpatient: numberResults.inpatient.value,
      outpatient: numberResults.outpatient.value,
      professional: numberResults.professional.value,
      emergency: numberResults.emergency.value,
      domesticClaims: numberResults.domesticClaims.value,
      nonDomesticClaims: numberResults.nonDomesticClaims.value,
      netPaid: numberResults.netPaid.value,
      netCost: numberResults.netCost.value,
      variance: numberResults.variance.value,
      variancePercent: numberResults.variancePercent.value,
      lossRatio: numberResults.lossRatio.value,
      employeeCount: integerResults.employeeCount.value,
      memberCount: integerResults.memberCount.value,
      totalEnrollment: integerResults.totalEnrollment.value,
      createdAt: dateResults.createdAt.value,
      updatedAt: dateResults.updatedAt.value,
    };

    const parsed = budgetRowSchema.safeParse(candidate);
    const validRow = collectSchemaIssues(parsed, issues, rowIndex);
    if (validRow) {
      rows.push(validRow);
    }
  }

  return { rows, fieldMappings, unmappedHeaders, issues };
}

export function normalizeClaimsCSV(dataset: CsvDataset): NormalizationResult<ClaimsRow, typeof CLAIMS_CANONICAL_FIELDS[number]> {
  const issues: NormalizationIssue[] = [];
  const { lookup, fieldMappings, unmappedHeaders } = buildHeaderLookup(
    dataset.headers,
    CLAIMS_FIELD_ALIASES,
    CLAIMS_CANONICAL_FIELDS,
    issues,
  );

  ensureRequiredFields(CLAIMS_REQUIRED_FIELDS, lookup, issues);

  const rows: ClaimsRow[] = [];

  for (const [rowIndex, row] of dataset.rows.entries()) {
    const idResult: StringResult = coerceField(
      'claimId',
      row,
      lookup,
      issues,
      rowIndex,
      coerceString,
      'invalid_string',
      'error',
    );
    const serviceDate = coerceField('serviceDate', row, lookup, issues, rowIndex, coerceDate, 'invalid_date', 'error');

    if (!idResult.value || !serviceDate.value) {
      // Skip entries that cannot provide primary identifiers.
      continue;
    }

    const stringResults = coerceFields(CLAIMS_STRING_FIELDS, row, lookup, issues, rowIndex, coerceString, 'invalid_string');
    const numberResults = coerceFields(CLAIMS_NUMBER_FIELDS, row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const booleanResults = coerceFields(CLAIMS_BOOLEAN_FIELDS, row, lookup, issues, rowIndex, coerceBoolean, 'invalid_boolean');
    const dateResults = coerceFields(CLAIMS_DATE_FIELDS, row, lookup, issues, rowIndex, coerceDate, 'invalid_date');

    const serviceMonth = serviceDate.value.slice(0, 7);

    const candidate: ClaimsRow = {
      claimId: idResult.value,
      claimantNumber: stringResults.claimantNumber.value,
      memberId: stringResults.memberId.value,
      serviceDate: serviceDate.value,
      serviceMonth,
      paidDate: dateResults.paidDate.value,
      status: stringResults.status.value,
      serviceType: stringResults.serviceType.value,
      providerId: stringResults.providerId.value,
      diagnosisCode: stringResults.diagnosisCode.value,
      diagnosisDescription: stringResults.diagnosisDescription.value,
      laymanTerm: stringResults.laymanTerm.value,
      medicalAmount: numberResults.medicalAmount.value,
      pharmacyAmount: numberResults.pharmacyAmount.value,
      totalAmount: numberResults.totalAmount.value,
      domesticFlag: booleanResults.domesticFlag.value,
      planTypeId: stringResults.planTypeId.value,
      diagnosisCategory: stringResults.diagnosisCategory.value,
      hccCode: stringResults.hccCode.value,
      riskScore: numberResults.riskScore.value,
      createdAt: dateResults.createdAt.value,
      updatedAt: dateResults.updatedAt.value,
    };

    const parsed = claimsRowSchema.safeParse(candidate);
    const validRow = collectSchemaIssues(parsed, issues, rowIndex);
    if (validRow) {
      rows.push(validRow);
    }
  }

  return { rows, fieldMappings, unmappedHeaders, issues };
}
