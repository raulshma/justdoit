import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Surface, Icon, ProgressBar, MD3Theme } from 'react-native-paper';
import { focusTimerService } from '../services/focusTimerService';
import type { FocusStats } from '../types';

interface FocusSessionStatsProps {
  goalId?: string;
  compact?: boolean;
}

interface StatItemProps {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
}

/**
 * Individual stat display item
 */
const StatItem: React.FC<StatItemProps & { theme: MD3Theme }> = ({
  icon,
  value,
  label,
  color,
  theme,
}) => (
  <View style={styles.statItem}>
    <Icon source={icon} size={24} color={color ?? theme.colors.primary} />
    <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
      {value}
    </Text>
    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
      {label}
    </Text>
  </View>
);

/**
 * FocusSessionStats Component
 * Displays focus session statistics
 */
export const FocusSessionStats: React.FC<FocusSessionStatsProps> = ({
  goalId,
  compact = false,
}) => {
  const theme = useTheme();

  // Get stats from focus timer service
  const stats = useMemo(() => {
    if (goalId) {
      const goalStats = focusTimerService.getGoalStats(goalId);
      return {
        totalSessions: goalStats.sessions,
        totalMinutes: goalStats.minutes,
        todaySessions: 0,
        todayMinutes: 0,
        currentStreak: 0,
      } as FocusStats;
    }
    return focusTimerService.getStats();
  }, [goalId]);

  // Format time display
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.compactStat, { backgroundColor: theme.colors.primaryContainer }]}>
          <Icon source="timer" size={16} color={theme.colors.primary} />
          <Text variant="labelMedium" style={{ color: theme.colors.primary, marginLeft: 4 }}>
            {stats.todaySessions} today
          </Text>
        </View>
        <View style={[styles.compactStat, { backgroundColor: theme.colors.secondaryContainer }]}>
          <Icon source="clock-outline" size={16} color={theme.colors.secondary} />
          <Text variant="labelMedium" style={{ color: theme.colors.secondary, marginLeft: 4 }}>
            {formatTime(stats.totalMinutes)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
          {goalId ? 'Goal Focus Stats' : 'Focus Statistics'}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatItem
          theme={theme}
          icon="timer"
          value={stats.todaySessions}
          label="Today"
          color={theme.colors.primary}
        />
        <StatItem
          theme={theme}
          icon="counter"
          value={stats.totalSessions}
          label="Total"
          color={theme.colors.secondary}
        />
        <StatItem
          theme={theme}
          icon="clock-outline"
          value={formatTime(stats.totalMinutes)}
          label="Focus Time"
          color={theme.colors.tertiary}
        />
        {!goalId && stats.currentStreak > 0 && (
          <StatItem
            theme={theme}
            icon="fire"
            value={stats.currentStreak}
            label="Day Streak"
            color={theme.colors.error}
          />
        )}
      </View>

      {stats.todaySessions > 0 && (
        <View style={styles.todayProgress}>
          <View style={styles.progressHeader}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Today's Focus Time
            </Text>
            <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
              {formatTime(stats.todayMinutes)}
            </Text>
          </View>
          <ProgressBar
            progress={Math.min(stats.todayMinutes / 120, 1)} // 2 hour target
            color={theme.colors.primary}
            style={styles.progressBar}
          />
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            Target: 2 hours
          </Text>
        </View>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  todayProgress: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  compactContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  compactStat: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
});

export default FocusSessionStats;
