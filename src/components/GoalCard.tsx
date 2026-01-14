import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withSequence,
  runOnJS,
  runOnUI,
} from 'react-native-reanimated';
import { ThemedIcon } from './ThemedIcon';
import {
  Card,
  Checkbox,
  Text,
  IconButton,
  useTheme,
  Surface,
  TouchableRipple,
} from 'react-native-paper';
import type { Goal, Priority, Category, SubgoalProgress } from '../types';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { CategoryBadge } from './CategoryBadge';
import { CompactProgressIndicator } from './ProgressIndicator';
import { PostponedIndicator } from './PostponedIndicator';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface GoalCardProps {
  goal: Goal;
  category?: Category;
  onToggleComplete: (goalId: string) => void;
  onPress: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  onLongPress?: (goalId: string) => void;
  onLongPressEnd?: (goalId: string) => void;
  isToday?: boolean;
}

/**
 * Modern Custom Checkbox - Animated Circle
 */
const CheckButton = ({ 
  isCompleted, 
  color, 
  outlineColor,
  checkColor,
  onPress 
}: { 
  isCompleted: boolean; 
  color: string; 
  outlineColor: string;
  checkColor: string;
  onPress: () => void;
}) => {
  return (
    <TouchableRipple
      onPress={onPress}
      borderless
      style={[
        styles.checkButton,
        {
          borderColor: isCompleted ? color : outlineColor,
          backgroundColor: isCompleted ? color : 'transparent',
        }
      ]}
    >
      {isCompleted ? (
        <ThemedIcon name="check" size={16} color={checkColor} />
      ) : (
        <View />
      )}
    </TouchableRipple>
  );
};

/**
 * Priority Pill - Text based styled badge
 */
const PriorityBadge = ({ priority, colors }: { priority: Priority; colors: any }) => {
  if (priority === 'medium') return null; // Minimalist: hide medium
  
  const config = {
    high: { color: colors.error, bg: colors.errorContainer, label: 'URGENT' },
    low: { color: colors.tertiary, bg: colors.tertiaryContainer, label: 'LOW' },
  };

  const style = config[priority];
  if (!style) return null;

  return (
    <View style={[styles.priorityPill, { backgroundColor: style.bg }]}>
      <Text style={[styles.priorityText, { color: style.color }]}>{style.label}</Text>
    </View>
  );
};

/**
 * GoalCard Component
 * High Fidelity Design: "Floating, Airy, Minimalist"
 */
