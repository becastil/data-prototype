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
  default: "bg-[rgba(11,18,32,0.85)] border border-[rgba(255,255,255,0.05)] text-[var(--foreground)] backdrop-blur-lg",
  elevated: "bg-[linear-gradient(145deg,rgba(16,26,44,0.82),rgba(8,15,28,0.94))] border border-[rgba(0,229,137,0.18)] text-[var(--foreground)] shadow-[0_24px_60px_rgba(3,12,24,0.55)] backdrop-blur-xl",
  subtle: "bg-[rgba(16,26,44,0.65)] border border-[rgba(255,255,255,0.04)] text-[var(--foreground)] backdrop-blur-md",
  vibrant: "bg-[linear-gradient(130deg,rgba(0,229,137,0.18),rgba(0,192,255,0.16))] border border-[rgba(0,229,137,0.32)] text-[var(--foreground)] backdrop-blur-xl"
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
    glow && "shadow-[0_0_32px_var(--accent-glow)] border-[rgba(0,229,137,0.28)]",
    
    // Interactive states
    interactive && [
      "transition-all duration-300 ease-out",
      "hover:-translate-y-1",
      "hover:border-[rgba(0,229,137,0.4)]",
      "hover:shadow-[0_26px_70px_rgba(0,229,137,0.22)]",
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
