'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

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
    borderColor: 'rgb(209, 213, 219)',
    backgroundColor: 'rgba(249, 250, 251, 0)',
  },
  hover: {
    scale: 1.02,
    borderColor: 'rgb(0, 0, 0)',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    transition: {
      duration: 0.2,
      ease: 'easeInOut'
    }
  },
  active: {
    scale: 0.98,
    borderColor: 'rgb(51, 51, 51)',
    backgroundColor: 'rgba(51, 51, 51, 0.1)',
    transition: {
      duration: 0.1
    }
  },
  success: {
    scale: 1,
    borderColor: 'rgb(0, 0, 0)',
    backgroundColor: 'rgba(245, 245, 220, 0.3)',
  },
  error: {
    scale: 1,
    borderColor: 'rgb(102, 102, 102)',
    backgroundColor: 'rgba(102, 102, 102, 0.05)',
    x: [0, -5, 5, -5, 5, 0],
    transition: {
      x: {
        duration: 0.5,
        ease: 'easeInOut'
      }
    }
  }
};

const iconVariants: Variants = {
  idle: { rotate: 0, scale: 1 },
  hover: { rotate: 5, scale: 1.1 },
  active: { rotate: -5, scale: 0.95 },
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

  const resetState = useCallback(() => {
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
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 100);

    Papa.parse(file, {
      complete: (result) => {
        clearInterval(progressInterval);
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

        const parsedData: ParsedCSVData = {
          headers,
          rows,
          rawData: '',
          fileName: file.name,
          rowCount: rows.length
        };

        setPreviewData(parsedData);
        setLoadingState('success');
        setSuccessMessage(`Successfully loaded ${rows.length} rows from ${file.name}`);
        onDataLoaded(parsedData);
      },
      error: (error) => {
        clearInterval(progressInterval);
        const errorMsg = `CSV parsing error: ${error.message}`;
        setErrorMessage(errorMsg);
        setLoadingState('error');
        onError(errorMsg);
      },
      header: false,
      skipEmptyLines: true,
      encoding: 'UTF-8'
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
        return <Loader2 className="w-12 h-12 text-gray-600" />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-black" />;
      case 'error':
        return <XCircle className="w-12 h-12 text-gray-800" />;
      default:
        return <FileSpreadsheet className="w-12 h-12 text-gray-500" />;
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 space-y-6 ${className}`}>
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
          className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors"
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
            
            <div className="space-y-2">
              <p className="text-xl font-semibold text-gray-700">
                {loadingState === 'loading' && 'Processing CSV file...'}
                {loadingState === 'success' && 'CSV loaded successfully!'}
                {loadingState === 'error' && 'Error loading CSV'}
                {loadingState === 'idle' && 'Drop CSV file here or click to upload'}
              </p>
              
              <p className="text-sm text-gray-500">
                Supports .csv files up to {Math.round(maxFileSize / 1024 / 1024)}MB
              </p>
            </div>

            {loadingState === 'loading' && (
              <motion.div
                className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="h-full bg-black"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      <AnimatePresence mode="wait">
        {errorMessage && (
          <motion.div
            key="error"
            className="bg-gray-100 border border-gray-400 rounded-lg p-4 flex items-start space-x-3"
            variants={alertVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <AlertCircle className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-gray-800 font-medium">Upload Error</p>
              <p className="text-gray-700 text-sm mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={resetState}
              className="text-gray-600 hover:text-black transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            key="success"
            className="bg-gray-50 border border-gray-300 rounded-lg p-4 flex items-start space-x-3"
            variants={alertVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <CheckCircle className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-gray-800 font-medium">Upload Complete</p>
              <p className="text-gray-600 text-sm mt-1">{successMessage}</p>
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
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Data Preview (First 5 rows)
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Total rows: {previewData.rowCount} | Columns: {previewData.headers.length}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    {previewData.headers.map((header, index) => (
                      <motion.th
                        key={index}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {header}
                      </motion.th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.rows.slice(0, 5).map((row, rowIndex) => (
                    <motion.tr
                      key={rowIndex}
                      custom={rowIndex}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      whileHover={{ backgroundColor: 'rgba(245, 245, 220, 0.3)' }}
                    >
                      {previewData.headers.map((header, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
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
              className="px-6 py-3 bg-gray-50 border-t flex justify-between items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-sm text-gray-600">
                Showing {Math.min(5, previewData.rows.length)} of {previewData.rowCount} rows
              </p>
              <button
                onClick={resetState}
                className="text-sm text-black hover:text-gray-700 font-medium transition-colors"
              >
                Upload Another File
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CSVLoader;