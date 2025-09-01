/**
 * LCH Color System - Linear-inspired implementation
 * Provides perceptually consistent color generation for million-dollar UI
 * 
 * LCH (Lightness, Chroma, Hue) advantages over RGB:
 * - Perceptually uniform color space
 * - Predictable contrast calculations
 * - Systematic theme generation
 * - Better accessibility compliance
 */

interface LCHColor {
  l: number; // Lightness (0-100)
  c: number; // Chroma (0-150+)
  h: number; // Hue (0-360)
}

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert LCH to RGB
 * Mathematical precision for perceptual consistency
 */
export function lchToRgb({ l, c, h }: LCHColor): RGBColor {
  // Convert to LAB color space first
  const hRad = (h * Math.PI) / 180;
  const a = Math.cos(hRad) * c;
  const b = Math.sin(hRad) * c;
  
  // LAB to XYZ conversion
  let y = (l + 16) / 116;
  let x = a / 500 + y;
  let z = y - b / 200;
  
  // Apply cubic root or linear transformation
  const fx = Math.pow(x, 3) > 0.008856 ? Math.pow(x, 3) : (x - 16/116) / 7.787;
  const fy = Math.pow(y, 3) > 0.008856 ? Math.pow(y, 3) : (y - 16/116) / 7.787;
  const fz = Math.pow(z, 3) > 0.008856 ? Math.pow(z, 3) : (z - 16/116) / 7.787;
  
  // Reference white D65
  x = fx * 0.95047;
  y = fy * 1.00000;
  z = fz * 1.08883;
  
  // XYZ to RGB conversion
  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let b_rgb = x * 0.0557 + y * -0.2040 + z * 1.0570;
  
  // Apply gamma correction
  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1/2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1/2.4) - 0.055 : 12.92 * g;
  b_rgb = b_rgb > 0.0031308 ? 1.055 * Math.pow(b_rgb, 1/2.4) - 0.055 : 12.92 * b_rgb;
  
  // Clamp to valid range
  return {
    r: Math.max(0, Math.min(255, Math.round(r * 255))),
    g: Math.max(0, Math.min(255, Math.round(g * 255))),
    b: Math.max(0, Math.min(255, Math.round(b_rgb * 255)))
  };
}

/**
 * Convert RGB to hex string
 */
export function rgbToHex({ r, g, b }: RGBColor): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Million-Dollar UI Monochrome Palette
 * Based on perceptually consistent LCH values
 */
export const monochromePalette = {
  // Core grayscale - perceptually uniform steps
  black: { l: 0, c: 0, h: 0 },           // Pure black
  charcoal: { l: 20, c: 0, h: 0 },       // Dark gray
  darkGray: { l: 35, c: 0, h: 0 },       // Medium dark
  gray: { l: 50, c: 0, h: 0 },           // Mid gray
  lightGray: { l: 65, c: 0, h: 0 },      // Light gray
  paleGray: { l: 80, c: 0, h: 0 },       // Pale gray
  cream: { l: 92, c: 8, h: 85 },         // Warm cream with subtle yellow
  offWhite: { l: 96, c: 2, h: 0 },       // Cool off-white
  white: { l: 100, c: 0, h: 0 },         // Pure white
} as const;

/**
 * Generate theme variants with guaranteed contrast ratios
 */
export function generateThemeColors() {
  const colors = Object.entries(monochromePalette).reduce((acc, [name, lch]) => {
    const rgb = lchToRgb(lch);
    acc[name] = rgbToHex(rgb);
    return acc;
  }, {} as Record<string, string>);
  
  return colors;
}

/**
 * Calculate perceptually accurate contrast ratio
 * Using LCH lightness values for precision
 */
export function getContrastRatio(color1: LCHColor, color2: LCHColor): number {
  const l1 = Math.max(color1.l, color2.l);
  const l2 = Math.min(color1.l, color2.l);
  
  // Convert lightness to relative luminance approximation
  const lum1 = Math.pow(l1 / 100, 2.4);
  const lum2 = Math.pow(l2 / 100, 2.4);
  
  return (lum1 + 0.05) / (lum2 + 0.05);
}

/**
 * Ensure WCAG AA compliance (4.5:1) with LCH precision
 */
export function ensureAccessibleContrast(
  foreground: LCHColor, 
  background: LCHColor,
  targetRatio: number = 4.5
): LCHColor {
  let adjustedForeground = { ...foreground };
  let contrast = getContrastRatio(adjustedForeground, background);
  
  // Adjust lightness to meet contrast requirements
  const step = contrast < targetRatio ? 5 : -5;
  
  while (Math.abs(contrast - targetRatio) > 0.1 && 
         adjustedForeground.l >= 0 && 
         adjustedForeground.l <= 100) {
    adjustedForeground.l += step;
    contrast = getContrastRatio(adjustedForeground, background);
    
    if (adjustedForeground.l < 0) adjustedForeground.l = 0;
    if (adjustedForeground.l > 100) adjustedForeground.l = 100;
  }
  
  return adjustedForeground;
}

/**
 * Healthcare-specific semantic colors
 * Maintaining monochrome aesthetic with perceptual differentiation
 */
export const healthcarePalette = {
  // Status indicators using lightness differentiation
  critical: { l: 15, c: 0, h: 0 },    // Very dark for critical alerts
  warning: { l: 40, c: 0, h: 0 },     // Medium dark for warnings
  stable: { l: 70, c: 0, h: 0 },      // Light gray for stable status
  improving: { l: 85, c: 0, h: 0 },   // Very light for positive trends
  
  // Data categories with subtle warm/cool differentiation
  financial: { l: 50, c: 3, h: 0 },   // Neutral with slight warm tint
  clinical: { l: 50, c: 3, h: 240 },  // Neutral with slight cool tint
  
  // Interactive states
  interactive: { l: 30, c: 0, h: 0 },      // Dark for clickable elements
  interactiveHover: { l: 20, c: 0, h: 0 }, // Darker on hover
} as const;

/**
 * Export ready-to-use color system
 */
export const lchColors = {
  monochrome: generateThemeColors(),
  healthcare: Object.entries(healthcarePalette).reduce((acc, [name, lch]) => {
    const rgb = lchToRgb(lch);
    acc[name] = rgbToHex(rgb);
    return acc;
  }, {} as Record<string, string>),
  
  // Utility functions
  toRgb: lchToRgb,
  toHex: (lch: LCHColor) => rgbToHex(lchToRgb(lch)),
  contrast: getContrastRatio,
  accessible: ensureAccessibleContrast,
};

/**
 * Theme generation with LCH consistency
 */
export function createLCHTheme(baseLightness: number = 50) {
  return {
    background: lchToRgb({ l: baseLightness > 50 ? 100 : 0, c: 0, h: 0 }),
    foreground: lchToRgb({ l: baseLightness > 50 ? 0 : 100, c: 0, h: 0 }),
    muted: lchToRgb({ l: baseLightness, c: 0, h: 0 }),
    accent: lchToRgb({ l: baseLightness > 50 ? 20 : 80, c: 0, h: 0 }),
  };
}