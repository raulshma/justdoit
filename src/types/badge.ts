/**
 * Badge category types
 */
export type BadgeCategory = 'streak' | 'completion' | 'behavior' | 'category';

/**
 * Badge criteria type
 */
export type BadgeCriteriaType = 'streak' | 'count' | 'time' | 'category_count';

/**
 * Time constraint for behavior badges
 */
export interface TimeConstraint {
  /** Time before which action must occur (HH:MM format) */
  before?: string;
  /** Time after which action must occur (HH:MM format) */
  after?: string;
}

/**
 * Criteria for unlocking a badge
 */
export interface BadgeCriteria {
  /** Type of criteria to evaluate */
  type: BadgeCriteriaType;
  /** Threshold value to meet */
  threshold: number;
  /** Category ID for category-specific badges */
  categoryId?: string;
  /** Time constraint for behavior badges */
  timeConstraint?: TimeConstraint;
}

/**
 * Badge definition
 */
export interface Badge {
  /** Unique badge identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of how to earn the badge */
  description: string;
  /** Emoji or icon identifier */
  icon: string;
  /** Badge category */
  category: BadgeCategory;
  /** Criteria for unlocking */
  criteria: BadgeCriteria;
  /** XP reward when unlocked */
  xpReward: number;
}

/**
 * Record of an unlocked badge
 */
export interface UnlockedBadge {
  /** Reference to the badge ID */
  badgeId: string;
  /** ISO timestamp when unlocked */
  unlockedAt: string;
}

/**
 * All available badges in the app
 */
export const BADGES: Badge[] = [
  // Streak badges
  { id: 'streak-3', name: '3-Day Streak', description: 'Complete goals for 3 days in a row', icon: '🔥', category: 'streak', criteria: { type: 'streak', threshold: 3 }, xpReward: 25 },
  { id: 'streak-7', name: 'Week Warrior', description: 'Complete goals for 7 days in a row', icon: '⚡', category: 'streak', criteria: { type: 'streak', threshold: 7 }, xpReward: 50 },
  { id: 'streak-30', name: 'Monthly Master', description: 'Complete goals for 30 days in a row', icon: '🏆', category: 'streak', criteria: { type: 'streak', threshold: 30 }, xpReward: 200 },
  { id: 'streak-100', name: 'Century Champion', description: 'Complete goals for 100 days in a row', icon: '👑', category: 'streak', criteria: { type: 'streak', threshold: 100 }, xpReward: 500 },
  
  // Completion badges
  { id: 'complete-1', name: 'First Step', description: 'Complete your first goal', icon: '🎯', category: 'completion', criteria: { type: 'count', threshold: 1 }, xpReward: 10 },
  { id: 'complete-10', name: 'Getting Started', description: 'Complete 10 goals', icon: '📈', category: 'completion', criteria: { type: 'count', threshold: 10 }, xpReward: 25 },
  { id: 'complete-50', name: 'Achiever', description: 'Complete 50 goals', icon: '🌟', category: 'completion', criteria: { type: 'count', threshold: 50 }, xpReward: 100 },
  { id: 'complete-100', name: 'Centurion', description: 'Complete 100 goals', icon: '💯', category: 'completion', criteria: { type: 'count', threshold: 100 }, xpReward: 250 },
  { id: 'complete-500', name: 'Goal Legend', description: 'Complete 500 goals', icon: '🏅', category: 'completion', criteria: { type: 'count', threshold: 500 }, xpReward: 1000 },
  
  // Behavior badges
  { id: 'early-bird', name: 'Early Bird', description: 'Complete a goal before 8 AM', icon: '🌅', category: 'behavior', criteria: { type: 'time', threshold: 1, timeConstraint: { before: '08:00' } }, xpReward: 30 },
  { id: 'night-owl', name: 'Night Owl', description: 'Complete a goal after 10 PM', icon: '🦉', category: 'behavior', criteria: { type: 'time', threshold: 1, timeConstraint: { after: '22:00' } }, xpReward: 30 },
  { id: 'perfect-week', name: 'Perfect Week', description: '100% completion for 7 consecutive days', icon: '✨', category: 'behavior', criteria: { type: 'streak', threshold: 7 }, xpReward: 150 },
  
  // Category badges
  { id: 'health-champion', name: 'Health Champion', description: 'Complete 50 Health goals', icon: '💪', category: 'category', criteria: { type: 'category_count', threshold: 50, categoryId: 'health' }, xpReward: 100 },
  { id: 'work-warrior', name: 'Work Warrior', description: 'Complete 50 Work goals', icon: '💼', category: 'category', criteria: { type: 'category_count', threshold: 50, categoryId: 'work' }, xpReward: 100 },
  { id: 'personal-pro', name: 'Personal Pro', description: 'Complete 50 Personal goals', icon: '🎨', category: 'category', criteria: { type: 'category_count', threshold: 50, categoryId: 'personal' }, xpReward: 100 },
  { id: 'learning-legend', name: 'Learning Legend', description: 'Complete 50 Learning goals', icon: '📚', category: 'category', criteria: { type: 'category_count', threshold: 50, categoryId: 'learning' }, xpReward: 100 },
];
