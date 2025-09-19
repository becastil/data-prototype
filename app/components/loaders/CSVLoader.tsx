// touched by PR-009: refactored upload flow + light theme
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useCsvUpload } from '@/app/hooks/useCsvUpload';
import { ModernButton, ModernTable } from '@components/index';
import { cn } from '@/app/lib/utils';

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
    scale: 1
  },
  hover: {
    scale: 1.01,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  },
  active: {
    scale: 0.99,
    transition: {
      duration: 0.12
    }
  },
  success: {
    scale: 1
  },
  error: {
    scale: 1,
    x: [0, -4, 4, -3, 3, 0],
    transition: {
      x: {
        duration: 0.4,
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
        return <Loader2 className="h-12 w-12 text-[var(--accent)]" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-emerald-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-rose-500" />;
      default:
        return <FileSpreadsheet className="h-12 w-12 text-[var(--foreground-subtle)]" />;
    }
  };

  const accentActive = dragState === 'active' || dragState === 'hover';

  const dropZoneClasses = React.useMemo(() => {
    if (loadingState === 'error') {
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200';
    }
    if (loadingState === 'success') {
      return 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200';
    }
    if (accentActive) {
      return 'bg-[var(--accent)] text-[var(--button-primary-text)] shadow-[0_32px_72px_-40px_rgba(37,99,235,0.55)] ring-2 ring-[var(--accent)]/40';
    }
    return 'bg-white text-[var(--foreground)] shadow-[0_30px_80px_-52px_rgba(15,23,42,0.45)] ring-1 ring-[var(--surface-border)]/70';
  }, [accentActive, loadingState]);

  return (
    <div className={cn('w-full max-w-3xl mx-auto p-0 space-y-8', className)}>
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
          className={cn(
            'rounded-3xl p-16 text-center cursor-pointer transition-all duration-200 border border-transparent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-soft)]',
            dropZoneClasses,
            !accentActive && loadingState === 'idle' && 'hover:shadow-[0_36px_88px_-52px_rgba(15,23,42,0.52)]'
          )}
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
              <p className="text-xl font-semibold tracking-tight">
                {loadingState === 'loading' && 'Processing CSV...'}
                {loadingState === 'success' && 'File ready to analyze'}
                {loadingState === 'error' && 'Upload error'}
                {loadingState === 'idle' && 'Drag & drop your CSV here'}
              </p>
              <p
                className={cn(
                  'text-sm font-medium',
                  loadingState === 'error'
                    ? 'text-rose-600'
                    : loadingState === 'success'
                      ? 'text-emerald-700'
                      : accentActive
                        ? 'text-white/80'
                        : 'text-[var(--foreground-muted)]'
                )}
              >
                CSV only • Max {Math.round(maxFileSize / 1024 / 1024)} MB
              </p>
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
                  variant="primary"
                  size="md"
                  type="button"
                  onClick={handleClick}
                  className={cn(
                    'rounded-full px-6 shadow-none',
                    accentActive && 'bg-white text-[var(--accent)] hover:bg-white/90',
                    loadingState === 'success' && 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  )}
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
