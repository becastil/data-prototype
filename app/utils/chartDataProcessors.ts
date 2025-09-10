// Data processing utilities for chart transformations

interface RawDataRow {
  [key: string]: string | number;
  month?: string;
}

interface ProcessedFinancialData {
  month: string;
  totalFixedCost: number;
  stopLossReimb: number;
  rxRebates: number;
  medicalClaims: number;
  rx: number;
  budget: number;
}

interface ProcessedEnrollmentData {
  month: string;
  employeeCount: number;
  change: number;
  percentageChange: number;
}

// Helper function to parse currency/numeric values
export const parseNumericValue = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const stringValue = String(value).trim();
  
  // Handle accounting format with parentheses for negative numbers
  const isNegative = /^\(.*\)$/.test(stringValue);
  // Remove currency symbols, commas, parentheses and stray whitespace
  let cleanedValue = stringValue.replace(/[\$,()\s,]/g, '');
  
  const parsed = parseFloat(cleanedValue);
  const result = isNaN(parsed) ? 0 : parsed;
  
  return isNegative ? -result : result;
};

// Helper function to find and sum admin and stop loss fees
const sumAdminAndStopLossFees = (row: RawDataRow): number => {
  // Prefer explicit computed override if present
  for (const key of Object.keys(row)) {
    const k = key.toLowerCase();
    if (k === 'computed fixed cost' || k === 'fixed cost (computed)') {
      return parseNumericValue(row[key]);
    }
  }
  let total = 0;
  
  // Define explicit sets of column patterns to avoid false positives
  const adminFeePatterns = ['admin fee', 'administrative fee', 'admin cost'];
  const stopLossPatterns = ['stop loss premium', 'stop loss fee', 'stoploss premium'];
  const fixedCostPatterns = ['fixed cost', 'fixed fee', 'fixed admin'];
  
  // Exclude patterns that should not be included
  const excludePatterns = ['reimb', 'rebate', 'refund', 'credit'];
  
  Object.keys(row).forEach(key => {
    const keyLower = key.toLowerCase().trim();
    
    // Skip if it contains exclude patterns
    if (excludePatterns.some(pattern => keyLower.includes(pattern))) {
      return;
    }
    
    // Check for exact matches with known patterns
    const isAdminFee = adminFeePatterns.some(pattern => keyLower.includes(pattern));
    const isStopLoss = stopLossPatterns.some(pattern => keyLower.includes(pattern));
    const isFixedCost = fixedCostPatterns.some(pattern => keyLower.includes(pattern));
    
    if (isAdminFee || isStopLoss || isFixedCost) {
      total += parseNumericValue(row[key]);
    }
  });
  
  return total;
};

// Process financial data for the stacked bar chart with budget line
export const processFinancialData = (
  data: RawDataRow[], 
  rollingMonths: number = 12
): ProcessedFinancialData[] => {
  if (!data || data.length === 0) return [];
  
  const processedData = data.map(row => {
    // Find columns using explicit mapping with priority order
    const findColumn = (patterns: string[]): number => {
      const normalizedKeys = Object.keys(row).map(key => ({
        original: key,
        normalized: key.toLowerCase().trim().replace(/[_\s]+/g, ' ')
      }));
      
      // Try exact matches first, then partial matches
      for (const pattern of patterns) {
        const normalizedPattern = pattern.toLowerCase().trim();
        
        // Exact match first
        const exactMatch = normalizedKeys.find(item => 
          item.normalized === normalizedPattern
        );
        if (exactMatch) {
          return parseNumericValue(row[exactMatch.original]);
        }
        
        // Partial match as fallback
        const partialMatch = normalizedKeys.find(item => 
          item.normalized.includes(normalizedPattern)
        );
        if (partialMatch) {
          return parseNumericValue(row[partialMatch.original]);
        }
      }
      return 0;
    };
    
    // Allow overrides for budget and reimb via computed columns
    const computedBudget = (() => {
      const entry = Object.keys(row).find(k => k.toLowerCase() === 'computed budget');
      return entry ? parseNumericValue(row[entry]) : undefined;
    })();
    const computedReimb = (() => {
      const entry = Object.keys(row).find(k => k.toLowerCase().includes('computed stop loss reimb'));
      return entry ? parseNumericValue(row[entry]) : undefined;
    })();

    return {
      month: String(row.month || row.Month || row.period || row.Period || ''),
      totalFixedCost: sumAdminAndStopLossFees(row),
      stopLossReimb: computedReimb ?? findColumn(['stop loss reimb', 'stop loss reimbursement', 'stoploss reimb']),
      rxRebates: findColumn(['rx rebate', 'pharmacy rebate', 'prescription rebate']),
      medicalClaims: findColumn(['medical claims', 'medical claim', 'claims medical']),
      rx: Math.max(0, findColumn(['rx total', 'pharmacy total', 'prescription total', 'rx', 'pharmacy']) - findColumn(['rx rebate', 'pharmacy rebate'])), // Ensure positive result
      budget: computedBudget ?? findColumn(['budget', 'target', 'plan']),
    };
  });
  
  // Return only the last N months (rolling window)
  return processedData.slice(-rollingMonths);
};

