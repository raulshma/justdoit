import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { Goal } from '../types';
import {
  goalManager,
  CreateGoalInput,
  UpdateGoalInput,
  GroupedGoals,
} from '../services/goalManager';

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
  updateGoal: (id: string, updates: UpdateGoalInput) => Goal;
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
}

/**
 * GoalProvider - Provides goal state management throughout the app
 * Requirements: 2.1 - Retrieve and display all stored goals from local storage
 */
export function GoalProvider({ children }: GoalProviderProps) {
  const [state, dispatch] = useReducer(goalReducer, initialState);

  /**
   * Load all goals from storage on mount
   */
  const refreshGoals = useCallback(() => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const allGoals = goalManager.getAllGoals();
      dispatch({ type: 'SET_GOALS', payload: allGoals });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Failed to load goals:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load goals' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

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
    const goal = await goalManager.createGoal(input);
    dispatch({ type: 'ADD_GOAL', payload: goal });
    return goal;
  }, []);

  /**
   * Update an existing goal
   */
  const updateGoal = useCallback((id: string, updates: UpdateGoalInput): Goal => {
    const goal = goalManager.updateGoal(id, updates);
    dispatch({ type: 'UPDATE_GOAL', payload: goal });
    return goal;
  }, []);

  /**
   * Delete a goal
   */
  const deleteGoal = useCallback(async (id: string): Promise<void> => {
    await goalManager.deleteGoal(id);
    dispatch({ type: 'DELETE_GOAL', payload: id });
  }, []);

  /**
   * Toggle goal completion
   */
  const toggleComplete = useCallback(async (id: string): Promise<Goal> => {
    const goal = await goalManager.toggleComplete(id);
    dispatch({ type: 'UPDATE_GOAL', payload: goal });
    // Refresh to pick up any newly generated recurring goals
    refreshGoals();
    return goal;
  }, [refreshGoals]);

  /**
   * Get a single goal by ID
   */
  const getGoal = useCallback((id: string): Goal | null => {
    return goalManager.getGoal(id);
  }, []);

  /**
   * Get goals for a specific date
   */
  const getGoalsByDate = useCallback((date: string): Goal[] => {
    return goalManager.getGoalsByDate(date);
  }, []);

  /**
   * Group goals by date
   */
  const groupGoalsByDate = useCallback((goals: Goal[]): GroupedGoals => {
    return goalManager.groupGoalsByDate(goals);
  }, []);

  /**
   * Sort goals by priority
   */
  const sortGoalsByPriority = useCallback((goals: Goal[]): Goal[] => {
    return goalManager.sortGoalsByPriority(goals);
  }, []);

  /**
   * Check if all goals for a date are completed
   */
  const allGoalsCompleted = useCallback((date: string): boolean => {
    return goalManager.allGoalsCompleted(date);
  }, []);

  /**
   * Delete entire recurring series
   */
  const deleteRecurringSeries = useCallback(async (goalId: string): Promise<void> => {
    await goalManager.deleteRecurringSeries(goalId);
    refreshGoals();
  }, [refreshGoals]);

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
