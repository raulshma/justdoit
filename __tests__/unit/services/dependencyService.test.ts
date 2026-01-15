import { DependencyService, dependencyService } from '../../../src/services/dependencyService';
import { Goal, RecurrencePattern } from '../../../src/types';

/**
 * Unit tests for DependencyService
 * Tests prerequisite checking, cycle detection, and milestone auto-completion
 */

// Helper to create a mock goal
const createMockGoal = (overrides: Partial<Goal> = {}): Goal => ({
  id: `goal-${Math.random().toString(36).substring(7)}`,
  title: 'Test Goal',
  dueDate: '2026-01-17',
  createdAt: new Date().toISOString(),
  isCompleted: false,
  priority: 'medium',
  recurrence: { type: 'none' } as RecurrencePattern,
  ...overrides,
});

describe('DependencyService', () => {
  let service: DependencyService;

  beforeEach(() => {
    service = new DependencyService();
  });

  describe('isBlocked', () => {
    it('returns false when goal has no dependencies', () => {
      const goalA = createMockGoal({ id: 'A' });
      const allGoals = [goalA];

      expect(service.isBlocked('A', allGoals)).toBe(false);
    });

    it('returns true when prerequisite is incomplete', () => {
      const goalA = createMockGoal({ id: 'A', isCompleted: false });
      const goalB = createMockGoal({ id: 'B', dependsOn: ['A'] });
      const allGoals = [goalA, goalB];

      expect(service.isBlocked('B', allGoals)).toBe(true);
    });

    it('returns false when all prerequisites are complete', () => {
      const goalA = createMockGoal({ id: 'A', isCompleted: true });
      const goalB = createMockGoal({ id: 'B', dependsOn: ['A'] });
      const allGoals = [goalA, goalB];

      expect(service.isBlocked('B', allGoals)).toBe(false);
    });

    it('returns true when any prerequisite is incomplete', () => {
      const goalA = createMockGoal({ id: 'A', isCompleted: true });
      const goalB = createMockGoal({ id: 'B', isCompleted: false });
      const goalC = createMockGoal({ id: 'C', dependsOn: ['A', 'B'] });
      const allGoals = [goalA, goalB, goalC];

      expect(service.isBlocked('C', allGoals)).toBe(true);
    });
  });

  describe('getBlockingGoalId', () => {
    it('returns undefined when goal has no dependencies', () => {
      const goalA = createMockGoal({ id: 'A' });
      const allGoals = [goalA];

      expect(service.getBlockingGoalId('A', allGoals)).toBeUndefined();
    });

    it('returns first incomplete prerequisite', () => {
      const goalA = createMockGoal({ id: 'A', isCompleted: false });
      const goalB = createMockGoal({ id: 'B', dependsOn: ['A'] });
      const allGoals = [goalA, goalB];

      expect(service.getBlockingGoalId('B', allGoals)).toBe('A');
    });

    it('returns undefined when all dependencies are complete', () => {
      const goalA = createMockGoal({ id: 'A', isCompleted: true });
      const goalB = createMockGoal({ id: 'B', dependsOn: ['A'] });
      const allGoals = [goalA, goalB];

      expect(service.getBlockingGoalId('B', allGoals)).toBeUndefined();
    });
  });

  describe('wouldCreateCycle', () => {
    it('detects direct self-reference', () => {
      const goalA = createMockGoal({ id: 'A' });
      const allGoals = [goalA];

      expect(service.wouldCreateCycle('A', 'A', allGoals)).toBe(true);
    });

    it('detects direct cycle (A → B → A)', () => {
      const goalA = createMockGoal({ id: 'A', dependsOn: ['B'] });
      const goalB = createMockGoal({ id: 'B' });
      const allGoals = [goalA, goalB];

      // Adding B → A would create cycle
      expect(service.wouldCreateCycle('B', 'A', allGoals)).toBe(true);
    });

    it('detects transitive cycle (A → B → C → A)', () => {
      const goalA = createMockGoal({ id: 'A' });
      const goalB = createMockGoal({ id: 'B', dependsOn: ['A'] });
      const goalC = createMockGoal({ id: 'C', dependsOn: ['B'] });
      const allGoals = [goalA, goalB, goalC];

      // Adding A → C would create cycle
      expect(service.wouldCreateCycle('A', 'C', allGoals)).toBe(true);
    });

    it('allows valid dependency (no cycle)', () => {
      const goalA = createMockGoal({ id: 'A' });
      const goalB = createMockGoal({ id: 'B' });
      const goalC = createMockGoal({ id: 'C', dependsOn: ['B'] });
      const allGoals = [goalA, goalB, goalC];

      // Adding A → B is valid (no cycle)
      expect(service.wouldCreateCycle('A', 'B', allGoals)).toBe(false);
    });
  });

  describe('getDependentGoals', () => {
    it('returns empty array when no goals depend on target', () => {
      const goalA = createMockGoal({ id: 'A' });
      const goalB = createMockGoal({ id: 'B' });
      const allGoals = [goalA, goalB];

      expect(service.getDependentGoals('A', allGoals)).toEqual([]);
    });

    it('returns goals that depend on target', () => {
      const goalA = createMockGoal({ id: 'A' });
      const goalB = createMockGoal({ id: 'B', dependsOn: ['A'] });
      const goalC = createMockGoal({ id: 'C', dependsOn: ['A'] });
      const allGoals = [goalA, goalB, goalC];

      const dependents = service.getDependentGoals('A', allGoals);
      expect(dependents.length).toBe(2);
      expect(dependents.map(g => g.id)).toContain('B');
      expect(dependents.map(g => g.id)).toContain('C');
    });
  });

  describe('shouldMilestoneComplete', () => {
    it('returns false when goal is not a milestone', () => {
      const goalA = createMockGoal({ id: 'A', isMilestone: false });
      const allGoals = [goalA];

      expect(service.shouldMilestoneComplete(goalA, allGoals)).toBe(false);
    });

    it('returns false when milestone has no child goals', () => {
      const goalA = createMockGoal({ id: 'A', isMilestone: true, childGoalIds: [] });
      const allGoals = [goalA];

      expect(service.shouldMilestoneComplete(goalA, allGoals)).toBe(false);
    });

    it('returns false when not all children are complete', () => {
      const child1 = createMockGoal({ id: 'child1', isCompleted: true });
      const child2 = createMockGoal({ id: 'child2', isCompleted: false });
      const milestone = createMockGoal({ 
        id: 'milestone', 
        isMilestone: true, 
        childGoalIds: ['child1', 'child2'] 
      });
      const allGoals = [child1, child2, milestone];

      expect(service.shouldMilestoneComplete(milestone, allGoals)).toBe(false);
    });

    it('returns true when all children are complete', () => {
      const child1 = createMockGoal({ id: 'child1', isCompleted: true });
      const child2 = createMockGoal({ id: 'child2', isCompleted: true });
      const milestone = createMockGoal({ 
        id: 'milestone', 
        isMilestone: true, 
        childGoalIds: ['child1', 'child2'] 
      });
      const allGoals = [child1, child2, milestone];

      expect(service.shouldMilestoneComplete(milestone, allGoals)).toBe(true);
    });
  });

  describe('getDependencyStatus', () => {
    it('returns correct status for unblocked goal', () => {
      const goalA = createMockGoal({ id: 'A' });
      const allGoals = [goalA];

      const status = service.getDependencyStatus('A', allGoals);
      expect(status.isBlocked).toBe(false);
      expect(status.incompletePrerequisites).toBe(0);
      expect(status.totalPrerequisites).toBe(0);
    });

    it('returns correct status for blocked goal', () => {
      const goalA = createMockGoal({ id: 'A', isCompleted: false });
      const goalB = createMockGoal({ id: 'B', isCompleted: true });
      const goalC = createMockGoal({ id: 'C', dependsOn: ['A', 'B'] });
      const allGoals = [goalA, goalB, goalC];

      const status = service.getDependencyStatus('C', allGoals);
      expect(status.isBlocked).toBe(true);
      expect(status.blockingGoalId).toBe('A');
      expect(status.incompletePrerequisites).toBe(1);
      expect(status.totalPrerequisites).toBe(2);
    });
  });
});
