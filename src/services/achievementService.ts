import {
  Badge,
  BadgeCategory,
  UnlockedBadge,
  BADGES,
} from '../types/badge';
import { GameEvent } from '../types/gamification';
import { storageService, StorageService } from './storageService';
import { ACHIEVEMENT_STORAGE_KEYS } from '../constants';

// Re-export ACHIEVEMENT_STORAGE_KEYS for backward compatibility
export { ACHIEVEMENT_STORAGE_KEYS } from '../constants';

/**
 * Badge progress tracking
 */
export interface BadgeProgress {
  badgeId: string;
  current: number;
  required: number;
  percentage: number;
}

/**
 * Achievement Service Interface
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9
 */
export interface IAchievementService {
  // Badge retrieval
  getAllBadges(): Badge[];
  getUnlockedBadges(): UnlockedBadge[];
  getLockedBadges(): Badge[];
  getBadgeProgress(badgeId: string): BadgeProgress;

  // Badge evaluation
  evaluateBadges(event: GameEvent): UnlockedBadge[];
  checkStreakBadges(currentStreak: number): UnlockedBadge[];
  checkCompletionBadges(totalCompleted: number): UnlockedBadge[];
  checkBehaviorBadges(completionTime: Date): UnlockedBadge[];
  checkCategoryBadges(categoryId: string, categoryCount: number): UnlockedBadge[];

  // Events
  onBadgeUnlocked?: (badge: Badge) => void;
}

/**
 * Parses time string in HH:MM format to hours and minutes
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Checks if a given time is before a constraint time
 */
function isTimeBefore(time: Date, constraintTime: string): boolean {
  const { hours, minutes } = parseTime(constraintTime);
  const timeHours = time.getHours();
  const timeMinutes = time.getMinutes();
  
  if (timeHours < hours) return true;
  if (timeHours === hours && timeMinutes < minutes) return true;
  return false;
}

/**
 * Checks if a given time is after a constraint time
 */
function isTimeAfter(time: Date, constraintTime: string): boolean {
  const { hours, minutes } = parseTime(constraintTime);
  const timeHours = time.getHours();
  const timeMinutes = time.getMinutes();
  
  if (timeHours > hours) return true;
  if (timeHours === hours && timeMinutes >= minutes) return true;
  return false;
}

/**
 * AchievementService - Handles badge tracking, unlocking, and progress
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9
 */
export class AchievementService implements IAchievementService {
  private storage: StorageService;
  public onBadgeUnlocked?: (badge: Badge) => void;

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
   * Retrieves all available badges
   * Requirements: 5.2, 5.5, 5.6, 5.7, 5.8
   */
  getAllBadges(): Badge[] {
    return [...BADGES];
  }

  /**
   * Retrieves all unlocked badges
   * Requirements: 5.2, 5.3, 5.9
   */
  getUnlockedBadges(): UnlockedBadge[] {
    try {
      const storage = this.getStorageInstance();
      const unlockedJson = storage.getString(ACHIEVEMENT_STORAGE_KEYS.UNLOCKED_BADGES);
      if (!unlockedJson) {
        return [];
      }
      return JSON.parse(unlockedJson) as UnlockedBadge[];
    } catch (error) {
      console.error('Failed to get unlocked badges:', error);
      return [];
    }
  }

  /**
   * Saves unlocked badges to storage
   */
  private saveUnlockedBadges(badges: UnlockedBadge[]): void {
    try {
      const storage = this.getStorageInstance();
      storage.set(ACHIEVEMENT_STORAGE_KEYS.UNLOCKED_BADGES, JSON.stringify(badges));
    } catch (error) {
      console.error('Failed to save unlocked badges:', error);
      throw new Error('Failed to save unlocked badges to storage');
    }
  }

  /**
   * Retrieves all locked (not yet unlocked) badges
   * Requirements: 5.2, 5.4
   */
  getLockedBadges(): Badge[] {
    const unlockedBadges = this.getUnlockedBadges();
    const unlockedIds = new Set(unlockedBadges.map((b) => b.badgeId));
    return BADGES.filter((badge) => !unlockedIds.has(badge.id));
  }

