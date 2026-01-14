/**
 * Subgoal entity representing a smaller actionable step within a parent goal
 */
export interface Subgoal {
  /** UUID v4 unique identifier */
  id: string;
  /** Reference to the parent goal */
  parentGoalId: string;
  /** Subgoal title (required, 1-200 chars) */
  title: string;
  /** Optional description (max 500 chars) */
  description?: string;
  /** Completion status */
  isCompleted: boolean;
  /** Whether this subgoal is a significant milestone */
  isMilestone: boolean;
  /** Display order within parent goal */
  order: number;
  /** ISO timestamp when completed */
  completedAt?: string;
  /** ISO timestamp when created */
  createdAt: string;
}

/**
 * Progress calculation result for a parent goal's subgoals
 */
export interface SubgoalProgress {
  /** Number of completed subgoals */
  completed: number;
  /** Total number of subgoals */
  total: number;
  /** Completion percentage (0-100) */
  percentage: number;
}
