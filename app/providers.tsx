"use client";

import React, { useEffect } from 'react';
import { KeyboardNavigationProvider, AccessibleErrorBoundary } from './components/accessibility/AccessibilityEnhancements';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  // Initialize Theatre Studio in development to provide project state
  useEffect(() => {
    let cancelled = false;
    if (typeof window === 'undefined') return undefined;
    if (process.env.NODE_ENV === 'production') return undefined;

    (async () => {
      try {
        const studio = (await import('@theatre/studio')).default;
        if (!cancelled && studio && typeof studio.initialize === 'function') {
          studio.initialize();
        }
      } catch (e) {
        // Non-fatal: animations fall back to no-op project
        console.warn('[theatre] Studio initialization skipped', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <KeyboardNavigationProvider>
      <AccessibleErrorBoundary>
        {children}
      </AccessibleErrorBoundary>
    </KeyboardNavigationProvider>
  );
}

export default ClientProviders;
