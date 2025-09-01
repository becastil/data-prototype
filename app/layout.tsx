import type { Metadata } from "next";
import "./globals.css";

// Note: TASA Orbiter Display needs to be loaded via link tag as it's not available in Next.js Google Fonts yet
// We'll add it via a custom Head component

export const metadata: Metadata = {
  title: "Data Dashboard",
  description: "Sales and Revenue Analytics",
};

import { SkipToMain, KeyboardNavigationProvider, AccessibleErrorBoundary } from './components/AccessibilityEnhancements';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=TASA+Orbiter+Display:wght@400;500;600;700;800&family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@300;400;500;600&family=Roboto+Mono:wght@300;400;500&display=swap" 
          rel="stylesheet" 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="antialiased">
        <SkipToMain />
        <KeyboardNavigationProvider>
          <AccessibleErrorBoundary>
            <main id="main-content">
              {children}
            </main>
          </AccessibleErrorBoundary>
        </KeyboardNavigationProvider>
      </body>
    </html>
  );
}
