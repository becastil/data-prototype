'use client';

import React, { useRef, useEffect } from 'react';
import { createScrollAnimation } from '../utils/motionUtils';

interface MotionCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  enableScrollAnimation?: boolean;
}

const MotionCard: React.FC<MotionCardProps> = ({
  children,
  className = '',
  delay = 0,
  enableScrollAnimation = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current && enableScrollAnimation) {
      // Hardware-accelerated scroll animation
      createScrollAnimation(
        cardRef.current,
        {
          opacity: [0, 1],
          transform: ['translateY(30px) translateZ(0)', 'translateY(0px) translateZ(0)']
        },
        {
          delay,
          duration: 0.5
        }
      );
    }
  }, [delay, enableScrollAnimation]);

  return (
    <div
      ref={cardRef}
      className={`
        panel-elevated rounded-xl shadow-lg p-6 
        card-hover gpu-accelerated
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      style={{
        // Initial state for scroll animation
        opacity: enableScrollAnimation ? 0 : 1,
        transform: enableScrollAnimation ? 'translateY(30px) translateZ(0)' : 'translateZ(0)',
      }}
    >
      {children}
    </div>
  );
};

export default MotionCard;