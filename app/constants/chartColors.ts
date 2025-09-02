// Shape of chart colors for typing safety
export type ChartColors = typeof chartColors;

// Dynamic chart colors that adapt to theme
export const getChartColors = (): ChartColors => {
  if (typeof window === 'undefined') {
    // SSR fallback
    return chartColors;
  }
  
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  return {
    // Financial chart colors (colorful, color-blind friendly where possible)
    totalFixedCost: computedStyle.getPropertyValue('--chart-octonary').trim() || '#9C755F',
    stopLossReimb: computedStyle.getPropertyValue('--chart-secondary').trim() || '#59A14F',
    rxRebates: computedStyle.getPropertyValue('--chart-quaternary').trim() || '#E15759',
    medicalClaims: computedStyle.getPropertyValue('--chart-tertiary').trim() || '#F28E2B',
    rx: computedStyle.getPropertyValue('--chart-quinary').trim() || '#76B7B2',
    budget: computedStyle.getPropertyValue('--chart-primary').trim() || '#4E79A7',

    // Enrollment chart colors
    enrollment: computedStyle.getPropertyValue('--chart-primary').trim() || '#4E79A7',
    activeEmployees: computedStyle.getPropertyValue('--status-success').trim() || '#22C55E',
    dependents: computedStyle.getPropertyValue('--chart-septenary').trim() || '#EDC949',
    retirees: computedStyle.getPropertyValue('--chart-senary').trim() || '#AF7AA1',

    // Additional colors
    gridColor: computedStyle.getPropertyValue('--gray-300').trim() || '#CFD8DC',
    textColor: computedStyle.getPropertyValue('--gray-700').trim() || '#111827',
    backgroundColor: computedStyle.getPropertyValue('--background').trim() || '#FAFBFC',

    // Status colors
    positive: computedStyle.getPropertyValue('--status-success').trim() || '#22C55E',
    negative: computedStyle.getPropertyValue('--status-danger').trim() || '#EF4444',
    warning: computedStyle.getPropertyValue('--status-warning').trim() || '#F59E0B',
    info: computedStyle.getPropertyValue('--status-info').trim() || '#3B82F6',
  };
};

// Static colors for SSR and fallback - Colorful palette
export const chartColors = {
  // Financial chart colors (Tableau-like palette)
  totalFixedCost: '#9C755F',
  stopLossReimb: '#59A14F',
  rxRebates: '#E15759',
  medicalClaims: '#F28E2B',
  rx: '#76B7B2',
  budget: '#4E79A7',

  // Enrollment colors
  enrollment: '#4E79A7',
  activeEmployees: '#22C55E',
  dependents: '#EDC949',
  retirees: '#AF7AA1',

  // UI colors
  gridColor: '#E0E0E0',
  textColor: '#111827',
  backgroundColor: '#FFFFFF',

  // Status colors
  positive: '#22C55E',
  negative: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

export const chartTheme = {
  fontSize: 12,
  fontFamily: 'var(--font-body, "Open Sans", system-ui, -apple-system, sans-serif)',
};

// Color-blind safe palette (Okabe–Ito inspired)
export const colorBlindSafeColors = {
  orange: '#E69F00',
  skyBlue: '#56B4E9',
  bluishGreen: '#009E73',
  yellow: '#F0E442',
  blue: '#0072B2',
  vermillion: '#D55E00',
  reddishPurple: '#CC79A7',
};
