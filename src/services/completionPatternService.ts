import { Goal } from '../types';
import { storageService } from './storageService';

/**
 * Completion pattern data for a specific hour
 */
export interface HourlyCompletion {
  hour: number;
  count: number;
  percentage: number;
}

/**
 * Completion pattern data for a day of week
 */
export interface DailyCompletion {
  day: number; // 0-6 (Sunday-Saturday)
  dayName: string;
  count: number;
  percentage: number;
}

/**
 * Peak productivity insight
 */
export interface ProductivityInsight {
  peakHours: number[];
  peakDays: number[];
  lowPerformanceHours: number[];
  lowPerformanceDays: number[];
}

/**
 * Completion Pattern Service Interface
 */
export interface ICompletionPatternService {
  getCompletionsByHour(): HourlyCompletion[];
  getCompletionsByDayOfWeek(): DailyCompletion[];
  getPeakProductivityTimes(): ProductivityInsight;
  formatPatternsForAI(): string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * CompletionPatternService - Analyzes goal completion history for productivity patterns
 */
export class CompletionPatternService implements ICompletionPatternService {
  /**
   * Get completion counts aggregated by hour of day
   */
  getCompletionsByHour(): HourlyCompletion[] {
    const goals = storageService.getAllGoals();
    const hourCounts = new Array(24).fill(0);
    let totalCompleted = 0;

    for (const goal of goals) {
      if (goal.isCompleted && goal.completedAt) {
        const completedDate = new Date(goal.completedAt);
        const hour = completedDate.getHours();
        hourCounts[hour]++;
        totalCompleted++;
      }
    }

    return hourCounts.map((count, hour) => ({
      hour,
      count,
      percentage: totalCompleted > 0 ? Math.round((count / totalCompleted) * 100) : 0,
    }));
  }

  /**
   * Get completion counts aggregated by day of week
   */
  getCompletionsByDayOfWeek(): DailyCompletion[] {
    const goals = storageService.getAllGoals();
    const dayCounts = new Array(7).fill(0);
    let totalCompleted = 0;

    for (const goal of goals) {
      if (goal.isCompleted && goal.completedAt) {
        const completedDate = new Date(goal.completedAt);
        const day = completedDate.getDay();
        dayCounts[day]++;
        totalCompleted++;
      }
    }

    return dayCounts.map((count, day) => ({
      day,
      dayName: DAY_NAMES[day],
      count,
      percentage: totalCompleted > 0 ? Math.round((count / totalCompleted) * 100) : 0,
    }));
  }

  /**
   * Identify peak productivity times and low-performance periods
   */
  getPeakProductivityTimes(): ProductivityInsight {
    const hourlyData = this.getCompletionsByHour();
    const dailyData = this.getCompletionsByDayOfWeek();

    // Sort by count to find peaks (top 3) and lows (bottom 3 with activity)
    const sortedHours = [...hourlyData].sort((a, b) => b.count - a.count);
    const sortedDays = [...dailyData].sort((a, b) => b.count - a.count);

    // Peak hours - top 3 with at least 1 completion
    const peakHours = sortedHours
      .filter(h => h.count > 0)
      .slice(0, 3)
      .map(h => h.hour);

    // Peak days - top 3 with at least 1 completion
    const peakDays = sortedDays
      .filter(d => d.count > 0)
      .slice(0, 3)
      .map(d => d.day);

    // Low performance hours - bottom 3 waking hours (6-22) with at least some activity
    const wakingHours = hourlyData.filter(h => h.hour >= 6 && h.hour <= 22);
    const avgHourlyCount = wakingHours.reduce((sum, h) => sum + h.count, 0) / wakingHours.length;
    const lowPerformanceHours = wakingHours
      .filter(h => h.count < avgHourlyCount * 0.5)
      .slice(0, 3)
      .map(h => h.hour);

    // Low performance days - days with below-average completion
    const avgDailyCount = dailyData.reduce((sum, d) => sum + d.count, 0) / 7;
    const lowPerformanceDays = dailyData
      .filter(d => d.count < avgDailyCount * 0.5)
      .map(d => d.day);

    return {
      peakHours,
      peakDays,
      lowPerformanceHours,
      lowPerformanceDays,
    };
  }

  /**
   * Format completion patterns as text for AI consumption
   */
  formatPatternsForAI(): string {
    const hourlyData = this.getCompletionsByHour();
    const dailyData = this.getCompletionsByDayOfWeek();
    const insights = this.getPeakProductivityTimes();

    const lines: string[] = [];

    // Overall summary
    const totalCompletions = hourlyData.reduce((sum, h) => sum + h.count, 0);
    lines.push(`Total completed goals: ${totalCompletions}`);
    lines.push('');

    // Peak hours
    if (insights.peakHours.length > 0) {
      const peakHourStrings = insights.peakHours.map(h => {
        const data = hourlyData[h];
        return `${h}:00 (${data.count} completions, ${data.percentage}%)`;
      });
      lines.push(`Most productive hours: ${peakHourStrings.join(', ')}`);
    }

    // Peak days
    if (insights.peakDays.length > 0) {
      const peakDayStrings = insights.peakDays.map(d => {
        const data = dailyData[d];
        return `${data.dayName} (${data.count} completions)`;
      });
      lines.push(`Most productive days: ${peakDayStrings.join(', ')}`);
    }

    // Hourly breakdown (only hours with activity)
    lines.push('');
    lines.push('Hourly completion breakdown:');
    for (const hour of hourlyData) {
      if (hour.count > 0) {
        const timeLabel = `${hour.hour.toString().padStart(2, '0')}:00`;
        lines.push(`  ${timeLabel}: ${hour.count} completions (${hour.percentage}%)`);
      }
    }

    // Daily breakdown
    lines.push('');
    lines.push('Daily completion breakdown:');
    for (const day of dailyData) {
      lines.push(`  ${day.dayName}: ${day.count} completions (${day.percentage}%)`);
    }

    return lines.join('\n');
  }
}

// Export singleton instance
export const completionPatternService = new CompletionPatternService();
