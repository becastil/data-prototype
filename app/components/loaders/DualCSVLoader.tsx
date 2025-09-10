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
      className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 p-8"
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
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Healthcare Data Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Upload claims & enrollment data - budget parameters will be configured next
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="absolute -top-6 left-4 bg-[#6FACDE] text-[#00263E] px-4 py-1 rounded-md text-sm font-semibold z-10 shadow-sm">
              Claims & Enrollment Data
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 pt-10 border border-[#e0e0e0] min-h-[480px] flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Required Columns</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5" /> <span><strong>month</strong> (or <em>period</em>)</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5" /> <span><strong>Employee Count</strong>, <strong>Member Count</strong> (or <em>Enrollment</em>)</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5" /> <span><strong>Medical Claims</strong> (or <em>medical_claims</em>)</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5" /> <span><strong>Pharmacy Claims</strong> (or <em>pharmacy_claims, Rx Claims</em>)</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5" /> <span>Optional: Detailed claims breakdown</span></li>
                </ul>
                <p className="text-xs text-gray-600 mt-2 p-2 bg-blue-50 rounded">
                  💡 <strong>Note:</strong> Budget, fixed costs, and reimbursements will be configured in the next step - only upload actual claims experience data here.
                </p>
                <div className="mt-3">
                  <Link href="/sample-budget.csv" className="inline-flex items-center gap-1 text-[#2E4B66] hover:text-[#00263E] text-sm">
                    <Download className="w-4 h-4" /> Download template
                  </Link>
                </div>
              </div>
              <CSVLoader
                onDataLoaded={handleBudgetLoaded}
                onError={onError}
                maxFileSize={10 * 1024 * 1024}
              />
              {budgetData && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-4 flex items-center justify-center text-green-700"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Budget data loaded</span>
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
            <div className="absolute -top-6 left-4 bg-[#2E4B66] text-white px-4 py-1 rounded-md text-sm font-semibold z-10 shadow-sm">
              Detailed Claims Data (Optional)
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 pt-10 border border-[#e0e0e0] min-h-[480px] flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Optional Detailed Breakdown</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5" /> <span><strong>Claimant Number</strong></span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5" /> <span><strong>Service Type</strong>, <strong>ICD-10-CM Code</strong></span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5" /> <span><strong>Medical</strong>, <strong>Rx</strong>, <strong>Total</strong> (costs)</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5" /> <span><strong>Medical Description</strong>, <strong>Layman's Term</strong></span></li>
                </ul>
                <p className="text-xs text-gray-600 mt-2 p-2 bg-amber-50 rounded">
                  ⚠️ <strong>Optional:</strong> This provides detailed claims breakdown for advanced analytics. If not needed, you can skip this file.
                </p>
                <div className="mt-3">
                  <Link href="/sample-claims.csv" className="inline-flex items-center gap-1 text-[#2E4B66] hover:text-[#00263E] text-sm">
                    <Download className="w-4 h-4" /> Download template
                  </Link>
                </div>
              </div>
              <CSVLoader
                onDataLoaded={handleClaimsLoaded}
                onError={onError}
                maxFileSize={10 * 1024 * 1024}
              />
              {claimsData && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-4 flex items-center justify-center text-green-700"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Claims data loaded</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {(budgetData || claimsData) && !(budgetData && claimsData) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center text-gray-600"
          >
            <div className="inline-flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2E4B66]"></div>
              <span>Waiting for {budgetData ? 'claims' : 'budget'} data...</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default DualCSVLoader;
