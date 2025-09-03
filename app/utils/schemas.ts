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

  const numericCandidates = ['medical', 'rx', 'total'];
  const sample = data.rows.slice(0, 50);
  for (let i = 0; i < sample.length; i++) {
    const row = sample[i];
    if (!row[claimantHeader] || String(row[claimantHeader]).trim() === '') {
      return { success: false, message: `Row ${i + 1}: missing value in "${claimantHeader}".` };
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

