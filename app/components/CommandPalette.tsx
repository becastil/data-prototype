'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
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
import { vars } from '../styles';

/**
 * ⌘K Command Palette - Modern Treasury inspired
 * 
 * Following the "workflow-centric navigation with immediate approval flagging"
 * pattern mentioned in the Million-Dollar UI document.
 * 
 * Features:
 * - ⌘K keyboard shortcut
 * - Fuzzy search with instant results
 * - Grouped commands by category
 * - Keyboard navigation (arrows, enter, escape)
 * - Professional monochrome design
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

interface CommandPaletteProps {
  onNavigate?: (page: string) => void;
  onExport?: (format: string) => void;
  onThemeToggle?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  onNavigate,
  onExport,
  onThemeToggle,
  isOpen = false,
  onOpenChange,
}) => {
  const [open, setOpen] = useState(isOpen);
  const [search, setSearch] = useState('');

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
        // Implementation would focus current filter input
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
        // Would open shortcuts help modal
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

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Command Palette */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', duration: 0.2, bounce: 0.1 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl mx-4 z-50"
          >
            <Command 
              className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl bg-white dark:bg-gray-900"
              style={{
                boxShadow: vars.shadows.xl,
                backgroundColor: vars.colors.background,
                borderColor: vars.colors.border,
              }}
            >
              {/* Search Input */}
              <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
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
                <div className="text-xs text-gray-400 ml-3">
                  ESC
                </div>
              </div>

              {/* Command List */}
              <Command.List className="max-h-96 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-8 h-8 opacity-50" />
                    <p style={{ fontFamily: vars.fonts.body }}>
                      No results found for "{search}"
                    </p>
                    <p className="text-sm opacity-75">
                      Try searching for "dashboard", "export", or "theme"
                    </p>
                  </div>
                </Command.Empty>

                {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                  <Command.Group key={category} heading={category}>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2 mb-1">
                      {category}
                    </div>
                    {categoryCommands.map((command) => (
                      <Command.Item
                        key={command.id}
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
                    ))}
                  </Command.Group>
                ))}
              </Command.List>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
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
              </div>
            </Command>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating hint for ⌘K */}
      {!open && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-gray-900 shadow-lg rounded-full px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            style={{
              fontFamily: vars.fonts.subheading,
              backgroundColor: vars.colors.background,
              borderColor: vars.colors.border,
              color: vars.colors.text,
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

export default CommandPalette;