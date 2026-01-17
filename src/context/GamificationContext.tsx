import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
  useRef,
} from 'react';
import {
  GamificationState,
  DEFAULT_GAMIFICATION_STATE,
  GameEvent,
} from '../types/gamification';
import { Badge, UnlockedBadge } from '../types/badge';
import { Challenge } from '../types/challenge';
import { PersonalBest, PersonalBestType } from '../types/personalBest';
import { XPTransaction, LevelDefinition } from '../types/xp';
import { Goal } from '../types/goal';
import { xpService, XPService } from '../services/xpService';
import { achievementService, AchievementService } from '../services/achievementService';
import { challengeService, ChallengeService } from '../services/challengeService';
import { personalBestService, PersonalBestService } from '../services/personalBestService';
import { storageService } from '../services/storageService';

/**
 * Storage key for gamification state
 */
const GAMIFICATION_STORAGE_KEY = 'gamification_state';

/**
 * Gamification context state interface
 */
interface GamificationContextState {
  state: GamificationState;
  isLoading: boolean;
  error: string | null;
  // Modal states for celebrations
  showLevelUpModal: boolean;
  levelUpData: { level: number; rewards: string[] } | null;
  showBadgeUnlockModal: boolean;
  badgeUnlockData: Badge | null;
  showChallengeCompleteModal: boolean;
  challengeCompleteData: Challenge | null;
  showPersonalBestModal: boolean;
  personalBestData: { type: PersonalBestType; oldValue: number; newValue: number } | null;
}

/**
 * Gamification action types
 */
