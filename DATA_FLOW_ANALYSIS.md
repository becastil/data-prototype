# Healthcare Analytics Dashboard - Data Flow Analysis

## Current Monolithic Architecture (36KB page.tsx)

### State Management (14 state variables)
```typescript
// Core Data States
const [budgetData, setBudgetData] = useState<ParsedCSVData | null>(null);
const [claimsData, setClaimsData] = useState<ParsedCSVData | null>(null);
const [feesConfig, setFeesConfig] = useState<FeesConfig | null>(null);

// UI Control States  
const [showDashboard, setShowDashboard] = useState(false);
const [currentPage, setCurrentPage] = useState<string>('dashboard');
const [showFeesForm, setShowFeesForm] = useState(false);
const [dateRange, setDateRange] = useState<DateRangeSelection>({ preset: '12M' });

// Loading & Error States
const [isLoading, setIsLoading] = useState(false);
const [showSuccess, setShowSuccess] = useState(false); 
const [error, setError] = useState<string>('');

// Interface States
const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
const [isDarkMode, setIsDarkMode] = useState(false);
const [emergencyMode, setEmergencyMode] = useState(false);
const [debugMode, setDebugMode] = useState(false);
```

## Data Processing Pipeline

### 1. Data Ingestion Flow
```
DualCSVLoader → handleBothFilesLoaded() → Validation → State Update → Secure Token Issuance
```

**Key Functions:**
- `handleBothFilesLoaded(budget, claims)` - Main data processor
- `persistSecureRecord('dashboardData', payload)` - Server-issued encrypted record + token
- Data validation and error handling with timeouts

### 2. Data Transformation Pipeline  
```
Raw CSV Data → normalizeMonthKey() → effectiveBudget (useMemo) → Filtered Data → Component Props
```

**Core Transformations:**
- **Month normalization**: `normalizeMonthKey()` - Standardizes date formats
- **Numeric parsing**: `num()` helper - Handles currency and numeric conversion
- **Fee calculations**: `monthlyFromBasis()` - PMPM/PEPM/Annual/Monthly calculations
- **Budget computation**: Applies fee configs with month-specific overrides

### 3. Computed Data Dependencies

#### effectiveBudget (Complex useMemo)
**Inputs:** 
- `filteredBudget` (filtered by date range)
- `feesConfig` (fee configuration state)

**Processing:**
- Applies monthly fee configurations
- Calculates basis-adjusted amounts (PMPM/PEPM/Annual/Monthly)
- Computes healthcare metrics:
  - Medical Claims + Pharmacy Claims = Total Claims
  - Fixed Costs (Admin + TPA + Stop Loss)
  - Net Cost = Total Expenses - Total Revenues
  - Variance = Budget - Net Cost
  - Variance % for performance tracking

**Output Fields Added:**
```typescript
{
  'Fixed Costs': totalFixedCosts,
  'Admin Fees': adminFees,
  'TPA Fee': tpaFees, 
  'Stop Loss Premium': stopLossPremium,
  'Total Expenses': totalExpenses,
  'Total Revenues': totalRevenues,
  'Net Cost': netCost,
  'Variance': variance,
  'Variance %': variancePercent,
  // ... plus computed versions for fallback
}
```

#### filteredClaims  
**Input:** `claimsData.rows`
**Processing:** `filterRowsByRange()` with `dateRange`
**Output:** Date-filtered claims data

## Component Communication Patterns

### Data Flow to Components

#### 1. DualCSVLoader (Upload Phase)
```typescript
<DualCSVLoader
  onBothFilesLoaded={handleBothFilesLoaded}  // Main data callback
  onError={handleError}                      // Error handling
/>
```

#### 2. FeesConfigurator (Configuration Phase)
```typescript
<FeesConfigurator
  initialData={effectiveBudget}             // Computed budget data
  onConfigUpdate={setFeesConfig}            // Fee config callback
  onComplete={() => setShowDashboard(true)} // Transition trigger
/>
```

#### 3. FinancialDataTable (Analytics Phase)
```typescript
<FinancialDataTable 
  budgetData={effectiveBudget}              // Processed budget
  claimsData={filteredClaims}               // Filtered claims
/>
```

