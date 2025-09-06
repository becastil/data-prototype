import { animate, spring, stagger } from '@motionone/dom';

// Hardware-accelerated animation utilities using Motion One
// 2.3KB bundle size, 120fps GPU-accelerated animations

// Motion One types
type Keyframes = Record<string, string[] | number[]>;
type AnimationOptions = {
  duration?: number;
  delay?: number;
  easing?: any; // MotionOne easing functions
  [key: string]: any; // Additional options
};

export const motionPresets = {
  // Smooth entrance animations
  fadeIn: {
    keyframes: { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0px)'] },
    options: { 
      duration: 0.4, 
      easing: spring({ damping: 25, stiffness: 300, mass: 1 }) 
    }
  },
  
  // Scale entrance for modals/cards
  scaleIn: {
    keyframes: { 
      opacity: [0, 1], 
      transform: ['scale(0.8) translateZ(0)', 'scale(1) translateZ(0)'] 
    },
    options: { 
      duration: 0.3, 
      easing: spring({ damping: 20, stiffness: 400, mass: 1 }) 
    }
  },
  
  // Smooth slide transitions
  slideLeft: {
    keyframes: { 
      opacity: [0, 1], 
      transform: ['translateX(30px) translateZ(0)', 'translateX(0px) translateZ(0)'] 
    },
    options: { 
      duration: 0.35, 
      easing: spring({ damping: 22, stiffness: 350, mass: 1 }) 
    }
  },
  
  // Button hover effect
  buttonHover: {
    keyframes: { transform: ['translateY(0px) translateZ(0)', 'translateY(-2px) translateZ(0)'] },
    options: { 
      duration: 0.15, 
      easing: [0.4, 0, 0.2, 1] 
    }
  },
  
  // Loading pulse
  pulse: {
    keyframes: { 
      opacity: [0.5, 1, 0.5],
      transform: ['scale(1) translateZ(0)', 'scale(1.02) translateZ(0)', 'scale(1) translateZ(0)']
    },
    options: { 
      duration: 1.5, 
      repeat: Infinity,
      easing: 'ease-in-out'
    }
  }
};

// Utility functions for common animations
export const animateElement = (
  selector: string | Element, 
  preset: keyof typeof motionPresets,
  customOptions: Partial<AnimationOptions> = {}
) => {
  const { keyframes, options } = motionPresets[preset];
  return animate(selector, keyframes, { ...options, ...customOptions });
};

// Staggered animations for lists
export const staggerChildren = (
  selector: string,
  preset: keyof typeof motionPresets,
  staggerDelay: number = 0.1
) => {
  const { keyframes, options } = motionPresets[preset];
  return animate(
    selector,
    keyframes,
    {
      ...options,
      delay: stagger(staggerDelay)
    }
  );
};

// Performance-optimized hover animations
export const addHoverAnimation = (element: Element) => {
  const handleMouseEnter = () => {
    animate(element, motionPresets.buttonHover.keyframes, motionPresets.buttonHover.options);
  };
  
  const handleMouseLeave = () => {
    animate(element, 
      { transform: ['translateY(-2px) translateZ(0)', 'translateY(0px) translateZ(0)'] }, 
      { duration: 0.15, easing: [0.4, 0, 0.2, 1] }
    );
  };
  
  element.addEventListener('mouseenter', handleMouseEnter);
  element.addEventListener('mouseleave', handleMouseLeave);
  
  // Return cleanup function
  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter);
    element.removeEventListener('mouseleave', handleMouseLeave);
  };
};

// GPU-optimized scroll animations
export const createScrollAnimation = (
  element: Element,
  keyframes: Keyframes,
  options: Partial<AnimationOptions> = {}
) => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        animate(element, keyframes, {
          duration: 0.6,
          easing: spring({ damping: 25, stiffness: 300, mass: 1 }),
          ...options
        });
        observer.unobserve(element);
      }
    },
    { threshold: 0.1 }
  );
  
  observer.observe(element);
  return observer;
};