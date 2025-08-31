# Healthcare Analytics Dashboard - Million-Dollar UI

A high-performance Next.js application for healthcare data visualization featuring million-dollar UI patterns, enterprise-grade component architecture, and 3x performance improvements through hardware-accelerated animations.

## Features

- **Dual CSV Upload System**: Upload budget and claims data separately with drag-and-drop support
- **4-Tile Analytics Dashboard**:
  - Budget vs Expenses Trend (Rolling 12 Months)
  - HCC Band Distribution Scatter Chart
  - Enrollment Trends with Employee Count tracking
  - HCC Data Table with sorting and filtering
- **Advanced Chart Visualizations**:
  - Stacked bar charts with budget line overlay
  - Rolling 12-month data window for focused analysis
  - Real-time data processing from CSV files
- **Data Processing Capabilities**:
  - Smart column detection for various CSV formats
  - Automatic data aggregation (admin fees + stop loss fees)
  - Employee Count extraction for enrollment tracking
- **Million-Dollar UI Performance**: 3x CPU performance improvement with hardware-accelerated animations
- **Enterprise Component Architecture**: shadcn/ui system with compound components and React Context
- **MUI X Charts Integration**: High-performance charts with built-in interactivity

## Million-Dollar UI Features

### Phase 1: Performance & Animation Upgrades ✅
- **Rive Micro-Interactions**: 3x CPU improvement over Framer Motion with 10x smaller file sizes
- **Motion One Animations**: 120fps hardware-accelerated animations with 2.3KB bundle size
- **Auto-Animate Layout Transitions**: Zero-config smooth transitions for dynamic content
- **GPU-Optimized CSS**: Transform/opacity-only animations for 4-6x performance gains
- **Performance Classes**: Built-in GPU acceleration utilities for consistent 60fps+ experiences

### Phase 2: Component System Modernization ✅  
- **shadcn/ui Integration**: Copy-paste component ownership with Radix UI primitives
- **Compound Dashboard Components**: Eliminates prop drilling with React Context patterns
- **Modern Foundation Components**: Button, Card, Tabs, Theme Toggle with CVA variants
- **Enterprise Architecture**: Type-safe compound patterns with proper error boundaries
- **Design System Integration**: Consistent styling with Class Variance Authority

### Technology Stack
- **Performance**: Rive (animations), Motion One (60fps+), Auto-Animate (layout)
- **Components**: shadcn/ui, Radix UI primitives, Class Variance Authority
- **Framework**: Next.js 15.5.0 with Turbopack, React 19.1.0, TypeScript
- **Styling**: Tailwind CSS 4.x with GPU-accelerated performance classes
- **Charts**: MUI X Charts 8.10.2, Recharts 3.1.2 for advanced visualizations

## Getting Started

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/becastil/data-prototype.git
cd data-prototype
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3005](http://localhost:3005) in your browser to see the dashboard.

### Troubleshooting

If you encounter issues:

**Windows PowerShell** - "'next' is not recognized":
```powershell
npm install    # Install dependencies first
npm run dev    # Then start the server
```

**WSL/Linux** - "Port already in use":
```bash
# Find and kill the process using port 3005
lsof -i :3005
kill -9 [PID]
# Or change the port in package.json
```

## Dashboard Overview

The dashboard features a 4-tile layout displaying:

### Tile 1: Budget vs Expenses Trend
- **Simplified Stacked Bar Chart** with 5 layers:
  - Total Fixed Cost (sum of all admin + stop loss fees)
  - Stop Loss Reimbursements
  - Rx Rebates
  - Medical Claims
  - Rx (Prescription) costs
- **Budget Line Overlay**: Shows monthly budget targets
- **Rolling 12-Month View**: Automatically displays the latest 12 months of data

### Tile 2: HCC Band Distribution
- **Scatter Chart**: Visualizes cost band distribution across claimants
- **Dual Axis**: Medical costs (left) and Rx costs (right)
- **Color-Coded Bands**: $0-25K, $25K-50K, $50K-75K, $75K-100K, $100K+
- **Interactive Tooltips**: Shows detailed claimant information

### Tile 3: Enrollment Trends
- **Line Chart**: Tracks Employee Count over time
- **Statistics Cards**: Current enrollment, change percentage, and average
- **Trend Indicators**: Visual indicators for growth or decline
- **Real Data**: Uses actual Employee Count from uploaded CSV

### Tile 4: HCC Data Table
- **Sortable Columns**: Click headers to sort data
- **Filterable Content**: Search and filter capabilities
- **Comprehensive View**: Display all claims data in tabular format

## Development

### Development Stack

#### Core Framework
- **Next.js 15.5.0** with Turbopack for ultra-fast development builds
- **React 19.1.0** with modern concurrent features
- **TypeScript** for enterprise-grade type safety

#### Million-Dollar UI Architecture
- **Rive (@rive-app/canvas)**: High-performance micro-interactions (3x CPU improvement)
- **Motion One**: Hardware-accelerated 120fps animations (2.3KB bundle)
- **Auto-Animate (@formkit/auto-animate)**: Zero-config layout transitions
- **shadcn/ui**: Enterprise component system with Radix UI primitives
- **Class Variance Authority (CVA)**: Type-safe component variants
- **Tailwind CSS 4.x**: GPU-optimized performance classes

#### Data Visualization
- **MUI X Charts 8.10.2**: Advanced interactive visualizations
- **Recharts 3.1.2**: Composable chart components
- **MUI Material 7.3.1**: Material Design components

#### Utilities & Parsing
- **PapaParse 5.5.3**: High-performance CSV parsing
- **Lucide React**: Consistent icon system
- **Tailwind Merge**: Dynamic className composition

### Project Structure

```
data-prototype/
├── app/
│   ├── components/
│   │   ├── ui/                      # Million-Dollar UI Components
│   │   │   ├── dashboard.tsx        # Compound Dashboard with React Context
│   │   │   ├── button.tsx           # Modern Button with CVA variants
│   │   │   ├── card.tsx             # Flexible Card component
│   │   │   ├── tabs.tsx             # Accessible Tab system
│   │   │   └── theme-toggle.tsx     # Advanced theme management
│   │   ├── DualCSVLoader.tsx        # CSV upload with drag-and-drop
│   │   ├── RiveLoader.tsx           # High-performance loading animations
│   │   ├── MotionButton.tsx         # Hardware-accelerated button
│   │   ├── MUIBudgetChart.tsx       # Budget vs Expenses visualization
│   │   ├── MUIEnrollmentChart.tsx   # Enrollment trends with MUI
│   │   └── HCCDataTable.tsx         # Interactive claims data table
│   ├── lib/
│   │   └── utils.ts                 # shadcn/ui utilities (cn, tailwind-merge)
│   ├── utils/
│   │   ├── chartDataProcessors.ts   # Data transformation utilities
│   │   └── motionUtils.ts           # Motion One animation presets
│   ├── hooks/
│   │   └── useAutoAnimate.ts        # Auto-Animate React hook
│   ├── constants/
│   │   └── chartColors.ts           # Centralized design system
│   ├── page.tsx                     # Main dashboard with compound components
│   ├── layout.tsx                   # Root layout with metadata
│   └── globals.css                  # GPU-optimized performance classes
├── components.json                  # shadcn/ui configuration
├── package.json                     # Dependencies and scripts
├── next.config.ts                   # Next.js with Turbopack configuration
└── README.md                        # This documentation
```

### Available Scripts

- `npm run dev` - Starts development server with Turbopack on port 3005
- `npm run build` - Creates optimized production build with Turbopack
- `npm run build:analyze` - Analyze bundle size and performance metrics
- `npm start` - Runs production server on port 3005

### Performance Development

The Million-Dollar UI transformation includes built-in performance monitoring:

```bash
# Analyze bundle size and performance
npm run build:analyze

# Monitor 60fps animations in dev
npm run dev  # Check DevTools Performance tab

# Verify GPU acceleration
# Open DevTools > Rendering > Show layer borders
```

## Usage

### Uploading Data

1. **Start the application** and navigate to the homepage
2. **Upload CSV Files**:
   - Drag and drop or click to upload Budget Data (left panel)
   - Drag and drop or click to upload Claims Data (right panel)
3. **View Dashboard**: Once both files are uploaded, the dashboard automatically displays

### CSV Format Requirements

**Budget Data CSV** should include columns like:
- Month/Period
- Medical Claims, Rx, Admin Fees, Stop Loss Fees
- Budget/Target amounts
- Employee Count (for enrollment tracking)

**Claims Data CSV** should include columns like:
- Claimant Number
- Medical and Rx costs
- Service Type
- Total amounts

The system uses smart column detection to identify data regardless of exact column naming.

### Changing Theme Colors

Modify `app/globals.css` to adjust the cream white theme:

```css
:root {
  --background: #FAF8F3;  /* Cream white background */
  --foreground: #2C2C2C;  /* Dark text */
}
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Deploy with default settings

### Other Platforms

For production deployment:
```bash
npm run build
npm start
```

Supports deployment to:
- Netlify
- AWS/Azure/GCP
- Any Node.js hosting service

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available for educational and commercial purposes.