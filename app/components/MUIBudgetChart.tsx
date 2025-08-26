'use client';

import React, { useMemo } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { chartColors } from '../constants/chartColors';
import { processFinancialData, formatCurrency } from '../utils/chartDataProcessors';
import MUIChartContainer from './MUIChartContainer';

interface MUIBudgetChartProps {
  data: any[];
  loading?: boolean;
  error?: string;
}

const MUIBudgetChart: React.FC<MUIBudgetChartProps> = ({ 
  data, 
  loading = false, 
  error = '' 
}) => {
  // Process data with 12-month rolling window
  const chartData = useMemo(() => {
    return processFinancialData(data, 12);
  }, [data]);

  // Extract data for each series
  const months = chartData.map(d => d.month);
  const totalFixedCostData = chartData.map(d => d.totalFixedCost);
  const stopLossReimbData = chartData.map(d => d.stopLossReimb);
  const rxRebatesData = chartData.map(d => d.rxRebates);
  const medicalClaimsData = chartData.map(d => d.medicalClaims);
  const rxData = chartData.map(d => d.rx);
  const budgetData = chartData.map(d => d.budget);

  // Calculate max value for Y-axis
  const maxValue = Math.max(
    ...chartData.map(d => 
      d.totalFixedCost + d.stopLossReimb + d.rxRebates + d.medicalClaims + d.rx
    ),
    ...budgetData
  );

  if (!chartData || chartData.length === 0) {
    return (
      <MUIChartContainer 
        title="Budget vs Expenses Trend (Rolling 12 Months)"
        loading={loading}
        error={error || "No data available"}
      >
        <div className="h-[400px]" />
      </MUIChartContainer>
    );
  }

  return (
    <MUIChartContainer 
      title="Budget vs Expenses Trend (Rolling 12 Months)"
      loading={loading}
      error={error}
    >
      <div className="h-[400px] w-full">
        <BarChart
          width={undefined}
          height={400}
          series={[
            {
              data: totalFixedCostData,
              label: 'Total Fixed Cost',
              color: chartColors.totalFixedCost,
              stack: 'expenses',
              id: 'totalFixedCost',
              type: 'bar' as const,
            },
            {
              data: stopLossReimbData,
              label: 'Stop Loss Reimb',
              color: chartColors.stopLossReimb,
              stack: 'expenses',
              id: 'stopLossReimb',
              type: 'bar' as const,
            },
            {
              data: rxRebatesData,
              label: 'Rx Rebates',
              color: chartColors.rxRebates,
              stack: 'expenses',
              id: 'rxRebates',
              type: 'bar' as const,
            },
            {
              data: medicalClaimsData,
              label: 'Medical Claims',
              color: chartColors.medicalClaims,
              stack: 'expenses',
              id: 'medicalClaims',
              type: 'bar' as const,
            },
            {
              data: rxData,
              label: 'Rx',
              color: chartColors.rx,
              stack: 'expenses',
              id: 'rx',
              type: 'bar' as const,
            },
            {
              data: budgetData,
              label: 'Budget',
              color: chartColors.budget,
              id: 'budget',
              type: 'line' as const,
              curve: 'linear' as const,
            },
          ]}
          xAxis={[
            {
              data: months,
              scaleType: 'band' as const,
              id: 'months',
              tickLabelStyle: {
                angle: -45,
                textAnchor: 'end',
                fontSize: 11,
              },
            },
          ]}
          yAxis={[
            {
              id: 'expenses',
              scaleType: 'linear' as const,
              max: maxValue * 1.1,
              tickLabelStyle: {
                fontSize: 11,
              },
              valueFormatter: (value: number) => `$${(value / 1000).toFixed(0)}K`,
            },
          ]}
          margin={{ top: 20, right: 80, bottom: 100, left: 80 }}
          grid={{ horizontal: true, vertical: true }}
          slotProps={{
            legend: {
              direction: 'row',
              position: { vertical: 'bottom', horizontal: 'middle' },
              padding: 0,
              itemMarkWidth: 12,
              itemMarkHeight: 12,
              markGap: 4,
              itemGap: 10,
              labelStyle: {
                fontSize: 12,
              },
            },
          }}
        />
      </div>
    </MUIChartContainer>
  );
};

export default MUIBudgetChart;