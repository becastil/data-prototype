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

// Static colors for SSR and fallback - Keenan Brand Aligned
export const chartColors = {
  // Financial chart colors - Brand palette
  totalFixedCost: '#10B981',     // Green - positive/fixed
  stopLossReimb: '#00aeef',      // Gallagher Blue - insurance
  rxRebates: '#0032E1',          // AP Blue - rebates
  medicalClaims: '#e87823',      // Keenan Tango - claims
  rx: '#FF8400',                 // Gallagher Orange - pharmacy
  budget: '#00205c',             // Keenan Midnight - budget line
  
  // Enrollment colors
  enrollment: '#00205c',         // Keenan Midnight - primary
  activeEmployees: '#10B981',    // Green - active/healthy
  dependents: '#e87823',         // Keenan Tango - dependents
  retirees: '#575A5D',           // Gallagher Charcoal - retired
  
  // UI colors
  gridColor: '#e6e7e8',          // Gallagher Light Charcoal
  textColor: '#00205c',          // Keenan Midnight
  backgroundColor: '#FAFBFC',
  
  // Status colors - Brand aligned
  positive: '#10B981',           // Green
  negative: '#DC2626',           // Red
  warning: '#e87823',            // Keenan Tango
  info: '#00aeef',               // Gallagher Blue
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