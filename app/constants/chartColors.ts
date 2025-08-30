// Dynamic chart colors that adapt to theme
export const getChartColors = () => {
  if (typeof window === 'undefined') {
    // SSR fallback
    return chartColors;
  }
  
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  return {
    // Financial chart colors - Keenan brand aligned
    totalFixedCost: computedStyle.getPropertyValue('--chart-octonary').trim() || '#10B981',
    stopLossReimb: computedStyle.getPropertyValue('--chart-secondary').trim() || '#00aeef',
    rxRebates: computedStyle.getPropertyValue('--chart-quaternary').trim() || '#0032E1',
    medicalClaims: computedStyle.getPropertyValue('--chart-tertiary').trim() || '#e87823',
    rx: computedStyle.getPropertyValue('--chart-quinary').trim() || '#FF8400',
    budget: computedStyle.getPropertyValue('--chart-primary').trim() || '#00205c',
    
    // Enrollment chart colors
    enrollment: computedStyle.getPropertyValue('--chart-primary').trim() || '#00205c',
    activeEmployees: computedStyle.getPropertyValue('--status-success').trim() || '#10B981',
    dependents: computedStyle.getPropertyValue('--chart-tertiary').trim() || '#e87823',
    retirees: computedStyle.getPropertyValue('--chart-senary').trim() || '#575A5D',
    
    // Additional colors
    gridColor: computedStyle.getPropertyValue('--gray-300').trim() || '#CFD8DC',
    textColor: computedStyle.getPropertyValue('--gray-700').trim() || '#455A64',
    backgroundColor: computedStyle.getPropertyValue('--background').trim() || '#FAFBFC',
    
    // Status colors
    positive: computedStyle.getPropertyValue('--status-success').trim() || '#4CAF50',
    negative: computedStyle.getPropertyValue('--status-danger').trim() || '#EF5350',
    warning: computedStyle.getPropertyValue('--status-warning').trim() || '#FFA726',
    info: computedStyle.getPropertyValue('--status-info').trim() || '#42A5F5',
  };
};

// Static colors for SSR and fallback - CEO Dashboard Palette
export const chartColors = {
  // Financial chart colors - Teal/Green/Cyan palette
  totalFixedCost: '#14B8A6',     // Teal
  stopLossReimb: '#10B981',      // Emerald
  rxRebates: '#22D3EE',          // Cyan
  medicalClaims: '#06B6D4',      // Dark Cyan
  rx: '#0EA5E9',                 // Sky
  budget: '#F59E0B',             // Amber/Orange - budget line
  
  // Enrollment colors
  enrollment: '#14B8A6',         // Teal - primary
  activeEmployees: '#10B981',    // Emerald - active
  dependents: '#F59E0B',         // Amber - dependents
  retirees: '#94A3B8',           // Slate - retired
  
  // UI colors
  gridColor: '#E5E7EB',          // Gray 200
  textColor: '#374151',          // Gray 700
  backgroundColor: '#FFFFFF',
  
  // Status colors - CEO Dashboard aligned
  positive: '#10B981',           // Emerald
  negative: '#EF4444',           // Red
  warning: '#F59E0B',            // Amber
  info: '#06B6D4',               // Cyan
};

export const chartTheme = {
  fontSize: 12,
  fontFamily: 'var(--font-body, "Open Sans", system-ui, -apple-system, sans-serif)',
};

// Color-blind safe palette option - Brand Compatible
export const colorBlindSafeColors = {
  primary: '#00205c',    // Keenan Midnight (safe)
  secondary: '#FF8400',  // Gallagher Orange (safe)
  tertiary: '#00aeef',   // Gallagher Blue (safe)
  quaternary: '#575A5D', // Gallagher Charcoal (safe)
  quinary: '#10B981',    // Green (safe)
  senary: '#0032E1',     // AP Blue (safe)
  septenary: '#e87823',  // Keenan Tango (safe)
  octonary: '#DC2626',   // Red (use sparingly)
};