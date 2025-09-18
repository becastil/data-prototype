// touched by PR-009: refactored upload flow + light theme
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Loader2, FileUp } from 'lucide-react';
import { useCsvUpload } from '@/app/hooks/useCsvUpload';
import { ModernButton, ModernTable } from '@components/index';

export interface ParsedCSVData {
  headers: string[];
  rows: Record<string, string>[];
  rawData: string;
  fileName: string;
  rowCount: number;
  fileSize?: number;
  lastModified?: number;
}

export interface CSVLoaderProps {
  onDataLoaded: (data: ParsedCSVData) => void;
  onError: (error: string) => void;
  maxFileSize?: number; // in bytes
  className?: string;
}

// retained type alias for outgoing props compatibility
type LoadingState = 'idle' | 'loading' | 'success' | 'error';
type DragState = 'idle' | 'hover' | 'active';

const dropZoneVariants: Variants = {
  idle: {
    scale: 1,
    borderColor: 'rgba(203, 213, 225, 0.9)',
    boxShadow: '0 24px 60px -32px rgba(15, 23, 42, 0.45)'
  },
  hover: {
    scale: 1.015,
    borderColor: 'rgba(96, 165, 250, 0.85)',
    boxShadow: '0 28px 70px -28px rgba(30, 64, 175, 0.45)',
    transition: {
      duration: 0.2,
      ease: 'easeInOut'
    }
  },
  active: {
    scale: 0.99,
    borderColor: 'rgba(59, 130, 246, 0.9)',
    boxShadow: '0 20px 45px -26px rgba(30, 64, 175, 0.55)',
    transition: {
      duration: 0.12
    }
  },
  success: {
    scale: 1,
    borderColor: 'rgba(16, 185, 129, 0.9)',
    boxShadow: '0 30px 75px -26px rgba(16, 185, 129, 0.35)'
  },
  error: {
    scale: 1,
    borderColor: 'rgba(239, 68, 68, 0.9)',
    boxShadow: '0 26px 70px -28px rgba(239, 68, 68, 0.4)',
    x: [0, -5, 5, -5, 5, 0],
    transition: {
      x: {
        duration: 0.45,
        ease: 'easeInOut'
      }
    }
  }
};

const iconVariants: Variants = {
  idle: { rotate: 0, scale: 1 },
  hover: { rotate: 4, scale: 1.05 },
  active: { rotate: -4, scale: 0.95 },
  loading: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  },
  success: {
    scale: [0, 1.2, 1],
    transition: {
      duration: 0.5,
      times: [0, 0.6, 1],
      ease: 'easeOut'
    }
  },
  error: {
    scale: [1, 1.1, 1],
    rotate: [0, -10, 10, -10, 0],
    transition: {
      duration: 0.5
    }
  }
};

const alertVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

