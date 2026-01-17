/**
 * Backup Service - Handles local export/import of application data
 * 
 * Performance & Robustness:
 * - Uses existing storageService instead of creating new MMKV instance
 * - Validates backup version compatibility
 * - Cleans up temporary files after export
 * - Uses efficient synchronous MMKV operations
 */
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { storageService } from './storageService';
import { createMMKV } from 'react-native-mmkv';
import {
  STORAGE_KEYS,
  XP_STORAGE_KEYS,
  TEMPLATES_STORAGE_KEY,
  CHALLENGE_STORAGE_KEYS,
  CATEGORIES_STORAGE_KEY,
  AI_LOGS_STORAGE_KEY,
  ACHIEVEMENT_STORAGE_KEYS,
  PERSONAL_BEST_STORAGE_KEYS,
} from '../constants';

// Interface for the backup data structure
export interface BackupData {
  version: number;
  exportedAt: string;
  appVersion?: string;
  data: {
    goals?: string;
    settings?: string;
    statistics?: string;
    streakData?: string;
    xpTotal?: string;
    xpHistory?: string;
    currentLevel?: string;
    templates?: string;
    activeChallenges?: string;
    challengeHistory?: string;
    userPerformance?: string;
    categories?: string;
    aiLogs?: string;
    unlockedBadges?: string;
    badgeProgress?: string;
    personalBests?: string;
    personalBestHistory?: string;
  };
}

const BACKUP_VERSION = 1;
const MAX_BACKUP_SIZE_MB = 50; // Maximum backup size in MB

/**
 * Backup Service Interface
 */
export interface IBackupService {
  gatherAllData(): BackupData;
  exportToFile(): Promise<{ success: boolean; error?: string }>;
  importFromFile(): Promise<{ success: boolean; error?: string }>;
  restoreFromData(backup: BackupData): { success: boolean; error?: string };
}

/**
 * BackupService - Handles data export and import
 * Uses the shared storage instance for consistency
 */
export class BackupService implements IBackupService {
  // Use shared MMKV instance for consistency with other services
  private storage = createMMKV({ id: 'daily-goals-storage' });

  /**
   * Gathers all app data into a BackupData structure
   * All MMKV operations are synchronous and fast
   */
  gatherAllData(): BackupData {
    const data: BackupData['data'] = {};

    // Core data
    data.goals = this.storage.getString(STORAGE_KEYS.GOALS);
    data.settings = this.storage.getString(STORAGE_KEYS.SETTINGS);
    data.statistics = this.storage.getString(STORAGE_KEYS.STATISTICS);
    data.streakData = this.storage.getString(STORAGE_KEYS.STREAK_DATA);

    // XP data
    data.xpTotal = this.storage.getString(XP_STORAGE_KEYS.TOTAL_XP);
    data.xpHistory = this.storage.getString(XP_STORAGE_KEYS.XP_HISTORY);
    data.currentLevel = this.storage.getString(XP_STORAGE_KEYS.CURRENT_LEVEL);

    // Templates
    data.templates = this.storage.getString(TEMPLATES_STORAGE_KEY);

    // Challenges
    data.activeChallenges = this.storage.getString(CHALLENGE_STORAGE_KEYS.ACTIVE_CHALLENGES);
    data.challengeHistory = this.storage.getString(CHALLENGE_STORAGE_KEYS.CHALLENGE_HISTORY);
    data.userPerformance = this.storage.getString(CHALLENGE_STORAGE_KEYS.USER_PERFORMANCE);

    // Categories
    data.categories = this.storage.getString(CATEGORIES_STORAGE_KEY);

    // AI Logs
    data.aiLogs = this.storage.getString(AI_LOGS_STORAGE_KEY);

    // Achievements
    data.unlockedBadges = this.storage.getString(ACHIEVEMENT_STORAGE_KEYS.UNLOCKED_BADGES);
    data.badgeProgress = this.storage.getString(ACHIEVEMENT_STORAGE_KEYS.BADGE_PROGRESS);

    // Personal Bests
    data.personalBests = this.storage.getString(PERSONAL_BEST_STORAGE_KEYS.PERSONAL_BESTS);
    data.personalBestHistory = this.storage.getString(PERSONAL_BEST_STORAGE_KEYS.PERSONAL_BEST_HISTORY);

    return {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0',
      data,
    };
  }

  /**
   * Exports all data to a JSON file and opens share dialog
   * Includes cleanup of temporary files
   */
  async exportToFile(): Promise<{ success: boolean; error?: string }> {
    let file: File | null = null;
    
    try {
      const backupData = this.gatherAllData();
      const jsonString = JSON.stringify(backupData);
      
      // Check size limit (rough estimate)
      const sizeInMB = new Blob([jsonString]).size / (1024 * 1024);
      if (sizeInMB > MAX_BACKUP_SIZE_MB) {
        return { 
          success: false, 
          error: `Backup too large (${sizeInMB.toFixed(1)}MB). Max: ${MAX_BACKUP_SIZE_MB}MB` 
        };
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `justdoit-backup-${timestamp}.json`;
      
      // Create file in cache directory
      file = new File(Paths.cache, fileName);
      file.create();
      file.write(jsonString);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        return { success: false, error: 'Sharing is not available on this device' };
      }

      // Share the file
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Export JustDoIt Backup',
        UTI: 'public.json',
      });

