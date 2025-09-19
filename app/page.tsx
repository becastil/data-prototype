'use client';
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable unicorn/no-array-reduce */
/* eslint-disable complexity */

import process from 'node:process';
import React, {Suspense, useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import {motion, AnimatePresence} from 'framer-motion';
import {
	EChartsEnterpriseChart,
	HCCDataTable,
	LazyChartWrapper,
} from '@components/charts/LazyCharts';
import VirtualizedFinancialDataTable from '@components/data/VirtualizedFinancialDataTable';
import PerformanceMonitor from '@components/PerformanceMonitor';
import {GlassCard} from '@components/ui/glass-card';
import PlanPerformanceTiles from '@components/dashboard/PlanPerformanceTiles';
import KPITiles from '@components/dashboard/KPITiles';
import DataUploader from '@components/dashboard/DataUploader';
import {LottieLoader} from '@components/ui/lottie-loader';
import {TabsContent} from '@components/ui/tabs';
import {type ParsedCSVData} from '@components/loaders/CSVLoader';
import {Bell, Users, DollarSign, TrendingUp, Activity} from 'lucide-react';
import CommandPalette from '@components/navigation/CommandPalette';
import KeyboardShortcuts from '@components/navigation/KeyboardShortcuts';
import {AccessibleErrorBoundary} from '@components/accessibility/AccessibilityEnhancements';
import GooeyFilter from '@components/loaders/GooeyFilter';
import MotionCard from '@components/MotionCard';
import {type FeesConfig} from '@components/forms/FeesConfigurator';
import {parseNumericValue} from '@utils/chartDataProcessors';
import DashboardLayout from '@components/dashboard/DashboardLayout';
import {Dashboard} from './components/ui/dashboard.js';
import {useAutoAnimateCards} from '@/app/hooks/useAutoAnimate.js';
import {retrieveSanitizedRecord, revokeSecureRecord} from '@/app/lib/phi-client.js';
import {
        type DateRangeSelection,
        filterRowsByRange,
} from '@/app/utils/dateRange.js';

// Development-only logging utility
const isDevelopment = process.env.NODE_ENV === 'development';
const developmentLog = (...arguments_: unknown[]) => {
        if (isDevelopment) {
                console.log(...arguments_);
        }
};
const developmentError = (...arguments_: unknown[]) => {
        if (isDevelopment) {
                console.error(...arguments_);
        }
};
const developmentWarn = (...arguments_: unknown[]) => {
        if (isDevelopment) {
                console.warn(...arguments_);
        }
};

// Helper function for numeric parsing
const number_ = (value: unknown): number => {
        if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
        if (value === null || value === undefined) return 0;
        const n = Number.parseFloat(String(value).replaceAll(/[$,\s]/g, ''));
        return Number.isFinite(n) ? n : 0;
};

const toNumericInput = (value: unknown): string | number | null | undefined => {
        if (
                typeof value === 'string' ||
                typeof value === 'number' ||
                value === undefined ||
                value === null
        ) {
                return value;
        }

        return String(value);
};

const pickNumericValue = (
        row: Record<string, unknown>,
        keys: string[],
): number => {
        for (const key of keys) {
                if (!(key in row)) {
                        continue;
                }

                const raw = row[key];
                if (raw === undefined || raw === null) {
                        continue;
                }

                if (typeof raw === 'string' && raw.trim() === '') {
                        continue;
                }

                return parseNumericValue(toNumericInput(raw));
        }

        return 0;
};

const normalizeMonthKey = (value: unknown): string | undefined => {
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		const year = value.getUTCFullYear();
		const month = value.getUTCMonth() + 1;
		return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`;
	}

        if (typeof value !== 'string') return undefined;
        const trimmed = value.trim();
        if (!trimmed) return undefined;

	const yM = /^(\d{4})[-/]?(\d{1,2})$/.exec(trimmed);
	if (yM) {
		const year = Number.parseInt(yM[1], 10);
		const month = Number.parseInt(yM[2], 10);
		if (month >= 1 && month <= 12) {
			return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`;
		}
	}

	const mY = /^([01]?\d)[-/](\d{4})$/.exec(trimmed);
	if (mY) {
		const month = Number.parseInt(mY[1], 10);
		const year = Number.parseInt(mY[2], 10);
		if (month >= 1 && month <= 12) {
			return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`;
		}
	}

	const ymd = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(trimmed);
	if (ymd) {
		const year = Number.parseInt(ymd[1], 10);
		const month = Number.parseInt(ymd[2], 10);
		if (month >= 1 && month <= 12) {
			return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`;
		}
	}

	const monthText = /^([A-Za-z]{3,9})\s+(\d{4})$/.exec(trimmed);
	if (monthText) {
		const parsed = new Date(`${monthText[1]} 1, ${monthText[2]}`);
		if (!Number.isNaN(parsed.getTime())) {
			return `${parsed.getUTCFullYear().toString().padStart(4, '0')}-${(
				parsed.getUTCMonth() + 1
			)
				.toString()
				.padStart(2, '0')}`;
		}
	}

	const parsed = new Date(trimmed);
	if (!Number.isNaN(parsed.getTime())) {
		return `${parsed.getUTCFullYear().toString().padStart(4, '0')}-${(
			parsed.getUTCMonth() + 1
		)
			.toString()
			.padStart(2, '0')}`;
	}

        return undefined;
};

