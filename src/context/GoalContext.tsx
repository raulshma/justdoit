import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { Goal, Subgoal, SubgoalProgress, PostponeRecord } from '../types';
import {
  goalManager,
  GoalManager,
  CreateGoalInput,
  UpdateGoalInput,
  GroupedGoals,
} from '../services/goalManager';
import { categoryManager, CategoryManager } from '../services/categoryManager';
import { subgoalManager, SubgoalManager } from '../services/subgoalManager';
import { postponeService, PostponeService } from '../services/postponeService';
import { statisticsService } from '../services/statisticsService';

/**
 * Goal state interface
 */
interface GoalState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Goal action types
 */
type GoalAction =
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

/**
 * Goal context value interface
 */
interface GoalContextValue extends GoalState {
  // Goal CRUD operations
  createGoal: (input: CreateGoalInput) => Promise<Goal>;
  updateGoal: (id: string, updates: UpdateGoalInput) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<Goal>;
  // Goal retrieval
  getGoal: (id: string) => Goal | null;
  getGoalsByDate: (date: string) => Goal[];
  // Goal organization
  groupGoalsByDate: (goals: Goal[]) => GroupedGoals;
  sortGoalsByPriority: (goals: Goal[]) => Goal[];
  allGoalsCompleted: (date: string) => boolean;
  // Recurring goals
  deleteRecurringSeries: (goalId: string) => Promise<void>;
  // Refresh
  refreshGoals: () => void;
  
  // Category operations (integrated from CategoryManager)
  assignCategoryToGoal: (goalId: string, categoryId: string) => Goal;
  getGoalsByCategory: (categoryId: string) => Goal[];
  
  // Subgoal operations (integrated from SubgoalManager)
  getSubgoals: (parentGoalId: string) => Subgoal[];
  createSubgoal: (parentGoalId: string, title: string, isMilestone?: boolean) => Subgoal;
  updateSubgoal: (id: string, parentGoalId: string, updates: Partial<Pick<Subgoal, 'title' | 'description' | 'isMilestone' | 'order'>>) => Subgoal;
  deleteSubgoal: (id: string, parentGoalId: string) => void;
  toggleSubgoalCompletion: (id: string, parentGoalId: string) => Subgoal;
  calculateSubgoalProgress: (parentGoalId: string) => SubgoalProgress;
  areAllSubgoalsComplete: (parentGoalId: string) => boolean;
  reorderSubgoals: (parentGoalId: string, orderedIds: string[]) => void;
  
  // Postpone operations (integrated from PostponeService)
  postponeToTomorrow: (goalId: string) => Promise<Goal>;
  postponeToDate: (goalId: string, newDate: Date) => Promise<Goal>;
  snoozeReminder: (goalId: string, durationMinutes: number) => Promise<void>;
  undoPostpone: (goalId: string) => Promise<Goal | null>;
  getPostponeCount: (goalId: string) => number;
  getPostponeHistory: (goalId: string) => PostponeRecord[];
  wasPostponed: (goalId: string) => boolean;
  canUndoPostpone: (goalId: string) => boolean;
  
  // Gamification event callback (to be set by GamificationContext)
  onGoalCompleted?: (goal: Goal, currentStreak: number) => void;
  onSubgoalCompleted?: (goalId: string, subgoalId: string) => void;
  setGamificationCallbacks: (callbacks: GamificationCallbacks) => void;
}

/**
 * Gamification callbacks interface
 */
interface GamificationCallbacks {
  onGoalCompleted?: (goal: Goal, currentStreak: number) => void;
  onSubgoalCompleted?: (goalId: string, subgoalId: string) => void;
}

/**
 * Initial state
 */
const initialState: GoalState = {
  goals: [],
  isLoading: true,
  error: null,
};

/**
 * Goal reducer
 */
function goalReducer(state: GoalState, action: GoalAction): GoalState {
  switch (action.type) {
    case 'SET_GOALS':
      return { ...state, goals: action.payload, isLoading: false };
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id ? action.payload : g
        ),
      };
    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.payload),
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

/**
 * Create context with undefined default
 */
const GoalContext = createContext<GoalContextValue | undefined>(undefined);

/**
 * GoalProvider props
 */
