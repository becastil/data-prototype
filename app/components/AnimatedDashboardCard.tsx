'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { card } from '../styles/components.css';
import { vars } from '../styles';
import { 
  useCardRevealAnimation, 
  createGPUOptimizedStyle,
  AnimationPresets,
  MillionDollarAnimations
} from '../utils/theatreAnimations';

/**
 * AnimatedDashboardCard - Theatre.js powered micro-interactions
 * 
 * Creates the signature "wow moments" mentioned in Million-Dollar UI document.
 * Each card entrance is precisely timed for maximum perceived value.
 * 
 * Features:
 * - Frame-perfect staggered entrance
 * - Sophisticated hover micro-interactions
 * - GPU-accelerated transforms for 60fps performance
 * - Accessibility-friendly reduced motion support
 */

interface AnimatedDashboardCardProps {
  children: React.ReactNode;
  index: number; // For staggered animation timing
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
  delay?: number; // Custom entrance delay
}

const AnimatedDashboardCard: React.FC<AnimatedDashboardCardProps> = ({
  children,
  index = 0,
  className = '',
  onClick,
  'aria-label': ariaLabel,
  delay,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-100px" });
  const [isHovered, setIsHovered] = useState(false);
  
  // Theatre.js animation hook for sophisticated timing
  const cardAnimation = useCardRevealAnimation();
  
  // Respect user's motion preferences
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  // Calculate staggered entrance timing
  const entranceDelay = delay !== undefined ? delay : index * 0.08; // 80ms stagger
  
  // Sophisticated entrance animation
  const entranceVariants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 24,
      scale: prefersReducedMotion ? 1 : 0.96,
      rotateX: prefersReducedMotion ? 0 : 2,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.6,
        delay: prefersReducedMotion ? 0 : entranceDelay,
        ease: "easeOut" as any,
      }
    }
  };

  // Hover micro-interaction variants
  const hoverVariants = {
    rest: {
      y: 0,
      scale: 1,
      rotateX: 0,
      rotateY: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.6, 1]
      }
    },
    hover: {
      y: prefersReducedMotion ? 0 : -4,
      scale: prefersReducedMotion ? 1 : 1.01,
      rotateX: prefersReducedMotion ? 0 : 1,
      rotateY: prefersReducedMotion ? 0 : 0.5,
      transition: {
        duration: 0.25,
        ease: [0.4, 0, 0.6, 1]
      }
    },
    tap: {
      scale: prefersReducedMotion ? 1 : 0.98,
      transition: {
        duration: 0.1,
        ease: [0.4, 0, 0.6, 1]
      }
    }
  };

  // GPU-optimized shadow animation
  const shadowVariants = {
    rest: {
      boxShadow: vars.shadows.md,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.6, 1]
      }
    },
    hover: {
      boxShadow: prefersReducedMotion 
        ? vars.shadows.md 
        : '0 12px 32px 0 rgba(0, 0, 0, 0.16), 0 6px 16px 0 rgba(0, 0, 0, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      transition: {
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  // Theatre.js integration for frame-perfect timing
  useEffect(() => {
    if (isInView && !prefersReducedMotion) {
      // Trigger Theatre.js card reveal sequence
      cardAnimation.play();
    }
  }, [isInView, prefersReducedMotion, cardAnimation]);

  return (
    <motion.div
      ref={cardRef}
      className={`${card({ hover: true, padding: 'md' })} ${className}`}
      variants={entranceVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      aria-label={ariaLabel}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      style={{
        ...createGPUOptimizedStyle(),
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
    >
      {/* Card container with sophisticated hover effects */}
      <motion.div
        variants={hoverVariants}
        animate={isHovered ? "hover" : "rest"}
        whileTap="tap"
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Shadow layer for depth */}
        <motion.div
          variants={shadowVariants}
          animate={isHovered ? "hover" : "rest"}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: vars.radii.xl,
            pointerEvents: 'none',
          }}
        />
        
        {/* Content layer */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            transform: 'translateZ(1px)', // Subtle 3D layering
          }}
        >
          {children}
        </div>
      </motion.div>
      
      {/* Subtle shine effect on hover (million-dollar detail) */}
      {!prefersReducedMotion && (
        <motion.div
          initial={{ opacity: 0, x: '-100%' }}
          animate={
            isHovered 
              ? { opacity: [0, 0.1, 0], x: ['100%', '200%'] }
              : { opacity: 0, x: '-100%' }
          }
          transition={{
            duration: 0.8,
            ease: "easeOut" as any,
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
            borderRadius: vars.radii.xl,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      )}
    </motion.div>
  );
};

/**
 * Staggered Card Grid - Orchestrates multiple card entrances
 * Creates the signature dashboard reveal sequence
 */

interface StaggeredCardGridProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
  columns?: number;
}

