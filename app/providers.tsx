"use client";

import React from 'react';
import { KeyboardNavigationProvider, AccessibleErrorBoundary } from './components/accessibility/AccessibilityEnhancements';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <KeyboardNavigationProvider>
      <AccessibleErrorBoundary>
        {children}
      </AccessibleErrorBoundary>
    </KeyboardNavigationProvider>
  );
}

export default ClientProviders;
