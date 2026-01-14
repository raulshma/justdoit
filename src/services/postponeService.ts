import { Goal, PostponeRecord } from '../types';
import { StorageService, storageService as defaultStorageService } from './storageService';
import { NotificationService, notificationService as defaultNotificationService } from './notificationService';

/**
 * Storage key for postpone history
 */
const POSTPONE_HISTORY_KEY = 'postpone_history';

/**
 * Undo window duration in milliseconds (5 seconds)
 */
const UNDO_WINDOW_MS = 5000;

/**
 * Postpone Service Interface
 * Requirements: 4.2, 4.4, 4.6, 4.7, 4.8
 */
export interface IPostponeService {
  postponeToTomorrow(goalId: string): Promise<Goal>;
  postponeToDate(goalId: string, newDate: Date): Promise<Goal>;
  snoozeReminder(goalId: string, durationMinutes: number): Promise<void>;
  undoPostpone(goalId: string): Promise<Goal | null>;
  getPostponeCount(goalId: string): number;
  getPostponeHistory(goalId: string): PostponeRecord[];
  wasPostponed(goalId: string): boolean;
}

/**
 * Undo state for tracking recent postponements
 */
interface UndoState {
  goalId: string;
  originalGoal: Goal;
  timestamp: number;
}

/**
 * PostponeService - Handles goal postponement and snooze functionality
 * Requirements: 4.2, 4.4, 4.6, 4.7, 4.8
 */
export class PostponeService implements IPostponeService {
  private storageService: StorageService;
  private notificationService: NotificationService;
  private undoStates: Map<string, UndoState> = new Map();

  constructor(storageService?: StorageService, notificationService?: NotificationService) {
    this.storageService = storageService ?? defaultStorageService;
    this.notificationService = notificationService ?? defaultNotificationService;
  }