export const StaggeredCardGrid: React.FC<StaggeredCardGridProps> = ({
  children,
  className = '',
  staggerDelay = 0.08,
  columns = 2,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(gridRef, { once: true, margin: "-50px" });
  
  // Create staggered animation configuration
  const staggeredConfig = MillionDollarAnimations.createStaggeredEntrance(
    children.length,
    staggerDelay
  );

  return (
    <div
      ref={gridRef}
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: vars.spacing.lg,
      }}
    >
      {children.map((child, index) => (
        <AnimatedDashboardCard
          key={index}
          index={index}
          delay={staggeredConfig[index]?.delay ?? 0}
        >
          {child}
        </AnimatedDashboardCard>
      ))}
    </div>
  );
};

/**
 * Specialized card variants for different dashboard contexts
 */

// Metric card with number animation
interface AnimatedMetricCardProps extends AnimatedDashboardCardProps {
  value: number;
  previousValue?: number;
  label: string;
  format?: (value: number) => string;
}

export const AnimatedMetricCard: React.FC<AnimatedMetricCardProps> = ({
  value,
  previousValue,
  label,
  format = (v) => v.toLocaleString(),
  ...cardProps
}) => {
  const [displayValue, setDisplayValue] = useState(previousValue || value);
  
  // Smooth number counting animation
  useEffect(() => {
    if (previousValue !== undefined && previousValue !== value) {
      const frames = MillionDollarAnimations.createDataMorph([previousValue], [value]);
      
      frames.forEach((frame, index) => {
        setTimeout(() => {
          setDisplayValue(frame[0] ?? value);
        }, index * 16); // 60fps timing
      });
    } else {
      setDisplayValue(value);
    }
  }, [value, previousValue]);

  return (
    <AnimatedDashboardCard {...cardProps} aria-label={`${label}: ${format(value)}`}>
      <div style={{ padding: vars.spacing.lg }}>
        <div
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            fontFamily: vars.fonts.heading,
            color: vars.colors.text,
            marginBottom: vars.spacing.sm,
          }}
        >
          {format(Math.round(displayValue))}
        </div>
        <div
          style={{
            fontSize: '0.875rem',
            color: vars.colors.textSecondary,
            fontFamily: vars.fonts.body,
          }}
        >
          {label}
        </div>
      </div>
    </AnimatedDashboardCard>
  );
};

// Chart card with loading shimmer
export const AnimatedChartCard: React.FC<AnimatedDashboardCardProps & { 
  isLoading?: boolean;
  title?: string; 
}> = ({
  isLoading = false,
  title,
  children,
  ...cardProps
}) => {
  const loadingPulse = MillionDollarAnimations.createLoadingPulse();

  return (
    <AnimatedDashboardCard {...cardProps}>
      <div style={{ padding: vars.spacing.lg, height: '100%' }}>
        {title && (
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              fontFamily: vars.fonts.subheading,
              color: vars.colors.text,
              marginBottom: vars.spacing.md,
            }}
          >
            {title}
          </div>
        )}
        
        {isLoading ? (
          <motion.div
            animate={loadingPulse.keyframes as any}
            transition={{
              duration: loadingPulse.duration,
              repeat: Infinity,
              ease: loadingPulse.easing as any,
            }}
            style={{
              background: `linear-gradient(90deg, ${vars.colors.paleGray}, ${vars.colors.lightGray}, ${vars.colors.paleGray})`,
              borderRadius: vars.radii.md,
              height: '200px',
            }}
          />
        ) : (
          <div style={{ height: '200px' }}>
            {children}
          </div>
        )}
      </div>
    </AnimatedDashboardCard>
  );
};

export default AnimatedDashboardCard;
