'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { vars } from '../styles';
import { createGPUOptimizedStyle } from '../utils/theatreAnimations';

/**
 * Immersive3D - Subtle depth and spatial awareness
 * 
 * Creates the sophisticated 3D immersive elements mentioned in the
 * Million-Dollar UI document while maintaining the monochrome aesthetic.
 * 
 * Features:
 * - Parallax scrolling with depth layers
 * - Mouse-following perspective shifts
 * - Subtle 3D card rotations and elevations
 * - GPU-accelerated transforms for 60fps
 * - Accessibility-friendly with reduced motion support
 * - Monochrome depth through shadows and gradients
 */

// Core 3D Container with mouse tracking
interface Immersive3DContainerProps {
  children: React.ReactNode;
  intensity?: number; // 0-1 scale for 3D effect intensity
  className?: string;
  style?: React.CSSProperties;
}

export const Immersive3DContainer: React.FC<Immersive3DContainerProps> = ({
  children,
  intensity = 0.5,
  className = '',
  style = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smooth spring animations for mouse following
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5 * intensity, -5 * intensity]));
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5 * intensity, 5 * intensity]));
  
  // Respect user's motion preferences
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || prefersReducedMotion) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Normalize mouse position to -0.5 to 0.5 range
      const x = (e.clientX - centerX) / rect.width;
      const y = (e.clientY - centerY) / rect.height;
      
      mouseX.set(x);
      mouseY.set(y);
    };

    const handleMouseLeave = () => {
      if (prefersReducedMotion) return;
      mouseX.set(0);
      mouseY.set(0);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [mouseX, mouseY, prefersReducedMotion]);

  return (
    <motion.div
      ref={containerRef}
      className={className}
      style={{
        ...style,
        ...createGPUOptimizedStyle(),
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      animate={prefersReducedMotion ? {} : {
        rotateX,
        rotateY,
      }}
    >
      {children}
    </motion.div>
  );
};

// 3D Depth Card with layered shadows
interface Depth3DCardProps {
  children: React.ReactNode;
  depth?: number; // 1-5 scale for depth intensity
  className?: string;
  onClick?: () => void;
  elevation?: 'low' | 'medium' | 'high';
}

export const Depth3DCard: React.FC<Depth3DCardProps> = ({
  children,
  depth = 2,
  className = '',
  onClick,
  elevation = 'medium',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Respect user's motion preferences
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  // Calculate depth-based shadows for monochrome 3D effect
  const getDepthShadows = (currentDepth: number, hovered: boolean = false) => {
    const baseDepth = hovered ? currentDepth * 1.5 : currentDepth;
    const opacity = Math.min(0.3, baseDepth * 0.06);
    
    return [
      // Close shadow (sharp)
      `0 ${baseDepth * 2}px ${baseDepth * 4}px rgba(0, 0, 0, ${opacity * 0.8})`,
      // Medium shadow (soft)
      `0 ${baseDepth * 4}px ${baseDepth * 8}px rgba(0, 0, 0, ${opacity * 0.4})`,
      // Far shadow (very soft)
      `0 ${baseDepth * 8}px ${baseDepth * 16}px rgba(0, 0, 0, ${opacity * 0.2})`,
      // Subtle inset highlight for depth
      `inset 0 1px 0 rgba(255, 255, 255, ${hovered ? 0.1 : 0.05})`,
    ].join(', ');
  };

  const elevationStyles = {
    low: { transform: 'translateZ(10px)' },
    medium: { transform: 'translateZ(20px)' },
    high: { transform: 'translateZ(40px)' },
  };

  return (
    <motion.div
      ref={cardRef}
      className={className}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        ...createGPUOptimizedStyle(),
        transformStyle: 'preserve-3d',
        borderRadius: vars.radii.xl,
        backgroundColor: vars.colors.background,
        border: `1px solid ${vars.colors.border}`,
        cursor: onClick ? 'pointer' : 'default',
        ...elevationStyles[elevation],
      }}
      animate={prefersReducedMotion ? {} : {
        boxShadow: getDepthShadows(depth, isHovered),
        y: isHovered ? -depth : 0,
        scale: isHovered ? 1 + (depth * 0.005) : 1,
      }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 300,
      }}
      whileTap={prefersReducedMotion ? {} : {
        scale: 1 - (depth * 0.01),
        y: depth * 0.5,
        transition: { duration: 0.1 }
      }}
    >
      {/* Content layer with subtle 3D positioning */}
      <div
        style={{
          transform: `translateZ(${depth * 2}px)`,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </div>
      
      {/* Depth enhancement layer */}
      {!prefersReducedMotion && (
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: vars.radii.xl,
            background: `linear-gradient(145deg, 
              rgba(255, 255, 255, 0.05) 0%, 
              rgba(0, 0, 0, 0.02) 50%, 
              rgba(0, 0, 0, 0.05) 100%)`,
            transform: 'translateZ(-1px)',
            pointerEvents: 'none',
          }}
          animate={{
            opacity: isHovered ? 0.8 : 0.3,
          }}
        />
      )}
    </motion.div>
  );
};

// Parallax layers for depth scrolling
interface ParallaxLayerProps {
  children: React.ReactNode;
  speed?: number; // -1 to 1 scale (negative for reverse parallax)
  className?: string;
}

