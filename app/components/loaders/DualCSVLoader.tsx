// touched by PR-008: UI polish for upload workflow
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Development-only logging utility
const isDev = process.env.NODE_ENV === 'development';
const devLog = (...args: any[]) => isDev && console.log(...args);
const devError = (...args: any[]) => isDev && console.error(...args);
import CSVLoader, { type ParsedCSVData } from './CSVLoader';
import { CheckCircle, Info, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { validateBudgetData, validateClaimsData } from '@/app/utils/schemas';
import { analyzeHeaders, type HeaderRequirement } from '@/app/utils/headers';

interface DualCSVLoaderProps {
  onBothFilesLoaded: (budgetData: ParsedCSVData, claimsData: ParsedCSVData) => void;
  onError: (error: string) => void;
}

const toastTone: Record<'error' | 'info' | 'success', string> = {
  error: 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]',
  info: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]',
  success: 'border-[#bbf7d0] bg-[#ecfdf5] text-[#047857]',
};

type UploadType = 'budget' | 'claims';

const uploadConfigs: Record<UploadType, {
  label: string;
  helper: string;
  summary: string;
  details: string[];
  sampleHref: string;
  sampleLabel: string;
}> = {
  budget: {
    label: 'Budget CSV',
    helper: 'Monthly totals and headcounts keep projections honest.',
    summary: 'Include a month column plus employee and member counts so trend lines stay accurate.',
    details: [
      'Month or period column (e.g., 2024-01)',
      'Employee and member totals for each row',
      'Budget or actual spend columns to chart performance',
    ],
    sampleHref: '/sample-budget.csv',
    sampleLabel: 'Download budget sample CSV',
  },
  claims: {
    label: 'Claims CSV',
    helper: 'Add optional claims detail to unlock granular analytics.',
    summary: 'Add claimant identifiers, service categories, and spend amounts to map utilization.',
    details: [
      'Claimant or subscriber identifier per row',
      'Service type along with ICD-10 code when available',
      'Medical and pharmacy spend columns for totals',
    ],
    sampleHref: '/sample-claims.csv',
    sampleLabel: 'Download claims sample CSV',
  },
};

const uploadOrder: UploadType[] = ['budget', 'claims'];

