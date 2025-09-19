// touched by PR-008: dashboard table visual refresh + virtualization
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { parseNumericValue, formatCurrency, formatPercentage } from '@utils/chartDataProcessors';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Search, 
  TrendingUp, 
  TrendingDown,
  Filter,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';

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
  // Medical Plans Section with detailed breakdown
  { key: 'medical_plans', label: 'Medical Plans', category: 'expense', isExpandable: true, 
    children: ['medical_claims', 'medical_admin'] },
  { key: 'medical_claims', label: '  Medical Claims', category: 'expense', isExpandable: true,
    children: ['inpatient', 'outpatient', 'professional', 'emergency', 'domestic_medical', 'non_domestic_medical'] },
  { key: 'inpatient', label: '    Inpatient', category: 'expense' },
  { key: 'outpatient', label: '    Outpatient', category: 'expense' },
  { key: 'professional', label: '    Professional', category: 'expense' },
  { key: 'emergency', label: '    Emergency', category: 'expense' },
  { key: 'domestic_medical', label: '    Domestic Claims', category: 'expense' },
  { key: 'non_domestic_medical', label: '    Non-Domestic Claims', category: 'expense' },
  { key: 'medical_admin', label: '  Medical Admin', category: 'expense' },
  
  // Pharmacy Section with breakdown
  { key: 'pharmacy_claims', label: 'Pharmacy Claims', category: 'expense', isExpandable: true, 
    children: ['rx_claims', 'specialty_rx', 'mail_order', 'domestic_pharmacy', 'non_domestic_pharmacy'] },
  { key: 'rx_claims', label: '  Retail Rx', category: 'expense' },
  { key: 'specialty_rx', label: '  Specialty Rx', category: 'expense' },
  { key: 'mail_order', label: '  Mail Order Rx', category: 'expense' },
  { key: 'domestic_pharmacy', label: '  Domestic Pharmacy', category: 'expense' },
  { key: 'non_domestic_pharmacy', label: '  Non-Domestic Pharmacy', category: 'expense' },
  
  // Fixed Costs Section
  { key: 'fixed_costs', label: 'Fixed Costs', category: 'expense', isExpandable: true, 
    children: ['admin_fees', 'tpa_fees', 'stop_loss_premium', 'wellness_programs'] },
  { key: 'admin_fees', label: '  Admin Fees', category: 'expense' },
  { key: 'tpa_fees', label: '  TPA Fees', category: 'expense' },
  { key: 'stop_loss_premium', label: '  Stop Loss Premium', category: 'expense' },
  { key: 'wellness_programs', label: '  Wellness Programs', category: 'expense' },
  
  // Revenue Items
  { key: 'stop_loss_reimb', label: 'Stop Loss Reimbursements', category: 'revenue' },
  { key: 'pharmacy_rebates', label: 'Pharmacy Rebates', category: 'revenue' },
  { key: 'other_credits', label: 'Other Credits', category: 'revenue' },
  
  // Geographic Breakdown Section
  { key: 'geographic_breakdown', label: 'Geographic Breakdown', category: 'expense', isExpandable: true,
    children: ['total_domestic', 'total_non_domestic'] },
  { key: 'total_domestic', label: '  Total Domestic', category: 'expense' },
  { key: 'total_non_domestic', label: '  Total Non-Domestic', category: 'expense' },
  
  // Totals and Analysis
  { key: 'total_expenses', label: 'Total Expenses', category: 'total' },
  { key: 'total_revenues', label: 'Total Revenues', category: 'total' },
  { key: 'net_cost', label: 'Net Cost', category: 'total' },
  { key: 'budget', label: 'Budget', category: 'budget' },
  { key: 'variance', label: 'Variance (Budget - Net)', category: 'total' },
  { key: 'variance_percent', label: 'Variance %', category: 'total' },
  { key: 'loss_ratio', label: 'Loss Ratio %', category: 'total' },
];

// Row height configuration for virtualization
const ROW_HEIGHT = 52; // Height in pixels for each table row
const HEADER_HEIGHT = 60; // Height for table header

interface RowData {
  items: LineItem[];
  matrix: Record<string, Record<string, number>>;
  months: string[];
  hiddenColumns: Set<number>;
  expandedRows: Set<string>;
  selectedCell: { row: string; month: string } | null;
  onToggleExpansion: (key: string) => void;
  onCellSelect: (row: string, month: string) => void;
}

const VirtualizedFinancialDataTable: React.FC<FinancialDataTableProps> = ({ budgetData, claimsData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [hiddenColumns, setHiddenColumns] = useState<Set<number>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ row: string; month: string } | null>(null);

  // Transform data into matrix format (same logic as original)
  const matrixData = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    const months: string[] = [];
    
    // Initialize matrix structure
    LINE_ITEMS.forEach(item => {
      matrix[item.key] = {};
    });

    // Process budget data (same processing logic as original)
    if (budgetData && budgetData.length > 0) {
      budgetData.forEach(row => {
        const month = row.month || row.Month || row.period || '';
        if (!months.includes(month)) months.push(month);

        const parseValue = (value: any) => {
          if (typeof value === 'number') return value;
          if (!value) return 0;
          return parseNumericValue(value);
        };

        // Medical Plans with detailed breakdown
        const inpatient = parseValue(row['Inpatient'] || row['inpatient'] || 0);
        const outpatient = parseValue(row['Outpatient'] || row['outpatient'] || 0);
        const professional = parseValue(row['Professional'] || row['professional'] || 0);
        const emergency = parseValue(row['Emergency'] || row['emergency'] || 0);
        
        // Geographic breakdown for medical claims
        const domesticMedical = parseValue(row['Domestic Medical'] || row['domestic_medical'] || 0);
        const nonDomesticMedical = parseValue(row['Non-Domestic Medical'] || row['non_domestic_medical'] || 0);
        
        // If we have detailed breakdown, use it
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
        
        // Geographic data processing
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

        // Pharmacy processing (similar logic)
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

        // Fixed Costs
        const adminFees = parseValue(row['Admin Fees'] || row['admin_fees'] || 0);
        const tpaFees = parseValue(row['TPA Fee'] || row['tpa_fee'] || 0);
        const stopLossPremium = parseValue(row['Stop Loss Premium'] || row['stop_loss_premium'] || 0);
        const wellnessPrograms = parseValue(row['Wellness Programs'] || row['wellness_programs'] || 0);
        const fixedCosts = parseValue(row['Fixed Costs'] || row['fixed_costs'] || (adminFees + tpaFees + stopLossPremium + wellnessPrograms));
        
        matrix['admin_fees'][month] = adminFees;
        matrix['tpa_fees'] = matrix['tpa_fees'] || {};
        matrix['tpa_fees'][month] = tpaFees;
        matrix['stop_loss_premium'][month] = stopLossPremium;
        matrix['wellness_programs'][month] = wellnessPrograms;
        matrix['fixed_costs'][month] = fixedCosts;

        // Revenues
        matrix['stop_loss_reimb'][month] = parseValue(row['Stop Loss Reimbursements'] || row['stop_loss_reimb'] || 0);
        matrix['pharmacy_rebates'][month] = parseValue(row['Rx Rebates'] || row['pharmacy_rebates'] || 0);
        matrix['other_credits'][month] = parseValue(row['Other Credits'] || row['other_credits'] || 0);

        // Budget
        matrix['budget'][month] = parseValue(row['Budget'] || row['budget'] || 0);
        
        // Geographic totals
        matrix['total_domestic'][month] = matrix['domestic_medical'][month] + matrix['domestic_pharmacy'][month];
        matrix['total_non_domestic'][month] = matrix['non_domestic_medical'][month] + matrix['non_domestic_pharmacy'][month];
        matrix['geographic_breakdown'][month] = matrix['total_domestic'][month] + matrix['total_non_domestic'][month];

        // Calculate totals
        const totalExpenses = parseValue(row['Total Expenses']) || (matrix['medical_plans'][month] + matrix['pharmacy_claims'][month] + matrix['fixed_costs'][month]);
        const totalRevenues = parseValue(row['Total Revenues']) || (matrix['stop_loss_reimb'][month] + matrix['pharmacy_rebates'][month] + matrix['other_credits'][month]);
        const netCost = parseValue(row['Net Cost']) || (totalExpenses - totalRevenues);
        
        matrix['total_expenses'][month] = totalExpenses;
        matrix['total_revenues'][month] = totalRevenues;
        matrix['net_cost'][month] = netCost;
        matrix['variance'][month] = parseValue(row['Variance']) || (matrix['budget'][month] - netCost);
        matrix['variance_percent'][month] = parseValue(row['Variance %']) || (matrix['budget'][month] > 0 
          ? ((matrix['budget'][month] - netCost) / matrix['budget'][month]) * 100 
          : 0);
        
        // Calculate Loss Ratio
        const totalClaims = matrix['medical_claims'][month] + matrix['pharmacy_claims'][month];
        matrix['loss_ratio'][month] = netCost > 0 ? (totalClaims / netCost) * 100 : 0;
      });
    }

    return { matrix, months };
  }, [budgetData, claimsData]);

  // Get cell color based on value and type
  const getCellColor = (value: number, category: string, isVariance: boolean = false) => {
    if (isVariance) {
      if (value > 0) return 'bg-emerald-50 text-emerald-700';
      if (value < 0) return 'bg-rose-50 text-rose-700';
      return 'bg-white text-slate-700';
    }

    if (category === 'expense') return 'bg-white/5 text-slate-600';
    if (category === 'revenue') return 'bg-cyan-500/15 text-cyan-100';
    if (category === 'total') return 'bg-slate-950 text-slate-900 font-semibold';
    if (category === 'budget') return 'bg-amber-500/10 text-amber-100';
    return 'text-slate-600';
  };

  // Toggle row expansion
  const toggleRowExpansion = useCallback((key: string) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(key)) {
        newExpanded.delete(key);
      } else {
        newExpanded.add(key);
      }
      return newExpanded;
    });
  }, []);

  // Handle cell selection
  const handleCellSelect = useCallback((row: string, month: string) => {
    setSelectedCell({ row, month });
  }, []);

  // Toggle column visibility
  const toggleColumn = (index: number) => {
    const newHidden = new Set(hiddenColumns);
    if (newHidden.has(index)) {
      newHidden.delete(index);
    } else {
      newHidden.add(index);
    }
    setHiddenColumns(newHidden);
  };

  // Export to CSV
  const exportToCSV = () => {
    const needsQuoting = (val: string) => /[",\n]/.test(val);
    const sanitizeForCSV = (val: unknown) => {
      if (val === null || val === undefined) return '';
      let s = String(val);
      if (/^[=+\-@]/.test(s)) s = ` '${s}`;
      if (needsQuoting(s)) s = '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const headers = ['Line Item', ...matrixData.months, 'Total', 'Average'];
    const rows = visibleLineItems.map(item => {
      const values = matrixData.months.map(month => matrixData.matrix[item.key][month] || 0);
      const total = values.reduce((sum, val) => sum + val, 0);
      const average = values.length > 0 ? total / values.length : 0;
      const valueStrings = values.map(v => item.key === 'variance_percent' ? formatPercentage(v) : Math.round(v));
      const totalStr = item.key === 'variance_percent' ? formatPercentage(total) : Math.round(total);
      const avgStr = item.key === 'variance_percent' ? formatPercentage(average) : Math.round(average || 0);
      return [
        sanitizeForCSV(item.label),
        ...valueStrings.map(sanitizeForCSV),
        sanitizeForCSV(totalStr),
        sanitizeForCSV(avgStr)
      ].join(',');
    });
    const csv = [headers.map(sanitizeForCSV).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financial_data.csv';
    a.click();
  };

  // Filter line items based on search and expansion (same logic as original)
  const visibleLineItems = useMemo(() => {
    let items = LINE_ITEMS;
    
    if (searchTerm) {
      items = items.filter(item => 
        item.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    const visibleItems: LineItem[] = [];
    items.forEach(item => {
      if (!item.label.startsWith(' ')) {
        visibleItems.push(item);
        return;
      }
      
      const leadingSpaces = item.label.match(/^(\s+)/)?.[0].length || 0;
      
      if (leadingSpaces > 0) {
        let shouldShow = true;
        
        if (leadingSpaces === 2) {
          const parent = LINE_ITEMS.find(p => p.children?.includes(item.key));
          if (parent && !expandedRows.has(parent.key)) {
            shouldShow = false;
          }
        }
        
        if (leadingSpaces === 4) {
          const parent = LINE_ITEMS.find(p => p.children?.includes(item.key));
          if (parent && !expandedRows.has(parent.key)) {
            shouldShow = false;
          } else {
            const grandparent = LINE_ITEMS.find(gp => gp.children?.includes(parent?.key || ''));
            if (grandparent && !expandedRows.has(grandparent.key)) {
              shouldShow = false;
            }
          }
        }
        
        if (shouldShow) {
          visibleItems.push(item);
        }
      }
    });
    
    return visibleItems;
  }, [searchTerm, expandedRows]);

  // Virtualized row renderer
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = visibleLineItems[index];
    if (!item) return null;

    const values = matrixData.months.map(month => matrixData.matrix[item.key]?.[month] || 0);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = values.length > 0 ? total / values.length : 0;
    const isParent = item.isExpandable;
    const isChild = item.label.startsWith('  ');
    
    return (
      <div
        style={style}
        className={`flex items-center hover:bg-slate-50 transition-colors border-b border-slate-200 ${
          item.category === 'total' ? 'bg-slate-900 text-white font-semibold' : 'bg-white text-slate-700'
        }`}
      >
        {/* Line Item Column (Fixed) */}
        <div className={`flex-shrink-0 w-[200px] px-5 py-4 text-sm border-r border-slate-200 ${
          item.category === 'total' ? 'font-semibold text-white' : 'text-slate-700'
        } ${isChild ? 'pl-10 text-slate-600' : ''} bg-white`}>
          <div className="flex items-center">
            {isParent && (
              <button
                onClick={() => toggleRowExpansion(item.key)}
                className="mr-2 text-gray-500 hover:text-gray-700"
              >
                {expandedRows.has(item.key) ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronRight className="w-4 h-4" />
                }
              </button>
            )}
            <span className="truncate">{item.label}</span>
          </div>
        </div>

        {/* Data Columns (Scrollable) */}
        <div className="flex-1 flex">
          {matrixData.months.map((month, colIndex) => {
            if (hiddenColumns.has(colIndex)) return null;
            const value = matrixData.matrix[item.key]?.[month] || 0;
            const isVariance = item.key === 'variance' || item.key === 'variance_percent';
            
            return (
              <div
                key={month}
                onClick={() => handleCellSelect(item.key, month)}
                className={`flex-shrink-0 w-[120px] px-3 py-4 text-sm text-right cursor-pointer transition-colors ${
                  getCellColor(value, item.category, isVariance)
                } ${
                  selectedCell?.row === item.key && selectedCell?.month === month
                    ? 'ring-2 ring-cyan-300/60 ring-inset'
                    : ''
                }`}
              >
                {(item.key === 'variance_percent' || item.key === 'loss_ratio')
                  ? formatPercentage(value)
                  : item.category === 'revenue' || item.category === 'expense' || item.category === 'total' || item.category === 'budget'
                  ? formatCurrency(value)
                  : value
                }
                {isVariance && value !== 0 && (
                  <span className="ml-1">
                    {value > 0 ? <TrendingUp className="w-3 h-3 inline text-emerald-600" /> : <TrendingDown className="w-3 h-3 inline text-rose-600" />}
                  </span>
                )}
              </div>
            );
          })}
          
          {/* Total Column */}
          <div className={`flex-shrink-0 w-[120px] px-3 py-4 text-sm text-right font-semibold border-l border-slate-200 bg-white ${
            item.key === 'variance' && total !== 0 ? (total > 0 ? 'text-emerald-600' : 'text-rose-600') : ''
          }`}>
            {(item.key === 'variance_percent' || item.key === 'loss_ratio')
              ? formatPercentage(average)
              : formatCurrency(total)
            }
          </div>
          
          {/* Average Column */}
          <div className={`flex-shrink-0 w-[120px] px-3 py-4 text-sm text-right bg-white ${
            item.key === 'variance' && average !== 0 ? (average > 0 ? 'text-emerald-600' : 'text-rose-600') : ''
          }`}>
            {(item.key === 'variance_percent' || item.key === 'loss_ratio')
              ? formatPercentage(average)
              : formatCurrency(average)
            }
          </div>
        </div>
      </div>
    );
  }, [visibleLineItems, matrixData, hiddenColumns, expandedRows, selectedCell, toggleRowExpansion, handleCellSelect]);

  // Calculate table dimensions
  const tableHeight = Math.min(600, visibleLineItems.length * ROW_HEIGHT + HEADER_HEIGHT);

  return (
    <div className="w-full h-full flex flex-col rounded-3xl border border-slate-200 bg-white shadow-[0_30px_60px_rgba(15,23,42,0.12)]">
      {/* Header - Same as original */}
      <div className="p-6 border-b border-slate-200 bg-white rounded-t-3xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Financial Data Overview (Virtualized)</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-white/80 border border-white/20 rounded-full transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={exportToCSV}
              className="px-5 py-2 bg-gradient-to-r from-cyan-400 to-emerald-300 text-slate-900 font-semibold rounded-full hover:opacity-90 transition-all shadow-[0_15px_40px_rgba(45,212,191,0.45)] flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
            <input
              type="text"
              placeholder="Search line items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-2.5 w-full rounded-full border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
          </div>
        </div>

        {/* Column visibility settings */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm"
          >
            <p className="text-sm font-medium text-slate-600 mb-3">Show/Hide Months:</p>
            <div className="flex flex-wrap gap-2">
              {matrixData.months.map((month, index) => (
                <button
                  key={month}
                  onClick={() => toggleColumn(index)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors border ${
                    hiddenColumns.has(index)
                      ? 'bg-white border-white/10 text-slate-600'
                      : 'bg-white border-white/20 text-slate-900'
                  }`}
                >
                  {hiddenColumns.has(index) ? <EyeOff className="w-3 h-3 inline mr-1" /> : <Eye className="w-3 h-3 inline mr-1" />}
                  {month}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Virtualized Table Container */}
      <div className="flex-1 overflow-hidden">
        {/* Table Header (Fixed) */}
        <div className="flex bg-slate-50 border-b border-slate-200" style={{ height: HEADER_HEIGHT }}>
          <div className="flex-shrink-0 w-[200px] px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.3em] border-r border-slate-200">
            Line Item
          </div>
          <div className="flex-1 flex">
            {matrixData.months.map((month, index) => 
              !hiddenColumns.has(index) && (
                <div key={month} className="flex-shrink-0 w-[120px] px-3 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.3em]">
                  {month}
                </div>
              )
            )}
            <div className="flex-shrink-0 w-[120px] px-3 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.3em] border-l border-slate-200">Total</div>
            <div className="flex-shrink-0 w-[120px] px-3 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.3em]">Average</div>
          </div>
        </div>

        {/* Virtualized Rows */}
        <List
          height={tableHeight - HEADER_HEIGHT}
          itemCount={visibleLineItems.length}
          itemSize={ROW_HEIGHT}
          width="100%"
        >
          {Row}
        </List>
      </div>

      {/* Summary Footer - Same as original */}
      <div className="p-5 border-t border-slate-200 bg-white rounded-b-3xl">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">Current View:</span>
            <span className="ml-2 font-semibold text-slate-900">Filtered Selection (Virtualized)</span>
            <span className="ml-2 text-slate-400">({matrixData.months.length} months, {visibleLineItems.length} rows)</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-600">Total Budget (YTD)</p>
            <p className="text-lg font-semibold text-slate-900 mt-2">
              {formatCurrency(
                matrixData.months.reduce((sum, month) => 
                  sum + (matrixData.matrix['budget']?.[month] || 0), 0
                )
              )}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-600">Total Net Cost (YTD)</p>
            <p className="text-lg font-semibold text-slate-900 mt-2">
              {formatCurrency(
                matrixData.months.reduce((sum, month) => 
                  sum + (matrixData.matrix['net_cost']?.[month] || 0), 0
                )
              )}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-600">Total Variance (YTD)</p>
            <p className={`text-lg font-semibold mt-2 ${
              matrixData.months.reduce((sum, month) => sum + (matrixData.matrix['variance']?.[month] || 0), 0) >= 0
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}>
              {formatCurrency(
                matrixData.months.reduce((sum, month) => 
                  sum + (matrixData.matrix['variance']?.[month] || 0), 0
                )
              )}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-600">Avg Monthly Variance %</p>
            <p className={`text-lg font-semibold mt-2 ${
              (matrixData.months.length > 0 
                ? matrixData.months.reduce((sum, month) => sum + (matrixData.matrix['variance_percent']?.[month] || 0), 0) / matrixData.months.length 
                : 0) >= 0
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}>
              {formatPercentage(
                matrixData.months.length > 0 
                  ? matrixData.months.reduce((sum, month) =>
                      sum + (matrixData.matrix['variance_percent']?.[month] || 0), 0
                    ) / matrixData.months.length
                  : 0
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualizedFinancialDataTable;