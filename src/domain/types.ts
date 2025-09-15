export type Money = number;

export interface BudgetRow {
  month: string; // Canonical YYYY-MM month identifier
  sourceMonthLabel: string; // Original label captured from the CSV for display/debugging
  budget: Money | null;
  medicalClaims: Money | null;
  pharmacyClaims: Money | null;
  adminFees: Money | null;
  stopLossPremium: Money | null;
  stopLossReimbursements: Money | null;
  rxRebates: Money | null;
  inpatient: Money | null;
  outpatient: Money | null;
  professional: Money | null;
  emergency: Money | null;
  domesticClaims: Money | null;
  nonDomesticClaims: Money | null;
  netPaid: Money | null;
  netCost: Money | null;
  variance: Money | null;
  variancePercent: number | null;
  lossRatio: number | null;
  employeeCount: number | null;
  memberCount: number | null;
  totalEnrollment: number | null;
  createdAt: string | null; // ISO date (YYYY-MM-DD)
  updatedAt: string | null; // ISO date (YYYY-MM-DD)
}

export interface ClaimsRow {
  claimId: string;
  claimantNumber: string | null;
  memberId: string | null;
  serviceDate: string; // ISO date (YYYY-MM-DD)
  serviceMonth: string; // Derived YYYY-MM key for aggregation
  paidDate: string | null;
  status: string | null;
  serviceType: string | null;
  providerId: string | null;
  diagnosisCode: string | null;
  diagnosisDescription: string | null;
  laymanTerm: string | null;
  medicalAmount: Money | null;
  pharmacyAmount: Money | null;
  totalAmount: Money | null;
  domesticFlag: boolean | null;
  planTypeId: string | null;
  diagnosisCategory: string | null;
  hccCode: string | null;
  riskScore: number | null;
  createdAt: string | null; // ISO date (YYYY-MM-DD)
  updatedAt: string | null; // ISO date (YYYY-MM-DD)
}

export type RateBasis = 'PMPM' | 'PEPM' | 'Monthly' | 'Annual';

export interface FeeItem {
  id: string;
  label: string;
  amount: Money;
  basis: RateBasis;
}

export interface FeesConfig {
  fees: FeeItem[];
  budgetOverride?: {
    amount: Money;
    basis: RateBasis;
  };
  stopLossReimb?: Money;
  rebates?: Money;
  perMonth?: Record<string, {
    fees?: Partial<Record<string, {
      amount: Money;
      basis: RateBasis;
    }>>;
    budgetOverride?: {
      amount: Money;
      basis: RateBasis;
    };
    stopLossReimb?: Money;
    rebates?: Money;
  }>;
}

export interface NormalizedRow {
  month: string;
  budget: Money | null;
  totalCost: Money | null;
  medicalClaims: Money | null;
  pharmacyClaims: Money | null;
  adminFees: Money | null;
  stopLossPremium: Money | null;
  stopLossReimbursements: Money | null;
  rxRebates: Money | null;
  members: number | null;
  employees: number | null;
  totalEnrollment: number | null;
  netPaid: Money | null;
}

export interface KPIMetrics {
  percentOfBudget: number | null;
  totalBudget: Money;
  totalPlanCost: Money;
  surplusOrDeficit: Money;
  planCostPMPM: number | null;
  planCostPEPM: number | null;
  netPaidPEPM: number | null;
  netPaidPMPM: number | null;
  members: number;
  employees: number;
}
