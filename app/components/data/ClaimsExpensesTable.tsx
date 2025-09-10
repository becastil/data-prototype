'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Search, 
  TrendingUp, 
  TrendingDown,
  Filter,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Settings,
  DollarSign,
  Calendar,
  User,
  Building
} from 'lucide-react';

interface ClaimData {
  id?: string;
  claimId: string;
  member: string;
  provider: string;
  service: string;
  amount: number;
  status: string;
  date: string;
  diagnosis?: string;
  procedure?: string;
}

interface ClaimsExpensesTableProps {
  data: ClaimData[];
  compact?: boolean;
  interactive?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  exportable?: boolean;
  pagination?: {
    pageSize: number;
    showPagination?: boolean;
  };
}

export const ClaimsExpensesTable: React.FC<ClaimsExpensesTableProps> = ({
  data = [],
  compact = false,
  interactive = true,
  sortable = true,
  filterable = true,
  searchable = true,
  exportable = true,
  pagination = { pageSize: 25, showPagination: true },
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showColumns, setShowColumns] = useState({
    claimId: true,
    member: true,
    provider: !compact,
    service: true,
    amount: true,
    status: true,
    date: !compact,
  });

  // Process data with search, filter, and sort
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm && searchable) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(claim =>
        claim.claimId.toLowerCase().includes(search) ||
        claim.member.toLowerCase().includes(search) ||
        claim.provider.toLowerCase().includes(search) ||
        claim.service.toLowerCase().includes(search) ||
        claim.status.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all' && filterable) {
      filtered = filtered.filter(claim => claim.status === statusFilter);
    }

    // Apply sorting
    if (sortConfig && sortable) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof ClaimData];
        const bVal = b[sortConfig.key as keyof ClaimData];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        }
      });
    }

    return filtered;
  }, [data, searchTerm, statusFilter, sortConfig, searchable, filterable, sortable]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination.showPagination) return processedData;
    
    const start = (currentPage - 1) * pagination.pageSize;
    return processedData.slice(start, start + pagination.pageSize);
  }, [processedData, currentPage, pagination]);

  const handleSort = (key: string) => {
    if (!sortable) return;
    
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'denied':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'review':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalPages = Math.ceil(processedData.length / pagination.pageSize);
  const uniqueStatuses = Array.from(new Set(data.map(claim => claim.status)));

  return (
    <div className="w-full">
      {/* Table Controls */}
      {(searchable || filterable || exportable) && !compact && (
        <div className="flex items-center justify-between gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {/* Search */}
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search claims..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Status Filter */}
            {filterable && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
              >
                <option value="all">All Status</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            )}

            {/* Export Button */}
            {exportable && (
              <button
                className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Export data"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {showColumns.claimId && (
                <th 
                  className={`text-left p-3 font-medium text-gray-900 dark:text-gray-100 ${sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
                  onClick={() => handleSort('claimId')}
                >
                  <div className="flex items-center gap-2">
                    Claim ID
                    {sortable && (
                      <div className="flex flex-col">
                        <ChevronRight className="w-3 h-3 -mb-1" />
                        <ChevronDown className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </th>
              )}
              
              {showColumns.member && (
                <th 
                  className={`text-left p-3 font-medium text-gray-900 dark:text-gray-100 ${sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
                  onClick={() => handleSort('member')}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Member
                  </div>
                </th>
              )}
              
              {showColumns.provider && (
                <th 
                  className={`text-left p-3 font-medium text-gray-900 dark:text-gray-100 ${sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
                  onClick={() => handleSort('provider')}
                >
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Provider
                  </div>
                </th>
              )}
              
              {showColumns.service && (
                <th className="text-left p-3 font-medium text-gray-900 dark:text-gray-100">
                  Service
                </th>
              )}
              
              {showColumns.amount && (
                <th 
                  className={`text-right p-3 font-medium text-gray-900 dark:text-gray-100 ${sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-2">
                    <DollarSign className="w-4 h-4" />
                    Amount
                  </div>
                </th>
              )}
              
              {showColumns.status && (
                <th className="text-left p-3 font-medium text-gray-900 dark:text-gray-100">
                  Status
                </th>
              )}
              
              {showColumns.date && (
                <th 
                  className={`text-left p-3 font-medium text-gray-900 dark:text-gray-100 ${sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date
                  </div>
                </th>
              )}
            </tr>
          </thead>
          
          <tbody>
            <AnimatePresence>
              {paginatedData.map((claim, index) => (
                <motion.tr
                  key={claim.claimId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  {showColumns.claimId && (
                    <td className="p-3 font-medium text-blue-600 dark:text-blue-400">
                      {claim.claimId}
                    </td>
                  )}
                  
                  {showColumns.member && (
                    <td className="p-3 text-gray-900 dark:text-gray-100">
                      {claim.member}
                    </td>
                  )}
                  
                  {showColumns.provider && (
                    <td className="p-3 text-gray-600 dark:text-gray-400">
                      {claim.provider}
                    </td>
                  )}
                  
                  {showColumns.service && (
                    <td className="p-3 text-gray-900 dark:text-gray-100">
                      {claim.service}
                    </td>
                  )}
                  
                  {showColumns.amount && (
                    <td className="p-3 text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(claim.amount)}
                    </td>
                  )}
                  
                  {showColumns.status && (
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                        {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                      </span>
                    </td>
                  )}
                  
                  {showColumns.date && (
                    <td className="p-3 text-gray-600 dark:text-gray-400">
                      {claim.date}
                    </td>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
            
            {paginatedData.length === 0 && (
              <tr>
                <td 
                  colSpan={Object.values(showColumns).filter(Boolean).length} 
                  className="p-8 text-center text-gray-500"
                >
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No matching claims found'
                    : 'No claims data available'
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.showPagination && totalPages > 1 && !compact && (
        <div className="flex items-center justify-between mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((currentPage - 1) * pagination.pageSize) + 1} to {Math.min(currentPage * pagination.pageSize, processedData.length)} of {processedData.length} claims
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            
            <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {!compact && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total Claims:</span>
              <span className="ml-2 font-medium">{processedData.length}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
              <span className="ml-2 font-medium">
                {formatCurrency(processedData.reduce((sum, claim) => sum + claim.amount, 0))}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Avg Claim:</span>
              <span className="ml-2 font-medium">
                {formatCurrency(processedData.reduce((sum, claim) => sum + claim.amount, 0) / Math.max(processedData.length, 1))}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Approved:</span>
              <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                {processedData.filter(claim => claim.status === 'approved').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};