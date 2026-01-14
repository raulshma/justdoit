/**
 * Statistics for tracking user progress and productivity
 */
export interface Statistics {
  /** Number of goals completed today */
  todayCompleted: number;
  /** Total number of goals for today */
  todayTotal: number;
  /** Completion rate for the current week (percentage) */
  weeklyCompletionRate: number;
  /** Consecutive days with at least one goal completed */
  currentStreak: number;
  /** Longest streak ever achieved */
  longestStreak: number;
  /** Daily completion counts for the past 7 days */
  last7DaysCompletions: number[];
  /** Average goals completed per day over past 30 days */
  averagePerDay: number;
  /** Completions by hour (0-23) */
  completionsByHour: number[];
  /** Completions by day of week (0-6) */
  completionsByDayOfWeek: number[];
  /** Peak productive hours (top 3) */
  peakHours: number[];
  /** Days with lowest completion rates */
  lowPerformanceDays: number[];
}
