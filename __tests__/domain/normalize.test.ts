import { describe, expect, it } from 'vitest';
import { normalizeBudgetCSV, normalizeClaimsCSV } from '../../src/services/normalize';
import type { CsvDataset } from '../../src/services/normalize';

const toDataset = (headers: string[], rows: Array<Record<string, unknown>>): CsvDataset => ({ headers, rows });

describe('normalizeBudgetCSV', () => {
  it('maps header variants into canonical fields with clean values', () => {
    const headers = [
      'Month',
      'Total Budget',
      'Medical',
      'Rx Claims',
      'Admin Fee # 1',
      'Stop Loss Fees',
      'Stop Loss Reimb',
      'Rx Rebates',
      'Employee Count',
      'Member count',
      'created_at'
    ];

    const rows = [
      {
        Month: 'Aug 2023',
        'Total Budget': '$650,000.42',
        Medical: '1,200,500.10',
        'Rx Claims': '350,000',
        'Admin Fee # 1': '25,000',
        'Stop Loss Fees': '15,000',
        'Stop Loss Reimb': '5,500',
        'Rx Rebates': '($1,200)',
        'Employee Count': '500',
        'Member count': '1,200',
        created_at: '2023-08-31 10:00:00'
      }
    ];

    const result = normalizeBudgetCSV(toDataset(headers, rows));

    expect(result.rows).toHaveLength(1);
    const [normalized] = result.rows;
    expect(normalized.month).toBe('2023-08');
    expect(normalized.sourceMonthLabel).toBe('Aug 2023');
    expect(normalized.budget).toBeCloseTo(650000.42, 2);
    expect(normalized.medicalClaims).toBeCloseTo(1200500.1, 2);
    expect(normalized.rxRebates).toBeCloseTo(-1200, 2);
    expect(normalized.employeeCount).toBe(500);
    expect(normalized.memberCount).toBe(1200);
    expect(normalized.createdAt).toBe('2023-08-31');

    const budgetMapping = result.fieldMappings.find((m) => m.canonicalField === 'budget');
    expect(budgetMapping?.header).toBe('Total Budget');
    const medicalMapping = result.fieldMappings.find((m) => m.canonicalField === 'medicalClaims');
    expect(medicalMapping?.header).toBe('Medical');
    expect(result.issues).toHaveLength(0);
  });

  it('sanitizes dirty numerics and reports invalid cells', () => {
    const headers = ['month', 'Budget', 'Medical Claims'];
    const rows = [
      {
        month: '2023-09-01',
        Budget: '($1,200.50)',
        'Medical Claims': 'N/A'
      }
    ];

    const result = normalizeBudgetCSV(toDataset(headers, rows));

    expect(result.rows).toHaveLength(1);
    const [normalized] = result.rows;
    expect(normalized.month).toBe('2023-09');
    expect(normalized.budget).toBeCloseTo(-1200.5, 3);
    expect(normalized.medicalClaims).toBeNull();
    expect(result.issues.some((issue) => issue.type === 'invalid_number' && issue.column === 'Medical Claims')).toBe(true);
  });
});

describe('normalizeClaimsCSV', () => {
  it('normalizes claim rows and derives service month', () => {
    const headers = [
      'Claim ID',
      'Service Date',
      'Medical',
      'Rx',
      'Total',
      'Domestic Flag',
      'diagnosis_description'
    ];

    const rows = [
      {
        'Claim ID': 'CLM1000000',
        'Service Date': '2023-08-18 00:00:00',
        Medical: '446.26',
        Rx: '0',
        Total: '446.26',
        'Domestic Flag': 'TRUE',
        diagnosis_description: 'COPD with acute lower respiratory infection'
      }
    ];

    const result = normalizeClaimsCSV(toDataset(headers, rows));

    expect(result.rows).toHaveLength(1);
    const [normalized] = result.rows;
    expect(normalized.claimId).toBe('CLM1000000');
    expect(normalized.serviceDate).toBe('2023-08-18');
    expect(normalized.serviceMonth).toBe('2023-08');
    expect(normalized.medicalAmount).toBeCloseTo(446.26, 2);
    expect(normalized.totalAmount).toBeCloseTo(446.26, 2);
    expect(normalized.domesticFlag).toBe(true);
    expect(normalized.diagnosisDescription).toBe('COPD with acute lower respiratory infection');

    const idMapping = result.fieldMappings.find((m) => m.canonicalField === 'claimId');
    expect(idMapping?.header).toBe('Claim ID');
    expect(result.issues).toHaveLength(0);
  });
});
