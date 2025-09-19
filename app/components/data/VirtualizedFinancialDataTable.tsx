// touched by PR-008: dashboard table modern refresh
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  CircleDollarSign,
  PiggyBank
} from 'lucide-react';
import { parseNumericValue, formatCurrency, formatPercentage } from '@utils/chartDataProcessors';
import { cn } from '@/app/lib/utils';

interface FinancialDataTableProps {
  budgetData: any[];
  claimsData: any[];
}

interface LineItem {
  key: string;
  label: string;
  category: 'expense' | 'revenue' | 'total' | 'budget';
  isExpandable?: boolean;
  children?: string[];
}

const LINE_ITEMS: LineItem[] = [
  { key: 'medical_plans', label: 'Medical Plans', category: 'expense', isExpandable: true, children: ['medical_claims', 'medical_admin'] },
  { key: 'medical_claims', label: '  Medical Claims', category: 'expense', isExpandable: true, children: ['inpatient', 'outpatient', 'professional', 'emergency', 'domestic_medical', 'non_domestic_medical'] },
  { key: 'inpatient', label: '    Inpatient', category: 'expense' },
  { key: 'outpatient', label: '    Outpatient', category: 'expense' },
  { key: 'professional', label: '    Professional', category: 'expense' },
  { key: 'emergency', label: '    Emergency', category: 'expense' },
  { key: 'domestic_medical', label: '    Domestic Claims', category: 'expense' },
  { key: 'non_domestic_medical', label: '    Non-Domestic Claims', category: 'expense' },
  { key: 'medical_admin', label: '  Medical Admin', category: 'expense' },

  { key: 'pharmacy_claims', label: 'Pharmacy Claims', category: 'expense', isExpandable: true, children: ['rx_claims', 'specialty_rx', 'mail_order', 'domestic_pharmacy', 'non_domestic_pharmacy'] },
  { key: 'rx_claims', label: '  Retail Rx', category: 'expense' },
  { key: 'specialty_rx', label: '  Specialty Rx', category: 'expense' },
  { key: 'mail_order', label: '  Mail Order Rx', category: 'expense' },
  { key: 'domestic_pharmacy', label: '  Domestic Pharmacy', category: 'expense' },
  { key: 'non_domestic_pharmacy', label: '  Non-Domestic Pharmacy', category: 'expense' },

  { key: 'fixed_costs', label: 'Fixed Costs', category: 'expense', isExpandable: true, children: ['admin_fees', 'tpa_fees', 'stop_loss_premium', 'wellness_programs'] },
  { key: 'admin_fees', label: '  Admin Fees', category: 'expense' },
  { key: 'tpa_fees', label: '  TPA Fees', category: 'expense' },
  { key: 'stop_loss_premium', label: '  Stop Loss Premium', category: 'expense' },
  { key: 'wellness_programs', label: '  Wellness Programs', category: 'expense' },

  { key: 'stop_loss_reimb', label: 'Stop Loss Reimbursements', category: 'revenue' },
  { key: 'pharmacy_rebates', label: 'Pharmacy Rebates', category: 'revenue' },
  { key: 'other_credits', label: 'Other Credits', category: 'revenue' },

  { key: 'geographic_breakdown', label: 'Geographic Breakdown', category: 'expense', isExpandable: true, children: ['total_domestic', 'total_non_domestic'] },
  { key: 'total_domestic', label: '  Total Domestic', category: 'expense' },
  { key: 'total_non_domestic', label: '  Total Non-Domestic', category: 'expense' },

  { key: 'total_expenses', label: 'Total Expenses', category: 'total' },
  { key: 'total_revenues', label: 'Total Revenues', category: 'total' },
  { key: 'net_cost', label: 'Net Cost', category: 'total' },
  { key: 'budget', label: 'Budget', category: 'budget' },
  { key: 'variance', label: 'Variance (Budget - Net)', category: 'total' },
  { key: 'variance_percent', label: 'Variance %', category: 'total' },
  { key: 'loss_ratio', label: 'Loss Ratio %', category: 'total' },
];

const getDepth = (item: LineItem) => (item.label.match(/^(\s+)/)?.[0].length ?? 0) / 2;

