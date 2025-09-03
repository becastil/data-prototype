# Deploying Next.js 15.5.0 Healthcare Analytics to AWS Amplify

## Critical Compatibility Alert

**React 19.1.0 has limited support on AWS Amplify**. The `@aws-amplify/ui-react` package explicitly supports only React 16-18, causing dependency conflicts. For production healthcare deployments, **consider using React 18.3.0** until official React 19 support is confirmed. If React 19 is mandatory, use `npm install --legacy-peer-deps` but expect potential instability.

## Phase 1: Foundation and Compatibility Setup

### Initial Configuration Requirements

AWS Amplify fully supports Next.js 15.5.0 with App Router, but requires specific configuration. The platform is **HIPAA-eligible** as of June 2025, making it suitable for healthcare applications with proper setup.

**Base amplify.yml Configuration:**
```yaml
version: 1
env:
  variables:
    NODE_OPTIONS: "--max-old-space-size=8192"
    NEXT_TELEMETRY_DISABLED: 1
    NODE_ENV: production
frontend:
  phases:
    preBuild:
      commands:
        - nvm use 20  # Node.js 20 recommended for future compatibility
        - npm ci --prefer-offline --no-audit
        - echo "Node heap limit = $(node -e 'console.log(require("v8").getHeapStatistics().heap_size_limit / (1024 * 1024))')Mb"
    build:
      commands:
        - npm run build
    postBuild:
      commands:
        - echo "Build completed at $(date)"
        - du -sh .next
  artifacts:
    baseDirectory: .next  # Critical for Next.js 14+
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
      - ~/.npm/**/*
```

### Handling Known Issues

**Next.js 15 Loading UI Bug**: The `loading.tsx` files in App Router directories don't render when deployed to Amplify. Implement explicit loading states with Suspense boundaries instead:

```javascript
// Use this pattern instead of loading.tsx
import { Suspense } from 'react';

function LoadingFallback() {
  return <div>Loading analytics...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AnalyticsDashboard />
    </Suspense>
  );
}
```

## Phase 2: Complex Library Configuration

### Vanilla Extract Zero-Runtime CSS

Vanilla Extract requires build-time compilation, which works seamlessly with Amplify's static generation:

**next.config.js:**
```javascript
const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin');
const withVanillaExtract = createVanillaExtractPlugin({
  identifiers: 'short' // Production optimization
});

const nextConfig = {
  transpilePackages: ['@vanilla-extract/css'],
  experimental: {
    optimizePackageImports: ['@vanilla-extract/css']
  }
};

module.exports = withVanillaExtract(nextConfig);
```

### WebGL and GPU Acceleration for ECharts

WebGL rendering runs client-side and is fully supported. Configure webpack to handle WebGL assets properly:

```javascript
// next.config.js additions
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        jsdom: false
      };
      
      // For optimal WebGL performance
      config.optimization.splitChunks.cacheGroups.webgl = {
        test: /[\\/]node_modules[\\/](echarts-gl|three)[\\/]/,
        name: 'webgl-vendor',
        priority: 10
      };
    }
    return config;
  }
};
```

### Animation Libraries Integration

**Theatre.js Production Build:**
```yaml
# Add to amplify.yml preBuild
- npm install @theatre/core @theatre/studio @theatre/r3f
```

**Framer Motion Client-Side Setup:**
```javascript
'use client';  // Required for Next.js 15 App Router

import { motion, AnimatePresence } from 'framer-motion';

export default function AnimatedChart() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Chart component */}
    </motion.div>
  );
}
```

**Rive Animations with WASM:**
```javascript
// next.config.js for Rive support
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });
    
    config.experiments = {
      asyncWebAssembly: true,
    };
    
    return config;
  }
};
```

## Phase 3: Healthcare Data Security and HIPAA Compliance

### localStorage Security for Healthcare Data

**Critical**: Never store PHI in localStorage. It's vulnerable to XSS attacks and persists in plain text. Instead, implement this secure pattern:

