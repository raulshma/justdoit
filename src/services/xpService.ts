import {
  XPTransaction,
  LevelDefinition,
  LEVEL_DEFINITIONS,
  DEFAULT_XP_CONFIG,
  XPConfig,
} from '../types/xp';
import { Goal } from '../types/goal';
import { storageService, StorageService } from './storageService';
import { XP_STORAGE_KEYS } from '../constants';

// Re-export XP_STORAGE_KEYS for backward compatibility
export { XP_STORAGE_KEYS } from '../constants';

/**
 * XP Service Interface
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.8, 6.9
 */
export interface IXPService {
  // XP state
  getTotalXP(): number;
  getCurrentLevel(): number;
  getXPToNextLevel(): number;
  getLevelProgress(): { current: number; required: number; percentage: number };

  // XP operations
  awardXP(amount: number, reason: string, streakDays?: number): XPTransaction;
  calculateGoalXP(goal: Goal, currentStreak: number): number;
  getStreakMultiplier(streakDays: number): number;

  // Level operations
  getLevelDefinition(level: number): LevelDefinition | undefined;
  getUnlockedRewards(): string[];

  // History
  getXPHistory(limit?: number): XPTransaction[];
  getXPForPeriod(startDate: Date, endDate: Date): number;

  // Events
  onLevelUp?: (newLevel: number, rewards: string[]) => void;
}

/**
 * Generates a UUID v4
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * XPService - Handles XP calculations, level progression, and rewards
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.8, 6.9
 */
export class XPService implements IXPService {
  private storage: StorageService;
  private config: XPConfig;
  public onLevelUp?: (newLevel: number, rewards: string[]) => void;

  constructor(storage?: StorageService, config?: XPConfig) {
    this.storage = storage ?? storageService;
    this.config = config ?? DEFAULT_XP_CONFIG;
  }

  /**
   * Gets the raw MMKV storage instance for XP operations
   */
  private getStorageInstance() {
    return (this.storage as any).storage;
  }

  /**
   * Retrieves total accumulated XP
   * Requirements: 6.5, 6.9
   */
  getTotalXP(): number {
    try {
      const storage = this.getStorageInstance();
      const totalXP = storage.getNumber(XP_STORAGE_KEYS.TOTAL_XP);
      return totalXP ?? 0;
    } catch (error) {
      console.error('Failed to get total XP:', error);
      return 0;
    }
  }

  /**
   * Saves total XP to storage
   */
  private saveTotalXP(totalXP: number): void {
    try {
      const storage = this.getStorageInstance();
      storage.set(XP_STORAGE_KEYS.TOTAL_XP, totalXP);
    } catch (error) {
      console.error('Failed to save total XP:', error);
      throw new Error('Failed to save total XP to storage');
    }
  }

  /**
   * Retrieves XP transaction history
   * Requirements: 6.9
   */
  getXPHistory(limit?: number): XPTransaction[] {
    try {
      const storage = this.getStorageInstance();
      const historyJson = storage.getString(XP_STORAGE_KEYS.XP_HISTORY);
      if (!historyJson) {
        return [];
      }
      const history = JSON.parse(historyJson) as XPTransaction[];
      // Sort by timestamp descending (most recent first)
      history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return limit ? history.slice(0, limit) : history;
    } catch (error) {
      console.error('Failed to get XP history:', error);
      return [];
    }
  }

