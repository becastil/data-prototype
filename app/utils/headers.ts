'use client';

// Utilities for flexible, case-insensitive header matching and diagnostics

export const normalizeHeader = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

export type HeaderRequirement = {
  name: string; // logical name, e.g., 'service type'
  aliases: string[]; // acceptable variants, e.g., ['service type', 'service', 'type']
};

export type HeaderAnalysis = {
  found: Record<string, string>; // requirement name -> actual header
  missing: string[]; // requirement names missing
  headersNormalized: Array<{ original: string; normalized: string }>; // diagnostics
};

export function analyzeHeaders(headers: string[], requirements: HeaderRequirement[]): HeaderAnalysis {
  const normHeaders = headers.map((h) => ({ original: h, normalized: normalizeHeader(h) }));
  const found: Record<string, string> = {};
  const missing: string[] = [];

  for (const req of requirements) {
    const aliasNorms = req.aliases.map(normalizeHeader);
    const match = normHeaders.find((h) => aliasNorms.some((a) => h.normalized.includes(a)));
    if (match) {
      found[req.name] = match.original;
    } else {
      missing.push(req.name);
    }
  }

  return { found, missing, headersNormalized: normHeaders };
}

