/**
 * Centralized storage keys for MMKV persistence
 * All storage keys used throughout the app should be defined here
 */

// Core data storage keys
export const STORAGE_KEYS = {
  GOALS: 'goals',
  SETTINGS: 'settings',
  STATISTICS: 'statistics',
  STREAK_DATA: 'streakData',
  FOCUS_SESSIONS: 'focus_sessions',
} as const;

// XP and leveling storage keys
export const XP_STORAGE_KEYS = {
  TOTAL_XP: 'xp_total',
  XP_HISTORY: 'xp_history',
  CURRENT_LEVEL: 'xp_current_level',
} as const;

// Template storage key
export const TEMPLATES_STORAGE_KEY = 'custom_templates';

// Challenge storage keys
export const CHALLENGE_STORAGE_KEYS = {
  ACTIVE_CHALLENGES: 'challenges_active',
  CHALLENGE_HISTORY: 'challenges_history',
  USER_PERFORMANCE: 'challenges_user_performance',
} as const;

// Category storage key
export const CATEGORIES_STORAGE_KEY = 'categories';

// AI logs storage key
export const AI_LOGS_STORAGE_KEY = 'ai_logs';

// Achievement/badge storage keys
export const ACHIEVEMENT_STORAGE_KEYS = {
  UNLOCKED_BADGES: 'achievement_unlocked_badges',
  BADGE_PROGRESS: 'achievement_badge_progress',
} as const;

// Personal best storage keys
export const PERSONAL_BEST_STORAGE_KEYS = {
  PERSONAL_BESTS: 'personal_bests',
  PERSONAL_BEST_HISTORY: 'personal_best_history',
} as const;
