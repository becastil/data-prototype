// touched by PR-008: factor shared CSV upload behavior
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import { sanitizeCSVData } from '@utils/phi';
import type { ParsedCSVData } from '@/app/components/loaders/CSVLoader';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

interface UseCsvUploadOptions {
  maxFileSize: number;
  onDataLoaded: (data: ParsedCSVData) => void;
  onError: (message: string) => void;
}

/**
 * Clean numeric values by removing commas and other formatting
 * Handles cases like "45,000" -> "45000" and "$1,234.56" -> "1234.56"
 */
function cleanNumericValue(value: string): string {
  if (!value || typeof value !== 'string') return value;
  
  // Remove currency symbols, commas, and extra spaces
  // Keep decimal points and negative signs
  const cleaned = value.replace(/[$,\s]/g, '').trim();
  
  // If it looks like a number (digits, decimal points, negative signs)
  if (/^-?\d*\.?\d+$/.test(cleaned)) {
    return cleaned;
  }
  
  // Return original if it doesn't look numeric
  return value;
}

/**
 * Clean row data by processing numeric-looking fields
 * This handles the common CSV issue of comma-separated thousands
 */
function cleanRowData(row: Record<string, string>): Record<string, string> {
  const cleaned: Record<string, string> = {};
  
  // Numeric field patterns (case-insensitive)
  const numericFields = [
    /count$/i, /claims$/i, /cost$/i, /amount$/i, /budget$/i, /premium$/i,
    /fee$/i, /rebate$/i, /reimbursement$/i, /medical/i, /pharmacy/i, /rx/i,
    /admin/i, /stop.?loss/i, /employee/i, /member/i, /enrollment/i
  ];
  
  for (const [key, value] of Object.entries(row)) {
    // Check if this field looks like it should contain numeric data
    const isNumericField = numericFields.some(pattern => pattern.test(key));
    
    if (isNumericField) {
      cleaned[key] = cleanNumericValue(value);
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

export function useCsvUpload({ maxFileSize, onDataLoaded, onError }: UseCsvUploadOptions) {
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [previewData, setPreviewData] = useState<ParsedCSVData | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetState = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setLoadingState('idle');
    setErrorMessage('');
    setSuccessMessage('');
    setPreviewData(null);
    setUploadProgress(0);
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.csv')) return 'Please select a valid CSV file';
    if (file.size > maxFileSize) return `File size too large (max ${Math.round(maxFileSize / 1024 / 1024)}MB)`;
    if (file.size === 0) return 'CSV file appears to be empty';
    return null;
  }, [maxFileSize]);

  const parseCSV = useCallback((file: File) => {
    setLoadingState('loading');
    setErrorMessage('');
    setSuccessMessage('');

    progressIntervalRef.current = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 100);

    Papa.parse(file, {
      complete: (result) => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setUploadProgress(100);

        try {
          // Enhanced error handling
          if (result.errors.length > 0) {
            console.warn('[CSV Upload] Papa Parse warnings:', result.errors);
            // Only fail on critical errors, not warnings
            const criticalErrors = result.errors.filter(error => error.type === 'Delimiter' || error.type === 'Quotes');
            if (criticalErrors.length > 0) {
              const errorMsg = `CSV format error: ${criticalErrors[0].message}`;
              setErrorMessage(errorMsg);
              setLoadingState('error');
              onError(errorMsg);
              return;
            }
          }

          if (!result.data || result.data.length === 0) {
            const errorMsg = 'CSV appears to be empty or corrupted';
            setErrorMessage(errorMsg);
            setLoadingState('error');
            onError(errorMsg);
            return;
          }

          // Get headers from first row
          const rawHeaders = result.data[0] as string[];
          if (!rawHeaders || rawHeaders.length === 0) {
            const errorMsg = 'CSV headers not found - please check file format';
            setErrorMessage(errorMsg);
            setLoadingState('error');
            onError(errorMsg);
            return;
          }

          // Clean up headers (trim whitespace)
          const headers = rawHeaders.map(h => (h || '').toString().trim()).filter(h => h !== '');
          
          if (headers.length === 0) {
            const errorMsg = 'No valid column headers found in CSV';
            setErrorMessage(errorMsg);
            setLoadingState('error');
            onError(errorMsg);
            return;
          }

          // Process data rows
          const rawRows = result.data.slice(1);
          const rows = rawRows.map((row: any) => {
            const obj: Record<string, string> = {};
            headers.forEach((header, index) => {
              const value = row[index];
              obj[header] = value !== null && value !== undefined ? value.toString().trim() : '';
            });
            return cleanRowData(obj); // Apply numeric cleaning
          }).filter((row: Record<string, string>) => {
            // Filter out completely empty rows
            return Object.values(row).some((val) => val !== '');
          });

          if (rows.length === 0) {
            const errorMsg = 'No data rows found in CSV file';
            setErrorMessage(errorMsg);
            setLoadingState('error');
            onError(errorMsg);
            return;
          }

          console.log('[CSV Upload] Successfully parsed:', {
            headers: headers.length,
            rows: rows.length,
            sampleRow: rows[0]
          });

          // Apply sanitization
          const sanitized = sanitizeCSVData(headers, rows);
          const parsedData: ParsedCSVData = {
            headers: sanitized.headers,
            rows: sanitized.rows,
            rawData: '',
            fileName: file.name,
            rowCount: sanitized.rows.length,
            fileSize: file.size,
            lastModified: file.lastModified,
          };

          setPreviewData(parsedData);
          setLoadingState('success');
          setSuccessMessage(`Successfully loaded ${sanitized.rows.length} rows from ${file.name}`);
          onDataLoaded(parsedData);
          
        } catch (processingError) {
          console.error('[CSV Upload] Processing error:', processingError);
          const errorMsg = `Failed to process CSV data: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`;
          setErrorMessage(errorMsg);
          setLoadingState('error');
          onError(errorMsg);
        }
      },
      error: (error) => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        console.error('[CSV Upload] Papa Parse error:', error);
        const errorMsg = `CSV parsing failed: ${error.message || 'Unknown parsing error'}`;
        setErrorMessage(errorMsg);
        setLoadingState('error');
        onError(errorMsg);
      },
      header: false,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      worker: false, // Changed to false for better error handling
      transformHeader: (header: string) => header.trim(), // Clean headers
      transform: (value: string) => value.trim(), // Clean values
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
  }, [parseCSV, validateFile, onError]);

  useEffect(() => () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  return {
    loadingState,
    errorMessage,
    successMessage,
    previewData,
    uploadProgress,
    handleFileSelect,
    resetState
  };
}