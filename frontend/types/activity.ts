export enum ActivityType {
  TASK = 'TASK',
  EMAIL = 'EMAIL',
  CALL = 'CALL',
  MEETING = 'MEETING',
  NOTE = 'NOTE',
}

export enum ActivityStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ActivityPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Activity {
  id: string;
  activityId: string;

  // Basic Information
  subject: string;
  type: ActivityType;
  status: ActivityStatus;
  priority: ActivityPriority;
  description?: string;

  // Scheduling
  scheduledDate?: string;
  dueDate?: string;
  completedDate?: string;
  durationMinutes?: number;
  location?: string;

  // Related Entities
  leadId?: string;
  leadName?: string;
  contactId?: string;
  contactName?: string;
  accountId?: string;
  accountName?: string;
  opportunityId?: string;
  opportunityName?: string;

  // Assignment
  assignedToId?: string;
  assignedToName?: string;
  participants?: string[];

  // Email Specific
  emailFrom?: string;
  emailTo?: string;
  emailCc?: string[];
  emailBcc?: string[];
  emailSubject?: string;

  // Call Specific
  phoneNumber?: string;
  callDirection?: string;
  callOutcome?: string;
  callDuration?: number;

  // Meeting Specific
  meetingLink?: string;
  meetingType?: string;
  attendees?: string[];

  // Task Specific
  taskCategory?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;

  // Additional Information
  tags?: string[];
  outcome?: string;
  nextSteps?: string;
  isPrivate?: boolean;
  reminderSet?: boolean;
  reminderDate?: string;

  // System Fields
  createdAt: string;
  createdBy: string;
  createdByName: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
  lastModifiedByName: string;
}

export interface CreateActivityRequest {
  subject: string;
  type: ActivityType;
  status: ActivityStatus;
  priority?: ActivityPriority;
  description?: string;

  // Scheduling
  scheduledDate?: string;
  dueDate?: string;
  durationMinutes?: number;
  location?: string;

  // Related Entities
  leadId?: string;
  contactId?: string;
  accountId?: string;
  opportunityId?: string;

  // Assignment
  assignedToId?: string;
  participants?: string[];

  // Email Specific
  emailFrom?: string;
  emailTo?: string;
  emailCc?: string[];
  emailBcc?: string[];
  emailSubject?: string;

  // Call Specific
  phoneNumber?: string;
  callDirection?: string;
  callOutcome?: string;
  callDuration?: number;

  // Meeting Specific
  meetingLink?: string;
  meetingType?: string;
  attendees?: string[];

  // Task Specific
  taskCategory?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;

  // Additional
  tags?: string[];
  outcome?: string;
  nextSteps?: string;
  isPrivate?: boolean;
  reminderSet?: boolean;
  reminderDate?: string;
}

export interface UpdateActivityRequest {
  subject?: string;
  type?: ActivityType;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  description?: string;

  // Scheduling
  scheduledDate?: string;
  dueDate?: string;
  completedDate?: string;
  durationMinutes?: number;
  location?: string;

  // Related Entities
  leadId?: string;
  contactId?: string;
  accountId?: string;
  opportunityId?: string;

  // Assignment
  assignedToId?: string;
  participants?: string[];

  // Email Specific
  emailFrom?: string;
  emailTo?: string;
  emailCc?: string[];
  emailBcc?: string[];
  emailSubject?: string;

  // Call Specific
  phoneNumber?: string;
  callDirection?: string;
  callOutcome?: string;
  callDuration?: number;

  // Meeting Specific
  meetingLink?: string;
  meetingType?: string;
  attendees?: string[];

  // Task Specific
  taskCategory?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;

  // Additional
  tags?: string[];
  outcome?: string;
  nextSteps?: string;
  isPrivate?: boolean;
  reminderSet?: boolean;
  reminderDate?: string;
}

export interface ActivityStatistics {
  // Total counts
  totalActivities: number;
  activeActivities: number;
  completedActivities: number;
  cancelledActivities: number;
  overdueActivities: number;

  // By type
  taskCount: number;
  emailCount: number;
  callCount: number;
  meetingCount: number;
  noteCount: number;

  // By status
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;

  // By priority
  urgentCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;

  // Time metrics
  averageDurationMinutes: number;
  totalCallDuration: number;
  totalMeetingDuration: number;
}
