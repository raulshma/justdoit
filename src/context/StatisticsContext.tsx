import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { Statistics } from '../types';
import { statisticsService } from '../services/statisticsService';

/**
 * Statistics state interface
 */
interface StatisticsState {
  statistics: Statistics;
  isLoading: boolean;
  error: string | null;
}

/**
 * Statistics action types
 */
type StatisticsAction =
  | { type: 'SET_STATISTICS'; payload: Statistics }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

/**
 * Statistics context value interface
 */
interface StatisticsContextValue extends StatisticsState {
  // Statistics operations
  refreshStatistics: () => Promise<void>;
  // Individual calculations (for real-time updates)
  calculateTodayStats: () => Statistics;
  calculateWeeklyCompletionRate: () => number;
  calculateStreak: () => number;
  getLast7DaysCompletions: () => number[];
  getAveragePerDay: () => number;
}

/**
 * Default statistics
 */
const DEFAULT_STATISTICS: Statistics = {
  todayCompleted: 0,
  todayTotal: 0,
  weeklyCompletionRate: 0,
  currentStreak: 0,
  longestStreak: 0,
  last7DaysCompletions: [0, 0, 0, 0, 0, 0, 0],
  averagePerDay: 0,
  completionsByHour: new Array(24).fill(0),
  completionsByDayOfWeek: new Array(7).fill(0),
  peakHours: [],
  lowPerformanceDays: [],
};

/**
 * Initial state
 */
const initialState: StatisticsState = {
  statistics: DEFAULT_STATISTICS,
  isLoading: true,
  error: null,
};

/**
 * Statistics reducer
 */
function statisticsReducer(state: StatisticsState, action: StatisticsAction): StatisticsState {
  switch (action.type) {
    case 'SET_STATISTICS':
      return { ...state, statistics: action.payload, isLoading: false };
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
const StatisticsContext = createContext<StatisticsContextValue | undefined>(undefined);

/**
 * StatisticsProvider props
 */
interface StatisticsProviderProps {
  children: ReactNode;
}

/**
 * StatisticsProvider - Provides statistics state management throughout the app
 * Requirements: 11.1 - Display total goals completed today
 */
export function StatisticsProvider({ children }: StatisticsProviderProps) {
  const [state, dispatch] = useReducer(statisticsReducer, initialState);

  /**
   * Refresh statistics from storage/calculations
   */
  const refreshStatistics = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const stats = await statisticsService.refreshStatistics();
      dispatch({ type: 'SET_STATISTICS', payload: stats });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Failed to refresh statistics:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load statistics' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  /**
   * Initial load
   */
  useEffect(() => {
    refreshStatistics();
  }, [refreshStatistics]);

  /**
   * Calculate today's stats (real-time)
   */
  const calculateTodayStats = useCallback((): Statistics => {
    return statisticsService.calculateTodayStats();
  }, []);

  /**
   * Calculate weekly completion rate (real-time)
   */
  const calculateWeeklyCompletionRate = useCallback((): number => {
    return statisticsService.calculateWeeklyCompletionRate();
  }, []);

  /**
   * Calculate current streak (real-time)
   */
  const calculateStreak = useCallback((): number => {
    return statisticsService.calculateStreak();
  }, []);

  /**
   * Get last 7 days completions (real-time)
   */
  const getLast7DaysCompletions = useCallback((): number[] => {
    return statisticsService.getLast7DaysCompletions();
  }, []);

  /**
   * Get average per day (real-time)
   */
  const getAveragePerDay = useCallback((): number => {
    return statisticsService.getAveragePerDay();
  }, []);

  const value: StatisticsContextValue = {
    ...state,
    refreshStatistics,
    calculateTodayStats,
    calculateWeeklyCompletionRate,
    calculateStreak,
    getLast7DaysCompletions,
    getAveragePerDay,
  };

  return <StatisticsContext.Provider value={value}>{children}</StatisticsContext.Provider>;
}

/**
 * Hook to use statistics context
 * @throws Error if used outside of StatisticsProvider
 */
export function useStatistics(): StatisticsContextValue {
  const context = useContext(StatisticsContext);
  if (context === undefined) {
    throw new Error('useStatistics must be used within a StatisticsProvider');
  }
  return context;
}

export default StatisticsContext;
