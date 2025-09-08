'use client';

/**
 * Theatre.js Animation System - Million-Dollar UI Implementation
 * 
 * Creates frame-perfect micro-interactions that elevate the perceived value
 * of the healthcare analytics dashboard. Following Linear and Stripe patterns
 * for sophisticated, subtle animations that enhance rather than distract.
 */

import { getProject, types } from '@theatre/core';

// Safely obtain a Theatre project; fallback to a no-op implementation
// when @theatre/studio isn't present or state isn't provided.
type NoopProject = {
  sheet: (name: string) => { object: (id: string, _def?: any) => any };
};

const createNoopProject = (): NoopProject => ({
  sheet: () => ({ object: () => ({}) }),
});

// Avoid calling getProject when @theatre/studio isn't present or during SSR/production.
// This prevents the noisy "state is empty" runtime warning.
let project: NoopProject | ReturnType<typeof getProject>;
const isBrowser = typeof window !== 'undefined';
const isDev = process.env.NODE_ENV === 'development';
if (isBrowser && isDev) {
  try {
    project = getProject('HealthcareDashboard');
  } catch (err) {
    console.warn(
      '[theatre] Studio not loaded or project state missing. Falling back to no-op project.',
      err
    );
    project = createNoopProject();
  }
} else {
  project = createNoopProject();
}

/**
 * Animation Sequences - Signature micro-interactions
 * Each sequence is designed for specific UI moments that create delight
 */

// 1. Card Reveal Animation - Staggered entrance for dashboard tiles
export const cardRevealSequence = project.sheet('CardReveal').object('Cards', {
  // Card entrance timing with frame precision
  card1: {
    opacity: types.number(0, { range: [0, 1] }),
    translateY: types.number(20, { range: [-50, 50] }),
    scale: types.number(0.95, { range: [0.8, 1.1] }),
  },
  card2: {
    opacity: types.number(0, { range: [0, 1] }),
    translateY: types.number(20, { range: [-50, 50] }),
    scale: types.number(0.95, { range: [0.8, 1.1] }),
  },
  card3: {
    opacity: types.number(0, { range: [0, 1] }),
    translateY: types.number(20, { range: [-50, 50] }),
    scale: types.number(0.95, { range: [0.8, 1.1] }),
  },
  card4: {
    opacity: types.number(0, { range: [0, 1] }),
    translateY: types.number(20, { range: [-50, 50] }),
    scale: types.number(0.95, { range: [0.8, 1.1] }),
  }
});

// 2. Data Morphing - Smooth transitions between chart states
export const dataMorphSequence = project.sheet('DataMorph').object('Chart', {
  // Chart transformation with easing
  morphProgress: types.number(0, { range: [0, 1] }),
  scaleIntensity: types.number(1, { range: [0.9, 1.1] }),
  rotationHint: types.number(0, { range: [-2, 2] }),
});

// 3. Command Palette - Sophisticated entrance/exit
export const commandPaletteSequence = project.sheet('CommandPalette').object('Palette', {
  // Backdrop entrance
  backdropOpacity: types.number(0, { range: [0, 1] }),
  backdropBlur: types.number(0, { range: [0, 20] }),
  
  // Palette container
  paletteOpacity: types.number(0, { range: [0, 1] }),
  paletteScale: types.number(0.9, { range: [0.8, 1.05] }),
  paletteY: types.number(-30, { range: [-100, 100] }),
  
  // Individual command items (staggered)
  itemsOpacity: types.number(0, { range: [0, 1] }),
  itemsStagger: types.number(0, { range: [0, 1] }),
});

// 4. Navigation Transitions - Seamless page transitions
export const navigationSequence = project.sheet('Navigation').object('PageTransition', {
  // Current page exit
  currentPageOpacity: types.number(1, { range: [0, 1] }),
  currentPageX: types.number(0, { range: [-100, 100] }),
  currentPageScale: types.number(1, { range: [0.9, 1.1] }),
  
  // New page entrance
  newPageOpacity: types.number(0, { range: [0, 1] }),
  newPageX: types.number(20, { range: [-100, 100] }),
  newPageScale: types.number(0.98, { range: [0.9, 1.1] }),
});

