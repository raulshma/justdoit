/**
 * Focus Session types for Pomodoro/Focus Timer feature
 */

/**
 * Ambient sound options for focus sessions
 */
export type AmbientSound = 'rain' | 'forest' | 'cafe' | 'waves' | 'none';

/**
 * Focus session type (work or break)
 */
export type FocusSessionType = 'work' | 'shortBreak' | 'longBreak';

/**
 * Timer state for focus sessions
 */
export type FocusTimerState = 'idle' | 'running' | 'paused' | 'break';

/**
 * Focus session record for tracking history
 */
export interface FocusSession {
  /** UUID v4 unique identifier */
  id: string;
  /** Linked goal ID (optional) */
  goalId?: string;
  /** Snapshot of goal title at time of session */
  goalTitle?: string;
  /** ISO timestamp when session started */
  startTime: string;
  /** ISO timestamp when session ended */
  endTime?: string;
  /** Actual duration in seconds */
  duration: number;
  /** Target duration in seconds */
  plannedDuration: number;
  /** Whether the full session was completed */
  completed: boolean;
  /** Type of session */
  type: FocusSessionType;
  /** Date of session (YYYY-MM-DD) */
  date: string;
}

/**
 * Focus timer settings stored in AppSettings
 */
export interface FocusTimerSettings {
  /** Work session duration in minutes */
  workDuration: number;
  /** Short break duration in minutes */
  shortBreakDuration: number;
  /** Long break duration in minutes */
  longBreakDuration: number;
  /** Number of work sessions until long break */
  sessionsUntilLongBreak: number;
  /** Enable break reminder notifications */
  breakRemindersEnabled: boolean;
  /** Enable ambient sounds */
  ambientSoundEnabled: boolean;
  /** Selected ambient sound */
  ambientSound: AmbientSound;
  /** Auto-complete goals after reaching session threshold */
  autoCompleteEnabled: boolean;
}

/**
 * Default focus timer settings
 */
export const DEFAULT_FOCUS_TIMER_SETTINGS: FocusTimerSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  breakRemindersEnabled: true,
  ambientSoundEnabled: false,
  ambientSound: 'none',
  autoCompleteEnabled: false,
};

/**
 * Focus session statistics
 */
export interface FocusStats {
  /** Total completed sessions */
  totalSessions: number;
  /** Total focus time in minutes */
  totalMinutes: number;
  /** Sessions completed today */
  todaySessions: number;
  /** Focus time today in minutes */
  todayMinutes: number;
  /** Current focus streak (consecutive days) */
  currentStreak: number;
}
