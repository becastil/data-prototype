"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect } from "react";

// Register plugins once
if (typeof window !== "undefined" && !gsap.core.globals()["ScrollTrigger"]) {
  gsap.registerPlugin(ScrollTrigger);
}

// Custom hook for GSAP animations with automatic cleanup
export function useGSAP(callback: () => (() => void) | void, deps: any[] = []) {
  useLayoutEffect(() => {
    const cleanup = callback();
    
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars?.trigger) {
          trigger.kill();
        }
      });
    };
  }, deps);
}

// Premium easing functions
export const premiumEasing = {
  smooth: "power2.out",
  bounce: "back.out(1.7)",
  elastic: "elastic.out(1, 0.3)",
  spring: "power2.inOut",
  medical: "expo.out" // Perfect for healthcare data visualization
};

// Animation presets
export const animations = {
  fadeInUp: {
    from: { opacity: 0, y: 40 },
    to: { opacity: 1, y: 0, duration: 0.8, ease: premiumEasing.smooth }
  },
  
  scaleIn: {
    from: { scale: 0, opacity: 0 },
    to: { scale: 1, opacity: 1, duration: 0.6, ease: premiumEasing.bounce }
  },
  
  slideInLeft: {
    from: { opacity: 0, x: -60 },
    to: { opacity: 1, x: 0, duration: 0.7, ease: premiumEasing.spring }
  },
  
  staggerUp: {
    from: { opacity: 0, y: 30 },
    to: { opacity: 1, y: 0, duration: 0.6, ease: premiumEasing.medical },
    stagger: 0.1
  }
} as const;

// Utility functions
export const animateNumber = (
  element: HTMLElement, 
  from: number, 
  to: number, 
  duration: number = 2,
  format?: (n: number) => string
) => {
  const obj = { value: from };
  
  return gsap.to(obj, {
    value: to,
    duration,
    ease: premiumEasing.medical,
    onUpdate: () => {
      const formatted = format ? format(obj.value) : Math.round(obj.value).toString();
      element.textContent = formatted;
    }
  });
};

export const createScrollTrigger = (
  element: string | Element,
  animation: { from: gsap.TweenVars; to: gsap.TweenVars },
  options: object = {}
) => {
  return gsap.fromTo(element, 
    { ...animation.from },
    {
      ...animation.to,
      scrollTrigger: {
        trigger: element,
        start: "top 85%",
        toggleActions: "play none none none",
        ...options
      }
    }
  );
};

export { gsap, ScrollTrigger };