// 5. Hover Elegance - Subtle interaction feedback
export const hoverSequence = project.sheet('HoverEffects').object('Interactive', {
  // Button hover states with precision
  elevation: types.number(0, { range: [0, 8] }),
  shadowIntensity: types.number(0, { range: [0, 0.3] }),
  scaleSubtle: types.number(1, { range: [0.98, 1.02] }),
  
  // Card hover with depth
  cardElevation: types.number(0, { range: [0, 12] }),
  cardRotationX: types.number(0, { range: [-3, 3] }),
  cardRotationY: types.number(0, { range: [-3, 3] }),
});

/**
 * Animation Timeline Definitions
 * Precise timing for each signature moment
 */

// Card reveal timeline - staggered entrance
export const createCardRevealTimeline = () => {
  const sequence = cardRevealSequence;
  
  return {
    duration: 1.2, // seconds
    keyframes: [
      // Initial state (all cards hidden)
      { position: 0, values: {
        card1: { opacity: 0, translateY: 20, scale: 0.95 },
        card2: { opacity: 0, translateY: 20, scale: 0.95 },
        card3: { opacity: 0, translateY: 20, scale: 0.95 },
        card4: { opacity: 0, translateY: 20, scale: 0.95 },
      }},
      
      // Card 1 entrance
      { position: 0.2, values: {
        card1: { opacity: 1, translateY: 0, scale: 1 },
      }},
      
      // Card 2 entrance (staggered)
      { position: 0.4, values: {
        card2: { opacity: 1, translateY: 0, scale: 1 },
      }},
      
      // Card 3 entrance
      { position: 0.6, values: {
        card3: { opacity: 1, translateY: 0, scale: 1 },
      }},
      
      // Card 4 entrance (final)
      { position: 0.8, values: {
        card4: { opacity: 1, translateY: 0, scale: 1 },
      }},
    ],
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' // Smooth, elegant easing
  };
};

// Command palette timeline - sophisticated entrance
export const createCommandPaletteTimeline = (isOpening: boolean = true) => {
  const sequence = commandPaletteSequence;
  
  if (isOpening) {
    return {
      duration: 0.4,
      keyframes: [
        // Initial state
        { position: 0, values: {
          backdropOpacity: 0,
          backdropBlur: 0,
          paletteOpacity: 0,
          paletteScale: 0.9,
          paletteY: -30,
          itemsOpacity: 0,
          itemsStagger: 0,
        }},
        
        // Backdrop appears
        { position: 0.3, values: {
          backdropOpacity: 1,
          backdropBlur: 20,
        }},
        
        // Palette container entrance
        { position: 0.5, values: {
          paletteOpacity: 1,
          paletteScale: 1,
          paletteY: 0,
        }},
        
        // Items stagger in
        { position: 1, values: {
          itemsOpacity: 1,
          itemsStagger: 1,
        }},
      ],
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)' // Spring-like entrance
    };
  } else {
    // Closing animation - reverse and faster
    return {
      duration: 0.2,
      keyframes: [
        { position: 0, values: {
          backdropOpacity: 1,
          paletteOpacity: 1,
          paletteScale: 1,
          paletteY: 0,
        }},
        { position: 1, values: {
          backdropOpacity: 0,
          paletteOpacity: 0,
          paletteScale: 0.95,
          paletteY: -20,
        }},
      ],
      easing: 'cubic-bezier(0.4, 0, 1, 1)' // Quick, decisive exit
    };
  }
};

// Page transition timeline - seamless navigation
export const createPageTransitionTimeline = () => {
  const sequence = navigationSequence;
  
  return {
    duration: 0.6,
    keyframes: [
      // Both pages in initial state
      { position: 0, values: {
        currentPageOpacity: 1,
        currentPageX: 0,
        currentPageScale: 1,
        newPageOpacity: 0,
        newPageX: 20,
        newPageScale: 0.98,
      }},
      
      // Current page starts exit
      { position: 0.3, values: {
        currentPageOpacity: 0,
        currentPageX: -20,
        currentPageScale: 0.98,
      }},
      
      // New page entrance begins
      { position: 0.4, values: {
        newPageOpacity: 1,
        newPageX: 0,
        newPageScale: 1,
      }},
    ],
    easing: 'cubic-bezier(0.23, 1, 0.32, 1)' // Smooth, professional transition
  };
};

/**
 * Real-time Animation Hooks
 * Connect Theatre.js values to React state
 */

export interface AnimationHook<T> {
  values: T;
  play: () => void;
  pause: () => void;
  reset: () => void;
}

