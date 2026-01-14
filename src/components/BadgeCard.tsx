import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import type { Badge, UnlockedBadge } from '../types/badge';

interface BadgeCardProps {
  /** The badge to display */
  badge: Badge;
  /** Unlock information if badge is unlocked */
  unlockedInfo?: UnlockedBadge;
  /** Progress toward unlocking (0-100) */
  progress?: number;
  /** Current progress value */
  currentProgress?: number;
  /** Callback when badge is pressed */
  onPress?: (badge: Badge) => void;
  /** Whether to show compact view */
  compact?: boolean;
}

/**
 * Formats the unlock date for display
 */
const formatUnlockDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * BadgeCard - Displays a badge with locked/unlocked status
 * Requirements: 5.2, 5.3, 5.4
 */
export const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  unlockedInfo,
  progress = 0,
  currentProgress = 0,
  onPress,
  compact = false,
}) => {
  const theme = useTheme();
  const isUnlocked = !!unlockedInfo;

  const handlePress = () => {
    if (onPress) {
      onPress(badge);
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
              backgroundColor: isUnlocked
                ? theme.colors.primaryContainer
                : theme.colors.surfaceVariant,
              opacity: isUnlocked ? 1 : 0.6,
            },
          ]}
        >
          <Text style={styles.compactIcon}>{badge.icon}</Text>
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
            opacity: isUnlocked ? 1 : 0.85,
          },
        ]}
        elevation={isUnlocked ? 2 : 0}
      >
        <View style={styles.content}>
          {/* Badge Icon */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isUnlocked
                  ? theme.colors.primaryContainer
                  : theme.colors.surfaceVariant,
              },
            ]}
          >
            <Text style={[styles.icon, !isUnlocked && styles.lockedIcon]}>
              {badge.icon}
            </Text>
            {!isUnlocked && (
              <View style={[styles.lockOverlay, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={styles.lockIcon}>🔒</Text>
              </View>
            )}
          </View>

          {/* Badge Info */}
          <View style={styles.infoContainer}>
            <Text
              variant="titleSmall"
              style={[
                styles.name,
                { color: isUnlocked ? theme.colors.onSurface : theme.colors.onSurfaceVariant },
              ]}
              numberOfLines={1}
            >
              {badge.name}
            </Text>
            <Text
              variant="bodySmall"
              style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={2}
            >
              {badge.description}
            </Text>

            {/* Progress or Unlock Date */}
            {isUnlocked ? (
              <View style={styles.unlockedInfo}>
                <Text
                  variant="labelSmall"
                  style={[styles.unlockDate, { color: theme.colors.primary }]}
                >
                  ✓ Unlocked {formatUnlockDate(unlockedInfo.unlockedAt)}
                </Text>
              </View>
            ) : (
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
                        backgroundColor: theme.colors.primary,
                        width: `${Math.min(progress, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text
                  variant="labelSmall"
                  style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}
                >
                  {currentProgress}/{badge.criteria.threshold}
                </Text>
              </View>
            )}
          </View>

          {/* XP Reward */}
          <View
            style={[
              styles.xpBadge,
              {
                backgroundColor: isUnlocked
                  ? theme.colors.tertiaryContainer
                  : theme.colors.surfaceVariant,
              },
            ]}
          >
            <Text
              variant="labelSmall"
              style={[
                styles.xpText,
                {
                  color: isUnlocked
                    ? theme.colors.onTertiaryContainer
                    : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              +{badge.xpReward} XP
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
  lockedIcon: {
    opacity: 0.4,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 10,
  },
  infoContainer: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  description: {
    lineHeight: 16,
    opacity: 0.8,
  },
  unlockedInfo: {
    marginTop: 4,
  },
  unlockDate: {
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
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
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  compactIcon: {
    fontSize: 24,
  },
});

export default BadgeCard;