// Process enrollment data from Employee Count column
export const processEnrollmentData = (
  data: RawDataRow[],
  rollingMonths: number = 12
): ProcessedEnrollmentData[] => {
  if (!data || data.length === 0) return [];
  
  // First pass: extract employee counts
  const employeeCounts = data.map(row => {
    // Look for Employee Count or similar columns
    let employeeCount = 0;
    
    // Try different possible column names
    const possibleColumns = [
      'Employee Count',
      'employee_count',
      'employeeCount',
      'Employee_Count',
      'Employees',
      'employees',
      'Total Employees',
      'Enrollment',
      'Total Enrollment',
      'Member Count',
      'Lives',
    ];
    
    for (const colName of possibleColumns) {
      if (row[colName] !== undefined) {
        employeeCount = parseNumericValue(row[colName]);
        break;
      }
    }
    
    // If no employee count column found, try to calculate from other fields
    if (employeeCount === 0 && row['Active Employees']) {
      employeeCount = parseNumericValue(row['Active Employees']);
      if (row['Dependents']) {
        employeeCount += parseNumericValue(row['Dependents']);
      }
      if (row['Retirees']) {
        employeeCount += parseNumericValue(row['Retirees']);
      }
    }
    
    return employeeCount;
  });
  
  // Second pass: create processed data with correct change calculations
  const processedData = data.map((row, index) => {
    const employeeCount = employeeCounts[index];
    
    // Calculate change from previous processed item
    const previousCount = index > 0 ? employeeCounts[index - 1] : employeeCount;
    
    const change = employeeCount - previousCount;
    const percentageChange = previousCount > 0 
      ? (change / previousCount) * 100 
      : 0;
    
    return {
      month: String(row.month || row.Month || row.period || row.Period || `Month ${index + 1}`),
      employeeCount,
      change,
      percentageChange,
    };
  });
  
  // Return only the last N months (rolling window)
  return processedData.slice(-rollingMonths);
};

// Calculate summary statistics for enrollment data
export const calculateEnrollmentStats = (data: ProcessedEnrollmentData[]) => {
  if (!data || data.length === 0) {
    return {
      current: 0,
      previous: 0,
      change: 0,
      percentageChange: 0,
      average: 0,
      min: 0,
      max: 0,
    };
  }
  
  const current = data[data.length - 1]?.employeeCount || 0;
  const previous = data[data.length - 2]?.employeeCount || current;
  const change = current - previous;
  const percentageChange = previous > 0 ? (change / previous) * 100 : 0;
  
  const counts = data.map(d => d.employeeCount);
  const average = counts.reduce((sum, count) => sum + count, 0) / counts.length;
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  
  return {
    current,
    previous,
    change,
    percentageChange,
    average: Math.round(average),
    min,
    max,
  };
};

// Format currency for display
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Format percentage for display
export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};
