import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';

interface LevelProgressProps {
  /** Current level */
  currentLevel: number;
  /** XP earned in current level */
  currentXP: number;
  /** XP required to reach next level */
  requiredXP: number;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Whether to animate the progress bar */
  animated?: boolean;
  /** Whether to show compact version */
  compact?: boolean;
}

/**
 * LevelProgress component shows progress towards the next level
 * 
 * Requirements: 6.5, 6.6
 */
export const LevelProgress: React.FC<LevelProgressProps> = ({
  currentLevel,
  currentXP,
  requiredXP,
  percentage,
  animated = true,
  compact = false,
}) => {
  const theme = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: percentage / 100,
        duration: 800,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(percentage / 100);
    }
  }, [percentage, animated, progressAnim]);

  const isMaxLevel = requiredXP === 0;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Text
            variant="labelSmall"
            style={[styles.compactLabel, { color: theme.colors.onSurfaceVariant }]}
          >
            Lv.{currentLevel}
          </Text>
          {!isMaxLevel && (
            <Text
              variant="labelSmall"
              style={[styles.compactLabel, { color: theme.colors.onSurfaceVariant }]}
            >
              {currentXP}/{requiredXP}
            </Text>
          )}
        </View>
        <ProgressBar
          progress={percentage / 100}
          color={theme.colors.primary}
          style={[styles.compactProgressBar, { backgroundColor: theme.colors.surfaceVariant }]}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.levelInfo}>
          <View style={[styles.levelBadge, { backgroundColor: theme.colors.primaryContainer }]}>
            <ThemedIcon name="star" size={16} color={theme.colors.primary} />
            <Text
              variant="labelLarge"
              style={[styles.levelText, { color: theme.colors.onPrimaryContainer }]}
            >
              Level {currentLevel}
            </Text>
          </View>
        </View>

        {!isMaxLevel && (
          <Text
            variant="labelMedium"
            style={[styles.xpText, { color: theme.colors.onSurfaceVariant }]}
          >
            {currentXP} / {requiredXP} XP
          </Text>
        )}
      </View>

      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBackground,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.colors.primary,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.footer}>
        {isMaxLevel ? (
          <View style={styles.maxLevelContainer}>
            <ThemedIcon name="crown" size={16} color={theme.colors.primary} />
            <Text
              variant="labelMedium"
              style={[styles.maxLevelText, { color: theme.colors.primary }]}
            >
              Max Level Reached!
            </Text>
          </View>
        ) : (
          <>
            <Text
              variant="labelSmall"
              style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}
            >
              {percentage.toFixed(1)}% complete
            </Text>
            <Text
              variant="labelSmall"
              style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}
            >
              {requiredXP - currentXP} XP to Level {currentLevel + 1}
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  compactContainer: {
    gap: 4,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactLabel: {
    fontWeight: '500',
  },
  compactProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  levelText: {
    fontWeight: '700',
  },
  xpText: {
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBackground: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontWeight: '500',
  },
  maxLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  maxLevelText: {
    fontWeight: '700',
  },
});

export default LevelProgress;
