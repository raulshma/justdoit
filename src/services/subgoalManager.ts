import { randomUUID } from 'expo-crypto';
import { Subgoal, SubgoalProgress, Goal } from '../types';
import { StorageService, storageService as defaultStorageService } from './storageService';

/**
 * Maximum number of subgoals allowed per parent goal
 */
export const MAX_SUBGOALS_PER_GOAL = 20;

/**
 * Subgoal Manager Interface
 * Requirements: 2.2, 2.3, 2.4, 2.5, 2.8, 2.9
 */
export interface ISubgoalManager {
  // Subgoal CRUD
  getSubgoals(parentGoalId: string): Subgoal[];
  createSubgoal(parentGoalId: string, title: string, isMilestone?: boolean): Subgoal;
  updateSubgoal(id: string, parentGoalId: string, updates: Partial<Pick<Subgoal, 'title' | 'description' | 'isMilestone' | 'order'>>): Subgoal;
  deleteSubgoal(id: string, parentGoalId: string): void;
  
  // Progress calculation
  calculateProgress(parentGoalId: string): SubgoalProgress;
  
  // Completion
  toggleSubgoalCompletion(id: string, parentGoalId: string): Subgoal;
  areAllSubgoalsComplete(parentGoalId: string): boolean;
  
  // Bulk operations
  deleteAllSubgoals(parentGoalId: string): void;
  reorderSubgoals(parentGoalId: string, orderedIds: string[]): void;
}

/**
 * SubgoalManager - Handles subgoal CRUD and progress tracking
 * Requirements: 2.2, 2.3, 2.4, 2.5, 2.8, 2.9
 */
export class SubgoalManager implements ISubgoalManager {
  private storage: StorageService;

  constructor(storage?: StorageService) {
    this.storage = storage ?? defaultStorageService;
  }

  /**
   * Retrieves the parent goal from storage
   * @param parentGoalId - The parent goal ID
   * @returns The parent goal
   * @throws Error if parent goal not found
   */
  private getParentGoal(parentGoalId: string): Goal {
    const goal = this.storage.getGoal(parentGoalId);
    if (!goal) {
      throw new Error(`Parent goal with id ${parentGoalId} not found`);
    }
    return goal;
  }

  /**
   * Saves the parent goal with updated subgoals
   * @param goal - The goal to save
   */
  private saveParentGoal(goal: Goal): void {
    this.storage.saveGoal(goal);
  }

  /**
   * Retrieves all subgoals for a parent goal
   * Requirements: 2.2
   * @param parentGoalId - The parent goal ID
   * @returns Array of subgoals sorted by order
   */
  getSubgoals(parentGoalId: string): Subgoal[] {
    const goal = this.getParentGoal(parentGoalId);
    const subgoals = goal.subgoals ?? [];
    return [...subgoals].sort((a, b) => a.order - b.order);
  }


  /**
   * Creates a new subgoal for a parent goal
   * Requirements: 2.2, 2.9
   * @param parentGoalId - The parent goal ID
   * @param title - Subgoal title (1-200 chars)
   * @param isMilestone - Whether this is a milestone subgoal
   * @returns The created subgoal
   * @throws Error if title is invalid, max subgoals exceeded, or parent not found
   */
  createSubgoal(parentGoalId: string, title: string, isMilestone: boolean = false): Subgoal {
    // Validate title
    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length > 200) {
      throw new Error('Subgoal title must be between 1 and 200 characters');
    }

    const goal = this.getParentGoal(parentGoalId);
    const existingSubgoals = goal.subgoals ?? [];

    // Enforce max subgoals limit
    if (existingSubgoals.length >= MAX_SUBGOALS_PER_GOAL) {
      throw new Error(`Maximum of ${MAX_SUBGOALS_PER_GOAL} subgoals per goal allowed`);
    }

    // Calculate next order value
    const maxOrder = existingSubgoals.length > 0
      ? Math.max(...existingSubgoals.map(s => s.order))
      : -1;

    const newSubgoal: Subgoal = {
      id: randomUUID(),
      parentGoalId,
      title: trimmedTitle,
      isCompleted: false,
      isMilestone,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    };