const CSVLoader: React.FC<CSVLoaderProps> = ({
  onDataLoaded,
  onError,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  className = ''
}) => {
  const [dragState, setDragState] = useState<DragState>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef<number>(0);

  const {
    loadingState,
    errorMessage,
    successMessage,
    previewData,
    uploadProgress,
    handleFileSelect,
    resetState
  } = useCsvUpload({ maxFileSize, onDataLoaded, onError });

  const previewRows = previewData ? previewData.rows.slice(0, 5) : [];
  const previewColumns = previewData
    ? previewData.headers.map((header) => ({ key: header, header }))
    : [];
  const previewMetaParts = previewData
    ? [
        `Total rows: ${previewData.rowCount.toLocaleString()}`,
        `Columns: ${previewData.headers.length}`,
        previewData.fileName ? `File: ${previewData.fileName}` : null,
        typeof previewData.fileSize === 'number'
          ? `Size: ${(Math.round((previewData.fileSize / 1024) * 10) / 10).toFixed(1)} KB`
          : null,
        typeof previewData.lastModified === 'number'
          ? `Modified: ${new Date(previewData.lastModified).toLocaleDateString()}`
          : null,
      ].filter((part): part is string => Boolean(part))
    : [];
  const previewMeta = previewMetaParts.join(' • ');
  const previewSummary = previewData
    ? `Showing ${Math.min(5, previewData.rows.length)} of ${previewData.rowCount.toLocaleString()} rows`
    : '';

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState('idle');
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragState('active');
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragState('idle');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragState !== 'active') {
      setDragState('active');
    }
  }, [dragState]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getDropZoneVariant = () => {
    if (loadingState === 'success') return 'success';
    if (loadingState === 'error') return 'error';
    return dragState;
  };

  const getIconVariant = () => {
    if (loadingState === 'loading') return 'loading';
    if (loadingState === 'success') return 'success';
    if (loadingState === 'error') return 'error';
    if (dragState === 'hover') return 'hover';
    if (dragState === 'active') return 'active';
    return 'idle';
  };

  const getIcon = () => {
    switch (loadingState) {
      case 'loading':
        return <Loader2 className="w-12 h-12 text-sky-500" />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-emerald-500" />;
      case 'error':
        return <XCircle className="w-12 h-12 text-rose-500" />;
      default:
        return <FileSpreadsheet className="w-12 h-12 text-slate-400" />;
    }
  };

  const dropZoneTone = React.useMemo(() => {
    if (loadingState === 'error') {
      return 'from-rose-50 via-white to-white';
    }
    if (loadingState === 'success') {
      return 'from-emerald-50 via-white to-white';
    }
    if (dragState === 'active' || dragState === 'hover') {
      return 'from-sky-50 via-white to-white';
    }
    return 'from-white via-slate-50 to-slate-100';
  }, [dragState, loadingState]);

  return (
    <div className={`w-full max-w-3xl mx-auto p-0 space-y-6 ${className}`}>
      <motion.div
        className="relative"
        initial="idle"
        animate={getDropZoneVariant()}
        variants={dropZoneVariants}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={loadingState === 'loading'}
        />
        
        <motion.div
          className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all bg-gradient-to-br ${dropZoneTone} shadow-[0_26px_80px_-30px_rgba(15,23,42,0.45)] ring-1 ring-white/40`}
          onDrop={handleDrop}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          onMouseEnter={() => dragState === 'idle' && setDragState('hover')}
          onMouseLeave={() => dragState === 'hover' && setDragState('idle')}
          whileHover={{ scale: dragState === 'idle' ? 1.01 : 1 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="flex flex-col items-center space-y-4"
            variants={iconVariants}
            animate={getIconVariant()}
          >
            {getIcon()}
            
            <div className="space-y-3">
              <p className="text-xl font-semibold text-slate-800">
                {loadingState === 'loading' && 'Processing CSV...'}
                {loadingState === 'success' && 'File ready to analyze'}
                {loadingState === 'error' && 'Upload error'}
                {loadingState === 'idle' && 'Drop CSV or click to upload'}
              </p>
              <div className="text-sm text-slate-500 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/70 px-3 py-1 text-sky-700 backdrop-blur">
                  <FileUp className="w-4 h-4" /> .csv only
                </span>
                <span className="opacity-50">•</span>
                <span className="font-medium text-slate-600">Max {Math.round(maxFileSize / 1024 / 1024)} MB</span>
              </div>
            </div>

            {loadingState === 'loading' && (
              <motion.div
                className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-sky-400 via-emerald-400 to-cyan-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>
            )}

            {loadingState !== 'loading' && (
              <div className="pt-2">
                <ModernButton
                  variant="secondary"
                  size="md"
                  type="button"
                  onClick={handleClick}
                  className="rounded-full border border-[var(--surface-border)] bg-white/80 text-[var(--foreground)] shadow-subtle hover:bg-slate-50"
                >
                  Browse files
                </ModernButton>
              </div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      <AnimatePresence mode="wait">
        {errorMessage && (
          <motion.div
            key="error"
            className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3 text-rose-700"
            variants={alertVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Upload Error</p>
              <p className="text-sm mt-1 opacity-80">{errorMessage}</p>
            </div>
            <button
              onClick={resetState}
              className="text-rose-500 hover:text-rose-700 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            key="success"
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start space-x-3 text-emerald-700"
            variants={alertVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Upload Complete</p>
              <p className="text-sm mt-1 opacity-80">{successMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {previewData && previewRows.length > 0 && (
          <motion.div
            key="preview"
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ModernTable
              title="Data Preview"
              subtitle={previewData.fileName}
              headerDescription={previewMeta}
              data={previewRows}
              columns={previewColumns}
              padding="md"
              tone="translucent"
              rowKey={(_, index) => `preview-${index}`}
            />

            <motion.div
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)]/70 px-4 py-3 text-sm text-[var(--foreground-muted)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span>{previewSummary}</span>
              <ModernButton variant="ghost" size="sm" onClick={resetState} className="text-[var(--accent)] hover:text-[var(--accent-hover)]">
                Replace file
              </ModernButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CSVLoader;
