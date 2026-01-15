import { randomUUID } from 'expo-crypto';
import { Goal, Priority, RecurrencePattern } from '../types';
import { StorageService, storageService as defaultStorageService } from './storageService';
import { NotificationService, notificationService as defaultNotificationService } from './notificationService';

/**
 * Input for creating a new goal
 */
export interface CreateGoalInput {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: Priority;
  recurrence?: RecurrencePattern;
  reminderTime?: string;
  imageUri?: string;
}

/**
 * Input for updating an existing goal
 */
export interface UpdateGoalInput {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: Priority;
  recurrence?: RecurrencePattern;
  reminderTime?: string;
  isCompleted?: boolean;
  imageUri?: string;
}

/**
 * Grouped goals by date
 */
export interface GroupedGoals {
  [date: string]: Goal[];
}

/**
 * Goal Manager Service Interface
 */
export interface IGoalManager {
  createGoal(input: CreateGoalInput): Promise<Goal>;
  updateGoal(id: string, updates: UpdateGoalInput): Goal;
  deleteGoal(id: string): Promise<void>;
  getGoal(id: string): Goal | null;
  getGoalsByDate(date: string): Goal[];
  getAllGoals(): Goal[];
  toggleComplete(id: string): Promise<Goal>;
  allGoalsCompleted(date: string): boolean;
  groupGoalsByDate(goals: Goal[]): GroupedGoals;
  sortGoalsByPriority(goals: Goal[]): Goal[];
  generateNextRecurrence(goal: Goal): Promise<Goal | null>;
  calculateNextOccurrenceDate(goal: Goal): string | null;
  deleteRecurringSeries(goalId: string): Promise<void>;
}

/**
 * Validates that a title is not empty or whitespace-only
 * @param title - The title to validate
 * @returns true if valid, false otherwise
 */
export function isValidTitle(title: string): boolean {
  return title.trim().length > 0;
}

/**
 * Gets tomorrow's date in ISO format (YYYY-MM-DD)
 */
export function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

/**
 * GoalManager - Handles all goal-related business logic
 * Requirements: 1.1, 1.2, 1.3, 2.2, 2.3, 2.4, 2.5, 3.1, 3.4, 4.1, 4.4, 4.5
 */
export class GoalManager implements IGoalManager {
  private storageService: StorageService;
  private notificationService: NotificationService;

  constructor(storageService?: StorageService, notificationService?: NotificationService) {
    this.storageService = storageService ?? defaultStorageService;
    this.notificationService = notificationService ?? defaultNotificationService;
  }

  /**
   * Creates a new goal with UUID generation and default values
   * Schedules a reminder notification if reminderTime is provided
   * @param input - The goal creation input
   * @returns The created goal
   * @throws Error if title is empty or whitespace-only
   * Requirements: 1.1, 1.2, 1.3, 4.1
   */
  async createGoal(input: CreateGoalInput): Promise<Goal> {
    // Validate title - reject empty/whitespace (Requirement 1.2)
    if (!isValidTitle(input.title)) {
      throw new Error('Goal title cannot be empty or whitespace-only');
    }

    const now = new Date().toISOString();
    
    const goal: Goal = {
      id: randomUUID(), // Unique identifier (Requirement 1.3)
      title: input.title.trim(),
      description: input.description?.trim(),
      dueDate: input.dueDate ?? getTomorrowDate(), // Default to tomorrow (Requirement 1.3)
      createdAt: now,
      isCompleted: false,
      priority: input.priority ?? 'medium',
      recurrence: input.recurrence ?? { type: 'none' },
      reminderTime: input.reminderTime,
      imageUri: input.imageUri,
    };

    // Schedule reminder if reminderTime is provided (Requirement 4.1)
    if (goal.reminderTime) {
      const reminderId = await this.notificationService.scheduleGoalReminder(goal);
      if (reminderId) {
        goal.reminderId = reminderId;
      }
    }

    // Persist to storage (Requirement 1.4)
    this.storageService.saveGoal(goal);

    return goal;
  }

  /**
   * Updates an existing goal
   * @param id - The goal ID to update
   * @param updates - The fields to update
   * @returns The updated goal
   * @throws Error if goal not found or title validation fails
   * Requirements: 2.2, 2.3
   */
  updateGoal(id: string, updates: UpdateGoalInput): Goal {
    const existingGoal = this.storageService.getGoal(id);
    
    if (!existingGoal) {
      throw new Error(`Goal with id ${id} not found`);
    }

    // Validate title if being updated
    if (updates.title !== undefined && !isValidTitle(updates.title)) {
      throw new Error('Goal title cannot be empty or whitespace-only');
    }

    const updatedGoal: Goal = {
      ...existingGoal,
      ...(updates.title !== undefined && { title: updates.title.trim() }),
      ...(updates.description !== undefined && { description: updates.description?.trim() }),
      ...(updates.dueDate !== undefined && { dueDate: updates.dueDate }),
      ...(updates.priority !== undefined && { priority: updates.priority }),
      ...(updates.recurrence !== undefined && { recurrence: updates.recurrence }),
      ...(updates.reminderTime !== undefined && { reminderTime: updates.reminderTime }),
      ...(updates.isCompleted !== undefined && { isCompleted: updates.isCompleted }),
      ...(updates.imageUri !== undefined && { imageUri: updates.imageUri }),
    };

    this.storageService.saveGoal(updatedGoal);

    return updatedGoal;
  }

