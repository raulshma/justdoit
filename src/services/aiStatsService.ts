/**
 * AI Stats Service - Calculates and aggregates AI usage statistics
 */

import { aiLogService } from './aiLogService';
import { storageService } from './storageService';
import type { AIUsageStats, AIPersonalityTrait } from '../types/aiSettings';

/**
 * AI Stats Service Interface
 */
export interface IAIStatsService {
  getUsageStats(): AIUsageStats;
  getPersonalityTraits(): AIPersonalityTrait[];
  getSuccessRate(): number;
  getAverageResponseTime(): number;
}

/**
 * AIStatsService - Analyzes AI logs to provide usage statistics and insights
 */
class AIStatsService implements IAIStatsService {
  /**
   * Calculates comprehensive AI usage statistics from logs
   */
  getUsageStats(): AIUsageStats {
    const logs = aiLogService.getLogs();

    const stats: AIUsageStats = {
      totalRequests: logs.length,
      successfulRequests: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      averageResponseTime: 0,
      requestsByType: {
        goal_analysis: 0,
        reminder_suggestion: 0,
      },
    };

    if (logs.length === 0) {
      return stats;
    }

    let totalDuration = 0;

    for (const log of logs) {
      // Count successes
      if (log.response.success) {
        stats.successfulRequests++;
      }

      // Count by type
      if (log.type === 'goal_analysis') {
        stats.requestsByType.goal_analysis++;
      } else if (log.type === 'reminder_suggestion') {
        stats.requestsByType.reminder_suggestion++;
      }

      // Sum tokens
      if (log.providerMetadata) {
        stats.inputTokens += log.providerMetadata.inputTokens || 0;
        stats.outputTokens += log.providerMetadata.outputTokens || 0;
        stats.estimatedCost += log.providerMetadata.estimatedCost || 0;
      }

      // Sum durations
      totalDuration += log.durationMs || 0;
    }

    // Calculate average response time
    stats.averageResponseTime = Math.round(totalDuration / logs.length);

    return stats;
  }

  /**
   * Calculates the success rate as a percentage
   */
  getSuccessRate(): number {
    const stats = this.getUsageStats();
    if (stats.totalRequests === 0) return 0;
    return Math.round((stats.successfulRequests / stats.totalRequests) * 100);
  }

  /**
   * Calculates the average response time in milliseconds
   */
  getAverageResponseTime(): number {
    return this.getUsageStats().averageResponseTime;
  }

  /**
   * Derives personality traits from goal completion patterns
   */
  getPersonalityTraits(): AIPersonalityTrait[] {
    const goals = storageService.getAllGoals();
    const traits: AIPersonalityTrait[] = [];

    if (goals.length === 0) {
      return traits;
    }

    // Analyze completion times to determine if user is early riser or night owl
    const completedGoals = goals.filter((g) => g.isCompleted && g.completedAt);
    
    if (completedGoals.length > 0) {
      let morningCompletions = 0;
      let eveningCompletions = 0;
      let weekendCompletions = 0;
      let weekdayCompletions = 0;

      for (const goal of completedGoals) {
        if (goal.completedAt) {
          const completedDate = new Date(goal.completedAt);
          const hour = completedDate.getHours();
          const dayOfWeek = completedDate.getDay();

          // Count morning (5-12) vs evening (18-23) completions
          if (hour >= 5 && hour < 12) {
            morningCompletions++;
          } else if (hour >= 18 && hour < 24) {
            eveningCompletions++;
          }

          // Count weekend vs weekday
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekendCompletions++;
          } else {
            weekdayCompletions++;
          }
        }
      }

      const totalTimed = morningCompletions + eveningCompletions;
      
      // Early Riser trait
      if (totalTimed > 0 && morningCompletions > eveningCompletions) {
        const strength = Math.round((morningCompletions / totalTimed) * 100);
        traits.push({
          id: 'early_riser',
          name: 'Early Riser',
          icon: 'weather-sunny',
          description: 'You complete most goals in the morning',
          strength,
        });
      }

      // Night Owl trait
      if (totalTimed > 0 && eveningCompletions > morningCompletions) {
        const strength = Math.round((eveningCompletions / totalTimed) * 100);
        traits.push({
          id: 'night_owl',
          name: 'Night Owl',
          icon: 'weather-night',
          description: 'You complete most goals in the evening',
          strength,
        });
      }

      // Weekend Warrior trait
      const totalWeekCompare = weekendCompletions + weekdayCompletions;
      if (totalWeekCompare > 0) {
        const weekendRatio = weekendCompletions / totalWeekCompare;
        if (weekendRatio > 0.4) { // More than expected 2/7 = 0.28
          traits.push({
            id: 'weekend_warrior',
            name: 'Weekend Warrior',
            icon: 'calendar-weekend',
            description: 'You\'re most productive on weekends',
            strength: Math.round(weekendRatio * 100),
          });
        }
      }
    }

    // Analyze goal categories to determine focus areas
    const categoryCounts: Record<string, number> = {};
    for (const goal of goals) {
      if (goal.categoryId) {
        categoryCounts[goal.categoryId] = (categoryCounts[goal.categoryId] || 0) + 1;
      }
    }

    // Find dominant category
    const entries = Object.entries(categoryCounts);
    if (entries.length > 0) {
      entries.sort((a, b) => b[1] - a[1]);
      const [topCategory, count] = entries[0];
      const percentage = Math.round((count / goals.length) * 100);
      
      if (percentage > 30) {
        traits.push({
          id: 'focused_achiever',
          name: 'Focused Achiever',
          icon: 'target',
          description: `You concentrate on ${topCategory} goals`,
          strength: percentage,
        });
      }
    }

    // Streak-based trait
    const statsService = storageService.getSettings();
    // This would ideally use statisticsService but to avoid circular deps, we check completion rate
    const completionRate = goals.length > 0 
      ? Math.round((completedGoals.length / goals.length) * 100) 
      : 0;

    if (completionRate >= 70) {
      traits.push({
        id: 'consistent',
        name: 'Consistent',
        icon: 'check-decagram',
        description: 'You have a high goal completion rate',
        strength: completionRate,
      });
    }

    return traits;
  }
}

// Export singleton instance
export const aiStatsService = new AIStatsService();

// Export class for testing
export { AIStatsService };
