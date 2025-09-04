'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CSVLoader, { ParsedCSVData } from './CSVLoader';
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
      const budgetCheck = validateBudgetData({ headers: budgetData.headers, rows: budgetData.rows });
      console.log('[CSV VALIDATION] Budget headers:', budgetData.headers);
      console.log('[CSV VALIDATION] Budget result:', budgetCheck);
      if (budgetCheck.success !== true) {
        pushToast({ type: 'error', title: 'Budget CSV Validation Failed', message: budgetCheck.message });
        onError(budgetCheck.message);
        return;
      }

      const claimsCheck = validateClaimsData({ headers: claimsData.headers, rows: claimsData.rows });
      console.log('[CSV VALIDATION] Claims headers:', claimsData.headers);
      console.log('[CSV VALIDATION] Claims result:', claimsCheck);
      if (claimsCheck.success !== true) {
        pushToast({ type: 'error', title: 'Claims CSV Validation Failed', message: claimsCheck.message });
        onError(claimsCheck.message);
        return;
      }

      submittedRef.current = true;
      console.log('[CSV FLOW] Both files validated. Invoking onBothFilesLoaded');
      onBothFilesLoaded(budgetData, claimsData);
    }
  }, [budgetData, claimsData, onBothFilesLoaded, onError]);

  const handleBudgetLoaded = (data: ParsedCSVData) => {
    // Validate budget data columns
    const required: HeaderRequirement[] = [
      { name: 'month', aliases: ['month', 'period'] },
    ];
    const analysis = analyzeHeaders(data.headers, required);
    console.log('[CSV HEADERS] Budget analysis found:', analysis.found, 'missing:', analysis.missing);
    const hasRequiredColumns = analysis.missing.length === 0;
    
    if (!hasRequiredColumns) {
      const msg = `Budget CSV missing required column(s): ${analysis.missing.join(', ')}`;
      console.error('[CSV VALIDATION]', msg);
      pushToast({ type: 'error', title: 'Missing Columns in Budget CSV', message: msg, details: [
        'Found: ' + JSON.stringify(analysis.found)
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
    console.log('[CSV HEADERS] Claims analysis found:', analysis.found, 'missing:', analysis.missing);
    
    if (missingColumns.length > 0) {
      console.error('[CSV VALIDATION] Claims missing required columns:', missingColumns);
      const msg = `Claims CSV missing required column(s): ${missingColumns.join(', ')}`;
      pushToast({ type: 'error', title: 'Missing Columns in Claims CSV', message: msg, details: [
        'Found: ' + JSON.stringify(analysis.found),
        'Headers: ' + data.headers.join(', ')
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
            Upload both CSV files to view your analytics dashboard
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="absolute -top-6 left-4 bg-black text-white px-4 py-1 rounded-full text-sm font-semibold z-10">
              Budget & Expenses Data
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 pt-8 border-2 border-gray-200">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Required Columns:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• month (for time series)</li>
                  <li>• budget, medicalClaims, rxClaims, etc.</li>
                  <li>• Any numeric expense columns</li>
                </ul>
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
                  className="mt-4 flex items-center justify-center text-black"
                >
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-semibold">Budget data loaded successfully!</span>
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
            <div className="absolute -top-6 left-4 bg-gray-800 text-white px-4 py-1 rounded-full text-sm font-semibold z-10">
              Claims & HCC Data
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 pt-8 border-2 border-gray-300">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Required Columns:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Claimant Number</li>
                  <li>• Service Type, ICD-10-CM Code</li>
                  <li>• Medical, Rx, Total (costs)</li>
                  <li>• Medical Description, Layman's Term</li>
                </ul>
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
                  className="mt-4 flex items-center justify-center text-black"
                >
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-semibold">Claims data loaded successfully!</span>
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
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
              <span>Waiting for {budgetData ? 'claims' : 'budget'} data...</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default DualCSVLoader;
