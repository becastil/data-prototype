'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './widget-animations.css';

interface StoplightWidgetProps {
  value: number; // Percentage value (0-140)
  title?: string;
  height?: string;
  showLabels?: boolean;
}

type LightState = 'green' | 'yellow' | 'red';

export default function StoplightWidget({ 
  value, 
  title = 'Budget Status',
  height = '260px',
  showLabels = true 
}: StoplightWidgetProps) {
  const [activeLight, setActiveLight] = useState<LightState>('green');
  const [pulseAnimation, setPulseAnimation] = useState(true);

  useEffect(() => {
    // Determine which light should be active based on value
    if (value < 95) {
      setActiveLight('green');
    } else if (value >= 95 && value <= 105) {
      setActiveLight('yellow');
    } else {
      setActiveLight('red');
    }
    
    // Trigger pulse animation on value change
    setPulseAnimation(false);
    const timeout = setTimeout(() => setPulseAnimation(true), 100);
    return () => clearTimeout(timeout);
  }, [value]);

  const lights: Array<{
    color: LightState;
    label: string;
    threshold: string;
    bgColor: string;
    activeColor: string;
    glowColor: string;
  }> = [
    {
      color: 'red',
      label: 'Over Budget',
      threshold: '> 105%',
      bgColor: 'bg-red-900/20',
      activeColor: 'bg-red-500',
      glowColor: 'shadow-red-500/50',
    },
    {
      color: 'yellow',
      label: 'Near Budget',
      threshold: '95-105%',
      bgColor: 'bg-yellow-900/20',
      activeColor: 'bg-yellow-400',
      glowColor: 'shadow-yellow-400/50',
    },
    {
      color: 'green',
      label: 'Within Budget',
      threshold: '< 95%',
      bgColor: 'bg-green-900/20',
      activeColor: 'bg-green-500',
      glowColor: 'shadow-green-500/50',
    },
  ];

  return (
    <div 
      className="stoplight-widget flex flex-col items-center justify-center"
      style={{ height }}
      role="status"
      aria-label={`Budget status: ${activeLight === 'green' ? 'Within budget' : activeLight === 'yellow' ? 'Near budget' : 'Over budget'} at ${value.toFixed(1)}%`}
    >
      {/* Title */}
      <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
      
      {/* Stoplight Container */}
      <div className="stoplight-container bg-gray-900 p-4 rounded-2xl shadow-xl">
        <div className="flex flex-col gap-3">
          {lights.map((light) => {
            const isActive = activeLight === light.color;
            return (
              <div key={light.color} className="relative">
                {/* Light Circle */}
                <motion.div
                  className={`
                    w-16 h-16 rounded-full relative overflow-hidden
                    ${isActive ? light.activeColor : light.bgColor}
                    ${isActive ? `shadow-lg ${light.glowColor}` : ''}
                    transition-all duration-300
                  `}
                  animate={isActive && pulseAnimation ? {
                    boxShadow: [
                      `0 0 20px rgba(0,0,0,0.1)`,
                      `0 0 40px ${light.color === 'red' ? 'rgba(239, 68, 68, 0.6)' : 
                                   light.color === 'yellow' ? 'rgba(250, 204, 21, 0.6)' : 
                                   'rgba(34, 197, 94, 0.6)'}`,
                      `0 0 20px rgba(0,0,0,0.1)`,
                    ]
                  } : {}}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {/* Inner glow effect */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, 
                          rgba(255,255,255,0.8) 0%, 
                          rgba(255,255,255,0.4) 20%, 
                          transparent 60%)`
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  
                  {/* Reflection */}
                  <div 
                    className="absolute top-1 left-2 w-8 h-8 rounded-full"
                    style={{
                      background: isActive ? 
                        'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)' :
                        'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)'
                    }}
                  />
                </motion.div>
                
                {/* Labels (shown on hover or when active) */}
                {showLabels && (
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        className="absolute left-20 top-1/2 -translate-y-1/2 whitespace-nowrap"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm">
                          <div className="font-semibold">{light.label}</div>
                          <div className="text-xs opacity-75">{light.threshold}</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Current Value Display */}
      <div className="mt-4 text-center">
        <div className="text-3xl font-bold" style={{
          color: activeLight === 'green' ? '#22c55e' : 
                 activeLight === 'yellow' ? '#f59e0b' : 
                 '#ef4444'
        }}>
          {value.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-600 mt-1">
          of budget utilized
        </div>
      </div>
      
      {/* Legend */}
      {showLabels && (
        <div className="mt-4 text-xs text-gray-600 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>&lt; 95% - On Track</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
            <span>95-105% - Caution</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>&gt; 105% - Over Budget</span>
          </div>
        </div>
      )}
    </div>
  );
}