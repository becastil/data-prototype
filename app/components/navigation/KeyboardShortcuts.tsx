'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Keyboard, 
  Command,
  Navigation,
  Download,
  RefreshCw,
  Search,
  Moon,
  HelpCircle,
  X,
  Zap
} from 'lucide-react';
import { vars } from '../../styles';
import { createGPUOptimizedStyle } from '../../utils/theatreAnimations';

/**
 * KeyboardShortcuts - Professional power-user interface
 * 
 * Following Modern Treasury and Linear patterns for comprehensive
 * keyboard navigation that creates workflow efficiency mentioned
 * in the Million-Dollar UI document.
 * 
 * Features:
 * - Global keyboard shortcut handling
 * - Visual shortcut overlay with categorization
 * - Accessibility-first design with screen reader support
 * - Context-aware shortcut suggestions
 * - Professional visual design matching monochrome aesthetic
 */

interface Shortcut {
  key: string;
  description: string;
  category: string;
  action: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

interface KeyboardShortcutsProps {
  onNavigate?: (page: string) => void;
  onExport?: (format: string) => void;
  onThemeToggle?: () => void;
  onCommandPaletteOpen?: () => void;
  onEmergencyMode?: () => void; // Ctrl+Shift+E
  onPatientSearch?: () => void; // Ctrl+P
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onNavigate,
  onExport,
  onThemeToggle,
  onCommandPaletteOpen,
  onEmergencyMode,
  onPatientSearch,
}) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [activeShortcuts, setActiveShortcuts] = useState<string[]>([]);
  
  // Respect user's motion preferences
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  // Comprehensive shortcut definitions
  const shortcuts: Shortcut[] = [
    // Navigation Shortcuts
    {
      key: '⌘H',
      description: 'Go to Dashboard',
      category: 'Navigation',
      action: () => onNavigate?.('dashboard'),
      icon: Navigation,
    },
    {
      key: '⌘C',
      description: 'Go to Charts',
      category: 'Navigation',
      action: () => onNavigate?.('charts'),
      icon: Navigation,
    },
    {
      key: '⌘T',
      description: 'Go to Data Table',
      category: 'Navigation',
      action: () => onNavigate?.('table'),
      icon: Navigation,
    },
    
    // Command & Search
    {
      key: '⌘K',
      description: 'Open Command Palette',
      category: 'Command & Search',
      action: () => onCommandPaletteOpen?.(),
      icon: Command,
    },
    {
      key: '⌘P',
      description: 'Open Patient Search',
      category: 'Command & Search',
      action: () => onPatientSearch?.() || onCommandPaletteOpen?.(),
      icon: Search,
    },
    {
      key: '⌘F',
      description: 'Focus Search / Filter',
      category: 'Command & Search',
      action: () => {
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="search"], input[placeholder*="filter"]') as HTMLInputElement;
        searchInput?.focus();
      },
      icon: Search,
    },
    {
      key: 'Escape',
      description: 'Close Overlay / Clear Search',
      category: 'Command & Search',
      action: () => {
        setShowOverlay(false);
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement?.tagName === 'INPUT') {
          activeElement.blur();
        }
      },
      icon: X,
    },
    
    // Data Management
    {
      key: '⌘E',
      description: 'Export as CSV',
      category: 'Data Management',
      action: () => onExport?.('csv'),
      icon: Download,
    },
    // Emergency Workflow (Ctrl/Cmd+Shift+E)
    {
      key: '⌘⇧E',
      description: 'Activate Emergency Mode',
      category: 'Healthcare',
      action: () => onEmergencyMode?.(),
      icon: Zap,
    },
    // JSON export moved to avoid conflict with Emergency Mode
    {
      key: '⌘⇧J',
      description: 'Export as JSON',
      category: 'Data Management',
      action: () => onExport?.('json'),
      icon: Download,
    },
    {
      key: '⌘R',
      description: 'Refresh Data',
      category: 'Data Management',
      action: () => window.location.reload(),
      icon: RefreshCw,
    },
    
    // Appearance & Settings
    {
      key: '⌘D',
      description: 'Toggle Dark Mode',
      category: 'Appearance & Settings',
      action: () => onThemeToggle?.(),
      icon: Moon,
    },
    {
      key: '⌘?',
      description: 'Show Keyboard Shortcuts',
      category: 'Appearance & Settings',
      action: () => setShowOverlay(!showOverlay),
      icon: HelpCircle,
    },
    
    // Power User Features
    {
      key: '⌘⇧P',
      description: 'Quick Actions Menu',
      category: 'Power User',
      action: () => onCommandPaletteOpen?.(),
      icon: Zap,
    },
    {
      key: '⌘1-4',
      description: 'Navigate to Dashboard Cards',
      category: 'Power User',
      action: () => {}, // Implemented in card components
      icon: Keyboard,
    },
  ];

  // Group shortcuts by category
  const shortcutCategories = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  // Global keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, metaKey, ctrlKey, shiftKey, altKey } = event;
    const isModifierPressed = metaKey || ctrlKey;
    
    // Don't trigger shortcuts when typing in inputs
    const activeElement = document.activeElement;
    const isInputActive = activeElement?.tagName === 'INPUT' || 
                         activeElement?.tagName === 'TEXTAREA' || 
                         activeElement?.getAttribute('contenteditable') === 'true';
    
    if (isInputActive && key !== 'Escape') return;

    // Create shortcut key string
    let shortcutKey = '';
    if (metaKey || ctrlKey) shortcutKey += '⌘';
    if (shiftKey) shortcutKey += '⇧';
    if (altKey) shortcutKey += '⌥';
    
    // Map special keys
    switch (key) {
      case 'Escape':
        shortcutKey = 'Escape';
        break;
      case '?':
        if (isModifierPressed) shortcutKey += '?';
        break;
      default:
        if (key.length === 1) {
          shortcutKey += key.toUpperCase();
        }
        break;
    }

    // Helper: match patterns like '⌘1-4' as a range
    const matchesShortcut = (pattern: string, pressed: string) => {
      if (pattern === pressed) return true;
      if (pattern.includes('-')) {
        const m = pattern.match(/^(.*?)([A-Za-z0-9])\-([A-Za-z0-9])$/);
        if (m) {
          const [, prefix, start, end] = m;
          if (!pressed.startsWith(prefix)) return false;
          const ch = pressed.slice(prefix.length);
          if (ch.length !== 1) return false;
          const code = ch.charCodeAt(0);
          const startCode = start.charCodeAt(0);
          const endCode = end.charCodeAt(0);
          return code >= Math.min(startCode, endCode) && code <= Math.max(startCode, endCode);
        }
      }
      return false;
    };

    // Find and execute matching shortcut
    const matchingShortcut = shortcuts.find(s => matchesShortcut(s.key, shortcutKey));

    if (matchingShortcut && !matchingShortcut.disabled) {
      event.preventDefault();
      
      // Visual feedback for active shortcut
      setActiveShortcuts(prev => [...prev, matchingShortcut.key]);
      setTimeout(() => {
        setActiveShortcuts(prev => prev.filter(k => k !== matchingShortcut.key));
      }, 200);
      
      matchingShortcut.action();
    }

    // Special handling for number keys (dashboard cards)
    if (isModifierPressed && ['1', '2', '3', '4'].includes(key)) {
      event.preventDefault();
      const cardIndex = parseInt(key) - 1;
      const dashboardCard = document.querySelector(`[data-card-index="${cardIndex}"]`) as HTMLElement;
      if (dashboardCard) {
        dashboardCard.focus();
        dashboardCard.click();
      }
    }

  }, [shortcuts, onNavigate, onExport, onThemeToggle, onCommandPaletteOpen]);

  // Register global keyboard listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Overlay animation variants
  const overlayVariants = {
    hidden: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.95,
      backdropFilter: 'blur(0px)',
    },
    visible: {
      opacity: 1,
      scale: 1,
      backdropFilter: prefersReducedMotion ? 'blur(0px)' : 'blur(20px)',
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
      }
    },
    exit: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.95,
      backdropFilter: 'blur(0px)',
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 1, 1]
      }
    }
  };

  const panelVariants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : -40,
      rotateX: prefersReducedMotion ? 0 : 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
        delay: 0.1,
      }
    },
    exit: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : -20,
      transition: {
        duration: 0.15,
        ease: [0.4, 0, 1, 1]
      }
    }
  };

  // Category animation variants
  const categoryVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      x: prefersReducedMotion ? 0 : -10,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <>
      {/* Keyboard Shortcuts Overlay */}
      <AnimatePresence mode="wait">
        {showOverlay && (
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            style={createGPUOptimizedStyle()}
            onClick={() => setShowOverlay(false)}
          >
            <motion.div
              variants={panelVariants}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              style={{
                backgroundColor: vars.colors.background,
                borderColor: vars.colors.border,
                boxShadow: vars.shadows.xl,
                transformStyle: 'preserve-3d',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Keyboard 
                    className="w-6 h-6 text-gray-700 dark:text-gray-300" 
                    style={{ color: vars.colors.text }}
                  />
                  <h2 
                    className="text-xl font-semibold text-gray-900 dark:text-gray-100"
                    style={{ 
                      fontFamily: vars.fonts.heading,
                      color: vars.colors.text,
                    }}
                  >
                    Keyboard Shortcuts
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: prefersReducedMotion ? 1 : 1.1 }}
                  whileTap={{ scale: prefersReducedMotion ? 1 : 0.9 }}
                  onClick={() => setShowOverlay(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  style={{ color: vars.colors.textSecondary }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Shortcuts Grid */}
              <motion.div 
                className="p-6"
                variants={categoryVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(shortcutCategories).map(([category, categoryShortcuts]) => (
                    <motion.div
                      key={category}
                      variants={itemVariants}
                      className="space-y-3"
                    >
                      {/* Category Header */}
                      <h3 
                        className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        style={{ 
                          fontFamily: vars.fonts.subheading,
                          color: vars.colors.textSecondary,
                        }}
                      >
                        {category}
                      </h3>

                      {/* Category Shortcuts */}
                      <div className="space-y-2">
                        {categoryShortcuts.map((shortcut) => (
                          <motion.div
                            key={shortcut.key}
                            className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                              activeShortcuts.includes(shortcut.key)
                                ? 'bg-gray-200 dark:bg-gray-700'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                            style={{
                              backgroundColor: activeShortcuts.includes(shortcut.key) 
                                ? vars.colors.lightGray + '40'
                                : undefined,
                            }}
                            whileHover={!prefersReducedMotion ? { 
                              scale: 1.02,
                              backgroundColor: vars.colors.paleGray + '40'
                            } : undefined}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {shortcut.icon && (
                                <shortcut.icon 
                                  className="w-4 h-4 flex-shrink-0 text-gray-400"
                                  style={{ color: vars.colors.textSecondary }}
                                />
                              )}
                              <span 
                                className="text-sm text-gray-700 dark:text-gray-300 truncate"
                                style={{ 
                                  fontFamily: vars.fonts.body,
                                  color: vars.colors.text,
                                }}
                              >
                                {shortcut.description}
                              </span>
                            </div>
                            
                            {/* Shortcut Key Display */}
                            <div className="flex items-center gap-1 ml-3">
                              {shortcut.key.split(/([⌘⇧⌥])/).filter(Boolean).map((part, index) => (
                                <kbd 
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono font-semibold text-gray-600 dark:text-gray-400 min-w-[24px] text-center"
                                  style={{
                                    backgroundColor: vars.colors.paleGray,
                                    color: vars.colors.textSecondary,
                                    fontFamily: vars.fonts.data,
                                  }}
                                >
                                  {part}
                                </kbd>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pro Tips Section */}
                <motion.div
                  variants={itemVariants}
                  className="mt-8 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                  style={{
                    backgroundColor: vars.colors.paleGray + '30',
                    borderColor: vars.colors.border,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Zap 
                      className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0"
                      style={{ color: vars.colors.textSecondary }}
                    />
                    <div>
                      <h4 
                        className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2"
                        style={{ 
                          fontFamily: vars.fonts.subheading,
                          color: vars.colors.text,
                        }}
                      >
                        Pro Tips
                      </h4>
                      <ul 
                        className="text-sm text-gray-600 dark:text-gray-400 space-y-1"
                        style={{ 
                          fontFamily: vars.fonts.body,
                          color: vars.colors.textSecondary,
                        }}
                      >
                        <li>• Use ⌘K to access all commands quickly</li>
                        <li>• Hold ⌘ and press 1-4 to navigate dashboard cards</li>
                        <li>• Press Escape to close any overlay or clear search</li>
                        <li>• Shortcuts work globally across all pages</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Feedback for Active Shortcuts */}
      <AnimatePresence>
        {activeShortcuts.map((shortcut) => (
          <motion.div
            key={`feedback-${shortcut}`}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed bottom-4 left-4 z-40 bg-black dark:bg-white text-white dark:text-black px-3 py-2 rounded-lg shadow-lg"
            style={{
              backgroundColor: vars.colors.foreground,
              color: vars.colors.background,
              fontFamily: vars.fonts.data,
            }}
          >
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              <span className="text-sm font-semibold">{shortcut}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
};

/**
 * Hook for keyboard shortcut registration
 */
export const useKeyboardShortcuts = (shortcuts: Array<{
  key: string;
  action: () => void;
  enabled?: boolean;
}>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, metaKey, ctrlKey, shiftKey } = event;
      const isModifierPressed = metaKey || ctrlKey;
      
      // Create shortcut key string
      let shortcutKey = '';
      if (isModifierPressed) shortcutKey += '⌘';
      if (shiftKey) shortcutKey += '⇧';
      shortcutKey += key.toUpperCase();

      const matchingShortcut = shortcuts.find(s => 
        s.key === shortcutKey && (s.enabled !== false)
      );

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export default KeyboardShortcuts;
