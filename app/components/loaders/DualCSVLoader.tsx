// touched by PR-008: UI polish for upload workflow
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Development-only logging utility
const isDev = process.env.NODE_ENV === 'development';
const devLog = (...args: any[]) => isDev && console.log(...args);
const devError = (...args: any[]) => isDev && console.error(...args);
import type { ParsedCSVData } from './CSVLoader';
import { CheckCircle, CloudUpload, Columns3, Loader2, Table2 } from 'lucide-react';
import { ModernCard, ModernMetric, ModernUpload } from '@components/index';
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
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/80 to-transparent" />

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

      <div className="relative mx-auto w-full max-w-screen-xl px-6 py-16">
        <div className="space-y-16">
          <header className="mx-auto max-w-3xl space-y-5 text-center">
            <h1 className="font-bold text-2xl tracking-tight text-slate-800">
              Upload Healthcare Data
            </h1>
            <p className="text-base leading-relaxed text-slate-600">
              Upload your monthly claims and enrollment data
            </p>
          </header>


          <div className="grid gap-12 xl:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
            >
              <ModernUpload
                title="Budget & Enrollment Summary"
                description="Drop in monthly totals with headcounts so we can benchmark spend versus projections."
                helper="We detect thousands separators, currency symbols, and normalize headers automatically."
                sampleLink={{ href: '/sample-budget.csv', label: 'Download sample CSV' }}
                icon={<CloudUpload className="h-6 w-6 text-blue-600" aria-hidden />}
                loaderClassName="rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-gradient-to-br from-slate-50 to-white shadow-sm hover:shadow-md transition-shadow"
                cardClassName="space-y-6 bg-white/90 p-8 lg:p-10"
                onDataLoaded={handleBudgetLoaded}
                onError={onError}
                maxFileSize={10 * 1024 * 1024}
                footer={
                  <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <p className="font-semibold text-sm text-slate-900">Quick checklist</p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-medium text-blue-700 mb-4">
                      .csv only • Max 10MB
                    </div>
                    <ul className="space-y-3 text-sm leading-relaxed text-slate-600">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        Month or period column (YYYY-MM or similar)
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        Enrollment counts for employees and members
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        Medical, pharmacy, and total spend columns
                      </li>
                    </ul>
                  </div>
                }
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.2 }}
            >
              <ModernUpload
                title="Detailed Claims Experience"
                description="Optional row-level files unlock high-cost claimant tracking, service line analytics, and ICD pattern insights."
                helper="Include identifiers, service categories, ICD-10 codes, and medical/Rx amounts. We'll align naming automatically."
                sampleLink={{ href: '/sample-claims.csv', label: 'Download sample CSV' }}
                icon={<CloudUpload className="h-6 w-6 text-blue-600" aria-hidden />}
                loaderClassName="rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-gradient-to-br from-slate-50 to-white shadow-sm hover:shadow-md transition-shadow"
                cardClassName="space-y-6 bg-white/90 p-8 lg:p-10"
                onDataLoaded={handleClaimsLoaded}
                onError={onError}
                maxFileSize={10 * 1024 * 1024}
                footer={
                  <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <p className="font-semibold text-sm text-slate-900">Quick checklist</p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-medium text-blue-700 mb-4">
                      .csv only • Max 10MB
                    </div>
                    <ul className="space-y-3 text-sm leading-relaxed text-slate-600">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        Claimant or subscriber identifier
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        Service type and ICD-10-CM code
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        Medical, pharmacy, and total cost columns
                      </li>
                    </ul>
                  </div>
                }
              />
            </motion.div>
          </div>

          {(budgetData || claimsData) && (
            <ModernCard tone="surface" padding="lg" className="space-y-8 bg-white/90 shadow-lg">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <h3 className="font-semibold text-xl mb-4 text-slate-900">Upload progress</h3>
                  <p className="text-base leading-relaxed text-slate-600">
                    {bothLoaded
                      ? 'Both files are validated — feel free to navigate the dashboard or refresh analytics.'
                      : `We are ready as soon as the ${waitingFor} file finishes uploading.`}
                  </p>
                </div>
                {bothLoaded ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-2 text-sm font-semibold text-green-700">
                    <CheckCircle className="h-4 w-4" aria-hidden />
                    Ready to analyze
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" aria-hidden />
                    Awaiting {waitingFor} file
                  </span>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {budgetData ? (
                  <ModernMetric
                    label="Budget file"
                    value={`${budgetData.rowCount.toLocaleString()} rows`}
                    secondary={`${budgetData.headers.length} headers mapped`}
                    helper={`File: ${budgetData.fileName}`}
                    icon={<Table2 className="h-5 w-5 text-blue-600" aria-hidden />}
                    accent="info"
                    trend={{ value: 'Validated', direction: 'up', label: 'Checks passed' }}
                    tone="translucent"
                    padding="md"
                  />
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 text-sm text-slate-500">
                    Drop a budget summary to unlock benchmarks.
                  </div>
                )}

                {claimsData ? (
                  <ModernMetric
                    label="Claims file"
                    value={`${claimsData.rowCount.toLocaleString()} rows`}
                    secondary={`${claimsData.headers.length} headers mapped`}
                    helper={`File: ${claimsData.fileName}`}
                    icon={<Columns3 className="h-5 w-5 text-blue-600" aria-hidden />}
                    accent="accent"
                    trend={{ value: 'Validated', direction: 'up', label: 'Checks passed' }}
                    tone="translucent"
                    padding="md"
                  />
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 text-sm text-slate-500">
                    Add detailed claims to unlock granular analytics.
                  </div>
                )}
              </div>
            </ModernCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default DualCSVLoader;
