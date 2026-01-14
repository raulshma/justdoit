import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  BackHandler,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Text, useTheme, Surface } from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';
import type { Goal, Priority } from '../types/goal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GoalQuickViewProps {
  goal: Goal | null;
  visible: boolean;
  onDismiss: () => void;
}

/**
 * Priority indicator with color and label
 */
const PriorityIndicator = ({ priority, colors }: { priority: Priority; colors: any }) => {
  const config = {
    high: { color: colors.error, label: 'High Priority', icon: 'alert-circle' },
    medium: { color: colors.primary, label: 'Medium Priority', icon: 'circle' },
    low: { color: colors.tertiary, label: 'Low Priority', icon: 'circle-outline' },
  };

  const style = config[priority];

  return (
    <View style={styles.priorityRow}>
      <ThemedIcon name={style.icon as any} size={18} color={style.color} />
      <Text style={[styles.priorityLabel, { color: style.color }]}>{style.label}</Text>
    </View>
  );
};

/**
 * Format recurrence type to readable string
 */
const formatRecurrence = (type: string): string => {
  const labels: Record<string, string> = {
    none: 'No repeat',
    daily: 'Repeats daily',
    weekly: 'Repeats weekly',
    custom: 'Custom schedule',
  };
  return labels[type] || type;
};

/**
 * Format date to readable string
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * GoalQuickView Component
 * Instagram-style quick view with glassmorphic blur backdrop
 * Shows on long press hold, dismisses on release
 */
export const GoalQuickView: React.FC<GoalQuickViewProps> = ({
  goal,
  visible,
  onDismiss,
}) => {
  const theme = useTheme();
  
  // Animation values
  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);
  const shadowOpacity = useSharedValue(0);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS === 'android' && visible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        onDismiss();
        return true;
      });
      return () => backHandler.remove();
    }
  }, [visible, onDismiss]);

  // Animate in/out
  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
      cardScale.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
      cardOpacity.value = withTiming(1, { duration: 150 });
      // Delayed shadow animation - starts after card transition
      shadowOpacity.value = withDelay(200, withTiming(1, { duration: 150 }));
    } else {
      // Shadow fades first
      shadowOpacity.value = withTiming(0, { duration: 100 });
      backdropOpacity.value = withTiming(0, { duration: 150 });
      cardScale.value = withTiming(0.8, { duration: 150 });
      cardOpacity.value = withTiming(0, { duration: 100 });
    }
  }, [visible]);

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
    shadowOpacity: shadowOpacity.value * 0.15,
    shadowRadius: shadowOpacity.value * 12,
    shadowOffset: { width: 0, height: shadowOpacity.value * 4 },
    shadowColor: '#000',
    elevation: shadowOpacity.value * 3,
  }));

  if (!visible || !goal) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Glassmorphic Blur Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle, { backgroundColor: 'transparent' }]}>
        <BlurView
          intensity={15}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}
        />
      </Animated.View>

      {/* Quick View Card */}
      <Animated.View
        style={[styles.cardContainer, cardStyle]}
        pointerEvents="none"
      >
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: goal.isCompleted ? theme.colors.primary : theme.colors.surfaceVariant }
            ]}>
              <ThemedIcon
                name={goal.isCompleted ? 'check' : 'target'}
                size={20}
                color={goal.isCompleted ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
              />
            </View>
            <Text
              style={[
                styles.statusText,
                { color: goal.isCompleted ? theme.colors.primary : theme.colors.onSurfaceVariant }
              ]}
            >
              {goal.isCompleted ? 'Completed' : 'In Progress'}
            </Text>
          </View>

          {/* Title */}
          <Text
            variant="headlineSmall"
            style={[
              styles.title,
              {
                color: theme.colors.onSurface,
                textDecorationLine: goal.isCompleted ? 'line-through' : 'none',
              }
            ]}
          >
            {goal.title}
          </Text>

          {/* Description */}
          {goal.description && (
            <Text
              variant="bodyMedium"
              style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={3}
            >
              {goal.description}
            </Text>
          )}

          {/* Metadata Section */}
          <View style={[styles.metadataSection, { backgroundColor: theme.colors.surfaceVariant }]}>
            {/* Due Date */}
            <View style={styles.metadataRow}>
              <ThemedIcon name="calendar" size={20} themeColor="primary" />
              <Text style={[styles.metadataLabel, { color: theme.colors.onSurfaceVariant }]}>
                Due
              </Text>
              <Text style={[styles.metadataValue, { color: theme.colors.onSurface }]}>
                {formatDate(goal.dueDate)}
              </Text>
            </View>

            {/* Reminder */}
            {goal.reminderTime && (
              <View style={styles.metadataRow}>
                <ThemedIcon name="bell" size={20} themeColor="secondary" />
                <Text style={[styles.metadataLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Reminder
                </Text>
                <Text style={[styles.metadataValue, { color: theme.colors.onSurface }]}>
                  {new Date(goal.reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}

            {/* Recurrence */}
            {goal.recurrence.type !== 'none' && (
              <View style={styles.metadataRow}>
                <ThemedIcon name="repeat" size={20} themeColor="tertiary" />
                <Text style={[styles.metadataLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Repeat
                </Text>
                <Text style={[styles.metadataValue, { color: theme.colors.onSurface }]}>
                  {formatRecurrence(goal.recurrence.type)}
                </Text>
              </View>
            )}
          </View>

          {/* Priority */}
          <PriorityIndicator priority={goal.priority} colors={theme.colors} />

          {/* Hint */}
          <Text style={[styles.hintText, { color: theme.colors.onSurfaceVariant }]}>
            Release to close
          </Text>
        </Surface>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  cardContainer: {
    width: '85%',
    maxWidth: 360,
  },
  card: {
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  description: {
    lineHeight: 22,
    marginBottom: 20,
  },
  metadataSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataLabel: {
    fontSize: 13,
    marginLeft: 12,
    flex: 1,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  hintText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default GoalQuickView;