```javascript
// Secure client-side data handling
class SecureHealthcareStorage {
  constructor() {
    this.memoryCache = new Map();
  }
  
  async storeTemporary(key, data) {
    // Only store non-PHI identifiers
    const sessionToken = await generateSecureToken();
    this.memoryCache.set(sessionToken, data);
    
    // Store only the token reference in localStorage
    localStorage.setItem(key, sessionToken);
    
    // Auto-expire after session
    setTimeout(() => {
      this.memoryCache.delete(sessionToken);
      localStorage.removeItem(key);
    }, 3600000); // 1 hour
  }
  
  async retrieve(key) {
    const token = localStorage.getItem(key);
    return this.memoryCache.get(token);
  }
}
```

### CSV Processing with Security

```javascript
import { readRemoteFile } from 'react-papaparse';

const processHealthcareCSV = (csvUrl) => {
  readRemoteFile(csvUrl, {
    worker: true, // Prevent UI blocking
    step: (row) => {
      // Validate and sanitize each row
      const sanitized = sanitizePHI(row.data);
      processPatientRecord(sanitized);
    },
    complete: () => {
      // Clear memory immediately
      if (typeof window !== 'undefined') {
        window.gc?.(); // Force garbage collection if available
      }
    },
    header: true,
    skipEmptyLines: true
  });
};
```

### Security Headers Configuration

Create `customHttp.yml` in your project root:

```yaml
customHeaders:
  - pattern: '**'
    headers:
      - key: 'Strict-Transport-Security'
        value: 'max-age=31536000; includeSubDomains; preload'
      - key: 'X-Frame-Options'
        value: 'DENY'
      - key: 'X-Content-Type-Options'
        value: 'nosniff'
      - key: 'Content-Security-Policy'
        value: "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.amazonaws.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'"
      - key: 'Permissions-Policy'
        value: 'camera=(), microphone=(), geolocation=()'
```

## Phase 4: Performance Optimization

### Bundle Size Optimization for <200KB Target

```javascript
// next.config.js optimizations
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      'echarts',
      '@mui/x-charts',
      'recharts',
      'framer-motion'
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 200000,
        cacheGroups: {
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'framework',
            priority: 40
          },
          charts: {
            test: /[\\/]node_modules[\\/](echarts|recharts|@mui\/x-charts)[\\/]/,
            name: 'charts',
            priority: 30
          },
          animations: {
            test: /[\\/]node_modules[\\/](framer-motion|@theatre|@rive-app)[\\/]/,
            name: 'animations',
            priority: 20
          }
        }
      };
    }
    return config;
  }
};
```

### Dynamic Imports and Lazy Loading

```javascript
import dynamic from 'next/dynamic';

// Heavy chart components with loading states
const EChartsWebGL = dynamic(
  () => import('../components/EChartsWebGL'),
  { 
    ssr: false,
    loading: () => <div>Loading WebGL charts...</div>
  }
);

const TheatreAnimation = dynamic(
  () => import('../components/TheatreAnimation'),
  { ssr: false }
);

// Command palette loaded on-demand
const CommandPalette = dynamic(
  () => import('../components/CommandPalette'),
  { ssr: false }
);
```

### CDN and Caching Configuration

AWS Amplify provides **98% performance improvement** with optimized caching:

```yaml
# Enhanced caching in amplify.yml
customHeaders:
  - pattern: '**/*.js'
    headers:
      - key: 'Cache-Control'
        value: 'public, max-age=31536000, immutable'
  - pattern: '**/*.css'
    headers:
      - key: 'Cache-Control'
        value: 'public, max-age=31536000, immutable'
  - pattern: '/api/**'
    headers:
      - key: 'Cache-Control'
        value: 's-maxage=300, stale-while-revalidate=600'
```

## Phase 5: Production Deployment

### Environment Variables for Healthcare Endpoints

