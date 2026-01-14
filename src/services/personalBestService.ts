import {
  PersonalBest,
  PersonalBestType,
  PersonalBestHistory,
} from '../types/personalBest';
import { storageService, StorageService } from './storageService';

/**
 * Storage keys for personal best data
 */
export const PERSONAL_BEST_STORAGE_KEYS = {
  PERSONAL_BESTS: 'personal_bests',
  PERSONAL_BEST_HISTORY: 'personal_best_history',
} as const;

/**
 * Personal Best Service Interface
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10
 */
export interface IPersonalBestService {
  // Retrieval
  getAllPersonalBests(): PersonalBest[];
  getPersonalBest(type: PersonalBestType): PersonalBest | undefined;

  // Checking and updating
  checkAndUpdatePersonalBest(
    type: PersonalBestType,
    value: number,
    metadata?: Record<string, string | number>
  ): boolean;

  // Specific checks
  checkMostGoalsInDay(completedToday: number): boolean;
  checkLongestStreak(currentStreak: number): boolean;
  checkMostXPInWeek(weeklyXP: number): boolean;
  checkFastestCompletion(durationMinutes: number): boolean;
  checkMostSubgoalsInDay(subgoalsToday: number): boolean;

  // History
  getPersonalBestHistory(type: PersonalBestType): PersonalBestHistory[];

  // Events
  onNewPersonalBest?: (
    type: PersonalBestType,
    oldValue: number,
    newValue: number
  ) => void;
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
 * Display names for personal best types
 */
export const PERSONAL_BEST_DISPLAY_NAMES: Record<PersonalBestType, string> = {
  most_goals_day: 'Most Goals in a Day',
  longest_streak: 'Longest Streak Ever',
  most_xp_week: 'Most XP in a Week',
  fastest_completion: 'Fastest Goal Completion',
  most_subgoals_day: 'Most Subgoals in a Day',
};

/**
 * PersonalBestService - Handles tracking and displaying user records
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10
 */
export class PersonalBestService implements IPersonalBestService {
  private storage: StorageService;
  public onNewPersonalBest?: (
    type: PersonalBestType,
    oldValue: number,
    newValue: number
  ) => void;

  constructor(storage?: StorageService) {
    this.storage = storage ?? storageService;
  }

  /**
   * Gets the raw MMKV storage instance
   */
  private getStorageInstance() {
    return (this.storage as any).storage;
  }


  /**
   * Retrieves all personal best records
   * Requirements: 8.2, 8.9, 8.10
   */
  getAllPersonalBests(): PersonalBest[] {
    try {
      const storage = this.getStorageInstance();
      const bestsJson = storage.getString(PERSONAL_BEST_STORAGE_KEYS.PERSONAL_BESTS);
      if (!bestsJson) {
        return [];
      }
      return JSON.parse(bestsJson) as PersonalBest[];
    } catch (error) {
      console.error('Failed to get personal bests:', error);
      return [];
    }
  }

  /**
   * Saves personal bests to storage
   * Requirements: 8.10
   */
  private savePersonalBests(bests: PersonalBest[]): void {
    try {
      const storage = this.getStorageInstance();
      storage.set(PERSONAL_BEST_STORAGE_KEYS.PERSONAL_BESTS, JSON.stringify(bests));
    } catch (error) {
      console.error('Failed to save personal bests:', error);
      throw new Error('Failed to save personal bests to storage');
    }
  }

  /**
   * Retrieves a specific personal best by type
   * Requirements: 8.2, 8.9
   */
  getPersonalBest(type: PersonalBestType): PersonalBest | undefined {
    const bests = this.getAllPersonalBests();
    return bests.find((b) => b.type === type);
  }

  /**
   * Retrieves all personal best history entries
   * Requirements: 8.8, 8.10
   */
  private getAllHistory(): PersonalBestHistory[] {
    try {
      const storage = this.getStorageInstance();
      const historyJson = storage.getString(PERSONAL_BEST_STORAGE_KEYS.PERSONAL_BEST_HISTORY);
      if (!historyJson) {
        return [];
      }
      return JSON.parse(historyJson) as PersonalBestHistory[];
    } catch (error) {
      console.error('Failed to get personal best history:', error);
      return [];
    }
  }

