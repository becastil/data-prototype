'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, Search, Download } from 'lucide-react';

interface HCCDataTableProps {
  data: any[];
}

const HCCDataTable: React.FC<HCCDataTableProps> = ({ data }) => {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Format currency
  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? 
      parseFloat(value.replace(/[$,]/g, '')) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  // Sort data
  const sortedData = React.useMemo(() => {
    let sorted = [...data];
    
    if (sortField) {
      sorted.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        
        // Handle currency values
        if (sortField === 'Medical' || sortField === 'Rx' || sortField === 'Total') {
          aVal = parseFloat(String(aVal).replace(/[$,]/g, '')) || 0;
          bVal = parseFloat(String(bVal).replace(/[$,]/g, '')) || 0;
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return sorted;
  }, [data, sortField, sortDirection]);

  // Filter data
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return sortedData;
    
    return sortedData.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedData, searchTerm]);

  // Paginate data
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    if (!data || data.length === 0) return;
    const needsQuoting = (val: string) => /[",\n]/.test(val);
    const sanitizeForCSV = (val: unknown) => {
      if (val === null || val === undefined) return '';
      let s = String(val);
      if (/^[=+\-@]/.test(s)) s = ` '${s}`; // mitigate CSV injection
      if (needsQuoting(s)) s = '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const headers = Object.keys(data[0]).map(sanitizeForCSV).join(',');
    const rows = data.map(row =>
      Object.values(row).map(sanitizeForCSV).join(',')
    ).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hcc_data_export.csv';
    a.click();
  };

  const getServiceTypeColor = (serviceType: string) => {
    const colors: Record<string, string> = {
      'Inpatient': 'bg-black text-white',
      'Outpatient': 'bg-gray-800 text-white',
      'Emergency': 'bg-gray-600 text-white',
      'Pharmacy': 'bg-gray-400 text-black',
    };
    return colors[serviceType] || 'bg-gray-200 text-gray-800';
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with search and export */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold text-gray-800">HCC Claims Data</h3>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm w-full sm:w-48"
            />
          </div>
          <button
            onClick={exportToCSV}
            className="px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {data[0] && Object.keys(data[0]).map((header) => (
                <th
                  key={header}
                  onClick={() => handleSort(header)}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span>{header}</span>
                    <div className="flex flex-col ml-1">
                      <ChevronUp 
                        className={`w-3 h-3 ${
                          sortField === header && sortDirection === 'asc' 
                            ? 'text-black' : 'text-gray-400'
                        }`}
                      />
                      <ChevronDown 
                        className={`w-3 h-3 -mt-1 ${
                          sortField === header && sortDirection === 'desc' 
                            ? 'text-black' : 'text-gray-400'
                        }`}
                      />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-gray-50 transition-colors`}
              >
                {Object.entries(row).map(([key, value], cellIndex) => (
                  <td 
                    key={cellIndex}
                    className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                  >
                    {key === 'Service Type' ? (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getServiceTypeColor(String(value))}`}>
                        {value}
                      </span>
                    ) : key === 'Medical' || key === 'Rx' || key === 'Total' ? (
                      <span className="font-mono">
                        {formatCurrency(value)}
                      </span>
                    ) : key === 'ICD-10-CM Code' ? (
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {value}
                      </span>
                    ) : (
                      <span className="truncate block max-w-xs" title={String(value)}>
                        {value}
                      </span>
                    )}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-700">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-lg text-sm ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = currentPage > 3 ? currentPage - 2 + i : i + 1;
            if (pageNum > totalPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  pageNum === currentPage
                    ? 'bg-black text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-lg text-sm ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Summary footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Medical:</span>
            <span className="ml-2 font-semibold">
              {formatCurrency(
                data.reduce((sum, row) => 
                  sum + parseFloat(String(row.Medical || '0').replace(/[$,]/g, '')), 0
                )
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total Rx:</span>
            <span className="ml-2 font-semibold">
              {formatCurrency(
                data.reduce((sum, row) => 
                  sum + parseFloat(String(row.Rx || '0').replace(/[$,]/g, '')), 0
                )
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Grand Total:</span>
            <span className="ml-2 font-semibold">
              {formatCurrency(
                data.reduce((sum, row) => 
                  sum + parseFloat(String(row.Total || '0').replace(/[$,]/g, '')), 0
                )
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Avg Claim:</span>
            <span className="ml-2 font-semibold">
              {formatCurrency(
                data.reduce((sum, row) => 
                  sum + parseFloat(String(row.Total || '0').replace(/[$,]/g, '')), 0
                ) / data.length
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HCCDataTable;
