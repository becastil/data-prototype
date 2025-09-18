/* eslint-disable @typescript-eslint/naming-convention */

const claimsTemplateCsv = `Claimant Number,Service Type,ICD-10-CM Code,Medical,Pharmacy,Total,Medical Description,Layman's Term,Date of Service
C-10001,Professional,E11.9,825.5,134.25,959.75,Type 2 diabetes mellitus without complications,Diabetes (Type 2),2024-01-12
C-10002,Inpatient,I21.4,14325.9,0,14325.9,Non-ST elevation myocardial infarction,Heart attack (NSTEMI),2024-02-03
C-10003,Pharmacy,J45.40,0,312.8,312.8,Moderate persistent asthma without complication,Asthma flare,2024-02-17
C-10004,Outpatient,M54.5,425.0,68.4,493.4,Low back pain,Back pain visit,2024-03-08
`;

export function GET() {
	return new Response(claimsTemplateCsv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': 'attachment; filename="sample-claims.csv"',
			'Cache-Control': 'no-store',
		},
	});
}
