'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface MetaballSuccessProps {
  isVisible: boolean;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const MetaballSuccess: React.FC<MetaballSuccessProps> = ({
  isVisible,
  onComplete,
  size = 'md',
  color = 'var(--status-success)'
}) => {
  const [showCheck, setShowCheck] = useState(false);

  const sizes = {
    sm: { container: 60, balls: 16 },
    md: { container: 80, balls: 20 },
    lg: { container: 100, balls: 24 }
  };

  const { container, balls } = sizes[size];

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setShowCheck(true);
        if (onComplete) {
          setTimeout(onComplete, 1000);
        }
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setShowCheck(false);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div 
          className="relative flex items-center justify-center"
          style={{ width: container, height: container }}
        >
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
              <filter id="metaball-success-filter">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                <feColorMatrix
                  in="blur"
                  mode="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -15"
                />
              </filter>
            </defs>
          </svg>

          <div style={{ filter: 'url(#metaball-success-filter)' }}>
            {/* Metaballs that merge into center */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: balls,
                  height: balls,
                  backgroundColor: color,
                }}
                initial={{
                  x: Math.cos((i * Math.PI * 2) / 6) * 40,
                  y: Math.sin((i * Math.PI * 2) / 6) * 40,
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  x: 0,
                  y: 0,
                  scale: [0, 1.2, 1],
                  opacity: [0, 1, 1],
                }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.05,
                  ease: [0.23, 1, 0.32, 1],
                }}
              />
            ))}

            {/* Central success ball */}
            <motion.div
              className="absolute rounded-full flex items-center justify-center"
              style={{
                width: balls * 2,
                height: balls * 2,
                backgroundColor: color,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.3, 1],
                opacity: 1,
              }}
              transition={{
                duration: 0.8,
                delay: 0.3,
                ease: [0.23, 1, 0.32, 1],
              }}
            >
              <AnimatePresence>
                {showCheck && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <Check className="text-white" size={balls} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Ripple effect */}
          <motion.div
            className="absolute rounded-full border-2"
            style={{
              width: container,
              height: container,
              borderColor: color,
            }}
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{
              scale: [0.5, 1.5],
              opacity: [1, 0],
            }}
            transition={{
              duration: 1,
              delay: 0.6,
              ease: "easeOut",
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default MetaballSuccess;
