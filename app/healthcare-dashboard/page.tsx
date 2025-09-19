'use client';

import React, {useEffect, useMemo, useRef, useState} from 'react';
import Papa from 'papaparse';

type ChartOption = Record<string, unknown>;

type EchartsInstance = {
	setOption: (option: ChartOption) => void;
	dispose: () => void;
	resize: () => void;
	on: (event: string, handler: (parameters: any) => void) => void;
	off?: (event: string, handler: (parameters: any) => void) => void;
};

type EchartsGlobal = {
	init: (dom: HTMLDivElement) => EchartsInstance;
};

type WindowWithEcharts = Window & {
	echarts?: EchartsGlobal;
};

type ClaimRecord = {
	claimantNumber: string;
	serviceType: string;
	icdCode: string;
	medicalDescription: string;
	laymanTerm: string;
	medicalCost: number;
	rxCost: number;
	totalCost: number;
	month?: string;
	year?: string;
};

type BudgetRow = {
	month: string;
	medicalClaims: number;
	rxClaims: number;
	adminFees: number;
	stopLossFees: number;
	stopLossReimbursement: number;
	totalExpenses: number;
	budget: number;
};

type ConfigData = {
	adminFeesMonthly: number;
	stopLossMonthly: number;
	rxRebatesMonthly: number;
	budgetMonthly: number;
	stopLossThreshold: number;
	stopLossReimbursement: number;
	targetLossRatio: number;
};

type ServiceTypeDistribution = {
	name: string;
	value: number;
	medical: number;
	rx: number;
	count: number;
};

const defaultConfig: ConfigData = {
	adminFeesMonthly: 87_500,
	stopLossMonthly: 12_500,
	rxRebatesMonthly: 5000,
	budgetMonthly: 1_250_000,
	stopLossThreshold: 100_000,
	stopLossReimbursement: 90,
	targetLossRatio: 85,
};

const defaultClaimsData: ClaimRecord[] = [
	{
		claimantNumber: '1',
		serviceType: 'Inpatient',
		icdCode: 'I10',
		medicalDescription: 'Essential (primary) hypertension',
		laymanTerm: 'High blood pressure',
		medicalCost: 73_433,
		rxCost: 54_248,
		totalCost: 127_681,
	},
	{
		claimantNumber: '2',
		serviceType: 'Outpatient',
		icdCode: 'E11.9',
		medicalDescription: 'Type 2 diabetes mellitus without complications',
		laymanTerm: 'Type 2 diabetes',
		medicalCost: 77_599,
		rxCost: 95_690,
		totalCost: 173_289,
	},
	{
		claimantNumber: '3',
		serviceType: 'Emergency',
		icdCode: 'J06.9',
		medicalDescription: 'Acute upper respiratory infection unspecified',
		laymanTerm: 'Common cold',
		medicalCost: 81_390,
		rxCost: 55_942,
		totalCost: 137_332,
	},
	{
		claimantNumber: '4',
		serviceType: 'Pharmacy',
		icdCode: 'N39.0',
		medicalDescription: 'Urinary tract infection site not specified',
		laymanTerm: 'Bladder infection',
		medicalCost: 57_270,
		rxCost: 51_536,
		totalCost: 108_806,
	},
	{
		claimantNumber: '5',
		serviceType: 'Outpatient',
		icdCode: 'R07.9',
		medicalDescription: 'Chest pain, unspecified',
		laymanTerm: 'Chest pain',
		medicalCost: 90_201,
		rxCost: 79_294,
		totalCost: 169_495,
	},
	{
		claimantNumber: '6',
		serviceType: 'Inpatient',
		icdCode: 'J44.0',
		medicalDescription: 'COPD with acute lower respiratory infection',
		laymanTerm: 'Lung disease flare-up',
		medicalCost: 65_382,
		rxCost: 51_271,
		totalCost: 116_653,
	},
	{
		claimantNumber: '7',
		serviceType: 'Emergency',
		icdCode: 'K92.2',
		medicalDescription: 'Gastrointestinal hemorrhage, unspecified',
		laymanTerm: 'Stomach bleeding',
		medicalCost: 70_234,
		rxCost: 60_811,
		totalCost: 131_045,
	},
	{
		claimantNumber: '8',
		serviceType: 'Pharmacy',
		icdCode: 'M79.3',
		medicalDescription: 'Myalgia',
		laymanTerm: 'Muscle pain',
		medicalCost: 35_234,
		rxCost: 30_456,
		totalCost: 65_690,
	},
	{
		claimantNumber: '9',
		serviceType: 'Outpatient',
		icdCode: 'J44.1',
		medicalDescription: 'COPD with acute exacerbation',
		laymanTerm: 'Lung disease',
		medicalCost: 65_234,
		rxCost: 56_056,
		totalCost: 121_290,
	},
	{
		claimantNumber: '10',
		serviceType: 'Inpatient',
		icdCode: 'I50.9',
		medicalDescription: 'Heart failure, unspecified',
		laymanTerm: 'Heart failure',
		medicalCost: 108_567,
		rxCost: 93_822,
		totalCost: 202_389,
	},
];