const DualCSVLoader: React.FC<DualCSVLoaderProps> = ({ onBothFilesLoaded, onError }) => {
  const [budgetData, setBudgetData] = React.useState<ParsedCSVData | null>(null);
  const [claimsData, setClaimsData] = React.useState<ParsedCSVData | null>(null);
  const [toasts, setToasts] = React.useState<Array<{ id: string; type: 'error' | 'info' | 'success'; title: string; message?: string; details?: string[] }>>([]);
  const [activeUpload, setActiveUpload] = React.useState<UploadType>('budget');
  const [infoOpen, setInfoOpen] = React.useState(false);

  const pushToast = (t: { type: 'error' | 'info' | 'success'; title: string; message?: string; details?: string[] }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, ...t }]);
    // Auto-dismiss after 6s for non-error; errors persist longer (12s)
    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, t.type === 'error' ? 12000 : 6000);
    return () => clearTimeout(timeout);
  };

  React.useEffect(() => {
    setInfoOpen(false);
  }, [activeUpload]);

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
    setActiveUpload('claims');
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

  const handleFileLoaded = (data: ParsedCSVData) => {
    if (activeUpload === 'budget') {
      handleBudgetLoaded(data);
      return;
    }
    handleClaimsLoaded(data);
  };

  const waitingFor = budgetData ? 'claims' : 'budget';
  const bothLoaded = Boolean(budgetData && claimsData);
  const currentConfig = uploadConfigs[activeUpload];
  const budgetReady = Boolean(budgetData);
  const claimsReady = Boolean(claimsData);
  const waitingLabel = waitingFor === 'budget' ? 'budget CSV' : 'claims CSV';

  return (
    <div className="relative min-h-screen bg-[var(--background)] py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white to-transparent" />

      <div className="fixed right-6 top-6 z-50 flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={cn(
                'max-w-sm rounded-2xl border bg-white/80 px-5 py-4 shadow-[0_4px_12px_rgba(15,23,42,0.08)] backdrop-blur',
                toastTone[t.type]
              )}
            >
              <div className="text-sm font-semibold text-slate-900">{t.title}</div>
              {t.message ? (
                <div className="mt-1 text-xs text-slate-600 leading-relaxed">{t.message}</div>
              ) : null}
              {t.details && t.details.length > 0 ? (
                <ul className="mt-2 space-y-1 text-[11px] text-slate-500 leading-relaxed">
                  {t.details.map((d, i) => (
                    <li key={i}>• {d}</li>
                  ))}
                </ul>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-16 px-6">
        <section className="mx-auto w-full max-w-3xl space-y-8 text-center sm:text-left">
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--foreground-subtle)] sm:justify-between">
                  <span>Step 1 of 3</span>
                  <span className="tracking-normal text-[var(--foreground-subtle)]/80">Upload data</span>
                </div>
                <div className="h-[3px] w-full rounded-full bg-slate-200">
                  <div className="h-[3px] w-1/3 rounded-full bg-[var(--accent)]" />
                </div>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
                Upload budgets & enrollments
              </h1>
              <p className="text-base leading-relaxed text-[var(--foreground-muted)] sm:text-lg">
                Drag & drop your CSVs to get started. We keep the visuals quiet so attention stays on the data.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl space-y-10">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {uploadOrder.map((key) => {
              const config = uploadConfigs[key];
              const isActive = activeUpload === key;
              const isComplete = key === 'budget' ? budgetReady : claimsReady;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveUpload(key)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-soft)] hover:-translate-y-0.5',
                    isActive
                      ? 'bg-[var(--accent)] text-[var(--button-primary-text)] shadow-[0_20px_48px_-28px_rgba(37,99,235,0.6)]'
                      : 'bg-transparent text-[var(--foreground-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]'
                  )}
                  aria-pressed={isActive}
                >
                  <span>{config.label}</span>
                  {isComplete ? <CheckCircle className="h-4 w-4" aria-hidden /> : null}
                </button>
              );
            })}
          </div>

          <p className="text-center text-sm text-[var(--foreground-muted)] sm:text-left">
            {currentConfig.helper}
          </p>

          <CSVLoader
            onDataLoaded={handleFileLoaded}
            onError={onError}
            maxFileSize={10 * 1024 * 1024}
            className="mx-auto max-w-2xl"
          />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={currentConfig.sampleHref}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent)] hover:text-[var(--button-primary-text)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-soft)]"
            >
              <Download className="h-4 w-4" aria-hidden />
              {currentConfig.sampleLabel}
            </a>
            <button
              type="button"
              onClick={() => setInfoOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[var(--foreground-muted)] transition-all duration-200 hover:-translate-y-0.5 hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-soft)]"
              aria-expanded={infoOpen}
            >
              <Info className="h-4 w-4" aria-hidden />
              {infoOpen ? 'Hide details' : 'Need details?'}
              {infoOpen ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
            </button>
          </div>

          <AnimatePresence initial={false} mode="sync">
            {infoOpen ? (
              <motion.ul
                key={`${activeUpload}-details`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="mx-auto max-w-xl space-y-2 text-sm leading-relaxed text-[var(--foreground-muted)]"
              >
                {currentConfig.details.map((detail) => (
                  <li key={detail} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]" />
                    <span>{detail}</span>
                  </li>
                ))}
              </motion.ul>
            ) : null}
          </AnimatePresence>
        </section>

        <section className="mx-auto w-full max-w-3xl space-y-6">
          <div className="flex flex-col gap-4 text-center sm:text-left">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--foreground-subtle)]">Upload status</h2>
            <p className="text-sm text-[var(--foreground-muted)]" role="status" aria-live="polite">
              {bothLoaded
                ? 'Both files are validated — the dashboard unlocks on the next step.'
                : `We will unlock the dashboard as soon as the ${waitingLabel} arrives.`}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <span className={cn('h-2.5 w-2.5 rounded-full transition-colors', budgetReady ? 'bg-[var(--accent)]' : 'bg-slate-300')} aria-hidden />
                {uploadConfigs.budget.label}
              </div>
              <p className="text-sm text-[var(--foreground-muted)]">
                {budgetReady
                  ? `${budgetData?.rowCount.toLocaleString()} rows • ${budgetData?.headers.length} headers mapped`
                  : 'Waiting for upload'}
              </p>
              {budgetReady ? (
                <p className="text-xs text-[var(--foreground-subtle)]">File: {budgetData?.fileName}</p>
              ) : null}
            </div>

            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <span className={cn('h-2.5 w-2.5 rounded-full transition-colors', claimsReady ? 'bg-[var(--accent)]' : 'bg-slate-300')} aria-hidden />
                {uploadConfigs.claims.label}
              </div>
              <p className="text-sm text-[var(--foreground-muted)]">
                {claimsReady
                  ? `${claimsData?.rowCount.toLocaleString()} rows • ${claimsData?.headers.length} headers mapped`
                  : 'Optional — upload if you want claims-level insight'}
              </p>
              {claimsReady ? (
                <p className="text-xs text-[var(--foreground-subtle)]">File: {claimsData?.fileName}</p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DualCSVLoader;
