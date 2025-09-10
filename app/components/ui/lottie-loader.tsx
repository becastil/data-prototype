"use client";

import React, { useRef, useEffect } from 'react';
import Lottie, { LottieRef } from 'lottie-react';
import { cn } from '@/app/lib/utils';

// Healthcare-themed loading animations (JSON would be loaded from assets)
const healthcareAnimations = {
  heartbeat: {
    v: "5.7.1",
    fr: 60,
    ip: 0,
    op: 120,
    w: 200,
    h: 200,
    nm: "heartbeat",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Heart",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { 
            a: 1, 
            k: [
              { i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 0, s: [100] },
              { i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 30, s: [110] },
              { i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 60, s: [100] },
              { t: 120, s: [100] }
            ]
          }
        }
      }
    ]
  },
  
  pulse: {
    v: "5.7.1",
    fr: 30,
    ip: 0,
    op: 90,
    w: 120,
    h: 120,
    nm: "pulse",
    ddd: 0,
    assets: [],
    layers: []
  }
};

interface LottieLoaderProps {
  type?: 'heartbeat' | 'pulse' | 'upload' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  onComplete?: () => void;
}

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

const LottieLoader: React.FC<LottieLoaderProps> = ({
  type = 'heartbeat',
  size = 'md',
  className,
  loop = true,
  autoplay = true,
  speed = 1,
  onComplete
}) => {
  const lottieRef = useRef<LottieRef>(null);

  // Fallback CSS animations for when Lottie files aren't available
  const FallbackLoader = () => {
    const fallbackClasses = {
      heartbeat: "animate-pulse bg-red-500",
      pulse: "animate-spin bg-blue-500",
      upload: "animate-bounce bg-green-500",
      success: "animate-ping bg-emerald-500",
      error: "animate-pulse bg-red-500"
    };

    return (
      <div className={cn(
        "rounded-full",
        sizes[size],
        fallbackClasses[type],
        className
      )} />
    );
  };

  // For now, we'll use CSS animations as placeholders
  // In a real implementation, you would load actual Lottie files
  const renderLoader = () => {
    switch (type) {
      case 'heartbeat':
        return (
          <div className={cn(
            "relative flex items-center justify-center",
            sizes[size],
            className
          )}>
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-30" />
            <div className="relative bg-red-600 rounded-full w-6 h-6 animate-pulse">
              <div className="absolute top-1 left-1 w-4 h-4 bg-red-400 rounded-full animate-pulse" />
            </div>
          </div>
        );
        
      case 'pulse':
        return (
          <div className={cn(
            "relative flex items-center justify-center",
            sizes[size],
            className
          )}>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full animate-spin opacity-20" />
            <div className="relative bg-gradient-to-r from-gray-500 to-gray-600 rounded-full w-6 h-6">
              <div className="absolute inset-1 bg-white rounded-full animate-pulse" />
            </div>
          </div>
        );
        
      case 'upload':
        return (
          <div className={cn(
            "relative flex items-center justify-center",
            sizes[size],
            className
          )}>
            <div className="bg-green-500 rounded-full w-8 h-8 animate-bounce">
              <svg className="w-4 h-4 text-white mx-auto mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          </div>
        );
        
      case 'success':
        return (
          <div className={cn(
            "relative flex items-center justify-center",
            sizes[size],
            className
          )}>
            <div className="bg-emerald-500 rounded-full w-8 h-8 animate-ping">
              <svg className="w-4 h-4 text-white mx-auto mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        );
        
      case 'error':
        return (
          <div className={cn(
            "relative flex items-center justify-center",
            sizes[size],
            className
          )}>
            <div className="bg-red-500 rounded-full w-8 h-8 animate-pulse">
              <svg className="w-4 h-4 text-white mx-auto mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        );
        
      default:
        return <FallbackLoader />;
    }
  };

  return renderLoader();
};

export { LottieLoader };