'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import DualCSVLoader from '@components/loaders/DualCSVLoader';
import FeesConfigurator, { FeesConfig } from '@components/forms/FeesConfigurator';
import { GlassCard } from '@components/ui/glass-card';
import { LottieLoader } from '@components/ui/lottie-loader';

// Types and utilities
import { DataUploaderProps } from '@components/shared/interfaces';
import { ParsedCSVData } from '@components/loaders/CSVLoader';
import { secureHealthcareStorage } from '@/app/lib/SecureHealthcareStorage';
import { parseNumericValue } from '@utils/chartDataProcessors';

// Development-only logging utility
const isDev = process.env.NODE_ENV === 'development';
const devLog = (...args: any[]) => isDev && console.log(...args);
const devError = (...args: any[]) => isDev && console.error(...args);
const devWarn = (...args: any[]) => isDev && console.warn(...args);

interface DataUploaderState {
  showFeesForm: boolean;
  isLoading: boolean;
  showSuccess: boolean;
  error: string;
  budgetData: ParsedCSVData | null;
  claimsData: ParsedCSVData | null;
}

const DataUploader: React.FC<DataUploaderProps> = ({
  onDataLoaded,
  onError,
  onLoadingChange,
  onFeesConfigured,
}) => {
  const [state, setState] = useState<DataUploaderState>({
    showFeesForm: false,
    isLoading: false,
    showSuccess: false,
    error: '',
    budgetData: null,
    claimsData: null,
  });

  // Refs for timeout cleanup
  const timeoutRefs = useRef<{
    loadingTimeout: ReturnType<typeof setTimeout> | null;
    successTimeout: ReturnType<typeof setTimeout> | null;
  }>({
    loadingTimeout: null,
    successTimeout: null
  });

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRefs.current.loadingTimeout) {
        clearTimeout(timeoutRefs.current.loadingTimeout);
      }
      if (timeoutRefs.current.successTimeout) {
        clearTimeout(timeoutRefs.current.successTimeout);
      }
    };
  }, []);

  // Update parent loading state when internal loading changes
  useEffect(() => {
    onLoadingChange(state.isLoading);
  }, [state.isLoading, onLoadingChange]);

  // Update parent error state when internal error changes
  useEffect(() => {
    if (state.error) {
      onError(state.error);
    }
  }, [state.error, onError]);

  const handleBothFilesLoaded = (budget: ParsedCSVData, claims: ParsedCSVData) => {
    devLog('[CSV FLOW] handleBothFilesLoaded called with:', {
      budgetHeaders: budget?.headers,
      budgetRows: budget?.rowCount,
      claimsHeaders: claims?.headers, 
      claimsRows: claims?.rowCount
    });
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: '' }));
      
      // Clear any existing timeouts
      if (timeoutRefs.current.loadingTimeout) {
        clearTimeout(timeoutRefs.current.loadingTimeout);
      }
      if (timeoutRefs.current.successTimeout) {
        clearTimeout(timeoutRefs.current.successTimeout);
      }
      
      timeoutRefs.current.loadingTimeout = setTimeout(async () => {
        try {
          devLog('[CSV FLOW] Processing data for dashboard...');
          
          // Validate data before setting state
          if (!budget || !budget.rows || budget.rows.length === 0) {
            throw new Error('Budget data is empty or invalid');
          }
          if (!claims || !claims.rows || claims.rows.length === 0) {
            throw new Error('Claims data is empty or invalid');
          }
          
          devLog('[CSV FLOW] Setting budget data...');
          devLog('[CSV FLOW] Setting claims data...');
          
          setState(prev => ({ 
            ...prev, 
            budgetData: budget, 
            claimsData: claims 
          }));
          
          try {
            devLog('[SecureHealthcareStorage] Storing data securely...');
            await secureHealthcareStorage.storeTemporary('dashboardData', {
              budgetData: budget,
              claimsData: claims,
              savedAt: new Date().toISOString(),
            });
            devLog('[SecureHealthcareStorage] Data stored successfully');
          } catch (storageError) {
            devWarn('[SecureHealthcareStorage] Storage failed (non-critical):', storageError);
          }
          
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            showSuccess: true 
          }));
          devLog('[CSV FLOW] Success animation started');
          
          timeoutRefs.current.successTimeout = setTimeout(() => {
            try {
              devLog('[CSV FLOW] Transitioning to fees configuration view...');
              setState(prev => ({ 
                ...prev, 
                showFeesForm: true, 
                showSuccess: false, 
                error: '' 
              }));
              devLog('[CSV FLOW] Dashboard transition complete');
              timeoutRefs.current.successTimeout = null;
            } catch (transitionError) {
              devError('[CSV FLOW] Dashboard transition failed:', transitionError);
              setState(prev => ({ 
                ...prev, 
                error: `Dashboard transition failed: ${transitionError instanceof Error ? transitionError.message : 'Unknown error'}` 
              }));
            }
          }, 1500);
          
          timeoutRefs.current.loadingTimeout = null;
        } catch (processingError) {
          devError('[CSV FLOW] Data processing failed:', processingError);
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            showSuccess: false, 
            error: `Data processing failed: ${processingError instanceof Error ? processingError.message : 'Unknown error'}` 
          }));
          timeoutRefs.current.loadingTimeout = null;
        }
      }, 1000);
    } catch (outerError) {
      devError('[CSV FLOW] Critical error in handleBothFilesLoaded:', outerError);
      setState(prev => ({ 
        ...prev, 
        error: `Critical error: ${outerError instanceof Error ? outerError.message : 'Unknown error'}`,
        isLoading: false 
      }));
    }
  };

  const handleError = (errorMessage: string) => {
    setState(prev => ({ ...prev, error: errorMessage }));
    devError(errorMessage);
  };

  // Handle fees form submit
  const handleFeesSubmit = async (config: FeesConfig, computed: { monthlyFixed: number; monthlyBudget: number }) => {
    try {
      await secureHealthcareStorage.storeTemporary('dashboardFees', { 
        config, 
        computed, 
        savedAt: new Date().toISOString() 
      });
    } catch (storageError) {
      devWarn('[FeesConfigurator] Storage failed (non-critical):', storageError);
    }

    // Notify parent that data loading is complete
    if (state.budgetData && state.claimsData) {
      onDataLoaded(state.budgetData, state.claimsData);
    }
    
    // Notify parent that fees are configured
    onFeesConfigured(config);
  };

  return (
    <motion.div
      key="uploader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative"
    >
      {!state.showFeesForm ? (
        <DualCSVLoader
          onBothFilesLoaded={handleBothFilesLoaded}
          onError={handleError}
        />
      ) : (
        <FeesConfigurator
          defaultEmployees={parseNumericValue((state.budgetData?.rows || []).slice(-1)[0]?.['Employee Count'] as any) || 0}
          defaultMembers={parseNumericValue((state.budgetData?.rows || []).slice(-1)[0]?.['Member Count'] as any) || parseNumericValue((state.budgetData?.rows || []).slice(-1)[0]?.['Enrollment'] as any) || 0}
          defaultBudget={parseNumericValue((state.budgetData?.rows || []).slice(-1)[0]?.['Budget'] as any) || 0}
          csvData={state.budgetData?.rows || []}
          onSubmit={handleFeesSubmit}
        />
      )}
      
      {/* Premium Loading Animation */}
      {state.isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <GlassCard variant="elevated" className="p-12 text-center max-w-md">
            <LottieLoader type="pulse" size="xl" />
            <h3 className="mt-6 text-xl font-semibold text-[var(--foreground)]">
              Processing your data
            </h3>
            <p className="mt-2 text-[var(--foreground-muted)]">
              Applying premium analytics transformations...
            </p>
          </GlassCard>
        </motion.div>
      )}
      
      {/* Premium Success Animation */}
      {state.showSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <GlassCard variant="vibrant" glow className="p-12 text-center max-w-md">
            <LottieLoader type="success" size="xl" />
            <h3 className="mt-6 text-xl font-semibold text-[var(--foreground)]">
              Analytics Ready!
            </h3>
            <p className="mt-2 text-[var(--foreground-muted)]">
              Your premium dashboard is now live
            </p>
          </GlassCard>
        </motion.div>
      )}
      
      {state.error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 right-8 bg-[var(--surface-elevated)] border border-[var(--surface-border)] rounded-xl p-4 max-w-md shadow-[var(--card-base-shadow)]"
        >
          <p className="text-[var(--foreground)] font-semibold">Error</p>
          <p className="text-[var(--foreground-muted)] text-sm mt-1">{state.error}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DataUploader;