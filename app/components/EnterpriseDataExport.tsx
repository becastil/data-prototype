'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, Table, FileSpreadsheet, Calendar } from 'lucide-react';
import { AccessibleButton, LoadingAnnouncement } from '@components/accessibility/AccessibilityEnhancements';

interface ExportData {
  budgetData?: any[];
  claimsData?: any[];
  chartData?: any[];
  metrics?: Record<string, any>;
}

interface EnterpriseDataExportProps {
  data: ExportData;
  title?: string;
}

type ExportFormat = 'csv' | 'json' | 'pdf' | 'excel';

const EnterpriseDataExport: React.FC<EnterpriseDataExportProps> = ({ 
  data, 
  title = 'Healthcare Analytics Data' 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');

  // Convert data to CSV format (with formula injection mitigation)
  const convertToCSV = (dataArray: any[], filename: string) => {
    if (!dataArray || dataArray.length === 0) {
      throw new Error('No data available for export');
    }

    const needsQuoting = (val: string) => /[",\n]/.test(val);
    const sanitizeForCSV = (val: unknown) => {
      if (val === null || val === undefined) return '';
      let s = String(val);
      // Mitigate CSV formula injection in spreadsheet apps
      if (/^[=+\-@]/.test(s)) s = ` '${s}`;
      if (needsQuoting(s)) s = '"' + s.replace(/"/g, '""') + '"';
      return s;
    };

    const headers = Object.keys(dataArray[0]);
    const csvContent = [
      headers.map(sanitizeForCSV).join(','),
      ...dataArray.map(row => headers.map(header => sanitizeForCSV(row[header])).join(','))
    ].join('\n');

    return csvContent;
  };

  // Convert data to JSON format
  const convertToJSON = (data: ExportData) => {
    const exportPackage = {
      metadata: {
        title,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        format: 'Healthcare Analytics Export'
      },
      data: {
        budget: data.budgetData || [],
        claims: data.claimsData || [],
        charts: data.chartData || [],
        metrics: data.metrics || {}
      },
      summary: {
        totalBudgetRecords: data.budgetData?.length || 0,
        totalClaimsRecords: data.claimsData?.length || 0,
        totalChartDataPoints: data.chartData?.length || 0
      }
    };

    return JSON.stringify(exportPackage, null, 2);
  };

  // Generate PDF content (simplified - would use a proper PDF library in production)
  const generatePDFContent = (data: ExportData) => {
    const reportContent = `
# ${title}
Generated: ${new Date().toLocaleDateString()}

## Summary Statistics
- Budget Records: ${data.budgetData?.length || 0}
- Claims Records: ${data.claimsData?.length || 0}
- Chart Data Points: ${data.chartData?.length || 0}

## Key Metrics
${Object.entries(data.metrics || {})
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

## Data Tables
[Note: Full data tables would be rendered here in a production PDF export]
    `.trim();

    return reportContent;
  };

  // Download file utility
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Main export handler
  const handleExport = async (format: ExportFormat, dataType: keyof ExportData) => {
    setIsExporting(true);
    setExportStatus(`Preparing ${format.toUpperCase()} export...`);

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      
      switch (format) {
        case 'csv':
          if (dataType === 'budgetData' && data.budgetData) {
            const csvContent = convertToCSV(data.budgetData, 'budget');
            downloadFile(csvContent, `budget-data-${timestamp}.csv`, 'text/csv');
          } else if (dataType === 'claimsData' && data.claimsData) {
            const csvContent = convertToCSV(data.claimsData, 'claims');
            downloadFile(csvContent, `claims-data-${timestamp}.csv`, 'text/csv');
          } else if (dataType === 'chartData' && data.chartData) {
            const csvContent = convertToCSV(data.chartData, 'chart');
            downloadFile(csvContent, `chart-data-${timestamp}.csv`, 'text/csv');
          }
          setExportStatus('CSV export completed successfully');
          break;

        case 'json':
          const jsonContent = convertToJSON(data);
          downloadFile(jsonContent, `healthcare-analytics-${timestamp}.json`, 'application/json');
          setExportStatus('JSON export completed successfully');
          break;

        case 'pdf':
          const pdfContent = generatePDFContent(data);
          downloadFile(pdfContent, `healthcare-report-${timestamp}.txt`, 'text/plain');
          setExportStatus('Report export completed successfully (Note: PDF generation requires additional setup)');
          break;

        case 'excel':
          // In production, would use a library like SheetJS
          const excelContent = convertToJSON(data);
          downloadFile(excelContent, `healthcare-data-${timestamp}.json`, 'application/json');
          setExportStatus('Excel export completed successfully (Note: Excel generation requires additional setup)');
          break;

        default:
          throw new Error('Unsupported export format');
      }

      // Auto-hide status after 3 seconds
      setTimeout(() => setExportStatus(''), 3000);
      
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setExportStatus(''), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  // Quick export handlers
  const exportBudgetCSV = () => handleExport('csv', 'budgetData');
  const exportClaimsCSV = () => handleExport('csv', 'claimsData');
  const exportAllJSON = () => handleExport('json', 'budgetData');
  const exportReport = () => handleExport('pdf', 'budgetData');

  const formatOptions = [
    { value: 'csv', label: 'CSV', icon: Table, description: 'Comma-separated values for spreadsheet import' },
    { value: 'json', label: 'JSON', icon: FileText, description: 'Structured data for API integration' },
    { value: 'pdf', label: 'PDF', icon: FileText, description: 'Formatted report for presentation' },
    { value: 'excel', label: 'Excel', icon: FileSpreadsheet, description: 'Spreadsheet format with formatting' }
  ] as const;

  return (
    <>
      {/* Loading announcements for screen readers */}
      <LoadingAnnouncement 
        isLoading={isExporting} 
        loadingText="Preparing data export"
        completedText={exportStatus}
      />

      {/* Quick export buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <AccessibleButton
          onClick={exportBudgetCSV}
          isLoading={isExporting}
          className="flex items-center gap-2 text-sm"
          disabled={!data.budgetData?.length}
          aria-describedby="export-help"
        >
          <Download className="w-4 h-4" />
          Budget CSV
        </AccessibleButton>

        <AccessibleButton
          onClick={exportClaimsCSV}
          isLoading={isExporting}
          className="flex items-center gap-2 text-sm"
          disabled={!data.claimsData?.length}
        >
          <Download className="w-4 h-4" />
          Claims CSV
        </AccessibleButton>

        <AccessibleButton
          onClick={exportAllJSON}
          isLoading={isExporting}
          className="flex items-center gap-2 text-sm"
          variant="secondary"
        >
          <FileText className="w-4 h-4" />
          Full Export
        </AccessibleButton>

        <AccessibleButton
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 text-sm"
          variant="secondary"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Advanced
        </AccessibleButton>
      </div>

      {/* Status display */}
      {exportStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm"
          role="status"
          aria-live="polite"
        >
          {exportStatus}
        </motion.div>
      )}

      {/* Advanced export modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-labelledby="export-modal-title"
              aria-describedby="export-modal-description"
            >
              <h2 id="export-modal-title" className="text-xl font-semibold mb-4 font-heading">
                Advanced Data Export
              </h2>
              
              <p id="export-modal-description" className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                Choose your export format and options for healthcare analytics data.
              </p>

              {/* Format selection */}
              <div className="space-y-3 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Export Format
                </label>
                {formatOptions.map(({ value, label, icon: Icon, description }) => (
                  <label key={value} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <input
                      type="radio"
                      name="exportFormat"
                      value={value}
                      checked={selectedFormat === value}
                      onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                      className="mt-1"
                    />
                    <Icon className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{label}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{description}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end">
                <AccessibleButton
                  onClick={() => setShowExportModal(false)}
                  variant="secondary"
                >
                  Cancel
                </AccessibleButton>
                <AccessibleButton
                  onClick={() => {
                    handleExport(selectedFormat, 'budgetData');
                    setShowExportModal(false);
                  }}
                  isLoading={isExporting}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </AccessibleButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help text */}
      <div id="export-help" className="sr-only">
        Export healthcare analytics data in various formats. CSV files can be opened in Excel or other spreadsheet applications. JSON format is suitable for API integration and data processing.
      </div>
    </>
  );
};

export default EnterpriseDataExport;
