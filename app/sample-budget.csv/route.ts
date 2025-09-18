/* eslint-disable @typescript-eslint/naming-convention */

const templateCsv = `Month,Employee Count,Member Count,Medical Claims,Pharmacy Claims,Total Claims,Budget Target,Stop Loss Reimbursements
2024-01,450,820,445000,73000,518000,505000,12000
2024-02,452,824,432500,71000,503500,500000,9000
2024-03,455,828,458750,75250,534000,512000,15000
`;

export function GET() {
	return new Response(templateCsv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': 'attachment; filename="sample-budget.csv"',
			'Cache-Control': 'no-store',
		},
	});
}
