'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Calendar, Copy, AlertTriangle, CheckSquare } from 'lucide-react';
import { GlassCard } from '@/app/components/ui/glass-card';
import BulkApplyPreview from './BulkApplyPreview';
import {
  BulkApplyConfig,
  ConflictPolicy,
  MonthlySnapshot,
  BulkApplyComponents
} from '@/app/types/bulkApply';
import { FeeItem, FeesConfig, RateBasis } from './FeesConfigurator';
import {
  expandMonths,
  extractEnrollmentData,
  generatePreview,
  validateBulkApply
} from '@/app/services/bulkApplyService';

interface BulkApplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feesConfig: FeesConfig;
  csvData: any[];
  onApply: (config: BulkApplyConfig) => void;
}

export default function BulkApplyModal({
  open,
  onOpenChange,
  feesConfig,
  csvData,
  onApply
}: BulkApplyModalProps) {
  // Form state
  const [startMonth, setStartMonth] = useState<string>('');
  const [durationType, setDurationType] = useState<'duration' | 'endMonth'>('duration');
  const [duration, setDuration] = useState<number>(6);
  const [endMonth, setEndMonth] = useState<string>('');
  const [components, setComponents] = useState<BulkApplyComponents>({
    fees: true,
    budget: true,
    stopLossReimb: true,
    rebates: true
  });
  const [conflictPolicy, setConflictPolicy] = useState<ConflictPolicy>(ConflictPolicy.OVERWRITE);
  const [showPreview, setShowPreview] = useState(false);
  
  // Set default start month to current month
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    setStartMonth(`${year}-${month}`);
  }, []);
  
  // Calculate target months
  const targetMonths = useMemo(() => {
    if (!startMonth) return [];
    return expandMonths(
      startMonth,
      durationType === 'duration' ? duration : undefined,
      durationType === 'endMonth' ? endMonth : undefined
    );
  }, [startMonth, durationType, duration, endMonth]);
  
  // Extract enrollment data
  const enrollmentData = useMemo(() => {
    return extractEnrollmentData(csvData, targetMonths);
  }, [csvData, targetMonths]);
  
  // Generate configuration
  const config: BulkApplyConfig = useMemo(() => ({
    startMonth,
    duration: durationType === 'duration' ? duration : undefined,
    endMonth: durationType === 'endMonth' ? endMonth : undefined,
    components,
    conflictPolicy,
    sourceFees: feesConfig.fees || [],
    sourceBudget: feesConfig.budgetOverride,
    sourceStopLossReimb: feesConfig.stopLossReimb,
    sourceRebates: feesConfig.rebates
  }), [startMonth, durationType, duration, endMonth, components, conflictPolicy, feesConfig]);
  
  // Validate configuration
  const validation = useMemo(() => {
    if (!startMonth) return { isValid: false, errors: ['Start month required'], warnings: [] };
    const existingMonths = Object.keys(feesConfig.perMonth || {});
    return validateBulkApply(config, existingMonths, enrollmentData);
  }, [config, feesConfig.perMonth, enrollmentData]);
  
  // Generate preview snapshots
  const snapshots = useMemo(() => {
    if (!validation.isValid || !showPreview) return [];
    return generatePreview(config, feesConfig, enrollmentData);
  }, [config, feesConfig, enrollmentData, validation.isValid, showPreview]);
  
  const handlePreviewClick = () => {
    if (validation.isValid) {
      setShowPreview(true);
    }
  };
  
  const handleApply = () => {
    if (validation.isValid) {
      onApply(config);
      onOpenChange(false);
    }
  };
  
  const handleCancel = () => {
    setShowPreview(false);
    onOpenChange(false);
  };
  
  const formatMonthDisplay = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black">
            <Copy className="w-5 h-5" />
            Apply Settings to Multiple Months
          </DialogTitle>
          <DialogDescription>
            Apply current fee configuration and settings to a range of months
          </DialogDescription>
        </DialogHeader>
        
        {!showPreview ? (
          <div className="space-y-6 mt-4">
            {/* Date Range Selection */}
            <GlassCard variant="subtle" className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2 text-black">
                <Calendar className="w-4 h-4" />
                Date Range
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-black">Start Month</label>
                  <Input
                    type="month"
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">Apply To</label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={durationType === 'duration'}
                        onChange={() => setDurationType('duration')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-black">Duration</span>
                    </label>
                    
                    {durationType === 'duration' && (
                      <div className="ml-6 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDuration(6)}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            duration === 6 ? 'bg-black text-white' : 'bg-white border border-gray-300 hover:bg-gray-50 text-black'
                          }`}
                        >
                          6 months
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuration(12)}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            duration === 12 ? 'bg-black text-white' : 'bg-white border border-gray-300 hover:bg-gray-50 text-black'
                          }`}
                        >
                          12 months
                        </button>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                            min="1"
                            max="60"
                            className="w-20"
                          />
                          <span className="text-sm text-black">months</span>
                        </div>
                      </div>
                    )}
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={durationType === 'endMonth'}
                        onChange={() => setDurationType('endMonth')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-black">End Month</span>
                    </label>
                    
                    {durationType === 'endMonth' && (
                      <div className="ml-6">
                        <Input
                          type="month"
                          value={endMonth}
                          onChange={(e) => setEndMonth(e.target.value)}
                          min={startMonth}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {targetMonths.length > 0 && (
                  <div className="mt-3 p-3 bg-white border border-gray-200 rounded-md">
                    <div className="text-sm font-medium text-black">
                      Scope: {targetMonths.length} month{targetMonths.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-black mt-1">
                      {formatMonthDisplay(targetMonths[0])} → {formatMonthDisplay(targetMonths[targetMonths.length - 1])}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
            
            {/* Components Selection */}
            <GlassCard variant="subtle" className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2 text-black">
                <CheckSquare className="w-4 h-4" />
                Components to Apply
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={components.fees}
                    onChange={(e) => setComponents({ ...components, fees: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-black">Fees ({feesConfig.fees?.length || 0} items)</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={components.budget}
                    onChange={(e) => setComponents({ ...components, budget: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-black">Budget Amount</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={components.stopLossReimb}
                    onChange={(e) => setComponents({ ...components, stopLossReimb: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-black">Stop Loss Reimbursements</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={components.rebates}
                    onChange={(e) => setComponents({ ...components, rebates: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-black">Rebates Received</span>
                </label>
              </div>
            </GlassCard>
            
            {/* Conflict Policy */}
            <GlassCard variant="subtle" className="p-4">
              <h3 className="font-medium mb-3 text-black">Conflict Policy</h3>
              
              <div className="space-y-2">
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    checked={conflictPolicy === ConflictPolicy.OVERWRITE}
                    onChange={() => setConflictPolicy(ConflictPolicy.OVERWRITE)}
                    className="w-4 h-4 mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium text-black">Overwrite</div>
                    <div className="text-xs text-black opacity-70">Replace existing values in target months</div>
                  </div>
                </label>
                
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    checked={conflictPolicy === ConflictPolicy.FILL_BLANKS_ONLY}
                    onChange={() => setConflictPolicy(ConflictPolicy.FILL_BLANKS_ONLY)}
                    className="w-4 h-4 mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium text-black">Fill Blanks Only</div>
                    <div className="text-xs text-black opacity-70">Only set months where no value exists</div>
                  </div>
                </label>
                
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    checked={conflictPolicy === ConflictPolicy.ADDITIVE}
                    onChange={() => setConflictPolicy(ConflictPolicy.ADDITIVE)}
                    className="w-4 h-4 mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium text-black">Additive</div>
                    <div className="text-xs text-black opacity-70">Add to existing values (combine fees, add amounts)</div>
                  </div>
                </label>
              </div>
            </GlassCard>
            
            {/* Validation Messages */}
            {(validation.errors.length > 0 || validation.warnings.length > 0) && (
              <div className="space-y-2">
                {validation.errors.map((error, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-white rounded-md border border-gray-200">
                    <AlertTriangle className="w-4 h-4 text-black mt-0.5" />
                    <span className="text-sm text-black">{error}</span>
                  </div>
                ))}
                
                {validation.warnings.map((warning, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-white rounded-md border border-gray-200">
                    <AlertTriangle className="w-4 h-4 text-black mt-0.5" />
                    <span className="text-sm text-black">{warning}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-gray-300 text-black hover:bg-gray-50 focus-visible:ring-black"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePreviewClick}
                disabled={!validation.isValid}
                className="bg-black text-white hover:bg-gray-800 focus-visible:ring-black"
              >
                Preview Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <BulkApplyPreview
              snapshots={snapshots}
              onConfirm={handleApply}
              onCancel={() => setShowPreview(false)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
