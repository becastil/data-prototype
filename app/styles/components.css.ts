import { recipe, RecipeVariants } from '@vanilla-extract/recipes';
import { style } from '@vanilla-extract/css';
import { vars } from './theme.css';
import { sprinkles } from './sprinkles.css';

// Base performance-optimized styles
export const gpuAccelerated = style({
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden',
  perspective: '1000px',
  willChange: 'transform, opacity',
});

// Panel elevated style - sophisticated monochrome
export const panelElevated = recipe({
  base: [
    gpuAccelerated,
    {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      border: `1px solid rgba(0, 0, 0, 0.08)`,
      boxShadow: vars.shadows.md,
      borderRadius: vars.radii.lg,
      transition: `all ${vars.transitions.medium}`,
      
      ':hover': {
        boxShadow: vars.shadows.lg,
        transform: 'translateY(-1px) translateZ(0)',
      },
      
      selectors: {
        '[data-theme="dark"] &': {
          backgroundColor: 'rgba(26, 26, 26, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.6), 0 1px 2px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.03)',
        }
      }
    }
  ]
});

// Button recipe with monochrome variants
export const button = recipe({
  base: [
    gpuAccelerated,
    sprinkles({
      fontFamily: 'subheading',
      borderRadius: 'full',
      transition: 'fast',
    }),
    {
      position: 'relative',
      overflow: 'hidden',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 500,
      letterSpacing: '0.02em',
      
      ':disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
        transform: 'none',
      },
      
      ':hover:not(:disabled)': {
        transform: 'translateY(-1px) translateZ(0)',
      },
      
      ':active:not(:disabled)': {
        transform: 'translateY(0px) translateZ(0)',
        transition: '0.05s cubic-bezier(0.4, 0, 0.2, 1)',
      }
    }
  ],
  variants: {
    variant: {
      primary: {
        backgroundColor: vars.colors.black,
        color: vars.colors.white,
        
        ':hover:not(:disabled)': {
          backgroundColor: vars.colors.charcoal,
        },
        
        selectors: {
          '[data-theme="dark"] &': {
            backgroundColor: vars.colors.white,
            color: vars.colors.black,
          },
          '[data-theme="dark"] &:hover:not(:disabled)': {
            backgroundColor: vars.colors.paleGray,
          }
        }
      },
      secondary: {
        backgroundColor: vars.colors.paleGray,
        color: vars.colors.charcoal,
        
        ':hover:not(:disabled)': {
          backgroundColor: vars.colors.lightGray,
        },
        
        selectors: {
          '[data-theme="dark"] &': {
            backgroundColor: vars.colors.charcoal,
            color: vars.colors.paleGray,
          },
          '[data-theme="dark"] &:hover:not(:disabled)': {
            backgroundColor: vars.colors.gray,
          }
        }
      },
      ghost: {
        backgroundColor: 'transparent',
        color: vars.colors.charcoal,
        
        ':hover:not(:disabled)': {
          backgroundColor: vars.colors.offWhite,
        },
        
        selectors: {
          '[data-theme="dark"] &': {
            color: vars.colors.paleGray,
          },
          '[data-theme="dark"] &:hover:not(:disabled)': {
            backgroundColor: vars.colors.offBlack,
          }
        }
      }
    },
    size: {
      sm: {
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
      },
      md: {
        padding: '0.75rem 1rem',
        fontSize: '1rem',
      },
      lg: {
        padding: '1rem 1.5rem',
        fontSize: '1.125rem',
      }
    }
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md'
  }
});

// Card recipe - sophisticated elevation
export const card = recipe({
  base: [
    gpuAccelerated,
    {
      backgroundColor: vars.colors.white,
      borderRadius: vars.radii.xl,
      boxShadow: vars.shadows.sm,
      overflow: 'hidden',
      transition: `all ${vars.transitions.medium}`,
      
      selectors: {
        '[data-theme="dark"] &': {
          backgroundColor: vars.colors.offBlack,
        }
      }
    }
  ],
  variants: {
    hover: {
      true: {
        ':hover': {
          boxShadow: vars.shadows.lg,
          transform: 'translateY(-4px) translateZ(0)',
        }
      }
    },
    padding: {
      none: { padding: 0 },
      sm: { padding: vars.spacing.md },
      md: { padding: vars.spacing.lg },
      lg: { padding: vars.spacing.xl },
    }
  },
  defaultVariants: {
    padding: 'md'
  }
});

// Input recipe - minimalist monochrome
export const input = recipe({
  base: [
    gpuAccelerated,
    sprinkles({
      fontFamily: 'body',
      borderRadius: 'md',
    }),
    {
      border: `1px solid ${vars.colors.border}`,
      backgroundColor: vars.colors.white,
      color: vars.colors.text,
      padding: '0.75rem',
      fontSize: '1rem',
      transition: `all ${vars.transitions.fast}`,
      
      ':focus': {
        outline: `2px solid ${vars.colors.black}`,
        outlineOffset: '2px',
        borderColor: vars.colors.black,
      },
      
      '::placeholder': {
        color: vars.colors.textSecondary,
      },
      
      selectors: {
        '[data-theme="dark"] &': {
          backgroundColor: vars.colors.offBlack,
          color: vars.colors.text,
          borderColor: vars.colors.border,
        },
        '[data-theme="dark"] &:focus': {
          outlineColor: vars.colors.white,
          borderColor: vars.colors.white,
        }
      }
    }
  ]
});

// Badge recipe - semantic monochrome
export const badge = recipe({
  base: [
    sprinkles({
      fontFamily: 'subheading',
      borderRadius: 'full',
    }),
    {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      padding: '0.25rem 0.75rem',
      fontSize: '0.75rem',
      fontWeight: 500,
      transition: `all ${vars.transitions.fast}`,
    }
  ],
  variants: {
    variant: {
      success: {
        backgroundColor: vars.colors.successBg,
        color: vars.colors.success,
        border: `1px solid ${vars.colors.success}20`,
      },
      warning: {
        backgroundColor: vars.colors.warningBg,
        color: vars.colors.warning,
        border: `1px solid ${vars.colors.warning}20`,
      },
      danger: {
        backgroundColor: vars.colors.dangerBg,
        color: vars.colors.danger,
        border: `1px solid ${vars.colors.danger}20`,
      },
      info: {
        backgroundColor: vars.colors.infoBg,
        color: vars.colors.info,
        border: `1px solid ${vars.colors.info}20`,
      }
    }
  }
});

// Loading state for micro-interactions
export const loadingPulse = style([
  gpuAccelerated,
  {
    animation: 'gpu-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    '@keyframes gpu-pulse': {
      '0%, 100%': {
        opacity: 0.5,
        transform: 'scale(1) translateZ(0)',
      },
      '50%': {
        opacity: 1,
        transform: 'scale(1.02) translateZ(0)',
      }
    }
  }
]);

// Motion-safe animations (respects reduced motion)
export const motionSafe = style({
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none !important',
    transition: 'none !important',
    transform: 'none !important',
  }
});

// Export types for recipes
export type ButtonVariants = RecipeVariants<typeof button>;
export type CardVariants = RecipeVariants<typeof card>;
export type BadgeVariants = RecipeVariants<typeof badge>;