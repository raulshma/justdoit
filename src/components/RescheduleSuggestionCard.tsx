/**
 * RescheduleSuggestionCard - Displays smart rescheduling suggestions for overdue goals
 * Shows the suggested new date with rationale and accept/modify/dismiss actions
 */
import React, { memo, useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, Button, IconButton, Chip } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { ThemedIcon } from './ThemedIcon';
import type { RescheduleSuggestion } from '../types/advancedAITypes';

interface RescheduleSuggestionCardProps {
  suggestion: RescheduleSuggestion;
  onAccept: (suggestion: RescheduleSuggestion) => void;
  onModify: (suggestion: RescheduleSuggestion) => void;
  onDismiss: (goalId: string) => void;
  onSnooze?: (goalId: string) => void;
}

/**
 * Format date for display
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
};

/**
 * Confidence indicator
 */
const ConfidenceIndicator = memo(({ confidence }: { confidence: 'high' | 'medium' | 'low' }) => {
  const theme = useTheme();
  
  const config = {
    high: { color: theme.colors.primary, label: 'High confidence', dots: 3 },
    medium: { color: theme.colors.tertiary, label: 'Medium confidence', dots: 2 },
    low: { color: theme.colors.outline, label: 'Low confidence', dots: 1 },
  };

  const { color, label, dots } = config[confidence];

  return (
    <View style={styles.confidenceContainer}>
      <View style={styles.confidenceDots}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.confidenceDot,
              { backgroundColor: i <= dots ? color : theme.colors.outlineVariant },
            ]}
          />
        ))}
      </View>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
    </View>
  );
});

/**
 * Main RescheduleSuggestionCard Component
 */
export const RescheduleSuggestionCard: React.FC<RescheduleSuggestionCardProps> = memo(({
  suggestion,
  onAccept,
  onModify,
  onDismiss,
  onSnooze,
}) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleAccept = useCallback(() => {
    onAccept(suggestion);
  }, [suggestion, onAccept]);

  const handleModify = useCallback(() => {
    onModify(suggestion);
  }, [suggestion, onModify]);

  const handleDismiss = useCallback(() => {
    onDismiss(suggestion.goalId);
  }, [suggestion.goalId, onDismiss]);

  return (
    <Animated.View
      entering={SlideInDown.duration(300)}
      exiting={FadeOut.duration(200)}
    >
      <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={2}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.tertiaryContainer }]}>
            <ThemedIcon name="calendar-sync" size={20} color={theme.colors.tertiary} />
          </View>
          <View style={styles.headerText}>
            <Text variant="labelSmall" style={{ color: theme.colors.tertiary }}>
              Smart Reschedule Suggestion
            </Text>
            <Text variant="titleSmall" numberOfLines={2} style={{ color: theme.colors.onSurface }}>
              {suggestion.goalTitle}
            </Text>
          </View>
          <IconButton
            icon={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            onPress={() => setIsExpanded(!isExpanded)}
          />
        </View>

        {isExpanded && (
          <Animated.View entering={FadeIn.duration(200)}>
            {/* Overdue indicator */}
            <View style={[styles.overdueBar, { backgroundColor: theme.colors.errorContainer }]}>
              <ThemedIcon name="clock-alert-outline" size={16} color={theme.colors.error} />
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginLeft: 8 }}>
                {suggestion.daysOverdue} day{suggestion.daysOverdue !== 1 ? 's' : ''} overdue
              </Text>
            </View>

            {/* Date comparison */}
            <View style={styles.dateComparison}>
              <View style={styles.dateBox}>
                <Text variant="labelSmall" style={{ color: theme.colors.error }}>
                  Was Due
                </Text>
                <Text variant="titleMedium" style={{ color: theme.colors.error }}>
                  {formatDate(suggestion.currentDueDate)}
                </Text>
              </View>
              <ThemedIcon name="arrow-right" size={24} color={theme.colors.outline} />
              <View style={styles.dateBox}>
                <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
                  Suggested
                </Text>
                <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                  {formatDate(suggestion.suggestedDueDate)}
                </Text>
                {suggestion.suggestedTime && (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    at {suggestion.suggestedTime}
                  </Text>
                )}
              </View>
            </View>

            {/* Rationale */}
            <Surface
              style={[styles.rationaleContainer, { backgroundColor: theme.colors.surfaceVariant }]}
              elevation={0}
            >
              <ThemedIcon name="lightbulb-outline" size={16} color={theme.colors.primary} />
              <Text
                variant="bodySmall"
                style={[styles.rationaleText, { color: theme.colors.onSurfaceVariant }]}
              >
                {suggestion.rationale}
              </Text>
            </Surface>

            {/* Confidence */}
            <ConfidenceIndicator confidence={suggestion.confidence} />

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                mode="contained"
                onPress={handleAccept}
                style={styles.actionButton}
                icon="check"
              >
                Accept
              </Button>
              <Button
                mode="outlined"
                onPress={handleModify}
                style={styles.actionButton}
                icon="pencil"
              >
                Modify
              </Button>
              <IconButton
                icon="close"
                mode="outlined"
                onPress={handleDismiss}
                size={20}
              />
            </View>
          </Animated.View>
        )}
      </Surface>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  overdueBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  dateComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingVertical: 8,
  },
  dateBox: {
    alignItems: 'center',
  },
  rationaleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  rationaleText: {
    flex: 1,
    marginLeft: 8,
    lineHeight: 18,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  confidenceDots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginRight: 8,
  },
});

export default RescheduleSuggestionCard;
