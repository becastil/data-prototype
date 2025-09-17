// touched by PR-008: UI polish for upload workflow
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Development-only logging utility
const isDev = process.env.NODE_ENV === 'development';
const devLog = (...args: any[]) => isDev && console.log(...args);
const devError = (...args: any[]) => isDev && console.error(...args);
import CSVLoader, { ParsedCSVData } from './CSVLoader';
import { CheckCircle, Download } from 'lucide-react';
import Link from 'next/link';
import { validateBudgetData, validateClaimsData } from '@/app/utils/schemas';
import { analyzeHeaders, type HeaderRequirement } from '@/app/utils/headers';

interface DualCSVLoaderProps {
  onBothFilesLoaded: (budgetData: ParsedCSVData, claimsData: ParsedCSVData) => void;
  onError: (error: string) => void;
}

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

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 px-6 py-16 text-slate-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className={`rounded-lg shadow-lg border px-4 py-3 max-w-sm ${t.type === 'error' ? 'bg-red-50 border-red-300' : t.type === 'success' ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}
            >
              <div className="font-semibold text-sm text-gray-900">{t.title}</div>
              {t.message && <div className="text-xs text-gray-700 mt-1">{t.message}</div>}
              {t.details && t.details.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-[11px] text-gray-600 space-y-1">
                  {t.details.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-4">
            Healthcare Data Dashboard
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto">
            Upload claims & enrollment data - budget parameters will be configured next
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="absolute -top-7 left-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-100 to-emerald-100 text-slate-800 px-5 py-2 text-sm font-semibold shadow-[0_12px_24px_rgba(148,163,184,0.35)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Claims & Enrollment Data
            </div>
            <div className="bg-white text-slate-800 rounded-3xl shadow-[0_35px_80px_rgba(15,23,42,0.12)] border border-slate-200/60 p-8 pt-14 min-h-[520px] flex flex-col gap-6">
              <div className="space-y-5">
                <h3 className="text-xl font-semibold text-slate-900">Required Columns</h3>
                <ul className="text-sm text-slate-700 space-y-2">
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" /> <span><strong>month</strong> (or <em>period</em>)</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" /> <span><strong>Employee Count</strong>, <strong>Member Count</strong> (or <em>Enrollment</em>)</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" /> <span><strong>Medical Claims</strong> (or <em>medical_claims</em>)</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" /> <span><strong>Pharmacy Claims</strong> (or <em>pharmacy_claims</em>, Rx Claims)</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" /> <span className="text-slate-600">Optional: Detailed claims breakdown</span></li>
                </ul>
                <p className="text-xs leading-relaxed text-slate-600 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
                  💡 <strong>Note:</strong> Budget, fixed costs, and reimbursements will be configured in the next step. Only upload actual claims experience data here to keep the pipeline clean.
                </p>
                <div className="pt-1">
                  <Link href="/sample-budget.csv" className="inline-flex items-center gap-2 text-sky-700 hover:text-sky-900 text-sm font-medium transition-colors">
                    <Download className="w-4 h-4" /> Download template
                  </Link>
                </div>
              </div>
              <CSVLoader
                onDataLoaded={handleBudgetLoaded}
                onError={onError}
                maxFileSize={10 * 1024 * 1024}
                className="mt-2"
              />
              {budgetData && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-6 inline-flex items-center self-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Budget data loaded</span>
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <div className="absolute -top-7 left-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-100 to-blue-100 text-slate-900 px-5 py-2 text-sm font-semibold shadow-[0_12px_24px_rgba(148,163,184,0.35)]">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              Detailed Claims Data (Optional)
            </div>
            <div className="bg-white text-slate-800 rounded-3xl shadow-[0_35px_80px_rgba(15,23,42,0.12)] border border-slate-200/60 p-8 pt-14 min-h-[520px] flex flex-col gap-6">
              <div className="space-y-5">
                <h3 className="text-xl font-semibold text-slate-900">Optional Detailed Breakdown</h3>
                <ul className="text-sm text-slate-700 space-y-2">
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" /> <span><strong>Claimant Number</strong></span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" /> <span><strong>Service Type</strong>, <strong>ICD-10-CM Code</strong></span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" /> <span><strong>Medical</strong>, <strong>Rx</strong>, <strong>Total</strong> (costs)</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" /> <span><strong>Medical Description</strong>, <strong>Layman's Term</strong></span></li>
                </ul>
                <p className="text-xs leading-relaxed text-slate-600 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                  ⚠️ <strong>Optional:</strong> This file unlocks granular claims analytics. Feel free to skip it if you only need high-level KPIs.
                </p>
                <div className="pt-1">
                  <Link href="/sample-claims.csv" className="inline-flex items-center gap-2 text-sky-700 hover:text-sky-900 text-sm font-medium transition-colors">
                    <Download className="w-4 h-4" /> Download template
                  </Link>
                </div>
              </div>
              <CSVLoader
                onDataLoaded={handleClaimsLoaded}
                onError={onError}
                maxFileSize={10 * 1024 * 1024}
                className="mt-2"
              />
              {claimsData && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-6 inline-flex items-center self-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Claims data loaded</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {(budgetData || claimsData) && !(budgetData && claimsData) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 text-center text-slate-600"
          >
            <div className="inline-flex items-center space-x-3 rounded-full bg-white px-6 py-3 border border-slate-200 text-slate-600 shadow-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-400"></div>
              <span className="text-sm tracking-wide">Waiting for {budgetData ? 'claims' : 'budget'} data...</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default DualCSVLoader;
