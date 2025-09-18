// Zero-runtime CSS exports - Vanilla Extract architecture
export { vars, lightTheme, darkTheme } from './theme.css';
export { sprinkles } from './sprinkles.css';
export { 
  gpuAccelerated,
  panelElevated,
  button,
  card,
  input,
  badge,
  loadingPulse,
  motionSafe,
  type ButtonVariants,
  type CardVariants,
  type BadgeVariants
} from './components.css';

// Performance utilities
export const performanceClasses = {
  gpuAccelerated: 'transform: translateZ(0); backface-visibility: hidden; perspective: 1000px;',
  willChange: 'will-change: transform, opacity;',
  motionSafe: '@media (prefers-reduced-motion: reduce) { animation: none !important; }',
} as const;

// Bundle size metrics
export const bundleMetrics = {
  vanillaExtract: 'Zero-runtime CSS',
  estimatedReduction: '60%',
  buildTime: 'Build-time processing',
  caching: 'Static CSS browser caching',
} as const;
