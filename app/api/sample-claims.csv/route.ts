import { NextRequest, NextResponse } from 'next/server';

/**
 * CSV Template API - Sample Claims Data Template
 * Provides downloadable CSV template for detailed claims data uploads
 */
export async function GET(request: NextRequest) {
  try {
    // Sample detailed claims CSV template with healthcare-specific columns
    const csvContent = `Claimant Number,Service Type,ICD-10-CM Code,Medical,Rx,Total,Medical Description,Layman's Term
C001234,Inpatient,I25.10,4500,0,4500,Atherosclerotic heart disease,Heart disease
C001235,Outpatient,Z00.00,250,45,295,Encounter for general adult medical examination,Annual checkup
C001236,Pharmacy,N/A,0,125,125,N/A,Prescription medication
C001237,Emergency,S72.001A,8500,75,8575,Fracture of unspecified part of neck of right femur,Broken hip
C001238,Outpatient,E11.9,180,220,400,Type 2 diabetes mellitus without complications,Diabetes checkup
C001239,Inpatient,J44.1,3200,150,3350,Chronic obstructive pulmonary disease with acute exacerbation,COPD flare-up
C001240,Outpatient,M79.89,320,0,320,Other specified soft tissue disorders,Muscle pain
C001241,Pharmacy,N/A,0,85,85,N/A,Blood pressure medication
C001242,Emergency,R50.9,1200,25,1225,Fever unspecified,High fever
C001243,Outpatient,H52.4,150,0,150,Presbyopia,Reading glasses exam`;

    // Set appropriate headers for CSV download
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', 'attachment; filename="sample-claims-template.csv"');
    headers.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    return new NextResponse(csvContent, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Sample claims CSV generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate sample claims template' },
      { status: 500 }
    );
  }
}