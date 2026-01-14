import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import type { PersonalBest, PersonalBestType } from '../types/personalBest';
import { PERSONAL_BEST_DISPLAY_NAMES, personalBestService } from '../services/personalBestService';

interface PersonalBestCardProps {
  /** The personal best record to display */
  personalBest: PersonalBest;
  /** Whether to show compact view */
  compact?: boolean;
}

/**
 * Get icon for personal best type
 */
const getPersonalBestIcon = (type: PersonalBestType): string => {
  switch (type) {
    case 'most_goals_day':
      return '🎯';
    case 'longest_streak':
      return '🔥';
    case 'most_xp_week':
      return '⚡';
    case 'fastest_completion':
      return '⏱️';
    case 'most_subgoals_day':
      return '✅';
    default:
      return '🏆';
  }
};

/**
 * Formats the achieved date for display
 */
const formatAchievedDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * PersonalBestCard - Displays a personal best record with value and date
 * Requirements: 8.2, 8.9
 */
export const PersonalBestCard: React.FC<PersonalBestCardProps> = ({
  personalBest,
  compact = false,
}) => {
  const theme = useTheme();
  const icon = getPersonalBestIcon(personalBest.type);
  const displayName = PERSONAL_BEST_DISPLAY_NAMES[personalBest.type];
  const formattedValue = personalBestService.formatValue(personalBest.type, personalBest.value);

  if (compact) {
    return (
      <View
        style={[
          styles.compactContainer,
          { backgroundColor: theme.colors.primaryContainer },
        ]}
      >
        <Text style={styles.compactIcon}>{icon}</Text>
        <View style={styles.compactInfo}>
          <Text
            variant="labelSmall"
            style={[styles.compactLabel, { color: theme.colors.onPrimaryContainer }]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text
            variant="titleSmall"
            style={[styles.compactValue, { color: theme.colors.onPrimaryContainer }]}
          >
            {formattedValue}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Surface
      style={[styles.surface, { backgroundColor: theme.colors.surface }]}
      elevation={1}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Text style={styles.icon}>{icon}</Text>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text
            variant="labelMedium"
            style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
          >
            {displayName}
          </Text>
          <Text
            variant="titleLarge"
            style={[styles.value, { color: theme.colors.onSurface }]}
          >
            {formattedValue}
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.date, { color: theme.colors.onSurfaceVariant }]}
          >
            Achieved {formatAchievedDate(personalBest.achievedAt)}
          </Text>
        </View>

        {/* Trophy indicator */}
        <View
          style={[
            styles.trophyBadge,
            { backgroundColor: theme.colors.tertiaryContainer },
          ]}
        >
          <Text style={styles.trophyIcon}>🏆</Text>
        </View>
      </View>
    </Surface>
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
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  infoContainer: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  value: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  date: {
    marginTop: 2,
    opacity: 0.7,
  },
  trophyBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trophyIcon: {
    fontSize: 18,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    minWidth: 140,
  },
  compactIcon: {
    fontSize: 20,
  },
  compactInfo: {
    flex: 1,
  },
  compactLabel: {
    fontWeight: '500',
    fontSize: 10,
    opacity: 0.8,
  },
  compactValue: {
    fontWeight: '700',
  },
});

export default PersonalBestCard;
