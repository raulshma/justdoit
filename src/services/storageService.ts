import { createMMKV, type MMKV } from 'react-native-mmkv';
import { Goal, AppSettings, Statistics } from '../types';

/**
 * Storage keys for MMKV persistence
 */
export const STORAGE_KEYS = {
  GOALS: 'goals',
  SETTINGS: 'settings',
  STATISTICS: 'statistics',
  STREAK_DATA: 'streakData',
} as const;

/**
 * Default application settings
 */
const DEFAULT_SETTINGS: AppSettings = {
  dailyReminderEnabled: true,
  dailyReminderTime: '20:00',
  notificationsEnabled: true,
  darkModeEnabled: false,
  colorPalette: 'default',
  openRouterApiKey: undefined,
  selectedAiModel: undefined,
  smartRemindersEnabled: false,
  focusModeEnabled: false,
  carryForwardEnabled: true,
};

/**
 * Default statistics
 */
const DEFAULT_STATISTICS: Statistics = {
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

/**
 * Storage Service Interface
 */
export interface IStorageService {
  saveGoal(goal: Goal): void;
  getGoal(id: string): Goal | null;
  getAllGoals(): Goal[];
  deleteGoal(id: string): void;
  saveSettings(settings: AppSettings): void;
  getSettings(): AppSettings;
  saveStatistics(stats: Statistics): void;
  getStatistics(): Statistics;
}

/**
 * StorageService - Handles all data persistence using MMKV
 * Implements JSON serialization/deserialization with error handling
 */
export class StorageService implements IStorageService {
  private storage: MMKV;

  constructor(storage?: MMKV) {
    this.storage = storage ?? createMMKV({ id: 'daily-goals-storage' });
  }

  /**
   * Saves a goal to storage
   * If goal with same ID exists, it will be updated
   * @param goal - The goal to save
   * Requirements: 1.4, 8.1, 8.4
   */
  saveGoal(goal: Goal): void {
    try {
      const goals = this.getAllGoals();
      const existingIndex = goals.findIndex((g) => g.id === goal.id);

      if (existingIndex >= 0) {
        goals[existingIndex] = goal;
      } else {
        goals.push(goal);
      }

      this.storage.set(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (error) {
      console.error('Failed to save goal:', error);
      throw new Error('Failed to save goal to storage');
    }
  }

  /**
   * Retrieves a goal by ID
   * @param id - The goal ID to retrieve
   * @returns The goal if found, null otherwise
   * Requirements: 2.1, 8.2, 8.5
   */
  getGoal(id: string): Goal | null {
    try {
      const goals = this.getAllGoals();
      return goals.find((g) => g.id === id) ?? null;
    } catch (error) {
      console.error('Failed to get goal:', error);
      return null;
    }
  }

  /**
   * Retrieves all goals from storage
   * @returns Array of all goals, empty array if none or on error
   * Requirements: 2.1, 8.2, 8.3, 8.5
   */
  getAllGoals(): Goal[] {
    try {
      const goalsJson = this.storage.getString(STORAGE_KEYS.GOALS);
      if (!goalsJson) {
        return [];
      }
      return JSON.parse(goalsJson) as Goal[];
    } catch (error) {
      console.error('Failed to get all goals:', error);
      // Return empty array on parse error (Requirement 8.3)
      return [];
    }
  }

  /**
   * Deletes a goal by ID
   * @param id - The goal ID to delete
   * Requirements: 8.1
   */
  deleteGoal(id: string): void {
    try {
      const goals = this.getAllGoals();
      const filteredGoals = goals.filter((g) => g.id !== id);
      this.storage.set(STORAGE_KEYS.GOALS, JSON.stringify(filteredGoals));
    } catch (error) {
      console.error('Failed to delete goal:', error);
      throw new Error('Failed to delete goal from storage');
    }
  }

  /**
   * Saves application settings
   * @param settings - The settings to save
   * Requirements: 8.1, 8.4
   */
  saveSettings(settings: AppSettings): void {
    try {
      this.storage.set(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw new Error('Failed to save settings to storage');
    }
  }

  /**
   * Retrieves application settings
   * @returns The settings, or default settings if not found or on error
   * Requirements: 8.2, 8.3, 8.5
   */
  getSettings(): AppSettings {
    try {
      const settingsJson = this.storage.getString(STORAGE_KEYS.SETTINGS);
      if (!settingsJson) {
        return { ...DEFAULT_SETTINGS };
      }
      return JSON.parse(settingsJson) as AppSettings;
    } catch (error) {
      console.error('Failed to get settings:', error);
      // Return default settings on parse error (Requirement 8.3)
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Saves statistics data
   * @param stats - The statistics to save
   */
  saveStatistics(stats: Statistics): void {
    try {
      this.storage.set(STORAGE_KEYS.STATISTICS, JSON.stringify(stats));
    } catch (error) {
      console.error('Failed to save statistics:', error);
      throw new Error('Failed to save statistics to storage');
    }
  }

  /**
   * Retrieves statistics data
   * @returns The statistics, or default statistics if not found or on error
   */
  getStatistics(): Statistics {
    try {
      const statsJson = this.storage.getString(STORAGE_KEYS.STATISTICS);
      if (!statsJson) {
        return { ...DEFAULT_STATISTICS };
      }
      return JSON.parse(statsJson) as Statistics;
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return { ...DEFAULT_STATISTICS };
    }
  }

  /**
   * Clears all data from storage
   * Useful for testing and reset functionality
   */
  clearAll(): void {
    try {
      this.storage.clearAll();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw new Error('Failed to clear storage');
    }
  }
}

// Export singleton instance for app-wide use
export const storageService = new StorageService();
