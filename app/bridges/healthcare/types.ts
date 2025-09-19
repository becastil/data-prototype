// Healthcare-specific types for board system integration
// Bridges existing healthcare data models with Trello-style boards

import {
	type Card,
	type Label,
	type Activity,
} from '@/app/features/boards/types.js';
import {type ParsedCSVData} from '@/app/components/loaders/CSVLoader';

// Healthcare data types (existing)
export type ClaimData = {
	claimId: string;
	memberId: string;
	providerId: string;
	serviceDate: string;
	amount: number;
	status: 'pending' | 'approved' | 'denied' | 'processing';
	serviceType: string;
	diagnosis?: string;
	procedure?: string;
	modifiers?: string[];
};

export type BudgetData = {
	period: string;
	month: string;
	employees: number;
	members: number;
	budget: number;
	actual?: number;
	variance?: number;
	category?: string;
};

export type MemberData = {
	memberId: string;
	firstName: string;
	lastName: string;
	dateOfBirth: string;
	gender: string;
	enrollmentDate: string;
	status: 'active' | 'inactive' | 'terminated';
	planType: string;
	riskScore?: number;
};

export type ProviderData = {
	providerId: string;
	name: string;
	specialty: string;
	networkStatus: 'in' | 'out';
	address: string;
	phone: string;
	npi?: string;
	credentials?: string[];
};

// Healthcare-specific card extensions
export type HealthcareCard = {
	// Data payload - one of these will be present
	claimData?: ClaimData;
	budgetData?: BudgetData;
	memberData?: MemberData;
	providerData?: ProviderData;

	// Healthcare-specific metadata
	healthcare: {
		type:
			| 'claim'
			| 'budget'
			| 'member'
			| 'provider'
			| 'authorization'
			| 'referral';

		// Compliance and audit
		phi: {
			containsPHI: boolean;
			maskedFields: string[];
			accessLevel: 'public' | 'restricted' | 'confidential';
		};

		// Clinical data
		diagnosis?: {
			primary: string;
			secondary?: string[];
			icd10?: string[];
		};

		// Financial data
		financial?: {
			claimAmount?: number;
			paidAmount?: number;
			memberResponsibility?: number;
			deductible?: number;
			copay?: number;
			coinsurance?: number;
		};

		// Workflow specific
		workflow?: {
			requiresAuthorization: boolean;
			authorizationNumber?: string;
			reviewLevel: 'none' | 'standard' | 'clinical' | 'medical_director';
			slaDeadline?: Date;
			escalationRules?: string[];
		};

		// Quality measures
		quality?: {
			hedisScore?: number;
			riskAdjustment?: number;
			outcomeMetrics?: Record<string, number>;
		};
	};
} & Card;

// Healthcare-specific labels
export type HealthcareLabel = {
	healthcare?: {
		category:
			| 'clinical'
			| 'financial'
			| 'administrative'
			| 'compliance'
			| 'quality';
		priority: boolean;
		automationTrigger?: boolean;
	};
} & Label;

// HIPAA compliance tracking
export type ComplianceCheck = {
	type: 'phi_scan' | 'access_audit' | 'encryption_verify' | 'data_retention';
	status: 'compliant' | 'warning' | 'violation';
	details: string;
	checkedAt: Date;
	checkedBy: string;
};

export type AuditLog = {
	hipaaEvent?: {
		eventType: 'access' | 'modify' | 'export' | 'delete' | 'share';
		phiInvolved: boolean;
		justification?: string;
		approvedBy?: string;
	};
} & Activity;

// Healthcare board configurations
export type HealthcareBoardTemplate = {
	id: string;
	name: string;
	description: string;

	// Pre-configured lists for healthcare workflows
	lists: Array<{
		title: string;
		position: number;
		automationRules?: any[];
		cardFilters?: {
			type?: string[];
			status?: string[];
			priority?: string[];
		};
	}>;

	// Healthcare-specific automation
	workflows: Array<{
		name: string;
		trigger: string;
		actions: string[];
		complianceRules: string[];
	}>;

	// Compliance settings
	compliance: {
		hipaaRequired: boolean;
		auditLevel: 'basic' | 'enhanced' | 'full';
		retentionPeriod: number; // Days
		encryptionRequired: boolean;
	};
};

// Common healthcare board templates
export const HEALTHCARE_BOARD_TEMPLATES = {
	CLAIMS_PROCESSING: 'claims_processing',
	BUDGET_MANAGEMENT: 'budget_management',
	MEMBER_ENROLLMENT: 'member_enrollment',
	PROVIDER_CREDENTIALING: 'provider_credentialing',
	QUALITY_MEASURES: 'quality_measures',
	COMPLIANCE_TRACKING: 'compliance_tracking',
} as const;

// Data transformation interfaces
export type HealthcareDataImport = {
	source: 'csv' | 'api' | 'database' | 'manual';
	type: 'claims' | 'budget' | 'member' | 'provider';
	data: ParsedCSVData;

	// Import configuration
	mapping: Array<{
		sourceField: string;
		targetField: string;
		transformation?: string;
	}>;

	// Board creation settings
	boardSettings: {
		title: string;
		template: string;
		autoCreateLists: boolean;
		groupByField?: string;
		sortByField?: string;
	};

	// Card creation rules
	cardRules: {
		titleTemplate: string;
		descriptionTemplate?: string;
		labelRules?: Array<{
			field: string;
			conditions: Array<{value: any; label: string}>;
		}>;
		assignmentRules?: Array<{
			field: string;
			conditions: Array<{value: any; assignee: string}>;
		}>;
	};
};

// Integration with secure server-issued tokens
export type SecureHealthcareCard = {
	securityToken?: string; // Reference to short-lived secure record token
	encryptedFields?: string[];
	accessLog?: Array<{
		userId: string;
		timestamp: Date;
		action: string;
		ipAddress?: string;
	}>;
} & HealthcareCard;

// Search specifically for healthcare data
export type HealthcareSearchFilters = {
	// Standard filters
	query?: string;
	dateRange?: {
		start: Date;
		end: Date;
	};

	// Healthcare-specific filters
	claimAmount?: {
		min?: number;
		max?: number;
	};

	diagnosis?: string[];
	serviceType?: string[];
	providerId?: string[];
	memberId?: string;

	// Compliance filters
	phiLevel?: 'public' | 'restricted' | 'confidential';
	complianceStatus?: 'compliant' | 'warning' | 'violation';

	// Financial filters
	budgetVariance?: {
		min?: number;
		max?: number;
	};

	// Quality filters
	riskScore?: {
		min?: number;
		max?: number;
	};
};

// Export formats for healthcare data
export type HealthcareExportOptions = {
	format: 'csv' | 'xlsx' | 'pdf' | 'json';
	includeCards: boolean;
	includeComments: boolean;
	includeActivity: boolean;

	// PHI handling
	maskPHI: boolean;
	includeAuditLog: boolean;

	// Data scope
	dateRange?: {
		start: Date;
		end: Date;
	};

	lists?: string[]; // List IDs to include

	// Compliance
	authorizedBy: string;
	exportReason: string;
	retentionPeriod?: number;
};

// Performance optimization for large healthcare datasets
export type HealthcareVirtualizationConfig = {
	cardBatchSize: number;
	lazyLoadThreshold: number;
	maxConcurrentCharts: number;
	prefetchDistance: number;

	// Healthcare-specific optimizations
	enablePHIMasking: boolean;
	cacheComplianceChecks: boolean;
	backgroundAuditProcessing: boolean;
};
