import { Subgoal } from './subgoal';

/**
 * Goal priority levels
 */
export type Priority = 'low' | 'medium' | 'high';

/**
 * Recurrence pattern types
 */
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'custom';

/**
 * Recurrence pattern configuration
 */
export interface RecurrencePattern {
  type: RecurrenceType;
  /** Days of week (0-6 for Sunday-Saturday) for weekly/custom patterns */
  daysOfWeek?: number[];
  /** Reference to original recurring goal */
  parentGoalId?: string;
}

/**
 * Goal entity representing a task or objective the user wants to accomplish
 */
export interface Goal {
  /** UUID v4 unique identifier */
  id: string;
  /** Goal title (required, 1-200 chars) */
  title: string;
  /** Optional description (max 1000 chars) */
  description?: string;
  /** ISO date string (YYYY-MM-DD) */
  dueDate: string;
  /** ISO timestamp when created */
  createdAt: string;
  /** ISO timestamp when completed */
  completedAt?: string;
  /** Completion status */
  isCompleted: boolean;
  /** Priority level */
  priority: Priority;
  /** Recurrence configuration */
  recurrence: RecurrencePattern;
  /** Expo notification identifier */
  reminderId?: string;
  /** ISO timestamp for reminder */
  reminderTime?: string;
  /** True if this goal was carried forward from a previous day */
  carriedForward?: boolean;
  /** Original due date before carry-forward */
  originalDueDate?: string;
  /** Number of times this goal has been carried forward */
  carryForwardCount?: number;
  
  // Productivity feature fields
  /** Associated category ID */
  categoryId?: string;
  /** Subgoals for this goal */
  subgoals?: Subgoal[];
  /** Template ID if created from a template */
  templateId?: string;
  /** Number of times this goal has been postponed */
  postponeCount?: number;
  /** ISO timestamp when last postponed */
  lastPostponedAt?: string;
  /** Optional attached image URI (local file path) */
  imageUri?: string;
  /** Optional voice note audio file URI (local file path) */
  voiceNoteUri?: string;
  /** Duration of voice note in seconds */
  voiceNoteDuration?: number;
}