const Home: React.FC = () => {
	const chartsGridReference = useAutoAnimateCards<HTMLDivElement>();
        const [showDashboard, setShowDashboard] = useState(false);
        const [budgetData, setBudgetData] = useState<ParsedCSVData | undefined>(undefined);
        const [claimsData, setClaimsData] = useState<ParsedCSVData | undefined>(undefined);
	const [error, setError] = useState<string>('');
	const [currentPage, setCurrentPage] = useState<string>('dashboard');
	const [showSuccess, setShowSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
	const [isDarkMode, setIsDarkMode] = useState(false);
	const [dateRange, setDateRange] = useState<DateRangeSelection>({
		preset: '12M',
	});
	const [emergencyMode, setEmergencyMode] = useState(false);
	const [debugMode, setDebugMode] = useState(false);
        const [feesConfig, setFeesConfig] = useState<FeesConfig | undefined>(undefined);

	// HIPAA-aligned hydration: use in-memory token reference (no PHI in localStorage)
	useEffect(() => {
		let active = true;

		const hydrate = async () => {
			try {
				const saved = await retrieveSanitizedRecord<{
					budgetData?: ParsedCSVData;
					claimsData?: ParsedCSVData;
				}>('dashboardData');
				if (!saved?.sanitized || !active) return;
				if (saved.sanitized.budgetData && saved.sanitized.claimsData) {
					setBudgetData(saved.sanitized.budgetData);
					setClaimsData(saved.sanitized.claimsData);
					setShowDashboard(true);
				}
			} catch (error) {
				developmentError('Secure token hydration failed', error);
			}
		};

		void hydrate();

		return () => {
			active = false;
		};
	}, []);

	const handleDataLoaded = (budget: ParsedCSVData, claims: ParsedCSVData) => {
		setBudgetData(budget);
		setClaimsData(claims);
		setShowDashboard(true);
	};

	const handleDataError = (errorMessage: string) => {
		setError(errorMessage);
		developmentError(errorMessage);
	};

        const handleReset = () => {
                setShowDashboard(false);
                setBudgetData(undefined);
                setClaimsData(undefined);
                setError('');
                void revokeSecureRecord('dashboardData');
                void revokeSecureRecord('dashboardFees');
        };

	const handleFeesConfigured = (config: FeesConfig) => {
		setFeesConfig(config);
	};

	const handleLoadingChange = (loading: boolean) => {
		setIsLoading(loading);
	};

	// Advanced component handlers
	const handleThemeToggle = () => {
		setIsDarkMode(!isDarkMode);
		document.documentElement.dataset.theme = isDarkMode ? 'light' : 'dark';
	};

	const handleExport = (format: string) => {
		developmentLog(`Exporting data as ${format}`);
		// Implementation would depend on the selected format
	};

	const handleNavigate = (page: string) => {
		setCurrentPage(page);
	};

	// Build ordered month labels from budget data
	const monthsTimeline: string[] = (budgetData?.rows || []).map(
		(r: Record<string, string>) =>
			String(r.month || r.Month || r.period || r.Period || ''),
	);

	// Filtered datasets by selected range
	const filteredBudget = filterRowsByRange(
		budgetData?.rows || [],
		monthsTimeline,
		dateRange,
	);

	// Apply computed overrides from fees form when present
	const effectiveBudget = React.useMemo(() => {
		if (!feesConfig) return filteredBudget;

		const monthlyFromBasis = (
			amount: number,
			basis: string,
			employees: number,
			members: number,
		) => {
			switch (basis) {
				case 'PMPM': {
					return amount * Math.max(0, Math.floor(members));
				}

				case 'PEPM': {
					return amount * Math.max(0, Math.floor(employees));
				}

				case 'Annual': {
					return amount / 12;
				}

				case 'Monthly':
				default: {
					return amount;
				}
			}
		};

		const rows = (filteredBudget || []) as Array<Record<string, unknown>>;
		developmentLog(
			'[EFFECTIVE BUDGET] Processing rows with feesConfig:',
			feesConfig,
		);
		developmentLog(
			'[EFFECTIVE BUDGET] First row field names:',
			Object.keys(rows[0] || {}),
		);

		return rows.map((row) => {
                        const rowEmployees = pickNumericValue(row, [
                                'Employee Count',
                                'Employees',
                        ]);
                        const rowMembers = pickNumericValue(row, [
                                'Member Count',
                                'Enrollment',
                                'Total Enrollment',
                        ]);

			const rawMonth =
				row['month'] ||
				row['Month'] ||
				row['period'] ||
				row['Period'] ||
				row['Month Label'] ||
				row['Period Label'];
			const monthKey = normalizeMonthKey(rawMonth);
			const monthOverrides = monthKey
				? feesConfig.perMonth?.[monthKey]
				: undefined;
			const feeOverrides = monthOverrides?.fees || {};

			const effectiveFeeEntries = (feesConfig.fees || []).map((fee) => {
				const override = feeOverrides?.[fee.id];
				const merged = override ? {...fee, ...override} : fee;
				const monthlyAmount = monthlyFromBasis(
					merged.amount || 0,
					merged.basis as string,
					rowEmployees,
					rowMembers,
				);
				return {fee: merged, monthlyAmount};
			});

			const totalFixedCosts = effectiveFeeEntries.reduce(
				(sum, entry) => sum + entry.monthlyAmount,
				0,
			);
			const findMonthlyFeeAmount = (predicate: (label: string) => boolean) => {
				const entry = effectiveFeeEntries.find(({fee}) =>
					predicate(fee.label.toLowerCase()),
				);
				return entry ? entry.monthlyAmount : 0;
			};

			const adminFees = findMonthlyFeeAmount((label) =>
				label.includes('admin'),
			);
			const tpaFees = findMonthlyFeeAmount((label) => label.includes('tpa'));
			const stopLossPremium = findMonthlyFeeAmount((label) =>
				label.includes('stop loss'),
			);

			const fallbackBudget = number_(
				row['Budget'] ?? row['Computed Budget'] ?? row['budget'] ?? 0,
			);
			const budgetSource =
				monthOverrides?.budgetOverride ?? feesConfig.budgetOverride;
			const budget = budgetSource
				? monthlyFromBasis(
						budgetSource.amount || 0,
						budgetSource.basis,
						rowEmployees,
						rowMembers,
					)
				: fallbackBudget;

			const fallbackStopLossReimb = number_(
				row['Stop Loss Reimbursements'] ??
					row['Computed Stop Loss Reimb'] ??
					row['stop_loss_reimb'] ??
					0,
			);
			const stopLossReimb =
				monthOverrides?.stopLossReimb ??
				feesConfig.stopLossReimb ??
				fallbackStopLossReimb;

			const fallbackRebates = number_(
				row['Rx Rebates'] ??
					row['Computed Rebates'] ??
					row['pharmacy_rebates'] ??
					0,
			);
			const rebates =
				monthOverrides?.rebates ?? feesConfig.rebates ?? fallbackRebates;

                        const medicalClaims = pickNumericValue(row, [
                                'medicalClaims',
                                'Medical Claims',
                                'medical_claims',
                                'Medical',
                                'medical',
                                'Med Claims',
                        ]);

                        const pharmacyClaims = pickNumericValue(row, [
                                'rxClaims',
                                'Pharmacy Claims',
                                'pharmacy_claims',
                                'Rx Claims',
                                'Pharmacy',
                                'pharmacy',
                                'Rx',
                                'rx',
                        ]);

			developmentLog(
				'[CLAIMS DATA]',
				row['month'] || row['Month'],
				'Medical:',
				medicalClaims,
				'Pharmacy:',
				pharmacyClaims,
			);

			const totalExpenses = medicalClaims + pharmacyClaims + totalFixedCosts;
			const totalRevenues = stopLossReimb + rebates;
			const netCost = totalExpenses - totalRevenues;
			const variance = budget - netCost;
			const variancePercent = budget > 0 ? (variance / budget) * 100 : 0;

			return {
				...row,
				'Fixed Costs': totalFixedCosts,
				'Admin Fees': adminFees,
				'TPA Fee': tpaFees,
				'Stop Loss Premium': stopLossPremium,
				Budget: budget,
				'Stop Loss Reimbursements': stopLossReimb,
                                'Rx Rebates': rebates,
                                'pharmacy_rebates': rebates,
				'Total Expenses': totalExpenses,
				'Total Revenues': totalRevenues,
				'Net Cost': netCost,
				Variance: variance,
				'Variance %': variancePercent,
				'Medical Claims': medicalClaims,
                                'Pharmacy Claims': pharmacyClaims,
                                'medical_claims': medicalClaims,
                                'pharmacy_claims': pharmacyClaims,
				'Computed Fixed Cost': totalFixedCosts,
				'Computed Budget': budget,
				'Computed Stop Loss Reimb': stopLossReimb,
				'Computed Rebates': rebates,
			};
		});
	}, [filteredBudget, feesConfig]);
	const filteredClaims = filterRowsByRange(
		claimsData?.rows || [],
		monthsTimeline,
		dateRange,
	);

	return (
		<>
			{emergencyMode && (
				<div className="fixed top-0 inset-x-0 z-50 bg-red-600 text-white text-center py-2 text-sm">
					Emergency Mode Active
				</div>
			)}
			<GooeyFilter />
			<AnimatePresence mode="wait">
				{showDashboard ? (
					<Suspense
						fallback={
							<div className="p-8 text-[var(--foreground-muted)]">
								Loading analytics...
							</div>
						}
					>
						<AccessibleErrorBoundary>
							<DashboardLayout
								currentPage={currentPage}
								onPageChange={setCurrentPage}
								onThemeToggle={handleThemeToggle}
								onExport={handleExport}
								dateRange={dateRange}
								onDateRangeChange={setDateRange}
								debugMode={debugMode}
								emergencyMode={emergencyMode}
								monthsTimeline={monthsTimeline}
								budgetData={budgetData}
								claimsData={claimsData}
								onReset={handleReset}
								onDebugToggle={() => {
									setDebugMode(!debugMode);
								}}
							>
								{/* Page Content */}
								<AnimatePresence mode="wait">
									{currentPage === 'table' || currentPage === 'dashboard' ? (
										<motion.div
											key="table-page"
											initial={{opacity: 0, x: -20}}
											animate={{opacity: 1, x: 0}}
											exit={{opacity: 0, x: 20}}
											transition={{duration: 0.3}}
										>
											<VirtualizedFinancialDataTable
												budgetData={effectiveBudget}
												claimsData={filteredClaims}
											/>
										</motion.div>
									) : currentPage === 'report' ? (
										<motion.div
											key="report-page"
											initial={{opacity: 0, x: 20}}
											animate={{opacity: 1, x: 0}}
											exit={{opacity: 0, x: -20}}
											transition={{duration: 0.3}}
											className="space-y-6"
										>
											{/* KPI Tiles - Top Level Metrics */}
											<KPITiles
												metrics={{
													pctOfBudget: (() => {
														const totalBudget = effectiveBudget.reduce(
															(sum, r) =>
																sum +
																number_(r.Budget || r['Computed Budget'] || 0),
															0,
														);
														const totalCost = effectiveBudget.reduce(
															(sum, r) => {
																const medical = number_(
																	r['Medical Claims'] || r.medical_claims || 0,
																);
																const pharmacy = number_(
																	r['Pharmacy Claims'] ||
																		r.pharmacy_claims ||
																		0,
																);
																const admin = number_(
																	r['Admin Fees'] || r.admin_fees || 0,
																);
																const stopLoss = number_(
																	r['Stop Loss Premium'] ||
																		r.stop_loss_premium ||
																		0,
																);
																const reimb = number_(
																	r['Stop Loss Reimbursements'] ||
																		r.stop_loss_reimb ||
																		0,
																);
																const rebates = number_(
																	r['Rx Rebates'] || r.pharmacy_rebates || 0,
																);
																return (
																	sum +
																	medical +
																	pharmacy +
																	admin +
																	stopLoss -
																	reimb -
																	rebates
																);
															},
															0,
														);
														return totalBudget > 0
															? (totalCost / totalBudget) * 100
															: 0;
													})(),
													totalBudget: effectiveBudget.reduce(
														(sum, r) =>
															sum +
															number_(r.Budget || r['Computed Budget'] || 0),
														0,
													),
													totalPlanCost: effectiveBudget.reduce((sum, r) => {
														const medical = number_(
															r['Medical Claims'] || r.medical_claims || 0,
														);
														const pharmacy = number_(
															r['Pharmacy Claims'] || r.pharmacy_claims || 0,
														);
														const admin = number_(
															r['Admin Fees'] || r.admin_fees || 0,
														);
														const stopLoss = number_(
															r['Stop Loss Premium'] ||
																r.stop_loss_premium ||
																0,
														);
														const reimb = number_(
															r['Stop Loss Reimbursements'] ||
																r.stop_loss_reimb ||
																0,
														);
														const rebates = number_(
															r['Rx Rebates'] || r.pharmacy_rebates || 0,
														);
														return (
															sum +
															medical +
															pharmacy +
															admin +
															stopLoss -
															reimb -
															rebates
														);
													}, 0),
													surplus: (() => {
														const totalBudget = effectiveBudget.reduce(
															(sum, r) =>
																sum +
																number_(r.Budget || r['Computed Budget'] || 0),
															0,
														);
														const totalCost = effectiveBudget.reduce(
															(sum, r) => {
																const medical = number_(
																	r['Medical Claims'] || r.medical_claims || 0,
																);
																const pharmacy = number_(
																	r['Pharmacy Claims'] ||
																		r.pharmacy_claims ||
																		0,
																);
																const admin = number_(
																	r['Admin Fees'] || r.admin_fees || 0,
																);
																const stopLoss = number_(
																	r['Stop Loss Premium'] ||
																		r.stop_loss_premium ||
																		0,
																);
																const reimb = number_(
																	r['Stop Loss Reimbursements'] ||
																		r.stop_loss_reimb ||
																		0,
																);
																const rebates = number_(
																	r['Rx Rebates'] || r.pharmacy_rebates || 0,
																);
																return (
																	sum +
																	medical +
																	pharmacy +
																	admin +
																	stopLoss -
																	reimb -
																	rebates
																);
															},
															0,
														);
														return totalBudget - totalCost;
													})(),
													planCostPEPM: (() => {
														const totalMembers = effectiveBudget.reduce(
															(sum, r) =>
																sum +
																number_(
																	r['Member Count'] ||
																		r.Enrollment ||
																		r.members ||
																		0,
																),
															0,
														);
														const totalCost = effectiveBudget.reduce(
															(sum, r) => {
																const medical = number_(
																	r['Medical Claims'] || r.medical_claims || 0,
																);
																const pharmacy = number_(
																	r['Pharmacy Claims'] ||
																		r.pharmacy_claims ||
																		0,
																);
																const admin = number_(
																	r['Admin Fees'] || r.admin_fees || 0,
																);
																const stopLoss = number_(
																	r['Stop Loss Premium'] ||
																		r.stop_loss_premium ||
																		0,
																);
																const reimb = number_(
																	r['Stop Loss Reimbursements'] ||
																		r.stop_loss_reimb ||
																		0,
																);
																const rebates = number_(
																	r['Rx Rebates'] || r.pharmacy_rebates || 0,
																);
																return (
																	sum +
																	medical +
																	pharmacy +
																	admin +
																	stopLoss -
																	reimb -
																	rebates
																);
															},
															0,
														);
														return totalMembers > 0
															? totalCost / totalMembers
															: 0;
													})(),
													budgetPEPM: (() => {
														const totalMembers = effectiveBudget.reduce(
															(sum, r) =>
																sum +
																number_(
																	r['Member Count'] ||
																		r.Enrollment ||
																		r.members ||
																		0,
																),
															0,
														);
														const totalBudget = effectiveBudget.reduce(
															(sum, r) =>
																sum +
																number_(r.Budget || r['Computed Budget'] || 0),
															0,
														);
														return totalMembers > 0
															? totalBudget / totalMembers
															: 0;
													})(),
													netPaidPEPM: (() => {
														const totalMembers = effectiveBudget.reduce(
															(sum, r) =>
																sum +
																number_(
																	r['Member Count'] ||
																		r.Enrollment ||
																		r.members ||
																		0,
																),
															0,
														);
														const netPaid = effectiveBudget.reduce((sum, r) => {
															const medical = number_(
																r['Medical Claims'] || r.medical_claims || 0,
															);
															const pharmacy = number_(
																r['Pharmacy Claims'] || r.pharmacy_claims || 0,
															);
															const reimb = number_(
																r['Stop Loss Reimbursements'] ||
																	r.stop_loss_reimb ||
																	0,
															);
															const rebates = number_(
																r['Rx Rebates'] || r.pharmacy_rebates || 0,
															);
															return sum + medical + pharmacy - reimb - rebates;
														}, 0);
														return totalMembers > 0
															? netPaid / totalMembers
															: 0;
													})(),
													members: effectiveBudget.reduce(
														(sum, r) =>
															sum +
															number_(
																r['Member Count'] ||
																	r.Enrollment ||
																	r.members ||
																	0,
															),
														0,
													),
												}}
												period={
													dateRange.preset === '12M'
														? 'Rolling 12 Months'
														: dateRange.preset || 'Custom Period'
												}
											/>

											{/* Plan Performance Tiles - Comprehensive Visualizations */}
											<PlanPerformanceTiles
												data={effectiveBudget}
												claims={filteredClaims}
												commentaryTitle="Keenan Reporting Dashboard"
											/>
										</motion.div>
									) : (
										<motion.div
											key="default-page"
											initial={{opacity: 0}}
											animate={{opacity: 1}}
											className="flex items-center justify-center h-96"
										>
											<p className="text-[var(--foreground-muted)]">
												Select a page from the sidebar
											</p>
										</motion.div>
									)}
								</AnimatePresence>
							</DashboardLayout>
						</AccessibleErrorBoundary>
					</Suspense>
				) : (
					<DataUploader
						onDataLoaded={handleDataLoaded}
						onError={handleDataError}
						onLoadingChange={handleLoadingChange}
						onFeesConfigured={handleFeesConfigured}
					/>
				)}
			</AnimatePresence>
			{/* Performance Monitoring */}
			<PerformanceMonitor />

			{/* Command Palette - ⌘K Modern Treasury Pattern */}
			<CommandPalette
				isOpen={commandPaletteOpen}
				onOpenChange={setCommandPaletteOpen}
				onNavigate={handleNavigate}
				onExport={handleExport}
				onThemeToggle={handleThemeToggle}
			/>

			{/* Keyboard Shortcuts System */}
			<KeyboardShortcuts
				onNavigate={handleNavigate}
				onExport={handleExport}
				onThemeToggle={handleThemeToggle}
				onCommandPaletteOpen={() => {
					setCommandPaletteOpen(true);
				}}
				onEmergencyMode={() => {
					developmentLog(
						'[Shortcuts] Emergency mode activated via Ctrl/⌘+Shift+E',
					);
					setEmergencyMode(true);
					setTimeout(() => {
						setEmergencyMode(false);
					}, 4000);
				}}
				onPatientSearch={() => {
					developmentLog('[Shortcuts] Patient search invoked via Ctrl/⌘+P');
					setCommandPaletteOpen(true);
				}}
			/>
		</>
	);
};

export default Home;
