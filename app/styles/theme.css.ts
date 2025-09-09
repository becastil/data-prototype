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

// Light theme - YouTube Content-First Style
export const lightTheme = createTheme(vars, {
  colors: {
    // Core content-first palette
    black: '#0F0F0F',
    offBlack: '#212121',
    charcoal: '#404040',
    gray: '#606060',
    lightGray: '#909090',
    paleGray: '#CCCCCC',
    cream: '#F5F5F5',
    offWhite: '#FAFAFA',
    white: '#FFFFFF',
    
    // Semantic colors - Clean & Minimal
    background: '#FFFFFF',
    foreground: '#0F0F0F',
    text: '#0F0F0F',
    textSecondary: '#212121',
    border: '#E0E0E0',
    
    // Status colors (using dark blue brand + minimal approach)
    success: '#22C55E',
    successBg: '#F5F5F5',
    warning: '#F59E0B',
    warningBg: '#F5F5F5',
    danger: '#EF4444',
    dangerBg: '#F5F5F5',
    info: '#0032E1',
    infoBg: '#F5F5F5',
    
    // Chart colors (neutral grays with brand accent)
    chart: {
      primary: '#0032E1',
      secondary: '#0F0F0F',
      tertiary: '#404040',
      quaternary: '#606060',
      quinary: '#909090',
      senary: '#CCCCCC',
      septenary: '#E0E0E0',
      octonary: '#F5F5F5',
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

// Dark theme - YouTube Content-First Dark Mode
export const darkTheme = createTheme(vars, {
  colors: {
    // Core content-first dark palette
    black: '#FFFFFF',
    offBlack: '#AAAAAA',
    charcoal: '#909090',
    gray: '#606060',
    lightGray: '#404040',
    paleGray: '#333333',
    cream: '#1A1A1A',
    offWhite: '#181818',
    white: '#0F0F0F',
    
    // Semantic colors (dark mode)
    background: '#0F0F0F',
    foreground: '#FFFFFF',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    border: '#333333',
    
    // Status colors (dark mode with brand consistency)
    success: '#22C55E',
    successBg: '#1A1A1A',
    warning: '#F59E0B',
    warningBg: '#1A1A1A',
    danger: '#EF4444',
    dangerBg: '#1A1A1A',
    info: '#0032E1',
    infoBg: '#1A1A1A',
    
    // Chart colors (dark mode with brand accent)
    chart: {
      primary: '#0032E1',
      secondary: '#FFFFFF',
      tertiary: '#AAAAAA',
      quaternary: '#909090',
      quinary: '#606060',
      senary: '#404040',
      septenary: '#333333',
      octonary: '#1A1A1A',
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