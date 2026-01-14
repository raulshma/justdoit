/**
 * Record of a goal postponement action
 */
export interface PostponeRecord {
  /** Reference to the postponed goal */
  goalId: string;
  /** Original due date before postponement (ISO date string) */
  originalDate: string;
  /** New due date after postponement (ISO date string) */
  newDate: string;
  /** ISO timestamp when postponement occurred */
  postponedAt: string;
  /** Optional reason for postponement */
  reason?: string;
}