// Custom hook for card reveal animation
export const useCardRevealAnimation = (): AnimationHook<{
  card1: { opacity: number; translateY: number; scale: number };
  card2: { opacity: number; translateY: number; scale: number };
  card3: { opacity: number; translateY: number; scale: number };
  card4: { opacity: number; translateY: number; scale: number };
}> => {
  // Theatre.js values would be connected here in a real implementation
  // For now, providing the interface structure
  
  return {
    values: {
      card1: { opacity: 0, translateY: 20, scale: 0.95 },
      card2: { opacity: 0, translateY: 20, scale: 0.95 },
      card3: { opacity: 0, translateY: 20, scale: 0.95 },
      card4: { opacity: 0, translateY: 20, scale: 0.95 },
    },
    play: () => {
      // Trigger card reveal sequence
      console.log('Playing card reveal animation');
    },
    pause: () => {
      console.log('Pausing card reveal animation');
    },
    reset: () => {
      console.log('Resetting card reveal animation');
    },
  };
};

// Custom hook for command palette animation
export const useCommandPaletteAnimation = (isOpen: boolean): AnimationHook<{
  backdropOpacity: number;
  backdropBlur: number;
  paletteOpacity: number;
  paletteScale: number;
  paletteY: number;
  itemsOpacity: number;
  itemsStagger: number;
}> => {
  return {
    values: {
      backdropOpacity: isOpen ? 1 : 0,
      backdropBlur: isOpen ? 20 : 0,
      paletteOpacity: isOpen ? 1 : 0,
      paletteScale: isOpen ? 1 : 0.9,
      paletteY: isOpen ? 0 : -30,
      itemsOpacity: isOpen ? 1 : 0,
      itemsStagger: isOpen ? 1 : 0,
    },
    play: () => {
      console.log('Playing command palette animation');
    },
    pause: () => {
      console.log('Pausing command palette animation');
    },
    reset: () => {
      console.log('Resetting command palette animation');
    },
  };
};

/**
 * Animation Presets - Pre-configured sophisticated animations
 */

export const AnimationPresets = {
  // Elegant card entrance
  cardEntrance: {
    duration: 0.5,
    transform: 'translateY(0px) scale(1)',
    opacity: 1,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  
  // Subtle hover elevation
  hoverElevation: {
    duration: 0.2,
    transform: 'translateY(-2px) scale(1.01)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Professional button interaction
  buttonPress: {
    duration: 0.1,
    transform: 'scale(0.98)',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Smooth page transitions
  pageTransition: {
    duration: 0.4,
    opacity: 1,
    transform: 'translateX(0px) scale(1)',
    easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
  },
} as const;

/**
 * Performance Optimization
 * GPU-accelerated transforms for smooth 60fps animations
 */

export const createGPUOptimizedStyle = (
  transform?: string,
  opacity?: number,
  willChange: string = 'transform, opacity'
) => ({
  transform: `${transform || ''} translateZ(0)`, // Force GPU acceleration
  opacity,
  willChange,
  backfaceVisibility: 'hidden' as const,
  perspective: 1000,
});

/**
 * Million-Dollar Animation Utilities
 * Helper functions for creating premium micro-interactions
 */

export const MillionDollarAnimations = {
  // Create staggered entrance animation
  createStaggeredEntrance: (itemCount: number, staggerDelay: number = 0.1) => {
    return Array.from({ length: itemCount }, (_, index) => ({
      delay: index * staggerDelay,
      duration: 0.5,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    }));
  },
  
  // Create morphing data visualization
  createDataMorph: (fromData: number[], toData: number[]) => {
    const steps = 60; // 60fps animation
    const morphFrames = [];
    
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const frame = fromData.map((startVal, index) => {
        const endVal = toData[index] || 0;
        return startVal + (endVal - startVal) * progress;
      });
      morphFrames.push(frame);
    }
    
    return morphFrames;
  },
  
  // Create elegant loading sequence
  createLoadingPulse: () => ({
    keyframes: [
      { opacity: 0.3, transform: 'scale(1)' },
      { opacity: 0.8, transform: 'scale(1.02)' },
      { opacity: 0.3, transform: 'scale(1)' },
    ],
    duration: 2,
    iterationCount: 'infinite',
    easing: 'ease-in-out',
  }),
};

export default project;
