import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import type { SubgoalProgress } from '../types';

interface ProgressIndicatorProps {
  progress: SubgoalProgress;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showPercentage?: boolean;
}

/**
 * ProgressIndicator - Shows completion progress for subgoals
 * Requirements: 2.3
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  size = 'medium',
  showLabel = true,
  showPercentage = false,
}) => {
  const theme = useTheme();

  const { completed, total, percentage } = progress;

  // Don't render if no subgoals
  if (total === 0) {
    return null;
  }

  const progressValue = percentage / 100;
  const isComplete = completed === total;

  const sizeConfig = {
    small: {
      height: 4,
      fontSize: 10,
      gap: 4,
    },
    medium: {
      height: 6,
      fontSize: 12,
      gap: 6,
    },
    large: {
      height: 8,
      fontSize: 14,
      gap: 8,
    },
  };

  const config = sizeConfig[size];

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text
            style={[
              styles.label,
              {
                fontSize: config.fontSize,
                color: isComplete ? theme.colors.primary : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {completed}/{total} completed
          </Text>
          {showPercentage && (
            <Text
              style={[
                styles.percentage,
                {
                  fontSize: config.fontSize,
                  color: isComplete ? theme.colors.primary : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {percentage}%
            </Text>
          )}
        </View>
      )}
      <View style={[styles.progressBarContainer, { marginTop: showLabel ? config.gap : 0 }]}>
        <ProgressBar
          progress={progressValue}
          color={isComplete ? theme.colors.primary : theme.colors.tertiary}
          style={[
            styles.progressBar,
            {
              height: config.height,
              backgroundColor: theme.colors.surfaceVariant,
            },
          ]}
        />
      </View>
    </View>
  );
};

/**
 * Compact progress indicator for use in cards
 */
export const CompactProgressIndicator: React.FC<{
  progress: SubgoalProgress;
}> = ({ progress }) => {
  const theme = useTheme();
  const { completed, total, percentage } = progress;

  if (total === 0) {
    return null;
  }

  const isComplete = completed === total;

  return (
    <View style={styles.compactContainer}>
      <View
        style={[
          styles.compactBadge,
          {
            backgroundColor: isComplete
              ? `${theme.colors.primary}20`
              : `${theme.colors.tertiary}20`,
          },
        ]}
      >
        <Text
          style={[
            styles.compactText,
            {
              color: isComplete ? theme.colors.primary : theme.colors.tertiary,
            },
          ]}
        >
          {completed}/{total}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontWeight: '500',
  },
  percentage: {
    fontWeight: '600',
  },
  progressBarContainer: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    borderRadius: 4,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  compactText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default ProgressIndicator;