  /**
   * Deletes a goal by ID and cancels any associated reminder
   * @param id - The goal ID to delete
   * Requirements: 2.4, 4.4
   */
  async deleteGoal(id: string): Promise<void> {
    const goal = this.storageService.getGoal(id);
    
    // Cancel reminder if exists (Requirement 4.4)
    if (goal?.reminderId) {
      await this.notificationService.cancelReminder(goal.reminderId);
    }
    
    this.storageService.deleteGoal(id);
  }

  /**
   * Retrieves a goal by ID
   * @param id - The goal ID to retrieve
   * @returns The goal if found, null otherwise
   */
  getGoal(id: string): Goal | null {
    return this.storageService.getGoal(id);
  }

  /**
   * Retrieves all goals for a specific date
   * @param date - The date in ISO format (YYYY-MM-DD)
   * @returns Array of goals for that date
   */
  getGoalsByDate(date: string): Goal[] {
    const allGoals = this.storageService.getAllGoals();
    return allGoals.filter((goal) => goal.dueDate === date);
  }

  /**
   * Retrieves all goals
   * @returns Array of all goals
   * Requirements: 2.1
   */
  getAllGoals(): Goal[] {
    return this.storageService.getAllGoals();
  }

  /**
   * Toggles the completion status of a goal
   * If completing a recurring goal, generates the next occurrence
   * Cancels reminder when marking as complete
   * @param id - The goal ID to toggle
   * @returns The updated goal
   * @throws Error if goal not found
   * Requirements: 2.5, 3.1, 4.5, 10.2
   */
  async toggleComplete(id: string): Promise<Goal> {
    const goal = this.storageService.getGoal(id);
    
    if (!goal) {
      throw new Error(`Goal with id ${id} not found`);
    }

    const now = new Date().toISOString();
    const wasCompleted = goal.isCompleted;
    
    const updatedGoal: Goal = {
      ...goal,
      isCompleted: !goal.isCompleted,
      completedAt: !goal.isCompleted ? now : undefined,
    };

    // Cancel reminder when marking as complete (Requirement 4.5)
    if (!wasCompleted && updatedGoal.isCompleted && goal.reminderId) {
      await this.notificationService.cancelReminder(goal.reminderId);
      updatedGoal.reminderId = undefined;
    }

    this.storageService.saveGoal(updatedGoal);

    // If marking as complete and it's a recurring goal, generate next occurrence
    // Requirements: 10.2
    if (!wasCompleted && updatedGoal.isCompleted && updatedGoal.recurrence.type !== 'none') {
      await this.generateNextRecurrence(updatedGoal);
    }

    return updatedGoal;
  }

  /**
   * Checks if all goals for a specific date are completed
   * @param date - The date in ISO format (YYYY-MM-DD)
   * @returns true if all goals are completed and there is at least one goal
   * Requirements: 3.4
   */
  allGoalsCompleted(date: string): boolean {
    const goalsForDate = this.getGoalsByDate(date);
    
    // Must have at least one goal
    if (goalsForDate.length === 0) {
      return false;
    }

    // All goals must be completed
    return goalsForDate.every((goal) => goal.isCompleted);
  }

  /**
   * Groups goals by their due date
   * @param goals - Array of goals to group
   * @returns Object with dates as keys and arrays of goals as values
   * Requirements: 9.1
   * Property 9: Every goal in a group has the same dueDate, no goal appears in multiple groups
   */
  groupGoalsByDate(goals: Goal[]): GroupedGoals {
    const grouped: GroupedGoals = {};

    for (const goal of goals) {
      const date = goal.dueDate;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(goal);
    }

    return grouped;
  }

  /**
   * Sorts goals by priority (high→medium→low) then by createdAt (earliest first)
   * @param goals - Array of goals to sort
   * @returns New sorted array of goals
   * Requirements: 9.3
   * Property 10: High before medium before low, within same priority ordered by createdAt
   */
  sortGoalsByPriority(goals: Goal[]): Goal[] {
    const priorityOrder: Record<Priority, number> = {
      high: 0,
      medium: 1,
      low: 2,
    };

    return [...goals].sort((a, b) => {
      // First sort by priority (high to low)
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // Then sort by createdAt (earliest first)
      return a.createdAt.localeCompare(b.createdAt);
    });
  }

