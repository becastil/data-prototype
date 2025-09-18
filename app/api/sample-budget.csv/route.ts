import { NextRequest, NextResponse } from 'next/server';

/**
 * CSV Template API - Sample Budget Data Template
 * Provides downloadable CSV template for budget/enrollment data uploads
 */
export async function GET(request: NextRequest) {
  try {
    // Sample budget CSV template with healthcare-specific columns
    const csvContent = `month,Employee Count,Member Count,Medical Claims,Pharmacy Claims,Budget,Stop Loss Reimbursements,Rx Rebates
2024-01,120,245,45000,12000,65000,2000,800
2024-02,122,248,48000,13500,65000,1500,850
2024-03,125,252,52000,14200,65000,3000,900
2024-04,127,255,38000,11800,65000,1200,750
2024-05,130,260,55000,15600,65000,4000,950
2024-06,132,265,49000,13200,65000,2500,800`;

    // Set appropriate headers for CSV download
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', 'attachment; filename="sample-budget-template.csv"');
    headers.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    return new NextResponse(csvContent, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Sample budget CSV generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate sample budget template' },
      { status: 500 }
    );
  }
}