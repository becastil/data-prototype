'use client';

import React, { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, Users, Settings, Shield, Eye, EyeOff, Plus, Filter, Search } from 'lucide-react';
import { Board, User } from '../types';
import { useBoardStore } from '@/app/stores/boardStore';
import { useHealthcareStore } from '@/app/stores/healthcareStore';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import { GlassCard } from '@/app/components/ui/glass-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';

interface BoardHeaderProps {
  board: Board;
  onCreateList: () => void;
  complianceMode?: boolean;
  className?: string;
}

// Trello-inspired board header with healthcare compliance indicators
const BoardHeader: React.FC<BoardHeaderProps> = memo(({
  board,
  onCreateList,
  complianceMode = true,
  className,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(board.title);
  const [showFilters, setShowFilters] = useState(false);
  
  const updateBoard = useBoardStore(state => state.updateBoard);
  const searchCards = useBoardStore(state => state.searchCards);
  const clearSearch = useBoardStore(state => state.clearSearch);
  
  const healthcareMetrics = useHealthcareStore(state => state.metrics);
  const complianceStatus = useHealthcareStore(state => state.getComplianceStatus());
  
  // Handle title editing
  const handleTitleSubmit = useCallback(async () => {
    if (editTitle.trim() && editTitle !== board.title) {
      await updateBoard(board.id, { title: editTitle.trim() });
    }
    setIsEditingTitle(false);
  }, [editTitle, board.title, board.id, updateBoard]);
  
  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditTitle(board.title);
      setIsEditingTitle(false);
    }
  }, [board.title, handleTitleSubmit]);
  
  // Handle search
  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      searchCards(query.trim());
    } else {
      clearSearch();
    }
  }, [searchCards, clearSearch]);
  
  // Board visibility indicator
  const getVisibilityIcon = () => {
    switch (board.visibility) {
      case 'private':
        return <EyeOff className="w-4 h-4" />;
      case 'public':
        return <Eye className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };
  
  const getVisibilityLabel = () => {
    switch (board.visibility) {
      case 'private':
        return 'Private';
      case 'public':
        return 'Public';
      case 'team':
        return 'Team';
      case 'organization':
        return 'Organization';
      default:
        return 'Team';
    }
  };
  
  // Compliance status indicator
  const getComplianceColor = () => {
    switch (complianceStatus) {
      case 'compliant':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'violation':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };
  
  return (
    <div className={cn(
      "sticky top-0 z-40 bg-white/10 backdrop-blur-sm border-b border-white/20",
      "px-6 py-4",
      className
    )}>
      <div className="flex items-center justify-between">
        {/* Left section: Board title and info */}
        <div className="flex items-center gap-4">
          {/* Board Title */}
          {isEditingTitle ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleTitleKeyDown}
              className={cn(
                "text-2xl font-bold bg-transparent border-b-2 border-white/30",
                "focus:outline-none focus:border-white/60",
                "text-gray-800 dark:text-white min-w-0 max-w-md"
              )}
              placeholder="Board title"
              autoFocus
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className={cn(
                "text-2xl font-bold cursor-pointer hover:bg-white/10 px-2 py-1 rounded",
                "text-gray-800 dark:text-white transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-white/30"
              )}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsEditingTitle(true);
                }
              }}
              role="button"
              aria-label={`Board title: ${board.title}. Click to edit.`}
            >
              {board.title}
            </h1>
          )}
          
          {/* Board visibility indicator */}
          <GlassCard variant="subtle" className="px-3 py-1 flex items-center gap-2">
            {getVisibilityIcon()}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {getVisibilityLabel()}
            </span>
          </GlassCard>
          
          {/* Star/favorite button */}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-yellow-500 transition-colors"
            aria-label="Star this board"
          >
            <Star className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Center section: Healthcare metrics (if available) */}
        {complianceMode && healthcareMetrics.lastUpdated && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:flex items-center gap-4"
          >
            <GlassCard variant="elevated" className="px-4 py-2">
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-800 dark:text-white">
                    {healthcareMetrics.totalClaims.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Claims</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-800 dark:text-white">
                    ${(healthcareMetrics.totalBudget / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Budget</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-800 dark:text-white">
                    {healthcareMetrics.activeMembers.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Members</div>
                </div>
              </div>
            </GlassCard>
            
            {/* Compliance status indicator */}
            <GlassCard 
              variant={complianceStatus === 'compliant' ? 'default' : 'elevated'} 
              className={cn(
                "px-3 py-2 flex items-center gap-2",
                complianceStatus === 'violation' && "border-red-300 bg-red-50/50"
              )}
            >
              <Shield className={cn("w-4 h-4", getComplianceColor())} />
              <span className={cn("text-sm font-medium", getComplianceColor())}>
                {complianceStatus === 'compliant' ? 'Compliant' : 
                 complianceStatus === 'warning' ? 'Warning' : 'Violation'}
              </span>
            </GlassCard>
          </motion.div>
        )}
        
        {/* Right section: Actions and members */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search cards..."
              className={cn(
                "pl-9 pr-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg",
                "border border-white/20 text-sm text-gray-700 dark:text-gray-300",
                "placeholder-gray-500 dark:placeholder-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40",
                "w-40 md:w-60 transition-all duration-200"
              )}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          
          {/* Filters toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "text-gray-600 hover:text-gray-800 dark:hover:text-white",
              showFilters && "bg-white/20"
            )}
            aria-label="Toggle filters"
          >
            <Filter className="w-4 h-4" />
          </Button>
          
          {/* Board members avatars */}
          <div className="flex items-center -space-x-2">
            {board.members.slice(0, 5).map((member, index) => (
              <div
                key={member.userId}
                className={cn(
                  "w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500",
                  "border-2 border-white dark:border-gray-800 flex items-center justify-center",
                  "text-xs font-semibold text-white hover:z-10 transition-transform hover:scale-110"
                )}
                title={`Member ${member.userId}`}
                style={{ zIndex: 5 - index }}
              >
                {member.userId.charAt(0).toUpperCase()}
              </div>
            ))}
            {board.members.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-semibold text-white">
                +{board.members.length - 5}
              </div>
            )}
          </div>
          
          {/* Board menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-800 dark:hover:text-white"
                aria-label="Board menu"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={onCreateList}>
                <Plus className="w-4 h-4 mr-2" />
                Add List
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Users className="w-4 h-4 mr-2" />
                Manage Members
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Board Settings
              </DropdownMenuItem>
              {complianceMode && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Shield className="w-4 h-4 mr-2" />
                    Compliance Report
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Expandable filters section */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-white/20"
        >
          <div className="flex flex-wrap gap-2">
            {/* Quick filter buttons */}
            <Button variant="outline" size="sm">
              Assigned to me
            </Button>
            <Button variant="outline" size="sm">
              Due this week
            </Button>
            <Button variant="outline" size="sm">
              High priority
            </Button>
            {complianceMode && (
              <>
                <Button variant="outline" size="sm">
                  PHI cards
                </Button>
                <Button variant="outline" size="sm">
                  Compliance issues
                </Button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
});

BoardHeader.displayName = 'BoardHeader';

export default BoardHeader;