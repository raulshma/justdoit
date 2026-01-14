import { UnlockedBadge } from './badge';
import { Challenge } from './challenge';
import { PersonalBest, PersonalBestHistory } from './personalBest';
import { XPTransaction } from './xp';

/**
 * Complete gamification state for a user
 */
export interface GamificationState {
  // XP and Levels
  /** Total accumulated XP */
  totalXP: number;
  /** Current level */
  currentLevel: number;
  /** History of XP transactions */
  xpHistory: XPTransaction[];
  
  // Badges
  /** List of unlocked badges */
  unlockedBadges: UnlockedBadge[];
  
  // Challenges
  /** Currently active challenges */
  activeChallenges: Challenge[];
  /** History of past challenges */
  challengeHistory: Challenge[];
  
  // Personal Bests
  /** Current personal best records */
  personalBests: PersonalBest[];
  /** History of broken personal bests */
  personalBestHistory: PersonalBestHistory[];
  
  // Statistics for gamification
  /** Total goals completed all-time */
  totalGoalsCompleted: number;
  /** Goals completed by category ID */
  goalsCompletedByCategory: Record<string, number>;
  /** Current streak in days */
  currentStreak: number;
  /** Longest streak ever achieved */
  longestStreak: number;
}

/**
 * Default initial gamification state
 */
export const DEFAULT_GAMIFICATION_STATE: GamificationState = {
  totalXP: 0,
  currentLevel: 1,
  xpHistory: [],
  unlockedBadges: [],
  activeChallenges: [],
  challengeHistory: [],
  personalBests: [],
  personalBestHistory: [],
  totalGoalsCompleted: 0,
  goalsCompletedByCategory: {},
  currentStreak: 0,
  longestStreak: 0,
};

/**
 * Game event types for triggering gamification evaluations
 */
export type GameEventType =
  | 'goal_completed'
  | 'subgoal_completed'
  | 'streak_updated'
  | 'day_completed'
  | 'week_completed';

/**
 * Game event payload for gamification triggers
 */
export interface GameEvent {
  /** Event type */
  type: GameEventType;
  /** ISO timestamp when event occurred */
  timestamp: string;
  /** Event-specific data */
  data: Record<string, string | number | boolean>;
}
