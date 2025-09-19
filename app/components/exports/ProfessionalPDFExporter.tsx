'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { 
  FileDown, 
  FileText, 
  Building, 
  Calendar, 
  User,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { GlassCard } from '@/app/components/ui/glass-card';
import { pdfTemplateService, PDFReportData, PDFMetrics } from '@/app/services/pdfTemplateService';
import { formatCurrency, formatPercentage, parseNumericValue } from '@utils/chartDataProcessors';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';

interface ProfessionalPDFExporterProps {
  budgetData: any[];
  claimsData: any[];
  dateRange?: { preset?: string };
  className?: string;
}

const ProfessionalPDFExporter: React.FC<ProfessionalPDFExporterProps> = ({
  budgetData = [],
  claimsData = [],
  dateRange,
  className = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [clientName, setClientName] = useState('Healthcare Client');
  const [generatedBy, setGeneratedBy] = useState('Analytics Team');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Process data for PDF generation
  const processedData = useMemo((): PDFReportData | null => {
    if (!budgetData.length) return null;

    // Calculate key metrics
    const totalBudget = budgetData.reduce((sum, row) => 
      sum + parseNumericValue(row['Budget'] || row['Computed Budget'] || 0), 0
    );

    const totalMedicalClaims = budgetData.reduce((sum, row) => 
      sum + parseNumericValue(row['Medical Claims'] || row['medical_claims'] || 0), 0
    );

    const totalPharmacyClaims = budgetData.reduce((sum, row) => 
      sum + parseNumericValue(row['Pharmacy Claims'] || row['pharmacy_claims'] || 0), 0
    );

    const totalStopLossReimb = budgetData.reduce((sum, row) => 
      sum + parseNumericValue(row['Stop Loss Reimbursements'] || row['stop_loss_reimb'] || 0), 0
    );

    const totalRebates = budgetData.reduce((sum, row) => 
      sum + parseNumericValue(row['Rx Rebates'] || row['pharmacy_rebates'] || 0), 0
    );

    const totalFixedCosts = budgetData.reduce((sum, row) => 
      sum + parseNumericValue(row['Fixed Costs'] || row['Admin Fees'] || 0) +
      parseNumericValue(row['TPA Fee'] || 0) +
      parseNumericValue(row['Stop Loss Premium'] || 0), 0
    );

    const totalExpenses = totalMedicalClaims + totalPharmacyClaims + totalFixedCosts;
    const totalRevenues = totalStopLossReimb + totalRebates;
    const totalNetCost = totalExpenses - totalRevenues;
    const totalVariance = totalBudget - totalNetCost;
    const variancePercent = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;

    const totalMembers = budgetData.reduce((sum, row) => 
      sum + parseNumericValue(row['Member Count'] || row['Enrollment'] || row['members'] || 0), 0
    );

    const planCostPEPM = totalMembers > 0 ? totalNetCost / totalMembers : 0;
    const budgetPEPM = totalMembers > 0 ? totalBudget / totalMembers : 0;
    const netPaidPEPM = totalMembers > 0 ? (totalMedicalClaims + totalPharmacyClaims - totalStopLossReimb - totalRebates) / totalMembers : 0;

    // Monthly breakdown
    const monthlyData = budgetData.map(row => {
      const budget = parseNumericValue(row['Budget'] || row['Computed Budget'] || 0);
      const medicalClaims = parseNumericValue(row['Medical Claims'] || row['medical_claims'] || 0);
      const pharmacyClaims = parseNumericValue(row['Pharmacy Claims'] || row['pharmacy_claims'] || 0);
      const stopLossReimb = parseNumericValue(row['Stop Loss Reimbursements'] || row['stop_loss_reimb'] || 0);
      const rebates = parseNumericValue(row['Rx Rebates'] || row['pharmacy_rebates'] || 0);
      const fixedCosts = parseNumericValue(row['Fixed Costs'] || 0);
      
      const expenses = medicalClaims + pharmacyClaims + fixedCosts;
      const revenues = stopLossReimb + rebates;
      const netCost = expenses - revenues;
      const variance = budget - netCost;
      const variancePercent = budget > 0 ? (variance / budget) * 100 : 0;

      return {
        month: row['month'] || row['Month'] || row['period'] || '',
        budget,
        netCost,
        variance,
        variancePercent,
        medicalClaims,
        pharmacyClaims,
        stopLossReimb,
        rebates
      };
    });

    // Calculate average monthly variance
    const avgMonthlyVariance = monthlyData.length > 0 
      ? monthlyData.reduce((sum, d) => sum + d.variancePercent, 0) / monthlyData.length 
      : 0;

    const metrics: PDFMetrics = {
      totalBudget,
      totalNetCost,
      totalVariance,
      variancePercent,
      avgMonthlyVariance,
      planCostPEPM,
      budgetPEPM,
      netPaidPEPM,
      members: totalMembers,
      reportPeriod: dateRange?.preset || 'Custom Period',
      generatedBy,
      generatedAt: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      clientName
    };

    // Generate insights and recommendations
    const keyInsights = [
      `${variancePercent >= 0 ? 'Favorable' : 'Unfavorable'} budget performance of ${formatPercentage(Math.abs(variancePercent))}`,
      `Medical claims represent ${formatPercentage((totalMedicalClaims / (totalMedicalClaims + totalPharmacyClaims)) * 100)} of total claims`,
      `Plan cost PEPM: ${formatCurrency(planCostPEPM)} vs Budget PEPM: ${formatCurrency(budgetPEPM)}`,
      `Stop-loss reimbursements offset ${formatPercentage((totalStopLossReimb / totalExpenses) * 100)} of expenses`
    ];

    const recommendations = [
      variancePercent < -10 ? 'Consider budget adjustment for next period due to significant overrun' : 'Monitor current trending patterns',
      totalStopLossReimb > 0 ? 'Optimize stop-loss coverage based on historical claims patterns' : 'Evaluate stop-loss coverage options',
      (totalPharmacyClaims / (totalMedicalClaims + totalPharmacyClaims)) > 0.25 ? 'Review pharmacy benefit management strategies' : 'Continue current pharmacy management',
      'Implement monthly budget tracking for improved variance management'
    ];

    return {
      metrics,
      monthlyData,
      keyInsights,
      recommendations
    };
  }, [budgetData, dateRange, clientName, generatedBy]);

  const handleGeneratePDF = async () => {
    if (!processedData) return;

    setIsGenerating(true);
    
    try {
      // Simulate processing time for large datasets
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate PDF
      pdfTemplateService.downloadReport(processedData);
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsDialogOpen(false);
      }, 2000);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!processedData) {
    return (
      <div className={`${className}`}>
        <Button disabled variant="outline" className="opacity-50">
          <FileText className="w-4 h-4 mr-2" />
          No Data Available
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg">
            <FileDown className="w-4 h-4 mr-2" />
            Professional Report
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Generate Professional Report
            </DialogTitle>
            <DialogDescription>
              Create a branded two-page PDF report for client delivery
            </DialogDescription>
          </DialogHeader>

          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-green-700 mb-2">Report Generated!</h3>
              <p className="text-sm text-gray-600">Download should start automatically</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Report Preview */}
              <GlassCard variant="elevated" className="p-4 space-y-3">
                <h4 className="font-medium text-slate-700">Report Preview</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Period:</span>
                    <p className="font-medium">{processedData.metrics.reportPeriod}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Budget:</span>
                    <p className="font-medium">{formatCurrency(processedData.metrics.totalBudget)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Variance:</span>
                    <p className={`font-medium ${processedData.metrics.variancePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(processedData.metrics.variancePercent)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Members:</span>
                    <p className="font-medium">{processedData.metrics.members.toLocaleString()}</p>
                  </div>
                </div>
              </GlassCard>

              {/* Configuration */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <Building className="w-4 h-4 inline mr-1" />
                    Client Name
                  </label>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter client name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Generated By
                  </label>
                  <Input
                    value={generatedBy}
                    onChange={(e) => setGeneratedBy(e.target.value)}
                    placeholder="Your name or team"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGeneratePDF}
                disabled={isGenerating || !clientName.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>

              <p className="text-xs text-slate-500 text-center">
                Report includes executive summary and detailed analytics
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessionalPDFExporter;