'use client';

import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { motion } from 'framer-motion';

const muiTheme = createTheme({
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#3b82f6',
    },
    secondary: {
      main: '#10b981',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Isolate MUI styles to avoid conflicts with Tailwind
        '.mui-chart-isolation': {
          '& *': {
            boxSizing: 'border-box',
          },
        },
      },
    },
  },
});

interface MUIChartContainerProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  loading?: boolean;
  error?: string;
}

const MUIChartContainer: React.FC<MUIChartContainerProps> = ({
  children,
  title,
  className = '',
  loading = false,
  error = '',
}) => {
  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        {title && (
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
        )}
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Error loading chart: {error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        {title && (
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
        )}
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {title && (
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      )}
      <div className="mui-chart-isolation w-full h-full">
        <ThemeProvider theme={muiTheme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </div>
    </div>
  );
};

export default MUIChartContainer;
