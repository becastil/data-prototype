import { z } from 'zod';

export type Row = Record<string, string>;

export interface ParsedCSVLike {
  headers: string[];
  rows: Row[];
}

const normalize = (s: string) => s.trim().toLowerCase();

const findHeader = (headers: string[], candidates: string[]): string | undefined => {
  const lowered = headers.map(normalize);
  for (const c of candidates.map(normalize)) {
    const idx = lowered.findIndex((h) => h.includes(c));
    if (idx !== -1) return headers[idx];
  }
  return undefined;
};

const isNumericString = (value: string) => {
  if (value == null) return false;
  const cleaned = value.replace(/[$,\s]/g, '');
  if (cleaned === '') return false;
  const n = Number(cleaned);
  return Number.isFinite(n);
};

const parseNumeric = (value: string): number | null => {
  if (!isNumericString(value)) return null;
  const cleaned = value.replace(/[$,\s]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

// ICD-10-CM: A00, A00.0, A00.00, Z00.00, etc.
// Allow letter A-Z (excluding U typically, but allow for completeness), two digits, optional dot and 1-4 alphanumerics
const ICD10_REGEX = /^[A-Z][0-9]{2}(?:\.[A-Z0-9]{1,4})?$/i;

// Allowable service types (normalized)
const ALLOWED_SERVICE_TYPES = new Set(
  [
    'professional',
    'outpatient',
    'inpatient',
    'emergency',
    'pharmacy',
    'lab',
    'radiology',
    'surgery',
    'therapy',
    'preventive',
    'specialty',
    'mental health',
    'dental',
    'vision',
    'dme',
    'home health',
  ].map((s) => s.toLowerCase())
);

export function validateBudgetData(data: ParsedCSVLike): { success: true } | { success: false; message: string } {
  // Basic structure check via Zod
  const Base = z.object({ headers: z.array(z.string()), rows: z.array(z.record(z.string())) });
  const baseParsed = Base.safeParse(data);
  if (!baseParsed.success) {
    return { success: false, message: 'Budget CSV structure invalid.' };
  }

  const monthHeader = findHeader(data.headers, ['month', 'period']);
  if (!monthHeader) {
    return { success: false, message: 'Budget CSV must include a "month" or "period" column.' };
  }

  const numericCandidates = ['medical', 'rx', 'total', 'admin', 'stop', 'budget', 'employee'];

  // Validate first 50 rows for speed
  const sample = data.rows.slice(0, 50);
  for (let i = 0; i < sample.length; i++) {
    const row = sample[i];
    if (!row[monthHeader] || String(row[monthHeader]).trim() === '') {
      return { success: false, message: `Row ${i + 1}: missing value in "${monthHeader}".` };
    }

    for (const candidate of numericCandidates) {
      const col = findHeader(Object.keys(row), [candidate]);
      if (!col) continue;
      const v = row[col];
      if (v && !isNumericString(v)) {
        return { success: false, message: `Row ${i + 1}: "${col}" must be numeric.` };
      }
    }
  }

  return { success: true };
}

export function validateClaimsData(data: ParsedCSVLike): { success: true } | { success: false; message: string } {
  const Base = z.object({ headers: z.array(z.string()), rows: z.array(z.record(z.string())) });
  const baseParsed = Base.safeParse(data);
  if (!baseParsed.success) {
    return { success: false, message: 'Claims CSV structure invalid.' };
  }

  const claimantHeader = findHeader(data.headers, ['claimant number', 'claim number', 'member id']);
  if (!claimantHeader) {
    return { success: false, message: 'Claims CSV must include a Claimant Number-like column.' };
  }

  const icdHeader = findHeader(data.headers, [
    'icd-10-cm code',
    'icd-10-cm',
    'icd-10',
    'icd10',
    'icd code',
    'icd'
  ]);
  if (!icdHeader) {
    return { success: false, message: 'Claims CSV must include an ICD-10-CM code column.' };
  }

  const serviceTypeHeader = findHeader(data.headers, ['service type', 'service', 'type']);
  if (!serviceTypeHeader) {
    return { success: false, message: 'Claims CSV must include a Service Type column.' };
  }

  const numericCandidates = ['medical', 'rx', 'total'];
  const sample = data.rows.slice(0, 50);
  for (let i = 0; i < sample.length; i++) {
    const row = sample[i];
    if (!row[claimantHeader] || String(row[claimantHeader]).trim() === '') {
      return { success: false, message: `Row ${i + 1}: missing value in "${claimantHeader}".` };
    }

    // ICD-10 format validation
    const icdVal = (row[icdHeader] || '').toString().trim();
    if (!icdVal || !ICD10_REGEX.test(icdVal)) {
      return { success: false, message: `Row ${i + 1}: invalid ICD-10-CM code format in "${icdHeader}" (value: "${icdVal}").` };
    }

    // Service type validation
    const stVal = (row[serviceTypeHeader] || '').toString().trim().toLowerCase();
    if (!stVal || !ALLOWED_SERVICE_TYPES.has(stVal)) {
      return { success: false, message: `Row ${i + 1}: unrecognized Service Type "${row[serviceTypeHeader] ?? ''}".` };
    }

    for (const candidate of numericCandidates) {
      const col = findHeader(Object.keys(row), [candidate]);
      if (!col) continue;
      const v = row[col];
      if (v && !isNumericString(v)) {
        return { success: false, message: `Row ${i + 1}: "${col}" must be numeric.` };
      }
      const n = v ? parseNumeric(v) : 0;
      if (n != null && n < 0) {
        return { success: false, message: `Row ${i + 1}: "${col}" cannot be negative.` };
      }
    }

    // Medical + Rx ~= Total (if all present)
    const medicalCol = findHeader(Object.keys(row), ['medical']);
    const rxCol = findHeader(Object.keys(row), ['rx']);
    const totalCol = findHeader(Object.keys(row), ['total']);
    if (medicalCol && rxCol && totalCol) {
      const med = parseNumeric(row[medicalCol] ?? '0') ?? 0;
      const rx = parseNumeric(row[rxCol] ?? '0') ?? 0;
      const total = parseNumeric(row[totalCol] ?? '0') ?? 0;
      const diff = Math.abs(med + rx - total);
      if (diff > 0.01) {
        return { success: false, message: `Row ${i + 1}: Total ("${totalCol}") should equal Medical + Rx (diff=${diff.toFixed(2)}).` };
      }
    }
  }

  return { success: true };
}
