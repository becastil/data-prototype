'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AccessibleIconProps {
  icon: React.ReactNode;
  label: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  showTooltip?: boolean;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  animate?: boolean;
  className?: string;
  ariaLabel?: string;
}

const AccessibleIcon: React.FC<AccessibleIconProps> = ({
  icon,
  label,
  size = 'md',
  onClick,
  disabled = false,
  variant = 'default',
  showTooltip = true,
  tooltipPosition = 'top',
  animate = true,
  className = '',
  ariaLabel,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Size configurations with proper touch targets
  const sizes = {
    xs: { icon: 16, button: 32, padding: 8 },
    sm: { icon: 20, button: 36, padding: 8 },
    md: { icon: 24, button: 44, padding: 10 },
    lg: { icon: 32, button: 52, padding: 10 },
    xl: { icon: 40, button: 60, padding: 10 },
  };

  const currentSize = sizes[size];

  // Variant color schemes with proper contrast ratios
  const variants = {
    default: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      hover: 'hover:bg-gray-200 dark:hover:bg-gray-700',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-300 dark:border-gray-600',
      shadow: 'shadow-gray-200/50 dark:shadow-gray-900/50',
    },
    primary: {
      bg: 'bg-primary-blue-lightest dark:bg-primary-blue-dark',
      hover: 'hover:bg-primary-blue-lighter dark:hover:bg-primary-blue',
      text: 'text-primary-blue dark:text-primary-blue-light',
      border: 'border-primary-blue-light dark:border-primary-blue',
      shadow: 'shadow-primary-blue/20 dark:shadow-primary-blue/40',
    },
    success: {
      bg: 'bg-success',
      hover: 'hover:bg-green-100 dark:hover:bg-green-900',
      text: 'text-success',
      border: 'border-green-400 dark:border-green-600',
      shadow: 'shadow-green-200/50 dark:shadow-green-900/50',
    },
    warning: {
      bg: 'bg-warning',
      hover: 'hover:bg-orange-100 dark:hover:bg-orange-900',
      text: 'text-warning',
      border: 'border-orange-400 dark:border-orange-600',
      shadow: 'shadow-orange-200/50 dark:shadow-orange-900/50',
    },
    danger: {
      bg: 'bg-danger',
      hover: 'hover:bg-red-100 dark:hover:bg-red-900',
      text: 'text-danger',
      border: 'border-red-400 dark:border-red-600',
      shadow: 'shadow-red-200/50 dark:shadow-red-900/50',
    },
    info: {
      bg: 'bg-info',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900',
      text: 'text-info',
      border: 'border-blue-400 dark:border-blue-600',
      shadow: 'shadow-blue-200/50 dark:shadow-blue-900/50',
    },
  };

  const currentVariant = variants[variant];

  // Tooltip position styles
  const tooltipPositions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (buttonRef.current === document.activeElement) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsPressed(true);
          onClick?.();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        setIsPressed(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [onClick]);

  const showTooltipState = showTooltip && (isHovered || isFocused) && !disabled;

  return (
    <div className="relative inline-flex">
      <motion.button
        ref={buttonRef}
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        className={`
          relative inline-flex items-center justify-center
          transition-all duration-200 ease-out
          ${currentVariant.bg} ${currentVariant.hover} ${currentVariant.text}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${onClick ? 'hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue dark:focus:ring-primary-blue-light' : ''}
          rounded-full border ${currentVariant.border}
          ${className}
        `}
        style={{
          width: currentSize.button,
          height: currentSize.button,
          padding: currentSize.padding,
        }}
        aria-label={ariaLabel || label}
        aria-disabled={disabled}
        role={onClick ? 'button' : 'img'}
        tabIndex={onClick && !disabled ? 0 : -1}
        initial={false}
        animate={
          animate
            ? {
                scale: isPressed ? 0.95 : isHovered ? 1.05 : 1,
                rotate: isHovered && animate ? [0, -5, 5, 0] : 0,
              }
            : {}
        }
        transition={{
          scale: { duration: 0.15 },
          rotate: { duration: 0.4, ease: 'easeInOut' },
        }}
        whileTap={animate ? { scale: 0.9 } : {}}
      >
        {/* Icon with animation */}
        <motion.div
          className="flex items-center justify-center"
          style={{
            width: currentSize.icon,
            height: currentSize.icon,
          }}
          animate={
            animate && isHovered
              ? {
                  filter: [
                    'drop-shadow(0 0 0px currentColor)',
                    'drop-shadow(0 0 4px currentColor)',
                    'drop-shadow(0 0 0px currentColor)',
                  ],
                }
              : {}
          }
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {React.cloneElement(icon as React.ReactElement, {
            className: 'w-full h-full',
          })}
        </motion.div>

        {/* Ripple effect on click */}
        <AnimatePresence>
          {isPressed && onClick && (
            <motion.span
              className={`absolute inset-0 rounded-full ${currentVariant.bg} opacity-30`}
              initial={{ scale: 0 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltipState && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: tooltipPosition === 'top' ? 5 : tooltipPosition === 'bottom' ? -5 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute z-50 px-2 py-1 text-xs font-medium
              bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900
              rounded-md shadow-lg pointer-events-none whitespace-nowrap
              ${tooltipPositions[tooltipPosition]}
            `}
            role="tooltip"
          >
            {label}
            {/* Tooltip arrow */}
            <div
              className={`
                absolute w-2 h-2 bg-gray-900 dark:bg-gray-100
                transform rotate-45
                ${
                  tooltipPosition === 'top'
                    ? 'top-full left-1/2 -translate-x-1/2 -mt-1'
                    : tooltipPosition === 'bottom'
                    ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1'
                    : tooltipPosition === 'left'
                    ? 'left-full top-1/2 -translate-y-1/2 -ml-1'
                    : 'right-full top-1/2 -translate-y-1/2 -mr-1'
                }
              `}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccessibleIcon;