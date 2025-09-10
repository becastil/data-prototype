'use client';

import { useEffect } from 'react';

// Loads lightweight dev-only tooling on the client without impacting production
export default function DevTools() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      try {
        require('./wdyr');
      } catch {
        // Ignore if unavailable; dev helper only
      }
    }
  }, []);

  return null;
}