  /**
   * Gets progress toward unlocking a specific badge
   * Requirements: 5.4
   */
  getBadgeProgress(badgeId: string): BadgeProgress {
    const badge = BADGES.find((b) => b.id === badgeId);
    if (!badge) {
      return { badgeId, current: 0, required: 0, percentage: 0 };
    }

    // Check if already unlocked
    const unlockedBadges = this.getUnlockedBadges();
    if (unlockedBadges.some((b) => b.badgeId === badgeId)) {
      return {
        badgeId,
        current: badge.criteria.threshold,
        required: badge.criteria.threshold,
        percentage: 100,
      };
    }

    // Get stored progress
    try {
      const storage = this.getStorageInstance();
      const progressJson = storage.getString(ACHIEVEMENT_STORAGE_KEYS.BADGE_PROGRESS);
      if (progressJson) {
        const progressMap = JSON.parse(progressJson) as Record<string, number>;
        const current = progressMap[badgeId] ?? 0;
        const required = badge.criteria.threshold;
        const percentage = required > 0 ? Math.min(100, (current / required) * 100) : 0;
        return { badgeId, current, required, percentage: Math.round(percentage * 10) / 10 };
      }
    } catch (error) {
      console.error('Failed to get badge progress:', error);
    }

    return {
      badgeId,
      current: 0,
      required: badge.criteria.threshold,
      percentage: 0,
    };
  }

  /**
   * Updates progress for a badge
   */
  private updateBadgeProgress(badgeId: string, current: number): void {
    try {
      const storage = this.getStorageInstance();
      const progressJson = storage.getString(ACHIEVEMENT_STORAGE_KEYS.BADGE_PROGRESS);
      const progressMap = progressJson ? JSON.parse(progressJson) as Record<string, number> : {};
      progressMap[badgeId] = current;
      storage.set(ACHIEVEMENT_STORAGE_KEYS.BADGE_PROGRESS, JSON.stringify(progressMap));
    } catch (error) {
      console.error('Failed to update badge progress:', error);
    }
  }

  /**
   * Checks if a badge is already unlocked
   */
  private isBadgeUnlocked(badgeId: string): boolean {
    const unlockedBadges = this.getUnlockedBadges();
    return unlockedBadges.some((b) => b.badgeId === badgeId);
  }

  /**
   * Unlocks a badge and triggers notification
   * Requirements: 5.1, 5.3
   */
  private unlockBadge(badge: Badge): UnlockedBadge {
    const unlockedBadge: UnlockedBadge = {
      badgeId: badge.id,
      unlockedAt: new Date().toISOString(),
    };

    // Add to unlocked badges
    const unlockedBadges = this.getUnlockedBadges();
    unlockedBadges.push(unlockedBadge);
    this.saveUnlockedBadges(unlockedBadges);

    // Update progress to 100%
    this.updateBadgeProgress(badge.id, badge.criteria.threshold);

    // Trigger notification callback
    if (this.onBadgeUnlocked) {
      this.onBadgeUnlocked(badge);
    }

    return unlockedBadge;
  }

  /**
   * Evaluates all badges based on a game event
   * Requirements: 5.1
   */
  evaluateBadges(event: GameEvent): UnlockedBadge[] {
    const newlyUnlocked: UnlockedBadge[] = [];

    switch (event.type) {
      case 'goal_completed': {
        const totalCompleted = event.data.totalCompleted as number;
        const categoryId = event.data.categoryId as string | undefined;
        const categoryCount = event.data.categoryCount as number | undefined;
        const completionTime = new Date(event.timestamp);

        // Check completion badges
        newlyUnlocked.push(...this.checkCompletionBadges(totalCompleted));

        // Check behavior badges
        newlyUnlocked.push(...this.checkBehaviorBadges(completionTime));

        // Check category badges
        if (categoryId && categoryCount !== undefined) {
          newlyUnlocked.push(...this.checkCategoryBadges(categoryId, categoryCount));
        }
        break;
      }

      case 'streak_updated': {
        const currentStreak = event.data.currentStreak as number;
        newlyUnlocked.push(...this.checkStreakBadges(currentStreak));
        break;
      }

      case 'day_completed': {
        // Check for perfect week badge
        const consecutivePerfectDays = event.data.consecutivePerfectDays as number | undefined;
        if (consecutivePerfectDays !== undefined) {
          newlyUnlocked.push(...this.checkPerfectWeekBadge(consecutivePerfectDays));
        }
        break;
      }
    }

    return newlyUnlocked;
  }

