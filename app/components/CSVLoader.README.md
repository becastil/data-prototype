# CSVLoader Component

A professional, production-ready CSV file upload and preview component for Next.js applications with smooth Framer Motion animations.

## Features

- **Drag-and-Drop Upload**: Intuitive file upload with visual feedback
- **Click-to-Browse**: Alternative file selection method
- **File Validation**: Type checking, size limits, and format validation
- **CSV Parsing**: Robust parsing using PapaParse library
- **Data Preview**: Display first 5 rows with staggered animations
- **Error Handling**: Clear, actionable error messages
- **Responsive Design**: Works seamlessly on all screen sizes
- **TypeScript Support**: Full type safety and IntelliSense
- **Smooth Animations**: Professional Framer Motion transitions
- **Loading States**: Visual progress indicators
- **Accessibility**: Reduced motion preferences support

## Installation

```bash
npm install framer-motion papaparse lucide-react
npm install --save-dev @types/papaparse
```

## Basic Usage

```typescript
import { CSVLoader } from '@/app/components';
import type { ParsedCSVData } from '@/app/components';

export default function MyComponent() {
  const handleDataLoaded = (data: ParsedCSVData) => {
    console.log('CSV loaded:', data);
    // Process your data here
  };

  const handleError = (error: string) => {
    console.error('CSV error:', error);
    // Handle errors here
  };

  return (
    <CSVLoader
      onDataLoaded={handleDataLoaded}
      onError={handleError}
      maxFileSize={10 * 1024 * 1024} // 10MB
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onDataLoaded` | `(data: ParsedCSVData) => void` | Required | Callback when CSV is successfully loaded |
| `onError` | `(error: string) => void` | Required | Callback when an error occurs |
| `maxFileSize` | `number` | `10485760` (10MB) | Maximum file size in bytes |
| `className` | `string` | `''` | Additional CSS classes |

## ParsedCSVData Interface

```typescript
interface ParsedCSVData {
  headers: string[];              // Column headers
  rows: Record<string, string>[]; // Data rows as objects
  rawData: string;               // Original CSV content
  fileName: string;              // Name of uploaded file
  rowCount: number;              // Total number of data rows
}
```

## Animation Variants

The component uses several animation variants for different states:

### Drop Zone States
- `idle`: Default state
- `hover`: Mouse hover effect
- `active`: File being dragged over
- `success`: File successfully loaded
- `error`: Error occurred with shake animation

### Icon Animations
- Loading spinner rotation
- Success checkmark spring animation
- Error shake effect
- Hover scale effects

### Table Animations
- Staggered row entrance (0.05s delay per row)
- Smooth fade and slide transitions
- Hover highlighting

## Customization

### Styling

The component uses Tailwind CSS classes and can be customized with the `className` prop:

```typescript
<CSVLoader
  className="custom-wrapper-styles"
  // ... other props
/>
```

### Animation Speed

To adjust animation speeds, modify the transition durations in the variants:

```typescript
// Example: Slower animations
const customVariants = {
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,  // Increased delay
      duration: 0.5    // Longer duration
    }
  })
};
```

## Error Handling

The component handles various error scenarios:

1. **Invalid File Type**: Only .csv files accepted
2. **File Size Exceeded**: Configurable size limit
3. **Empty Files**: Detection and user notification
4. **Parse Errors**: Malformed CSV handling
5. **Encoding Issues**: UTF-8 encoding support

## Performance Considerations

- Transform-based animations for better performance
- Lazy loading of large files
- Efficient re-rendering with React hooks
- Preview limited to first 5 rows
- Debounced drag events

## Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- Respects `prefers-reduced-motion`
- High contrast mode compatible
- Focus states for keyboard users

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Advanced Usage

### Custom File Processing

```typescript
const handleDataLoaded = async (data: ParsedCSVData) => {
  // Custom validation
  if (data.headers.length < 3) {
    throw new Error('CSV must have at least 3 columns');
  }
  
  // Data transformation
  const transformed = data.rows.map(row => ({
    ...row,
    processed: true,
    timestamp: new Date().toISOString()
  }));
  
  // Send to API
  await fetch('/api/upload', {
    method: 'POST',
    body: JSON.stringify(transformed)
  });
};
```

### Integration with State Management

```typescript
import { useStore } from '@/store';

export default function DataImport() {
  const { setData, setLoading } = useStore();
  
  const handleDataLoaded = (data: ParsedCSVData) => {
    setLoading(true);
    setData(data.rows);
    setLoading(false);
  };
  
  return <CSVLoader onDataLoaded={handleDataLoaded} />;
}
```

## Testing

The component includes proper error boundaries and validation. For testing:

1. **Valid CSV**: Use the provided sample-data.csv
2. **Large Files**: Test with files > maxFileSize
3. **Invalid Format**: Try uploading .txt, .xlsx files
4. **Empty Files**: Test with 0-byte CSV files
5. **Malformed CSV**: Test with broken CSV structure

## Troubleshooting

### Common Issues

1. **Module not found errors**: Ensure all dependencies are installed
2. **Type errors**: Update TypeScript and type definitions
3. **Animation lag**: Check for performance bottlenecks in parent components
4. **File not uploading**: Verify file permissions and CORS settings

## License

This component is part of the data-prototype project and follows the project's licensing terms.