  /**
   * Saves XP transaction history
   */
  private saveXPHistory(history: XPTransaction[]): void {
    try {
      const storage = this.getStorageInstance();
      storage.set(XP_STORAGE_KEYS.XP_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save XP history:', error);
      throw new Error('Failed to save XP history to storage');
    }
  }

  /**
   * Calculates current level based on total XP
   * Requirements: 6.5, 6.7
   */
  getCurrentLevel(): number {
    const totalXP = this.getTotalXP();
    return this.calculateLevelFromXP(totalXP);
  }

  /**
   * Calculates level from XP amount
   * Returns the highest level L where LEVEL_DEFINITIONS[L].xpRequired <= totalXP
   */
  private calculateLevelFromXP(xp: number): number {
    let level = 1;
    for (const def of LEVEL_DEFINITIONS) {
      if (xp >= def.xpRequired) {
        level = def.level;
      } else {
        break;
      }
    }
    return level;
  }

  /**
   * Gets XP required to reach the next level
   * Requirements: 6.5
   */
  getXPToNextLevel(): number {
    const totalXP = this.getTotalXP();
    const currentLevel = this.getCurrentLevel();
    const nextLevelDef = this.getLevelDefinition(currentLevel + 1);
    
    if (!nextLevelDef) {
      // Max level reached
      return 0;
    }
    
    return nextLevelDef.xpRequired - totalXP;
  }

  /**
   * Gets progress towards next level
   * Requirements: 6.5
   */
  getLevelProgress(): { current: number; required: number; percentage: number } {
    const totalXP = this.getTotalXP();
    const currentLevel = this.getCurrentLevel();
    const currentLevelDef = this.getLevelDefinition(currentLevel);
    const nextLevelDef = this.getLevelDefinition(currentLevel + 1);

    if (!currentLevelDef) {
      return { current: 0, required: 0, percentage: 0 };
    }

    if (!nextLevelDef) {
      // Max level reached
      return { current: totalXP - currentLevelDef.xpRequired, required: 0, percentage: 100 };
    }

    const xpInCurrentLevel = totalXP - currentLevelDef.xpRequired;
    const xpRequiredForNextLevel = nextLevelDef.xpRequired - currentLevelDef.xpRequired;
    const percentage = xpRequiredForNextLevel > 0 
      ? Math.min(100, (xpInCurrentLevel / xpRequiredForNextLevel) * 100)
      : 100;

    return {
      current: xpInCurrentLevel,
      required: xpRequiredForNextLevel,
      percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
    };
  }

  /**
   * Awards XP to the user
   * Requirements: 6.1, 6.4, 6.5, 6.9
   * @param amount - Base XP amount (before multiplier)
   * @param reason - Reason for XP award
   * @param streakDays - Current streak days for multiplier calculation
   * @returns The XP transaction record
   */
  awardXP(amount: number, reason: string, streakDays: number = 0): XPTransaction {
    if (amount <= 0) {
      throw new Error('XP amount must be positive');
    }

    const previousLevel = this.getCurrentLevel();
    const multiplier = this.getStreakMultiplier(streakDays);
    const finalAmount = Math.round(amount * multiplier);

    // Create transaction record
    const transaction: XPTransaction = {
      id: generateId(),
      amount: finalAmount,
      reason,
      multiplier,
      timestamp: new Date().toISOString(),
    };

    // Update total XP
    const newTotalXP = this.getTotalXP() + finalAmount;
    this.saveTotalXP(newTotalXP);

    // Add to history
    const history = this.getXPHistory();
    history.push(transaction);
    this.saveXPHistory(history);

    // Check for level up
    const newLevel = this.calculateLevelFromXP(newTotalXP);
    if (newLevel > previousLevel && this.onLevelUp) {
      const levelDef = this.getLevelDefinition(newLevel);
      const rewards = levelDef?.rewards ?? [];
      this.onLevelUp(newLevel, rewards);
    }

    return transaction;
  }

  /**
   * Calculates XP for completing a goal
   * Requirements: 6.1, 6.2, 6.3, 6.4
   * Formula: baseXP + priorityBonus + (subgoalXP × completedSubgoals) + parentBonus
   * All multiplied by streak multiplier
   * @param goal - The completed goal
   * @param currentStreak - Current streak days
   * @returns Total XP to award (before multiplier)
   */
  calculateGoalXP(goal: Goal, currentStreak: number): number {
    let baseXP = this.config.baseGoalXP;

    // Add priority bonus for high-priority goals (Requirement 6.2)
    if (goal.priority === 'high') {
      baseXP += this.config.highPriorityBonus;
    }

    // Add XP for completed subgoals (Requirement 6.3)
    const subgoals = goal.subgoals ?? [];
    const completedSubgoals = subgoals.filter((s) => s.isCompleted).length;
    const subgoalXP = completedSubgoals * this.config.subgoalXP;

    // Add parent completion bonus if goal has subgoals (Requirement 6.3)
    const parentBonus = subgoals.length > 0 ? this.config.parentCompletionBonus : 0;

    const totalBaseXP = baseXP + subgoalXP + parentBonus;

    // Apply streak multiplier (Requirement 6.4)
    const multiplier = this.getStreakMultiplier(currentStreak);
    
    return Math.round(totalBaseXP * multiplier);
  }

  /**
   * Gets the streak multiplier based on streak days
   * Requirements: 6.4
   * @param streakDays - Number of consecutive days
   * @returns Multiplier value (1.0 for <7 days, 1.5 for 7-29 days, 2.0 for 30+ days)
   */
  getStreakMultiplier(streakDays: number): number {
    if (streakDays < 0) {
      return 1.0;
    }

    let multiplier = 1.0;
    for (const tier of this.config.streakMultipliers) {
      if (streakDays >= tier.days) {
        multiplier = tier.multiplier;
      }
    }
    return multiplier;
  }

  /**
   * Gets level definition by level number
   * Requirements: 6.7
   * @param level - Level number
   * @returns Level definition or undefined if not found
   */
  getLevelDefinition(level: number): LevelDefinition | undefined {
    return LEVEL_DEFINITIONS.find((def) => def.level === level);
  }

  /**
   * Gets all unlocked rewards based on current level
   * Requirements: 6.8
   * @returns Array of reward identifiers
   */
  getUnlockedRewards(): string[] {
    const currentLevel = this.getCurrentLevel();
    const rewards: string[] = [];

    for (const def of LEVEL_DEFINITIONS) {
      if (def.level <= currentLevel && def.rewards) {
        rewards.push(...def.rewards);
      }
    }

    return rewards;
  }

  /**
   * Gets total XP earned within a date range
   * Requirements: 6.9
   * @param startDate - Start of period
   * @param endDate - End of period
   * @returns Total XP earned in the period
   */
  getXPForPeriod(startDate: Date, endDate: Date): number {
    const history = this.getXPHistory();
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    return history
      .filter((tx) => {
        const txTime = new Date(tx.timestamp).getTime();
        return txTime >= startTime && txTime <= endTime;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  /**
   * Resets XP data (useful for testing)
   */
  reset(): void {
    try {
      const storage = this.getStorageInstance();
      storage.delete(XP_STORAGE_KEYS.TOTAL_XP);
      storage.delete(XP_STORAGE_KEYS.XP_HISTORY);
      storage.delete(XP_STORAGE_KEYS.CURRENT_LEVEL);
    } catch (error) {
      console.error('Failed to reset XP data:', error);
    }
  }
}

// Export singleton instance for app-wide use
export const xpService = new XPService();