  /**
   * Gets tomorrow's date as a Date object at midnight
   */
  private getTomorrowDate(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Formats a Date to ISO date string (YYYY-MM-DD)
   */
  private formatDateToISO(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Saves a postpone record to history
   */
  private savePostponeRecord(record: PostponeRecord): void {
    const history = this.getAllPostponeHistory();
    history.push(record);
    this.storageService['storage'].set(POSTPONE_HISTORY_KEY, JSON.stringify(history));
  }

  /**
   * Gets all postpone history from storage
   */
  private getAllPostponeHistory(): PostponeRecord[] {
    try {
      const historyJson = this.storageService['storage'].getString(POSTPONE_HISTORY_KEY);
      if (!historyJson) {
        return [];
      }
      return JSON.parse(historyJson) as PostponeRecord[];
    } catch (error) {
      console.error('Failed to get postpone history:', error);
      return [];
    }
  }

  /**
   * Stores undo state for a goal
   */
  private storeUndoState(goalId: string, originalGoal: Goal): void {
    this.undoStates.set(goalId, {
      goalId,
      originalGoal: { ...originalGoal },
      timestamp: Date.now(),
    });

    // Auto-clear undo state after window expires
    setTimeout(() => {
      this.undoStates.delete(goalId);
    }, UNDO_WINDOW_MS);
  }

  /**
   * Calculates new reminder time based on date change
   */
  private calculateNewReminderTime(
    originalReminderTime: string,
    originalDueDate: string,
    newDueDate: string
  ): string {
    const originalReminder = new Date(originalReminderTime);
    const originalDue = new Date(originalDueDate);
    const newDue = new Date(newDueDate);

    // Calculate the day difference
    const dayDiff = Math.floor(
      (newDue.getTime() - originalDue.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Apply the same day difference to the reminder
    const newReminder = new Date(originalReminder);
    newReminder.setDate(newReminder.getDate() + dayDiff);

    return newReminder.toISOString();
  }

  /**
   * Postpones a goal to tomorrow
   * @param goalId - The goal ID to postpone
   * @returns The updated goal
   * @throws Error if goal not found
   * Requirements: 4.2, 4.4, 4.7, 4.8
   */
  async postponeToTomorrow(goalId: string): Promise<Goal> {
    const tomorrow = this.getTomorrowDate();
    return this.postponeToDate(goalId, tomorrow);
  }

  /**
   * Postpones a goal to a specific date
   * @param goalId - The goal ID to postpone
   * @param newDate - The new due date
   * @returns The updated goal
   * @throws Error if goal not found or date is in the past
   * Requirements: 4.2, 4.4, 4.7, 4.8
   */
  async postponeToDate(goalId: string, newDate: Date): Promise<Goal> {
    const goal = this.storageService.getGoal(goalId);

    if (!goal) {
      throw new Error(`Goal with id ${goalId} not found`);
    }

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate < today) {
      throw new Error('Cannot postpone to a past date');
    }

    // Store undo state before making changes
    this.storeUndoState(goalId, goal);

    const originalDate = goal.dueDate;
    const newDateStr = this.formatDateToISO(newDate);

    // Update goal with new due date and increment postpone count
    const updatedGoal: Goal = {
      ...goal,
      dueDate: newDateStr,
      postponeCount: (goal.postponeCount ?? 0) + 1,
      lastPostponedAt: new Date().toISOString(),
    };

    // Update reminder time if exists (Requirement 4.4)
    if (goal.reminderTime) {
      // Cancel existing reminder
      if (goal.reminderId) {
        await this.notificationService.cancelReminder(goal.reminderId);
      }

      // Calculate new reminder time
      updatedGoal.reminderTime = this.calculateNewReminderTime(
        goal.reminderTime,
        originalDate,
        newDateStr
      );

      // Schedule new reminder
      const newReminderId = await this.notificationService.scheduleGoalReminder(updatedGoal);
      if (newReminderId) {
        updatedGoal.reminderId = newReminderId;
      } else {
        updatedGoal.reminderId = undefined;
      }
    }

    // Save updated goal
    this.storageService.saveGoal(updatedGoal);

    // Save postpone record to history
    const record: PostponeRecord = {
      goalId,
      originalDate,
      newDate: newDateStr,
      postponedAt: new Date().toISOString(),
    };
    this.savePostponeRecord(record);

    return updatedGoal;
  }

  /**
   * Snoozes a goal's reminder without changing the due date
   * @param goalId - The goal ID to snooze
   * @param durationMinutes - Duration to snooze in minutes
   * Requirements: 4.6
   */
  async snoozeReminder(goalId: string, durationMinutes: number): Promise<void> {
    const goal = this.storageService.getGoal(goalId);

    if (!goal) {
      throw new Error(`Goal with id ${goalId} not found`);
    }

    if (!goal.reminderTime) {
      throw new Error('Goal does not have a reminder set');
    }

    // Cancel existing reminder
    if (goal.reminderId) {
      await this.notificationService.cancelReminder(goal.reminderId);
    }

    // Calculate new reminder time (current time + duration)
    const newReminderTime = new Date();
    newReminderTime.setMinutes(newReminderTime.getMinutes() + durationMinutes);

    // Update goal with new reminder time (due date unchanged)
    const updatedGoal: Goal = {
      ...goal,
      reminderTime: newReminderTime.toISOString(),
    };

    // Schedule new reminder
    const newReminderId = await this.notificationService.scheduleGoalReminder(updatedGoal);
    if (newReminderId) {
      updatedGoal.reminderId = newReminderId;
    } else {
      updatedGoal.reminderId = undefined;
    }

    // Save updated goal
    this.storageService.saveGoal(updatedGoal);
  }

  /**
   * Undoes a recent postponement within the 5-second window
   * @param goalId - The goal ID to undo postponement for
   * @returns The restored goal, or null if undo window expired
   * Requirements: 4.5
   */
  async undoPostpone(goalId: string): Promise<Goal | null> {
    const undoState = this.undoStates.get(goalId);

    if (!undoState) {
      return null;
    }

    // Check if within undo window
    if (Date.now() - undoState.timestamp > UNDO_WINDOW_MS) {
      this.undoStates.delete(goalId);
      return null;
    }

    const originalGoal = undoState.originalGoal;

    // Cancel current reminder if exists
    const currentGoal = this.storageService.getGoal(goalId);
    if (currentGoal?.reminderId) {
      await this.notificationService.cancelReminder(currentGoal.reminderId);
    }

    // Restore original reminder if it existed
    if (originalGoal.reminderTime) {
      const newReminderId = await this.notificationService.scheduleGoalReminder(originalGoal);
      if (newReminderId) {
        originalGoal.reminderId = newReminderId;
      }
    }

    // Save restored goal
    this.storageService.saveGoal(originalGoal);

    // Remove undo state
    this.undoStates.delete(goalId);

    // Remove the last postpone record for this goal
    const history = this.getAllPostponeHistory();
    const filteredHistory = history.filter(
      (record, index, arr) =>
        !(record.goalId === goalId && index === arr.map((r) => r.goalId).lastIndexOf(goalId))
    );
    this.storageService['storage'].set(POSTPONE_HISTORY_KEY, JSON.stringify(filteredHistory));

    return originalGoal;
  }

  /**
   * Gets the number of times a goal has been postponed
   * @param goalId - The goal ID to check
   * @returns The postpone count
   * Requirements: 4.7, 4.8
   */
  getPostponeCount(goalId: string): number {
    const goal = this.storageService.getGoal(goalId);
    return goal?.postponeCount ?? 0;
  }

  /**
   * Gets the postpone history for a goal
   * @param goalId - The goal ID to get history for
   * @returns Array of postpone records
   * Requirements: 4.8
   */
  getPostponeHistory(goalId: string): PostponeRecord[] {
    const allHistory = this.getAllPostponeHistory();
    return allHistory.filter((record) => record.goalId === goalId);
  }

  /**
   * Checks if a goal was ever postponed
   * @param goalId - The goal ID to check
   * @returns true if the goal was postponed at least once
   * Requirements: 4.7
   */
  wasPostponed(goalId: string): boolean {
    return this.getPostponeCount(goalId) > 0;
  }

  /**
   * Checks if undo is available for a goal
   * @param goalId - The goal ID to check
   * @returns true if undo is available within the window
   */
  canUndo(goalId: string): boolean {
    const undoState = this.undoStates.get(goalId);
    if (!undoState) {
      return false;
    }
    return Date.now() - undoState.timestamp <= UNDO_WINDOW_MS;
  }

  /**
   * Gets the remaining undo time in milliseconds
   * @param goalId - The goal ID to check
   * @returns Remaining time in ms, or 0 if expired
   */
  getUndoTimeRemaining(goalId: string): number {
    const undoState = this.undoStates.get(goalId);
    if (!undoState) {
      return 0;
    }
    const remaining = UNDO_WINDOW_MS - (Date.now() - undoState.timestamp);
    return Math.max(0, remaining);
  }
}

// Export singleton instance for app-wide use
export const postponeService = new PostponeService();