export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  children,
  speed = 0.5,
  className = '',
}) => {
  const [scrollY, setScrollY] = useState(0);
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prefersReducedMotion]);

  return (
    <motion.div
      className={className}
      style={{
        ...createGPUOptimizedStyle(),
        transform: prefersReducedMotion 
          ? 'translateZ(0)' 
          : `translateY(${scrollY * speed}px) translateZ(0)`,
      }}
    >
      {children}
    </motion.div>
  );
};

// Floating elements with subtle 3D animation
interface Floating3DElementProps {
  children: React.ReactNode;
  floatStrength?: number;
  rotateStrength?: number;
  className?: string;
}

export const Floating3DElement: React.FC<Floating3DElementProps> = ({
  children,
  floatStrength = 1,
  rotateStrength = 1,
  className = '',
}) => {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      style={createGPUOptimizedStyle()}
      animate={{
        y: [-2 * floatStrength, 2 * floatStrength, -2 * floatStrength],
        rotateX: [-1 * rotateStrength, 1 * rotateStrength, -1 * rotateStrength],
        rotateY: [-0.5 * rotateStrength, 0.5 * rotateStrength, -0.5 * rotateStrength],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
};

// Spatial grid background with 3D depth
interface Spatial3DGridProps {
  size?: number;
  opacity?: number;
  perspective?: boolean;
}

export const Spatial3DGrid: React.FC<Spatial3DGridProps> = ({
  size = 40,
  opacity = 0.1,
  perspective = true,
}) => {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        transformStyle: perspective ? 'preserve-3d' : 'flat',
        perspective: perspective ? 1000 : 'none',
      }}
    >
      {/* Grid lines with 3D perspective */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 0, 0, ${opacity}) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, ${opacity}) 1px, transparent 1px)
          `,
          backgroundSize: `${size}px ${size}px`,
          transform: perspective && !prefersReducedMotion 
            ? 'rotateX(60deg) translateZ(-100px)' 
            : 'translateZ(0)',
        }}
        animate={prefersReducedMotion ? {} : {
          backgroundPosition: ['0px 0px', `${size}px ${size}px`],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Depth gradient overlay */}
      {perspective && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, 
              transparent 0%, 
              rgba(${vars.colors.background === '#FFFFFF' ? '255, 255, 255' : '0, 0, 0'}, 0.8) 70%,
              rgba(${vars.colors.background === '#FFFFFF' ? '255, 255, 255' : '0, 0, 0'}, 1) 100%)`,
            transform: 'translateZ(10px)',
          }}
        />
      )}
    </div>
  );
};

// Immersive dashboard layout with 3D spatial organization
interface Immersive3DDashboardProps {
  children: React.ReactNode;
  className?: string;
}

export const Immersive3DDashboard: React.FC<Immersive3DDashboardProps> = ({
  children,
  className = '',
}) => {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <Immersive3DContainer
      intensity={prefersReducedMotion ? 0 : 0.3}
      className={className}
      style={{
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      {/* 3D Spatial Grid Background */}
      <Spatial3DGrid 
        size={60}
        opacity={0.05}
        perspective={!prefersReducedMotion}
      />
      
      {/* Parallax Background Layer */}
      <ParallaxLayer speed={-0.2}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 30% 20%, 
              rgba(0, 0, 0, 0.02) 0%, 
              transparent 50%),
              radial-gradient(circle at 70% 80%, 
              rgba(0, 0, 0, 0.03) 0%, 
              transparent 50%)`,
            transform: 'translateZ(-50px)',
          }}
        />
      </ParallaxLayer>
      
      {/* Main Content Layer */}
      <ParallaxLayer speed={0}>
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            transform: 'translateZ(0)',
          }}
        >
          {children}
        </div>
      </ParallaxLayer>
    </Immersive3DContainer>
  );
};

// Depth-aware navigation with 3D hover states
interface Depth3DNavigationProps {
  items: Array<{
    id: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    active?: boolean;
    onClick?: () => void;
  }>;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Depth3DNavigation: React.FC<Depth3DNavigationProps> = ({
  items,
  orientation = 'horizontal',
  className = '',
}) => {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <nav
      className={className}
      style={{
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        gap: vars.spacing.sm,
        transformStyle: 'preserve-3d',
      }}
    >
      {items.map((item, index) => (
        <Depth3DCard
          key={item.id}
          depth={item.active ? 3 : 1}
          onClick={item.onClick}
          className="transition-all duration-200"
        >
          <motion.div
            style={{
              padding: `${vars.spacing.sm} ${vars.spacing.md}`,
              display: 'flex',
              alignItems: 'center',
              gap: vars.spacing.xs,
              color: item.active ? vars.colors.text : vars.colors.textSecondary,
              fontFamily: vars.fonts.subheading,
              fontSize: '0.875rem',
              fontWeight: item.active ? 600 : 500,
              cursor: 'pointer',
            }}
            whileHover={prefersReducedMotion ? {} : {
              color: vars.colors.text,
              x: 2,
            }}
            animate={prefersReducedMotion ? {} : {
              x: item.active ? 4 : 0,
            }}
          >
            {item.icon && (
              <item.icon className="w-4 h-4" />
            )}
            {item.label}
          </motion.div>
        </Depth3DCard>
      ))}
    </nav>
  );
};

export default {
  Container: Immersive3DContainer,
  Card: Depth3DCard,
  ParallaxLayer,
  FloatingElement: Floating3DElement,
  Grid: Spatial3DGrid,
  Dashboard: Immersive3DDashboard,
  Navigation: Depth3DNavigation,
};