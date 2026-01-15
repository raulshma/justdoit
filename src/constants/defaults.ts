import { AppSettings, Statistics } from '../types';

/**
 * Default reminder time for daily notifications
 */
export const DEFAULT_REMINDER_TIME = '20:00';

/**
 * Default application settings
 * Single source of truth for initial settings state
 */
export const DEFAULT_SETTINGS: AppSettings = {
  dailyReminderEnabled: true,
  dailyReminderTime: DEFAULT_REMINDER_TIME,
  notificationsEnabled: true,
  darkModeEnabled: false,
  colorPalette: 'default',
  openRouterApiKey: undefined,
  selectedAiModel: undefined,
  smartRemindersEnabled: false,
  focusModeEnabled: false,
  carryForwardEnabled: true,
  calendarIntegrationEnabled: false,
  gamificationEnabled: true,
  showTabBarLabels: false,
  hasCompletedOnboarding: false,
  minimalGoalsView: false,
};

/**
 * Default statistics
 * Single source of truth for initial statistics state
 */
export const DEFAULT_STATISTICS: Statistics = {
  todayCompleted: 0,
  todayTotal: 0,
  weeklyCompletionRate: 0,
  currentStreak: 0,
  longestStreak: 0,
  last7DaysCompletions: [0, 0, 0, 0, 0, 0, 0],
  averagePerDay: 0,
  completionsByHour: new Array(24).fill(0),
  completionsByDayOfWeek: new Array(7).fill(0),
  peakHours: [],
  lowPerformanceDays: [],
};
