'use client';

import { useRef, useEffect } from 'react';
import autoAnimate from '@formkit/auto-animate';

// Custom hook for Auto-Animate integration
// Provides zero-config smooth layout transitions
export const useAutoAnimate = <T extends Element>(options?: any) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Enable auto-animate on the element
    const controller = autoAnimate(ref.current, {
      // Optimized settings for premium feel
      duration: 250, // Slightly faster than default 250ms
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // Material Design Curve
      ...options
    });

    return () => {
      // autoAnimate returns an AnimationController object, not a cleanup fn
      controller?.destroy?.();
      controller?.disable?.();
    };
  }, [options]);

  return ref;
};

// Specialized hook for dashboard tiles
export const useAutoAnimateCards = <T extends Element>() => {
  return useAutoAnimate<T>({
    duration: 350, // Slightly longer for cards
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)', // Custom smooth curve
    disrespectUserMotionPreference: false, // Respect user motion preferences
  });
};

// Hook for list animations (tables, navigation)
export const useAutoAnimateList = <T extends Element>() => {
  return useAutoAnimate<T>({
    duration: 200, // Fast for list items
    easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    disrespectUserMotionPreference: false,
  });
};

export default useAutoAnimate;