```yaml
# amplify.yml environment configuration
version: 1
env:
  variables:
    NODE_OPTIONS: "--max-old-space-size=8192"
frontend:
  phases:
    preBuild:
      commands:
        - |
          if [ "$AWS_BRANCH" = "production" ]; then
            echo "NEXT_PUBLIC_API_URL=$HEALTHCARE_API_URL_PROD" >> .env.production.local
            echo "NEXT_PUBLIC_ENVIRONMENT=production" >> .env.production.local
          elif [ "$AWS_BRANCH" = "staging" ]; then
            echo "NEXT_PUBLIC_API_URL=$HEALTHCARE_API_URL_STAGING" >> .env.production.local
            echo "NEXT_PUBLIC_ENVIRONMENT=staging" >> .env.production.local
          fi
```

### Web Vitals Monitoring

```javascript
// pages/_app.js or app/layout.js
import { useReportWebVitals } from 'next/web-vitals';

function MyApp({ Component, pageProps }) {
  useReportWebVitals((metric) => {
    // Critical for healthcare apps
    if (metric.name === 'INP' && metric.value > 200) {
      console.error('Interaction latency exceeds healthcare threshold');
      // Send to monitoring service
    }
    
    // Track all metrics
    window.gtag?.('event', metric.name, {
      value: Math.round(metric.value),
      label: metric.id,
      non_interaction: true
    });
  });
  
  return <Component {...pageProps} />;
}
```

### WCAG 2.2 AA Compliance

Implement focus management for keyboard navigation:

```javascript
// Healthcare-specific keyboard shortcuts
import { useHotkeys } from 'react-hotkeys-hook';

export function HealthcareShortcuts() {
  useHotkeys('ctrl+p', () => openPatientSearch());
  useHotkeys('ctrl+d', () => openDiagnostics());
  useHotkeys('ctrl+shift+e', () => activateEmergencyMode());
  
  // Focus management for WCAG 2.2
  useHotkeys('tab', (e) => {
    const focusable = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    // Ensure focus is never obscured (WCAG 2.2 requirement)
    ensureFocusVisible(focusable);
  });
}
```

## Phase 6: Deployment Gotchas and Solutions

### Critical Issues and Resolutions

**1. React 19 Dependency Conflicts**
```bash
# Temporary workaround until official support
npm install --legacy-peer-deps
# Or downgrade to React 18.3.0 for production stability
```

**2. Build Memory Issues with Large Datasets**
```yaml
# Increase Node.js memory allocation
env:
  variables:
    NODE_OPTIONS: "--max-old-space-size=8192"
```

**3. Loading UI Not Rendering**
- Use Suspense boundaries instead of loading.tsx files
- Implement skeleton screens for better UX

**4. WebGL Context Loss**
```javascript
// Handle WebGL context recovery
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  setTimeout(() => reinitializeWebGL(), 1000);
});
```

### Cost Optimization

For a medium-sized healthcare system (10,000 daily users):
- **Estimated monthly cost**: $800-1,500
- **Optimization strategies**:
  - Enable 98% cache hit ratio: Saves ~60% on data transfer
  - Use Brotli compression: Reduces transfer by 20-30%
  - Implement proper code splitting: Reduces initial load by 60%

### Migration Checklist

**Pre-deployment validation:**
- ✓ Execute BAA with AWS through AWS Artifact
- ✓ Verify all HIPAA-eligible services are used
- ✓ Test with `--legacy-peer-deps` if using React 19
- ✓ Validate WebGL rendering on target devices
- ✓ Confirm WCAG 2.2 AA compliance
- ✓ Test CSV processing with large datasets
- ✓ Verify all environment variables are properly set
- ✓ Validate security headers are applied
- ✓ Test disaster recovery procedures
- ✓ Confirm bundle size meets <200KB target

## Conclusion

AWS Amplify provides a robust platform for deploying cutting-edge Next.js 15.5.0 healthcare analytics applications. While React 19.1.0 support is limited, the platform excels at HIPAA compliance, performance optimization, and scalability. The 98% cache improvement and built-in CDN make it ideal for data-intensive dashboards. Focus on proper security configuration, performance monitoring, and gradual rollout to ensure successful deployment of your healthcare analytics application.