#### 4. KPITiles (Dashboard Metrics)
```typescript
<KPITiles 
  metrics={{
    pctOfBudget: complexCalculation(),      // Aggregated metrics
    totalBudget: effectiveBudget.reduce(), // Sum operations
    totalPlanCost: complexAggregation(),   // Multi-field calculations
    // ... 8 complex derived metrics
  }}
  period={dateRange.preset}                // Period label
/>
```

#### 5. PlanPerformanceTiles (Visualizations)
```typescript
<PlanPerformanceTiles 
  data={effectiveBudget}                   // Full processed dataset
  commentaryTitle="Keenan Reporting Dashboard"
/>
```

### Shared Utilities (Used Across Components)

#### Data Processing Utilities
- `num(value)` - Numeric parsing with currency handling
- `normalizeMonthKey(value)` - Date format standardization  
- `parseNumericValue()` - Imported utility for robust parsing
- `filterRowsByRange()` - Date range filtering

#### Healthcare Calculation Logic
- `monthlyFromBasis()` - PMPM/PEPM/Annual conversion
- Fee aggregation logic for Admin, TPA, Stop Loss
- Variance and percentage calculations

## Page Navigation State Machine

### State Flow
```
Initial → Upload → FeesConfig → Dashboard → Page Views
  ↓         ↓          ↓          ↓          ↓
 Load    Process    Configure   Display   Navigate
```

### Page States
- `!showDashboard && !showFeesForm` → DualCSVLoader
- `!showDashboard && showFeesForm` → FeesConfigurator  
- `showDashboard && currentPage === 'table'` → FinancialDataTable
- `showDashboard && currentPage === 'report'` → KPITiles + PlanPerformanceTiles

## Performance Critical Data Operations

### Heavy Computations (Performance Bottlenecks)
1. **effectiveBudget useMemo** - 150+ line calculation per row
2. **KPITiles metrics** - 8 complex aggregations with reduce operations
3. **Monthly fee basis calculations** - Per-row PMPM/PEPM math
4. **Data filtering** - Date range operations on large datasets

### Memory Usage Patterns
- **Raw CSV storage** - Duplicated in budgetData + claimsData states
- **Computed data caching** - effectiveBudget memoization
- **Secure storage** - Additional memory for HIPAA compliance
- **Component render data** - Props passed to multiple children

## Data Dependencies for Component Splitting

### Critical Interfaces Needed

#### 1. DataUploader Component Interface
```typescript
interface DataUploaderProps {
  onDataLoaded: (budget: ParsedCSVData, claims: ParsedCSVData) => void;
  onError: (error: string) => void;
  onLoadingChange: (loading: boolean) => void;
}
```

#### 2. ReportGenerator Component Interface  
```typescript
interface ReportGeneratorProps {
  budgetData: ParsedCSVData['rows'];
  claimsData: ParsedCSVData['rows']; 
  feesConfig: FeesConfig | null;
  dateRange: DateRangeSelection;
  currentPage: string;
  onPageChange: (page: string) => void;
}
```

#### 3. DashboardLayout Component Interface
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onThemeToggle: () => void;
  onExport: () => void;
  dateRange: DateRangeSelection;
  onDateRangeChange: (range: DateRangeSelection) => void;
}
```

## Refactoring Recommendations

### Priority 1: Extract Data Processing
- Move `effectiveBudget` logic to dedicated service
- Create `HealthcareCalculationsService` for reusable math
- Implement data transformation layer

### Priority 2: Split UI State
- Separate upload state from dashboard state  
- Create page-specific state containers
- Implement state persistence layer

### Priority 3: Component Decomposition
- Extract 5 focused components per refactoring plan
- Implement lazy loading for non-critical components
- Add error boundaries for isolated failures

### Priority 4: Performance Optimization
- Implement React virtualization for large datasets
- Add data pagination for 10,000+ records
- Optimize memoization strategy

---
*Generated during Healthcare Analytics Dashboard Refactoring - Phase 1*