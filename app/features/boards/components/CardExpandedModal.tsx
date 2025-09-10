'use client';

import React, { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card as CardType, Comment, Activity } from '../types';
import { cn } from '@/app/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Textarea } from '@/app/components/ui/textarea';
import CardAnalyticsWrapper, { AnalyticsConfig } from './analytics/CardAnalyticsWrapper';
import { 
  X,
  Edit,
  Share,
  Download,
  RefreshCw,
  MessageSquare,
  Activity as ActivityIcon,
  Paperclip,
  Calendar,
  User as UserIcon,
  Clock,
  Send,
  Plus,
  Tag,
  Users,
  AlertCircle,
  CheckCircle,
  Eye
} from 'lucide-react';

export interface CardExpandedModalProps {
  card: CardType;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (card: Partial<CardType>) => Promise<void>;
  onAddComment?: (cardId: string, content: string) => Promise<void>;
  onRefreshData?: () => Promise<void>;
  onExportData?: (format: 'csv' | 'pdf') => Promise<void>;
  className?: string;
}

// Helper function to detect analytics configuration (same as Card component)
const getAnalyticsConfig = (card: CardType): AnalyticsConfig | null => {
  if (card.customFields?.analytics) {
    return card.customFields.analytics as AnalyticsConfig;
  }
  
  if (card.customFields?.chartData || card.customFields?.chartType) {
    return {
      type: 'chart',
      component: card.customFields.chartComponent || 'EChartsEnterpriseChart',
      data: card.customFields.chartData,
      config: {
        chartType: card.customFields.chartType,
        compact: false, // Full size in modal
        interactive: true,
        exportable: true,
        refreshable: true,
      },
    };
  }
  
  if (card.customFields?.tableData || card.customFields?.tableComponent) {
    return {
      type: 'table',
      component: card.customFields.tableComponent || 'ClaimsExpensesTable',
      data: card.customFields.tableData,
      config: {
        compact: false, // Full size in modal
        interactive: true,
        exportable: true,
        refreshable: true,
        sortable: true,
        filterable: true,
        searchable: true,
        pagination: { pageSize: 50, showPagination: true },
      },
    };
  }
  
  if (card.customFields?.metrics || card.customFields?.insights) {
    return {
      type: 'insight',
      component: 'InsightCard',
      data: {
        metrics: card.customFields.metrics || card.customFields.insights,
        title: card.title,
        period: card.customFields.period,
      },
      config: {
        compact: false, // Full size in modal
        interactive: true,
        exportable: true,
        refreshable: true,
        showTrends: true,
        showTargets: true,
        animateNumbers: true,
        layout: 'grid',
      },
    };
  }
  
  return null;
};

// Activity item component
const ActivityItem = memo(({ activity }: { activity: Activity }) => {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'created':
        return Plus;
      case 'updated':
        return Edit;
      case 'moved':
        return ActivityIcon;
      case 'commented':
        return MessageSquare;
      case 'labeled':
        return Tag;
      case 'assigned':
        return Users;
      case 'completed':
        return CheckCircle;
      default:
        return Clock;
    }
  };

  const Icon = getActivityIcon(activity.type);
  
  return (
    <div className="flex gap-3 py-2">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-100">
          {activity.description}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {activity.timestamp.toLocaleString()}
        </p>
      </div>
    </div>
  );
});
ActivityItem.displayName = 'ActivityItem';

// Comment component
const CommentItem = memo(({ comment }: { comment: Comment }) => (
  <div className="flex gap-3 py-3">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
      <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <p className="text-sm text-gray-900 dark:text-gray-100">
          {comment.content}
        </p>
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
        <span>{comment.createdAt.toLocaleString()}</span>
        {comment.isEdited && <span>(edited)</span>}
      </div>
    </div>
  </div>
));
CommentItem.displayName = 'CommentItem';

const CardExpandedModal: React.FC<CardExpandedModalProps> = memo(({
  card,
  isOpen,
  onClose,
  onUpdate,
  onAddComment,
  onRefreshData,
  onExportData,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');

  // Determine analytics configuration
  const analyticsConfig = useMemo(() => getAnalyticsConfig(card), [card]);

  // Handle comment submission
  const handleAddComment = async () => {
    if (!newComment.trim() || !onAddComment) return;
    
    setIsLoading(true);
    try {
      await onAddComment(card.id, newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle data refresh
  const handleRefresh = async () => {
    if (!onRefreshData) return;
    
    setIsLoading(true);
    try {
      await onRefreshData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle data export
  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!onExportData) return;
    
    setIsLoading(true);
    try {
      await onExportData(format);
    } catch (error) {
      console.error('Failed to export data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "max-w-6xl max-h-[90vh] overflow-hidden flex flex-col",
          className
        )}
      >
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {card.title}
              </DialogTitle>
              {card.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {card.description}
                </p>
              )}
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {analyticsConfig && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn(
                      "w-4 h-4 mr-2",
                      isLoading && "animate-spin"
                    )} />
                    Refresh
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExport('csv')}
                    disabled={isLoading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Card Metadata */}
          <div className="flex items-center gap-4 mt-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Status:</span>
              <Badge variant="secondary" className="capitalize">
                {card.status.replace('_', ' ')}
              </Badge>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Priority:</span>
              <Badge variant={card.priority === 'urgent' ? 'destructive' : 'secondary'}>
                {card.priority}
              </Badge>
            </div>

            {/* Due Date */}
            {card.dueDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Due {formatDate(card.dueDate)}
                </span>
              </div>
            )}

            {/* Assignees */}
            {card.assignees.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {card.assignees.length} assignee{card.assignees.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Tabs Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="analytics" disabled={!analyticsConfig}>
                <Eye className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="discussion">
                <MessageSquare className="w-4 h-4 mr-2" />
                Discussion ({card.comments.length})
              </TabsTrigger>
              <TabsTrigger value="activity">
                <ActivityIcon className="w-4 h-4 mr-2" />
                Activity ({card.activity.length})
              </TabsTrigger>
            </TabsList>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="flex-1 overflow-auto mt-4">
              {analyticsConfig ? (
                <div className="h-full">
                  <CardAnalyticsWrapper
                    card={card}
                    analytics={analyticsConfig}
                    isPreview={false}
                    isDragging={false}
                    onRefresh={handleRefresh}
                    onExport={handleExport}
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No analytics data available</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Discussion Tab */}
            <TabsContent value="discussion" className="flex-1 overflow-auto mt-4">
              <div className="space-y-4">
                {/* Comments */}
                <div className="space-y-2">
                  {card.comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No comments yet</p>
                    </div>
                  ) : (
                    card.comments.map((comment) => (
                      <CommentItem key={comment.id} comment={comment} />
                    ))
                  )}
                </div>

                {/* Add Comment */}
                {onAddComment && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || isLoading}
                          size="sm"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Add Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="flex-1 overflow-auto mt-4">
              <div className="space-y-2">
                {card.activity.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ActivityIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No activity yet</p>
                  </div>
                ) : (
                  card.activity
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
});

CardExpandedModal.displayName = 'CardExpandedModal';

export default CardExpandedModal;