/**
 * PatternInsightCard - Displays AI-detected productivity pattern insights
 * Dismissible card with actionable recommendations
 */
import React, { memo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';
import { ThemedIcon } from './ThemedIcon';
import type { PatternInsight, PatternInsightType } from '../types/advancedAITypes';

interface PatternInsightCardProps {
  insight: PatternInsight;
  onDismiss: (insightId: string) => void;
  onAction?: (insight: PatternInsight) => void;
}

/**
 * Get icon and color for insight type
 */
const getInsightStyle = (
  type: PatternInsightType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  theme: any
): { icon: string; color: string; bgColor: string } => {
  switch (type) {
    case 'streak_risk':
      return {
        icon: 'fire-alert',
        color: theme.colors.error,
        bgColor: theme.colors.errorContainer,
      };
    case 'low_performance_day':
      return {
        icon: 'calendar-alert',
        color: theme.colors.tertiary,
        bgColor: theme.colors.tertiaryContainer,
      };
    case 'peak_productivity':
      return {
        icon: 'rocket-launch',
        color: theme.colors.primary,
        bgColor: theme.colors.primaryContainer,
      };
    case 'category_imbalance':
      return {
        icon: 'scale-unbalanced',
        color: theme.colors.secondary,
        bgColor: theme.colors.secondaryContainer,
      };
    case 'overdue_pattern':
      return {
        icon: 'clock-alert-outline',
        color: theme.colors.error,
        bgColor: theme.colors.errorContainer,
      };
    case 'time_of_day':
      return {
        icon: 'weather-sunset',
        color: theme.colors.primary,
        bgColor: theme.colors.primaryContainer,
      };
    case 'workload_warning':
      return {
        icon: 'alert-octagon-outline',
        color: theme.colors.tertiary,
        bgColor: theme.colors.tertiaryContainer,
      };
    default:
      return {
        icon: 'lightbulb-outline',
        color: theme.colors.primary,
        bgColor: theme.colors.primaryContainer,
      };
  }
};

/**
 * Priority badge
 */
const PriorityBadge = memo(({ priority }: { priority: 'high' | 'medium' | 'low' }) => {
  const theme = useTheme();
  
  const colors = {
    high: theme.colors.error,
    medium: theme.colors.tertiary,
    low: theme.colors.outline,
  };

  return (
    <View style={[styles.priorityBadge, { backgroundColor: colors[priority] + '20' }]}>
      <Text variant="labelSmall" style={{ color: colors[priority], fontWeight: '600' }}>
        {priority.toUpperCase()}
      </Text>
    </View>
  );
});

/**
 * Main PatternInsightCard Component
 */
export const PatternInsightCard: React.FC<PatternInsightCardProps> = memo(({
  insight,
  onDismiss,
  onAction,
}) => {
  const theme = useTheme();
  const { icon, color, bgColor } = getInsightStyle(insight.type, theme);

  const handleDismiss = useCallback(() => {
    onDismiss(insight.id);
  }, [insight.id, onDismiss]);

  const handleAction = useCallback(() => {
    if (onAction) {
      onAction(insight);
    }
  }, [insight, onAction]);

  return (
    <Animated.View
      entering={SlideInUp.duration(300)}
      exiting={FadeOut.duration(200)}
    >
      <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={1}>
        {/* Icon and Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
            <ThemedIcon name={icon as React.ComponentProps<typeof ThemedIcon>['name']} size={20} color={color} />
          </View>
          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              <Text variant="titleSmall" style={{ flex: 1, color: theme.colors.onSurface }}>
                {insight.title}
              </Text>
              <PriorityBadge priority={insight.priority} />
            </View>
          </View>
          <IconButton
            icon="close"
            size={18}
            onPress={handleDismiss}
            style={styles.closeButton}
          />
        </View>

        {/* Message */}
        <Text
          variant="bodyMedium"
          style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
        >
          {insight.message}
        </Text>

        {/* Actionable Tip */}
        <TouchableOpacity
          style={[styles.actionContainer, { backgroundColor: bgColor }]}
          onPress={handleAction}
          activeOpacity={0.7}
        >
          <ThemedIcon name="lightbulb-on-outline" size={16} color={color} />
          <Text
            variant="bodySmall"
            style={[styles.actionText, { color }]}
          >
            {insight.actionable}
          </Text>
          {onAction && (
            <ThemedIcon name="chevron-right" size={16} color={color} />
          )}
        </TouchableOpacity>
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
    alignItems: 'flex-start',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  closeButton: {
    margin: -8,
  },
  message: {
    marginTop: 12,
    lineHeight: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  actionText: {
    flex: 1,
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default PatternInsightCard;
