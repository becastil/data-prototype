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
  default: "bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10",
  elevated: "bg-white/15 dark:bg-white/8 border-white/30 dark:border-white/15",
  subtle: "bg-white/5 dark:bg-white/3 border-white/10 dark:border-white/5",
  vibrant: "bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-400/8 dark:to-purple-400/8 border-white/20 dark:border-white/10"
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
    "rounded-xl border",
    glassVariants[variant],
    blurLevels[blur],
    
    // Shadow system
    "shadow-lg shadow-black/5 dark:shadow-black/20",
    
    // Glow effect
    glow && "shadow-2xl shadow-blue-500/10 dark:shadow-blue-400/20",
    
    // Interactive states
    interactive && [
      "transition-all duration-300 ease-out",
      "hover:bg-white/20 dark:hover:bg-white/10",
      "hover:border-white/40 dark:hover:border-white/20",
      "hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30",
      "hover:-translate-y-1",
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
      {/* Glass reflection effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Optional glow border */}
      {glow && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-sm -z-10" />
      )}
    </motion.div>
  );
});

GlassCard.displayName = "GlassCard";

export { GlassCard };