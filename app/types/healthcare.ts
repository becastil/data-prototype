// Healthcare domain types
export interface ClaimData {
  claimId: string;
  claimantNumber: string;
  memberId: string;
  serviceDate: string;
  serviceType: ServiceType;
  providerId: string;
  icd10Code: string;
  medicalDescription: string;
  laymansTerm: string;
  medicalAmount: number;
  rxAmount: number;
  totalAmount: number;
  domesticFlag: boolean;
  planTypeId: number;
  status: ClaimStatus;
}

export interface BudgetData {
  month: string;
  budget: number;
  medicalClaims: number;
  rxClaims: number;
  inpatient: number;
  outpatient: number;
  professional: number;
  emergency: number;
  adminFees: number;
  stopLossPremium: number;
  stopLossReimbursement: number;
  rxRebates: number;
  wellnessPrograms: number;
  domesticClaims: number;
  nonDomesticClaims: number;
  employeeCount: number;
  dependentCount: number;
  retireeCount: number;
  totalEnrollment: number;
  lossRatio: number;
  netCost: number;
  variance: number;
  variancePercent: number;
}

export interface MemberData {
  memberId: string;
  claimantNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: 'M' | 'F';
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  employerGroupId: number;
  planTypeId: number;
  enrollmentDate: string;
  terminationDate?: string;
  memberType: MemberType;
  dependentCount: number;
  riskScore: number;
  chronicConditions: number;
  status: MemberStatus;
}

export interface ProviderData {
  providerId: string;
  providerName: string;
  providerType: ProviderType;
  specialty: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  inNetwork: boolean;
  qualityRating: number;
  avgCostIndex: number;
}

// Enums and Union Types
export type ServiceType =
  | 'Professional'
  | 'Outpatient'
  | 'Inpatient'
  | 'Emergency'
  | 'Pharmacy'
  | 'Lab'
  | 'Radiology'
  | 'Surgery'
  | 'Therapy'
  | 'Preventive'
  | 'Specialty'
  | 'Mental Health'
  | 'Dental'
  | 'Vision'
  | 'DME'
  | 'Home Health';

export type ClaimStatus = 'Paid' | 'Pending' | 'Denied';
export type MemberStatus = 'Active' | 'Terminated';
export type MemberType = 'Employee' | 'Dependent' | 'Retiree';
export type ProviderType = 'Hospital' | 'Clinic' | 'Physician' | 'Specialist' | 'Lab' | 'Pharmacy' | 'Urgent Care';

// Utility types for CSV processing
export interface CSVValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  rowCount?: number;
  columnCount?: number;
}

export interface ProcessedCSVData<T = Record<string, unknown>> {
  headers: string[];
  rows: T[];
  metadata: {
    filename: string;
    size: number;
    processedAt: Date;
    validationResult: CSVValidationResult;
  };
}