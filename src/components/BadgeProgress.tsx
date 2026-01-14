import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { Badge } from '../types/badge';
import type { BadgeProgress as BadgeProgressType } from '../services/achievementService';

interface BadgeProgressProps {
  /** The badge to show progress for */
  badge: Badge;
  /** Progress information */
  progress: BadgeProgressType;
  /** Whether to show in compact mode */
  compact?: boolean;
}

/**
 * BadgeProgress - Shows progress toward unlocking a badge
 * Requirements: 5.4
 */
export const BadgeProgress: React.FC<BadgeProgressProps> = ({
  badge,
  progress,
  compact = false,
}) => {
  const theme = useTheme();
  const isComplete = progress.percentage >= 100;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View
          style={[
            styles.compactProgressBar,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <View
            style={[
              styles.compactProgressFill,
              {
                backgroundColor: isComplete
                  ? theme.colors.primary
                  : theme.colors.secondary,
                width: `${Math.min(progress.percentage, 100)}%`,
              },
            ]}
          />
        </View>
        <Text
          variant="labelSmall"
          style={[styles.compactText, { color: theme.colors.onSurfaceVariant }]}
        >
          {Math.round(progress.percentage)}%
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badgeInfo}>
          <Text style={styles.icon}>{badge.icon}</Text>
          <Text
            variant="titleSmall"
            style={[styles.name, { color: theme.colors.onSurface }]}
            numberOfLines={1}
          >
            {badge.name}
          </Text>
        </View>
        <Text
          variant="labelMedium"
          style={[
            styles.percentage,
            { color: isComplete ? theme.colors.primary : theme.colors.onSurfaceVariant },
          ]}
        >
          {Math.round(progress.percentage)}%
        </Text>
      </View>

      {/* Progress Bar */}
      <View
        style={[
          styles.progressBar,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: isComplete
                ? theme.colors.primary
                : theme.colors.secondary,
              width: `${Math.min(progress.percentage, 100)}%`,
            },
          ]}
        />
      </View>

      {/* Progress Text */}
      <View style={styles.footer}>
        <Text
          variant="bodySmall"
          style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}
        >
          {progress.current} / {progress.required}
        </Text>
        {!isComplete && (
          <Text
            variant="bodySmall"
            style={[styles.remainingText, { color: theme.colors.onSurfaceVariant }]}
          >
            {progress.required - progress.current} more to unlock
          </Text>
        )}
        {isComplete && (
          <Text
            variant="bodySmall"
            style={[styles.completeText, { color: theme.colors.primary }]}
          >
            ✓ Complete!
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  icon: {
    fontSize: 20,
  },
  name: {
    fontWeight: '600',
    flex: 1,
  },
  percentage: {
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontWeight: '500',
  },
  remainingText: {
    opacity: 0.7,
  },
  completeText: {
    fontWeight: '600',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactProgressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  compactText: {
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'right',
  },
});

export default BadgeProgress;
