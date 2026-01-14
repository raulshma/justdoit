import {
  Challenge,
  ChallengeType,
  ChallengeStatus,
  ChallengeTemplate,
  CHALLENGE_TEMPLATES,
} from '../types/challenge';
import { DEFAULT_CATEGORIES } from '../types/category';
import { StorageService, storageService } from './storageService';
import { XPService, xpService } from './xpService';

/**
 * Storage keys for challenge data
 */
export const CHALLENGE_STORAGE_KEYS = {
  ACTIVE_CHALLENGES: 'challenges_active',
  CHALLENGE_HISTORY: 'challenges_history',
  USER_PERFORMANCE: 'challenges_user_performance',
} as const;

/**
 * User performance metrics for difficulty scaling
 */
export interface UserPerformance {
  /** Average goals completed per week */
  avgGoalsPerWeek: number;
  /** Average high-priority goals per week */
  avgHighPriorityPerWeek: number;
  /** Average streak length */
  avgStreakLength: number;
  /** Average subgoals completed per week */
  avgSubgoalsPerWeek: number;
  /** Goals completed by category */
  goalsByCategory: Record<string, number>;
}

/**
 * Default user performance for new users
 */
const DEFAULT_USER_PERFORMANCE: UserPerformance = {
  avgGoalsPerWeek: 7,
  avgHighPriorityPerWeek: 2,
  avgStreakLength: 3,
  avgSubgoalsPerWeek: 10,
  goalsByCategory: {},
};

/**
 * Baseline performance for scaling calculations
 */
const BASELINE_PERFORMANCE = {
  goalsPerWeek: 7,
  highPriorityPerWeek: 2,
  streakLength: 5,
  subgoalsPerWeek: 10,
};

/**
 * Game event types for challenge progress tracking
 */
export interface GameEvent {
  type: 'goal_completed' | 'subgoal_completed' | 'streak_updated';
  goalId?: string;
  categoryId?: string;
  priority?: 'low' | 'medium' | 'high';
  completionTime?: Date;
  streakDays?: number;
}

/**
 * Challenge Service Interface
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9
 */
export interface IChallengeService {
  // Challenge retrieval
  getActiveChallenges(): Challenge[];
  getChallengeHistory(): Challenge[];

  // Challenge generation
  generateWeeklyChallenges(): Challenge[];
  scaleDifficulty(baseTarget: number, userPerformance: number, scalingFactor: number): number;

  // Progress tracking
  updateChallengeProgress(event: GameEvent): void;
  checkChallengeCompletion(challengeId: string): boolean;

  // Lifecycle
  expireOldChallenges(): void;

  // Events
  onChallengeCompleted?: (challenge: Challenge) => void;
}

/**
 * Generates a UUID v4
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets the start of the current week (Monday)
 */
function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Gets the end of the current week (Sunday 23:59:59)
 */
function getWeekEnd(date: Date = new Date()): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}


/**
 * ChallengeService - Handles weekly challenge generation, tracking, and completion
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9
 */
export class ChallengeService implements IChallengeService {
  private storage: StorageService;
  private xpService: XPService;
  public onChallengeCompleted?: (challenge: Challenge) => void;

  constructor(storage?: StorageService, xp?: XPService) {
    this.storage = storage ?? storageService;
    this.xpService = xp ?? xpService;
  }

  /**
   * Gets the raw MMKV storage instance
   */
  private getStorageInstance() {
    return (this.storage as any).storage;
  }

  /**
   * Retrieves active challenges
   * Requirements: 7.3
   */
  getActiveChallenges(): Challenge[] {
    try {
      const storage = this.getStorageInstance();
      const challengesJson = storage.getString(CHALLENGE_STORAGE_KEYS.ACTIVE_CHALLENGES);
      if (!challengesJson) {
        return [];
      }
      const challenges = JSON.parse(challengesJson) as Challenge[];
      return challenges.filter((c) => c.status === 'active');
    } catch (error) {
      console.error('Failed to get active challenges:', error);
      return [];
    }
  }

  /**
   * Saves active challenges to storage
   */
  private saveActiveChallenges(challenges: Challenge[]): void {
    try {
      const storage = this.getStorageInstance();
      storage.set(CHALLENGE_STORAGE_KEYS.ACTIVE_CHALLENGES, JSON.stringify(challenges));
    } catch (error) {
      console.error('Failed to save active challenges:', error);
      throw new Error('Failed to save active challenges to storage');
    }
  }

