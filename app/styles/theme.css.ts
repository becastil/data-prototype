import { createTheme, createThemeContract } from '@vanilla-extract/css';
import { lchColors } from '../utils/lchColorSystem';

// Create theme contract - defines the structure
export const vars = createThemeContract({
  colors: {
    // Core monochrome palette
    black: null,
    offBlack: null,
    charcoal: null,
    gray: null,
    lightGray: null,
    paleGray: null,
    cream: null,
    offWhite: null,
    white: null,
    
    // Semantic colors
    background: null,
    foreground: null,
    text: null,
    textSecondary: null,
    border: null,
    
    // Status colors (monochrome with semantic meaning)
    success: null,
    successBg: null,
    warning: null,
    warningBg: null,
    danger: null,
    dangerBg: null,
    info: null,
    infoBg: null,
    
    // Chart colors (monochrome palette)
    chart: {
      primary: null,
      secondary: null,
      tertiary: null,
      quaternary: null,
      quinary: null,
      senary: null,
      septenary: null,
      octonary: null,
    }
  },
  
  fonts: {
    heading: null,
    subheading: null,
    body: null,
    data: null,
  },
  
  spacing: {
    xs: null,
    sm: null,
    md: null,
    lg: null,
    xl: null,
    '2xl': null,
    '3xl': null,
  },
  
  radii: {
    none: null,
    sm: null,
    md: null,
    lg: null,
    xl: null,
    '2xl': null,
    full: null,
  },
  
  shadows: {
    sm: null,
    md: null,
    lg: null,
    xl: null,
  },
  
  transitions: {
    fast: null,
    medium: null,
    slow: null,
  }
});

// Light theme - LCH-based perceptually consistent monochrome
export const lightTheme = createTheme(vars, {
  colors: {
    // Core monochrome palette (LCH-generated for perceptual consistency)
    black: lchColors.monochrome.black,
    offBlack: lchColors.monochrome.charcoal,
    charcoal: lchColors.monochrome.darkGray,
    gray: lchColors.monochrome.gray,
    lightGray: lchColors.monochrome.lightGray,
    paleGray: lchColors.monochrome.paleGray,
    cream: lchColors.monochrome.cream,
    offWhite: lchColors.monochrome.offWhite,
    white: lchColors.monochrome.white,
    
    // Semantic colors
    background: '#FFFFFF',
    foreground: '#000000',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    
    // Status colors (monochrome with icon-based differentiation)
    success: '#000000',
    successBg: '#F5F5DC',
    warning: '#333333',
    warningBg: '#FAFAFA',
    danger: '#000000',
    dangerBg: '#F0F0F0',
    info: '#333333',
    infoBg: '#F5F5DC',
    
    // Chart colors (sophisticated monochrome)
    chart: {
      primary: '#000000',
      secondary: '#333333',
      tertiary: '#666666',
      quaternary: '#999999',
      quinary: '#CCCCCC',
      senary: '#1a1a1a',
      septenary: '#4d4d4d',
      octonary: '#808080',
    }
  },
  
  fonts: {
    heading: '"TASA Orbiter Display", system-ui, -apple-system, sans-serif',
    subheading: '"Montserrat", system-ui, -apple-system, sans-serif',
    body: '"Open Sans", system-ui, -apple-system, sans-serif',
    data: '"Roboto Mono", "Courier New", monospace',
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  
  radii: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 2px 8px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
    md: '0 4px 12px 0 rgba(0, 0, 0, 0.12), 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    lg: '0 8px 24px 0 rgba(0, 0, 0, 0.16), 0 4px 8px 0 rgba(0, 0, 0, 0.08)',
    xl: '0 16px 48px 0 rgba(0, 0, 0, 0.20), 0 8px 16px 0 rgba(0, 0, 0, 0.12)',
  },
  
  transitions: {
    fast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    medium: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  }
});

// Dark theme - Sophisticated dark monochrome
export const darkTheme = createTheme(vars, {
  colors: {
    // Core monochrome palette (inverted)
    black: '#FFFFFF',
    offBlack: '#FAFAFA',
    charcoal: '#CCCCCC',
    gray: '#999999',
    lightGray: '#666666',
    paleGray: '#333333',
    cream: '#2a2a2a',
    offWhite: '#1a1a1a',
    white: '#000000',
    
    // Semantic colors (dark mode)
    background: '#1a1a1a',
    foreground: '#FAFAFA',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    border: '#334155',
    
    // Status colors (dark mode monochrome)
    success: '#FAFAFA',
    successBg: '#333333',
    warning: '#F5F5DC',
    warningBg: '#2a2a2a',
    danger: '#FFFFFF',
    dangerBg: '#2a2a2a',
    info: '#CCCCCC',
    infoBg: '#333333',
    
    // Chart colors (dark monochrome)
    chart: {
      primary: '#FFFFFF',
      secondary: '#CCCCCC',
      tertiary: '#999999',
      quaternary: '#666666',
      quinary: '#F5F5DC',
      senary: '#FAFAFA',
      septenary: '#808080',
      octonary: '#B0B0B0',
    }
  },
  
  fonts: {
    heading: '"TASA Orbiter Display", system-ui, -apple-system, sans-serif',
    subheading: '"Montserrat", system-ui, -apple-system, sans-serif',
    body: '"Open Sans", system-ui, -apple-system, sans-serif',
    data: '"Roboto Mono", "Courier New", monospace',
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  
  radii: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 2px 8px 0 rgba(0, 0, 0, 0.6), 0 1px 2px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.03)',
    md: '0 4px 12px 0 rgba(0, 0, 0, 0.7), 0 2px 4px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
    lg: '0 8px 24px 0 rgba(0, 0, 0, 0.8), 0 4px 8px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
    xl: '0 16px 48px 0 rgba(0, 0, 0, 0.9), 0 8px 16px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
  },
  
  transitions: {
    fast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    medium: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  }
});