import { Priority, RecurrenceType } from './goal';

/**
 * Parsed goal from voice command
 */
export interface ParsedVoiceGoal {
  /** The extracted goal title (actionable) */
  title: string;
  /** Any extra details extracted */
  description?: string;
  /** ISO date string or relative (e.g., 'today', 'tomorrow') */
  dueDate?: string;
  /** Estimated duration in minutes */
  duration?: number;
  /** Extracted priority */
  priority?: Priority;
  /** Suggested category ID */
  categoryId?: string;
  /** Recurrence pattern if detected */
  recurrence?: RecurrenceType;
  /** Confidence score of parsing (0-1) */
  confidence: number;
  /** The original voice transcript */
  originalTranscript: string;
}

/**
 * Intent of the voice command
 */
export interface VoiceCommandIntent {
  action: 'create_goal' | 'complete_goal' | 'list_goals' | 'unknown';
  confidence: number;
}
