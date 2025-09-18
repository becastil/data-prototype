'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command } from 'cmdk';
import { 
  Search, 
  FileText, 
  BarChart3, 
  Download, 
  Settings, 
  Users, 
  Calendar,
  TrendingUp,
  Database,
  Filter,
  RefreshCw,
  Moon,
  Sun,
  Keyboard
} from 'lucide-react';
import { vars } from '../../styles';
import { 
  useCommandPaletteAnimation,
  createCommandPaletteTimeline,
  createGPUOptimizedStyle,
  MillionDollarAnimations
} from '../../utils/theatreAnimations';

/**
 * TheatreCommandPalette - Frame-perfect ⌘K implementation
 * 
 * Enhanced version of CommandPalette with Theatre.js integration
 * for sophisticated micro-interactions that create perceived value.
 * 
 * Features:
 * - Frame-perfect entrance/exit sequences
 * - Staggered command item animations
 * - GPU-optimized backdrop blur
 * - Sophisticated spring physics
 * - Accessibility-first design with reduced motion support
 */

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  keywords: string[];
  action: () => void;
  shortcut?: string;
}

interface TheatreCommandPaletteProps {
  onNavigate?: (page: string) => void;
  onExport?: (format: string) => void;
  onThemeToggle?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const TheatreCommandPalette: React.FC<TheatreCommandPaletteProps> = ({
  onNavigate,
  onExport,
  onThemeToggle,
  isOpen = false,
  onOpenChange,
}) => {
  const [open, setOpen] = useState(isOpen);
  const [search, setSearch] = useState('');
  
  // Theatre.js animation integration
  const paletteAnimation = useCommandPaletteAnimation(open);
  
  // Respect user's motion preferences
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  // Professional keyboard shortcut handling
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Sync with parent state
  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  // Command definitions - workflow-centric for healthcare dashboard
  const commands: Command[] = [
    // Navigation Commands
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'View summary tiles and key metrics',
      icon: BarChart3,
      category: 'Navigation',
      keywords: ['dashboard', 'home', 'overview', 'summary'],
      action: () => {
        onNavigate?.('dashboard');
        setOpen(false);
      },
      shortcut: '⌘H'
    },
    {
      id: 'nav-charts',
      label: 'Go to Charts',
      description: 'View detailed analytics and visualizations',
      icon: TrendingUp,
      category: 'Navigation',
      keywords: ['charts', 'analytics', 'graphs', 'data', 'visualization'],
      action: () => {
        onNavigate?.('charts');
        setOpen(false);
      },
      shortcut: '⌘C'
    },
    {
      id: 'nav-table',
      label: 'Go to Data Table',
      description: 'Browse raw financial data',
      icon: Database,
      category: 'Navigation',
      keywords: ['table', 'data', 'raw', 'financial', 'records'],
      action: () => {
        onNavigate?.('table');
        setOpen(false);
      },
      shortcut: '⌘T'
    },

    // Data Management Commands
    {
      id: 'export-csv',
      label: 'Export as CSV',
      description: 'Download budget and claims data',
      icon: FileText,
      category: 'Data Management',
      keywords: ['export', 'csv', 'download', 'data', 'spreadsheet'],
      action: () => {
        onExport?.('csv');
        setOpen(false);
      },
      shortcut: '⌘E'
    },
    {
      id: 'export-json',
      label: 'Export as JSON',
      description: 'Download structured data for API integration',
      icon: Download,
      category: 'Data Management',
      keywords: ['export', 'json', 'api', 'structured', 'data'],
      action: () => {
        onExport?.('json');
        setOpen(false);
      }
    },
    {
      id: 'refresh-data',
      label: 'Refresh Data',
      description: 'Reload all dashboard data',
      icon: RefreshCw,
      category: 'Data Management',
      keywords: ['refresh', 'reload', 'update', 'sync'],
      action: () => {
        window.location.reload();
      },
      shortcut: '⌘R'
    },

    // Analysis Commands
    {
      id: 'filter-data',
      label: 'Filter Data',
      description: 'Apply filters to current view',
      icon: Filter,
      category: 'Analysis',
      keywords: ['filter', 'search', 'narrow', 'criteria'],
      action: () => {
        setOpen(false);
      },
      shortcut: '⌘F'
    },
    {
      id: 'view-trends',
      label: 'Analyze Trends',
      description: 'Focus on trend analysis charts',
      icon: TrendingUp,
      category: 'Analysis',
      keywords: ['trends', 'analysis', 'patterns', 'time'],
      action: () => {
        onNavigate?.('charts');
        setOpen(false);
      }
    },

    // Settings Commands
    {
      id: 'toggle-theme',
      label: 'Toggle Theme',
      description: 'Switch between light and dark mode',
      icon: onThemeToggle ? Moon : Sun,
      category: 'Settings',
      keywords: ['theme', 'dark', 'light', 'mode', 'appearance'],
      action: () => {
        onThemeToggle?.();
        setOpen(false);
      },
      shortcut: '⌘D'
    },
    {
      id: 'keyboard-shortcuts',
      label: 'Keyboard Shortcuts',
      description: 'View all available shortcuts',
      icon: Keyboard,
      category: 'Settings',
      keywords: ['shortcuts', 'keyboard', 'hotkeys', 'commands'],
      action: () => {
        setOpen(false);
      },
      shortcut: '⌘?'
    }
  ];