    // Add subgoal to parent goal
    const updatedGoal: Goal = {
      ...goal,
      subgoals: [...existingSubgoals, newSubgoal],
    };

    this.saveParentGoal(updatedGoal);
    return newSubgoal;
  }

  /**
   * Updates an existing subgoal
   * Requirements: 2.2
   * @param id - Subgoal ID to update
   * @param parentGoalId - Parent goal ID
   * @param updates - Partial updates
   * @returns The updated subgoal
   * @throws Error if subgoal not found or validation fails
   */
  updateSubgoal(
    id: string,
    parentGoalId: string,
    updates: Partial<Pick<Subgoal, 'title' | 'description' | 'isMilestone' | 'order'>>
  ): Subgoal {
    const goal = this.getParentGoal(parentGoalId);
    const subgoals = goal.subgoals ?? [];
    const index = subgoals.findIndex(s => s.id === id);

    if (index === -1) {
      throw new Error(`Subgoal with id ${id} not found`);
    }

    const subgoal = subgoals[index];

    // Validate title if provided
    if (updates.title !== undefined) {
      const trimmedTitle = updates.title.trim();
      if (!trimmedTitle || trimmedTitle.length > 200) {
        throw new Error('Subgoal title must be between 1 and 200 characters');
      }
      subgoal.title = trimmedTitle;
    }

    // Validate description if provided
    if (updates.description !== undefined) {
      if (updates.description && updates.description.length > 500) {
        throw new Error('Subgoal description must be at most 500 characters');
      }
      subgoal.description = updates.description?.trim();
    }

    // Update milestone flag if provided
    if (updates.isMilestone !== undefined) {
      subgoal.isMilestone = updates.isMilestone;
    }

    // Update order if provided
    if (updates.order !== undefined) {
      subgoal.order = updates.order;
    }

    subgoals[index] = subgoal;

    const updatedGoal: Goal = {
      ...goal,
      subgoals,
    };

    this.saveParentGoal(updatedGoal);
    return subgoal;
  }


  /**
   * Deletes a subgoal
   * Requirements: 2.2
   * @param id - Subgoal ID to delete
   * @param parentGoalId - Parent goal ID
   * @throws Error if subgoal not found
   */
  deleteSubgoal(id: string, parentGoalId: string): void {
    const goal = this.getParentGoal(parentGoalId);
    const subgoals = goal.subgoals ?? [];
    const index = subgoals.findIndex(s => s.id === id);

    if (index === -1) {
      throw new Error(`Subgoal with id ${id} not found`);
    }

    // Remove the subgoal
    const filteredSubgoals = subgoals.filter(s => s.id !== id);

    // Reorder remaining subgoals to maintain sequential order
    const reorderedSubgoals = filteredSubgoals
      .sort((a, b) => a.order - b.order)
      .map((s, idx) => ({ ...s, order: idx }));

    const updatedGoal: Goal = {
      ...goal,
      subgoals: reorderedSubgoals,
    };

    this.saveParentGoal(updatedGoal);
  }

  /**
   * Calculates progress for a parent goal based on completed subgoals
   * Requirements: 2.3, 2.4
   * @param parentGoalId - The parent goal ID
   * @returns Progress object with completed, total, and percentage
   */
  calculateProgress(parentGoalId: string): SubgoalProgress {
    const goal = this.getParentGoal(parentGoalId);
    const subgoals = goal.subgoals ?? [];

    const total = subgoals.length;
    const completed = subgoals.filter(s => s.isCompleted).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      completed,
      total,
      percentage,
    };
  }

  /**
   * Toggles the completion status of a subgoal
   * Requirements: 2.4
   * @param id - Subgoal ID to toggle
   * @param parentGoalId - Parent goal ID
   * @returns The updated subgoal
   * @throws Error if subgoal not found
   */
  toggleSubgoalCompletion(id: string, parentGoalId: string): Subgoal {
    const goal = this.getParentGoal(parentGoalId);
    const subgoals = goal.subgoals ?? [];
    const index = subgoals.findIndex(s => s.id === id);

    if (index === -1) {
      throw new Error(`Subgoal with id ${id} not found`);
    }

    const subgoal = subgoals[index];
    const wasCompleted = subgoal.isCompleted;

    // Toggle completion status
    subgoal.isCompleted = !wasCompleted;
    subgoal.completedAt = !wasCompleted ? new Date().toISOString() : undefined;

    subgoals[index] = subgoal;

    const updatedGoal: Goal = {
      ...goal,
      subgoals,
    };

    this.saveParentGoal(updatedGoal);
    return subgoal;
  }

  /**
   * Checks if all subgoals for a parent goal are complete
   * Requirements: 2.5
   * @param parentGoalId - The parent goal ID
   * @returns true if all subgoals are complete (or no subgoals exist)
   */
  areAllSubgoalsComplete(parentGoalId: string): boolean {
    const goal = this.getParentGoal(parentGoalId);
    const subgoals = goal.subgoals ?? [];

    // If no subgoals, consider it complete
    if (subgoals.length === 0) {
      return true;
    }

    return subgoals.every(s => s.isCompleted);
  }


  /**
   * Deletes all subgoals for a parent goal
   * Requirements: 2.8
   * @param parentGoalId - The parent goal ID
   */
  deleteAllSubgoals(parentGoalId: string): void {
    const goal = this.getParentGoal(parentGoalId);

    const updatedGoal: Goal = {
      ...goal,
      subgoals: [],
    };

    this.saveParentGoal(updatedGoal);
  }

  /**
   * Reorders subgoals based on provided ordered IDs
   * Requirements: 2.2
   * @param parentGoalId - The parent goal ID
   * @param orderedIds - Array of subgoal IDs in desired order
   * @throws Error if any ID is invalid or missing
   */
  reorderSubgoals(parentGoalId: string, orderedIds: string[]): void {
    const goal = this.getParentGoal(parentGoalId);
    const subgoals = goal.subgoals ?? [];

    // Validate that all IDs exist and match
    if (orderedIds.length !== subgoals.length) {
      throw new Error('Ordered IDs must contain all subgoal IDs');
    }

    const subgoalMap = new Map(subgoals.map(s => [s.id, s]));
    
    for (const id of orderedIds) {
      if (!subgoalMap.has(id)) {
        throw new Error(`Subgoal with id ${id} not found`);
      }
    }

    // Reorder subgoals based on orderedIds
    const reorderedSubgoals = orderedIds.map((id, index) => {
      const subgoal = subgoalMap.get(id)!;
      return { ...subgoal, order: index };
    });

    const updatedGoal: Goal = {
      ...goal,
      subgoals: reorderedSubgoals,
    };

    this.saveParentGoal(updatedGoal);
  }

  /**
   * Gets a single subgoal by ID
   * @param id - Subgoal ID
   * @param parentGoalId - Parent goal ID
   * @returns The subgoal if found, undefined otherwise
   */
  getSubgoal(id: string, parentGoalId: string): Subgoal | undefined {
    const goal = this.getParentGoal(parentGoalId);
    const subgoals = goal.subgoals ?? [];
    return subgoals.find(s => s.id === id);
  }

  /**
   * Checks if a subgoal is a milestone
   * @param id - Subgoal ID
   * @param parentGoalId - Parent goal ID
   * @returns true if the subgoal is a milestone
   */
  isMilestone(id: string, parentGoalId: string): boolean {
    const subgoal = this.getSubgoal(id, parentGoalId);
    return subgoal?.isMilestone ?? false;
  }

  /**
   * Gets all milestone subgoals for a parent goal
   * @param parentGoalId - The parent goal ID
   * @returns Array of milestone subgoals
   */
  getMilestones(parentGoalId: string): Subgoal[] {
    const subgoals = this.getSubgoals(parentGoalId);
    return subgoals.filter(s => s.isMilestone);
  }

  /**
   * Gets completed milestones for a parent goal
   * @param parentGoalId - The parent goal ID
   * @returns Array of completed milestone subgoals
   */
  getCompletedMilestones(parentGoalId: string): Subgoal[] {
    return this.getMilestones(parentGoalId).filter(s => s.isCompleted);
  }
}

// Export singleton instance for app-wide use
export const subgoalManager = new SubgoalManager();
