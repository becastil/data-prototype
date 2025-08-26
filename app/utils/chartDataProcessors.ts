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
const parseNumericValue = (value: any): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const stringValue = String(value);
  const cleanedValue = stringValue.replace(/[$,]/g, '');
  const parsed = parseFloat(cleanedValue);
  
  return isNaN(parsed) ? 0 : parsed;
};

// Helper function to find and sum admin and stop loss fees
const sumAdminAndStopLossFees = (row: RawDataRow): number => {
  let total = 0;
  
  Object.keys(row).forEach(key => {
    const keyLower = key.toLowerCase();
    // Look for admin fees and stop loss fees
    if (
      keyLower.includes('admin') || 
      keyLower.includes('stop') || 
      keyLower.includes('loss') ||
      keyLower.includes('fixed')
    ) {
      // Skip if it's a reimbursement (we handle that separately)
      if (!keyLower.includes('reimb')) {
        total += parseNumericValue(row[key]);
      }
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
    // Try to find the appropriate columns by various possible names
    const findColumn = (patterns: string[]): number => {
      for (const pattern of patterns) {
        for (const key of Object.keys(row)) {
          if (key.toLowerCase().includes(pattern)) {
            return parseNumericValue(row[key]);
          }
        }
      }
      return 0;
    };
    
    return {
      month: String(row.month || row.Month || row.period || row.Period || ''),
      totalFixedCost: sumAdminAndStopLossFees(row),
      stopLossReimb: findColumn(['stop', 'loss', 'reimb']),
      rxRebates: findColumn(['rx', 'rebate']),
      medicalClaims: findColumn(['medical', 'claim']),
      rx: findColumn(['rx', 'pharmacy']) - findColumn(['rebate']), // Rx minus rebates if rx includes rebates
      budget: findColumn(['budget', 'target', 'plan']),
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
  
  const processedData = data.map((row, index) => {
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
    
    // Calculate change from previous period
    const previousCount = index > 0 
      ? parseNumericValue(data[index - 1]['Employee Count'] || data[index - 1]['employeeCount'] || 0)
      : employeeCount;
    
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