type GamificationAction =
  | { type: 'SET_STATE'; payload: GamificationState }
  | { type: 'UPDATE_XP'; payload: { totalXP: number; currentLevel: number; transaction: XPTransaction } }
  | { type: 'ADD_UNLOCKED_BADGE'; payload: UnlockedBadge }
  | { type: 'SET_ACTIVE_CHALLENGES'; payload: Challenge[] }
  | { type: 'UPDATE_CHALLENGE'; payload: Challenge }
  | { type: 'ADD_CHALLENGE_TO_HISTORY'; payload: Challenge }
  | { type: 'SET_PERSONAL_BESTS'; payload: PersonalBest[] }
  | { type: 'UPDATE_STATS'; payload: Partial<GamificationState> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SHOW_LEVEL_UP_MODAL'; payload: { level: number; rewards: string[] } }
  | { type: 'HIDE_LEVEL_UP_MODAL' }
  | { type: 'SHOW_BADGE_UNLOCK_MODAL'; payload: Badge }
  | { type: 'HIDE_BADGE_UNLOCK_MODAL' }
  | { type: 'SHOW_CHALLENGE_COMPLETE_MODAL'; payload: Challenge }
  | { type: 'HIDE_CHALLENGE_COMPLETE_MODAL' }
  | { type: 'SHOW_PERSONAL_BEST_MODAL'; payload: { type: PersonalBestType; oldValue: number; newValue: number } }
  | { type: 'HIDE_PERSONAL_BEST_MODAL' };

/**
 * Gamification context value interface
 */
interface GamificationContextValue extends GamificationContextState {
  // XP operations
  getTotalXP: () => number;
  getCurrentLevel: () => number;
  getXPToNextLevel: () => number;
  getLevelProgress: () => { current: number; required: number; percentage: number };
  getStreakMultiplier: (streakDays: number) => number;
  getLevelDefinition: (level: number) => LevelDefinition | undefined;
  getUnlockedRewards: () => string[];
  getXPHistory: (limit?: number) => XPTransaction[];

  // Badge operations
  getAllBadges: () => Badge[];
  getUnlockedBadges: () => UnlockedBadge[];
  getLockedBadges: () => Badge[];
  getBadgeProgress: (badgeId: string) => { current: number; required: number; percentage: number };

  // Challenge operations
  getActiveChallenges: () => Challenge[];
  getChallengeHistory: () => Challenge[];
  generateWeeklyChallenges: () => Challenge[];
  shouldGenerateNewChallenges: () => boolean;

  // Personal best operations
  getAllPersonalBests: () => PersonalBest[];
  getPersonalBest: (type: PersonalBestType) => PersonalBest | undefined;
  formatPersonalBestValue: (type: PersonalBestType, value: number) => string;

  // Game event handling
  handleGoalCompleted: (goal: Goal, currentStreak: number) => void;
  handleSubgoalCompleted: (goalId: string, subgoalId: string) => void;
  handleStreakUpdated: (currentStreak: number) => void;
  handleDayCompleted: (completedToday: number, consecutivePerfectDays?: number) => void;

  // Modal controls
  dismissLevelUpModal: () => void;
  dismissBadgeUnlockModal: () => void;
  dismissChallengeCompleteModal: () => void;
  dismissPersonalBestModal: () => void;

  // Refresh
  refreshGamificationState: () => void;
}

/**
 * Initial context state
 */
const initialContextState: GamificationContextState = {
  state: DEFAULT_GAMIFICATION_STATE,
  isLoading: true,
  error: null,
  showLevelUpModal: false,
  levelUpData: null,
  showBadgeUnlockModal: false,
  badgeUnlockData: null,
  showChallengeCompleteModal: false,
  challengeCompleteData: null,
  showPersonalBestModal: false,
  personalBestData: null,
};


/**
 * Gamification reducer
 */
function gamificationReducer(
  state: GamificationContextState,
  action: GamificationAction
): GamificationContextState {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, state: action.payload, isLoading: false };

    case 'UPDATE_XP':
      return {
        ...state,
        state: {
          ...state.state,
          totalXP: action.payload.totalXP,
          currentLevel: action.payload.currentLevel,
          xpHistory: [action.payload.transaction, ...state.state.xpHistory],
        },
      };

    case 'ADD_UNLOCKED_BADGE':
      return {
        ...state,
        state: {
          ...state.state,
          unlockedBadges: [...state.state.unlockedBadges, action.payload],
        },
      };

    case 'SET_ACTIVE_CHALLENGES':
      return {
        ...state,
        state: {
          ...state.state,
          activeChallenges: action.payload,
        },
      };

    case 'UPDATE_CHALLENGE':
      return {
        ...state,
        state: {
          ...state.state,
          activeChallenges: state.state.activeChallenges.map((c) =>
            c.id === action.payload.id ? action.payload : c
          ),
        },
      };

    case 'ADD_CHALLENGE_TO_HISTORY':
      return {
        ...state,
        state: {
          ...state.state,
          activeChallenges: state.state.activeChallenges.filter(
            (c) => c.id !== action.payload.id
          ),
          challengeHistory: [action.payload, ...state.state.challengeHistory],
        },
      };

    case 'SET_PERSONAL_BESTS':
      return {
        ...state,
        state: {
          ...state.state,
          personalBests: action.payload,
        },
      };

    case 'UPDATE_STATS':
      return {
        ...state,
        state: {
          ...state.state,
          ...action.payload,
        },
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SHOW_LEVEL_UP_MODAL':
      return {
        ...state,
        showLevelUpModal: true,
        levelUpData: action.payload,
      };

    case 'HIDE_LEVEL_UP_MODAL':
      return {
        ...state,
        showLevelUpModal: false,
        levelUpData: null,
      };

    case 'SHOW_BADGE_UNLOCK_MODAL':
      return {
        ...state,
        showBadgeUnlockModal: true,
        badgeUnlockData: action.payload,
      };

    case 'HIDE_BADGE_UNLOCK_MODAL':
      return {
        ...state,
        showBadgeUnlockModal: false,
        badgeUnlockData: null,
      };

    case 'SHOW_CHALLENGE_COMPLETE_MODAL':
      return {
        ...state,
        showChallengeCompleteModal: true,
        challengeCompleteData: action.payload,
      };

    case 'HIDE_CHALLENGE_COMPLETE_MODAL':
      return {
        ...state,
        showChallengeCompleteModal: false,
        challengeCompleteData: null,
      };

    case 'SHOW_PERSONAL_BEST_MODAL':
      return {
        ...state,
        showPersonalBestModal: true,
        personalBestData: action.payload,
      };

    case 'HIDE_PERSONAL_BEST_MODAL':
      return {
        ...state,
        showPersonalBestModal: false,
        personalBestData: null,
      };

    default:
      return state;
  }
}

/**
 * Create context with undefined default
 */
const GamificationContext = createContext<GamificationContextValue | undefined>(undefined);

/**
 * GamificationProvider props
 */
interface GamificationProviderProps {
  children: ReactNode;
  xpSvc?: XPService;
  achievementSvc?: AchievementService;
  challengeSvc?: ChallengeService;
  personalBestSvc?: PersonalBestService;
}


/**
 * GamificationProvider - Provides unified gamification state management
 * Integrates XP, Achievement, Challenge, and Personal Best services
 * Requirements: 5.9, 6.9, 7.9, 8.10
 */
export function GamificationProvider({
  children,
  xpSvc = xpService,
  achievementSvc = achievementService,
  challengeSvc = challengeService,
  personalBestSvc = personalBestService,
}: GamificationProviderProps) {
  const [contextState, dispatch] = useReducer(gamificationReducer, initialContextState);

  // Track daily stats for personal bests
  const dailyStatsRef = useRef({
    goalsCompletedToday: 0,
    subgoalsCompletedToday: 0,
    lastResetDate: new Date().toISOString().split('T')[0],
  });

  /**
   * Gets the raw MMKV storage instance
   */
  const getStorageInstance = useCallback(() => {
    return (storageService as any).storage;
  }, []);

  /**
   * Persists gamification state to storage
   * Requirements: 5.9, 6.9, 7.9, 8.10
   */
  const persistState = useCallback((state: GamificationState) => {
    try {
      const storage = getStorageInstance();
      storage.set(GAMIFICATION_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to persist gamification state:', error);
    }
  }, [getStorageInstance]);

  /**
   * Loads gamification state from storage and services
   */
  const loadGamificationState = useCallback((): GamificationState => {
    try {
      // Load from individual services for most up-to-date data
      const totalXP = xpSvc.getTotalXP();
      const currentLevel = xpSvc.getCurrentLevel();
      const xpHistory = xpSvc.getXPHistory();
      const unlockedBadges = achievementSvc.getUnlockedBadges();
      const activeChallenges = challengeSvc.getActiveChallenges();
      const challengeHistory = challengeSvc.getChallengeHistory();
      const personalBests = personalBestSvc.getAllPersonalBests();

      // Load persisted stats from storage
      const storage = getStorageInstance();
      const stateJson = storage.getString(GAMIFICATION_STORAGE_KEY);
      let persistedStats = DEFAULT_GAMIFICATION_STATE;
      
      if (stateJson) {
        try {
          persistedStats = JSON.parse(stateJson) as GamificationState;
        } catch {
          // Use defaults if parse fails
        }
      }

      return {
        totalXP,
        currentLevel,
        xpHistory,
        unlockedBadges,
        activeChallenges,
        challengeHistory,
        personalBests,
        personalBestHistory: persistedStats.personalBestHistory ?? [],
        totalGoalsCompleted: persistedStats.totalGoalsCompleted ?? 0,
        goalsCompletedByCategory: persistedStats.goalsCompletedByCategory ?? {},
        currentStreak: persistedStats.currentStreak ?? 0,
        longestStreak: persistedStats.longestStreak ?? 0,
      };
    } catch (error) {
      console.error('Failed to load gamification state:', error);
      return DEFAULT_GAMIFICATION_STATE;
    }
  }, [xpSvc, achievementSvc, challengeSvc, personalBestSvc, getStorageInstance]);

  /**
   * Refreshes gamification state from storage/services
   */
  const refreshGamificationState = useCallback(() => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const state = loadGamificationState();
      dispatch({ type: 'SET_STATE', payload: state });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Check if we need to generate new weekly challenges
      if (challengeSvc.shouldGenerateNewChallenges()) {
        challengeSvc.expireOldChallenges();
        const newChallenges = challengeSvc.generateWeeklyChallenges();
        dispatch({ type: 'SET_ACTIVE_CHALLENGES', payload: newChallenges });
      }
    } catch (error) {
      console.error('Failed to refresh gamification state:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load gamification data' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [loadGamificationState, challengeSvc]);

  /**
   * Set up service callbacks for celebrations
   */
  useEffect(() => {
    // Level up callback
    xpSvc.onLevelUp = (newLevel: number, rewards: string[]) => {
      dispatch({ type: 'SHOW_LEVEL_UP_MODAL', payload: { level: newLevel, rewards } });
    };

    // Badge unlock callback
    achievementSvc.onBadgeUnlocked = (badge: Badge) => {
      dispatch({ type: 'SHOW_BADGE_UNLOCK_MODAL', payload: badge });
      // Also award XP for badge unlock
      xpSvc.awardXP(badge.xpReward, `Badge unlocked: ${badge.name}`);
    };

    // Challenge complete callback
    challengeSvc.onChallengeCompleted = (challenge: Challenge) => {
      dispatch({ type: 'SHOW_CHALLENGE_COMPLETE_MODAL', payload: challenge });
      dispatch({ type: 'ADD_CHALLENGE_TO_HISTORY', payload: challenge });
    };

    // Personal best callback
    personalBestSvc.onNewPersonalBest = (
      type: PersonalBestType,
      oldValue: number,
      newValue: number
    ) => {
      dispatch({ type: 'SHOW_PERSONAL_BEST_MODAL', payload: { type, oldValue, newValue } });
    };

    return () => {
      // Clean up callbacks
      xpSvc.onLevelUp = undefined;
      achievementSvc.onBadgeUnlocked = undefined;
      challengeSvc.onChallengeCompleted = undefined;
      personalBestSvc.onNewPersonalBest = undefined;
    };
  }, [xpSvc, achievementSvc, challengeSvc, personalBestSvc]);

  /**
   * Initial load
   */
  useEffect(() => {
    refreshGamificationState();
  }, [refreshGamificationState]);

  /**
   * Reset daily stats at midnight
   */
  useEffect(() => {
    const checkDateReset = () => {
      const today = new Date().toISOString().split('T')[0];
      if (dailyStatsRef.current.lastResetDate !== today) {
        dailyStatsRef.current = {
          goalsCompletedToday: 0,
          subgoalsCompletedToday: 0,
          lastResetDate: today,
        };
      }
    };

    checkDateReset();
    const interval = setInterval(checkDateReset, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);


  // ============================================
  // XP Operations
  // ============================================

  const getTotalXP = useCallback(() => xpSvc.getTotalXP(), [xpSvc]);
  const getCurrentLevel = useCallback(() => xpSvc.getCurrentLevel(), [xpSvc]);
  const getXPToNextLevel = useCallback(() => xpSvc.getXPToNextLevel(), [xpSvc]);
  const getLevelProgress = useCallback(() => xpSvc.getLevelProgress(), [xpSvc]);
  const getStreakMultiplier = useCallback(
    (streakDays: number) => xpSvc.getStreakMultiplier(streakDays),
    [xpSvc]
  );
  const getLevelDefinition = useCallback(
    (level: number) => xpSvc.getLevelDefinition(level),
    [xpSvc]
  );
  const getUnlockedRewards = useCallback(() => xpSvc.getUnlockedRewards(), [xpSvc]);
  const getXPHistory = useCallback(
    (limit?: number) => xpSvc.getXPHistory(limit),
    [xpSvc]
  );

  // ============================================
  // Badge Operations
  // ============================================

  const getAllBadges = useCallback(() => achievementSvc.getAllBadges(), [achievementSvc]);
  const getUnlockedBadges = useCallback(() => achievementSvc.getUnlockedBadges(), [achievementSvc]);
  const getLockedBadges = useCallback(() => achievementSvc.getLockedBadges(), [achievementSvc]);
  const getBadgeProgress = useCallback(
    (badgeId: string) => {
      const progress = achievementSvc.getBadgeProgress(badgeId);
      return {
        current: progress.current,
        required: progress.required,
        percentage: progress.percentage,
      };
    },
    [achievementSvc]
  );

  // ============================================
  // Challenge Operations
  // ============================================

  const getActiveChallenges = useCallback(
    () => challengeSvc.getActiveChallenges(),
    [challengeSvc]
  );
  const getChallengeHistory = useCallback(
    () => challengeSvc.getChallengeHistory(),
    [challengeSvc]
  );
  const generateWeeklyChallenges = useCallback(() => {
    const challenges = challengeSvc.generateWeeklyChallenges();
    dispatch({ type: 'SET_ACTIVE_CHALLENGES', payload: challenges });
    return challenges;
  }, [challengeSvc]);
  const shouldGenerateNewChallenges = useCallback(
    () => challengeSvc.shouldGenerateNewChallenges(),
    [challengeSvc]
  );

  // ============================================
  // Personal Best Operations
  // ============================================

  const getAllPersonalBests = useCallback(
    () => personalBestSvc.getAllPersonalBests(),
    [personalBestSvc]
  );
  const getPersonalBest = useCallback(
    (type: PersonalBestType) => personalBestSvc.getPersonalBest(type),
    [personalBestSvc]
  );
  const formatPersonalBestValue = useCallback(
    (type: PersonalBestType, value: number) => personalBestSvc.formatValue(type, value),
    [personalBestSvc]
  );

  // ============================================
  // Game Event Handlers
  // ============================================

  /**
   * Handles goal completion event
   * Triggers XP award, badge evaluation, challenge progress, and personal best checks
   */
  const handleGoalCompleted = useCallback(
    (goal: Goal, currentStreak: number) => {
      const now = new Date();
      const categoryId = goal.categoryId ?? 'other';

      // Update daily stats
      dailyStatsRef.current.goalsCompletedToday += 1;

      // Calculate and award XP
      const xpAmount = xpSvc.calculateGoalXP(goal, currentStreak);
      const transaction = xpSvc.awardXP(xpAmount, `Completed: ${goal.title}`, currentStreak);

      // Update context state with new XP
      dispatch({
        type: 'UPDATE_XP',
        payload: {
          totalXP: xpSvc.getTotalXP(),
          currentLevel: xpSvc.getCurrentLevel(),
          transaction,
        },
      });

      // Update stats
      const newTotalCompleted = contextState.state.totalGoalsCompleted + 1;
      const newCategoryCount = (contextState.state.goalsCompletedByCategory[categoryId] ?? 0) + 1;
      const newGoalsByCategory = {
        ...contextState.state.goalsCompletedByCategory,
        [categoryId]: newCategoryCount,
      };

      dispatch({
        type: 'UPDATE_STATS',
        payload: {
          totalGoalsCompleted: newTotalCompleted,
          goalsCompletedByCategory: newGoalsByCategory,
          currentStreak,
          longestStreak: Math.max(contextState.state.longestStreak, currentStreak),
        },
      });

      // Create game event for badge evaluation
      const gameEvent: GameEvent = {
        type: 'goal_completed',
        timestamp: now.toISOString(),
        data: {
          goalId: goal.id,
          categoryId,
          priority: goal.priority,
          totalCompleted: newTotalCompleted,
          categoryCount: newCategoryCount,
        },
      };

      // Evaluate badges
      const newBadges = achievementSvc.evaluateBadges(gameEvent);
      newBadges.forEach((badge) => {
        dispatch({ type: 'ADD_UNLOCKED_BADGE', payload: badge });
      });

      // Update challenge progress
      challengeSvc.updateChallengeProgress({
        type: 'goal_completed',
        goalId: goal.id,
        categoryId,
        priority: goal.priority,
        completionTime: now,
      });

      // Refresh challenges in state
      dispatch({ type: 'SET_ACTIVE_CHALLENGES', payload: challengeSvc.getActiveChallenges() });

      // Check personal bests
      personalBestSvc.checkMostGoalsInDay(dailyStatsRef.current.goalsCompletedToday);

      // Check fastest completion if goal has createdAt
      if (goal.createdAt) {
        const createdAt = new Date(goal.createdAt);
        const durationMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
        personalBestSvc.checkFastestCompletion(durationMinutes);
      }

      // Update personal bests in state
      dispatch({ type: 'SET_PERSONAL_BESTS', payload: personalBestSvc.getAllPersonalBests() });

      // Persist updated state
      persistState({
        ...contextState.state,
        totalXP: xpSvc.getTotalXP(),
        currentLevel: xpSvc.getCurrentLevel(),
        totalGoalsCompleted: newTotalCompleted,
        goalsCompletedByCategory: newGoalsByCategory,
        currentStreak,
        longestStreak: Math.max(contextState.state.longestStreak, currentStreak),
      });
    },
    [xpSvc, achievementSvc, challengeSvc, personalBestSvc, contextState.state, persistState]
  );


  /**
   * Handles subgoal completion event
   */
  const handleSubgoalCompleted = useCallback(
    (goalId: string, _subgoalId: string) => {
      // Update daily stats
      dailyStatsRef.current.subgoalsCompletedToday += 1;

      // Award XP for subgoal
      const transaction = xpSvc.awardXP(5, 'Subgoal completed');
      dispatch({
        type: 'UPDATE_XP',
        payload: {
          totalXP: xpSvc.getTotalXP(),
          currentLevel: xpSvc.getCurrentLevel(),
          transaction,
        },
      });

      // Update challenge progress
      challengeSvc.updateChallengeProgress({
        type: 'subgoal_completed',
        goalId,
      });

      // Refresh challenges in state
      dispatch({ type: 'SET_ACTIVE_CHALLENGES', payload: challengeSvc.getActiveChallenges() });

      // Check personal best for subgoals
      personalBestSvc.checkMostSubgoalsInDay(dailyStatsRef.current.subgoalsCompletedToday);
      dispatch({ type: 'SET_PERSONAL_BESTS', payload: personalBestSvc.getAllPersonalBests() });
    },
    [xpSvc, challengeSvc, personalBestSvc]
  );

  /**
   * Handles streak update event
   */
  const handleStreakUpdated = useCallback(
    (currentStreak: number) => {
      // Create game event for badge evaluation
      const gameEvent: GameEvent = {
        type: 'streak_updated',
        timestamp: new Date().toISOString(),
        data: {
          currentStreak,
        },
      };

      // Evaluate streak badges
      const newBadges = achievementSvc.evaluateBadges(gameEvent);
      newBadges.forEach((badge) => {
        dispatch({ type: 'ADD_UNLOCKED_BADGE', payload: badge });
      });

      // Update challenge progress for streak maintenance
      challengeSvc.updateChallengeProgress({
        type: 'streak_updated',
        streakDays: currentStreak,
      });

      // Refresh challenges in state
      dispatch({ type: 'SET_ACTIVE_CHALLENGES', payload: challengeSvc.getActiveChallenges() });

      // Check personal best for longest streak
      personalBestSvc.checkLongestStreak(currentStreak);
      dispatch({ type: 'SET_PERSONAL_BESTS', payload: personalBestSvc.getAllPersonalBests() });

      // Update state
      dispatch({
        type: 'UPDATE_STATS',
        payload: {
          currentStreak,
          longestStreak: Math.max(contextState.state.longestStreak, currentStreak),
        },
      });

      // Persist
      persistState({
        ...contextState.state,
        currentStreak,
        longestStreak: Math.max(contextState.state.longestStreak, currentStreak),
      });
    },
    [achievementSvc, challengeSvc, personalBestSvc, contextState.state, persistState]
  );

  /**
   * Handles day completion event (for perfect week tracking)
   */
  const handleDayCompleted = useCallback(
    (completedToday: number, consecutivePerfectDays?: number) => {
      // Create game event for badge evaluation
      const gameEvent: GameEvent = {
        type: 'day_completed',
        timestamp: new Date().toISOString(),
        data: {
          completedToday,
          consecutivePerfectDays: consecutivePerfectDays ?? 0,
        },
      };

      // Evaluate badges (including perfect week)
      const newBadges = achievementSvc.evaluateBadges(gameEvent);
      newBadges.forEach((badge) => {
        dispatch({ type: 'ADD_UNLOCKED_BADGE', payload: badge });
      });

      // Check weekly XP personal best
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);
      const weeklyXP = xpSvc.getXPForPeriod(weekStart, new Date());
      personalBestSvc.checkMostXPInWeek(weeklyXP);
      dispatch({ type: 'SET_PERSONAL_BESTS', payload: personalBestSvc.getAllPersonalBests() });
    },
    [achievementSvc, xpSvc, personalBestSvc]
  );

  // ============================================
  // Modal Controls
  // ============================================

  const dismissLevelUpModal = useCallback(() => {
    dispatch({ type: 'HIDE_LEVEL_UP_MODAL' });
  }, []);

  const dismissBadgeUnlockModal = useCallback(() => {
    dispatch({ type: 'HIDE_BADGE_UNLOCK_MODAL' });
  }, []);

  const dismissChallengeCompleteModal = useCallback(() => {
    dispatch({ type: 'HIDE_CHALLENGE_COMPLETE_MODAL' });
  }, []);

  const dismissPersonalBestModal = useCallback(() => {
    dispatch({ type: 'HIDE_PERSONAL_BEST_MODAL' });
  }, []);

  // ============================================
  // Context Value
  // ============================================

  const value: GamificationContextValue = {
    ...contextState,
    // XP operations
    getTotalXP,
    getCurrentLevel,
    getXPToNextLevel,
    getLevelProgress,
    getStreakMultiplier,
    getLevelDefinition,
    getUnlockedRewards,
    getXPHistory,
    // Badge operations
    getAllBadges,
    getUnlockedBadges,
    getLockedBadges,
    getBadgeProgress,
    // Challenge operations
    getActiveChallenges,
    getChallengeHistory,
    generateWeeklyChallenges,
    shouldGenerateNewChallenges,
    // Personal best operations
    getAllPersonalBests,
    getPersonalBest,
    formatPersonalBestValue,
    // Game event handlers
    handleGoalCompleted,
    handleSubgoalCompleted,
    handleStreakUpdated,
    handleDayCompleted,
    // Modal controls
    dismissLevelUpModal,
    dismissBadgeUnlockModal,
    dismissChallengeCompleteModal,
    dismissPersonalBestModal,
    // Refresh
    refreshGamificationState,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

/**
 * Hook to use gamification context
 * @throws Error if used outside of GamificationProvider
 */
export function useGamification(): GamificationContextValue {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}

export default GamificationContext;
