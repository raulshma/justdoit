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
  compact?: boolean;
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
  compact,
}) => (
  <View style={[styles.statItem, compact && styles.statItemCompact]}>
    <View style={[styles.iconContainer, { backgroundColor: color ? color + '15' : theme.colors.primaryContainer }]}>
      <Icon source={icon} size={20} color={color ?? theme.colors.primary} />
    </View>
    <View>
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
        {value}
      </Text>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.8 }}>
        {label}
      </Text>
    </View>
  </View>
);

/**
 * FocusSessionStats Component
 * Displays focus session statistics in a clean grid
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
        <View style={[styles.compactPill, { backgroundColor: theme.colors.surfaceVariant }]}>
           <Icon source="clock-outline" size={14} color={theme.colors.primary} />
           <Text variant="labelSmall" style={{ color: theme.colors.onSurface, marginLeft: 4 }}>
             {formatTime(stats.totalMinutes)}
           </Text>
        </View>
      </View>
    );
  }

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={0}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700', letterSpacing: 0.5 }}>
          STATS
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatItem
          theme={theme}
          icon="timer-outline"
          value={stats.todaySessions}
          label="Sessions Today"
          color={theme.colors.primary}
        />
        <StatItem
          theme={theme}
          icon="clock-time-four-outline"
          value={formatTime(stats.totalMinutes)}
          label="Total Focus"
          color={theme.colors.secondary}
        />
        {!goalId && (
          <StatItem
            theme={theme}
            icon="fire"
            value={stats.currentStreak}
            label="Day Streak"
            color={theme.colors.error}
          />
        )}
      </View>

      {stats.todaySessions > 0 && !goalId && (
        <View style={styles.todayProgress}>
          <View style={styles.progressHeader}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600' }}>
              DAILY GOAL (2h)
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
              {Math.round((stats.todayMinutes / 120) * 100)}%
            </Text>
          </View>
          <ProgressBar
            progress={Math.min(stats.todayMinutes / 120, 1)} 
            color={theme.colors.primary}
            style={styles.progressBar}
          />
        </View>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  header: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 140,
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 12,
    borderRadius: 16,
  },
  statItemCompact: {
    minWidth: 'auto',
    padding: 0,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayProgress: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  compactContainer: {
    flexDirection: 'row',
  },
  compactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
});

export default FocusSessionStats;
