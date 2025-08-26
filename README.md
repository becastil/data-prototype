# Healthcare Budget Dashboard

A Next.js application for visualizing healthcare claims, expenses, and budget tracking with interactive charts.

## Features

- **Combined Chart Visualization**: Bar and line charts showing budget vs actual expenses
- **Healthcare Financial Data**: 24 months of claims and budget data (2025-2026)
- **Expense Categories**:
  - Medical Claims (Domestic & Non-Domestic)
  - Prescription (Rx) Claims
  - Administrative Fees
  - Stop Loss Fees
- **Budget Tracking**: Visual comparison of allocated budget vs actual expenses
- **Professional Styling**: Cream white theme with responsive design
- **Currency Formatting**: Proper USD formatting with tooltips
- Built with Next.js 15.5.0, React 19.1.0, and Recharts 3.1.2

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

The dashboard displays:
- **Stacked Bar Charts**: Shows breakdown of medical claims, Rx claims, admin fees, and stop loss fees
- **Budget Line (Red)**: Monthly allocated budget
- **Total Expenses Line (Green Dashed)**: Actual total monthly expenses
- **Time Period**: January 2025 through December 2026
- **Interactive Tooltips**: Hover to see detailed currency values

## Development

### Tech Stack

- **Next.js 15.5.0** with Turbopack for fast development
- **React 19.1.0** for UI components
- **Recharts 3.1.2** for data visualization
- **Tailwind CSS 4.x** for styling
- **TypeScript** for type safety

### Project Structure

```
data-prototype/
├── app/
│   ├── page.tsx       # Main dashboard with healthcare budget chart
│   ├── layout.tsx     # Root layout with metadata
│   └── globals.css    # Global styles with cream theme
├── public/            # Static assets
├── package.json       # Dependencies and scripts
├── next.config.ts     # Next.js configuration
└── README.md          # This file
```

### Available Scripts

- `npm run dev` - Starts development server on port 3005
- `npm run build` - Creates optimized production build
- `npm start` - Runs production server on port 3005

## Customization

### Updating Chart Data

Edit the `data` array in `app/page.tsx` to update the healthcare financial data:

```typescript
const data = [
  {
    month: "Jan '25",
    medicalClaims: 70330,
    rxClaims: 57561,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1267943,
    budget: 1229905,
  },
  // ... more months
];
```

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