export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  category,
  onToggleComplete,
  onPress,
  onDelete,
  onLongPress,
  onLongPressEnd,
  isToday = true,
}) => {
  const theme = useTheme();
  
  // Reanimated Shared Values
  const translateX = useSharedValue(0);
  const deleteOpacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const cardOpacity = useSharedValue(goal.isCompleted ? 0.6 : 1);
  const checkboxScale = useSharedValue(1);

  useEffect(() => {
    cardOpacity.value = withTiming(goal.isCompleted ? 0.6 : 1, { duration: 300 });
  }, [goal.isCompleted]);

  const handleDelete = useCallback(() => {
    runOnJS(onDelete)(goal.id);
  }, [onDelete, goal.id]);

  // Refs
  const isLongPressing = useRef(false);

  // Gesture State Constants
  const STATE_IDLE = 0;
  const STATE_TOUCH_DOWN = 1;
  const STATE_SWIPING = 2;
  const STATE_LONG_PRESSING = 3;

  const gestureState = useSharedValue(STATE_IDLE);

  // Timers
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startLongPressTimer = () => {
    timerRef.current = setTimeout(() => {
      // Trigger long press from JS side
      // checking value on JS side is tricky if shared value is UI-only?
      // No, we can assume if timer fires, we haven't cancelled it.
      // We must check if we are still in TOUCH_DOWN state? 
      // Ideally we trigger a worklet to update state, but we can't easily.
      // Instead, we just call the prop callback, and let the UI thread update state via runOnUI?
      // Better: Use runOnUI to update shared value.
      runOnUI(() => {
        if (gestureState.value === STATE_TOUCH_DOWN) {
          gestureState.value = STATE_LONG_PRESSING;
          runOnJS(triggerLongPressHaptic)();
        }
      })();
    }, 500); // 500ms for long press
  };

  const cancelLongPressTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const triggerLongPressHaptic = () => {
    // Optional: Add haptic feedback here
    onLongPress?.(goal.id);
  };

  // Unified Manual Gesture
  const gesture = Gesture.Pan()
    .minDistance(1) // Start immediately-ish
    .onTouchesDown(() => {
      gestureState.value = STATE_TOUCH_DOWN;
      scale.value = withSpring(0.97);
      runOnJS(startLongPressTimer)();
    })
    .onTouchesUp(() => {
       if (gestureState.value === STATE_LONG_PRESSING) {
         runOnJS(onLongPressEnd!)(goal.id);
       } else if (gestureState.value === STATE_TOUCH_DOWN) {
         runOnJS(onPress)(goal.id);
       }
       // Reset
       runOnJS(cancelLongPressTimer)();
       scale.value = withSpring(1);
       gestureState.value = STATE_IDLE;
    })
    .onUpdate((e) => {
      if (gestureState.value === STATE_LONG_PRESSING) {
        // Ignore movement, just keep tracking
        return;
      }

      if (gestureState.value === STATE_TOUCH_DOWN) {
        // Check for swipe start
        if (Math.abs(e.translationX) > 10 && Math.abs(e.translationY) < 20) {
          gestureState.value = STATE_SWIPING;
          runOnJS(cancelLongPressTimer)();
        } else if (Math.abs(e.translationY) > 20) {
           // Vertical scroll started, cancel everything
           runOnJS(cancelLongPressTimer)();
           scale.value = withSpring(1);
           gestureState.value = STATE_IDLE;
           // We can't really "cancel" a Pan gesture to let ScrollView take over easily 
           // without failOffsetY, but failOffsetY prevents onTouchesDown from tracking long press initially?
           // Actually, standard Pan handles this if we use activeOffsetX/failOffsetY.
           // But here we are manually tracking.
           // To allow scroll, we should probably fail? 
           // If we manually activate/fail, we can do it. 
        }
      }

      if (gestureState.value === STATE_SWIPING) {
        translateX.value = e.translationX;
        deleteOpacity.value = Math.min(Math.abs(e.translationX) / SWIPE_THRESHOLD, 1);
      }
    })
    .onEnd((e) => {
      runOnJS(cancelLongPressTimer)();
      scale.value = withSpring(1);

      if (gestureState.value === STATE_SWIPING) {
        if (translateX.value < -SWIPE_THRESHOLD) {
           translateX.value = withTiming(-SCREEN_WIDTH, { duration: 300 }, (finished) => {
             if (finished) runOnJS(handleDelete)();
           });
        } else {
           translateX.value = withSpring(0);
           deleteOpacity.value = withTiming(0);
        }
      } else if (gestureState.value === STATE_LONG_PRESSING) {
         runOnJS(onLongPressEnd!)(goal.id);
      }
      
      gestureState.value = STATE_IDLE;
    });

  // Animated Styles
  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value }
    ],
    opacity: cardOpacity.value,
  }));

  const deleteLayerStyle = useAnimatedStyle(() => ({
    opacity: deleteOpacity.value,
  }));

  const checkboxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkboxScale.value }],
  }));

  const handleCheckboxPress = useCallback(() => {
    checkboxScale.value = withSequence(
      withTiming(0.8, { duration: 80 }),
      withSpring(1)
    );
    onToggleComplete(goal.id);
  }, [onToggleComplete, goal.id]);

  return (
    <View style={styles.container}>
      {/* Delete Background Layer */}
      <Animated.View
        style={[
          styles.deleteLayer,
          { backgroundColor: theme.colors.errorContainer },
          deleteLayerStyle,
        ]}
      >
        <IconButton
          icon="delete-outline"
          iconColor={theme.colors.error}
          size={28}
          style={styles.deleteIcon}
        />
      </Animated.View>

      {/* Main Card */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.cardWrapper, cardStyle]}>
          <Surface
            style={[
              styles.surface,
              { backgroundColor: isToday ? theme.colors.surface : theme.colors.surfaceVariant },
            ]}
            elevation={0}
          >
            {/* Provide visual feedback wrapper since we removed TouchableRipple's ripple for the main card to solve gesture conflicts 
                Or keep TouchableRipple inside but disable its events? 
                Better: Use the GestureDetector for logical events and just View for layout.
            */}
            <View style={styles.contentRow}>
              {/* Left: Check Button */}
              <View style={styles.checkboxWrapper}>
                <TouchableRipple
                  onPress={handleCheckboxPress}
                  borderless
                  style={{ borderRadius: 14 }}
                >
                  <Animated.View style={checkboxStyle}>
                    <CheckButton 
                      isCompleted={goal.isCompleted} 
                      color={theme.colors.primary}
                      outlineColor={theme.colors.outline}
                      checkColor={theme.colors.onPrimary}
                      onPress={handleCheckboxPress} 
                    />
                  </Animated.View>
                </TouchableRipple>
              </View>

              {/* Main Content */}
              <View style={styles.innerContentRow}>
                {/* Text Content */}
                <View style={styles.textContainer}>
                  <View style={styles.headerRow}>
                    <Text
                      variant="titleMedium"
                      style={[
                        styles.title,
                        {
                          color: goal.isCompleted ? theme.colors.outline : theme.colors.onSurface,
                          textDecorationLine: goal.isCompleted ? 'line-through' : 'none',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {goal.title}
                    </Text>
                    {goal.recurrence.type !== 'none' && (
                      <ThemedIcon
                        name="repeat"
                        size={14}
                        themeColor="tertiary"
                        style={styles.recurringIcon}
                      />
                    )}
                  </View>

                  {goal.description ? (
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.description,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                      numberOfLines={2}
                    >
                      {goal.description}
                    </Text>
                  ) : null}
                  
                  {/* Time/Date metadata */}
                  <View style={styles.footerRow}>
                    {category && (
                      <CategoryBadge category={category} size="small" />
                    )}
                    {/* Subgoal Progress Indicator */}
                    {goal.subgoals && goal.subgoals.length > 0 && (
                      <CompactProgressIndicator
                        progress={{
                          completed: goal.subgoals.filter(s => s.isCompleted).length,
                          total: goal.subgoals.length,
                          percentage: Math.round(
                            (goal.subgoals.filter(s => s.isCompleted).length / goal.subgoals.length) * 100
                          ),
                        }}
                      />
                    )}
                    {goal.carriedForward && (
                      <View style={[styles.metadataItem, { backgroundColor: theme.colors.tertiaryContainer, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }]}>
                        <ThemedIcon name="arrow-right-bold" size={12} themeColor="tertiary" />
                        <Text style={[styles.metadataText, { color: theme.colors.tertiary, fontWeight: '600' }]}>
                          Carried{goal.carryForwardCount && goal.carryForwardCount > 1 ? ` (${goal.carryForwardCount}x)` : ''}
                        </Text>
                      </View>
                    )}
                    {/* Postponed Indicator */}
                    {goal.postponeCount && goal.postponeCount > 0 && (
                      <PostponedIndicator postponeCount={goal.postponeCount} size="small" />
                    )}
                    {goal.reminderTime && (
                      <View style={styles.metadataItem}>
                        <ThemedIcon name="bell-outline" size={14} themeColor="onSurfaceVariant" />
                        <Text style={[styles.metadataText, { color: theme.colors.onSurfaceVariant }]}>
                          {new Date(goal.reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Right: Priority Indicator */}
                <View style={styles.metaContainer}>
                  <PriorityBadge priority={goal.priority} colors={theme.colors} />
                </View>
              </View>
            </View>
          </Surface>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    position: 'relative',
  },
  deleteLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 24,
  },
  deleteIcon: {
    margin: 0,
  },
  cardWrapper: {
    borderRadius: 24, // High fidelity rounded corners
  },
  surface: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, // Unified padding
  },
  checkboxWrapper: {
    marginRight: 16,
    justifyContent: 'center',
  },
  touchableFull: {
    flex: 1,
  },
  innerContentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    paddingVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  footerRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 10,
    fontWeight: '500',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
  },
  recurringIcon: {
    marginLeft: 6,
  },
  metaContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default GoalCard;
