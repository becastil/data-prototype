'use client';

// Healthcare PHI sanitization utilities

const PHI_HEADER_KEYWORDS = [
  'name',
  'first_name',
  'last_name',
  'full_name',
  'middle_name',
  'ssn',
  'social_security',
  'dob',
  'date_of_birth',
  'birthdate',
  'address',
  'street',
  'city',
  'state',
  'zipcode',
  'zip',
  'email',
  'phone',
  'mobile',
  'cell',
  'mrn',
  'medical_record',
];

// Identifier column names to pseudonymize, not drop
const IDENTIFIER_HEADER_KEYWORDS = [
  'member_id',
  'patient_id',
  'claimant_number',
  'claimant_no',
  'subscriber_id',
  'person_id',
  'enrollee_id',
  'beneficiary_id',
  'user_id',
  'subject_id',
];

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const SSN_REGEX = /\b(?!000|666)[0-8][0-9]{2}[- ]?(?!00)[0-9]{2}[- ]?(?!0000)[0-9]{4}\b/g; // heuristic
const PHONE_REGEX = /(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}/g;

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function includesAny(normalized: string, keywords: string[]) {
  return keywords.some((k) => normalized.includes(k));
}

function redactFreeText(value: string): string {
  if (!value) return value;
  let out = value;
  out = out.replace(EMAIL_REGEX, '[REDACTED_EMAIL]');
  out = out.replace(SSN_REGEX, '[REDACTED_SSN]');
  out = out.replace(PHONE_REGEX, '[REDACTED_PHONE]');
  return out;
}

class SessionPseudonymizer {
  private map = new Map<string, string>();
  private counter = 0;

  getTokenFor(value: string): string {
    if (!value) return '';
    const key = String(value);
    const existing = this.map.get(key);
    if (existing) return existing;
    const token = `P${(++this.counter).toString(36).toUpperCase().padStart(4, '0')}`;
    this.map.set(key, token);
    return token;
  }
}

const sessionPseudonymizer = new SessionPseudonymizer();

export type SanitizedCSV = {
  headers: string[];
  rows: Record<string, string>[];
  droppedHeaders: string[];
  pseudonymizedHeaders: string[];
};

export function sanitizeCSVData(headers: string[], rows: Record<string, string>[]): SanitizedCSV {
  const normalizedHeaders = headers.map(normalizeHeader);

  // Compute which headers to drop vs pseudonymize vs keep
  const toPseudonymize = new Set<string>();
  const toDrop = new Set<string>();

  normalizedHeaders.forEach((nh, idx) => {
    if (includesAny(nh, IDENTIFIER_HEADER_KEYWORDS)) {
      toPseudonymize.add(headers[idx]);
      return;
    }
    if (includesAny(nh, PHI_HEADER_KEYWORDS)) {
      toDrop.add(headers[idx]);
    }
  });

  const keptHeaders = headers.filter((h) => !toDrop.has(h));

  const sanitizedRows = rows.map((row) => {
    const newRow: Record<string, string> = {};
    for (const h of keptHeaders) {
      const val = row[h] ?? '';
      if (toPseudonymize.has(h)) {
        newRow[h] = sessionPseudonymizer.getTokenFor(val);
      } else {
        newRow[h] = redactFreeText(val);
      }
    }
    return newRow;
  });

  return {
    headers: keptHeaders,
    rows: sanitizedRows,
    droppedHeaders: headers.filter((h) => toDrop.has(h)),
    pseudonymizedHeaders: headers.filter((h) => toPseudonymize.has(h)),
  };
}