interface GoalProviderProps {
  children: ReactNode;
  goalMgr?: GoalManager;
  categoryMgr?: CategoryManager;
  subgoalMgr?: SubgoalManager;
  postponeSvc?: PostponeService;
}

/**
 * GoalProvider - Provides goal state management throughout the app
 * Integrates CategoryManager, SubgoalManager, and PostponeService
 * Requirements: 1.2, 2.1, 2.4, 4.2, 6.1
 */
export function GoalProvider({
  children,
  goalMgr = goalManager,
  categoryMgr = categoryManager,
  subgoalMgr = subgoalManager,
  postponeSvc = postponeService,
}: GoalProviderProps) {
  const [state, dispatch] = useReducer(goalReducer, initialState);
  
  // Store gamification callbacks in a ref to avoid re-renders
  const gamificationCallbacksRef = React.useRef<GamificationCallbacks>({});

  /**
   * Load all goals from storage on mount
   */
  const refreshGoals = useCallback(() => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const allGoals = goalMgr.getAllGoals();
      dispatch({ type: 'SET_GOALS', payload: allGoals });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Failed to load goals:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load goals' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [goalMgr]);

  /**
   * Initial load
   */
  useEffect(() => {
    refreshGoals();
  }, [refreshGoals]);

  /**
   * Create a new goal
   */
  const createGoal = useCallback(async (input: CreateGoalInput): Promise<Goal> => {
    const goal = await goalMgr.createGoal(input);
    dispatch({ type: 'ADD_GOAL', payload: goal });
    return goal;
  }, [goalMgr]);

  /**
   * Update an existing goal
   */
  const updateGoal = useCallback(async (id: string, updates: UpdateGoalInput): Promise<Goal> => {
    const goal = await goalMgr.updateGoal(id, updates);
    dispatch({ type: 'UPDATE_GOAL', payload: goal });
    return goal;
  }, [goalMgr]);

  /**
   * Delete a goal (also deletes all subgoals)
   * Requirements: 2.8
   */
  const deleteGoal = useCallback(async (id: string): Promise<void> => {
    // Delete all subgoals first (cascade delete)
    subgoalMgr.deleteAllSubgoals(id);
    await goalMgr.deleteGoal(id);
    dispatch({ type: 'DELETE_GOAL', payload: id });
  }, [goalMgr, subgoalMgr]);

  /**
   * Toggle goal completion
   * Triggers gamification events when completing a goal
   * Requirements: 6.1
   */
  const toggleComplete = useCallback(async (id: string): Promise<Goal> => {
    const goalBefore = goalMgr.getGoal(id);
    const wasCompleted = goalBefore?.isCompleted ?? false;
    
    const goal = await goalMgr.toggleComplete(id);
    dispatch({ type: 'UPDATE_GOAL', payload: goal });
    
    // Trigger gamification event if goal was just completed
    if (!wasCompleted && goal.isCompleted) {
      // Calculate current streak for XP multiplier
      const currentStreak = statisticsService.calculateStreak();
      
      // Trigger gamification callback if set
      if (gamificationCallbacksRef.current.onGoalCompleted) {
        gamificationCallbacksRef.current.onGoalCompleted(goal, currentStreak);
      }
    }
    
    // Refresh to pick up any newly generated recurring goals
    refreshGoals();
    return goal;
  }, [goalMgr, refreshGoals]);

  /**
   * Get a single goal by ID
   */
  const getGoal = useCallback((id: string): Goal | null => {
    return goalMgr.getGoal(id);
  }, [goalMgr]);

  /**
   * Get goals for a specific date
   */
  const getGoalsByDate = useCallback((date: string): Goal[] => {
    return goalMgr.getGoalsByDate(date);
  }, [goalMgr]);

  /**
   * Group goals by date
   */
  const groupGoalsByDate = useCallback((goals: Goal[]): GroupedGoals => {
    return goalMgr.groupGoalsByDate(goals);
  }, [goalMgr]);

  /**
   * Sort goals by priority
   */
  const sortGoalsByPriority = useCallback((goals: Goal[]): Goal[] => {
    return goalMgr.sortGoalsByPriority(goals);
  }, [goalMgr]);

  /**
   * Check if all goals for a date are completed
   */
  const allGoalsCompleted = useCallback((date: string): boolean => {
    return goalMgr.allGoalsCompleted(date);
  }, [goalMgr]);

  /**
   * Delete entire recurring series
   */
  const deleteRecurringSeries = useCallback(async (goalId: string): Promise<void> => {
    await goalMgr.deleteRecurringSeries(goalId);
    refreshGoals();
  }, [goalMgr, refreshGoals]);
  
  // ============================================
  // Category Operations (integrated from CategoryManager)
  // Requirements: 1.2
  // ============================================
  
  /**
   * Assign a category to a goal
   */
  const assignCategoryToGoal = useCallback((goalId: string, categoryId: string): Goal => {
    const updatedGoal = categoryMgr.assignCategoryToGoal(goalId, categoryId);
    dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
    return updatedGoal;
  }, [categoryMgr]);
  
  /**
   * Get goals by category
   */
  const getGoalsByCategory = useCallback((categoryId: string): Goal[] => {
    return categoryMgr.getGoalsByCategory(categoryId);
  }, [categoryMgr]);
  
  // ============================================
  // Subgoal Operations (integrated from SubgoalManager)
  // Requirements: 2.4
  // ============================================
  
  /**
   * Get subgoals for a parent goal
   */
  const getSubgoals = useCallback((parentGoalId: string): Subgoal[] => {
    return subgoalMgr.getSubgoals(parentGoalId);
  }, [subgoalMgr]);
  
  /**
   * Create a new subgoal
   */
  const createSubgoal = useCallback((parentGoalId: string, title: string, isMilestone?: boolean): Subgoal => {
    const subgoal = subgoalMgr.createSubgoal(parentGoalId, title, isMilestone);
    // Refresh the parent goal to update its subgoals array
    const updatedGoal = goalMgr.getGoal(parentGoalId);
    if (updatedGoal) {
      dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
    }
    return subgoal;
  }, [subgoalMgr, goalMgr]);
  
  /**
   * Update a subgoal
   */
  const updateSubgoal = useCallback((
    id: string,
    parentGoalId: string,
    updates: Partial<Pick<Subgoal, 'title' | 'description' | 'isMilestone' | 'order'>>
  ): Subgoal => {
    const subgoal = subgoalMgr.updateSubgoal(id, parentGoalId, updates);
    // Refresh the parent goal
    const updatedGoal = goalMgr.getGoal(parentGoalId);
    if (updatedGoal) {
      dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
    }
    return subgoal;
  }, [subgoalMgr, goalMgr]);
  
  /**
   * Delete a subgoal
   */
  const deleteSubgoal = useCallback((id: string, parentGoalId: string): void => {
    subgoalMgr.deleteSubgoal(id, parentGoalId);
    // Refresh the parent goal
    const updatedGoal = goalMgr.getGoal(parentGoalId);
    if (updatedGoal) {
      dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
    }
  }, [subgoalMgr, goalMgr]);
  
  /**
   * Toggle subgoal completion
   * Triggers gamification events
   * Requirements: 2.4
   */
  const toggleSubgoalCompletion = useCallback((id: string, parentGoalId: string): Subgoal => {
    const subgoalBefore = subgoalMgr.getSubgoal(id, parentGoalId);
    const wasCompleted = subgoalBefore?.isCompleted ?? false;
    
    const subgoal = subgoalMgr.toggleSubgoalCompletion(id, parentGoalId);
    
    // Refresh the parent goal
    const updatedGoal = goalMgr.getGoal(parentGoalId);
    if (updatedGoal) {
      dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
    }
    
    // Trigger gamification event if subgoal was just completed
    if (!wasCompleted && subgoal.isCompleted) {
      if (gamificationCallbacksRef.current.onSubgoalCompleted) {
        gamificationCallbacksRef.current.onSubgoalCompleted(parentGoalId, id);
      }
    }
    
    return subgoal;
  }, [subgoalMgr, goalMgr]);
  
  /**
   * Calculate subgoal progress
   */
  const calculateSubgoalProgress = useCallback((parentGoalId: string): SubgoalProgress => {
    return subgoalMgr.calculateProgress(parentGoalId);
  }, [subgoalMgr]);
  
  /**
   * Check if all subgoals are complete
   */
  const areAllSubgoalsComplete = useCallback((parentGoalId: string): boolean => {
    return subgoalMgr.areAllSubgoalsComplete(parentGoalId);
  }, [subgoalMgr]);
  
  /**
   * Reorder subgoals
   */
  const reorderSubgoals = useCallback((parentGoalId: string, orderedIds: string[]): void => {
    subgoalMgr.reorderSubgoals(parentGoalId, orderedIds);
    // Refresh the parent goal
    const updatedGoal = goalMgr.getGoal(parentGoalId);
    if (updatedGoal) {
      dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
    }
  }, [subgoalMgr, goalMgr]);
  
  // ============================================
  // Postpone Operations (integrated from PostponeService)
  // Requirements: 4.2
  // ============================================
  
  /**
   * Postpone a goal to tomorrow
   */
  const postponeToTomorrow = useCallback(async (goalId: string): Promise<Goal> => {
    const updatedGoal = await postponeSvc.postponeToTomorrow(goalId);
    dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
    return updatedGoal;
  }, [postponeSvc]);
  
  /**
   * Postpone a goal to a specific date
   */
  const postponeToDate = useCallback(async (goalId: string, newDate: Date): Promise<Goal> => {
    const updatedGoal = await postponeSvc.postponeToDate(goalId, newDate);
    dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
    return updatedGoal;
  }, [postponeSvc]);
  
  /**
   * Snooze a goal's reminder
   */
  const snoozeReminder = useCallback(async (goalId: string, durationMinutes: number): Promise<void> => {
    await postponeSvc.snoozeReminder(goalId, durationMinutes);
    // Refresh the goal to get updated reminder time
    const updatedGoal = goalMgr.getGoal(goalId);
    if (updatedGoal) {
      dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
    }
  }, [postponeSvc, goalMgr]);
  
  /**
   * Undo a recent postponement
   */
  const undoPostpone = useCallback(async (goalId: string): Promise<Goal | null> => {
    const restoredGoal = await postponeSvc.undoPostpone(goalId);
    if (restoredGoal) {
      dispatch({ type: 'UPDATE_GOAL', payload: restoredGoal });
    }
    return restoredGoal;
  }, [postponeSvc]);
  
  /**
   * Get postpone count for a goal
   */
  const getPostponeCount = useCallback((goalId: string): number => {
    return postponeSvc.getPostponeCount(goalId);
  }, [postponeSvc]);
  
  /**
   * Get postpone history for a goal
   */
  const getPostponeHistory = useCallback((goalId: string): PostponeRecord[] => {
    return postponeSvc.getPostponeHistory(goalId);
  }, [postponeSvc]);
  
  /**
   * Check if a goal was postponed
   */
  const wasPostponed = useCallback((goalId: string): boolean => {
    return postponeSvc.wasPostponed(goalId);
  }, [postponeSvc]);
  
  /**
   * Check if undo is available for a goal
   */
  const canUndoPostpone = useCallback((goalId: string): boolean => {
    return postponeSvc.canUndo(goalId);
  }, [postponeSvc]);
  
  // ============================================
  // Gamification Callbacks
  // ============================================
  
  /**
   * Set gamification callbacks (called by GamificationContext)
   */
  const setGamificationCallbacks = useCallback((callbacks: GamificationCallbacks): void => {
    gamificationCallbacksRef.current = callbacks;
  }, []);

  const value: GoalContextValue = {
    ...state,
    createGoal,
    updateGoal,
    deleteGoal,
    toggleComplete,
    getGoal,
    getGoalsByDate,
    groupGoalsByDate,
    sortGoalsByPriority,
    allGoalsCompleted,
    deleteRecurringSeries,
    refreshGoals,
    // Category operations
    assignCategoryToGoal,
    getGoalsByCategory,
    // Subgoal operations
    getSubgoals,
    createSubgoal,
    updateSubgoal,
    deleteSubgoal,
    toggleSubgoalCompletion,
    calculateSubgoalProgress,
    areAllSubgoalsComplete,
    reorderSubgoals,
    // Postpone operations
    postponeToTomorrow,
    postponeToDate,
    snoozeReminder,
    undoPostpone,
    getPostponeCount,
    getPostponeHistory,
    wasPostponed,
    canUndoPostpone,
    // Gamification callbacks
    setGamificationCallbacks,
  };

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>;
}

/**
 * Hook to use goal context
 * @throws Error if used outside of GoalProvider
 */
export function useGoals(): GoalContextValue {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  return context;
}

export default GoalContext;
