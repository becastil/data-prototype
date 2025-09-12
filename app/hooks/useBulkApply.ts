import { useState, useCallback } from 'react';
import {
  BulkApplyConfig,
  BulkApplyResult,
  BulkApplyValidation,
  MonthlySnapshot,
  MissingMonthStrategy
} from '@/app/types/bulkApply';
import { FeesConfig } from '@/app/components/forms/FeesConfigurator';
import {
  expandMonths,
  extractEnrollmentData,
  validateBulkApply,
  generatePreview,
  executeBulkApply
} from '@/app/services/bulkApplyService';

interface UseBulkApplyOptions {
  onSuccess?: (result: BulkApplyResult) => void;
  onError?: (errors: string[]) => void;
  missingMonthStrategy?: MissingMonthStrategy;
}

export function useBulkApply(
  feesConfig: FeesConfig,
  csvData: any[],
  options: UseBulkApplyOptions = {}
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [validation, setValidation] = useState<BulkApplyValidation | null>(null);
  const [preview, setPreview] = useState<MonthlySnapshot[] | null>(null);
  const [lastResult, setLastResult] = useState<BulkApplyResult | null>(null);
  
  const {
    onSuccess,
    onError,
    missingMonthStrategy = MissingMonthStrategy.CREATE
  } = options;
  
  const validateConfig = useCallback((config: BulkApplyConfig): BulkApplyValidation => {
    const targetMonths = expandMonths(
      config.startMonth,
      config.duration,
      config.endMonth
    );
    
    const enrollmentData = extractEnrollmentData(csvData, targetMonths);
    const existingMonths = Object.keys(feesConfig.perMonth || {});
    
    const validationResult = validateBulkApply(config, existingMonths, enrollmentData);
    setValidation(validationResult);
    
    return validationResult;
  }, [feesConfig, csvData]);
  
  const generatePreviewData = useCallback((config: BulkApplyConfig): MonthlySnapshot[] | null => {
    const validationResult = validateConfig(config);
    
    if (!validationResult.isValid) {
      return null;
    }
    
    const targetMonths = expandMonths(
      config.startMonth,
      config.duration,
      config.endMonth
    );
    
    const enrollmentData = extractEnrollmentData(csvData, targetMonths);
    const snapshots = generatePreview(config, feesConfig, enrollmentData);
    
    setPreview(snapshots);
    return snapshots;
  }, [feesConfig, csvData, validateConfig]);
  
  const applyBulkChanges = useCallback(async (config: BulkApplyConfig): Promise<BulkApplyResult> => {
    setIsProcessing(true);
    
    try {
      const validationResult = validateConfig(config);
      
      if (!validationResult.isValid) {
        const errorResult: BulkApplyResult = {
          success: false,
          monthsUpdated: [],
          monthsSkipped: [],
          errors: validationResult.errors,
          auditLog: {
            id: '',
            timestamp: new Date().toISOString(),
            startMonth: config.startMonth,
            endMonth: config.endMonth || '',
            componentsApplied: [],
            conflictPolicy: config.conflictPolicy,
            monthsAffected: 0
          }
        };
        
        setLastResult(errorResult);
        onError?.(validationResult.errors);
        return errorResult;
      }
      
      const targetMonths = expandMonths(
        config.startMonth,
        config.duration,
        config.endMonth
      );
      
      const enrollmentData = extractEnrollmentData(csvData, targetMonths);
      
      const result = executeBulkApply(
        config,
        feesConfig,
        enrollmentData,
        missingMonthStrategy
      );
      
      setLastResult(result);
      
      if (result.success) {
        onSuccess?.(result);
      } else {
        onError?.(result.errors);
      }
      
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [feesConfig, csvData, validateConfig, missingMonthStrategy, onSuccess, onError]);
  
  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);
  
  const clearValidation = useCallback(() => {
    setValidation(null);
  }, []);
  
  const reset = useCallback(() => {
    setIsProcessing(false);
    setValidation(null);
    setPreview(null);
    setLastResult(null);
  }, []);
  
  return {
    isProcessing,
    validation,
    preview,
    lastResult,
    validateConfig,
    generatePreviewData,
    applyBulkChanges,
    clearPreview,
    clearValidation,
    reset
  };
}