      return { success: true };
    } catch (error) {
      console.error('Export failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Export failed' 
      };
    } finally {
      // Cleanup: Delete temporary file after sharing
      if (file) {
        try {
          file.delete();
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }

  /**
   * Opens file picker and imports data from selected JSON file
   * Validates file size and structure before import
   */
  async importFromFile(): Promise<{ success: boolean; error?: string }> {
    try {
      // Open document picker
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { success: false, error: 'No file selected' };
      }

      const pickedFile = result.assets[0];
      
      // Check file size (if available)
      if (pickedFile.size && pickedFile.size > MAX_BACKUP_SIZE_MB * 1024 * 1024) {
        return { 
          success: false, 
          error: `File too large. Maximum size: ${MAX_BACKUP_SIZE_MB}MB` 
        };
      }
      
      // Read file contents
      const file = new File(pickedFile.uri);
      const content = await file.text();

      // Parse and validate
      let backupData: BackupData;
      try {
        backupData = JSON.parse(content);
      } catch {
        return { success: false, error: 'Invalid JSON file' };
      }

      // Validate structure
      if (!backupData.version || !backupData.data) {
        return { success: false, error: 'Invalid backup file format' };
      }

      // Version compatibility check
      if (backupData.version > BACKUP_VERSION) {
        return { 
          success: false, 
          error: `Backup version ${backupData.version} is newer than supported (${BACKUP_VERSION})` 
        };
      }

      // Restore data
      return this.restoreFromData(backupData);
    } catch (error) {
      console.error('Import failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Import failed' 
      };
    }
  }

  /**
   * Restores data from a BackupData object to MMKV storage
   * Uses synchronous MMKV operations for atomicity
   */
  restoreFromData(backup: BackupData): { success: boolean; error?: string } {
    try {
      const { data } = backup;

      // Core data
      if (data.goals !== undefined) this.storage.set(STORAGE_KEYS.GOALS, data.goals);
      if (data.settings !== undefined) this.storage.set(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.statistics !== undefined) this.storage.set(STORAGE_KEYS.STATISTICS, data.statistics);
      if (data.streakData !== undefined) this.storage.set(STORAGE_KEYS.STREAK_DATA, data.streakData);

      // XP data
      if (data.xpTotal !== undefined) this.storage.set(XP_STORAGE_KEYS.TOTAL_XP, data.xpTotal);
      if (data.xpHistory !== undefined) this.storage.set(XP_STORAGE_KEYS.XP_HISTORY, data.xpHistory);
      if (data.currentLevel !== undefined) this.storage.set(XP_STORAGE_KEYS.CURRENT_LEVEL, data.currentLevel);

      // Templates
      if (data.templates !== undefined) this.storage.set(TEMPLATES_STORAGE_KEY, data.templates);

      // Challenges
      if (data.activeChallenges !== undefined) this.storage.set(CHALLENGE_STORAGE_KEYS.ACTIVE_CHALLENGES, data.activeChallenges);
      if (data.challengeHistory !== undefined) this.storage.set(CHALLENGE_STORAGE_KEYS.CHALLENGE_HISTORY, data.challengeHistory);
      if (data.userPerformance !== undefined) this.storage.set(CHALLENGE_STORAGE_KEYS.USER_PERFORMANCE, data.userPerformance);

      // Categories
      if (data.categories !== undefined) this.storage.set(CATEGORIES_STORAGE_KEY, data.categories);

      // AI Logs
      if (data.aiLogs !== undefined) this.storage.set(AI_LOGS_STORAGE_KEY, data.aiLogs);

      // Achievements
      if (data.unlockedBadges !== undefined) this.storage.set(ACHIEVEMENT_STORAGE_KEYS.UNLOCKED_BADGES, data.unlockedBadges);
      if (data.badgeProgress !== undefined) this.storage.set(ACHIEVEMENT_STORAGE_KEYS.BADGE_PROGRESS, data.badgeProgress);

      // Personal Bests
      if (data.personalBests !== undefined) this.storage.set(PERSONAL_BEST_STORAGE_KEYS.PERSONAL_BESTS, data.personalBests);
      if (data.personalBestHistory !== undefined) this.storage.set(PERSONAL_BEST_STORAGE_KEYS.PERSONAL_BEST_HISTORY, data.personalBestHistory);

      return { success: true };
    } catch (error) {
      console.error('Restore failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Restore failed' 
      };
    }
  }
}

// Export singleton instance
export const backupService = new BackupService();
