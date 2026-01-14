/**
 * Personal best record types
 */
export type PersonalBestType =
  | 'most_goals_day'        // Most goals completed in a single day
  | 'longest_streak'        // Longest consecutive day streak
  | 'most_xp_week'          // Most XP earned in a week
  | 'fastest_completion'    // Fastest goal completion (creation to done)
  | 'most_subgoals_day';    // Most subgoals completed in a day

/**
 * Personal best record
 */
export interface PersonalBest {
  /** Unique identifier */
  id: string;
  /** Type of personal best */
  type: PersonalBestType;
  /** Record value */
  value: number;
  /** ISO timestamp when achieved */
  achievedAt: string;
  /** Additional metadata (e.g., streak start/end dates) */
  metadata?: Record<string, string | number>;
}

/**
 * History entry for a broken personal best
 */
export interface PersonalBestHistory {
  /** Type of personal best */
  type: PersonalBestType;
  /** Previous record value */
  previousValue: number;
  /** ISO timestamp of previous record */
  previousDate: string;
  /** New record value */
  newValue: number;
  /** ISO timestamp of new record */
  newDate: string;
}
