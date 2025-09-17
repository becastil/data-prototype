// touched by PR-008: UI polish for CSV dropzone
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Papa from 'papaparse';
import { sanitizeCSVData } from '@utils/phi';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Loader2, FileUp } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

export interface ParsedCSVData {
  headers: string[];
  rows: Record<string, string>[];
  rawData: string;
  fileName: string;
  rowCount: number;
}

export interface CSVLoaderProps {
  onDataLoaded: (data: ParsedCSVData) => void;
  onError: (error: string) => void;
  maxFileSize?: number; // in bytes
  className?: string;
}

type LoadingState = 'idle' | 'loading' | 'success' | 'error';
type DragState = 'idle' | 'hover' | 'active';

const dropZoneVariants: Variants = {
  idle: {
    scale: 1,
    borderColor: 'rgba(203, 213, 225, 1)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  hover: {
    scale: 1.02,
    borderColor: 'rgba(96, 165, 250, 0.8)',
    backgroundColor: 'rgba(219, 234, 254, 0.85)',
    transition: {
      duration: 0.2,
      ease: 'easeInOut'
    }
  },
  active: {
    scale: 0.98,
    borderColor: 'rgba(59, 130, 246, 0.9)',
    backgroundColor: 'rgba(191, 219, 254, 0.9)',
    transition: {
      duration: 0.12
    }
  },
  success: {
    scale: 1,
    borderColor: 'rgba(16, 185, 129, 0.9)',
    backgroundColor: 'rgba(187, 247, 208, 0.85)',
  },
  error: {
    scale: 1,
    borderColor: 'rgba(239, 68, 68, 0.9)',
    backgroundColor: 'rgba(254, 202, 202, 0.85)',
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

const tableRowVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: 'easeOut'
    }
  }),
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2
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
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [dragState, setDragState] = useState<DragState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [previewData, setPreviewData] = useState<ParsedCSVData | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef<number>(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetState = useCallback(() => {
    // Clear progress interval if it exists
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    setLoadingState('idle');
    setDragState('idle');
    setErrorMessage('');
    setSuccessMessage('');
    setPreviewData(null);
    setUploadProgress(0);
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return 'Please select a valid CSV file';
    }
    if (file.size > maxFileSize) {
      return `File size too large (max ${Math.round(maxFileSize / 1024 / 1024)}MB)`;
    }
    if (file.size === 0) {
      return 'CSV file appears to be empty';
    }
    return null;
  }, [maxFileSize]);

  const parseCSV = useCallback((file: File) => {
    setLoadingState('loading');
    setErrorMessage('');
    setSuccessMessage('');
    
    // Simulate upload progress
    progressIntervalRef.current = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 100);

    Papa.parse(file, {
      complete: (result) => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setUploadProgress(100);

        if (result.errors.length > 0) {
          const errorMsg = 'Unable to parse CSV - please check format';
          setErrorMessage(errorMsg);
          setLoadingState('error');
          onError(errorMsg);
          return;
        }

        if (!result.data || result.data.length === 0) {
          const errorMsg = 'CSV appears to be empty or corrupted';
          setErrorMessage(errorMsg);
          setLoadingState('error');
          onError(errorMsg);
          return;
        }

        const headers = result.data[0] as string[];
        const rows = result.data.slice(1).map((row: any) => {
          const obj: Record<string, string> = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        }).filter((row: Record<string, string>) => 
          Object.values(row).some(val => val !== '')
        );

        const sanitized = sanitizeCSVData(headers, rows);

        const parsedData: ParsedCSVData = {
          headers: sanitized.headers,
          rows: sanitized.rows,
          rawData: '',
          fileName: file.name,
          rowCount: sanitized.rows.length,
          fileSize: file.size,
          lastModified: file.lastModified
        };

        setPreviewData(parsedData);
        setLoadingState('success');
        setSuccessMessage(`Successfully loaded ${rows.length} rows from ${file.name}`);
        onDataLoaded(parsedData);
      },
      error: (error) => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        const errorMsg = `CSV parsing error: ${error.message}`;
        setErrorMessage(errorMsg);
        setLoadingState('error');
        onError(errorMsg);
      },
      header: false,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      worker: true
    });
  }, [onDataLoaded, onError]);

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      setLoadingState('error');
      onError(validationError);
      return;
    }
    parseCSV(file);
  }, [validateFile, parseCSV, onError]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
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
          className="border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all bg-white shadow-[0_20px_45px_rgba(15,23,42,0.1)]"
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
                {loadingState === 'loading' && 'Processing CSV file...'}
                {loadingState === 'success' && 'CSV loaded successfully!'}
                {loadingState === 'error' && 'Error loading CSV'}
                {loadingState === 'idle' && 'Drop CSV file here or click to upload'}
              </p>
              <div className="text-sm text-slate-500 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-2 bg-slate-100 text-sky-700 px-3 py-1 rounded-full border border-sky-200">
                  <FileUp className="w-4 h-4" /> .csv only
                </span>
                <span className="opacity-50">•</span>
                <span className="font-medium text-slate-600">Max {Math.round(maxFileSize / 1024 / 1024)}MB</span>
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
                <Button variant="outline" type="button" onClick={handleClick} className="rounded-full border-slate-200 text-slate-700 bg-white font-semibold shadow-sm hover:bg-slate-50">
                  Browse Files
                </Button>
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
        {previewData && previewData.rows.length > 0 && (
          <motion.div
            key="preview"
            className="bg-white rounded-xl shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Data Preview (First 5 rows)
              </h3>
              <div className="text-sm text-slate-600 mt-1 flex flex-wrap gap-3">
                <span>Total rows: {previewData.rowCount}</span>
                <span>• Columns: {previewData.headers.length}</span>
                {previewData.fileName && (
                  <span>• File: {previewData.fileName}</span>
                )}
                {typeof previewData.fileSize === 'number' && (
                  <span>• Size: {Math.round((previewData.fileSize / 1024) * 10) / 10} KB</span>
                )}
                {typeof previewData.lastModified === 'number' && (
                  <span>• Modified: {new Date(previewData.lastModified).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
                  <tr>
                    {previewData.headers.map((header, index) => (
                      <motion.th
                        key={index}
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.18em] whitespace-nowrap"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {header}
                      </motion.th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 text-slate-800">
                  {previewData.rows.slice(0, 5).map((row, rowIndex) => (
                    <motion.tr
                      key={rowIndex}
                      custom={rowIndex}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                      whileHover={{ backgroundColor: 'rgba(125, 211, 252, 0.18)' }}
                    >
                      {previewData.headers.map((header, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-4 py-3 text-sm whitespace-nowrap"
                          title={row[header]}
                        >
                          <div className="max-w-xs truncate">
                            {row[header] || <span className="text-gray-400">-</span>}
                          </div>
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <motion.div
              className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-slate-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-sm">
                Showing {Math.min(5, previewData.rows.length)} of {previewData.rowCount} rows
              </p>
              <Button variant="ghost" onClick={resetState} className="text-sky-600 hover:text-sky-800">
                Replace File
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CSVLoader;
