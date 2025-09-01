'use client';

import React from 'react';
import { useRive } from '@rive-app/react-canvas';

interface RiveLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const RiveLoader: React.FC<RiveLoaderProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  // Create a simple loading animation programmatically
  // For now we'll use a CSS-based loader that mimics Rive performance characteristics
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* GPU-optimized loading dots */}
      <div className="flex space-x-1 justify-center items-center h-full">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="w-2 h-2 bg-black rounded-full gpu-accelerated loading-pulse"
            style={{
              animationDelay: `${index * 0.16}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default RiveLoader;
