'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gauge, TrafficCone as Traffic, ChevronRight } from 'lucide-react';
import GaugeWidget from './GaugeWidget';
import StoplightWidget from './StoplightWidget';
import { GlassCard } from '@/app/components/ui/glass-card';
import './widget-animations.css';

interface PerformanceIndicatorProps {
  value: number; // Percentage value (0-140)
  title?: string;
  defaultWidget?: 'gauge' | 'stoplight';
  showLegend?: boolean;
  onWidgetChange?: (widget: 'gauge' | 'stoplight') => void;
}

export default function PerformanceIndicator({
  value,
  title = 'Plan Performance',
  defaultWidget = 'gauge',
  showLegend = true,
  onWidgetChange
}: PerformanceIndicatorProps) {
  const [selectedWidget, setSelectedWidget] = useState<'gauge' | 'stoplight'>(defaultWidget);
  const [isAnimating, setIsAnimating] = useState(false);

  // Load preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('performance-widget-preference');
    if (savedPreference === 'gauge' || savedPreference === 'stoplight') {
      setSelectedWidget(savedPreference);
    }
  }, []);

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem('performance-widget-preference', selectedWidget);
    onWidgetChange?.(selectedWidget);
  }, [selectedWidget, onWidgetChange]);

  const handleWidgetChange = (widget: 'gauge' | 'stoplight') => {
    if (widget === selectedWidget) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setSelectedWidget(widget);
      setIsAnimating(false);
    }, 150);
  };

  const widgets = [
    {
      id: 'gauge' as const,
      label: 'Gauge',
      icon: Gauge,
      description: 'Segmented arc visualization'
    },
    {
      id: 'stoplight' as const,
      label: 'Stoplight',
      icon: Traffic,
      description: 'Traffic light status indicator'
    }
  ];

  return (
    <GlassCard variant="elevated" className="p-4">
      {/* Header with Widget Selector */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          {title}
        </h3>
        
        {/* Widget Selector Pills */}
        <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--surface-border)] p-1 rounded-xl">
          {widgets.map((widget) => {
            const Icon = widget.icon;
            const isSelected = selectedWidget === widget.id;
            
            return (
              <motion.button
                key={widget.id}
                onClick={() => handleWidgetChange(widget.id)}
                className={`
                  relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide uppercase
                  transition-all duration-200
                  ${isSelected 
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)] shadow-[var(--card-hover-shadow)]' 
                    : 'text-[var(--foreground-muted)] hover:text-[var(--accent)]'
                  }
                `}
                whileHover={{ scale: isSelected ? 1 : 1.04 }}
                whileTap={{ scale: 0.95 }}
                title={widget.description}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{widget.label}</span>
                
                {/* Selection Indicator */}
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-[var(--accent-soft)] to-[var(--surface-muted)] rounded-lg"
                    layoutId="widget-selector"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Widget Display Area */}
      <div className="relative min-h-[320px]">
        <AnimatePresence mode="wait">
          {!isAnimating && (
            <motion.div
              key={selectedWidget}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="w-full"
            >
              {selectedWidget === 'gauge' ? (
                <GaugeWidget 
                  value={value} 
                  title={title}
                  showLegend={showLegend}
                />
              ) : (
                <StoplightWidget 
                  value={value} 
                  title=""
                  showLabels={showLegend}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Loading State */}
        {isAnimating && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-8 h-8 border-3 border-[var(--surface-border)] border-t-[var(--accent)] rounded-full animate-spin" />
          </motion.div>
        )}
      </div>
      
      {/* Widget Description */}
      <div className="mt-3 pt-3 border-t border-[var(--surface-border)]">
        <div className="flex items-center justify-between text-xs text-[var(--foreground-subtle)]">
          <div className="flex items-center gap-1">
            <span>Currently viewing:</span>
            <span className="font-medium text-[var(--foreground)]">
              {widgets.find(w => w.id === selectedWidget)?.label}
            </span>
          </div>
          
          {/* Quick Switch Hint */}
          <motion.button
            onClick={() => handleWidgetChange(selectedWidget === 'gauge' ? 'stoplight' : 'gauge')}
            className="flex items-center gap-1 text-[var(--accent)] hover:text-[var(--accent-hover)]"
            whileHover={{ x: 2 }}
          >
            <span>Try {selectedWidget === 'gauge' ? 'Stoplight' : 'Gauge'}</span>
            <ChevronRight className="w-3 h-3" />
          </motion.button>
        </div>
      </div>
    </GlassCard>
  );
}
