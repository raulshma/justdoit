/**
 * Streak multiplier configuration
 */
export interface StreakMultiplier {
  /** Minimum streak days to apply this multiplier */
  days: number;
  /** Multiplier value */
  multiplier: number;
}

/**
 * XP system configuration
 */
export interface XPConfig {
  /** Base XP for completing a regular goal */
  baseGoalXP: number;
  /** Bonus XP for high-priority goals */
  highPriorityBonus: number;
  /** XP per completed subgoal */
  subgoalXP: number;
  /** Bonus XP for completing parent goal with subgoals */
  parentCompletionBonus: number;
  /** Streak multiplier tiers */
  streakMultipliers: StreakMultiplier[];
}

/**
 * Level definition with XP threshold and rewards
 */
export interface LevelDefinition {
  /** Level number */
  level: number;
  /** Total XP required to reach this level */
  xpRequired: number;
  /** Optional rewards unlocked at this level */
  rewards?: string[];
}

/**
 * Record of an XP transaction
 */
export interface XPTransaction {
  /** UUID v4 unique identifier */
  id: string;
  /** XP amount (before multiplier) */
  amount: number;
  /** Reason for XP award */
  reason: string;
  /** Multiplier applied (streak bonus) */
  multiplier: number;
  /** ISO timestamp when awarded */
  timestamp: string;
}

/**
 * Default XP configuration
 */
export const DEFAULT_XP_CONFIG: XPConfig = {
  baseGoalXP: 10,
  highPriorityBonus: 5,
  subgoalXP: 5,
  parentCompletionBonus: 10,
  streakMultipliers: [
    { days: 7, multiplier: 1.5 },
    { days: 30, multiplier: 2.0 },
    { days: 100, multiplier: 2.5 },
  ],
};

/**
 * Level definitions with XP thresholds
 * Formula for levels beyond 10: xpRequired = 100 * level * (level + 1) / 2
 */
export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  { level: 1, xpRequired: 0 },
  { level: 2, xpRequired: 100 },
  { level: 3, xpRequired: 300 },
  { level: 4, xpRequired: 600 },
  { level: 5, xpRequired: 1000, rewards: ['theme-sunset'] },
  { level: 6, xpRequired: 1500 },
  { level: 7, xpRequired: 2100 },
  { level: 8, xpRequired: 2800 },
  { level: 9, xpRequired: 3600 },
  { level: 10, xpRequired: 4500, rewards: ['theme-ocean'] },
  { level: 11, xpRequired: 5500 },
  { level: 12, xpRequired: 6600 },
  { level: 13, xpRequired: 7800 },
  { level: 14, xpRequired: 9100 },
  { level: 15, xpRequired: 10500, rewards: ['theme-forest'] },
  { level: 16, xpRequired: 12000 },
  { level: 17, xpRequired: 13600 },
  { level: 18, xpRequired: 15300 },
  { level: 19, xpRequired: 17100 },
  { level: 20, xpRequired: 19000, rewards: ['theme-galaxy'] },
];
