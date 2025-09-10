// Core board system types - Trello-inspired architecture
// Designed for healthcare analytics dashboard transformation

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'analyst' | 'viewer' | 'contributor';
}

export interface Label {
  id: string;
  name: string;
  color: 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'gray';
  description?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'spreadsheet' | 'chart';
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  isSecure?: boolean; // HIPAA-compliant encryption flag
}

export interface Activity {
  id: string;
  type: 'created' | 'updated' | 'moved' | 'commented' | 'labeled' | 'assigned' | 'completed';
  userId: string;
  timestamp: Date;
  description: string;
  metadata?: Record<string, any>;
}

export interface Comment {
  id: string;
  cardId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  mentions: string[]; // User IDs mentioned in comment
  isEdited?: boolean;
}

export interface Card {
  id: string;
  listId: string;
  boardId: string;
  title: string;
  description?: string;
  position: number;
  
  // Visual and metadata
  labels: Label[];
  assignees: User[];
  dueDate?: Date;
  isCompleted: boolean;
  
  // Data and attachments
  attachments: Attachment[];
  
  // Activity and collaboration
  activity: Activity[];
  comments: Comment[];
  
  // Healthcare-specific metadata
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: 'pending' | 'in_progress' | 'review' | 'approved' | 'denied' | 'completed';
  
  // Audit and compliance
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
  
  // Custom fields for extensibility
  customFields: Record<string, any>;
}

export interface List {
  id: string;
  boardId: string;
  title: string;
  position: number;
  
  // List configuration
  isCollapsed: boolean;
  cardLimit?: number;
  
  // Automation rules
  automationRules?: AutomationRule[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  
  // Visual configuration
  background?: {
    type: 'color' | 'gradient' | 'image';
    value: string;
  };
  visibility: 'private' | 'team' | 'organization' | 'public';
  
  // Collaboration
  members: BoardMember[];
  
  // Board settings
  settings: {
    allowComments: boolean;
    allowAttachments: boolean;
    enableAutomation: boolean;
    requireApproval: boolean;
    hipaaMode: boolean; // Enhanced security for healthcare data
  };
  
  // Templates and configuration
  cardTemplate?: Partial<Card>;
  listTemplate?: Partial<List>;
  
  // Audit and metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  
  // Activity and statistics
  activity: Activity[];
  stats?: {
    totalCards: number;
    completedCards: number;
    activeMembers: number;
    lastActivity: Date;
  };
}

export interface BoardMember {
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'observer';
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canInvite: boolean;
    canDelete: boolean;
    canExport: boolean;
  };
  joinedAt: Date;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: {
    type: 'card_moved' | 'card_labeled' | 'due_date' | 'field_changed' | 'comment_added';
    conditions: Record<string, any>;
  };
  action: {
    type: 'move_card' | 'add_label' | 'assign_user' | 'set_due_date' | 'create_notification';
    parameters: Record<string, any>;
  };
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

// Drag and drop types
export interface DragState {
  isDragging: boolean;
  draggedItem?: {
    type: 'card' | 'list';
    id: string;
    sourceId: string; // Source list ID for cards, source board ID for lists
  };
  dragOverItem?: {
    type: 'card' | 'list';
    id: string;
    position: 'above' | 'below' | 'inside';
  };
  ghostPosition?: {
    x: number;
    y: number;
  };
}

// Search and filtering
export interface SearchFilters {
  query?: string;
  labels?: string[];
  assignees?: string[];
  dueDate?: {
    start?: Date;
    end?: Date;
  };
  status?: string[];
  priority?: string[];
  customFields?: Record<string, any>;
}

export interface SearchResult {
  cards: Card[];
  totalCount: number;
  hasMore: boolean;
}

// Real-time collaboration
export interface PresenceInfo {
  userId: string;
  cursor?: {
    x: number;
    y: number;
  };
  currentCard?: string;
  isTyping?: boolean;
  lastSeen: Date;
}

// Notification system
export interface Notification {
  id: string;
  userId: string;
  type: 'mention' | 'assignment' | 'due_date' | 'card_moved' | 'comment' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  
  // Related entities
  boardId?: string;
  cardId?: string;
  
  // Actions
  actions?: {
    label: string;
    action: string;
    url?: string;
  }[];
}

// Performance and optimization
export interface ViewportInfo {
  visibleListsRange: [number, number];
  visibleCardsPerList: Record<string, [number, number]>;
  scrollPosition: {
    horizontal: number;
    vertical: number;
  };
}

// Healthcare-specific extensions will be defined in the healthcare bridge
export interface HealthcareMetadata {
  // Will be extended in healthcare bridge types
  [key: string]: any;
}