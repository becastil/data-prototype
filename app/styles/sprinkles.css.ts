import { defineProperties, createSprinkles } from '@vanilla-extract/sprinkles';
import { vars } from './theme.css';

// Performance-optimized properties using transforms and opacity
const performanceProperties = defineProperties({
  conditions: {
    mobile: {},
    tablet: { '@media': 'screen and (min-width: 768px)' },
    desktop: { '@media': 'screen and (min-width: 1024px)' },
  },
  defaultCondition: 'mobile',
  properties: {
    // GPU-accelerated transforms only
    transform: [
      'translateZ(0)', // Hardware acceleration
      'translateY(-1px)',
      'translateY(-2px)',
      'translateY(-4px)',
      'scale(1.02)',
      'scale(1.05)',
      'scale(1.1)',
    ],
    opacity: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    transition: vars.transitions,
    willChange: ['transform', 'opacity', 'auto'],
    backfaceVisibility: ['hidden'],
    perspective: ['1000px'],
  }
});

// Layout properties
const layoutProperties = defineProperties({
  conditions: {
    mobile: {},
    tablet: { '@media': 'screen and (min-width: 768px)' },
    desktop: { '@media': 'screen and (min-width: 1024px)' },
  },
  defaultCondition: 'mobile',
  properties: {
    display: ['none', 'flex', 'block', 'inline', 'inline-block', 'grid'],
    flexDirection: ['row', 'column'],
    justifyContent: [
      'stretch',
      'flex-start',
      'center',
      'flex-end',
      'space-around',
      'space-between',
      'space-evenly',
    ],
    alignItems: ['stretch', 'flex-start', 'center', 'flex-end'],
    gap: vars.spacing,
    paddingTop: vars.spacing,
    paddingBottom: vars.spacing,
    paddingLeft: vars.spacing,
    paddingRight: vars.spacing,
    marginTop: vars.spacing,
    marginBottom: vars.spacing,
    marginLeft: vars.spacing,
    marginRight: vars.spacing,
  },
  shorthands: {
    padding: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
    paddingX: ['paddingLeft', 'paddingRight'],
    paddingY: ['paddingTop', 'paddingBottom'],
    margin: ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'],
    marginX: ['marginLeft', 'marginRight'],
    marginY: ['marginTop', 'marginBottom'],
  }
});

// Color properties
const colorProperties = defineProperties({
  properties: {
    color: vars.colors,
    backgroundColor: vars.colors,
    borderColor: vars.colors,
  }
});

// Typography properties
const typographyProperties = defineProperties({
  properties: {
    fontFamily: vars.fonts,
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: [300, 400, 500, 600, 700, 800],
    lineHeight: [1, 1.2, 1.3, 1.4, 1.5, 1.6],
    letterSpacing: ['-0.02em', '-0.01em', '0', '0.01em', '0.02em'],
    textAlign: ['left', 'center', 'right'],
  }
});

// Border properties
const borderProperties = defineProperties({
  properties: {
    borderRadius: vars.radii,
    borderWidth: ['0', '1px', '2px', '3px'],
    borderStyle: ['solid', 'dashed', 'dotted', 'none'],
  }
});

// Shadow properties
const shadowProperties = defineProperties({
  properties: {
    boxShadow: {
      ...vars.shadows,
      none: 'none',
    }
  }
});

// Combine all sprinkles
export const sprinkles = createSprinkles(
  performanceProperties,
  layoutProperties,
  colorProperties,
  typographyProperties,
  borderProperties,
  shadowProperties
);

// Note: Export only the sprinkles function from a .css.ts file to satisfy
// the Next.js + vanilla-extract export constraints.
