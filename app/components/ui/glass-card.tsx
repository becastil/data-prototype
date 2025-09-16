"use client";

import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/app/lib/utils';

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, 'children'> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle' | 'vibrant';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  interactive?: boolean;
}

const glassVariants = {
  default: "bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--foreground)] backdrop-blur-lg shadow-[var(--card-base-shadow)]",
  elevated: "bg-[var(--surface-elevated)] border border-[var(--accent-soft)] text-[var(--foreground)] shadow-[var(--card-elevated-shadow)] backdrop-blur-xl",
  subtle: "bg-[var(--surface-muted)] border border-[var(--surface-border)] text-[var(--foreground)] backdrop-blur-md shadow-[var(--card-base-shadow)]",
  vibrant: "bg-[linear-gradient(130deg,var(--accent-soft),var(--surface-elevated))] border border-[var(--accent-soft)] text-[var(--foreground)] backdrop-blur-xl"
};

const blurLevels = {
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
  xl: "backdrop-blur-xl"
};

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(({
  children,
  className,
  variant = 'default',
  blur = 'md',
  glow = false,
  interactive = false,
  ...props
}, ref) => {
  const baseClasses = cn(
    // Base glass effect
    "rounded-2xl border overflow-hidden",
    glassVariants[variant],
    blurLevels[blur],
    
    // Glow effect
    glow && "shadow-[0_0_32px_var(--accent-glow)] border-[var(--card-hover-border)]",
    
    // Interactive states
    interactive && [
      "transition-all duration-300 ease-out",
      "hover:-translate-y-1",
      "hover:border-[var(--card-hover-border)]",
      "hover:shadow-[var(--card-hover-shadow)]",
      "active:scale-[0.98]",
      "cursor-pointer"
    ],
    
    className
  );

  const motionVariants = {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    hover: interactive ? {
      y: -4,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    } : {},
    tap: interactive ? {
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    } : {}
  };

  return (
    <motion.div
      ref={ref}
      className={baseClasses}
      variants={motionVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      {...props}
    >
      {/* Glass reflection effect - removed for clean white look */}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Optional glow border - removed for clean white look */}
    </motion.div>
  );
});

GlassCard.displayName = "GlassCard";

export { GlassCard };