  /**
   * Calculates the next occurrence date for a recurring goal
   * @param goal - The goal to calculate next occurrence for
   * @returns The next occurrence date in ISO format (YYYY-MM-DD), or null if not recurring
   * Requirements: 10.2, 10.6
   */
  calculateNextOccurrenceDate(goal: Goal): string | null {
    if (goal.recurrence.type === 'none') {
      return null;
    }

    const currentDate = new Date(goal.dueDate);
    
    switch (goal.recurrence.type) {
      case 'daily': {
        // Daily: simply add one day
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 1);
        return nextDate.toISOString().split('T')[0];
      }
      
      case 'weekly': {
        // Weekly: add 7 days
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 7);
        return nextDate.toISOString().split('T')[0];
      }
      
      case 'custom': {
        // Custom: find next day of week from daysOfWeek array
        const daysOfWeek = goal.recurrence.daysOfWeek;
        if (!daysOfWeek || daysOfWeek.length === 0) {
          return null;
        }

        // Sort days of week for consistent searching
        const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
        const currentDayOfWeek = currentDate.getDay();
        
        // Find the next day of week that's after the current day
        let nextDayOfWeek: number | null = null;
        
        // First, look for a day later in the same week
        for (const day of sortedDays) {
          if (day > currentDayOfWeek) {
            nextDayOfWeek = day;
            break;
          }
        }
        
        // If no day found later in the week, wrap to the first day of next week
        if (nextDayOfWeek === null) {
          nextDayOfWeek = sortedDays[0];
        }
        
        // Calculate days to add
        let daysToAdd = nextDayOfWeek - currentDayOfWeek;
        if (daysToAdd <= 0) {
          daysToAdd += 7; // Wrap to next week
        }
        
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + daysToAdd);
        return nextDate.toISOString().split('T')[0];
      }
      
      default:
        return null;
    }
  }

  /**
   * Generates the next occurrence of a recurring goal
   * Schedules a reminder for the new occurrence if the original had one
   * @param goal - The completed recurring goal
   * @returns The newly created goal for the next occurrence, or null if not recurring
   * Requirements: 10.2, 4.1
   * Property 11: Creates new goal with same properties but new id, dueDate, and isCompleted=false
   */
  async generateNextRecurrence(goal: Goal): Promise<Goal | null> {
    if (goal.recurrence.type === 'none') {
      return null;
    }

    const nextDueDate = this.calculateNextOccurrenceDate(goal);
    if (!nextDueDate) {
      return null;
    }

    // Determine the parent goal ID (either the original goal or its parent)
    const parentGoalId = goal.recurrence.parentGoalId ?? goal.id;

    const now = new Date().toISOString();
    
    // Calculate new reminder time if original had one
    let newReminderTime: string | undefined;
    if (goal.reminderTime) {
      const originalReminderDate = new Date(goal.reminderTime);
      const originalDueDate = new Date(goal.dueDate);
      const nextDueDateObj = new Date(nextDueDate);
      
      // Calculate the time difference between due date and reminder
      const timeDiff = originalReminderDate.getTime() - originalDueDate.getTime();
      
      // Apply the same time difference to the new due date
      const newReminderDate = new Date(nextDueDateObj.getTime() + timeDiff);
      newReminderTime = newReminderDate.toISOString();
    }
    
    const newGoal: Goal = {
      id: randomUUID(), // New unique ID
      title: goal.title,
      description: goal.description,
      dueDate: nextDueDate,
      createdAt: now,
      isCompleted: false, // New occurrence starts incomplete
      priority: goal.priority,
      recurrence: {
        ...goal.recurrence,
        parentGoalId: parentGoalId, // Reference to original goal
      },
      reminderTime: newReminderTime,
    };

    // Schedule reminder for new occurrence if it has a reminder time
    if (newGoal.reminderTime) {
      const reminderId = await this.notificationService.scheduleGoalReminder(newGoal);
      if (reminderId) {
        newGoal.reminderId = reminderId;
      }
    }

    this.storageService.saveGoal(newGoal);

    return newGoal;
  }

  /**
   * Deletes all goals in a recurring series and cancels their reminders
   * @param goalId - The ID of any goal in the series (original or occurrence)
   * Requirements: 10.5, 4.4
   * Property 12: Removes all goals sharing the same parentGoalId or original goal id
   */
  async deleteRecurringSeries(goalId: string): Promise<void> {
    const goal = this.storageService.getGoal(goalId);
    if (!goal) {
      return;
    }

    // Determine the series identifier (parent ID or the goal's own ID if it's the original)
    const seriesId = goal.recurrence.parentGoalId ?? goal.id;

    const allGoals = this.storageService.getAllGoals();
    
    // Find all goals that belong to this series:
    // 1. The original goal (id === seriesId)
    // 2. All goals with parentGoalId === seriesId
    const goalsToDelete = allGoals.filter((g) => 
      g.id === seriesId || g.recurrence.parentGoalId === seriesId
    );

    // Delete each goal in the series and cancel their reminders
    for (const goalToDelete of goalsToDelete) {
      // Cancel reminder if exists (Requirement 4.4)
      if (goalToDelete.reminderId) {
        await this.notificationService.cancelReminder(goalToDelete.reminderId);
      }
      this.storageService.deleteGoal(goalToDelete.id);
    }
  }
}


// Export singleton instance for app-wide use
export const goalManager = new GoalManager();
