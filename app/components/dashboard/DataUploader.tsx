'use client';

import process from 'node:process';
import React, {useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import FeesConfigurator, {
        type FeesConfig,
} from '@components/forms/FeesConfigurator';
import DualCSVLoader from '@components/loaders/DualCSVLoader';
import {type ParsedCSVData} from '@components/loaders/CSVLoader';
import {type DataUploaderProps} from '@components/shared/interfaces';
import {GlassCard} from '@components/ui/glass-card';
import {LottieLoader} from '@components/ui/lottie-loader';
import {parseNumericValue} from '@utils/chartDataProcessors';
import {persistSecureRecord} from '@/app/lib/phi-client.js';

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

const firstAvailableValue = (
        ...values: Array<string | number | null | undefined>
): string | number | undefined => {
        for (const value of values) {
                if (value === undefined || value === null) {
                        continue;
                }

                if (typeof value === 'string' && value.trim() === '') {
                        continue;
                }

                return value;
        }

        return undefined;
};

type DataUploaderState = {
        showFeesForm: boolean;
        isLoading: boolean;
        showSuccess: boolean;
        error: string;
        budgetData: ParsedCSVData | undefined;
        claimsData: ParsedCSVData | undefined;
};

const DataUploader: React.FC<DataUploaderProps> = ({
	onDataLoaded,
	onError,
	onLoadingChange,
	onFeesConfigured,
}) => {
	const [state, setState] = useState<DataUploaderState>({
		showFeesForm: false,
		isLoading: false,
		showSuccess: false,
		error: '',
                budgetData: undefined,
                claimsData: undefined,
        });

        // Refs for timeout cleanup
        const timeoutReferences = useRef<{
                loadingTimeout: ReturnType<typeof setTimeout> | undefined;
                successTimeout: ReturnType<typeof setTimeout> | undefined;
        }>({
                loadingTimeout: undefined,
                successTimeout: undefined,
        });

	// Cleanup timeouts on unmount
	useEffect(() => {
		return () => {
			if (timeoutReferences.current.loadingTimeout) {
				clearTimeout(timeoutReferences.current.loadingTimeout);
			}

			if (timeoutReferences.current.successTimeout) {
				clearTimeout(timeoutReferences.current.successTimeout);
			}
		};
	}, []);

	// Update parent loading state when internal loading changes
	useEffect(() => {
		onLoadingChange(state.isLoading);
	}, [state.isLoading, onLoadingChange]);

	// Update parent error state when internal error changes
	useEffect(() => {
		if (state.error) {
			onError(state.error);
		}
	}, [state.error, onError]);

	const handleBothFilesLoaded = (
		budget: ParsedCSVData,
		claims: ParsedCSVData,
	) => {
		developmentLog('[CSV FLOW] handleBothFilesLoaded called with:', {
			budgetHeaders: budget?.headers,
			budgetRows: budget?.rowCount,
			claimsHeaders: claims?.headers,
			claimsRows: claims?.rowCount,
		});

		try {
			setState((previous) => ({...previous, isLoading: true, error: ''}));

			// Clear any existing timeouts
			if (timeoutReferences.current.loadingTimeout) {
				clearTimeout(timeoutReferences.current.loadingTimeout);
			}

			if (timeoutReferences.current.successTimeout) {
				clearTimeout(timeoutReferences.current.successTimeout);
			}

			timeoutReferences.current.loadingTimeout = setTimeout(async () => {
				try {
					developmentLog('[CSV FLOW] Processing data for dashboard...');

					// Validate data before setting state
					if (!budget?.rows || budget.rows.length === 0) {
						throw new Error('Budget data is empty or invalid');
					}

					if (!claims?.rows || claims.rows.length === 0) {
						throw new Error('Claims data is empty or invalid');
					}

					developmentLog('[CSV FLOW] Setting budget data...');
					developmentLog('[CSV FLOW] Setting claims data...');

					let sanitizedBudget = budget;
					let sanitizedClaims = claims;

					try {
						developmentLog(
							'[SecureTokenFlow] Persisting dataset via secure token flow...',
						);
						const persisted = await persistSecureRecord(
							'dashboardData',
							{
								budgetData: budget,
								claimsData: claims,
								savedAt: new Date().toISOString(),
							},
							{
								ttlSeconds: 60 * 60,
								metadata: {source: 'DataUploader'},
							},
						);
						if (
							persisted?.sanitized?.budgetData &&
							persisted?.sanitized?.claimsData
						) {
							sanitizedBudget = persisted.sanitized.budgetData;
							sanitizedClaims = persisted.sanitized.claimsData;
						}

						developmentLog(
							'[SecureTokenFlow] Token issued with expiry:',
							persisted.expiresAt,
						);
					} catch (storageError) {
						developmentWarn(
							'[SecureTokenFlow] Token persistence failed (non-critical):',
							storageError,
						);
					}

					setState((previous) => ({
						...previous,
						budgetData: sanitizedBudget,
						claimsData: sanitizedClaims,
					}));

					setState((previous) => ({
						...previous,
						isLoading: false,
						showSuccess: true,
					}));
					developmentLog('[CSV FLOW] Success animation started');

					timeoutReferences.current.successTimeout = setTimeout(() => {
						try {
							developmentLog(
								'[CSV FLOW] Transitioning to fees configuration view...',
							);
							setState((previous) => ({
								...previous,
								showFeesForm: true,
								showSuccess: false,
								error: '',
							}));
							developmentLog('[CSV FLOW] Dashboard transition complete');
							timeoutReferences.current.successTimeout = null;
						} catch (transitionError) {
							developmentError(
								'[CSV FLOW] Dashboard transition failed:',
								transitionError,
							);
							setState((previous) => ({
								...previous,
								error: `Dashboard transition failed: ${transitionError instanceof Error ? transitionError.message : 'Unknown error'}`,
							}));
						}
					}, 1500);

					timeoutReferences.current.loadingTimeout = null;
				} catch (processingError) {
					developmentError(
						'[CSV FLOW] Data processing failed:',
						processingError,
					);
					setState((previous) => ({
						...previous,
						isLoading: false,
						showSuccess: false,
						error: `Data processing failed: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`,
					}));
					timeoutReferences.current.loadingTimeout = null;
				}
			}, 1000);
		} catch (outerError) {
			developmentError(
				'[CSV FLOW] Critical error in handleBothFilesLoaded:',
				outerError,
			);
			setState((previous) => ({
				...previous,
				error: `Critical error: ${outerError instanceof Error ? outerError.message : 'Unknown error'}`,
				isLoading: false,
			}));
		}
	};

	const handleError = (errorMessage: string) => {
		setState((previous) => ({...previous, error: errorMessage}));
		developmentError(errorMessage);
	};

	// Handle fees form submit
	const handleFeesSubmit = async (
		config: FeesConfig,
		computed: {monthlyFixed: number; monthlyBudget: number},
	) => {
		try {
			await persistSecureRecord(
				'dashboardFees',
				{
					config,
					computed,
					savedAt: new Date().toISOString(),
				},
				{
					ttlSeconds: 24 * 60 * 60,
					metadata: {source: 'FeesConfigurator'},
				},
			);
		} catch (storageError) {
			developmentWarn(
				'[SecureTokenFlow] Fee configuration persistence failed (non-critical):',
				storageError,
			);
		}

		// Notify parent that data loading is complete
		if (state.budgetData && state.claimsData) {
			onDataLoaded(state.budgetData, state.claimsData);
		}

		// Notify parent that fees are configured
		onFeesConfigured(config);
	};

	return (
		<motion.div
			key="uploader"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}
			className="relative"
		>
			{state.showFeesForm ? (
				<FeesConfigurator
                                        defaultEmployees={
                                                parseNumericValue(
                                                        firstAvailableValue(
                                                                (state.budgetData?.rows ?? []).at(-1)?.['Employee Count'],
                                                                (state.budgetData?.rows ?? []).at(-1)?.['Employees'],
                                                        ),
                                                )
                                        }
                                        defaultMembers={
                                                parseNumericValue(
                                                        firstAvailableValue(
                                                                (state.budgetData?.rows ?? []).at(-1)?.['Member Count'],
                                                                (state.budgetData?.rows ?? []).at(-1)?.['Enrollment'],
                                                                (state.budgetData?.rows ?? []).at(-1)?.['Total Enrollment'],
                                                        ),
                                                )
                                        }
                                        defaultBudget={
                                                parseNumericValue(
                                                        firstAvailableValue(
                                                                (state.budgetData?.rows ?? []).at(-1)?.['Budget'],
                                                                (state.budgetData?.rows ?? []).at(-1)?.['Computed Budget'],
                                                        ),
                                                )
                                        }
                                        csvData={state.budgetData?.rows ?? []}
					onSubmit={handleFeesSubmit}
				/>
			) : (
				<DualCSVLoader
					onBothFilesLoaded={handleBothFilesLoaded}
					onError={handleError}
				/>
			)}

			{/* Premium Loading Animation */}
			{state.isLoading && (
				<motion.div
					initial={{opacity: 0}}
					animate={{opacity: 1}}
					exit={{opacity: 0}}
					className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
				>
					<GlassCard variant="elevated" className="p-12 text-center max-w-md">
						<LottieLoader type="pulse" size="xl" />
						<h3 className="mt-6 text-xl font-semibold text-[var(--foreground)]">
							Processing your data
						</h3>
						<p className="mt-2 text-[var(--foreground-muted)]">
							Applying premium analytics transformations...
						</p>
					</GlassCard>
				</motion.div>
			)}

			{/* Premium Success Animation */}
			{state.showSuccess && (
				<motion.div
					initial={{opacity: 0}}
					animate={{opacity: 1}}
					exit={{opacity: 0}}
					className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
				>
					<GlassCard
						variant="vibrant"
						glow
						className="p-12 text-center max-w-md"
					>
						<LottieLoader type="success" size="xl" />
						<h3 className="mt-6 text-xl font-semibold text-[var(--foreground)]">
							Analytics Ready!
						</h3>
						<p className="mt-2 text-[var(--foreground-muted)]">
							Your premium dashboard is now live
						</p>
					</GlassCard>
				</motion.div>
			)}

			{state.error && (
				<motion.div
					initial={{opacity: 0, y: 20}}
					animate={{opacity: 1, y: 0}}
					className="fixed bottom-8 right-8 bg-[var(--surface-elevated)] border border-[var(--surface-border)] rounded-xl p-4 max-w-md shadow-[var(--card-base-shadow)]"
				>
					<p className="text-[var(--foreground)] font-semibold">Error</p>
					<p className="text-[var(--foreground-muted)] text-sm mt-1">
						{state.error}
					</p>
				</motion.div>
			)}
		</motion.div>
	);
};

export default DataUploader;
