'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GooeyLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const GooeyLoader: React.FC<GooeyLoaderProps> = ({ 
  size = 'md',
  color = 'var(--primary-blue)' 
}) => {
  const sizes = {
    sm: { container: 80, dot: 12 },
    md: { container: 120, dot: 20 },
    lg: { container: 160, dot: 28 }
  };

  const { container, dot } = sizes[size];

  return (
    <div 
      className="gooey-loader relative flex items-center justify-center"
      style={{ width: container, height: container }}
    >
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="gooey-loader-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
            />
          </filter>
        </defs>
      </svg>

      <div 
        className="relative flex items-center justify-center"
        style={{ filter: 'url(#gooey-loader-filter)' }}
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="absolute rounded-full"
            style={{
              width: dot,
              height: dot,
              backgroundColor: color,
            }}
            animate={{
              x: [0, 30, 0, -30, 0],
              y: [0, -30, 0, 30, 0],
              scale: [1, 1.2, 1, 0.8, 1],
            }}
            transition={{
              duration: 2,
              delay: index * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default GooeyLoader;