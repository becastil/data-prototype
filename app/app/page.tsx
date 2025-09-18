'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

/**
 * App route - redirects to main dashboard
 * This ensures /app URLs work correctly
 */
export default function AppPage() {
  useEffect(() => {
    // Redirect to main dashboard on client side
    redirect('/');
  }, []);

  // Server-side redirect fallback
  redirect('/');

  return null;
}

// Metadata for the route
export const metadata = {
  title: 'Dashboard App',
  description: 'Healthcare Analytics Dashboard Application'
};