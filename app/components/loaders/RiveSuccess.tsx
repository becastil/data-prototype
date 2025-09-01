'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface RiveSuccessProps {
  isVisible: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const RiveSuccess: React.FC<RiveSuccessProps> = ({ 
  isVisible, 
  size = 'md', 
  className = '' 
}) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldAnimate(true);
    }
  }, [isVisible]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  if (!isVisible) return null;

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <CheckCircle 
        className={`w-full h-full text-black transition-all duration-600 ${
          shouldAnimate ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        }`}
        style={{
          transform: shouldAnimate ? 'scale(1) translateZ(0)' : 'scale(0) translateZ(0)',
          transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
          backfaceVisibility: 'hidden',
          perspective: '1000px',
        }}
      />
      
      {/* Success ripple effect */}
      <div 
        className={`absolute inset-0 rounded-full border-2 border-black ${
          shouldAnimate ? 'animate-ping' : ''
        }`}
        style={{
          animationDuration: '0.8s',
          animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          opacity: shouldAnimate ? '0' : '1',
        }}
      />
    </div>
  );
};

export default RiveSuccess;
