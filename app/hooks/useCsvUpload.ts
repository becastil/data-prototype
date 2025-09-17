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

        if (result.errors.length > 0 || !result.data || result.data.length === 0) {
          const errorMsg = result.errors.length > 0
            ? 'Unable to parse CSV - please check format'
            : 'CSV appears to be empty or corrupted';
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
        }).filter((row: Record<string, string>) => Object.values(row).some((val) => val !== ''));

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
      worker: true,
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