  /**
   * Retrieves challenge history
   * Requirements: 7.6
   */
  getChallengeHistory(): Challenge[] {
    try {
      const storage = this.getStorageInstance();
      const historyJson = storage.getString(CHALLENGE_STORAGE_KEYS.CHALLENGE_HISTORY);
      if (!historyJson) {
        return [];
      }
      const history = JSON.parse(historyJson) as Challenge[];
      // Sort by end date descending (most recent first)
      return history.sort(
        (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
      );
    } catch (error) {
      console.error('Failed to get challenge history:', error);
      return [];
    }
  }

  /**
   * Saves challenge history
   */
  private saveChallengeHistory(history: Challenge[]): void {
    try {
      const storage = this.getStorageInstance();
      storage.set(CHALLENGE_STORAGE_KEYS.CHALLENGE_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save challenge history:', error);
      throw new Error('Failed to save challenge history to storage');
    }
  }

  /**
   * Retrieves user performance metrics
   */
  private getUserPerformance(): UserPerformance {
    try {
      const storage = this.getStorageInstance();
      const perfJson = storage.getString(CHALLENGE_STORAGE_KEYS.USER_PERFORMANCE);
      if (!perfJson) {
        return { ...DEFAULT_USER_PERFORMANCE };
      }
      return JSON.parse(perfJson) as UserPerformance;
    } catch (error) {
      console.error('Failed to get user performance:', error);
      return { ...DEFAULT_USER_PERFORMANCE };
    }
  }

  /**
   * Saves user performance metrics
   */
  private saveUserPerformance(performance: UserPerformance): void {
    try {
      const storage = this.getStorageInstance();
      storage.set(CHALLENGE_STORAGE_KEYS.USER_PERFORMANCE, JSON.stringify(performance));
    } catch (error) {
      console.error('Failed to save user performance:', error);
    }
  }


  /**
   * Generates 3 new weekly challenges
   * Requirements: 7.1, 7.2, 7.7, 7.8
   * @returns Array of 3 newly generated challenges
   */
  generateWeeklyChallenges(): Challenge[] {
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();
    const userPerformance = this.getUserPerformance();

    // Shuffle templates and select 3 different types
    const shuffledTemplates = shuffleArray(CHALLENGE_TEMPLATES);
    const selectedTemplates: ChallengeTemplate[] = [];
    const usedTypes = new Set<ChallengeType>();

    for (const template of shuffledTemplates) {
      if (!usedTypes.has(template.type) && selectedTemplates.length < 3) {
        selectedTemplates.push(template);
        usedTypes.add(template.type);
      }
    }

    // If we couldn't get 3 unique types, fill with any remaining
    if (selectedTemplates.length < 3) {
      for (const template of shuffledTemplates) {
        if (selectedTemplates.length < 3 && !selectedTemplates.includes(template)) {
          selectedTemplates.push(template);
        }
      }
    }

    // Generate challenges from selected templates
    const challenges: Challenge[] = selectedTemplates.map((template) =>
      this.createChallengeFromTemplate(template, weekStart, weekEnd, userPerformance)
    );

    // Save and return
    this.saveActiveChallenges(challenges);
    return challenges;
  }

  /**
   * Creates a challenge from a template with scaled difficulty
   */
  private createChallengeFromTemplate(
    template: ChallengeTemplate,
    startDate: Date,
    endDate: Date,
    userPerformance: UserPerformance
  ): Challenge {
    // Get relevant performance metric for this challenge type
    const performanceMetric = this.getPerformanceMetricForType(template.type, userPerformance);
    const baselineMetric = this.getBaselineMetricForType(template.type);

    // Scale difficulty based on user performance
    const scaledTarget = this.scaleDifficulty(
      template.baseTarget,
      performanceMetric / baselineMetric,
      template.scalingFactor
    );

    // Scale XP reward proportionally
    const scaledXPReward = Math.round(
      template.baseXPReward * (scaledTarget / template.baseTarget)
    );

    // Get category for category-focused challenges
    const categoryId = template.type === 'category_focus' 
      ? this.selectRandomCategory(userPerformance)
      : undefined;

    // Generate title and description
    const title = this.formatTemplate(template.titleTemplate, scaledTarget, categoryId);
    const description = this.formatTemplate(template.descriptionTemplate, scaledTarget, categoryId);

    return {
      id: generateId(),
      type: template.type,
      title,
      description,
      target: scaledTarget,
      current: 0,
      xpReward: scaledXPReward,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'active',
      categoryId,
    };
  }

  /**
   * Gets the relevant performance metric for a challenge type
   */
  private getPerformanceMetricForType(type: ChallengeType, perf: UserPerformance): number {
    switch (type) {
      case 'completion_count':
        return perf.avgGoalsPerWeek;
      case 'priority_completion':
        return perf.avgHighPriorityPerWeek;
      case 'streak_maintenance':
        return perf.avgStreakLength;
      case 'subgoal_completion':
        return perf.avgSubgoalsPerWeek;
      case 'category_focus':
        return perf.avgGoalsPerWeek / 2; // Assume half for a single category
      case 'early_completion':
        return Math.max(1, perf.avgGoalsPerWeek / 3); // Assume 1/3 are early
      default:
        return BASELINE_PERFORMANCE.goalsPerWeek;
    }
  }

  /**
   * Gets the baseline metric for a challenge type
   */
  private getBaselineMetricForType(type: ChallengeType): number {
    switch (type) {
      case 'completion_count':
        return BASELINE_PERFORMANCE.goalsPerWeek;
      case 'priority_completion':
        return BASELINE_PERFORMANCE.highPriorityPerWeek;
      case 'streak_maintenance':
        return BASELINE_PERFORMANCE.streakLength;
      case 'subgoal_completion':
        return BASELINE_PERFORMANCE.subgoalsPerWeek;
      case 'category_focus':
        return BASELINE_PERFORMANCE.goalsPerWeek / 2;
      case 'early_completion':
        return Math.max(1, BASELINE_PERFORMANCE.goalsPerWeek / 3);
      default:
        return BASELINE_PERFORMANCE.goalsPerWeek;
    }
  }


  /**
   * Scales challenge difficulty based on user performance
   * Requirements: 7.8
   * Formula: baseTarget × scalingFactor^(performanceRatio)
   * @param baseTarget - Base target value from template
   * @param performanceRatio - User performance / baseline performance
   * @param scalingFactor - Scaling factor from template
   * @returns Scaled target value (minimum 1)
   */
  scaleDifficulty(baseTarget: number, performanceRatio: number, scalingFactor: number): number {
    // Clamp performance ratio to reasonable bounds (0.5 to 2.0)
    const clampedRatio = Math.max(0.5, Math.min(2.0, performanceRatio));
    
    // Apply scaling formula
    const scaledTarget = baseTarget * Math.pow(scalingFactor, clampedRatio - 1);
    
    // Round and ensure minimum of 1
    return Math.max(1, Math.round(scaledTarget));
  }

  /**
   * Selects a random category, weighted by user's category completion history
   */
  private selectRandomCategory(userPerformance: UserPerformance): string {
    const categories = DEFAULT_CATEGORIES.filter((c) => c.id !== 'other');
    
    // If user has category history, prefer categories they use
    const categoryIds = categories.map((c) => c.id);
    const weights = categoryIds.map((id) => {
      const count = userPerformance.goalsByCategory[id] ?? 0;
      return Math.max(1, count); // Minimum weight of 1
    });

    // Weighted random selection
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < categoryIds.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return categoryIds[i];
      }
    }

    return categoryIds[0]; // Fallback
  }

  /**
   * Formats a template string with target and category values
   */
  private formatTemplate(template: string, target: number, categoryId?: string): string {
    let result = template.replace('{target}', target.toString());
    
    if (categoryId) {
      const category = DEFAULT_CATEGORIES.find((c) => c.id === categoryId);
      result = result.replace('{category}', category?.name ?? 'Goals');
    }
    
    return result;
  }

  /**
   * Updates challenge progress based on a game event
   * Requirements: 7.3, 7.4
   */
  updateChallengeProgress(event: GameEvent): void {
    const challenges = this.getActiveChallenges();
    let updated = false;

    for (const challenge of challenges) {
      if (challenge.status !== 'active') continue;

      const progressIncrement = this.calculateProgressIncrement(challenge, event);
      if (progressIncrement > 0) {
        challenge.current += progressIncrement;
        updated = true;

        // Check for completion
        if (challenge.current >= challenge.target) {
          this.completeChallenge(challenge);
        }
      }
    }

    if (updated) {
      this.saveActiveChallenges(challenges);
    }
  }

  /**
   * Calculates progress increment for a challenge based on an event
   */
  private calculateProgressIncrement(challenge: Challenge, event: GameEvent): number {
    switch (challenge.type) {
      case 'completion_count':
        return event.type === 'goal_completed' ? 1 : 0;

      case 'category_focus':
        return event.type === 'goal_completed' && event.categoryId === challenge.categoryId ? 1 : 0;

      case 'streak_maintenance':
        if (event.type === 'streak_updated' && event.streakDays !== undefined) {
          // For streak challenges, current tracks the max streak achieved this week
          return Math.max(0, event.streakDays - challenge.current);
        }
        return 0;

      case 'priority_completion':
        return event.type === 'goal_completed' && event.priority === 'high' ? 1 : 0;

      case 'early_completion':
        if (event.type === 'goal_completed' && event.completionTime) {
          const hour = event.completionTime.getHours();
          return hour < 9 ? 1 : 0; // Before 9 AM
        }
        return 0;

      case 'subgoal_completion':
        return event.type === 'subgoal_completed' ? 1 : 0;

      default:
        return 0;
    }
  }


  /**
   * Completes a challenge and awards XP
   * Requirements: 7.4
   */
  private completeChallenge(challenge: Challenge): void {
    challenge.status = 'completed';
    challenge.current = challenge.target; // Cap at target

    // Award XP for challenge completion
    try {
      this.xpService.awardXP(challenge.xpReward, `Challenge completed: ${challenge.title}`);
    } catch (error) {
      console.error('Failed to award challenge XP:', error);
    }

    // Trigger callback
    if (this.onChallengeCompleted) {
      this.onChallengeCompleted(challenge);
    }
  }

  /**
   * Checks if a specific challenge is completed
   * Requirements: 7.4
   */
  checkChallengeCompletion(challengeId: string): boolean {
    const challenges = this.getActiveChallenges();
    const challenge = challenges.find((c) => c.id === challengeId);
    
    if (!challenge) {
      return false;
    }

    return challenge.current >= challenge.target;
  }

  /**
   * Expires old challenges at week end
   * Requirements: 7.5
   */
  expireOldChallenges(): void {
    const now = new Date();
    const challenges = this.getActiveChallenges();
    const history = this.getChallengeHistory();
    
    const stillActive: Challenge[] = [];
    const toArchive: Challenge[] = [];

    for (const challenge of challenges) {
      const endDate = new Date(challenge.endDate);
      
      if (now > endDate && challenge.status === 'active') {
        // Challenge has expired
        challenge.status = 'expired';
        toArchive.push(challenge);
      } else if (challenge.status === 'completed') {
        // Already completed, move to history
        toArchive.push(challenge);
      } else {
        stillActive.push(challenge);
      }
    }

    // Update storage
    if (toArchive.length > 0) {
      this.saveActiveChallenges(stillActive);
      this.saveChallengeHistory([...toArchive, ...history]);
    }
  }

  /**
   * Updates user performance metrics based on completed challenges
   * Called periodically to improve difficulty scaling
   */
  updateUserPerformance(
    goalsCompletedThisWeek: number,
    highPriorityCompletedThisWeek: number,
    currentStreak: number,
    subgoalsCompletedThisWeek: number,
    goalsByCategory: Record<string, number>
  ): void {
    const currentPerf = this.getUserPerformance();
    
    // Exponential moving average with alpha = 0.3
    const alpha = 0.3;
    
    const newPerf: UserPerformance = {
      avgGoalsPerWeek: alpha * goalsCompletedThisWeek + (1 - alpha) * currentPerf.avgGoalsPerWeek,
      avgHighPriorityPerWeek: alpha * highPriorityCompletedThisWeek + (1 - alpha) * currentPerf.avgHighPriorityPerWeek,
      avgStreakLength: alpha * currentStreak + (1 - alpha) * currentPerf.avgStreakLength,
      avgSubgoalsPerWeek: alpha * subgoalsCompletedThisWeek + (1 - alpha) * currentPerf.avgSubgoalsPerWeek,
      goalsByCategory: { ...currentPerf.goalsByCategory },
    };

    // Update category counts
    for (const [categoryId, count] of Object.entries(goalsByCategory)) {
      newPerf.goalsByCategory[categoryId] = (newPerf.goalsByCategory[categoryId] ?? 0) + count;
    }

    this.saveUserPerformance(newPerf);
  }

  /**
   * Gets a challenge by ID
   */
  getChallengeById(challengeId: string): Challenge | undefined {
    const active = this.getActiveChallenges();
    const found = active.find((c) => c.id === challengeId);
    if (found) return found;

    const history = this.getChallengeHistory();
    return history.find((c) => c.id === challengeId);
  }

  /**
   * Checks if new challenges should be generated (start of week)
   */
  shouldGenerateNewChallenges(): boolean {
    const active = this.getActiveChallenges();
    
    // No active challenges
    if (active.length === 0) {
      return true;
    }

    // Check if current challenges are from a previous week
    const weekStart = getWeekStart();
    const oldestChallenge = active.reduce((oldest, c) => {
      const startDate = new Date(c.startDate);
      return startDate < new Date(oldest.startDate) ? c : oldest;
    }, active[0]);

    const challengeWeekStart = getWeekStart(new Date(oldestChallenge.startDate));
    return challengeWeekStart < weekStart;
  }

  /**
   * Resets challenge data (useful for testing)
   */
  reset(): void {
    try {
      const storage = this.getStorageInstance();
      storage.delete(CHALLENGE_STORAGE_KEYS.ACTIVE_CHALLENGES);
      storage.delete(CHALLENGE_STORAGE_KEYS.CHALLENGE_HISTORY);
      storage.delete(CHALLENGE_STORAGE_KEYS.USER_PERFORMANCE);
    } catch (error) {
      console.error('Failed to reset challenge data:', error);
    }
  }
}

// Export singleton instance for app-wide use
export const challengeService = new ChallengeService();