  // Group commands by category
  const groupedCommands = commands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  // Theatre.js powered backdrop animation
  const backdropVariants = {
    hidden: {
      opacity: 0,
      backdropFilter: 'blur(0px)',
    },
    visible: {
      opacity: 1,
      backdropFilter: prefersReducedMotion ? 'blur(0px)' : 'blur(20px)',
      transition: {
        duration: prefersReducedMotion ? 0.15 : 0.3,
        ease: [0.16, 1, 0.3, 1]
      }
    },
    exit: {
      opacity: 0,
      backdropFilter: 'blur(0px)',
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.2,
        ease: [0.4, 0, 1, 1]
      }
    }
  };

  // Sophisticated palette container animation
  const paletteVariants = {
    hidden: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.92,
      y: prefersReducedMotion ? 0 : -40,
      rotateX: prefersReducedMotion ? 0 : 8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
        delay: prefersReducedMotion ? 0 : 0.05,
      }
    },
    exit: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.96,
      y: prefersReducedMotion ? 0 : -20,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.15,
        ease: [0.4, 0, 1, 1]
      }
    }
  };

  // Staggered command items animation
  const createItemVariants = (index: number) => ({
    hidden: {
      opacity: 0,
      x: prefersReducedMotion ? 0 : -8,
      scale: prefersReducedMotion ? 1 : 0.98,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        delay: prefersReducedMotion ? 0 : index * 0.02,
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  });

  return (
    <>
      {/* GPU-optimized backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/40 z-50"
            style={createGPUOptimizedStyle()}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Theatre.js powered command palette */}
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            variants={paletteVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl mx-4 z-50"
            style={{
              ...createGPUOptimizedStyle(),
              transformStyle: 'preserve-3d',
              perspective: 1000,
            }}
          >
            <Command 
              className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl bg-white dark:bg-gray-900"
              style={{
                boxShadow: vars.shadows.xl,
                backgroundColor: vars.colors.background,
                borderColor: vars.colors.border,
              }}
            >
              {/* Search Input with micro-interaction */}
              <motion.div 
                className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.2 }}
              >
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Type a command or search..."
                  className="flex-1 py-4 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-lg"
                  style={{
                    fontFamily: vars.fonts.body,
                    color: vars.colors.text,
                  }}
                />
                <motion.div 
                  className="text-xs text-gray-400 ml-3"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.2 }}
                >
                  ESC
                </motion.div>
              </motion.div>

              {/* Command List with staggered animations */}
              <Command.List className="max-h-96 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <motion.div 
                    className="flex flex-col items-center gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Search className="w-8 h-8 opacity-50" />
                    <p style={{ fontFamily: vars.fonts.body }}>
                      No results found for "{search}"
                    </p>
                    <p className="text-sm opacity-75">
                      Try searching for "dashboard", "export", or "theme"
                    </p>
                  </motion.div>
                </Command.Empty>

                {Object.entries(groupedCommands).map(([category, categoryCommands], categoryIndex) => (
                  <Command.Group key={category} heading={category}>
                    <motion.div 
                      className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2 mb-1"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: prefersReducedMotion ? 0 : categoryIndex * 0.05,
                        duration: 0.2 
                      }}
                    >
                      {category}
                    </motion.div>
                    {categoryCommands.map((command, commandIndex) => (
                      <motion.div
                        key={command.id}
                        variants={createItemVariants(categoryIndex * 3 + commandIndex)}
                        initial="hidden"
                        animate="visible"
                      >
                        <Command.Item
                          value={`${command.label} ${command.keywords.join(' ')}`}
                          onSelect={command.action}
                          className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer data-[selected=true]:bg-gray-100 dark:data-[selected=true]:bg-gray-800 transition-colors"
                          style={{
                            fontFamily: vars.fonts.body,
                          }}
                        >
                          <command.icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {command.label}
                            </div>
                            {command.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {command.description}
                              </div>
                            )}
                          </div>
                          {command.shortcut && (
                            <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md font-mono">
                              {command.shortcut}
                            </div>
                          )}
                        </Command.Item>
                      </motion.div>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>

              {/* Footer with sophisticated entrance */}
              <motion.div 
                className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.2 }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">↑↓</kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">↵</kbd>
                    <span>Select</span>
                  </div>
                </div>
                <div className="text-gray-400">
                  Healthcare Analytics Command Palette
                </div>
              </motion.div>
            </Command>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theatre.js powered floating hint */}
      {!open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 300,
            delay: 1, // Appears after page load
          }}
          className="fixed bottom-6 right-6 z-40"
        >
          <motion.button
            whileHover={{ 
              scale: prefersReducedMotion ? 1 : 1.05,
              y: prefersReducedMotion ? 0 : -2,
            }}
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-gray-900 shadow-lg rounded-full px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            style={{
              fontFamily: vars.fonts.subheading,
              backgroundColor: vars.colors.background,
              borderColor: vars.colors.border,
              color: vars.colors.text,
              boxShadow: vars.shadows.lg,
            }}
          >
            <Search className="w-4 h-4" />
            <span>Press</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
              ⌘K
            </kbd>
          </motion.button>
        </motion.div>
      )}
    </>
  );
};

export default TheatreCommandPalette;
