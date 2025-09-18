'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  thickness?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  label,
  showPercentage = true,
  color = 'primary',
  thickness = 8
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizes = {
    sm: { width: 60, height: 60, fontSize: '0.75rem' },
    md: { width: 80, height: 80, fontSize: '0.875rem' },
    lg: { width: 100, height: 100, fontSize: '1rem' },
    xl: { width: 120, height: 120, fontSize: '1.125rem' }
  };
  
  const colors = {
    primary: 'var(--primary-blue)',
    success: 'var(--status-success)',
    warning: 'var(--status-warning)',
    danger: 'var(--status-danger)',
    info: 'var(--status-info)'
  };
  
  const selectedSize = sizes[size];
  const selectedColor = colors[color];
  const radius = (selectedSize.width - thickness) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Determine status color based on percentage
  const getStatusColor = () => {
    if (color !== 'primary') return selectedColor;
    if (percentage >= 90) return colors.danger;
    if (percentage >= 75) return colors.warning;
    return colors.success;
  };
  
  return (
    <motion.div 
      className="relative inline-flex items-center justify-center"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <svg
        width={selectedSize.width}
        height={selectedSize.height}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={selectedSize.width / 2}
          cy={selectedSize.height / 2}
          r={radius}
          stroke="var(--gray-200)"
          strokeWidth={thickness}
          fill="none"
          className="dark:stroke-gray-700"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={selectedSize.width / 2}
          cy={selectedSize.height / 2}
          r={radius}
          stroke={getStatusColor()}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ 
            strokeDashoffset,
            filter: [
              'drop-shadow(0 0 0px currentColor)',
              'drop-shadow(0 0 8px currentColor)',
              'drop-shadow(0 0 0px currentColor)'
            ]
          }}
          transition={{ 
            strokeDashoffset: { duration: 1, ease: "easeOut" },
            filter: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <span 
            className="font-bold font-data text-gray-900 dark:text-gray-100"
            style={{ fontSize: selectedSize.fontSize }}
          >
            {Math.round(percentage)}%
          </span>
        )}
        {label && (
          <span className="text-xs text-gray-600 dark:text-gray-400 font-body mt-0.5">
            {label}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default CircularProgress;