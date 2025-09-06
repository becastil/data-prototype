import { z } from 'zod';

export type Row = Record<string, string>;

// Development-only logging utility
const isDev = process.env.NODE_ENV === 'development';
const devLog = (...args: any[]) => isDev && console.log(...args);
const devError = (...args: any[]) => isDev && console.error(...args);
const devWarn = (...args: any[]) => isDev && console.warn(...args);
const devGroup = (label: string) => isDev && console.group(label);
const devGroupEnd = () => isDev && console.groupEnd();

// Standardized validation result interfaces
export interface ValidationSuccess {
  success: true;
}

export interface ValidationError {
  success: false;
  message: string;
  errorCode?: string;
  details?: {
    row?: number;
    column?: string;
    expectedType?: string;
    hasValue?: boolean;
    valueType?: string;
    availableHeaders?: string[];
    searchedFor?: string[];
    zodError?: z.ZodIssue[];
  };
}

export type ValidationResult = ValidationSuccess | ValidationError;

export interface ParsedCSVLike {
  headers: string[];
  rows: Row[];
}

const normalize = (s: string) => s.trim().toLowerCase();

// Enhanced header matching with better flexibility and debugging
const findHeader = (headers: string[], candidates: string[], debug = false): string | undefined => {
  const lowered = headers.map(normalize);
  const candidatesNorm = candidates.map(normalize);

  if (debug) {
    devLog('🔍 Header search:', { 
      availableHeaders: headers, 
      searchingFor: candidates,
      normalizedHeaders: lowered,
      normalizedCandidates: candidatesNorm
    });
  }

  // 1) Exact match first
  for (const c of candidatesNorm) {
    const idx = lowered.findIndex((h) => h === c);
    if (idx !== -1) {
      if (debug) devLog('✅ Exact match found:', headers[idx]);
      return headers[idx];
    }
  }

  // 2) Starts with match
  for (const c of candidatesNorm) {
    for (let i = 0; i < lowered.length; i++) {
      if (lowered[i].startsWith(c) || c.startsWith(lowered[i])) {
        if (debug) devLog('✅ Starts-with match found:', headers[i]);
        return headers[i];
      }
    }
  }

  // 3) Contains match (excluding descriptive fields)
  const excludeWords = new Set([
    'description', 'desc', 'note', 'notes', 'comment', 'comments', 'term', 'terms', 
    'category', 'categories', 'provider', 'diagnosis', 'diagnostic'
  ]);

  const splitWords = (s: string) => s.split(/[^a-z0-9]+/g).filter(Boolean);

  for (const c of candidatesNorm) {
    for (let i = 0; i < lowered.length; i++) {
      const words = new Set(splitWords(lowered[i]));
      if (words.has(c)) {
        // Skip if header contains excluded descriptive words
        const hasExcluded = [...excludeWords].some((w) => words.has(w));
        if (hasExcluded) {
          if (debug) devLog('⚠️ Skipping descriptive match:', headers[i]);
          continue;
        }
        if (debug) devLog('✅ Word match found:', headers[i]);
        return headers[i];
      }
    }
  }

  // 4) Fuzzy contains match for common variations
  for (const c of candidatesNorm) {
    for (let i = 0; i < lowered.length; i++) {
      if (lowered[i].includes(c) || c.includes(lowered[i])) {
        const words = new Set(splitWords(lowered[i]));
        const hasExcluded = [...excludeWords].some((w) => words.has(w));
        if (!hasExcluded) {
          if (debug) devLog('✅ Fuzzy match found:', headers[i]);
          return headers[i];
        }
      }
    }
  }

  if (debug) devLog('❌ No match found for candidates:', candidates);
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

export function validateBudgetData(data: ParsedCSVLike): ValidationResult {
  devGroup('🔍 Budget CSV Validation');
  devLog('Input data:', { headerCount: data.headers.length, rowCount: data.rows.length });
  devLog('Headers found:', data.headers);

  try {
    // Basic structure check via Zod
    const Base = z.object({ headers: z.array(z.string()), rows: z.array(z.record(z.string())) });
    const baseParsed = Base.safeParse(data);
    if (!baseParsed.success) {
      devError('❌ Basic structure validation failed:', baseParsed.error);
      devGroupEnd();
      return { 
        success: false, 
        message: 'Budget CSV structure invalid.',
        errorCode: 'INVALID_STRUCTURE',
        details: { zodError: baseParsed.error.issues }
      };
    }

    const monthHeader = findHeader(data.headers, ['month', 'period'], isDev);
    devLog('🗓️ Month header search result:', monthHeader);
    if (!monthHeader) {
      const suggestion = 'Available headers: ' + data.headers.join(', ');
      devError('❌ No month header found. Available:', data.headers);
      devGroupEnd();
      return { 
        success: false, 
        message: `Budget CSV must include a "month" or "period" column. ${suggestion}`,
        errorCode: 'MISSING_REQUIRED_COLUMN',
        details: { availableHeaders: data.headers, searchedFor: ['month', 'period'] }
      };
    }

    const numericCandidates = ['medical', 'rx', 'total', 'admin', 'stop', 'budget', 'employee'];
    const foundColumns: Record<string, string> = {};
    
    // Log which numeric columns we found
    numericCandidates.forEach(candidate => {
      const found = findHeader(data.headers, [candidate]);
      if (found) foundColumns[candidate] = found;
    });
    devLog('💰 Numeric columns found:', foundColumns);

    // Validate first 50 rows for speed
    const sample = data.rows.slice(0, 50);
    devLog(`🔍 Validating first ${sample.length} rows...`);
    
    for (let i = 0; i < sample.length; i++) {
      const row = sample[i];
      
      // Check month column
      if (!row[monthHeader] || String(row[monthHeader]).trim() === '') {
        devError(`❌ Row ${i + 1}: missing "${monthHeader}" value`);
        devGroupEnd();
        return { 
          success: false, 
          message: `Row ${i + 1}: missing value in "${monthHeader}".`,
          details: { row: i + 1, column: monthHeader, hasValue: !!row[monthHeader] }
        };
      }

      // Check numeric columns
      for (const candidate of numericCandidates) {
        const col = findHeader(Object.keys(row), [candidate]);
        if (!col) continue;
        const v = row[col];
        if (v && !isNumericString(v)) {
          devError(`❌ Row ${i + 1}: "${col}" not numeric:`, v);
          devGroupEnd();
          return { 
            success: false, 
            message: `Row ${i + 1}: "${col}" must be numeric.`,
            details: { row: i + 1, column: col, expectedType: 'numeric', valueType: typeof v }
          };
        }
      }
    }

    devLog('✅ Budget validation successful');
    devGroupEnd();
    return { success: true };
  } catch (error) {
    devError('💥 Unexpected error in budget validation:', error);
    devGroupEnd();
    return { 
      success: false, 
      message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: String(error) }
    };
  }
}