  /**
   * Checks and unlocks streak-based badges
   * Requirements: 5.5
   */
  checkStreakBadges(currentStreak: number): UnlockedBadge[] {
    const newlyUnlocked: UnlockedBadge[] = [];
    const streakBadges = BADGES.filter(
      (b) => b.category === 'streak' && b.criteria.type === 'streak'
    );

    for (const badge of streakBadges) {
      // Skip if already unlocked
      if (this.isBadgeUnlocked(badge.id)) {
        continue;
      }

      // Update progress
      this.updateBadgeProgress(badge.id, currentStreak);

      // Check if threshold met
      if (currentStreak >= badge.criteria.threshold) {
        const unlocked = this.unlockBadge(badge);
        newlyUnlocked.push(unlocked);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Checks and unlocks completion count badges
   * Requirements: 5.6
   */
  checkCompletionBadges(totalCompleted: number): UnlockedBadge[] {
    const newlyUnlocked: UnlockedBadge[] = [];
    const completionBadges = BADGES.filter(
      (b) => b.category === 'completion' && b.criteria.type === 'count'
    );

    for (const badge of completionBadges) {
      // Skip if already unlocked
      if (this.isBadgeUnlocked(badge.id)) {
        continue;
      }

      // Update progress
      this.updateBadgeProgress(badge.id, totalCompleted);

      // Check if threshold met
      if (totalCompleted >= badge.criteria.threshold) {
        const unlocked = this.unlockBadge(badge);
        newlyUnlocked.push(unlocked);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Checks and unlocks behavior-based badges (time-based)
   * Requirements: 5.7
   */
  checkBehaviorBadges(completionTime: Date): UnlockedBadge[] {
    const newlyUnlocked: UnlockedBadge[] = [];
    const behaviorBadges = BADGES.filter(
      (b) => b.category === 'behavior' && b.criteria.type === 'time'
    );

    for (const badge of behaviorBadges) {
      // Skip if already unlocked
      if (this.isBadgeUnlocked(badge.id)) {
        continue;
      }

      const { timeConstraint } = badge.criteria;
      if (!timeConstraint) {
        continue;
      }

      let meetsConstraint = false;

      // Check "before" constraint (e.g., Early Bird - before 8 AM)
      if (timeConstraint.before && isTimeBefore(completionTime, timeConstraint.before)) {
        meetsConstraint = true;
      }

      // Check "after" constraint (e.g., Night Owl - after 10 PM)
      if (timeConstraint.after && isTimeAfter(completionTime, timeConstraint.after)) {
        meetsConstraint = true;
      }

      if (meetsConstraint) {
        // Update progress (for time-based badges, meeting once is enough)
        this.updateBadgeProgress(badge.id, badge.criteria.threshold);
        const unlocked = this.unlockBadge(badge);
        newlyUnlocked.push(unlocked);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Checks and unlocks category-specific badges
   * Requirements: 5.8
   */
  checkCategoryBadges(categoryId: string, categoryCount: number): UnlockedBadge[] {
    const newlyUnlocked: UnlockedBadge[] = [];
    const categoryBadges = BADGES.filter(
      (b) =>
        b.category === 'category' &&
        b.criteria.type === 'category_count' &&
        b.criteria.categoryId === categoryId
    );

    for (const badge of categoryBadges) {
      // Skip if already unlocked
      if (this.isBadgeUnlocked(badge.id)) {
        continue;
      }

      // Update progress
      this.updateBadgeProgress(badge.id, categoryCount);

      // Check if threshold met
      if (categoryCount >= badge.criteria.threshold) {
        const unlocked = this.unlockBadge(badge);
        newlyUnlocked.push(unlocked);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Checks and unlocks the Perfect Week badge
   * Requirements: 5.7
   */
  private checkPerfectWeekBadge(consecutivePerfectDays: number): UnlockedBadge[] {
    const newlyUnlocked: UnlockedBadge[] = [];
    const perfectWeekBadge = BADGES.find((b) => b.id === 'perfect-week');

    if (!perfectWeekBadge) {
      return newlyUnlocked;
    }

    // Skip if already unlocked
    if (this.isBadgeUnlocked(perfectWeekBadge.id)) {
      return newlyUnlocked;
    }

    // Update progress
    this.updateBadgeProgress(perfectWeekBadge.id, consecutivePerfectDays);

    // Check if threshold met (7 consecutive perfect days)
    if (consecutivePerfectDays >= perfectWeekBadge.criteria.threshold) {
      const unlocked = this.unlockBadge(perfectWeekBadge);
      newlyUnlocked.push(unlocked);
    }

    return newlyUnlocked;
  }

  /**
   * Gets badges by category
   */
  getBadgesByCategory(category: BadgeCategory): Badge[] {
    return BADGES.filter((b) => b.category === category);
  }

  /**
   * Gets a specific badge by ID
   */
  getBadgeById(badgeId: string): Badge | undefined {
    return BADGES.find((b) => b.id === badgeId);
  }

  /**
   * Resets achievement data (useful for testing)
   */
  reset(): void {
    try {
      const storage = this.getStorageInstance();
      storage.delete(ACHIEVEMENT_STORAGE_KEYS.UNLOCKED_BADGES);
      storage.delete(ACHIEVEMENT_STORAGE_KEYS.BADGE_PROGRESS);
    } catch (error) {
      console.error('Failed to reset achievement data:', error);
    }
  }
}

// Export singleton instance for app-wide use
export const achievementService = new AchievementService();
