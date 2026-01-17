import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';
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
  completion_count: 'target',
  category_focus: 'folder-outline',
  streak_maintenance: 'fire',
  priority_completion: 'star-outline',
  early_completion: 'weather-sunset-up',
  subgoal_completion: 'checkbox-marked-circle-outline',
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
  const icon = CHALLENGE_ICONS[challenge.type] || 'target';

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
          <ThemedIcon name={icon as any} size={24} style={{ marginBottom: 4 }} />
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
      <View
        style={[
          styles.surface,
          {
            backgroundColor: theme.colors.surface,
            opacity: isExpired ? 0.7 : 1,
            borderWidth: 0.325,
            borderColor: isCompleted 
              ? theme.colors.primaryContainer 
              : theme.colors.outlineVariant,
          },
        ]}
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
            <ThemedIcon 
              name={icon as any} 
              size={24} 
              color={isCompleted ? theme.colors.primary : theme.colors.onTertiaryContainer}
            />
            {isCompleted && (
              <View
                style={[
                  styles.completedBadge,
                  { backgroundColor: theme.colors.primary, borderWidth: 2, borderColor: theme.colors.surface },
                ]}
              >
                <ThemedIcon name="check" size={10} color={theme.colors.onPrimary} />
              </View>
            )}
          </View>

          {/* Challenge Info */}
          <View style={styles.infoContainer}>
            <View style={styles.headerRow}>
              <Text
                variant="titleSmall"
                style={[
                  styles.title,
                  {
                    color: isExpired
                      ? theme.colors.onSurfaceVariant
                      : theme.colors.onSurface,
                    flex: 1,
                  },
                ]}
                numberOfLines={1}
              >
                {challenge.title}
              </Text>
              
              {/* XP Reward - Moved to top right */}
              <View
                style={[
                  styles.xpBadge,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                  },
                ]}
              >
                <Text
                  variant="labelSmall"
                  style={[
                    styles.xpText,
                    {
                      color: theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  +{challenge.xpReward} XP
                </Text>
              </View>
            </View>

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
                {Math.round(progress)}%
              </Text>
            </View>

            {/* Status / Time Remaining */}
            <View style={styles.statusRow}>
              {isCompleted ? (
                <Text
                  variant="labelSmall"
                  style={[styles.statusText, { color: theme.colors.primary }]}
                >
                  <ThemedIcon name="check-circle-outline" size={14} color={theme.colors.primary} style={{ marginRight: 4 }} /> Completed
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
                  <ThemedIcon name="clock-time-four-outline" size={12} style={{ marginRight: 4 }} /> {formatEndDate(challenge.endDate)}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  surface: {
    borderRadius: 20, // More rounded for modern feel
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  completedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18, // Slightly smaller
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
    gap: 8,
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.2,
    fontSize: 15,
    flex: 1,
  },
  description: {
    lineHeight: 18,
    opacity: 0.7,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
    fontSize: 11,
  },
  statusRow: {
    marginTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontWeight: '600',
    fontSize: 12,
  },
  xpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12, // Pill shape
  },
  xpText: {
    fontWeight: '700',
    fontSize: 10,
  },
  compactContainer: {
    width: 64,
    height: 72,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: 'transparent', // Prepare for border
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
