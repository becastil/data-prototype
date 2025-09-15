import type { BudgetRow, ClaimsRow } from '../domain/types';
import {
  BUDGET_CANONICAL_FIELDS,
  BUDGET_FIELD_ALIASES,
  BUDGET_REQUIRED_FIELDS,
  CLAIMS_CANONICAL_FIELDS,
  CLAIMS_FIELD_ALIASES,
  CLAIMS_REQUIRED_FIELDS,
  BooleanResult,
  IntegerResult,
  MonthResult,
  NumberResult,
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
      issues.push({
        type: 'duplicate_header',
        severity: 'warning',
        column: header,
        message: `Column '${header}' also matches canonical field '${String(match.canonical)}' (already mapped to '${existing.header}')`,
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

  dataset.rows.forEach((row, rowIndex) => {
    const monthResult: MonthResult = coerceField('month', row, lookup, issues, rowIndex, coerceMonth, 'invalid_date', 'error');

    if (!monthResult.value) {
      // Without a month we cannot safely keep the row.
      return;
    }

    const budget: NumberResult = coerceField('budget', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const medical: NumberResult = coerceField('medicalClaims', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const pharmacy: NumberResult = coerceField('pharmacyClaims', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const admin: NumberResult = coerceField('adminFees', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const stopLossPremium: NumberResult = coerceField('stopLossPremium', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const stopLossReimb: NumberResult = coerceField('stopLossReimbursements', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const rebates: NumberResult = coerceField('rxRebates', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const inpatient: NumberResult = coerceField('inpatient', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const outpatient: NumberResult = coerceField('outpatient', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const professional: NumberResult = coerceField('professional', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const emergency: NumberResult = coerceField('emergency', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const domestic: NumberResult = coerceField('domesticClaims', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const nonDomestic: NumberResult = coerceField('nonDomesticClaims', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const netPaid: NumberResult = coerceField('netPaid', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const netCost: NumberResult = coerceField('netCost', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const variance: NumberResult = coerceField('variance', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const variancePercent: NumberResult = coerceField('variancePercent', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const lossRatio: NumberResult = coerceField('lossRatio', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const employees: IntegerResult = coerceField('employeeCount', row, lookup, issues, rowIndex, coerceInteger, 'invalid_number');
    const members: IntegerResult = coerceField('memberCount', row, lookup, issues, rowIndex, coerceInteger, 'invalid_number');
    const enrollment: IntegerResult = coerceField('totalEnrollment', row, lookup, issues, rowIndex, coerceInteger, 'invalid_number');
    const createdAt = coerceField('createdAt', row, lookup, issues, rowIndex, coerceDate, 'invalid_date');
    const updatedAt = coerceField('updatedAt', row, lookup, issues, rowIndex, coerceDate, 'invalid_date');

    const candidate: BudgetRow = {
      month: monthResult.value,
      sourceMonthLabel: monthResult.label,
      budget: budget.value as number | null,
      medicalClaims: medical.value as number | null,
      pharmacyClaims: pharmacy.value as number | null,
      adminFees: admin.value as number | null,
      stopLossPremium: stopLossPremium.value as number | null,
      stopLossReimbursements: stopLossReimb.value as number | null,
      rxRebates: rebates.value as number | null,
      inpatient: inpatient.value as number | null,
      outpatient: outpatient.value as number | null,
      professional: professional.value as number | null,
      emergency: emergency.value as number | null,
      domesticClaims: domestic.value as number | null,
      nonDomesticClaims: nonDomestic.value as number | null,
      netPaid: netPaid.value as number | null,
      netCost: netCost.value as number | null,
      variance: variance.value as number | null,
      variancePercent: variancePercent.value as number | null,
      lossRatio: lossRatio.value as number | null,
      employeeCount: employees.value !== null ? Number(employees.value) : null,
      memberCount: members.value !== null ? Number(members.value) : null,
      totalEnrollment: enrollment.value !== null ? Number(enrollment.value) : null,
      createdAt: createdAt.value as string | null,
      updatedAt: updatedAt.value as string | null,
    };

    const parsed = budgetRowSchema.safeParse(candidate);
    if (parsed.success) {
      rows.push(parsed.data);
    } else {
      for (const issue of parsed.error.issues) {
        issues.push({
          type: 'schema_validation_failed',
          severity: 'error',
          column: issue.path.map(String).join('.'),
          rowIndex,
          message: issue.message,
        });
      }
    }
  });

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

  dataset.rows.forEach((row, rowIndex) => {
    const idResult: StringResult = coerceField('claimId', row, lookup, issues, rowIndex, coerceString, 'invalid_string', 'error');
    const serviceDate = coerceField('serviceDate', row, lookup, issues, rowIndex, coerceDate, 'invalid_date', 'error');

    if (!idResult.value || !serviceDate.value) {
      // Skip entries that cannot provide primary identifiers.
      return;
    }

    const paidDate = coerceField('paidDate', row, lookup, issues, rowIndex, coerceDate, 'invalid_date');
    const status = coerceField('status', row, lookup, issues, rowIndex, coerceString, 'invalid_string');
    const serviceType = coerceField('serviceType', row, lookup, issues, rowIndex, coerceString, 'invalid_string');
    const provider = coerceField('providerId', row, lookup, issues, rowIndex, coerceString, 'invalid_string');
    const diagnosisCode = coerceField('diagnosisCode', row, lookup, issues, rowIndex, coerceString, 'invalid_string');
    const diagnosisDescription = coerceField('diagnosisDescription', row, lookup, issues, rowIndex, coerceString, 'invalid_string');
    const layman = coerceField('laymanTerm', row, lookup, issues, rowIndex, coerceString, 'invalid_string');
    const medical: NumberResult = coerceField('medicalAmount', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const pharmacy: NumberResult = coerceField('pharmacyAmount', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const total: NumberResult = coerceField('totalAmount', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const domestic: BooleanResult = coerceField('domesticFlag', row, lookup, issues, rowIndex, coerceBoolean, 'invalid_boolean');
    const planType = coerceField('planTypeId', row, lookup, issues, rowIndex, coerceString, 'invalid_string');
    const diagnosisCategory = coerceField('diagnosisCategory', row, lookup, issues, rowIndex, coerceString, 'invalid_string');
    const hccCode = coerceField('hccCode', row, lookup, issues, rowIndex, coerceString, 'invalid_string');
    const riskScore: NumberResult = coerceField('riskScore', row, lookup, issues, rowIndex, coerceNumber, 'invalid_number');
    const claimant = coerceField('claimantNumber', row, lookup, issues, rowIndex, coerceString, 'invalid_string');
    const memberId = coerceField('memberId', row, lookup, issues, rowIndex, coerceString, 'invalid_string');
    const createdAt = coerceField('createdAt', row, lookup, issues, rowIndex, coerceDate, 'invalid_date');
    const updatedAt = coerceField('updatedAt', row, lookup, issues, rowIndex, coerceDate, 'invalid_date');

    const serviceMonth = (serviceDate.value as string).slice(0, 7);

    const candidate: ClaimsRow = {
      claimId: idResult.value,
      claimantNumber: claimant.value,
      memberId: memberId.value,
      serviceDate: serviceDate.value as string,
      serviceMonth,
      paidDate: paidDate.value as string | null,
      status: status.value,
      serviceType: serviceType.value,
      providerId: provider.value,
      diagnosisCode: diagnosisCode.value,
      diagnosisDescription: diagnosisDescription.value,
      laymanTerm: layman.value,
      medicalAmount: medical.value as number | null,
      pharmacyAmount: pharmacy.value as number | null,
      totalAmount: total.value as number | null,
      domesticFlag: domestic.value,
      planTypeId: planType.value,
      diagnosisCategory: diagnosisCategory.value,
      hccCode: hccCode.value,
      riskScore: riskScore.value as number | null,
      createdAt: createdAt.value as string | null,
      updatedAt: updatedAt.value as string | null,
    };

    const parsed = claimsRowSchema.safeParse(candidate);
    if (parsed.success) {
      rows.push(parsed.data);
    } else {
      for (const issue of parsed.error.issues) {
        issues.push({
          type: 'schema_validation_failed',
          severity: 'error',
          column: issue.path.map(String).join('.'),
          rowIndex,
          message: issue.message,
        });
      }
    }
  });

  return { rows, fieldMappings, unmappedHeaders, issues };
}