const sumBy = <T,>(
	items: readonly T[],
	selector: (item: T) => number,
): number => {
	let total = 0;
	for (const item of items) {
		total += selector(item);
	}

	return total;
};

const formatCurrency = (value: number): string =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(Number.isFinite(value) ? value : 0);

const toNumber = (value: unknown, fallback = 0): number => {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number.parseFloat(value.replaceAll(/[$,\s]/g, ''));
		return Number.isFinite(parsed) ? parsed : fallback;
	}

	return fallback;
};

const toNonEmptyString = (value: unknown, fallback = ''): string => {
	if (value === null || value === undefined) {
		return fallback;
	}

	const text = String(value).trim();
	return text.length > 0 ? text : fallback;
};

const isClaimRecord = (claim: ClaimRecord | undefined): claim is ClaimRecord =>
	claim !== undefined && claim !== null;

const tabOrder = [
	'overview',
	'budget',
	'claims',
	'upload',
	'configuration',
] as const;

type TabKey = (typeof tabOrder)[number];

const HealthcareDashboardPage: React.FC = () => {
	const [activeTab, setActiveTab] = useState<TabKey>('overview');
	const [selectedServiceType, setSelectedServiceType] = useState<
		string | undefined
	>(null);
	const [echartsLoaded, setEchartsLoaded] = useState(false);
	const [uploadedData, setUploadedData] = useState<ClaimRecord[] | undefined>(
		null,
	);
	const [configData, setConfigData] = useState<ConfigData>(defaultConfig);
	const [uploadStatus, setUploadStatus] = useState<string | undefined>(null);
	const [uploadError, setUploadError] = useState<string | undefined>(null);

	const gaugeChartReference = useRef<HTMLDivElement | undefined>(null);
	const claimsDistributionReference = useRef<HTMLDivElement | undefined>(null);
	const budgetTrendReference = useRef<HTMLDivElement | undefined>(null);

	const claimsData = useMemo<ClaimRecord[]>(
		() => uploadedData ?? defaultClaimsData,
		[uploadedData],
	);

	const budgetData = useMemo<BudgetRow[]>(() => {
		const months = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec',
		];

		if (uploadedData?.some((claim) => toNonEmptyString(claim.month))) {
			return months.map((month) => {
				const monthlyClaims = uploadedData.filter(
					(claim) => toNonEmptyString(claim.month) === month,
				);
				const medicalClaims = sumBy(
					monthlyClaims,
					(claim) => claim.medicalCost,
				);
				const rxClaimsGross = sumBy(monthlyClaims, (claim) => claim.rxCost);
				const rxClaimsNet = Math.max(
					0,
					rxClaimsGross - configData.rxRebatesMonthly,
				);

				let stopLossReimbursement = 0;
				for (const claim of monthlyClaims) {
					if (claim.totalCost > configData.stopLossThreshold) {
						const excess = claim.totalCost - configData.stopLossThreshold;
						stopLossReimbursement +=
							excess * (configData.stopLossReimbursement / 100);
					}
				}

				const totalExpenses =
					medicalClaims +
					rxClaimsNet +
					configData.adminFeesMonthly * 12 +
					configData.stopLossMonthly * 12 -
					stopLossReimbursement;

				return {
					month,
					medicalClaims,
					rxClaims: rxClaimsNet,
					adminFees: configData.adminFeesMonthly * 12,
					stopLossFees: configData.stopLossMonthly * 12,
					stopLossReimbursement,
					totalExpenses,
					budget: configData.budgetMonthly,
				};
			});
		}

		return months.map((month) => {
			const variance = (Math.random() - 0.5) * 0.3;
			const baseMedical = 70_000 * (1 + variance);
			const baseRx = 65_000 * (1 + variance);
			const rxClaimsNet = Math.max(0, baseRx - configData.rxRebatesMonthly);

			const totalExpenses =
				baseMedical +
				baseRx +
				configData.adminFeesMonthly * 12 +
				configData.stopLossMonthly * 12;

			return {
				month,
				medicalClaims: Math.round(baseMedical),
				rxClaims: Math.round(rxClaimsNet),
				adminFees: configData.adminFeesMonthly * 12,
				stopLossFees: configData.stopLossMonthly * 12,
				stopLossReimbursement: 0,
				totalExpenses: Math.round(totalExpenses),
				budget: configData.budgetMonthly,
			};
		});
	}, [configData, uploadedData]);

	const claimsDistributionData = useMemo<ServiceTypeDistribution[]>(() => {
		const serviceMap = new Map<string, ServiceTypeDistribution>();

		for (const claim of claimsData) {
			const key = claim.serviceType || 'Other';
			const existing = serviceMap.get(key);

			if (existing) {
				existing.value += claim.totalCost;
				existing.medical += claim.medicalCost;
				existing.rx += claim.rxCost;
				existing.count += 1;
			} else {
				serviceMap.set(key, {
					name: key,
					value: claim.totalCost,
					medical: claim.medicalCost,
					rx: claim.rxCost,
					count: 1,
				});
			}
		}

		return [...serviceMap.values()];
	}, [claimsData]);

	const totalStats = useMemo(() => {
		const totalMedical = sumBy(claimsData, (claim) => claim.medicalCost);
		const totalRx = sumBy(claimsData, (claim) => claim.rxCost);
		const totalClaims = sumBy(claimsData, (claim) => claim.totalCost);
		const claimCount = claimsData.length;
		const averageClaim = claimCount > 0 ? totalClaims / claimCount : 0;
		let highestClaim = 0;
		for (const claim of claimsData) {
			if (claim.totalCost > highestClaim) {
				highestClaim = claim.totalCost;
			}
		}

		const highCostClaims = claimsData.filter(
			(claim) => claim.totalCost >= configData.stopLossThreshold,
		);
		const highCostTotal = sumBy(highCostClaims, (claim) => claim.totalCost);

		const totalBudget = sumBy(budgetData, (row) => row.budget);
		const totalExpenses = sumBy(budgetData, (row) => row.totalExpenses);
		const totalVariance = totalBudget - totalExpenses;
		const monthsOverBudget = budgetData.filter(
			(row) => row.totalExpenses > row.budget,
		).length;
		const averageMonthlyBudget =
			budgetData.length > 0 ? totalBudget / budgetData.length : 0;
		const averageMonthlyExpense =
			budgetData.length > 0 ? totalExpenses / budgetData.length : 0;
		const variancePercent =
			totalBudget > 0 ? ((totalExpenses - totalBudget) / totalBudget) * 100 : 0;

		return {
			claims: {
				totalMedical,
				totalRx,
				totalClaims,
				averageClaim,
				highestClaim,
				claimCount,
				highCostClaims: highCostClaims.length,
				highCostTotal,
			},
			budget: {
				totalBudget,
				totalExpenses,
				totalVariance,
				monthsOverBudget,
				averageMonthlyBudget,
				averageMonthlyExpense,
				variancePercent,
			},
		};
	}, [budgetData, claimsData, configData.stopLossThreshold]);

	useEffect(() => {
		if (typeof window === 'undefined' || echartsLoaded) {
			return;
		}

		const windowWithEcharts = window as WindowWithEcharts;
		if (!windowWithEcharts.echarts) {
			const script = document.createElement('script');
			script.src =
				'https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js';
			script.async = true;
			script.addEventListener('load', () => {
				setEchartsLoaded(true);
			});

			document.body.append(script);
			return () => {
				script.remove();
			};
		}

		setEchartsLoaded(true);
	}, [echartsLoaded]);

	useEffect(() => {
		if (!echartsLoaded) {
			return;
		}

		const windowWithEcharts = window as WindowWithEcharts;
		const {echarts} = windowWithEcharts;
		if (!echarts) {
			return;
		}

		const cleanups: Array<() => void> = [];

		if (gaugeChartReference.current && activeTab === 'overview') {
			const chart = echarts.init(gaugeChartReference.current);
			const budgetUtilization =
				totalStats.budget.totalBudget > 0
					? (totalStats.budget.totalExpenses / totalStats.budget.totalBudget) *
						100
					: 0;

			const gaugeOptions: ChartOption = {
				tooltip: {formatter: '{b}: {c}%'},
				series: [
					{
						name: 'Budget Utilization',
						type: 'gauge',
						radius: '90%',
						startAngle: 180,
						endAngle: 0,
						center: ['25%', '75%'],
						axisLine: {
							lineStyle: {
								width: 30,
								color: [
									[0.8, '#10B981'],
									[0.9, '#F59E0B'],
									[1, '#EF4444'],
								],
							},
						},
						pointer: {
							itemStyle: {color: 'auto'},
						},
						axisTick: {
							distance: -30,
							length: 8,
							lineStyle: {color: '#fff', width: 2},
						},
						splitLine: {
							distance: -30,
							length: 30,
							lineStyle: {color: '#fff', width: 4},
						},
						axisLabel: {
							color: 'auto',
							distance: 40,
							fontSize: 16,
						},
						detail: {
							valueAnimation: true,
							formatter: '{value}%',
							color: 'auto',
							fontSize: 24,
						},
						data: [
							{
								value: Number(budgetUtilization.toFixed(1)),
								name: 'Budget Used',
							},
						],
					},
					{
						name: 'Loss Ratio',
						type: 'gauge',
						radius: '90%',
						startAngle: 180,
						endAngle: 0,
						center: ['75%', '75%'],
						axisLine: {
							lineStyle: {
								width: 30,
								color: [
									[0.7, '#10B981'],
									[0.85, '#F59E0B'],
									[1, '#EF4444'],
								],
							},
						},
						pointer: {
							itemStyle: {color: 'auto'},
						},
						axisTick: {
							distance: -30,
							length: 8,
							lineStyle: {color: '#fff', width: 2},
						},
						splitLine: {
							distance: -30,
							length: 30,
							lineStyle: {color: '#fff', width: 4},
						},
						axisLabel: {
							color: 'auto',
							distance: 40,
							fontSize: 16,
						},
						detail: {
							valueAnimation: true,
							formatter: '{value}%',
							color: 'auto',
							fontSize: 24,
						},
						data: [
							{
								value:
									totalStats.budget.totalBudget > 0
										? Number(
												(
													(totalStats.claims.totalClaims /
														totalStats.budget.totalBudget) *
													100
												).toFixed(1),
											)
										: 0,
								name: 'Loss Ratio',
							},
						],
					},
				],
			};

			chart.setOption(gaugeOptions);
			const handleResize = () => {
				chart.resize();
			};

			window.addEventListener('resize', handleResize);
			cleanups.push(() => {
				window.removeEventListener('resize', handleResize);
				chart.dispose();
			});
		}

		if (
			claimsDistributionReference.current &&
			(activeTab === 'overview' || activeTab === 'claims')
		) {
			const chart = echarts.init(claimsDistributionReference.current);
			const pieOptions: ChartOption = {
				title: {
					text: 'Claims Distribution by Service Type',
					left: 'center',
				},
				tooltip: {
					trigger: 'item',
					formatter(parameters: {data: ServiceTypeDistribution}) {
						const {data} = parameters;
						return `
              <b>${data.name}</b><br/>
              Total: ${formatCurrency(data.value)}<br/>
              Medical: ${formatCurrency(data.medical)}<br/>
              Rx: ${formatCurrency(data.rx)}<br/>
              Claims: ${data.count}
            `;
					},
				},
				legend: {
					orient: 'vertical',
					left: 'left',
					top: 'middle',
				},
				series: [
					{
						name: 'Claims by Service',
						type: 'pie',
						radius: ['40%', '70%'],
						avoidLabelOverlap: false,
						itemStyle: {
							borderRadius: 10,
							borderColor: '#fff',
							borderWidth: 2,
						},
						label: {
							show: true,
							position: 'outside',
							formatter: '{b}: {d}%',
						},
						emphasis: {
							label: {
								show: true,
								fontSize: 16,
								fontWeight: 'bold',
							},
						},
						data: claimsDistributionData,
						color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
					},
				],
			};

			chart.setOption(pieOptions);
			const handleResize = () => {
				chart.resize();
			};

			const handleClick = (clickParameters: {name?: string}) => {
				if (clickParameters.name) {
					setSelectedServiceType(clickParameters.name);
					setActiveTab('claims');
				}
			};

			chart.on('click', handleClick);
			window.addEventListener('resize', handleResize);
			cleanups.push(() => {
				chart.off?.('click', handleClick);
				window.removeEventListener('resize', handleResize);
				chart.dispose();
			});
		}

		if (budgetTrendReference.current && activeTab === 'budget') {
			const chart = echarts.init(budgetTrendReference.current);
			const budgetOptions: ChartOption = {
				title: {
					text: 'Budget vs Actual Expenses Trend',
					left: 'center',
				},
				tooltip: {
					trigger: 'axis',
					axisPointer: {
						type: 'shadow',
					},
				},
				legend: {
					data: [
						'Budget',
						'Total Expenses',
						'Medical Claims',
						'Rx Claims (Net)',
					],
					bottom: 0,
				},
				grid: {
					left: '3%',
					right: '4%',
					bottom: '15%',
					containLabel: true,
				},
				xAxis: {
					type: 'category',
					data: budgetData.map((row) => row.month),
				},
				yAxis: {
					type: 'value',
					axisLabel: {
						formatter: (value: number) => `$${(value / 1000).toFixed(0)}K`,
					},
				},
				series: [
					{
						name: 'Budget',
						type: 'line',
						data: budgetData.map((row) => row.budget),
						lineStyle: {
							width: 3,
							type: 'dashed',
						},
						itemStyle: {
							color: '#10B981',
						},
					},
					{
						name: 'Total Expenses',
						type: 'line',
						data: budgetData.map((row) => row.totalExpenses),
						lineStyle: {
							width: 3,
						},
						itemStyle: {
							color: '#EF4444',
						},
					},
					{
						name: 'Medical Claims',
						type: 'bar',
						stack: 'claims',
						data: budgetData.map((row) => row.medicalClaims),
						itemStyle: {
							color: '#3B82F6',
						},
					},
					{
						name: 'Rx Claims (Net)',
						type: 'bar',
						stack: 'claims',
						data: budgetData.map((row) => row.rxClaims),
						itemStyle: {
							color: '#8B5CF6',
						},
					},
				],
			};

			chart.setOption(budgetOptions);
			const handleResize = () => {
				chart.resize();
			};

			window.addEventListener('resize', handleResize);
			cleanups.push(() => {
				window.removeEventListener('resize', handleResize);
				chart.dispose();
			});
		}

		return () => {
			for (const cleanup of cleanups) {
				cleanup();
			}
		};
	}, [
		activeTab,
		budgetData,
		claimsDistributionData,
		echartsLoaded,
		totalStats,
	]);

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];

		if (!file) {
			return;
		}

		Papa.parse<Record<string, unknown>>(file, {
			header: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			complete(results) {
				const processedData = results.data
					.map((row, index) => {
						const fallbackId = String(index + 1);
						const rowData: Record<string, unknown> = row ?? {};
						const getValue = (keys: readonly string[], fallback: unknown) => {
							for (const key of keys) {
								if (
									key in rowData &&
									rowData[key] !== undefined &&
									rowData[key] !== null &&
									rowData[key] !== ''
								) {
									return rowData[key];
								}
							}

							return fallback;
						};

						const medicalCost = toNumber(
							getValue(['Medical', 'MedicalClaims', 'MedicalCost'], 0),
						);
						const rxCost = toNumber(
							getValue(['Rx', 'RxClaims', 'Pharmacy', 'PharmacyCost'], 0),
						);
						const totalCost = toNumber(
							getValue(['Total', 'TotalCost'], medicalCost + rxCost),
						);

						const claim: ClaimRecord = {
							claimantNumber: toNonEmptyString(
								getValue(['ClaimantNumber', 'MemberID', 'ID'], fallbackId),
								fallbackId,
							),
							serviceType: toNonEmptyString(
								getValue(['ServiceType', 'Service', 'Type'], 'Outpatient'),
								'Outpatient',
							),
							icdCode: toNonEmptyString(
								getValue(['ICDCode', 'DiagnosisCode'], ''),
							),
							medicalDescription: toNonEmptyString(
								getValue(['MedicalDesc', 'Description', 'Diagnosis'], ''),
							),
							laymanTerm: toNonEmptyString(
								getValue(
									['LaymanTerm', 'Condition', 'MedicalDesc'],
									getValue(['Description', 'Diagnosis'], ''),
								),
							),
							medicalCost,
							rxCost,
							totalCost,
							month: toNonEmptyString(getValue(['Month', 'ServiceMonth'], '')),
							year: toNonEmptyString(getValue(['Year', 'ServiceYear'], '')),
						};

						return claim.totalCost > 0 ? claim : undefined;
					})
					.filter((claim): claim is ClaimRecord => isClaimRecord(claim));

				setUploadedData(processedData);
				setSelectedServiceType(null);
				setUploadStatus(
					`Successfully uploaded ${processedData.length} claims records!`,
				);
				setUploadError(null);
			},
			error(error_) {
				setUploadError(`Error parsing CSV: ${error_.message}`);
				setUploadStatus(null);
			},
		});

		event.target.value = '';
	};

	const handleConfigChange = (field: keyof ConfigData, value: string) => {
		setConfigData((previousConfig) => ({
			...previousConfig,
			[field]: toNumber(value, 0),
		}));
	};

	const filteredClaims = selectedServiceType
		? claimsData.filter((claim) => claim.serviceType === selectedServiceType)
		: claimsData;

	if (!echartsLoaded) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
					<p className="text-lg font-semibold text-gray-700">
						Loading Apache ECharts...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
			<div className="max-w-7xl mx-auto">
				<div className="bg-white rounded-xl shadow-xl p-6 mb-6">
					<div className="flex justify-between items-start mb-4">
						<div>
							<h1 className="text-3xl font-bold text-gray-800 mb-2">
								Healthcare Analytics Dashboard
							</h1>
							<p className="text-gray-600">
								Dynamic Data Analysis with Custom Configuration
							</p>
						</div>
						<div className="text-right">
							<p className="text-sm text-gray-500">Data Status</p>
							<p className="text-lg font-semibold text-gray-700">
								{uploadedData
									? `${uploadedData.length} Claims Loaded`
									: 'Using Sample Data'}
							</p>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
						<div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
							<p className="text-sm opacity-90">Total Claims</p>
							<p className="text-2xl font-bold">
								{formatCurrency(totalStats.claims.totalClaims)}
							</p>
							<p className="text-xs opacity-75 mt-1">
								{totalStats.claims.claimCount} processed
							</p>
						</div>
						<div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
							<p className="text-sm opacity-90">Budget Status</p>
							<p className="text-2xl font-bold">
								{formatCurrency(Math.abs(totalStats.budget.totalVariance))}
							</p>
							<p className="text-xs opacity-75 mt-1">
								{totalStats.budget.totalVariance >= 0 ? 'Under' : 'Over'} Budget
							</p>
						</div>
						<div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
							<p className="text-sm opacity-90">Avg Monthly Expense</p>
							<p className="text-2xl font-bold">
								{formatCurrency(totalStats.budget.averageMonthlyExpense)}
							</p>
							<p className="text-xs opacity-75 mt-1">
								Budget: {formatCurrency(totalStats.budget.averageMonthlyBudget)}
							</p>
						</div>
						<div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg p-4 text-white">
							<p className="text-sm opacity-90">Medical/Rx Split</p>
							<p className="text-2xl font-bold">
								{totalStats.claims.totalClaims > 0
									? `${((totalStats.claims.totalMedical / totalStats.claims.totalClaims) * 100).toFixed(1)}% / ${(
											(totalStats.claims.totalRx /
												totalStats.claims.totalClaims) *
											100
										).toFixed(1)}%`
									: 'N/A'}
							</p>
							<p className="text-xs opacity-75 mt-1">Medical vs Prescription</p>
						</div>
						<div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
							<p className="text-sm opacity-90">
								High Cost Claims (&gt;
								{formatCurrency(configData.stopLossThreshold)})
							</p>
							<p className="text-2xl font-bold">
								{totalStats.claims.highCostClaims} claims
							</p>
							<p className="text-xs opacity-75 mt-1">
								{totalStats.claims.totalClaims > 0
									? `${((totalStats.claims.highCostTotal / totalStats.claims.totalClaims) * 100).toFixed(1)}% of total`
									: 'N/A'}
							</p>
						</div>
					</div>

					<div className="flex space-x-4 border-b overflow-x-auto">
						{tabOrder.map((tab) => (
							<button
								key={tab}
								onClick={() => {
									setActiveTab(tab);
								}}
								className={`pb-2 px-4 font-medium transition-all duration-200 whitespace-nowrap ${
									tab === activeTab
										? 'border-b-2 border-blue-500 text-blue-600'
										: 'text-gray-600 hover:text-gray-800'
								}`}
							>
								{tab === 'upload'
									? 'Data Upload'
									: tab.charAt(0).toUpperCase() + tab.slice(1)}
							</button>
						))}
					</div>
				</div>

				{activeTab === 'overview' && (
					<div className="space-y-6">
						<div className="bg-white rounded-xl shadow-lg p-6">
							<div
								ref={gaugeChartReference}
								style={{width: '100%', height: '300px'}}
							/>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<div className="bg-white rounded-xl shadow-lg p-6">
								<div
									ref={claimsDistributionReference}
									style={{width: '100%', height: '400px'}}
								/>
							</div>
						</div>
					</div>
				)}

				{activeTab === 'budget' && (
					<div className="space-y-6">
						<div className="bg-white rounded-xl shadow-lg p-6">
							<div
								ref={budgetTrendReference}
								style={{width: '100%', height: '400px'}}
							/>
						</div>

						<div className="bg-white rounded-xl shadow-lg p-6">
							<h3 className="text-xl font-bold mb-4 text-center">
								Monthly Budget Performance
							</h3>
							<div className="overflow-x-auto">
								<table className="min-w-full">
									<thead>
										<tr className="border-b border-gray-200">
											<th className="text-left py-2 px-4 text-sm font-medium text-gray-700">
												Month
											</th>
											<th className="text-right py-2 px-4 text-sm font-medium text-gray-700">
												Budget
											</th>
											<th className="text-right py-2 px-4 text-sm font-medium text-gray-700">
												Actual
											</th>
											<th className="text-right py-2 px-4 text-sm font-medium text-gray-700">
												Variance
											</th>
										</tr>
									</thead>
									<tbody>
										{budgetData.map((monthRow, index) => {
											const variance = monthRow.budget - monthRow.totalExpenses;
											return (
												<tr
													key={`${monthRow.month}-${index}`}
													className="border-b border-gray-100 hover:bg-gray-50"
												>
													<td className="py-2 px-4 text-sm text-gray-900">
														{monthRow.month}
													</td>
													<td className="py-2 px-4 text-sm text-gray-900 text-right">
														{formatCurrency(monthRow.budget)}
													</td>
													<td className="py-2 px-4 text-sm text-gray-900 text-right">
														{formatCurrency(monthRow.totalExpenses)}
													</td>
													<td
														className={`py-2 px-4 text-sm font-semibold text-right ${
															variance >= 0 ? 'text-green-600' : 'text-red-600'
														}`}
													>
														{formatCurrency(Math.abs(variance))}
														<span className="text-xs ml-1">
															({variance >= 0 ? 'Under' : 'Over'})
														</span>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				)}

				{activeTab === 'claims' && (
					<div className="space-y-6">
						<div className="bg-white rounded-xl shadow-lg p-6">
							<div
								ref={claimsDistributionReference}
								style={{width: '100%', height: '400px'}}
							/>
						</div>

						<div className="bg-white rounded-xl shadow-lg p-6">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
								<h3 className="text-xl font-bold">Claims Detail</h3>
								{selectedServiceType ? (
									<div className="flex items-center gap-3">
										<span className="text-sm text-gray-600">
											Filtering by{' '}
											<span className="font-semibold text-gray-800">
												{selectedServiceType}
											</span>
										</span>
										<button
											type="button"
											onClick={() => {
												setSelectedServiceType(null);
											}}
											className="px-3 py-1 text-sm rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200"
										>
											Clear Filter
										</button>
									</div>
								) : null}
							</div>
							<div className="overflow-x-auto max-h-96">
								<table className="min-w-full">
									<thead className="sticky top-0 bg-white">
										<tr className="border-b border-gray-200">
											<th className="text-left py-2 px-4 text-sm font-medium text-gray-700">
												Claimant
											</th>
											<th className="text-left py-2 px-4 text-sm font-medium text-gray-700">
												Service Type
											</th>
											<th className="text-left py-2 px-4 text-sm font-medium text-gray-700">
												Condition
											</th>
											<th className="text-right py-2 px-4 text-sm font-medium text-gray-700">
												Medical
											</th>
											<th className="text-right py-2 px-4 text-sm font-medium text-gray-700">
												Rx
											</th>
											<th className="text-right py-2 px-4 text-sm font-medium text-gray-700">
												Total
											</th>
										</tr>
									</thead>
									<tbody>
										{filteredClaims.map((claim) => (
											<tr
												key={`${claim.claimantNumber}-${claim.serviceType}`}
												className={`border-b border-gray-100 hover:bg-gray-50 ${
													claim.totalCost >= configData.stopLossThreshold
														? 'bg-red-50'
														: ''
												}`}
											>
												<td className="py-2 px-4 text-sm text-gray-900">
													#{claim.claimantNumber}
												</td>
												<td className="py-2 px-4 text-sm text-gray-600">
													{claim.serviceType}
												</td>
												<td className="py-2 px-4 text-sm text-gray-600">
													{claim.laymanTerm || claim.medicalDescription}
												</td>
												<td className="py-2 px-4 text-sm text-gray-900 text-right">
													{formatCurrency(claim.medicalCost)}
												</td>
												<td className="py-2 px-4 text-sm text-gray-900 text-right">
													{formatCurrency(claim.rxCost)}
												</td>
												<td className="py-2 px-4 text-sm font-semibold text-gray-900 text-right">
													{formatCurrency(claim.totalCost)}
													{claim.totalCost >= configData.stopLossThreshold ? (
														<span className="ml-2 text-red-600 text-xs">
															High Cost
														</span>
													) : null}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				)}

				{activeTab === 'upload' && (
					<div className="bg-white rounded-xl shadow-lg p-8">
						<h2 className="text-2xl font-bold mb-6">Upload Claims Data</h2>

						<div className="mb-8">
							<div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
								<svg
									className="mx-auto h-12 w-12 text-gray-400 mb-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
									/>
								</svg>
								<p className="mb-2 text-gray-600">
									<span className="font-semibold">Click to upload</span> or drag
									and drop
								</p>
								<p className="text-xs text-gray-500 mb-4">CSV files only</p>
								<input
									type="file"
									accept=".csv"
									onChange={handleFileUpload}
									className="hidden"
									id="file-upload"
								/>
								<label
									htmlFor="file-upload"
									className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
								>
									Select CSV File
								</label>
							</div>
						</div>

						<div className="bg-gray-50 rounded-lg p-6 space-y-4">
							<div>
								<h3 className="font-semibold text-gray-700 mb-3">
									CSV Format Requirements:
								</h3>
								<p className="text-sm text-gray-600">
									Your CSV should include the following columns (flexible naming
									accepted):
								</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
								<div>
									<h4 className="font-medium text-gray-700 mb-2">
										Required Columns:
									</h4>
									<ul className="list-disc list-inside text-gray-600 space-y-1">
										<li>
											<span className="font-mono">ClaimantNumber</span> or{' '}
											<span className="font-mono">MemberID</span>
										</li>
										<li>
											<span className="font-mono">Medical</span> or{' '}
											<span className="font-mono">MedicalClaims</span>
										</li>
										<li>
											<span className="font-mono">Rx</span> or{' '}
											<span className="font-mono">Pharmacy</span>
										</li>
										<li>
											<span className="font-mono">Total</span> or{' '}
											<span className="font-mono">TotalCost</span>
										</li>
									</ul>
								</div>
								<div>
									<h4 className="font-medium text-gray-700 mb-2">
										Optional Columns:
									</h4>
									<ul className="list-disc list-inside text-gray-600 space-y-1">
										<li>
											<span className="font-mono">ServiceType</span> (Inpatient,
											Outpatient, etc.)
										</li>
										<li>
											<span className="font-mono">ICDCode</span> or{' '}
											<span className="font-mono">DiagnosisCode</span>
										</li>
										<li>
											<span className="font-mono">MedicalDesc</span> or{' '}
											<span className="font-mono">Description</span>
										</li>
										<li>
											<span className="font-mono">Month</span> and{' '}
											<span className="font-mono">Year</span>
										</li>
									</ul>
								</div>
							</div>

							<div className="p-4 bg-blue-50 rounded-md">
								<p className="text-sm text-blue-800">
									<strong>Tip:</strong> The system will attempt to auto-detect
									column names. If Total is not provided, it will be calculated
									as Medical + Rx.
								</p>
							</div>

							{uploadStatus ? (
								<div className="p-4 bg-green-50 rounded-md">
									<p className="text-sm text-green-800">{uploadStatus}</p>
								</div>
							) : null}

							{uploadError ? (
								<div className="p-4 bg-red-50 rounded-md">
									<p className="text-sm text-red-700">{uploadError}</p>
								</div>
							) : null}

							{uploadedData ? (
								<div className="p-4 bg-green-50 rounded-md">
									<p className="text-sm text-green-800">
										<strong>Success!</strong> {uploadedData.length} claims
										records loaded. Total claims value:{' '}
										{formatCurrency(
											sumBy(uploadedData, (claim) => claim.totalCost),
										)}
									</p>
								</div>
							) : null}
						</div>
					</div>
				)}

				{activeTab === 'configuration' && (
					<div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
						<h2 className="text-2xl font-bold">Configuration Settings</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-4">
								<h3 className="text-lg font-semibold text-gray-700 pb-2 border-b">
									Monthly Fees
								</h3>

								<div>
									<label
										className="block text-sm font-medium text-gray-700 mb-1"
										htmlFor="admin-fees"
									>
										Administrative Fees (Monthly)
									</label>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
											$
										</span>
										<input
											id="admin-fees"
											type="number"
											value={configData.adminFeesMonthly}
											onChange={(event) => {
												handleConfigChange(
													'adminFeesMonthly',
													event.target.value,
												);
											}}
											className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<p className="text-xs text-gray-500 mt-1">
										Annual: {formatCurrency(configData.adminFeesMonthly * 12)}
									</p>
								</div>

								<div>
									<label
										className="block text-sm font-medium text-gray-700 mb-1"
										htmlFor="stop-loss-premium"
									>
										Stop Loss Premium (Monthly)
									</label>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
											$
										</span>
										<input
											id="stop-loss-premium"
											type="number"
											value={configData.stopLossMonthly}
											onChange={(event) => {
												handleConfigChange(
													'stopLossMonthly',
													event.target.value,
												);
											}}
											className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<p className="text-xs text-gray-500 mt-1">
										Annual: {formatCurrency(configData.stopLossMonthly * 12)}
									</p>
								</div>

								<div>
									<label
										className="block text-sm font-medium text-gray-700 mb-1"
										htmlFor="rx-rebates"
									>
										Rx Rebates (Monthly)
									</label>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
											$
										</span>
										<input
											id="rx-rebates"
											type="number"
											value={configData.rxRebatesMonthly}
											onChange={(event) => {
												handleConfigChange(
													'rxRebatesMonthly',
													event.target.value,
												);
											}}
											className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<p className="text-xs text-gray-500 mt-1">
										Annual rebate:{' '}
										{formatCurrency(configData.rxRebatesMonthly * 12)}
									</p>
								</div>
							</div>

							<div className="space-y-4">
								<h3 className="text-lg font-semibold text-gray-700 pb-2 border-b">
									Budget &amp; Stop Loss
								</h3>

								<div>
									<label
										className="block text-sm font-medium text-gray-700 mb-1"
										htmlFor="monthly-budget"
									>
										Monthly Budget
									</label>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
											$
										</span>
										<input
											id="monthly-budget"
											type="number"
											value={configData.budgetMonthly}
											onChange={(event) => {
												handleConfigChange('budgetMonthly', event.target.value);
											}}
											className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<p className="text-xs text-gray-500 mt-1">
										Annual budget:{' '}
										{formatCurrency(configData.budgetMonthly * 12)}
									</p>
								</div>

								<div>
									<label
										className="block text-sm font-medium text-gray-700 mb-1"
										htmlFor="stop-loss-threshold"
									>
										Stop Loss Threshold (Per Claim)
									</label>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
											$
										</span>
										<input
											id="stop-loss-threshold"
											type="number"
											value={configData.stopLossThreshold}
											onChange={(event) => {
												handleConfigChange(
													'stopLossThreshold',
													event.target.value,
												);
											}}
											className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<p className="text-xs text-gray-500 mt-1">
										Claims above this amount trigger stop loss
									</p>
								</div>

								<div>
									<label
										className="block text-sm font-medium text-gray-700 mb-1"
										htmlFor="stop-loss-reimbursement"
									>
										Stop Loss Reimbursement Rate
									</label>
									<div className="relative">
										<input
											id="stop-loss-reimbursement"
											type="number"
											value={configData.stopLossReimbursement}
											onChange={(event) => {
												handleConfigChange(
													'stopLossReimbursement',
													event.target.value,
												);
											}}
											min="0"
											max="100"
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
										<span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
											%
										</span>
									</div>
									<p className="text-xs text-gray-500 mt-1">
										Percentage of excess claims reimbursed
									</p>
								</div>

								<div>
									<label
										className="block text-sm font-medium text-gray-700 mb-1"
										htmlFor="target-loss-ratio"
									>
										Target Loss Ratio
									</label>
									<div className="relative">
										<input
											id="target-loss-ratio"
											type="number"
											value={configData.targetLossRatio}
											onChange={(event) => {
												handleConfigChange(
													'targetLossRatio',
													event.target.value,
												);
											}}
											min="0"
											max="100"
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
										<span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
											%
										</span>
									</div>
									<p className="text-xs text-gray-500 mt-1">
										Target claims as percentage of budget
									</p>
								</div>
							</div>
						</div>

						<div className="p-6 bg-gray-50 rounded-lg space-y-4">
							<h3 className="font-semibold text-gray-700">
								Configuration Summary
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
								<div>
									<p className="text-gray-600">Annual Budget:</p>
									<p className="font-semibold text-gray-900">
										{formatCurrency(configData.budgetMonthly * 12)}
									</p>
								</div>
								<div>
									<p className="text-gray-600">
										Annual Admin + Stop Loss Fees:
									</p>
									<p className="font-semibold text-gray-900">
										{formatCurrency(
											(configData.adminFeesMonthly +
												configData.stopLossMonthly) *
												12,
										)}
									</p>
								</div>
								<div>
									<p className="text-gray-600">Annual Rx Rebates:</p>
									<p className="font-semibold text-gray-900">
										{formatCurrency(configData.rxRebatesMonthly * 12)}
									</p>
								</div>
							</div>

							<div className="p-4 bg-blue-50 rounded-md">
								<p className="text-sm text-blue-800">
									<strong>Note:</strong> Changes to configuration will
									automatically update all calculations and charts.
								</p>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default HealthcareDashboardPage;
