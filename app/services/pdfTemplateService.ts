'use client';

/**
 * Professional PDF Template Service for Healthcare Analytics
 * 
 * Implements Kevin's feedback for "concise two-pager" client deliverables
 * with Gallagher branding and standardized layouts.
 */

import jsPDF from 'jspdf';
import { formatCurrency, formatPercentage } from '@utils/chartDataProcessors';

export interface PDFMetrics {
  totalBudget: number;
  totalNetCost: number;
  totalVariance: number;
  variancePercent: number;
  avgMonthlyVariance: number;
  planCostPEPM: number;
  budgetPEPM: number;
  netPaidPEPM: number;
  members: number;
  reportPeriod: string;
  generatedBy: string;
  generatedAt: string;
  clientName?: string;
}

export interface PDFReportData {
  metrics: PDFMetrics;
  monthlyData: Array<{
    month: string;
    budget: number;
    netCost: number;
    variance: number;
    variancePercent: number;
    medicalClaims: number;
    pharmacyClaims: number;
    stopLossReimb: number;
    rebates: number;
  }>;
  recommendations: string[];
  keyInsights: string[];
}

/**
 * Color palette aligned with healthcare industry standards
 * and Gallagher branding guidelines
 */
const COLORS = {
  primary: '#0F4C81',      // Medical blue
  secondary: '#00A86B',    // Healthcare green  
  accent: '#FF6B35',       // Alert orange
  neutral: '#6B7280',      // Slate gray
  light: '#F8FAFC',        // Light background
  success: '#10B981',      // Success green
  warning: '#F59E0B',      // Warning amber
  danger: '#EF4444'        // Danger red
};

class PDFTemplateService {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margins = { top: 20, right: 20, bottom: 20, left: 20 };

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  /**
   * Generate executive summary page with key metrics and insights
   */
  private generateExecutiveSummary(data: PDFReportData): void {
    const { metrics, keyInsights, recommendations } = data;
    let yPosition = this.margins.top;

    // Header with Gallagher branding
    this.addHeader('Healthcare Analytics Executive Summary', yPosition);
    yPosition += 25;

    // Client and period information
    this.doc.setFontSize(10);
    this.doc.setTextColor(COLORS.neutral);
    this.doc.text(`Client: ${metrics.clientName || 'Healthcare Client'}`, this.margins.left, yPosition);
    this.doc.text(`Period: ${metrics.reportPeriod}`, this.pageWidth - this.margins.right - 60, yPosition);
    yPosition += 15;

    // Key performance indicators
    yPosition = this.addKPISection(metrics, yPosition);
    yPosition += 10;

    // Performance summary chart area
    yPosition = this.addPerformanceChart(data.monthlyData, yPosition);
    yPosition += 15;

    // Key insights section
    if (keyInsights.length > 0) {
      yPosition = this.addSection('Key Insights', keyInsights, yPosition, COLORS.primary);
      yPosition += 10;
    }

    // Recommendations section
    if (recommendations.length > 0) {
      yPosition = this.addSection('Recommendations', recommendations, yPosition, COLORS.secondary);
    }

    // Footer with generation info
    this.addFooter(metrics);
  }

  /**
   * Generate detailed analytics page with comprehensive data tables
   */
  private generateDetailedAnalytics(data: PDFReportData): void {
    this.doc.addPage();
    let yPosition = this.margins.top;

    // Header
    this.addHeader('Detailed Financial Analytics', yPosition);
    yPosition += 25;

    // Monthly breakdown table
    yPosition = this.addMonthlyBreakdownTable(data.monthlyData, yPosition);
    yPosition += 15;

    // Variance analysis
    yPosition = this.addVarianceAnalysis(data.monthlyData, yPosition);
    yPosition += 15;

    // Claims analysis
    yPosition = this.addClaimsAnalysis(data.monthlyData, yPosition);

    // Footer
    this.addFooter(data.metrics);
  }

