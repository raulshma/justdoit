import { Goal } from '../types';

/**
 * Dependency status information for a goal
 */
export interface DependencyStatus {
  /** Whether the goal is blocked by incomplete prerequisites */
  isBlocked: boolean;
  /** ID of the first blocking goal (if blocked) */
  blockingGoalId?: string;
  /** Number of incomplete prerequisites */
  incompletePrerequisites: number;
  /** Total number of prerequisites */
  totalPrerequisites: number;
}

/**
 * Dependency Service Interface
 * Handles all dependency-related logic for goals
 */
export interface IDependencyService {
  /** Check if a goal is blocked by incomplete prerequisites */
  isBlocked(goalId: string, allGoals: Goal[]): boolean;
  
  /** Get the ID of the first blocking goal */
  getBlockingGoalId(goalId: string, allGoals: Goal[]): string | undefined;
  
  /** Get all goals blocked by this goal's completion */
  getBlockedGoals(goalId: string, allGoals: Goal[]): Goal[];
  
  /** Get goals that depend on the given goal */
  getDependentGoals(goalId: string, allGoals: Goal[]): Goal[];
  
  /** Validate dependency doesn't create circular reference */
  wouldCreateCycle(goalId: string, newDependency: string, allGoals: Goal[]): boolean;
  
  /** Get the full dependency chain for visualization */
  getDependencyChain(goalId: string, allGoals: Goal[]): Goal[];
  
  /** Check if milestone should auto-complete */
  shouldMilestoneComplete(goal: Goal, allGoals: Goal[]): boolean;
  
  /** Get full dependency status for a goal */
  getDependencyStatus(goalId: string, allGoals: Goal[]): DependencyStatus;
  
  /** Update blockedBy cache for all goals */
  updateBlockedByCache(allGoals: Goal[]): Goal[];
}

/**
 * DependencyService - Handles dependency logic for goals
 */
export class DependencyService implements IDependencyService {
  /**
   * Check if a goal is blocked by incomplete prerequisites
   */
  isBlocked(goalId: string, allGoals: Goal[]): boolean {
    const goal = allGoals.find(g => g.id === goalId);
    if (!goal || !goal.dependsOn || goal.dependsOn.length === 0) {
      return false;
    }

    // Check if any prerequisite is incomplete
    return goal.dependsOn.some(depId => {
      const dep = allGoals.find(g => g.id === depId);
      return dep && !dep.isCompleted;
    });
  }

  /**
   * Get the ID of the first blocking (incomplete) prerequisite goal
   */
  getBlockingGoalId(goalId: string, allGoals: Goal[]): string | undefined {
    const goal = allGoals.find(g => g.id === goalId);
    if (!goal || !goal.dependsOn || goal.dependsOn.length === 0) {
      return undefined;
    }

    // Find first incomplete prerequisite
    for (const depId of goal.dependsOn) {
      const dep = allGoals.find(g => g.id === depId);
      if (dep && !dep.isCompleted) {
        return depId;
      }
    }

    return undefined;
  }

  /**
   * Get all goals that are blocked by this goal (depend on it and would be unblocked)
   */
  getBlockedGoals(goalId: string, allGoals: Goal[]): Goal[] {
    return allGoals.filter(goal => {
      if (!goal.dependsOn || !goal.dependsOn.includes(goalId)) {
        return false;
      }
      // This goal depends on the target - check if target is the blocker
      return this.getBlockingGoalId(goal.id, allGoals) === goalId;
    });
  }

  /**
   * Get all goals that depend on the given goal
   */
  getDependentGoals(goalId: string, allGoals: Goal[]): Goal[] {
    return allGoals.filter(goal => 
      goal.dependsOn && goal.dependsOn.includes(goalId)
    );
  }

  /**
   * Check if adding a dependency would create a circular reference
   * Uses depth-first search to detect cycles
   */
  wouldCreateCycle(goalId: string, newDependency: string, allGoals: Goal[]): boolean {
    // Direct self-reference
    if (goalId === newDependency) {
      return true;
    }

    // Check if newDependency transitively depends on goalId
    const visited = new Set<string>();
    const stack: string[] = [newDependency];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      
      if (currentId === goalId) {
        return true; // Found cycle
      }

      if (visited.has(currentId)) {
        continue;
      }
      visited.add(currentId);

      const current = allGoals.find(g => g.id === currentId);
      if (current?.dependsOn) {
        for (const depId of current.dependsOn) {
          if (!visited.has(depId)) {
            stack.push(depId);
          }
        }
      }
    }

    return false;
  }

  /**
   * Get the full dependency chain (all prerequisites, recursively)
   */
  getDependencyChain(goalId: string, allGoals: Goal[]): Goal[] {
    const result: Goal[] = [];
    const visited = new Set<string>();
    const stack: string[] = [goalId];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      
      if (visited.has(currentId)) {
        continue;
      }
      visited.add(currentId);

      const current = allGoals.find(g => g.id === currentId);
      if (!current) continue;

      // Don't include the original goal in the chain
      if (currentId !== goalId) {
        result.push(current);
      }

      if (current.dependsOn) {
        for (const depId of current.dependsOn) {
          if (!visited.has(depId)) {
            stack.push(depId);
          }
        }
      }
    }

    return result;
  }

  /**
   * Check if a milestone goal should auto-complete
   * Returns true when all child goals are completed
   */
  shouldMilestoneComplete(goal: Goal, allGoals: Goal[]): boolean {
    if (!goal.isMilestone || !goal.childGoalIds || goal.childGoalIds.length === 0) {
      return false;
    }

    // Check if all child goals are completed
    return goal.childGoalIds.every(childId => {
      const child = allGoals.find(g => g.id === childId);
      return child && child.isCompleted;
    });
  }

  /**
   * Get full dependency status for a goal
   */
  getDependencyStatus(goalId: string, allGoals: Goal[]): DependencyStatus {
    const goal = allGoals.find(g => g.id === goalId);
    
    if (!goal || !goal.dependsOn || goal.dependsOn.length === 0) {
      return {
        isBlocked: false,
        incompletePrerequisites: 0,
        totalPrerequisites: 0,
      };
    }

    let incompleteCount = 0;
    let blockingGoalId: string | undefined;

    for (const depId of goal.dependsOn) {
      const dep = allGoals.find(g => g.id === depId);
      if (dep && !dep.isCompleted) {
        incompleteCount++;
        if (!blockingGoalId) {
          blockingGoalId = depId;
        }
      }
    }

    return {
      isBlocked: incompleteCount > 0,
      blockingGoalId,
      incompletePrerequisites: incompleteCount,
      totalPrerequisites: goal.dependsOn.length,
    };
  }

  /**
   * Update the blockedBy cache field for all goals
   * Returns updated goals array
   */
  updateBlockedByCache(allGoals: Goal[]): Goal[] {
    return allGoals.map(goal => {
      const blockingId = this.getBlockingGoalId(goal.id, allGoals);
      if (goal.blockedBy !== blockingId) {
        return { ...goal, blockedBy: blockingId };
      }
      return goal;
    });
  }
}

// Export singleton instance for app-wide use
export const dependencyService = new DependencyService();
