// touched by PR-008: UI polish for upload workflow
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Development-only logging utility
const isDev = process.env.NODE_ENV === 'development';
const devLog = (...args: any[]) => isDev && console.log(...args);
const devError = (...args: any[]) => isDev && console.error(...args);
import type { ParsedCSVData } from './CSVLoader';
import { CheckCircle, Columns3, FileSpreadsheet, Loader2, Table2 } from 'lucide-react';
import { ModernCard, ModernMetric, ModernUpload } from '@components/index';
import { cn } from '@/app/lib/utils';
import { validateBudgetData, validateClaimsData } from '@/app/utils/schemas';
import { analyzeHeaders, type HeaderRequirement } from '@/app/utils/headers';

interface DualCSVLoaderProps {
  onBothFilesLoaded: (budgetData: ParsedCSVData, claimsData: ParsedCSVData) => void;
  onError: (error: string) => void;
}

const toastTone: Record<'error' | 'info' | 'success', string> = {
  error: 'border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]',
  info: 'border-[var(--info)] bg-[var(--info-soft)] text-[var(--info)]',
  success: 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]',
};

const DualCSVLoader: React.FC<DualCSVLoaderProps> = ({ onBothFilesLoaded, onError }) => {
  const [budgetData, setBudgetData] = React.useState<ParsedCSVData | null>(null);
  const [claimsData, setClaimsData] = React.useState<ParsedCSVData | null>(null);
  const [toasts, setToasts] = React.useState<Array<{ id: string; type: 'error' | 'info' | 'success'; title: string; message?: string; details?: string[] }>>([]);

  const pushToast = (t: { type: 'error' | 'info' | 'success'; title: string; message?: string; details?: string[] }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, ...t }]);
    // Auto-dismiss after 6s for non-error; errors persist longer (12s)
    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, t.type === 'error' ? 12000 : 6000);
    return () => clearTimeout(timeout);
  };

  // Call onBothFilesLoaded exactly once when both files are present
  const submittedRef = React.useRef(false);
  React.useEffect(() => {
    if (!submittedRef.current && budgetData && claimsData) {
      // Validate both datasets before proceeding
      devLog('[CSV VALIDATION] Starting detailed validation...');
      const budgetCheck = validateBudgetData({ headers: budgetData.headers, rows: budgetData.rows });
      devLog('[CSV VALIDATION] Budget result:', budgetCheck);
      
      if (budgetCheck.success !== true) {
        devError('[CSV VALIDATION] Budget validation failed:', budgetCheck);
        const details = budgetCheck.details ? [
          `Validation failed at row ${budgetCheck.details.row || 'unknown'} in column '${budgetCheck.details.column || 'unknown'}'`
        ] : [];
        pushToast({ 
          type: 'error', 
          title: 'Budget CSV Validation Failed', 
          message: budgetCheck.message,
          details
        });
        onError(budgetCheck.message);
        return;
      }

      const claimsCheck = validateClaimsData({ headers: claimsData.headers, rows: claimsData.rows });
      devLog('[CSV VALIDATION] Claims result:', claimsCheck);
      
      if (claimsCheck.success !== true) {
        devError('[CSV VALIDATION] Claims validation failed:', claimsCheck);
        const details = claimsCheck.details ? [
          `Validation failed at row ${claimsCheck.details.row || 'unknown'} in column '${claimsCheck.details.column || 'unknown'}'`
        ] : [];
        pushToast({ 
          type: 'error', 
          title: 'Claims CSV Validation Failed', 
          message: claimsCheck.message,
          details
        });
        onError(claimsCheck.message);
        return;
      }

      submittedRef.current = true;
      devLog('[CSV FLOW] Both files validated. Invoking onBothFilesLoaded');
      onBothFilesLoaded(budgetData, claimsData);
    }
  }, [budgetData, claimsData, onBothFilesLoaded, onError]);

  const handleBudgetLoaded = (data: ParsedCSVData) => {
    // Validate budget data columns
    const required: HeaderRequirement[] = [
      { name: 'month', aliases: ['month', 'period'] },
    ];
    const analysis = analyzeHeaders(data.headers, required);
    devLog('[CSV HEADERS] Budget analysis found:', analysis.found, 'missing:', analysis.missing);
    const hasRequiredColumns = analysis.missing.length === 0;
    
    if (!hasRequiredColumns) {
      const msg = `Budget CSV missing required column(s): ${analysis.missing.join(', ')}`;
      devError('[CSV VALIDATION]', msg);
      pushToast({ type: 'error', title: 'Missing Columns in Budget CSV', message: msg, details: [
        `Found ${analysis.found.length} valid columns of ${data.headers.length} total`
      ]});
      onError('Budget CSV must include a month or period column');
      return;
    }
    
    setBudgetData(data);
  };

  const handleClaimsLoaded = (data: ParsedCSVData) => {
    // Validate claims data columns
    const required: HeaderRequirement[] = [
      { name: 'claimant number', aliases: ['claimant number', 'claim number', 'member id', 'claimant'] },
      { name: 'service type', aliases: ['service type', 'service', 'type'] },
      { name: 'icd-10-cm code', aliases: ['icd-10-cm code', 'icd-10-cm', 'icd-10', 'icd10', 'icd code', 'icd'] },
      { name: 'medical', aliases: ['medical', 'medical cost', 'medical amount', 'med'] },
      { name: 'rx', aliases: ['rx', 'pharmacy', 'drug', 'prescription'] },
      { name: 'total', aliases: ['total', 'total cost', 'amount'] },
    ];
    const analysis = analyzeHeaders(data.headers, required);
    const missingColumns = analysis.missing;
    devLog('[CSV HEADERS] Claims analysis found:', analysis.found, 'missing:', analysis.missing);
    
    if (missingColumns.length > 0) {
      devError('[CSV VALIDATION] Claims missing required columns:', missingColumns);
      const msg = `Claims CSV missing required column(s): ${missingColumns.join(', ')}`;
      pushToast({ type: 'error', title: 'Missing Columns in Claims CSV', message: msg, details: [
        `Found ${analysis.found.length} valid columns of ${data.headers.length} total`,
        `Missing: ${missingColumns.length} required columns`
      ]});
      onError(`Claims CSV missing required columns: ${missingColumns.join(', ')}`);
      return;
    }
    
    setClaimsData(data);
  };

  const waitingFor = budgetData ? 'claims' : 'budget';
  const bothLoaded = Boolean(budgetData && claimsData);

  return (
    <div className="relative min-h-screen bg-[var(--background)] px-6 py-16 text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[var(--accent-soft)]/70 via-transparent to-transparent" />

      <div className="fixed right-6 top-6 z-50 flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={cn(
                'max-w-sm rounded-2xl border px-5 py-4 shadow-subtle backdrop-blur-sm',
                toastTone[t.type]
              )}
            >
              <div className="text-sm font-semibold">{t.title}</div>
              {t.message ? (
                <div className="mt-1 text-xs text-[var(--foreground-muted)]">{t.message}</div>
              ) : null}
              {t.details && t.details.length > 0 ? (
                <ul className="mt-2 space-y-1 text-[11px] text-[var(--foreground-subtle)]">
                  {t.details.map((d, i) => (
                    <li key={i}>• {d}</li>
                  ))}
                </ul>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12">
        <ModernCard tone="accent" padding="lg" glow className="space-y-6" eyebrow="Upload Center">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] md:text-4xl">
                Healthcare Data Intake
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--foreground-muted)]">
                Upload your monthly budget and detailed claims files. We automate PHI scrubbing, numeric validation,
                and schema checks so financial modeling stays accurate and compliant.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)]/70 px-5 py-4 text-xs leading-relaxed text-[var(--foreground-subtle)]">
              <p className="mb-2 text-[var(--foreground)] font-semibold">Upload Requirements</p>
              <ul className="space-y-1">
                <li>• CSV format up to 10&nbsp;MB per file</li>
                <li>• Thousands separators and currency symbols are cleaned automatically</li>
                <li>• Identifiers are pseudonymized in-memory (no PHI persists)</li>
              </ul>
            </div>
          </div>
        </ModernCard>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}>
            <ModernUpload
              tone="accent"
              title="Budget, Enrollment & Claims Summary"
              description="Bring in your aggregated monthly totals so the dashboard can benchmark medical, pharmacy, and fixed costs."
              helper="Include month or period columns plus enrollment, medical, pharmacy, and total claim spend. We'll align headers automatically."
              sampleLink={{ href: '/sample-budget.csv', label: 'Sample budget CSV' }}
              icon={<FileSpreadsheet className="h-6 w-6" aria-hidden />}
              onDataLoaded={handleBudgetLoaded}
              onError={onError}
              maxFileSize={10 * 1024 * 1024}
              footer={(
                <div className="space-y-3 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)]/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--foreground-subtle)]">Required columns</p>
                  <ul className="space-y-2 text-sm text-[var(--foreground-muted)]">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 text-[var(--accent)]" aria-hidden />
                      <span><strong>month</strong> or <strong>period</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 text-[var(--accent)]" aria-hidden />
                      <span><strong>Employee Count</strong> and <strong>Member Count</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 text-[var(--accent)]" aria-hidden />
                      <span><strong>Medical Claims</strong> and <strong>Pharmacy Claims</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 text-[var(--accent)]" aria-hidden />
                      <span><strong>Total Claims</strong> or <strong>Budget</strong> totals</span>
                    </li>
                  </ul>
                  <p className="rounded-xl bg-[var(--accent-soft)]/40 px-3 py-2 text-xs leading-relaxed text-[var(--foreground-subtle)]">
                    <strong>Tip:</strong> Keep reimbursement and fixed cost fields separate—those feed PEPM and loss ratio metrics.
                  </p>
                </div>
              )}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}>
            <ModernUpload
              tone="muted"
              title="Detailed Claims Experience"
              description="Optional row-level claims unlocks risk stratification, ICD pattern detection, and service line analytics."
              helper="Include claimant identifiers, service type, ICD-10 codes, and cost fields for medical, Rx, and totals."
              sampleLink={{ href: '/sample-claims.csv', label: 'Sample claims CSV' }}
              icon={<Columns3 className="h-6 w-6" aria-hidden />}
              onDataLoaded={handleClaimsLoaded}
              onError={onError}
              maxFileSize={10 * 1024 * 1024}
              footer={(
                <div className="space-y-3 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)]/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--foreground-subtle)]">Required columns</p>
                  <ul className="space-y-2 text-sm text-[var(--foreground-muted)]">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 text-[var(--accent)]" aria-hidden />
                      <span><strong>Claimant Number</strong> or similar identifier</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 text-[var(--accent)]" aria-hidden />
                      <span><strong>Service Type</strong> and <strong>ICD-10-CM Code</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 text-[var(--accent)]" aria-hidden />
                      <span><strong>Medical</strong>, <strong>Rx</strong> and <strong>Total</strong> cost fields</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 text-[var(--accent)]" aria-hidden />
                      <span>Descriptive columns (medical description, layman span) as available</span>
                    </li>
                  </ul>
                  <p className="rounded-xl bg-[var(--warning-soft)]/40 px-3 py-2 text-xs leading-relaxed text-[var(--foreground-subtle)]">
                    <strong>Optional:</strong> Include stop-loss reimbursements or member segments for enhanced cohort analytics.
                  </p>
                </div>
              )}
            />
          </motion.div>
        </div>

        {(budgetData || claimsData) && (
          <ModernCard tone="muted" padding="lg" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Upload status</h3>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {bothLoaded ? 'Both datasets have been validated. You are ready to explore the dashboard.' : `Waiting for ${waitingFor} data to finish ingestion.`}
                </p>
              </div>
              {bothLoaded ? (
                <motion.span
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent)]"
                >
                  <CheckCircle className="h-4 w-4" aria-hidden />
                  Ready to analyze
                </motion.span>
              ) : (
                <motion.span
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 rounded-full border border-dashed border-[var(--surface-border)] px-4 py-2 text-sm text-[var(--foreground-muted)]"
                >
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Awaiting {waitingFor} file
                </motion.span>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {budgetData ? (
                <ModernMetric
                  label="Budget file"
                  value={`${budgetData.rowCount.toLocaleString()} rows`}
                  secondary={`${budgetData.headers.length} columns parsed`}
                  helper={`File: ${budgetData.fileName}`}
                  icon={<Table2 className="h-5 w-5" aria-hidden />}
                  accent="info"
                  trend={{ value: 'Validated', direction: 'neutral', icon: <CheckCircle className="h-4 w-4" aria-hidden /> }}
                  tone="translucent"
                  padding="md"
                />
              ) : (
                <ModernCard tone="translucent" padding="md" className="flex h-full flex-col justify-center text-sm text-[var(--foreground-muted)]">
                  <p>No budget file yet.</p>
                </ModernCard>
              )}

              {claimsData ? (
                <ModernMetric
                  label="Claims file"
                  value={`${claimsData.rowCount.toLocaleString()} rows`}
                  secondary={`${claimsData.headers.length} columns parsed`}
                  helper={`File: ${claimsData.fileName}`}
                  icon={<Columns3 className="h-5 w-5" aria-hidden />}
                  accent="accent"
                  trend={{ value: 'Validated', direction: 'neutral', icon: <CheckCircle className="h-4 w-4" aria-hidden /> }}
                  tone="translucent"
                  padding="md"
                />
              ) : (
                <ModernCard tone="translucent" padding="md" className="flex h-full flex-col justify-center text-sm text-[var(--foreground-muted)]">
                  <p>No claims file yet.</p>
                </ModernCard>
              )}
            </div>
          </ModernCard>
        )}
      </div>
    </div>
  );
};

export default DualCSVLoader;
