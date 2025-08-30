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

// Static colors for SSR and fallback - Minimalist Monochrome
export const chartColors = {
  // Financial chart colors - Grayscale with patterns
  totalFixedCost: '#000000',     // Black - solid
  stopLossReimb: '#333333',      // Charcoal - dashed
  rxRebates: '#666666',          // Gray - dotted
  medicalClaims: '#999999',      // Light gray - solid thick
  rx: '#CCCCCC',                 // Pale gray - solid thin
  budget: '#000000',             // Black - budget line (solid thick)
  
  // Enrollment colors - Different shades
  enrollment: '#000000',         // Black - primary
  activeEmployees: '#333333',    // Charcoal - active
  dependents: '#666666',         // Gray - dependents
  retirees: '#999999',           // Light gray - retired
  
  // UI colors
  gridColor: '#E0E0E0',          // Light gray grid
  textColor: '#000000',          // Black text
  backgroundColor: '#FFFFFF',    // White background
  
  // Status colors - Monochrome with icons
  positive: '#000000',           // Black (use with ✓ icon)
  negative: '#333333',           // Charcoal (use with ✗ icon)
  warning: '#666666',            // Gray (use with ⚠ icon)
  info: '#999999',               // Light gray (use with ℹ icon)
};

export const chartTheme = {
  fontSize: 12,
  fontFamily: 'var(--font-body, "Open Sans", system-ui, -apple-system, sans-serif)',
};

// Color-blind safe palette option - Monochrome (inherently safe)
export const colorBlindSafeColors = {
  primary: '#000000',    // Black
  secondary: '#333333',  // Charcoal
  tertiary: '#666666',   // Gray
  quaternary: '#999999', // Light gray
  quinary: '#CCCCCC',    // Pale gray
  senary: '#1a1a1a',     // Off-black
  septenary: '#808080',  // Medium gray
  octonary: '#B0B0B0',   // Light medium gray
};