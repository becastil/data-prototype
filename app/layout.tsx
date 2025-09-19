import type { Metadata } from "next";
import "./globals.css";
import { lightTheme, darkTheme } from './styles';

// Note: TASA Orbiter Display needs to be loaded via link tag as it's not available in Next.js Google Fonts yet
// We'll add it via a custom Head component

export const metadata: Metadata = {
  title: "Data Dashboard",
  description: "Sales and Revenue Analytics",
};

import ClientProviders from './providers';
import DevTools from './DevTools';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={lightTheme}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300..800&family=Jura:wght@300..700&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Roboto:ital,wght@0,100..900;1,100..900&family=Space+Grotesk:wght@300..700&family=TASA+Orbiter:wght@400..800&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="antialiased">
        {process.env.NODE_ENV === 'development' ? <DevTools /> : null}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-black text-white px-4 py-2 rounded font-medium transition-all duration-200"
        >
          Skip to main content
        </a>
        <ClientProviders>
          <main id="main-content">
            {children}
          </main>
        </ClientProviders>
      </body>
    </html>
  );
}