export function validateClaimsData(data: ParsedCSVLike): ValidationResult {
  devGroup('🏥 Claims CSV Validation');
  devLog('Input data:', { headerCount: data.headers.length, rowCount: data.rows.length });
  devLog('Headers found:', data.headers);

  try {
    const Base = z.object({ headers: z.array(z.string()), rows: z.array(z.record(z.string())) });
    const baseParsed = Base.safeParse(data);
    if (!baseParsed.success) {
      devError('❌ Basic structure validation failed:', baseParsed.error);
      devGroupEnd();
      return { 
        success: false, 
        message: 'Claims CSV structure invalid.',
        errorCode: 'INVALID_STRUCTURE',
        details: { zodError: baseParsed.error.issues }
      };
    }

    const claimantHeader = findHeader(data.headers, ['claimant number', 'claim number', 'member id'], isDev);
    devLog('👤 Claimant header search result:', claimantHeader);
    if (!claimantHeader) {
      const suggestion = 'Available headers: ' + data.headers.join(', ');
      devError('❌ No claimant header found. Available:', data.headers);
      devGroupEnd();
      return { 
        success: false, 
        message: `Claims CSV must include a Claimant Number-like column. ${suggestion}`,
        errorCode: 'MISSING_CLAIMANT_COLUMN',
        details: { availableHeaders: data.headers, searchedFor: ['claimant number', 'claim number', 'member id'] }
      };
    }

    const icdHeader = findHeader(data.headers, [
      'icd-10-cm code',
      'icd-10-cm',
      'icd-10',
      'icd10',
      'icd code',
      'icd'
    ], isDev);
    devLog('🩺 ICD header search result:', icdHeader);
    if (!icdHeader) {
      const suggestion = 'Available headers: ' + data.headers.join(', ');
      devError('❌ No ICD header found. Available:', data.headers);
      devGroupEnd();
      return { 
        success: false, 
        message: `Claims CSV must include an ICD-10-CM code column. ${suggestion}`,
        errorCode: 'MISSING_ICD_COLUMN',
        details: { availableHeaders: data.headers, searchedFor: ['icd-10-cm code', 'icd-10-cm', 'icd-10', 'icd10', 'icd code', 'icd'] }
      };
    }

    const serviceTypeHeader = findHeader(data.headers, ['service type', 'service', 'type'], isDev);
    devLog('🏥 Service type header search result:', serviceTypeHeader);
    if (!serviceTypeHeader) {
      const suggestion = 'Available headers: ' + data.headers.join(', ');
      devError('❌ No service type header found. Available:', data.headers);
      devGroupEnd();
      return { 
        success: false, 
        message: `Claims CSV must include a Service Type column. ${suggestion}`,
        errorCode: 'MISSING_SERVICE_TYPE_COLUMN',
        details: { availableHeaders: data.headers, searchedFor: ['service type', 'service', 'type'] }
      };
    }

    // Resolve numeric columns with strict matching to avoid collisions like "Medical Description"
    const medicalCol = findHeader(data.headers, ['medical', 'medical cost', 'medical amount', 'medical total']);
    const rxCol = findHeader(data.headers, ['rx', 'pharmacy']);
    const totalCol = findHeader(data.headers, ['total', 'total amount', 'total cost']);
    
    devLog('💰 Found numeric columns:', { 
      medical: medicalCol, 
      rx: rxCol, 
      total: totalCol 
    });

    const sample = data.rows.slice(0, 50);
    devLog(`🔍 Validating first ${sample.length} rows...`);
    
    for (let i = 0; i < sample.length; i++) {
      const row = sample[i];
      
      // Check claimant number
      if (!row[claimantHeader] || String(row[claimantHeader]).trim() === '') {
        devError(`❌ Row ${i + 1}: missing "${claimantHeader}" value`);
        devGroupEnd();
        return { 
          success: false, 
          message: `Row ${i + 1}: missing value in "${claimantHeader}".`,
          details: { row: i + 1, column: claimantHeader, hasValue: !!row[claimantHeader] }
        };
      }

      // ICD-10 format validation - make this more lenient
      const icdVal = (row[icdHeader] || '').toString().trim();
      if (!icdVal) {
        devError(`❌ Row ${i + 1}: missing ICD-10 code`);
        devGroupEnd();
        return { 
          success: false, 
          message: `Row ${i + 1}: missing ICD-10-CM code in "${icdHeader}".`,
          details: { row: i + 1, column: icdHeader, hasValue: !!icdVal }
        };
      }
      
      // More lenient ICD validation - just check it looks reasonable
      if (icdVal.length < 3 || !/^[A-Z][0-9]/.test(icdVal)) {
        devWarn(`⚠️ Row ${i + 1}: potentially invalid ICD-10 code format:`, icdVal);
        // Don't fail, just warn
      }

      // Service type validation - make more lenient
      const stVal = (row[serviceTypeHeader] || '').toString().trim().toLowerCase();
      if (!stVal) {
        devError(`❌ Row ${i + 1}: missing service type`);
        devGroupEnd();
        return { 
          success: false, 
          message: `Row ${i + 1}: missing Service Type in "${serviceTypeHeader}".`,
          details: { row: i + 1, column: serviceTypeHeader, hasValue: !!row[serviceTypeHeader] }
        };
      }
      
      if (!ALLOWED_SERVICE_TYPES.has(stVal)) {
        devWarn(`⚠️ Row ${i + 1}: unrecognized Service Type "${row[serviceTypeHeader]}" - allowing anyway`);
        // Don't fail for unknown service types, just warn
      }

      const checkNumeric = (col?: string, isRequired = false) => {
        if (!col) return { success: true as const };
        const v = row[col];
        if (!v || v === '') {
          if (isRequired) {
            return { success: false as const, message: `Row ${i + 1}: "${col}" is required but missing.` };
          }
          return { success: true as const }; // Optional column
        }
        if (!isNumericString(v)) {
          return { success: false as const, message: `Row ${i + 1}: "${col}" must be numeric.` };
        }
        const n = parseNumeric(v);
        if (n != null && n < 0) {
          return { success: false as const, message: `Row ${i + 1}: "${col}" cannot be negative.` };
        }
        return { success: true as const };
      };

      const checks = [
        checkNumeric(medicalCol, false), 
        checkNumeric(rxCol, false), 
        checkNumeric(totalCol, true) // Total is required
      ].filter(Boolean) as Array<{ success: boolean; message?: string }>;
      
      for (const c of checks) {
        if (!c.success) {
          devError('❌ Numeric validation failed:', c.message);
          devGroupEnd();
          return c as any;
        }
      }

      // Medical + Rx ~= Total (if all present) - make more lenient
      if (medicalCol && rxCol && totalCol) {
        const med = parseNumeric(row[medicalCol] ?? '0') ?? 0;
        const rx = parseNumeric(row[rxCol] ?? '0') ?? 0;
        const total = parseNumeric(row[totalCol] ?? '0') ?? 0;
        const diff = Math.abs(med + rx - total);
        
        // Allow up to $1 difference instead of 1 cent
        if (diff > 1.0) {
          devWarn(`⚠️ Row ${i + 1}: Total calculation diff = $${diff.toFixed(2)} (Med: ${med}, Rx: ${rx}, Total: ${total})`);
          // Don't fail on calculation differences, just warn
        }
      }
    }

    devLog('✅ Claims validation successful');
    devGroupEnd();
    return { success: true };
  } catch (error) {
    devError('💥 Unexpected error in claims validation:', error);
    devGroupEnd();
    return { 
      success: false, 
      message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: String(error) }
    };
  }
}
