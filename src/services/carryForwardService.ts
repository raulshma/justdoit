import { Goal } from '../types';
import { storageService } from './storageService';

/**
 * CarryForward Service Interface
 */
export interface ICarryForwardService {
  processCarryForward(): Promise<number>;
  shouldCarryForward(goal: Goal): boolean;
  carryGoalForward(goal: Goal): Goal;
}

/**
 * Gets today's date in ISO format (YYYY-MM-DD)
 */
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Gets yesterday's date in ISO format (YYYY-MM-DD)
 */
const getYesterdayDate = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

/**
 * CarryForwardService - Handles automatic migration of incomplete goals
 */
export class CarryForwardService implements ICarryForwardService {
  /**
   * Process all incomplete goals from previous days and carry them forward
   * @returns Number of goals carried forward
   */
  async processCarryForward(): Promise<number> {
    const settings = storageService.getSettings();
    
    // Only process if carry forward is enabled
    if (!settings.carryForwardEnabled) {
      return 0;
    }

    const allGoals = storageService.getAllGoals();
    const today = getTodayDate();
    let carriedCount = 0;

    for (const goal of allGoals) {
      if (this.shouldCarryForward(goal)) {
        const updatedGoal = this.carryGoalForward(goal);
        storageService.saveGoal(updatedGoal);
        carriedCount++;
      }
    }

    return carriedCount;
  }

  /**
   * Check if a goal should be carried forward
   * @param goal - The goal to check
   * @returns True if the goal should be carried forward
   */
  shouldCarryForward(goal: Goal): boolean {
    const today = getTodayDate();

    // Don't carry forward if already completed
    if (goal.isCompleted) {
      return false;
    }

    // Don't carry forward recurring goals - they generate their own instances
    if (goal.recurrence.type !== 'none') {
      return false;
    }

    // Only carry forward if the due date is in the past
    if (goal.dueDate >= today) {
      return false;
    }

    return true;
  }

  /**
   * Carry a goal forward to today
   * @param goal - The goal to carry forward
   * @returns The updated goal
   */
  carryGoalForward(goal: Goal): Goal {
    const today = getTodayDate();
    
    return {
      ...goal,
      // Store original due date if not already set
      originalDueDate: goal.originalDueDate || goal.dueDate,
      // Update due date to today
      dueDate: today,
      // Mark as carried forward
      carriedForward: true,
      // Increment carry forward count
      carryForwardCount: (goal.carryForwardCount || 0) + 1,
    };
  }

  /**
   * Get all goals that have been carried forward
   * @returns Array of carried-forward goals
   */
  getCarriedForwardGoals(): Goal[] {
    const allGoals = storageService.getAllGoals();
    return allGoals.filter(goal => goal.carriedForward === true);
  }

  /**
   * Reset carry-forward status when a goal is completed
   * (The metadata is preserved for analytics)
   * @param goal - The completed goal
   * @returns The goal (unchanged, as we preserve the metadata)
   */
  markAsCompleted(goal: Goal): Goal {
    // We keep carriedForward, originalDueDate, and carryForwardCount
    // for analytics purposes even after completion
    return goal;
  }
}

// Export singleton instance
export const carryForwardService = new CarryForwardService();
