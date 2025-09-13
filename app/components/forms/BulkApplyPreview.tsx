'use client';

import React from 'react';
import { MonthlySnapshot } from '@/app/types/bulkApply';
import { formatCurrency } from '@/app/utils/chartDataProcessors';
import { AlertCircle, CheckCircle, Users, TrendingUp } from 'lucide-react';
import { GlassCard } from '@/app/components/ui/glass-card';

interface BulkApplyPreviewProps {
  snapshots: MonthlySnapshot[];
  onConfirm?: () => void;
  onCancel?: () => void;
}

export default function BulkApplyPreview({
  snapshots,
  onConfirm,
  onCancel
}: BulkApplyPreviewProps) {
  const monthsWithChanges = snapshots.filter(s => s.hasChanges);
  const monthsWithWarnings = snapshots.filter(s => s.warnings.length > 0);
  
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  
  const formatDiff = (oldVal: number | null, newVal: number | null) => {
    if (oldVal === newVal) return null;
    const diff = (newVal || 0) - (oldVal || 0);
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${formatCurrency(diff)}`;
  };
  
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard variant="subtle" className="p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-gray-700" />
            <div>
              <div className="text-sm font-medium text-gray-600">Months to Update</div>
              <div className="text-lg font-semibold">{monthsWithChanges.length}</div>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard variant="subtle" className="p-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-700" />
            <div>
              <div className="text-sm font-medium text-gray-600">Total Enrollment</div>
              <div className="text-lg font-semibold">
                {snapshots.reduce((sum, s) => sum + (s.enrollment?.memberCount || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>
        </GlassCard>
        
        {monthsWithWarnings.length > 0 && (
          <GlassCard variant="subtle" className="p-3 border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gray-700" />
              <div>
                <div className="text-sm font-medium text-gray-600">Warnings</div>
                <div className="text-lg font-semibold text-gray-700">{monthsWithWarnings.length}</div>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
      
      {/* Detailed Preview Table */}
      <GlassCard variant="elevated" className="p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Monthly Changes Preview
        </h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Month</th>
                <th className="text-center py-2 px-3">Enrollment</th>
                <th className="text-right py-2 px-3">Fixed Costs</th>
                <th className="text-right py-2 px-3">Budget</th>
                <th className="text-right py-2 px-3">Stop Loss</th>
                <th className="text-right py-2 px-3">Rebates</th>
                <th className="text-center py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snapshot, idx) => (
                <tr 
                  key={snapshot.month}
                  className={`
                    border-b transition-colors
                    ${snapshot.hasChanges ? 'bg-gray-50/50' : ''}
                    ${snapshot.warnings.length > 0 ? 'bg-gray-100/50' : ''}
                  `}
                >
                  <td className="py-2 px-3 font-medium">
                    {formatMonth(snapshot.month)}
                  </td>
                  
                  <td className="py-2 px-3 text-center">
                    {snapshot.enrollment ? (
                      <div className="text-xs">
                        <div>{snapshot.enrollment.employeeCount} emp</div>
                        <div className="text-gray-500">{snapshot.enrollment.memberCount} mbr</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  
                  <td className="py-2 px-3 text-right">
                    <div>
                      {formatCurrency(snapshot.newTotalFixed)}
                    </div>
                    {snapshot.hasChanges && (
                      <div className="text-xs text-gray-700">
                        {formatDiff(snapshot.currentTotalFixed, snapshot.newTotalFixed)}
                      </div>
                    )}
                  </td>
                  
                  <td className="py-2 px-3 text-right">
                    <div>
                      {snapshot.newBudget !== null ? formatCurrency(snapshot.newBudget) : '-'}
                    </div>
                    {snapshot.hasChanges && snapshot.currentBudget !== snapshot.newBudget && (
                      <div className="text-xs text-gray-700">
                        {formatDiff(snapshot.currentBudget, snapshot.newBudget)}
                      </div>
                    )}
                  </td>
                  
                  <td className="py-2 px-3 text-right">
                    <div>
                      {snapshot.newStopLossReimb !== null ? formatCurrency(snapshot.newStopLossReimb) : '-'}
                    </div>
                    {snapshot.hasChanges && snapshot.currentStopLossReimb !== snapshot.newStopLossReimb && (
                      <div className="text-xs text-gray-700">
                        {formatDiff(snapshot.currentStopLossReimb, snapshot.newStopLossReimb)}
                      </div>
                    )}
                  </td>
                  
                  <td className="py-2 px-3 text-right">
                    <div>
                      {snapshot.newRebates !== null ? formatCurrency(snapshot.newRebates) : '-'}
                    </div>
                    {snapshot.hasChanges && snapshot.currentRebates !== snapshot.newRebates && (
                      <div className="text-xs text-gray-700">
                        {formatDiff(snapshot.currentRebates, snapshot.newRebates)}
                      </div>
                    )}
                  </td>
                  
                  <td className="py-2 px-3 text-center">
                    {snapshot.warnings.length > 0 ? (
                      <div className="inline-flex items-center gap-1 text-gray-700">
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-xs">Warning</span>
                      </div>
                    ) : snapshot.hasChanges ? (
                      <div className="inline-flex items-center gap-1 text-gray-700">
                        <CheckCircle className="w-3 h-3" />
                        <span className="text-xs">Update</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No Change</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Warnings Section */}
        {monthsWithWarnings.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-gray-700 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-gray-800 mb-1">Warnings:</div>
                <ul className="space-y-1 text-gray-700">
                  {monthsWithWarnings.map(s => (
                    <li key={s.month}>
                      <span className="font-medium">{formatMonth(s.month)}:</span> {s.warnings.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </GlassCard>
      
      {/* Action Buttons */}
      {(onConfirm || onCancel) && (
        <div className="flex justify-end gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          {onConfirm && (
            <button
              onClick={onConfirm}
              disabled={monthsWithChanges.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Apply to {monthsWithChanges.length} Month{monthsWithChanges.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