const buildParentMap = () => {
  const map = new Map<string, string>();
  LINE_ITEMS.forEach(parent => {
    parent.children?.forEach(child => {
      map.set(child, parent.key);
    });
  });
  return map;
};

const parentMap = buildParentMap();

const findRootParent = (key: string): string | null => {
  let current = parentMap.get(key) ?? null;
  let last = current;
  while (current) {
    last = current;
    current = parentMap.get(current) ?? null;
  }
  return last ?? null;
};

const VirtualizedFinancialDataTable: React.FC<FinancialDataTableProps> = ({ budgetData, claimsData: _claimsData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const topLevelCategories = useMemo(() => LINE_ITEMS.filter(item => item.isExpandable && getDepth(item) === 0).map(item => item.key), []);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(() => new Set(topLevelCategories));

  const matrixData = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    const months: string[] = [];

    LINE_ITEMS.forEach(item => {
      matrix[item.key] = {};
    });

    if (budgetData && budgetData.length > 0) {
      budgetData.forEach(row => {
        const month = row.month || row.Month || row.period || '';
        if (!months.includes(month)) months.push(month);

        const parseValue = (value: any) => {
          if (typeof value === 'number') return value;
          if (!value) return 0;
          return parseNumericValue(value);
        };

        const inpatient = parseValue(row['Inpatient'] || row['inpatient'] || 0);
        const outpatient = parseValue(row['Outpatient'] || row['outpatient'] || 0);
        const professional = parseValue(row['Professional'] || row['professional'] || 0);
        const emergency = parseValue(row['Emergency'] || row['emergency'] || 0);

        const domesticMedical = parseValue(row['Domestic Medical'] || row['domestic_medical'] || 0);
        const nonDomesticMedical = parseValue(row['Non-Domestic Medical'] || row['non_domestic_medical'] || 0);

        let medicalClaims = 0;
        if (inpatient || outpatient || professional || emergency) {
          matrix['inpatient'][month] = inpatient;
          matrix['outpatient'][month] = outpatient;
          matrix['professional'][month] = professional;
          matrix['emergency'][month] = emergency;
          medicalClaims = inpatient + outpatient + professional + emergency;
        } else {
          medicalClaims = parseValue(row['Medical Claims'] || row['medical_claims'] || 0);
          matrix['inpatient'][month] = medicalClaims * 0.40;
          matrix['outpatient'][month] = medicalClaims * 0.35;
          matrix['professional'][month] = medicalClaims * 0.20;
          matrix['emergency'][month] = medicalClaims * 0.05;
        }

        if (domesticMedical || nonDomesticMedical) {
          matrix['domestic_medical'][month] = domesticMedical;
          matrix['non_domestic_medical'][month] = nonDomesticMedical;
        } else {
          matrix['domestic_medical'][month] = medicalClaims * 0.85;
          matrix['non_domestic_medical'][month] = medicalClaims * 0.15;
        }

        const medicalAdmin = parseValue(row['Medical Admin'] || row['medical_admin'] || 0);
        matrix['medical_claims'][month] = medicalClaims;
        matrix['medical_admin'][month] = medicalAdmin;
        matrix['medical_plans'][month] = medicalClaims + medicalAdmin;

        const retailRx = parseValue(row['Retail Rx'] || row['retail_rx'] || row['Rx'] || 0);
        const specialtyRx = parseValue(row['Specialty Rx'] || row['specialty_rx'] || 0);
        const mailOrder = parseValue(row['Mail Order'] || row['mail_order'] || 0);

        const domesticPharmacy = parseValue(row['Domestic Pharmacy'] || row['domestic_pharmacy'] || 0);
        const nonDomesticPharmacy = parseValue(row['Non-Domestic Pharmacy'] || row['non_domestic_pharmacy'] || 0);

        if (!mailOrder && retailRx) {
          matrix['rx_claims'][month] = retailRx * 0.7;
          matrix['mail_order'][month] = retailRx * 0.3;
        } else {
          matrix['rx_claims'][month] = retailRx;
          matrix['mail_order'][month] = mailOrder;
        }

        matrix['specialty_rx'][month] = specialtyRx;
        const totalPharmacy = matrix['rx_claims'][month] + specialtyRx + matrix['mail_order'][month];
        matrix['pharmacy_claims'][month] = totalPharmacy;

        if (domesticPharmacy || nonDomesticPharmacy) {
          matrix['domestic_pharmacy'][month] = domesticPharmacy;
          matrix['non_domestic_pharmacy'][month] = nonDomesticPharmacy;
        } else {
          matrix['domestic_pharmacy'][month] = totalPharmacy * 0.90;
          matrix['non_domestic_pharmacy'][month] = totalPharmacy * 0.10;
        }

        const adminFees = parseValue(row['Admin Fees'] || row['admin_fees'] || 0);
        const tpaFees = parseValue(row['TPA Fee'] || row['tpa_fee'] || 0);
        const stopLossPremium = parseValue(row['Stop Loss Premium'] || row['stop_loss_premium'] || 0);
        const wellnessPrograms = parseValue(row['Wellness Programs'] || row['wellness_programs'] || 0);
        const fixedCosts = parseValue(row['Fixed Costs'] || row['fixed_costs'] || (adminFees + tpaFees + stopLossPremium + wellnessPrograms));

        matrix['admin_fees'][month] = adminFees;
        matrix['tpa_fees'][month] = tpaFees;
        matrix['stop_loss_premium'][month] = stopLossPremium;
        matrix['wellness_programs'][month] = wellnessPrograms;
        matrix['fixed_costs'][month] = fixedCosts;

        matrix['stop_loss_reimb'][month] = parseValue(row['Stop Loss Reimbursements'] || row['stop_loss_reimb'] || 0);
        matrix['pharmacy_rebates'][month] = parseValue(row['Rx Rebates'] || row['pharmacy_rebates'] || 0);
        matrix['other_credits'][month] = parseValue(row['Other Credits'] || row['other_credits'] || 0);

        matrix['budget'][month] = parseValue(row['Budget'] || row['budget'] || 0);

        matrix['total_domestic'][month] = (matrix['domestic_medical'][month] || 0) + (matrix['domestic_pharmacy'][month] || 0);
        matrix['total_non_domestic'][month] = (matrix['non_domestic_medical'][month] || 0) + (matrix['non_domestic_pharmacy'][month] || 0);
        matrix['geographic_breakdown'][month] = (matrix['total_domestic'][month] || 0) + (matrix['total_non_domestic'][month] || 0);

        const parseTotal = (value: any, fallback: number) => {
          const parsed = parseValue(value);
          return parsed !== 0 ? parsed : fallback;
        };

        const totalExpenses = parseTotal(row['Total Expenses'], (matrix['medical_plans'][month] || 0) + (matrix['pharmacy_claims'][month] || 0) + (matrix['fixed_costs'][month] || 0));
        const totalRevenues = parseTotal(row['Total Revenues'], (matrix['stop_loss_reimb'][month] || 0) + (matrix['pharmacy_rebates'][month] || 0) + (matrix['other_credits'][month] || 0));
        const netCost = parseTotal(row['Net Cost'], totalExpenses - totalRevenues);

        matrix['total_expenses'][month] = totalExpenses;
        matrix['total_revenues'][month] = totalRevenues;
        matrix['net_cost'][month] = netCost;
        matrix['variance'][month] = parseValue(row['Variance']) || ((matrix['budget'][month] || 0) - netCost);
        matrix['variance_percent'][month] = parseValue(row['Variance %']) || ((matrix['budget'][month] || 0) > 0 ? (((matrix['budget'][month] || 0) - netCost) / (matrix['budget'][month] || 0)) * 100 : 0);

        const totalClaims = (matrix['medical_claims'][month] || 0) + (matrix['pharmacy_claims'][month] || 0);
        matrix['loss_ratio'][month] = netCost > 0 ? (totalClaims / netCost) * 100 : 0;
      });
    }

    return { matrix, months };
  }, [budgetData]);

  useEffect(() => {
    if (matrixData.months.length === 0) return;
    setSelectedMonths(prev => {
      if (prev.length === 0) return matrixData.months;
      const permitted = prev.filter(month => matrixData.months.includes(month));
      return permitted.length > 0 ? permitted : matrixData.months;
    });
  }, [matrixData.months]);

  useEffect(() => {
    if (!searchTerm) return;
    setExpandedRows(prev => {
      const expanded = new Set(prev);
      const term = searchTerm.toLowerCase();
      LINE_ITEMS.filter(item => item.label.toLowerCase().includes(term)).forEach(item => {
        let parentKey = parentMap.get(item.key) ?? null;
        while (parentKey) {
          expanded.add(parentKey);
          parentKey = parentMap.get(parentKey) ?? null;
        }
      });
      return expanded;
    });
  }, [searchTerm]);

  const displayedMonths = selectedMonths.length > 0 ? selectedMonths : matrixData.months;

  const toggleRowExpansion = useCallback((key: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleCategory = (key: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next.size === 0 ? new Set([key]) : next;
    });
  };

  const toggleMonth = (month: string) => {
    setSelectedMonths(prev => {
      const exists = prev.includes(month);
      if (exists) {
        const filtered = prev.filter(m => m !== month);
        return filtered.length > 0 ? filtered : matrixData.months;
      }
      const combined = [...prev, month];
      return matrixData.months.filter(m => combined.includes(m));
    });
  };

  const matchesFilters = (item: LineItem) => {
    const root = findRootParent(item.key);
    if (!root) return true;
    return selectedCategories.has(root);
  };

  const isVisibleByExpansion = (item: LineItem) => {
    const depth = getDepth(item);
    if (depth === 0) return true;
    let parentKey = parentMap.get(item.key) ?? null;
    while (parentKey) {
      if (!expandedRows.has(parentKey)) return false;
      parentKey = parentMap.get(parentKey) ?? null;
    }
    return true;
  };

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return LINE_ITEMS.filter(item => {
      const matchesSearch = term ? item.label.toLowerCase().includes(term) : true;
      const matchesCategory = matchesFilters(item);
      const expanded = isVisibleByExpansion(item);
      return matchesSearch && matchesCategory && expanded;
    });
  }, [searchTerm, selectedCategories, expandedRows]);

  const getColumnValue = (item: LineItem, column: string) => {
    if (column === 'total') {
      return displayedMonths.reduce((sum, month) => sum + (matrixData.matrix[item.key]?.[month] || 0), 0);
    }
    if (column === 'average') {
      if (displayedMonths.length === 0) return 0;
      return displayedMonths.reduce((sum, month) => sum + (matrixData.matrix[item.key]?.[month] || 0), 0) / displayedMonths.length;
    }
    return matrixData.matrix[item.key]?.[column] || 0;
  };

  const blocks = useMemo(() => {
    const result: LineItem[][] = [];
    let current: LineItem[] = [];

    filteredItems.forEach(item => {
      const depth = getDepth(item);
      if (depth === 0) {
        if (current.length) result.push(current);
        current = [item];
      } else {
        if (!current.length) current = [item];
        else current.push(item);
      }
    });
    if (current.length) result.push(current);
    return result;
  }, [filteredItems]);

  const sortedBlocks = useMemo(() => {
    if (!sortConfig) return blocks;
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    const sorted = [...blocks].sort((a, b) => {
      const valueA = getColumnValue(a[0], sortConfig.column);
      const valueB = getColumnValue(b[0], sortConfig.column);
      if (valueA === valueB) return 0;
      return valueA > valueB ? direction : -direction;
    });
    return sorted;
  }, [blocks, sortConfig, getColumnValue]);

  const sortedItems = useMemo(() => sortedBlocks.flat(), [sortedBlocks]);

  const toggleSort = (column: string) => {
    setSortConfig(prev => {
      if (!prev || prev.column !== column) {
        return { column, direction: 'desc' };
      }
      if (prev.direction === 'desc') {
        return { column, direction: 'asc' };
      }
      return null;
    });
  };

  const totalBudget = useMemo(() => displayedMonths.reduce((sum, month) => sum + (matrixData.matrix['budget']?.[month] || 0), 0), [displayedMonths, matrixData.matrix]);
  const totalNetCost = useMemo(() => displayedMonths.reduce((sum, month) => sum + (matrixData.matrix['net_cost']?.[month] || 0), 0), [displayedMonths, matrixData.matrix]);
  const totalVariance = useMemo(() => displayedMonths.reduce((sum, month) => sum + (matrixData.matrix['variance']?.[month] || 0), 0), [displayedMonths, matrixData.matrix]);
  const avgMonthlyVariance = useMemo(() => {
    if (displayedMonths.length === 0) return 0;
    return totalVariance / displayedMonths.length;
  }, [totalVariance, displayedMonths.length]);

  const chartOptions = useMemo(() => {
    return {
      grid: { top: 30, right: 10, left: 10, bottom: 0, containLabel: true },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0f172a',
        borderRadius: 12,
        borderWidth: 0,
        padding: [8, 12],
        textStyle: { color: '#f8fafc', fontSize: 12 },
        formatter: (params: any[]) => {
          if (!params?.length) return '';
          const point = params[0];
          return `<strong>${point.axisValue}</strong><br/>Net Cost: ${formatCurrency(point.data)}`;
        }
      },
      xAxis: {
        type: 'category',
        data: displayedMonths,
        axisLine: { lineStyle: { color: '#dfe4ed' } },
        axisTick: { show: false },
        axisLabel: { color: '#4b5563', fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#9ca3af', formatter: (value: number) => `$${(value / 1000).toFixed(0)}k` },
        axisLine: { show: false },
        splitLine: { show: false }
      },
      series: [
        {
          type: 'line',
          smooth: true,
          data: displayedMonths.map(month => matrixData.matrix['net_cost']?.[month] || 0),
          lineStyle: { color: 'var(--accent)', width: 3, cap: 'round' },
          itemStyle: { color: 'var(--accent)' },
          areaStyle: { color: 'rgba(37,99,235,0.08)' },
          symbol: 'circle',
          symbolSize: 6
        }
      ]
    };
  }, [displayedMonths, matrixData.matrix]);

  const exportToCSV = () => {
    const headers = ['Line Item', ...displayedMonths, 'Total', 'Average'];
    const needsQuoting = (value: string) => /[",\n]/.test(value);
    const sanitizeForCSV = (value: unknown) => {
      if (value === null || value === undefined) return '';
      let str = String(value);
      if (/^[=+\-@]/.test(str)) str = ` '${str}`;
      if (needsQuoting(str)) str = '"' + str.replace(/"/g, '""') + '"';
      return str;
    };

    const rows = sortedBlocks.map(block => {
      const parent = block[0];
      const values = displayedMonths.map(month => matrixData.matrix[parent.key]?.[month] || 0);
      const total = values.reduce((sum, val) => sum + val, 0);
      const average = values.length > 0 ? total / values.length : 0;
      const valueStrings = values.map(value => (parent.key === 'variance_percent' || parent.key === 'loss_ratio') ? formatPercentage(value) : formatCurrency(value));
      const totalStr = (parent.key === 'variance_percent' || parent.key === 'loss_ratio') ? formatPercentage(total) : formatCurrency(total);
      const averageStr = (parent.key === 'variance_percent' || parent.key === 'loss_ratio') ? formatPercentage(average) : formatCurrency(average);
      return [sanitizeForCSV(parent.label.trim()), ...valueStrings.map(sanitizeForCSV), sanitizeForCSV(totalStr), sanitizeForCSV(averageStr)].join(',');
    });

    const csv = [headers.map(sanitizeForCSV).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'financial-data.csv';
    link.click();
  };

  const mobileCards = useMemo(() => {
    return sortedBlocks.map(block => {
      const item = block[0];
      const total = getColumnValue(item, 'total');
      const latestMonth = displayedMonths[displayedMonths.length - 1];
      const latestValue = latestMonth ? matrixData.matrix[item.key]?.[latestMonth] || 0 : 0;
      return {
        key: item.key,
        label: item.label.trim(),
        total,
        latestMonth,
        latestValue,
        category: item.category
      };
    }).filter(card => getDepth(LINE_ITEMS.find(item => item.key === card.key) ?? LINE_ITEMS[0]) === 0);
  }, [sortedBlocks, displayedMonths, matrixData.matrix]);

  const renderValue = (item: LineItem, value: number, emphasiseVariance = false) => {
    if (item.key === 'variance_percent' || item.key === 'loss_ratio') {
      return formatPercentage(value);
    }
    if (emphasiseVariance) {
      return formatCurrency(value);
    }
    if (item.category === 'revenue' || item.category === 'expense' || item.category === 'total' || item.category === 'budget') {
      return formatCurrency(value);
    }
    return value.toFixed(0);
  };

  const statusSegments = [
    {
      label: 'Budget',
      icon: <PiggyBank className="h-4 w-4 text-[var(--accent)]" aria-hidden />,
      value: formatCurrency(totalBudget)
    },
    {
      label: 'Net Cost',
      icon: <CircleDollarSign className="h-4 w-4 text-[var(--accent)]" aria-hidden />,
      value: formatCurrency(totalNetCost)
    },
    {
      label: 'Variance',
      icon: totalVariance >= 0 ? <ArrowUpRight className="h-4 w-4 text-emerald-600" aria-hidden /> : <ArrowDownRight className="h-4 w-4 text-rose-500" aria-hidden />,
      value: formatCurrency(totalVariance),
      accentClass: totalVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'
    },
    {
      label: 'Avg Monthly Variance',
      icon: avgMonthlyVariance >= 0 ? <ArrowUpRight className="h-4 w-4 text-emerald-600" aria-hidden /> : <ArrowDownRight className="h-4 w-4 text-rose-500" aria-hidden />,
      value: formatCurrency(avgMonthlyVariance),
      accentClass: avgMonthlyVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'
    }
  ];

  return (
    <div className="w-full rounded-3xl bg-white shadow-[0_32px_120px_-60px_rgba(15,23,42,0.4)]">
      <div className="space-y-8 px-6 pt-6 pb-4 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Budget Performance</h2>
            <p className="text-sm text-[var(--foreground-muted)]">Explore key spend drivers with lightweight interactions and a single accent colour.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--button-primary-text)] shadow-[0_16px_48px_-24px_rgba(37,99,235,0.8)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4" aria-hidden />
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-[var(--surface-muted)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--foreground-subtle)]">Total Budget YTD</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--accent)]">{formatCurrency(totalBudget)}</p>
            <p className="text-xs text-[var(--foreground-subtle)]">Across {displayedMonths.length} months</p>
          </div>
          <div className="rounded-2xl bg-[var(--surface-muted)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--foreground-subtle)]">Total Net Cost</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--accent)]">{formatCurrency(totalNetCost)}</p>
            <p className="text-xs text-[var(--foreground-subtle)]">Includes medical, pharmacy, and fixed costs</p>
          </div>
          <div className="rounded-2xl bg-[var(--surface-muted)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--foreground-subtle)]">Total Variance</p>
            <p className={cn('mt-2 text-2xl font-semibold', totalVariance >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
              {formatCurrency(totalVariance)}
            </p>
            <p className="text-xs text-[var(--foreground-subtle)]">Budget minus net cost</p>
          </div>
          <div className="rounded-2xl bg-[var(--surface-muted)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--foreground-subtle)]">Avg Monthly Variance</p>
            <p className={cn('mt-2 text-2xl font-semibold', avgMonthlyVariance >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
              {formatCurrency(avgMonthlyVariance)}
            </p>
            <p className="text-xs text-[var(--foreground-subtle)]">Per month across selection</p>
          </div>
        </div>

        <div className="rounded-3xl bg-[var(--surface-muted)]/60 p-4">
          <ReactECharts option={chartOptions} style={{ height: 220, width: '100%' }} notMerge lazyUpdate aria-label="Monthly net cost trend" />
        </div>

        <div className="space-y-3">
          <div className="relative">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-subtle)]" aria-hidden />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Search line items…"
                  className="w-full rounded-full border-none bg-[var(--surface-muted)] px-12 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-soft)]"
                />
                <button
                  type="button"
                  onClick={() => setFiltersOpen(prev => !prev)}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[var(--foreground-muted)] shadow-sm transition-colors hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-soft)]"
                  aria-label="Toggle filters"
                >
                  <Filter className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {filtersOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute right-0 top-full z-20 mt-3 w-full max-w-lg rounded-2xl border border-[var(--surface-border)] bg-white p-5 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)]"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--foreground-subtle)]">Months</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {matrixData.months.map(month => {
                          const active = displayedMonths.includes(month);
                          return (
                            <button
                              key={month}
                              type="button"
                              onClick={() => toggleMonth(month)}
                              className={cn(
                                'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)]',
                                active
                                  ? 'bg-[var(--accent)] text-[var(--button-primary-text)] shadow-sm'
                                  : 'bg-[var(--surface-muted)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                              )}
                            >
                              {month}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--foreground-subtle)]">Categories</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {topLevelCategories.map(key => {
                          const label = LINE_ITEMS.find(item => item.key === key)?.label.trim() ?? key;
                          const active = selectedCategories.has(key);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => toggleCategory(key)}
                              className={cn(
                                'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)]',
                                active
                                  ? 'bg-[var(--accent)] text-[var(--button-primary-text)] shadow-sm'
                                  : 'bg-[var(--surface-muted)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                              )}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--surface-border)]/60" />

      <div className="px-0 pb-6 md:px-6">
        <div className="md:hidden space-y-4 px-6">
          {mobileCards.map(card => (
            <div key={card.key} className="rounded-2xl bg-[var(--surface-muted)]/70 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[var(--foreground)]">{card.label}</h4>
                {card.latestMonth ? <span className="text-xs text-[var(--foreground-subtle)]">{card.latestMonth}</span> : null}
              </div>
              <p className="mt-2 text-lg font-semibold text-[var(--accent)]">{formatCurrency(card.total)}</p>
              {card.latestMonth ? (
                <p className="text-xs text-[var(--foreground-muted)]">Latest month: {formatCurrency(card.latestValue)}</p>
              ) : null}
            </div>
          ))}
        </div>

        <div className="relative hidden md:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent" />
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm text-[var(--foreground)]">
              <thead>
                <tr className="bg-[var(--background)] text-left text-xs font-semibold uppercase tracking-[0.25em] text-[var(--foreground-subtle)]">
                  <th className="sticky left-0 z-20 bg-[var(--background)] px-4 py-4">Line Item</th>
                  {displayedMonths.map(month => {
                    const isActive = sortConfig?.column === month;
                    return (
                      <th
                        key={month}
                        className="cursor-pointer px-4 py-4 text-right"
                        onClick={() => toggleSort(month)}
                      >
                        <span className="inline-flex items-center justify-end gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">
                          {month}
                          {isActive ? (
                            sortConfig?.direction === 'asc'
                              ? <ArrowUpRight className="h-3 w-3 text-[var(--accent)]" aria-hidden />
                              : <ArrowDownRight className="h-3 w-3 text-[var(--accent)]" aria-hidden />
                          ) : null}
                        </span>
                      </th>
                    );
                  })}
                  <th
                    className="cursor-pointer px-4 py-4 text-right"
                    onClick={() => toggleSort('total')}
                  >
                    <span className="inline-flex items-center justify-end gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">
                      Total
                      {sortConfig?.column === 'total' ? (
                        sortConfig.direction === 'asc'
                          ? <ArrowUpRight className="h-3 w-3 text-[var(--accent)]" aria-hidden />
                          : <ArrowDownRight className="h-3 w-3 text-[var(--accent)]" aria-hidden />
                      ) : null}
                    </span>
                  </th>
                  <th
                    className="cursor-pointer px-4 py-4 text-right"
                    onClick={() => toggleSort('average')}
                  >
                    <span className="inline-flex items-center justify-end gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">
                      Average
                      {sortConfig?.column === 'average' ? (
                        sortConfig.direction === 'asc'
                          ? <ArrowUpRight className="h-3 w-3 text-[var(--accent)]" aria-hidden />
                          : <ArrowDownRight className="h-3 w-3 text-[var(--accent)]" aria-hidden />
                      ) : null}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item, index) => {
                  const depth = getDepth(item);
                  const isParent = item.isExpandable;
                  const rowValues = displayedMonths.map(month => matrixData.matrix[item.key]?.[month] || 0);
                  const total = rowValues.reduce((sum, value) => sum + value, 0);
                  const average = displayedMonths.length ? total / displayedMonths.length : 0;
                  const isVarianceRow = item.key === 'variance' || item.key === 'variance_percent';
                  const rowBackground = index % 2 === 0 ? 'bg-white' : 'bg-[var(--surface-muted)]/70';
                  const varianceClass = item.key === 'variance' || item.key === 'variance_percent'
                    ? total > 0
                      ? 'text-emerald-600'
                      : total < 0
                        ? 'text-rose-600'
                        : 'text-[var(--foreground)]'
                    : 'text-[var(--foreground)]';

                  return (
                    <tr key={`${item.key}-${index}`} className={cn('border-b border-transparent', rowBackground)}>
                      <td className={cn('sticky left-0 z-10 whitespace-nowrap px-4 py-3 text-sm font-medium text-[var(--foreground)]', rowBackground)}>
                        <div className="flex items-center gap-2">
                          {isParent ? (
                            <button
                              type="button"
                              onClick={() => toggleRowExpansion(item.key)}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--foreground-subtle)] transition-colors hover:text-[var(--foreground)]"
                              aria-label={expandedRows.has(item.key) ? `Collapse ${item.label.trim()}` : `Expand ${item.label.trim()}`}
                            >
                              {expandedRows.has(item.key)
                                ? <ChevronDown className="h-4 w-4" aria-hidden />
                                : <ChevronRight className="h-4 w-4" aria-hidden />}
                            </button>
                          ) : (
                            <span className="inline-flex h-6 w-6 items-center justify-center" aria-hidden />
                          )}
                          <span className="truncate" style={{ paddingLeft: depth * 12 }}>{item.label.trim()}</span>
                        </div>
                      </td>
                      {displayedMonths.map((month, columnIndex) => {
                        const value = rowValues[columnIndex];
                        const positive = value > 0;
                        const negative = value < 0;
                        const showArrow = isVarianceRow && value !== 0;
                        return (
                          <td key={month} className="whitespace-nowrap px-4 py-3 text-right text-sm text-[var(--foreground)]">
                            <span className={cn(
                              'inline-flex items-center justify-end gap-1 font-medium',
                              isVarianceRow && positive && 'text-emerald-600',
                              isVarianceRow && negative && 'text-rose-600'
                            )}>
                              {renderValue(item, value, isVarianceRow)}
                              {showArrow ? (
                                value > 0
                                  ? <ArrowUpRight className="h-3 w-3" aria-hidden />
                                  : <ArrowDownRight className="h-3 w-3" aria-hidden />
                              ) : null}
                            </span>
                          </td>
                        );
                      })}
                      <td className={cn('whitespace-nowrap px-4 py-3 text-right text-sm font-semibold', varianceClass)}>
                        <span className="inline-flex items-center justify-end gap-1">
                          {renderValue(item, total, isVarianceRow)}
                          {isVarianceRow && total !== 0 ? (
                            total > 0
                              ? <ArrowUpRight className="h-3 w-3 text-emerald-600" aria-hidden />
                              : <ArrowDownRight className="h-3 w-3 text-rose-600" aria-hidden />
                          ) : null}
                        </span>
                      </td>
                      <td className={cn('whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-[var(--foreground-muted)]', isVarianceRow && average !== 0 ? (average > 0 ? 'text-emerald-600' : 'text-rose-600') : undefined)}>
                        <span className="inline-flex items-center justify-end gap-1">
                          {renderValue(item, average, isVarianceRow)}
                          {isVarianceRow && average !== 0 ? (
                            average > 0
                              ? <ArrowUpRight className="h-3 w-3 text-emerald-600" aria-hidden />
                              : <ArrowDownRight className="h-3 w-3 text-rose-600" aria-hidden />
                          ) : null}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--surface-border)]/80 px-6 py-5">
        <div className="flex flex-col gap-4 rounded-2xl bg-[var(--surface-muted)]/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          {statusSegments.map(segment => (
            <div key={segment.label} className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                {segment.icon}
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--foreground-subtle)]">{segment.label}</p>
                <p className={cn('text-sm font-semibold text-[var(--foreground)]', segment.accentClass)}>{segment.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VirtualizedFinancialDataTable;
