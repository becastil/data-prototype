# Healthcare Analytics Dashboard

A modern Next.js application for healthcare data visualization and analysis with dual CSV upload capability and interactive MUI X Charts.

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
- **Professional Design**: Modern UI with Tailwind CSS and Framer Motion animations
- **MUI X Charts Integration**: High-performance charts with built-in interactivity
- Built with Next.js 15.5.0, React 19.1.0, MUI X Charts 8.10.2, and Tailwind CSS 4.x

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

### Tech Stack

- **Next.js 15.5.0** with Turbopack for fast development
- **React 19.1.0** for UI components
- **MUI X Charts 8.10.2** for advanced data visualization
- **MUI Material 7.3.1** for UI components
- **Tailwind CSS 4.x** for styling
- **TypeScript** for type safety
- **Framer Motion 12.23.12** for animations
- **PapaParse 5.5.3** for CSV parsing

### Project Structure

```
data-prototype/
├── app/
│   ├── components/
│   │   ├── DualCSVLoader.tsx        # Dual CSV upload interface
│   │   ├── MUIBudgetChart.tsx       # Budget vs Expenses chart (MUI)
│   │   ├── MUIEnrollmentChart.tsx   # Enrollment trends chart (MUI)
│   │   ├── MUIChartContainer.tsx    # MUI-Tailwind isolation wrapper
│   │   ├── CostBandScatterChart.tsx # HCC band distribution
│   │   └── HCCDataTable.tsx         # Claims data table
│   ├── utils/
│   │   └── chartDataProcessors.ts   # Data transformation utilities
│   ├── constants/
│   │   └── chartColors.ts           # Centralized color scheme
│   ├── page.tsx                     # Main dashboard page
│   ├── layout.tsx                   # Root layout with metadata
│   └── globals.css                  # Global styles
├── public/                          # Static assets
├── package.json                     # Dependencies and scripts
├── next.config.ts                   # Next.js configuration
└── README.md                        # This file
```

### Available Scripts

- `npm run dev` - Starts development server on port 3005
- `npm run build` - Creates optimized production build
- `npm start` - Runs production server on port 3005

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