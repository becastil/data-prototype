# Bulk Apply Feature - Test Plan

## Overview
This document outlines test cases for the "Apply Forward" monthly settings feature in the Data Dashboard.

## Test Cases

### 1. Basic Functionality Tests

#### Test 1.1: Apply Fees to 6 Months with OVERWRITE
**Setup:**
- Start Month: 2025-07
- Duration: 6 months
- Components: Fees only
- Policy: OVERWRITE
- Fees: Admin Fee ($25 PEPM), TPA Fee ($15 PEPM), Stop Loss ($5000 Monthly)

**Expected Result:**
- Months 2025-07 through 2025-12 should all have the same fee configuration
- Any existing fees in those months should be replaced
- PMPM/PEPM calculations should use month-specific enrollment data

#### Test 1.2: Apply Budget to 12 Months with FILL_BLANKS_ONLY
**Setup:**
- Start Month: 2025-01
- Duration: 12 months  
- Components: Budget only
- Policy: FILL_BLANKS_ONLY
- Budget: $250,000 Monthly

**Expected Result:**
- Only months without existing budget values should be filled
- Months with existing budgets remain unchanged

### 2. Cross-Year Boundary Tests

#### Test 2.1: Apply Settings Across Year Boundary
**Setup:**
- Start Month: 2025-10
- End Month: 2026-03
- Components: All (Fees, Budget, Stop Loss, Rebates)
- Policy: OVERWRITE

**Expected Result:**
- Correctly handles transition from 2025 to 2026
- All 6 months (Oct 2025 - Mar 2026) receive settings

### 3. Conflict Resolution Tests

#### Test 3.1: ADDITIVE Policy with Existing Fees
**Setup:**
- Existing: Admin Fee $20 PEPM in month 2025-08
- Apply: Admin Fee $10 PEPM to 2025-08
- Policy: ADDITIVE

**Expected Result:**
- Month 2025-08 should have Admin Fee = $30 PEPM (20 + 10)
- Other fee types should be added as new rows

#### Test 3.2: Label Collision Handling
**Setup:**
- Multiple fees with same label
- Different conflict policies

**Expected Result:**
- OVERWRITE: Replace by label
- ADDITIVE: Combine amounts or add new row
- FILL_BLANKS_ONLY: Skip if any fee exists

### 4. PMPM/PEPM Calculation Tests

#### Test 4.1: Variable Enrollment Across Months
**Setup:**
- Fee: $50 PMPM
- Month 2025-07: 1000 members
- Month 2025-08: 1100 members
- Month 2025-09: 950 members

**Expected Result:**
- 2025-07: $50,000 total
- 2025-08: $55,000 total
- 2025-09: $47,500 total

#### Test 4.2: Missing Enrollment Data
**Setup:**
- Apply PMPM fees to months without enrollment data
- MissingMonthStrategy: CREATE

**Expected Result:**
- Warning displayed for missing enrollment
- Month created with fees but $0 calculated totals
- User notified to add enrollment data

### 5. Validation Tests

#### Test 5.1: Invalid Date Range
**Setup:**
- End Month before Start Month
- Duration = 0 or negative

**Expected Result:**
- Validation error displayed
- Preview button disabled
- Clear error message

#### Test 5.2: No Components Selected
**Setup:**
- All component checkboxes unchecked

**Expected Result:**
- Validation error: "At least one component must be selected"
- Cannot proceed to preview

### 6. Edge Cases

#### Test 6.1: Maximum Duration (60 months)
**Setup:**
- Start: 2025-01
- Duration: 60 months

**Expected Result:**
- Correctly expands to 2029-12
- Performance remains acceptable
- All months properly updated

#### Test 6.2: Negative Values
**Setup:**
- Rebates: -$5000 (credit)
- Stop Loss: -$2000 (adjustment)

**Expected Result:**
- Negative values properly handled
- Calculations remain correct
- Display shows negative appropriately

### 7. UI/UX Tests

#### Test 7.1: Preview Display
**Expected Behavior:**
- Shows all affected months
- Displays enrollment counts per month
- Highlights changes with blue background
- Shows warnings with yellow indicators
- Diff view shows +/- changes

#### Test 7.2: Modal Interactions
**Expected Behavior:**
- ESC key closes modal
- Cancel returns to configuration without changes
- Apply button disabled when no changes
- Loading state during processing

### 8. Integration Tests

#### Test 8.1: Apply → Save → Reload
**Steps:**
1. Apply bulk settings
2. Save configuration
3. Reload page

**Expected Result:**
- Applied settings persist
- Audit log maintained
- No data loss

#### Test 8.2: Concurrent Updates
**Setup:**
- Apply bulk settings
- Manually edit individual month
- Apply bulk settings again

**Expected Result:**
- Conflict policy correctly handles overlaps
- No data corruption
- Consistent state

## Acceptance Criteria Verification

### Scenario A: Basic 6-Month Application
**Given:** Start=2025-07, Duration=6, Components=Fees+Budget, Policy=OVERWRITE
**When:** User applies settings
**Then:** 
- Months 2025-07 through 2025-12 all receive current fee set
- Previous fees in 2025-09 are replaced (not appended)
- Audit log records the operation

### Scenario B: Fill Blanks Only
**Given:** Start=2025-10, Duration=12, Components=Rebates, Policy=FILL_BLANKS_ONLY  
**When:** User applies settings
**Then:**
- Only months with null rebates in 2025-10 through 2026-09 are filled
- Existing rebate values remain unchanged

### Scenario C: Additive Fees
**Given:** Start=2025-11, Duration=12, Components=Fees, Policy=ADDITIVE
**When:** User applies settings  
**Then:**
- New fee rows are added to each month
- Monthly totals reflect both new and existing fees
- No fees are removed or replaced

## Performance Benchmarks

- Preview generation: < 500ms for 12 months
- Apply operation: < 1s for 60 months
- UI remains responsive during operations
- Memory usage stable with large datasets

## Browser Compatibility

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Accessibility Testing

- Keyboard navigation works throughout modal
- Screen reader announces all changes
- Focus management correct
- Color contrast meets WCAG AA standards