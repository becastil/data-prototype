'use client';

import React, { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card as CardType, Label, User } from '../types';
import { cn } from '@/app/lib/utils';
import { GlassCard } from '@/app/components/ui/glass-card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import CardAnalyticsWrapper, { AnalyticsConfig } from './analytics/CardAnalyticsWrapper';
import { 
  Calendar, 
  MessageSquare, 
  Paperclip,
  User as UserIcon,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

export interface CardProps {
  card: CardType;
  isDragging?: boolean;
  isPreview?: boolean; // For drag overlay
  onEdit?: (cardId: string) => void;
  onDelete?: (cardId: string) => void;
  onDuplicate?: (cardId: string) => void;
  onExpand?: (cardId: string) => void;
  className?: string;
}

// Priority color mapping
const priorityColors = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  normal: 'bg-blue-500',
  low: 'bg-gray-500',
};

// Status color mapping
const statusColors = {
  pending: 'text-gray-600 bg-gray-100 dark:bg-gray-800',
  in_progress: 'text-blue-600 bg-blue-100 dark:bg-blue-900',
  review: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900',
  approved: 'text-green-600 bg-green-100 dark:bg-green-900',
  denied: 'text-red-600 bg-red-100 dark:bg-red-900',
  completed: 'text-green-600 bg-green-100 dark:bg-green-900',
};

// Status icons
const statusIcons = {
  pending: Clock,
  in_progress: AlertCircle,
  review: Eye,
  approved: CheckCircle,
  denied: AlertCircle,
  completed: CheckCircle,
};

// Helper function to detect analytics content
const getAnalyticsConfig = (card: CardType): AnalyticsConfig | null => {
  // Check if card has analytics configuration in customFields
  if (card.customFields?.analytics) {
    return card.customFields.analytics as AnalyticsConfig;
  }
  
  // Infer analytics type from card content
  if (card.customFields?.chartData || card.customFields?.chartType) {
    return {
      type: 'chart',
      component: card.customFields.chartComponent || 'EChartsEnterpriseChart',
      data: card.customFields.chartData,
      config: {
        chartType: card.customFields.chartType,
        compact: true,
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
        compact: true,
        interactive: true,
        exportable: true,
        refreshable: true,
        sortable: true,
        filterable: true,
        searchable: true,
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
        compact: true,
        interactive: true,
        exportable: true,
        refreshable: true,
        showTrends: true,
        showTargets: true,
        animateNumbers: true,
      },
    };
  }
  
  return null;
};

// Label component
const LabelBadge = memo(({ label }: { label: Label }) => (
  <Badge
    variant="secondary"
    className={cn(
      "text-xs px-2 py-0.5 rounded-full",
      `bg-${label.color}-100 text-${label.color}-700 dark:bg-${label.color}-900 dark:text-${label.color}-300`
    )}
  >
    {label.name}
  </Badge>
));
LabelBadge.displayName = 'LabelBadge';

// Assignee avatar component
const AssigneeAvatar = memo(({ user }: { user: User }) => (
  <div
    className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-700"
    title={`${user.name} (${user.email})`}
  >
    {user.avatar ? (
      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
    ) : (
      <UserIcon className="w-3 h-3 text-gray-600 dark:text-gray-300" />
    )}
  </div>
));
AssigneeAvatar.displayName = 'AssigneeAvatar';

const Card: React.FC<CardProps> = memo(({
  card,
  isDragging = false,
  isPreview = false,
  onEdit,
  onDelete,
  onDuplicate,
  onExpand,
  className,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
  });

  // Determine analytics configuration
  const analyticsConfig = useMemo(() => getAnalyticsConfig(card), [card]);
  
  // Get status icon and color
  const StatusIcon = statusIcons[card.status];
  const isCompleted = card.isCompleted || card.status === 'completed';
  
  // Calculate days until due date
  const daysUntilDue = card.dueDate 
    ? Math.ceil((card.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isDueSoon = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || sortableIsDragging ? 0.5 : 1,
  };

  const handleExpand = () => {
    if (analyticsConfig && onExpand) {
      onExpand(card.id);
    }
    setIsExpanded(true);
  };

  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        whileHover={{ scale: isPreview ? 1 : 1.02 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "group cursor-pointer",
          className
        )}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <GlassCard
          variant={isCompleted ? "subtle" : "elevated"}
          className={cn(
            "p-4 space-y-3 w-full",
            isCompleted && "opacity-75",
            isDragging && "shadow-2xl rotate-1",
            isOverdue && "ring-2 ring-red-400 dark:ring-red-600",
            isDueSoon && "ring-2 ring-yellow-400 dark:ring-yellow-600"
          )}
        >
          {/* Header with title and actions */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2",
                isCompleted && "line-through"
              )}>
                {card.title}
              </h3>
              {card.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {card.description}
                </p>
              )}
            </div>
            
            {/* Actions menu */}
            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1"
                >
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onEdit(card.id); }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  )}
                  {onDuplicate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onDuplicate(card.id); }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
                    className="h-6 w-6 p-0"
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Analytics Content */}
          {analyticsConfig && (
            <div className="relative">
              <CardAnalyticsWrapper
                card={card}
                analytics={analyticsConfig}
                isPreview={true}
                isDragging={isDragging || sortableIsDragging}
                onExpand={handleExpand}
                className="rounded-lg overflow-hidden"
              />
            </div>
          )}

          {/* Labels */}
          {card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {card.labels.map((label) => (
                <LabelBadge key={label.id} label={label} />
              ))}
            </div>
          )}

          {/* Card metadata footer */}
          <div className="flex items-center justify-between text-xs">
            {/* Left side - Status and priority */}
            <div className="flex items-center gap-2">
              {/* Status */}
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full",
                statusColors[card.status]
              )}>
                <StatusIcon className="w-3 h-3" />
                <span className="capitalize">{card.status.replace('_', ' ')}</span>
              </div>
              
              {/* Priority indicator */}
              {card.priority !== 'normal' && (
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  priorityColors[card.priority]
                )} 
                title={`${card.priority} priority`} />
              )}
            </div>

            {/* Right side - Due date, comments, attachments */}
            <div className="flex items-center gap-2">
              {/* Due date */}
              {card.dueDate && (
                <div className={cn(
                  "flex items-center gap-1",
                  isOverdue 
                    ? "text-red-600 dark:text-red-400" 
                    : isDueSoon 
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-gray-500"
                )}>
                  <Calendar className="w-3 h-3" />
                  <span>
                    {isOverdue 
                      ? `${Math.abs(daysUntilDue!)}d overdue`
                      : isDueSoon 
                        ? `${daysUntilDue}d left`
                        : card.dueDate.toLocaleDateString()
                    }
                  </span>
                </div>
              )}

              {/* Comments count */}
              {card.comments.length > 0 && (
                <div className="flex items-center gap-1 text-gray-500">
                  <MessageSquare className="w-3 h-3" />
                  <span>{card.comments.length}</span>
                </div>
              )}

              {/* Attachments count */}
              {card.attachments.length > 0 && (
                <div className="flex items-center gap-1 text-gray-500">
                  <Paperclip className="w-3 h-3" />
                  <span>{card.attachments.length}</span>
                </div>
              )}

              {/* Assignees */}
              {card.assignees.length > 0 && (
                <div className="flex -space-x-1">
                  {card.assignees.slice(0, 3).map((assignee) => (
                    <AssigneeAvatar key={assignee.id} user={assignee} />
                  ))}
                  {card.assignees.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 border-2 border-white dark:border-gray-700">
                      +{card.assignees.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </>
  );
});

Card.displayName = 'Card';

export default Card;