  /**
   * Add styled header with logo placeholder and title
   */
  private addHeader(title: string, yPosition: number): void {
    // Gallagher logo placeholder (would be actual logo in production)
    this.doc.setFillColor(COLORS.primary);
    this.doc.rect(this.margins.left, yPosition, 30, 8, 'F');
    this.doc.setFontSize(8);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('GALLAGHER', this.margins.left + 2, yPosition + 5);

    // Title
    this.doc.setFontSize(16);
    this.doc.setTextColor(COLORS.primary);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margins.left + 35, yPosition + 5);

    // Underline
    this.doc.setDrawColor(COLORS.primary);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margins.left, yPosition + 12, this.pageWidth - this.margins.right, yPosition + 12);
  }

  /**
   * Add KPI metrics section with visual indicators
   */
  private addKPISection(metrics: PDFMetrics, yPosition: number): number {
    const kpiHeight = 45;
    const kpiWidth = (this.pageWidth - this.margins.left - this.margins.right - 20) / 3;

    // Section title
    this.doc.setFontSize(12);
    this.doc.setTextColor(COLORS.primary);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Key Performance Indicators', this.margins.left, yPosition);
    yPosition += 8;

    const kpis = [
      {
        title: 'Budget Performance',
        value: formatPercentage(metrics.variancePercent),
        subtitle: `${formatCurrency(metrics.totalVariance)} variance`,
        color: metrics.variancePercent >= 0 ? COLORS.success : COLORS.danger
      },
      {
        title: 'Total Plan Cost',
        value: formatCurrency(metrics.totalNetCost),
        subtitle: `${formatCurrency(metrics.planCostPEPM)} PEPM`,
        color: COLORS.primary
      },
      {
        title: 'Member Enrollment',
        value: metrics.members.toLocaleString(),
        subtitle: `${formatCurrency(metrics.budgetPEPM)} Budget PEPM`,
        color: COLORS.secondary
      }
    ];

    kpis.forEach((kpi, index) => {
      const xPosition = this.margins.left + (index * (kpiWidth + 10));
      
      // Background card
      this.doc.setFillColor(COLORS.light);
      this.doc.rect(xPosition, yPosition, kpiWidth, kpiHeight, 'F');
      
      // Border
      this.doc.setDrawColor(kpi.color);
      this.doc.setLineWidth(2);
      this.doc.rect(xPosition, yPosition, kpiWidth, kpiHeight);
      
      // Title
      this.doc.setFontSize(9);
      this.doc.setTextColor(COLORS.neutral);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(kpi.title, xPosition + 5, yPosition + 8);
      
      // Value
      this.doc.setFontSize(14);
      this.doc.setTextColor(kpi.color);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(kpi.value, xPosition + 5, yPosition + 20);
      
      // Subtitle
      this.doc.setFontSize(8);
      this.doc.setTextColor(COLORS.neutral);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(kpi.subtitle, xPosition + 5, yPosition + 30);
    });

    return yPosition + kpiHeight;
  }

  /**
   * Add performance chart visualization (simplified representation)
   */
  private addPerformanceChart(monthlyData: PDFReportData['monthlyData'], yPosition: number): number {
    const chartHeight = 40;
    const chartWidth = this.pageWidth - this.margins.left - this.margins.right;
    
    // Chart title
    this.doc.setFontSize(12);
    this.doc.setTextColor(COLORS.primary);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Monthly Performance Trend', this.margins.left, yPosition);
    yPosition += 8;

    // Chart background
    this.doc.setFillColor(COLORS.light);
    this.doc.rect(this.margins.left, yPosition, chartWidth, chartHeight, 'F');
    
    // Chart border
    this.doc.setDrawColor(COLORS.neutral);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margins.left, yPosition, chartWidth, chartHeight);

    // Simple trend line representation
    const maxVariance = Math.max(...monthlyData.map(d => Math.abs(d.variancePercent)));
    const barWidth = chartWidth / monthlyData.length;
    
    monthlyData.forEach((data, index) => {
      const barHeight = Math.abs(data.variancePercent) / maxVariance * (chartHeight - 10);
      const xPos = this.margins.left + (index * barWidth) + (barWidth * 0.2);
      const yPos = data.variancePercent >= 0 
        ? yPosition + (chartHeight / 2) - barHeight
        : yPosition + (chartHeight / 2);
      
      this.doc.setFillColor(data.variancePercent >= 0 ? COLORS.success : COLORS.danger);
      this.doc.rect(xPos, yPos, barWidth * 0.6, barHeight, 'F');
    });

    // Chart labels
    this.doc.setFontSize(6);
    this.doc.setTextColor(COLORS.neutral);
    monthlyData.forEach((data, index) => {
      const xPos = this.margins.left + (index * barWidth) + (barWidth * 0.5);
      this.doc.text(data.month.slice(-2), xPos - 3, yPosition + chartHeight + 5); // Show month
    });

    return yPosition + chartHeight + 8;
  }

  /**
   * Add monthly breakdown table
   */
  private addMonthlyBreakdownTable(monthlyData: PDFReportData['monthlyData'], yPosition: number): number {
    // Table title
    this.doc.setFontSize(12);
    this.doc.setTextColor(COLORS.primary);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Monthly Financial Breakdown', this.margins.left, yPosition);
    yPosition += 8;

    // Table headers
    const headers = ['Month', 'Budget', 'Net Cost', 'Variance', 'Variance %'];
    const colWidths = [25, 30, 30, 30, 25];
    let xPosition = this.margins.left;

    // Header row
    this.doc.setFillColor(COLORS.primary);
    this.doc.rect(this.margins.left, yPosition, colWidths.reduce((a, b) => a + b, 0), 8, 'F');
    
    this.doc.setFontSize(8);
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    
    headers.forEach((header, index) => {
      this.doc.text(header, xPosition + 2, yPosition + 5);
      xPosition += colWidths[index];
    });
    yPosition += 8;

    // Data rows
    this.doc.setFont('helvetica', 'normal');
    monthlyData.slice(0, 12).forEach((data, rowIndex) => { // Limit to 12 months for space
      xPosition = this.margins.left;
      
      // Alternate row colors
      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(250, 250, 250);
        this.doc.rect(this.margins.left, yPosition, colWidths.reduce((a, b) => a + b, 0), 6, 'F');
      }
      
      const rowData = [
        data.month,
        formatCurrency(data.budget),
        formatCurrency(data.netCost),
        formatCurrency(data.variance),
        formatPercentage(data.variancePercent)
      ];
      
      this.doc.setFontSize(7);
      this.doc.setTextColor(COLORS.neutral);
      
      rowData.forEach((cellData, colIndex) => {
        this.doc.text(cellData, xPosition + 2, yPosition + 4);
        xPosition += colWidths[colIndex];
      });
      
      yPosition += 6;
    });

    return yPosition;
  }

  /**
   * Add variance analysis section
   */
  private addVarianceAnalysis(monthlyData: PDFReportData['monthlyData'], yPosition: number): number {
    this.doc.setFontSize(12);
    this.doc.setTextColor(COLORS.primary);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Variance Analysis', this.margins.left, yPosition);
    yPosition += 10;

    const favorableMonths = monthlyData.filter(d => d.variance >= 0).length;
    const unfavorableMonths = monthlyData.length - favorableMonths;
    const avgVariance = monthlyData.reduce((sum, d) => sum + d.variancePercent, 0) / monthlyData.length;

    this.doc.setFontSize(9);
    this.doc.setTextColor(COLORS.neutral);
    this.doc.setFont('helvetica', 'normal');
    
    const analysisText = [
      `• ${favorableMonths} months favorable, ${unfavorableMonths} months unfavorable`,
      `• Average monthly variance: ${formatPercentage(avgVariance)}`,
      `• Trend: ${avgVariance >= 0 ? 'Positive' : 'Negative'} budget performance`
    ];

    analysisText.forEach(text => {
      this.doc.text(text, this.margins.left + 5, yPosition);
      yPosition += 5;
    });

    return yPosition + 5;
  }

  /**
   * Add claims analysis section
   */
  private addClaimsAnalysis(monthlyData: PDFReportData['monthlyData'], yPosition: number): number {
    this.doc.setFontSize(12);
    this.doc.setTextColor(COLORS.primary);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Claims Analysis', this.margins.left, yPosition);
    yPosition += 10;

    const totalMedical = monthlyData.reduce((sum, d) => sum + d.medicalClaims, 0);
    const totalPharmacy = monthlyData.reduce((sum, d) => sum + d.pharmacyClaims, 0);
    const totalReimb = monthlyData.reduce((sum, d) => sum + d.stopLossReimb, 0);
    const medicalPercent = (totalMedical / (totalMedical + totalPharmacy)) * 100;

    this.doc.setFontSize(9);
    this.doc.setTextColor(COLORS.neutral);
    this.doc.setFont('helvetica', 'normal');
    
    const claimsText = [
      `• Medical claims: ${formatCurrency(totalMedical)} (${formatPercentage(medicalPercent)})`,
      `• Pharmacy claims: ${formatCurrency(totalPharmacy)} (${formatPercentage(100 - medicalPercent)})`,
      `• Stop-loss reimbursements: ${formatCurrency(totalReimb)}`
    ];

    claimsText.forEach(text => {
      this.doc.text(text, this.margins.left + 5, yPosition);
      yPosition += 5;
    });

    return yPosition;
  }

  /**
   * Add section with bullet points
   */
  private addSection(title: string, items: string[], yPosition: number, color: string): number {
    this.doc.setFontSize(12);
    this.doc.setTextColor(color);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margins.left, yPosition);
    yPosition += 8;

    this.doc.setFontSize(9);
    this.doc.setTextColor(COLORS.neutral);
    this.doc.setFont('helvetica', 'normal');
    
    items.slice(0, 5).forEach(item => { // Limit to 5 items for space
      this.doc.text(`• ${item}`, this.margins.left + 5, yPosition);
      yPosition += 5;
    });

    return yPosition;
  }

  /**
   * Add footer with generation information
   */
  private addFooter(metrics: PDFMetrics): void {
    const footerY = this.pageHeight - 15;
    
    this.doc.setDrawColor(COLORS.neutral);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margins.left, footerY - 5, this.pageWidth - this.margins.right, footerY - 5);
    
    this.doc.setFontSize(7);
    this.doc.setTextColor(COLORS.neutral);
    this.doc.text(`Generated by ${metrics.generatedBy} on ${metrics.generatedAt}`, this.margins.left, footerY);
    this.doc.text('Gallagher Healthcare Analytics Dashboard', this.pageWidth - this.margins.right - 60, footerY);
  }

  /**
   * Generate complete two-page professional report
   */
  public generateReport(data: PDFReportData): Uint8Array {
    // Page 1: Executive Summary
    this.generateExecutiveSummary(data);
    
    // Page 2: Detailed Analytics
    this.generateDetailedAnalytics(data);
    
    return this.doc.output('arraybuffer');
  }

  /**
   * Generate and download PDF report
   */
  public downloadReport(data: PDFReportData, filename?: string): void {
    this.generateReport(data);
    
    const defaultFilename = `healthcare-analytics-${data.metrics.reportPeriod.replace(/\s/g, '-').toLowerCase()}.pdf`;
    this.doc.save(filename || defaultFilename);
  }
}

// Export service instance and types
export const pdfTemplateService = new PDFTemplateService();
export default PDFTemplateService;