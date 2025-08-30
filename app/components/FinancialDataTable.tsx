'use client';

import React, { useState, useMemo } from 'react';
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
  Settings,
  Calendar,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
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
    children: ['admin_fees', 'stop_loss_premium', 'wellness_programs'] },
  { key: 'admin_fees', label: '  Admin Fees', category: 'expense' },
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

type DateRangeType = 'rolling12' | 'ytd' | 'custom' | 'all';

const FinancialDataTable: React.FC<FinancialDataTableProps> = ({ budgetData, claimsData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [hiddenColumns, setHiddenColumns] = useState<Set<number>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ row: string; month: string } | null>(null);
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('rolling12');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Helper function to filter data based on date range
  const filterDataByDateRange = (data: any[]) => {
    if (!data || data.length === 0) return [];
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    switch (dateRangeType) {
      case 'rolling12':
        // Get last 12 months
        return data.slice(-12);
      
      case 'ytd':
        // Get data from January of current year to now
        return data.filter(row => {
          const monthStr = row.month || row.Month || row.period || '';
          // Assuming month format includes year (e.g., "Jan 2024")
          if (monthStr.includes(currentYear.toString())) {
            return true;
          }
          // If no year in string, check if it's from recent months
          const monthIndex = data.indexOf(row);
          const isCurrentYear = monthIndex >= data.length - 12; // Rough estimate
          return isCurrentYear;
        });
      
      case 'custom':
        // Filter based on custom date range
        if (customStartDate && customEndDate) {
          // Implementation would depend on exact date format in data
          return data; // For now, return all data
        }
        return data;
      
      case 'all':
      default:
        return data;
    }
  };

  // Transform data into matrix format
  const matrixData = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    const months: string[] = [];
    
    // Initialize matrix structure
    LINE_ITEMS.forEach(item => {
      matrix[item.key] = {};
    });

    // Process budget data
    if (budgetData && budgetData.length > 0) {
      // Filter data based on selected date range
      const recentData = filterDataByDateRange(budgetData);
      
      recentData.forEach(row => {
        const month = row.month || row.Month || row.period || '';
        if (!months.includes(month)) months.push(month);

        // Parse various expense categories
        const parseValue = (value: any) => {
          if (typeof value === 'number') return value;
          if (!value) return 0;
          return parseFloat(String(value).replace(/[$,]/g, '')) || 0;
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
          // Fall back to generic medical claims if no breakdown available
          medicalClaims = parseValue(row['Medical Claims'] || row['medical_claims'] || 0);
          // Estimate breakdown (you can adjust these percentages based on typical distributions)
          matrix['inpatient'][month] = medicalClaims * 0.40;  // 40% typically inpatient
          matrix['outpatient'][month] = medicalClaims * 0.35; // 35% outpatient
          matrix['professional'][month] = medicalClaims * 0.20; // 20% professional
          matrix['emergency'][month] = medicalClaims * 0.05;  // 5% emergency
        }
        
        // If geographic data is available, use it; otherwise estimate
        if (domesticMedical || nonDomesticMedical) {
          matrix['domestic_medical'][month] = domesticMedical;
          matrix['non_domestic_medical'][month] = nonDomesticMedical;
        } else {
          // Estimate domestic vs non-domestic split (typically 85% domestic, 15% non-domestic)
          matrix['domestic_medical'][month] = medicalClaims * 0.85;
          matrix['non_domestic_medical'][month] = medicalClaims * 0.15;
        }
        
        const medicalAdmin = parseValue(row['Medical Admin'] || row['medical_admin'] || 0);
        matrix['medical_claims'][month] = medicalClaims;
        matrix['medical_admin'][month] = medicalAdmin;
        matrix['medical_plans'][month] = medicalClaims + medicalAdmin;

        // Pharmacy with detailed breakdown
        const retailRx = parseValue(row['Retail Rx'] || row['retail_rx'] || row['Rx'] || 0);
        const specialtyRx = parseValue(row['Specialty Rx'] || row['specialty_rx'] || 0);
        const mailOrder = parseValue(row['Mail Order'] || row['mail_order'] || 0);
        
        // Geographic breakdown for pharmacy
        const domesticPharmacy = parseValue(row['Domestic Pharmacy'] || row['domestic_pharmacy'] || 0);
        const nonDomesticPharmacy = parseValue(row['Non-Domestic Pharmacy'] || row['non_domestic_pharmacy'] || 0);
        
        // If we don't have mail order data, estimate it
        if (!mailOrder && retailRx) {
          matrix['rx_claims'][month] = retailRx * 0.7;  // 70% retail
          matrix['mail_order'][month] = retailRx * 0.3; // 30% mail order
        } else {
          matrix['rx_claims'][month] = retailRx;
          matrix['mail_order'][month] = mailOrder;
        }
        
        matrix['specialty_rx'][month] = specialtyRx;
        const totalPharmacy = matrix['rx_claims'][month] + specialtyRx + matrix['mail_order'][month];
        matrix['pharmacy_claims'][month] = totalPharmacy;
        
        // If geographic data is available, use it; otherwise estimate
        if (domesticPharmacy || nonDomesticPharmacy) {
          matrix['domestic_pharmacy'][month] = domesticPharmacy;
          matrix['non_domestic_pharmacy'][month] = nonDomesticPharmacy;
        } else {
          // Estimate domestic vs non-domestic split for pharmacy (typically 90% domestic, 10% non-domestic)
          matrix['domestic_pharmacy'][month] = totalPharmacy * 0.90;
          matrix['non_domestic_pharmacy'][month] = totalPharmacy * 0.10;
        }

        // Fixed Costs with wellness programs
        const adminFees = parseValue(row['Admin Fees'] || row['admin_fees'] || 0);
        const stopLossPremium = parseValue(row['Stop Loss Premium'] || row['stop_loss_premium'] || 0);
        const wellnessPrograms = parseValue(row['Wellness Programs'] || row['wellness_programs'] || 0);
        matrix['admin_fees'][month] = adminFees;
        matrix['stop_loss_premium'][month] = stopLossPremium;
        matrix['wellness_programs'][month] = wellnessPrograms;
        matrix['fixed_costs'][month] = adminFees + stopLossPremium + wellnessPrograms;

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
        const totalExpenses = matrix['medical_plans'][month] + matrix['pharmacy_claims'][month] + matrix['fixed_costs'][month];
        const totalRevenues = matrix['stop_loss_reimb'][month] + matrix['pharmacy_rebates'][month] + matrix['other_credits'][month];
        const netCost = totalExpenses - totalRevenues;
        
        matrix['total_expenses'][month] = totalExpenses;
        matrix['total_revenues'][month] = totalRevenues;
        matrix['net_cost'][month] = netCost;
        matrix['variance'][month] = matrix['budget'][month] - netCost;
        matrix['variance_percent'][month] = matrix['budget'][month] > 0 
          ? ((matrix['budget'][month] - netCost) / matrix['budget'][month]) * 100 
          : 0;
        
        // Calculate Loss Ratio (Claims / Premium)
        // Loss Ratio = (Medical Claims + Pharmacy Claims) / (Net Cost) * 100
        const totalClaims = matrix['medical_claims'][month] + matrix['pharmacy_claims'][month];
        matrix['loss_ratio'][month] = netCost > 0 ? (totalClaims / netCost) * 100 : 0;
      });
    }

    return { matrix, months };
  }, [budgetData, claimsData, dateRangeType, customStartDate, customEndDate]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Get cell color based on value and type
  const getCellColor = (value: number, category: string, isVariance: boolean = false) => {
    if (isVariance) {
      if (value > 0) return 'bg-green-50';
      if (value < 0) return 'bg-red-50';
      return 'bg-gray-50';
    }
    
    if (category === 'expense') return 'bg-red-50';
    if (category === 'revenue') return 'bg-green-50';
    if (category === 'total') return 'bg-blue-50 font-semibold';
    if (category === 'budget') return 'bg-purple-50';
    return '';
  };

  // Toggle row expansion
  const toggleRowExpansion = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

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
    const headers = ['Line Item', ...matrixData.months, 'Total', 'Average'].join(',');
    const rows = LINE_ITEMS.map(item => {
      const values = matrixData.months.map(month => matrixData.matrix[item.key][month] || 0);
      const total = values.reduce((sum, val) => sum + val, 0);
      const average = total / values.length;
      
      return [
        item.label,
        ...values.map(v => item.key === 'variance_percent' ? formatPercentage(v) : v),
        item.key === 'variance_percent' ? formatPercentage(total) : total,
        item.key === 'variance_percent' ? formatPercentage(average) : average.toFixed(0)
      ].join(',');
    });
    
    const csv = [headers, ...rows].join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financial_data.csv';
    a.click();
  };

  // Filter line items based on search and expansion
  const visibleLineItems = useMemo(() => {
    let items = LINE_ITEMS;
    
    // Filter by search term
    if (searchTerm) {
      items = items.filter(item => 
        item.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by expansion state
    const visibleItems: LineItem[] = [];
    items.forEach(item => {
      // Always show top-level items
      if (!item.label.startsWith(' ')) {
        visibleItems.push(item);
        return;
      }
      
      // Check if item is a child (has leading spaces)
      const leadingSpaces = item.label.match(/^(\s+)/)?.[0].length || 0;
      
      if (leadingSpaces > 0) {
        // Find the parent based on the hierarchy
        let shouldShow = true;
        
        // For second-level items (2 spaces)
        if (leadingSpaces === 2) {
          const parent = LINE_ITEMS.find(p => p.children?.includes(item.key));
          if (parent && !expandedRows.has(parent.key)) {
            shouldShow = false;
          }
        }
        
        // For third-level items (4 spaces)
        if (leadingSpaces === 4) {
          // Check if both grandparent and parent are expanded
          const parent = LINE_ITEMS.find(p => p.children?.includes(item.key));
          if (parent && !expandedRows.has(parent.key)) {
            shouldShow = false;
          } else {
            // Also check grandparent
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

  return (
    <div className="w-full h-full flex flex-col panel-elevated rounded-xl shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 font-heading">Financial Data Overview</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 gradient-accent text-white rounded-lg hover:opacity-90 transition-all shadow-md flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Date Range:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDateRangeType('rolling12')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dateRangeType === 'rolling12'
                  ? 'gradient-keenan text-white shadow-md'
                  : 'bg-white/70 text-gray-700 dark:text-gray-300 hover:bg-white/90 dark:hover:bg-gray-800/50'
              }`}
            >
              Rolling 12 Months
            </button>
            <button
              onClick={() => setDateRangeType('ytd')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dateRangeType === 'ytd'
                  ? 'gradient-keenan text-white shadow-md'
                  : 'bg-white/70 text-gray-700 dark:text-gray-300 hover:bg-white/90 dark:hover:bg-gray-800/50'
              }`}
            >
              Plan YTD
            </button>
            <button
              onClick={() => setDateRangeType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dateRangeType === 'all'
                  ? 'gradient-keenan text-white shadow-md'
                  : 'bg-white/70 text-gray-700 dark:text-gray-300 hover:bg-white/90 dark:hover:bg-gray-800/50'
              }`}
            >
              All Data
            </button>
            <button
              onClick={() => setDateRangeType('custom')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dateRangeType === 'custom'
                  ? 'gradient-keenan text-white shadow-md'
                  : 'bg-white/70 text-gray-700 dark:text-gray-300 hover:bg-white/90 dark:hover:bg-gray-800/50'
              }`}
            >
              Custom Range
            </button>
          </div>
          
          {/* Custom Date Range Inputs */}
          {dateRangeType === 'custom' && (
            <div className="flex gap-2 items-center ml-4">
              <input
                type="month"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Start"
              />
              <span className="text-gray-500">to</span>
              <input
                type="month"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="End"
              />
            </div>
          )}
        </div>
        
        {/* Search and filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search line items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Column visibility settings */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-3 bg-gray-50 rounded-lg"
          >
            <p className="text-sm font-medium text-gray-700 mb-2">Show/Hide Months:</p>
            <div className="flex flex-wrap gap-2">
              {matrixData.months.map((month, index) => (
                <button
                  key={month}
                  onClick={() => toggleColumn(index)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    hiddenColumns.has(index)
                      ? 'bg-gray-200 text-gray-500'
                      : 'bg-blue-100 text-blue-700'
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

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-20 bg-gray-50">
            <tr>
              <th className="sticky left-0 z-30 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider border-r border-gray-200 min-w-[200px] font-subheading">
                Line Item
              </th>
              {matrixData.months.map((month, index) => 
                !hiddenColumns.has(index) && (
                  <th key={month} className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap font-subheading">
                    {month}
                  </th>
                )
              )}
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider border-l border-gray-200 bg-gray-100 font-subheading">
                Total
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gray-100 font-subheading">
                Average
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {visibleLineItems.map((item, rowIndex) => {
              const values = matrixData.months.map(month => matrixData.matrix[item.key]?.[month] || 0);
              const total = values.reduce((sum, val) => sum + val, 0);
              const average = values.length > 0 ? total / values.length : 0;
              const isParent = item.isExpandable;
              const isChild = item.label.startsWith('  ');
              
              return (
                <motion.tr
                  key={item.key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: rowIndex * 0.01 }}
                  className={`hover:bg-gray-50 ${
                    item.category === 'total' ? 'bg-blue-50 font-semibold' : ''
                  } ${item.category === 'budget' ? 'bg-purple-50' : ''}`}
                >
                  <td className={`sticky left-0 z-10 px-4 py-3 text-sm ${
                    item.category === 'total' || item.category === 'budget' ? 'font-semibold' : ''
                  } ${isChild ? 'pl-8 text-gray-700' : 'text-gray-900'} bg-white border-r border-gray-200`}>
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
                      <span>{item.label}</span>
                    </div>
                  </td>
                  {matrixData.months.map((month, colIndex) => {
                    if (hiddenColumns.has(colIndex)) return null;
                    const value = matrixData.matrix[item.key]?.[month] || 0;
                    const isVariance = item.key === 'variance' || item.key === 'variance_percent';
                    
                    return (
                      <td
                        key={month}
                        onClick={() => setSelectedCell({ row: item.key, month })}
                        className={`px-4 py-3 text-sm text-right text-gray-900 cursor-pointer transition-colors font-data ${
                          getCellColor(value, item.category, isVariance)
                        } ${
                          selectedCell?.row === item.key && selectedCell?.month === month
                            ? 'ring-2 ring-blue-500 ring-inset'
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
                            {value > 0 ? <TrendingUp className="w-3 h-3 inline text-green-600" /> : <TrendingDown className="w-3 h-3 inline text-red-600" />}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className={`px-4 py-3 text-sm text-right font-semibold border-l border-gray-200 bg-gray-50 font-data ${
                    item.key === 'variance' && total !== 0 ? (total > 0 ? 'text-green-700' : 'text-red-700') : ''
                  }`}>
                    {(item.key === 'variance_percent' || item.key === 'loss_ratio')
                      ? formatPercentage(average)  // For percentages, show average not total
                      : formatCurrency(total)
                    }
                  </td>
                  <td className={`px-4 py-3 text-sm text-right bg-gray-50 font-data ${
                    item.key === 'variance' && average !== 0 ? (average > 0 ? 'text-green-700' : 'text-red-700') : ''
                  }`}>
                    {(item.key === 'variance_percent' || item.key === 'loss_ratio')
                      ? formatPercentage(average)
                      : formatCurrency(average)
                    }
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Current View: </span>
            <span className="text-blue-600 font-semibold">
              {dateRangeType === 'rolling12' && 'Rolling 12 Months'}
              {dateRangeType === 'ytd' && 'Plan Year to Date'}
              {dateRangeType === 'all' && 'All Available Data'}
              {dateRangeType === 'custom' && `Custom (${customStartDate || 'Start'} to ${customEndDate || 'End'})`}
            </span>
            <span className="ml-2 text-gray-500">
              ({matrixData.months.length} months)
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-600 font-body">Total Budget (YTD)</p>
            <p className="text-lg font-semibold text-purple-700 font-data">
              {formatCurrency(
                matrixData.months.reduce((sum, month) => 
                  sum + (matrixData.matrix['budget']?.[month] || 0), 0
                )
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-body">Total Net Cost (YTD)</p>
            <p className="text-lg font-semibold text-blue-700 font-data">
              {formatCurrency(
                matrixData.months.reduce((sum, month) => 
                  sum + (matrixData.matrix['net_cost']?.[month] || 0), 0
                )
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-body">Total Variance (YTD)</p>
            <p className={`text-lg font-semibold font-data ${
              matrixData.months.reduce((sum, month) => sum + (matrixData.matrix['variance']?.[month] || 0), 0) >= 0
                ? 'text-green-700'
                : 'text-red-700'
            }`}>
              {formatCurrency(
                matrixData.months.reduce((sum, month) => 
                  sum + (matrixData.matrix['variance']?.[month] || 0), 0
                )
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-body">Avg Monthly Variance %</p>
            <p className={`text-lg font-semibold font-data ${
              matrixData.months.reduce((sum, month) => sum + (matrixData.matrix['variance_percent']?.[month] || 0), 0) / matrixData.months.length >= 0
                ? 'text-green-700'
                : 'text-red-700'
            }`}>
              {formatPercentage(
                matrixData.months.reduce((sum, month) => 
                  sum + (matrixData.matrix['variance_percent']?.[month] || 0), 0
                ) / matrixData.months.length
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDataTable;