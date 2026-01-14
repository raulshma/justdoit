import { Statistics } from '../types';
import { StorageService, storageService as defaultStorageService } from './storageService';

/**
 * Statistics Service Interface
 */
export interface IStatisticsService {
  calculateTodayStats(): Statistics;
  calculateWeeklyCompletionRate(): number;
  calculateStreak(): number;
  getLast7DaysCompletions(): number[];
  getAveragePerDay(): number;
  refreshStatistics(): Promise<Statistics>;
}

/**
 * Gets today's date in ISO format (YYYY-MM-DD)
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Gets a date N days ago in ISO format (YYYY-MM-DD)
 * @param daysAgo - Number of days to go back
 */
export function getDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

/**
 * Gets the start of the current week (Sunday) in ISO format
 */
export function getWeekStartDate(): string {
  const date = new Date();
  const dayOfWeek = date.getDay();
  date.setDate(date.getDate() - dayOfWeek);
  return date.toISOString().split('T')[0];
}

/**
 * StatisticsService - Calculates and displays progress metrics and completion trends
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.6
 */
export class StatisticsService implements IStatisticsService {
  private storageService: StorageService;

  constructor(storageService?: StorageService) {
    this.storageService = storageService ?? defaultStorageService;
  }

  /**
   * Calculates today's statistics including completed and total goals
   * @returns Statistics object with today's data
   * Requirements: 11.1
   * Property 13: todayCompleted equals count of goals where dueDate equals today AND isCompleted is true
   */
  calculateTodayStats(): Statistics {
    const allGoals = this.storageService.getAllGoals();
    const today = getTodayDate();
    
    const todayGoals = allGoals.filter((goal) => goal.dueDate === today);
    const todayCompleted = todayGoals.filter((goal) => goal.isCompleted).length;
    const todayTotal = todayGoals.length;

    const weeklyCompletionRate = this.calculateWeeklyCompletionRate();
    const currentStreak = this.calculateStreak();
    const last7DaysCompletions = this.getLast7DaysCompletions();
    const averagePerDay = this.getAveragePerDay();

    // Get stored statistics for longest streak
    const storedStats = this.storageService.getStatistics();
    const longestStreak = Math.max(storedStats.longestStreak, currentStreak);

    // Calculate new insight fields
    const completionsByHour = this.calculateCompletionsByHour();
    const completionsByDayOfWeek = this.calculateCompletionsByDayOfWeek();
    const peakHours = this.identifyPeakHours(completionsByHour);
    const lowPerformanceDays = this.identifyLowPerformanceDays(completionsByDayOfWeek);

    return {
      todayCompleted,
      todayTotal,
      weeklyCompletionRate,
      currentStreak,
      longestStreak,
      last7DaysCompletions,
      averagePerDay,
      completionsByHour,
      completionsByDayOfWeek,
      peakHours,
      lowPerformanceDays,
    };
  }


  /**
   * Calculates the completion rate for the current week
   * @returns Completion rate as a percentage (0-100), or 0 if no goals exist
   * Requirements: 11.2
   * Property 14: weeklyCompletionRate equals (completed goals / total goals) × 100, or 0 if no goals
   */
  calculateWeeklyCompletionRate(): number {
    const allGoals = this.storageService.getAllGoals();
    const weekStart = getWeekStartDate();
    const today = getTodayDate();

    // Get all goals within the current week (from Sunday to today)
    const weekGoals = allGoals.filter((goal) => {
      return goal.dueDate >= weekStart && goal.dueDate <= today;
    });

    if (weekGoals.length === 0) {
      return 0;
    }

    const completedGoals = weekGoals.filter((goal) => goal.isCompleted).length;
    return Math.round((completedGoals / weekGoals.length) * 100);
  }

  /**
   * Calculates the current streak of consecutive days with at least one completed goal
   * A day with no completed goals breaks the streak
   * @returns Number of consecutive days with at least one goal completed
   * Requirements: 11.3
   * Property 15: Streak equals consecutive days (ending today or yesterday) with at least one completed goal
   */
  calculateStreak(): number {
    const allGoals = this.storageService.getAllGoals();
    
    if (allGoals.length === 0) {
      return 0;
    }

    // Build a map of dates to completed goal counts
    const completionsByDate = new Map<string, number>();
    
    for (const goal of allGoals) {
      if (goal.isCompleted && goal.completedAt) {
        // Use the completedAt date for streak calculation
        const completedDate = goal.completedAt.split('T')[0];
        completionsByDate.set(
          completedDate,
          (completionsByDate.get(completedDate) ?? 0) + 1
        );
      }
    }

    // Start from today and count backwards
    let streak = 0;
    let currentDate = new Date();
    const today = getTodayDate();
    
    // Check if today has completions
    const todayHasCompletions = completionsByDate.has(today);
    
    // If today has no completions, start checking from yesterday
    if (!todayHasCompletions) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Count consecutive days with completions
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      if (completionsByDate.has(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Gets the completion counts for the last 7 days
   * @returns Array of 7 numbers, ordered from 6 days ago to today
   * Requirements: 11.4
   * Property 16: Returns array of 7 numbers representing completed goals per day
   */
  getLast7DaysCompletions(): number[] {
    const allGoals = this.storageService.getAllGoals();
    const completions: number[] = [];

    // Iterate from 6 days ago to today
    for (let i = 6; i >= 0; i--) {
      const date = getDateDaysAgo(i);
      const completedCount = allGoals.filter(
        (goal) => goal.dueDate === date && goal.isCompleted
      ).length;
      completions.push(completedCount);
    }

    return completions;
  }

  /**
   * Calculates the average number of goals completed per day over the past 30 days
   * @returns Average goals per day, rounded to one decimal place
   * Requirements: 11.6
   * Property 17: averagePerDay equals (total completed in 30 days) / 30, rounded to one decimal
   */
  getAveragePerDay(): number {
    const allGoals = this.storageService.getAllGoals();
    const thirtyDaysAgo = getDateDaysAgo(30);
    const today = getTodayDate();

    // Count completed goals in the last 30 days
    const completedInLast30Days = allGoals.filter((goal) => {
      return (
        goal.isCompleted &&
        goal.dueDate >= thirtyDaysAgo &&
        goal.dueDate <= today
      );
    }).length;

    // Calculate average and round to one decimal place
    return Math.round((completedInLast30Days / 30) * 10) / 10;
  }

  /**
   * Refreshes and persists all statistics
   * @returns Updated Statistics object
   */
  async refreshStatistics(): Promise<Statistics> {
    const stats = this.calculateTodayStats();
    this.storageService.saveStatistics(stats);
    return stats;
  }

  /**
   * Calculates completions aggregated by hour of day (0-23)
   * @returns Array of 24 numbers representing completions per hour
   */
  calculateCompletionsByHour(): number[] {
    const allGoals = this.storageService.getAllGoals();
    const hourCounts = new Array(24).fill(0);

    for (const goal of allGoals) {
      if (goal.isCompleted && goal.completedAt) {
        const completedDate = new Date(goal.completedAt);
        const hour = completedDate.getHours();
        hourCounts[hour]++;
      }
    }

    return hourCounts;
  }

  /**
   * Calculates completions aggregated by day of week (0-6, Sunday-Saturday)
   * @returns Array of 7 numbers representing completions per day
   */
  calculateCompletionsByDayOfWeek(): number[] {
    const allGoals = this.storageService.getAllGoals();
    const dayCounts = new Array(7).fill(0);

    for (const goal of allGoals) {
      if (goal.isCompleted && goal.completedAt) {
        const completedDate = new Date(goal.completedAt);
        const day = completedDate.getDay();
        dayCounts[day]++;
      }
    }

    return dayCounts;
  }

  /**
   * Identifies the top 3 peak productivity hours
   * @param hourlyData - Array of 24 completion counts
   * @returns Array of up to 3 peak hour indices
   */
  identifyPeakHours(hourlyData: number[]): number[] {
    const indexed = hourlyData.map((count, hour) => ({ hour, count }));
    indexed.sort((a, b) => b.count - a.count);
    
    return indexed
      .filter(h => h.count > 0)
      .slice(0, 3)
      .map(h => h.hour);
  }

  /**
   * Identifies days with below-average completion rates
   * @param dailyData - Array of 7 completion counts
   * @returns Array of day indices with low performance
   */
  identifyLowPerformanceDays(dailyData: number[]): number[] {
    const total = dailyData.reduce((sum, count) => sum + count, 0);
    if (total === 0) return [];

    const average = total / 7;
    const lowDays: number[] = [];

    for (let day = 0; day < 7; day++) {
      if (dailyData[day] < average * 0.5) {
        lowDays.push(day);
      }
    }

    return lowDays;
  }
}

// Export singleton instance for app-wide use
export const statisticsService = new StatisticsService();
