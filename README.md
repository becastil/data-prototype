# Data Dashboard

A Next.js application displaying sales and revenue analytics with interactive charts.

## Features

- Interactive bar chart visualization showing monthly sales and revenue data
- Built with Next.js 15.5.0 and React 19.1.0
- Responsive design with Tailwind CSS
- Uses Recharts for data visualization
- Clean, centered layout optimized for data presentation

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

## Development

The main chart component is located in `app/page.tsx`. The application uses:

- **Next.js** with Turbopack for fast development builds
- **Tailwind CSS** for styling
- **Recharts** for chart components
- **TypeScript** for type safety

## Available Scripts

- `npm run dev` - Starts the development server on port 3005
- `npm run build` - Creates an optimized production build
- `npm start` - Runs the production server on port 3005

## Project Structure

```
data-prototype/
├── app/
│   ├── page.tsx       # Main dashboard page with chart
│   ├── layout.tsx     # Root layout component
│   └── globals.css    # Global styles
├── public/            # Static assets
├── package.json       # Dependencies and scripts
└── next.config.ts     # Next.js configuration
```

## Deployment

This Next.js app can be deployed to various platforms:

- [Vercel](https://vercel.com) (recommended for Next.js apps)
- [Netlify](https://netlify.com)
- Any Node.js hosting service

For production deployment, run:
```bash
npm run build
npm start
```

## License

This project is open source and available for educational purposes.