  /**
   * Saves personal best history to storage
   * Requirements: 8.8, 8.10
   */
  private saveHistory(history: PersonalBestHistory[]): void {
    try {
      const storage = this.getStorageInstance();
      storage.set(PERSONAL_BEST_STORAGE_KEYS.PERSONAL_BEST_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save personal best history:', error);
      throw new Error('Failed to save personal best history to storage');
    }
  }

  /**
   * Retrieves history for a specific personal best type
   * Requirements: 8.8
   */
  getPersonalBestHistory(type: PersonalBestType): PersonalBestHistory[] {
    const allHistory = this.getAllHistory();
    return allHistory
      .filter((h) => h.type === type)
      .sort((a, b) => new Date(b.newDate).getTime() - new Date(a.newDate).getTime());
  }


  /**
   * Checks and updates a personal best if the new value exceeds the current record
   * Requirements: 8.1, 8.8
   * 
   * Property 17: Personal Best Update Rule
   * For any personal best type and new value V, if V > currentBest.value,
   * then the personal best should be updated to V with the current timestamp,
   * otherwise the personal best should remain unchanged.
   * 
   * Property 18: Personal Best History Preservation
   * For any personal best that is broken (new value exceeds old), the previous
   * value and date should be added to the history array before updating the current best.
   * 
   * @param type - The type of personal best to check
   * @param value - The new value to compare
   * @param metadata - Optional metadata (e.g., streak start/end dates)
   * @returns true if a new personal best was set, false otherwise
   */
  checkAndUpdatePersonalBest(
    type: PersonalBestType,
    value: number,
    metadata?: Record<string, string | number>
  ): boolean {
    // Ignore invalid values (negative or NaN)
    if (value < 0 || Number.isNaN(value)) {
      console.warn(`Invalid personal best value: ${value} for type ${type}`);
      return false;
    }

    const currentBest = this.getPersonalBest(type);
    const now = new Date().toISOString();

    // For fastest_completion, lower is better
    const isBetterValue = type === 'fastest_completion'
      ? currentBest === undefined || value < currentBest.value
      : currentBest === undefined || value > currentBest.value;

    if (!isBetterValue) {
      return false;
    }

    // Archive previous record in history if it exists (Property 18)
    if (currentBest !== undefined) {
      const historyEntry: PersonalBestHistory = {
        type,
        previousValue: currentBest.value,
        previousDate: currentBest.achievedAt,
        newValue: value,
        newDate: now,
      };

      const history = this.getAllHistory();
      history.push(historyEntry);
      this.saveHistory(history);
    }

    // Create or update the personal best (Property 17)
    const newBest: PersonalBest = {
      id: currentBest?.id ?? generateId(),
      type,
      value,
      achievedAt: now,
      metadata,
    };

    const bests = this.getAllPersonalBests();
    const existingIndex = bests.findIndex((b) => b.type === type);

    if (existingIndex >= 0) {
      bests[existingIndex] = newBest;
    } else {
      bests.push(newBest);
    }

    this.savePersonalBests(bests);

    // Trigger notification callback (Requirement 8.1)
    if (this.onNewPersonalBest) {
      const oldValue = currentBest?.value ?? 0;
      this.onNewPersonalBest(type, oldValue, value);
    }

    return true;
  }


  /**
   * Checks if the number of goals completed today is a new personal best
   * Requirements: 8.3
   * @param completedToday - Number of goals completed today
   * @returns true if a new personal best was set
   */
  checkMostGoalsInDay(completedToday: number): boolean {
    return this.checkAndUpdatePersonalBest('most_goals_day', completedToday, {
      date: new Date().toISOString().split('T')[0],
    });
  }

  /**
   * Checks if the current streak is a new personal best
   * Requirements: 8.4
   * @param currentStreak - Current streak length in days
   * @returns true if a new personal best was set
   */
  checkLongestStreak(currentStreak: number): boolean {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - currentStreak + 1);

    return this.checkAndUpdatePersonalBest('longest_streak', currentStreak, {
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  }

  /**
   * Checks if the XP earned this week is a new personal best
   * Requirements: 8.5
   * @param weeklyXP - Total XP earned this week
   * @returns true if a new personal best was set
   */
  checkMostXPInWeek(weeklyXP: number): boolean {
    const today = new Date();
    const dayOfWeek = today.getDay();
    // Calculate start of week (Monday)
    const startOfWeek = new Date(today);
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - daysFromMonday);
    
    // Calculate end of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    return this.checkAndUpdatePersonalBest('most_xp_week', weeklyXP, {
      weekStart: startOfWeek.toISOString().split('T')[0],
      weekEnd: endOfWeek.toISOString().split('T')[0],
    });
  }

  /**
   * Checks if the goal completion time is a new personal best (fastest)
   * Requirements: 8.6
   * @param durationMinutes - Time from goal creation to completion in minutes
   * @returns true if a new personal best was set
   */
  checkFastestCompletion(durationMinutes: number): boolean {
    // For fastest completion, we want the smallest positive value
    if (durationMinutes <= 0) {
      return false;
    }

    return this.checkAndUpdatePersonalBest('fastest_completion', durationMinutes, {
      date: new Date().toISOString().split('T')[0],
    });
  }

  /**
   * Checks if the number of subgoals completed today is a new personal best
   * Requirements: 8.7
   * @param subgoalsToday - Number of subgoals completed today
   * @returns true if a new personal best was set
   */
  checkMostSubgoalsInDay(subgoalsToday: number): boolean {
    return this.checkAndUpdatePersonalBest('most_subgoals_day', subgoalsToday, {
      date: new Date().toISOString().split('T')[0],
    });
  }

  /**
   * Gets the display name for a personal best type
   */
  getDisplayName(type: PersonalBestType): string {
    return PERSONAL_BEST_DISPLAY_NAMES[type];
  }

  /**
   * Formats a personal best value for display
   */
  formatValue(type: PersonalBestType, value: number): string {
    switch (type) {
      case 'most_goals_day':
        return `${value} goal${value !== 1 ? 's' : ''}`;
      case 'longest_streak':
        return `${value} day${value !== 1 ? 's' : ''}`;
      case 'most_xp_week':
        return `${value} XP`;
      case 'fastest_completion':
        if (value < 60) {
          return `${Math.round(value)} min${value !== 1 ? 's' : ''}`;
        }
        const hours = Math.floor(value / 60);
        const mins = Math.round(value % 60);
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
      case 'most_subgoals_day':
        return `${value} subgoal${value !== 1 ? 's' : ''}`;
      default:
        return String(value);
    }
  }

  /**
   * Resets personal best data (useful for testing)
   */
  reset(): void {
    try {
      const storage = this.getStorageInstance();
      storage.delete(PERSONAL_BEST_STORAGE_KEYS.PERSONAL_BESTS);
      storage.delete(PERSONAL_BEST_STORAGE_KEYS.PERSONAL_BEST_HISTORY);
    } catch (error) {
      console.error('Failed to reset personal best data:', error);
    }
  }
}

// Export singleton instance for app-wide use
export const personalBestService = new PersonalBestService();
