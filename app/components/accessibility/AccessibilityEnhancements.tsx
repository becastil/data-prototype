'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// ARIA live region for screen reader announcements
export const LiveRegion = ({ 
  message, 
  priority = 'polite' 
}: { 
  message: string; 
  priority?: 'polite' | 'assertive' | 'off';
}) => (
  <div
    aria-live={priority}
    aria-atomic="true"
    className="sr-only"
    role="status"
  >
    {message}
  </div>
);

// Skip to main content link
export const SkipToMain = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-black text-white px-4 py-2 rounded font-medium transition-all duration-200"
  >
    Skip to main content
  </a>
);

// Enhanced focus trap for modals and overlays
export const FocusTrap = ({ 
  children, 
  isActive = true 
}: { 
  children: React.ReactNode; 
  isActive?: boolean;
}) => {
  const trapRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const trap = trapRef.current;
    if (!trap) return;

    const focusableElements = trap.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Allow parent to handle escape
        const escapeEvent = new CustomEvent('escape-pressed');
        trap.dispatchEvent(escapeEvent);
      }
    };

    trap.addEventListener('keydown', handleTabKey);
    trap.addEventListener('keydown', handleEscape);
    
    // Focus first element when trap activates
    firstElement?.focus();

    return () => {
      trap.removeEventListener('keydown', handleTabKey);
      trap.removeEventListener('keydown', handleEscape);
    };
  }, [isActive]);

  return (
    <div ref={trapRef} className={isActive ? '' : 'contents'}>
      {children}
    </div>
  );
};

// Screen reader optimized chart descriptions
export const ChartDescription = ({ 
  title, 
  description, 
  dataPoints, 
  trends 
}: {
  title: string;
  description: string;
  dataPoints?: string[];
  trends?: string[];
}) => (
  <div className="sr-only" aria-label={`Chart: ${title}`}>
    <p>{description}</p>
    {dataPoints && dataPoints.length > 0 && (
      <div>
        <p>Data points:</p>
        <ul>
          {dataPoints.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </div>
    )}
    {trends && trends.length > 0 && (
      <div>
        <p>Key trends:</p>
        <ul>
          {trends.map((trend, index) => (
            <li key={index}>{trend}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

// High contrast mode detection and styles
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isHighContrast;
};

// Reduced motion detection
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
};

// WCAG 2.2 AA compliant color contrast checker
export const checkColorContrast = (foreground: string, background: string) => {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) return { ratio: 0, level: 'fail' };

  const fgLum = getLuminance(fg.r, fg.g, fg.b);
  const bgLum = getLuminance(bg.r, bg.g, bg.b);

  const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);

  let level = 'fail';
  if (ratio >= 7) level = 'AAA';
  else if (ratio >= 4.5) level = 'AA';
  else if (ratio >= 3) level = 'AA-large';

  return { ratio: Math.round(ratio * 100) / 100, level };
};

// Keyboard navigation helper
export const KeyboardNavigationProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    let isTabbing = false;

    const handleFirstTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        isTabbing = true;
        document.body.classList.add('user-is-tabbing');
        window.removeEventListener('keydown', handleFirstTab);
        window.addEventListener('mousedown', handleMouseDownOnce);
      }
    };

    const handleMouseDownOnce = () => {
      isTabbing = false;
      document.body.classList.remove('user-is-tabbing');
      window.removeEventListener('mousedown', handleMouseDownOnce);
      window.addEventListener('keydown', handleFirstTab);
    };

    window.addEventListener('keydown', handleFirstTab);

    return () => {
      window.removeEventListener('keydown', handleFirstTab);
      window.removeEventListener('mousedown', handleMouseDownOnce);
    };
  }, []);

  return <>{children}</>;
};

// Table accessibility enhancements
export const AccessibleTable = ({ 
  children, 
  caption, 
  summary 
}: { 
  children: React.ReactNode; 
  caption?: string; 
  summary?: string;
}) => (
  <table className="w-full" summary={summary}>
    {caption && <caption className="sr-only">{caption}</caption>}
    {children}
  </table>
);

// Loading state announcements
export const LoadingAnnouncement = ({ 
  isLoading, 
  loadingText = 'Loading content', 
  completedText = 'Content loaded' 
}: {
  isLoading: boolean;
  loadingText?: string;
  completedText?: string;
}) => {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (isLoading) {
      setAnnouncement(loadingText);
    } else {
      // Announce completion after a brief delay
      const timer = setTimeout(() => {
        setAnnouncement(completedText);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, loadingText, completedText]);

  return <LiveRegion message={announcement} priority="polite" />;
};

// Button with enhanced accessibility
export const AccessibleButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'danger';
    isLoading?: boolean;
    loadingText?: string;
  }
>(({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  loadingText = 'Loading...', 
  disabled,
  'aria-describedby': ariaDescribedBy,
  ...props 
}, ref) => {
  const baseClasses = "relative px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-black text-white hover:bg-gray-800 focus:ring-black dark:bg-white dark:text-black dark:hover:bg-gray-200 dark:focus:ring-white",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  };

  return (
    <button
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant]} ${isLoading ? 'cursor-wait' : ''}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-describedby={ariaDescribedBy}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
          />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

// Error boundary with accessibility support
export class AccessibleErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Accessible Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} />;
      }

      return (
        <div 
          className="panel-elevated p-6 m-4 text-center"
          role="alert"
          aria-live="assertive"
        >
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            We encountered an error while loading this content. Please try refreshing the page.
          </p>
          <AccessibleButton 
            onClick={() => window.location.reload()}
            variant="primary"
          >
            Refresh Page
          </AccessibleButton>
        </div>
      );
    }

    return this.props.children;
  }
}

export default {
  LiveRegion,
  SkipToMain,
  FocusTrap,
  ChartDescription,
  useHighContrast,
  useReducedMotion,
  checkColorContrast,
  KeyboardNavigationProvider,
  AccessibleTable,
  LoadingAnnouncement,
  AccessibleButton,
  AccessibleErrorBoundary
};
