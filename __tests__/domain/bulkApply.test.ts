import { describe, expect, it } from 'vitest';
import {
  executeBulkApply,
  expandMonths
} from '../../app/services/bulkApplyService';
import {
  BulkApplyConfig,
  ConflictPolicy,
  MonthlyEnrollment
} from '../../app/types/bulkApply';
import { FeesConfig, FeeItem } from '../../app/components/forms/FeesConfigurator';

describe('executeBulkApply', () => {
  const baseFees: FeeItem[] = [
    { id: 'admin', label: 'Admin Fee', amount: 12, basis: 'PEPM' },
    { id: 'stoploss', label: 'Stop Loss Premium', amount: 8000, basis: 'Monthly' }
  ];

  const buildEnrollment = (months: string[]): Map<string, MonthlyEnrollment> => {
    const map = new Map<string, MonthlyEnrollment>();
    months.forEach((month, index) => {
      map.set(month, {
        month,
        employeeCount: 100 + index,
        memberCount: 250 + index * 5
      });
    });
    return map;
  };

  it('returns an updated configuration with applied per-month overrides', () => {
    const existingConfig: FeesConfig = {
      fees: baseFees,
      budgetOverride: { amount: 250000, basis: 'Monthly' },
      stopLossReimb: 1500,
      perMonth: {
        '2025-08': {
          fees: {
            admin: { amount: 14, basis: 'PEPM' }
          },
          stopLossReimb: 1200
        }
      }
    };

    const bulkConfig: BulkApplyConfig = {
      startMonth: '2025-09',
      duration: 2,
      components: {
        fees: true,
        budget: true,
        stopLossReimb: true,
        rebates: true
      },
      conflictPolicy: ConflictPolicy.OVERWRITE,
      sourceFees: [
        { id: 'admin', label: 'Admin Fee', amount: 15, basis: 'PEPM' },
        { id: 'stoploss', label: 'Stop Loss Premium', amount: 8250, basis: 'Monthly' }
      ],
      sourceBudget: { amount: 300000, basis: 'Monthly' },
      sourceStopLossReimb: 2000,
      sourceRebates: 500
    };

    const targetMonths = expandMonths(bulkConfig.startMonth, bulkConfig.duration);
    const enrollmentData = buildEnrollment(targetMonths);

    const result = executeBulkApply(bulkConfig, existingConfig, enrollmentData);
    expect(result.success).toBe(true);
    expect(result.updatedConfig).not.toBe(existingConfig);
    expect(result.updatedConfig.perMonth).toBeDefined();
    expect(Object.keys(result.updatedConfig.perMonth || {})).toContain('2025-08');
    expect(result.updatedConfig.perMonth?.['2025-09']?.fees?.admin?.amount).toBe(15);
    expect(result.updatedConfig.perMonth?.['2025-09']?.budgetOverride?.amount).toBe(300000);
    expect(result.updatedConfig.perMonth?.['2025-09']?.stopLossReimb).toBe(2000);
    expect(result.updatedConfig.perMonth?.['2025-09']?.rebates).toBe(500);
    expect(result.updatedConfig.perMonth?.['2025-10']?.fees?.stoploss?.amount).toBe(8250);
    expect(result.monthsUpdated).toEqual(['2025-09', '2025-10']);
  });
});
