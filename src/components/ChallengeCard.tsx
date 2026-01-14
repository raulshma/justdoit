import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import type { Challenge, ChallengeType } from '../types/challenge';

interface ChallengeCardProps {
  /** The challenge to display */
  challenge: Challenge;
  /** Callback when challenge is pressed */
  onPress?: (challenge: Challenge) => void;
  /** Whether to show compact view */
  compact?: boolean;
}

/**
 * Icons for each challenge type
 */
const CHALLENGE_ICONS: Record<ChallengeType, string> = {
  completion_count: '🎯',
  category_focus: '📁',
  streak_maintenance: '🔥',
  priority_completion: '⭐',
  early_completion: '🌅',
  subgoal_completion: '✅',
};

/**
 * Formats the end date for display
 */
const formatEndDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return 'Ends today';
  } else if (diffDays === 1) {
    return '1 day left';
  } else {
    return `${diffDays} days left`;
  }
};

/**
 * ChallengeCard - Displays a challenge with progress indicator
 * Requirements: 7.3, 7.6
 */
export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onPress,
  compact = false,
}) => {
  const theme = useTheme();
  const isCompleted = challenge.status === 'completed';
  const isExpired = challenge.status === 'expired';
  const progress = Math.min((challenge.current / challenge.target) * 100, 100);
  const icon = CHALLENGE_ICONS[challenge.type] || '🎯';

  const handlePress = () => {
    if (onPress) {
      onPress(challenge);
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        disabled={!onPress}
      >
        <View
          style={[
            styles.compactContainer,
            {
              backgroundColor: isCompleted
                ? theme.colors.primaryContainer
                : theme.colors.surfaceVariant,
              opacity: isExpired ? 0.5 : 1,
            },
          ]}
        >
          <Text style={styles.compactIcon}>{icon}</Text>
          <View style={styles.compactProgress}>
            <View
              style={[
                styles.compactProgressFill,
                {
                  backgroundColor: isCompleted
                    ? theme.colors.primary
                    : theme.colors.tertiary,
                  width: `${progress}%`,
                },
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Surface
        style={[
          styles.surface,
          {
            backgroundColor: theme.colors.surface,
            opacity: isExpired ? 0.7 : 1,
          },
        ]}
        elevation={isCompleted ? 2 : 1}
      >
        <View style={styles.content}>
          {/* Challenge Icon */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isCompleted
                  ? theme.colors.primaryContainer
                  : isExpired
                  ? theme.colors.errorContainer
                  : theme.colors.tertiaryContainer,
              },
            ]}
          >
            <Text style={styles.icon}>{icon}</Text>
            {isCompleted && (
              <View
                style={[
                  styles.completedBadge,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text style={styles.completedIcon}>✓</Text>
              </View>
            )}
          </View>

          {/* Challenge Info */}
          <View style={styles.infoContainer}>
            <Text
              variant="titleSmall"
              style={[
                styles.title,
                {
                  color: isExpired
                    ? theme.colors.onSurfaceVariant
                    : theme.colors.onSurface,
                },
              ]}
              numberOfLines={1}
            >
              {challenge.title}
            </Text>
            <Text
              variant="bodySmall"
              style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={2}
            >
              {challenge.description}
            </Text>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
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
                      backgroundColor: isCompleted
                        ? theme.colors.primary
                        : isExpired
                        ? theme.colors.error
                        : theme.colors.tertiary,
                      width: `${progress}%`,
                    },
                  ]}
                />
              </View>
              <Text
                variant="labelSmall"
                style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}
              >
                {challenge.current}/{challenge.target}
              </Text>
            </View>

            {/* Status / Time Remaining */}
            <View style={styles.statusRow}>
              {isCompleted ? (
                <Text
                  variant="labelSmall"
                  style={[styles.statusText, { color: theme.colors.primary }]}
                >
                  ✓ Completed
                </Text>
              ) : isExpired ? (
                <Text
                  variant="labelSmall"
                  style={[styles.statusText, { color: theme.colors.error }]}
                >
                  Expired
                </Text>
              ) : (
                <Text
                  variant="labelSmall"
                  style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}
                >
                  ⏱ {formatEndDate(challenge.endDate)}
                </Text>
              )}
            </View>
          </View>

          {/* XP Reward */}
          <View
            style={[
              styles.xpBadge,
              {
                backgroundColor: isCompleted
                  ? theme.colors.primaryContainer
                  : theme.colors.tertiaryContainer,
              },
            ]}
          >
            <Text
              variant="labelSmall"
              style={[
                styles.xpText,
                {
                  color: isCompleted
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onTertiaryContainer,
                },
              ]}
            >
              +{challenge.xpReward} XP
            </Text>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  surface: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  icon: {
    fontSize: 28,
  },
  completedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedIcon: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  description: {
    lineHeight: 16,
    opacity: 0.8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  statusRow: {
    marginTop: 4,
  },
  statusText: {
    fontWeight: '600',
  },
  xpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpText: {
    fontWeight: '700',
    fontSize: 11,
  },
  compactContainer: {
    width: 64,
    height: 72,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    padding: 8,
  },
  compactIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  compactProgress: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default ChallengeCard;
