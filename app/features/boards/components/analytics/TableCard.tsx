'use client';

import React, { memo, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card as CardType } from '../../types';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import { 
  Expand, 
  Download, 
  RefreshCw, 
  Table, 
  Filter,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Import existing table components
import { ClaimsExpensesTable } from '@/app/components/data/ClaimsExpensesTable';
import FinancialDataTable from '@/app/components/data/FinancialDataTable';
import HCCDataTable from '@/app/components/data/HCCDataTable';

export interface TableCardProps {
  card: CardType;
  data?: any[];
  config: {
    compact?: boolean;
    interactive?: boolean;
    cardId: string;
    onExpand?: () => void;
    onRefresh?: () => void;
    onExport?: (format: 'csv' | 'pdf') => void;
    exportable?: boolean;
    refreshable?: boolean;
    sortable?: boolean;
    filterable?: boolean;
    searchable?: boolean;
    pagination?: {
      pageSize: number;
      showPagination?: boolean;
    };
  };
  component: string;
}

// Preview mode row limit for compact display
const PREVIEW_ROW_LIMIT = 5;

// Table component mapping
const tableComponents = {
  'ClaimsExpensesTable': ClaimsExpensesTable,
  'FinancialDataTable': FinancialDataTable,
  'HCCDataTable': HCCDataTable,
} as const;

const TableCard: React.FC<TableCardProps> = memo(({
  card,
  data = [],
  config,
  component,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get the appropriate table component
  const TableComponent = tableComponents[component as keyof typeof tableComponents];
  
  if (!TableComponent) {
    return (
      <div className="p-4 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded">
        <Table className="w-6 h-6 mx-auto mb-2" />
        <p>Unknown table component: {component}</p>
      </div>
    );
  }

  // Process data for preview mode
  const processedData = useMemo(() => {
    if (!data.length) return [];
    
    let filteredData = data;
    
    // Apply search filter if enabled and search term exists
    if (config.searchable && searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredData = data.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchLower)
        )
      );
    }
    
    // Limit rows in preview mode
    if (config.compact && !isCollapsed) {
      return filteredData.slice(0, PREVIEW_ROW_LIMIT);
    }
    
    return filteredData;
  }, [data, config.compact, config.searchable, searchTerm, isCollapsed]);

  // Handle refresh action
  const handleRefresh = async () => {
    if (!config.onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await config.onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Table configuration for compact/expanded modes
  const tableConfig = useMemo(() => ({
    sortable: config.sortable ?? true,
    filterable: config.filterable && !config.compact,
    searchable: false, // We handle search at card level
    pagination: config.compact 
      ? { pageSize: PREVIEW_ROW_LIMIT, showPagination: false }
      : config.pagination ?? { pageSize: 25, showPagination: true },
    compact: config.compact,
    interactive: config.interactive,
  }), [config]);

  return (
    <div className="w-full">
      {/* Card Header with Actions */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {card.title}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {data.length} rows
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Search in compact mode */}
          {config.compact && config.searchable && (
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 w-32"
              />
            </div>
          )}

          {/* Collapse/Expand toggle for preview */}
          {config.compact && data.length > PREVIEW_ROW_LIMIT && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-6 w-6 p-0"
            >
              {isCollapsed ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronUp className="w-3 h-3" />
              )}
            </Button>
          )}

          {/* Refresh button */}
          {config.refreshable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={cn(
                "w-3 h-3",
                isRefreshing && "animate-spin"
              )} />
            </Button>
          )}

          {/* Export button */}
          {config.exportable && config.onExport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => config.onExport?.('csv')}
              className="h-6 w-6 p-0"
            >
              <Download className="w-3 h-3" />
            </Button>
          )}

          {/* Expand button for compact mode */}
          {config.compact && config.onExpand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={config.onExpand}
              className="h-6 w-6 p-0"
            >
              <Expand className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className={cn(
        "relative overflow-hidden",
        config.compact ? "max-h-80" : "max-h-[600px]"
      )}>
        {processedData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Table className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {searchTerm ? 'No matching records found' : 'No data available'}
            </p>
          </div>
        ) : (
          <motion.div
            initial={false}
            animate={{ opacity: isRefreshing ? 0.5 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <TableComponent
              data={processedData}
              {...tableConfig}
            />
          </motion.div>
        )}

        {/* Preview indicator */}
        {config.compact && !isCollapsed && data.length > PREVIEW_ROW_LIMIT && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-gray-900 to-transparent h-8 flex items-end justify-center">
            <div className="text-xs text-gray-500 mb-1">
              Showing {PREVIEW_ROW_LIMIT} of {data.length} rows
            </div>
          </div>
        )}
      </div>

      {/* Footer with summary statistics */}
      {config.compact && data.length > 0 && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
          <div className="flex justify-between items-center">
            <span>{processedData.length} records displayed</span>
            {searchTerm && (
              <span>Filtered from {data.length} total</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

TableCard.displayName = 'TableCard';

export default TableCard;
