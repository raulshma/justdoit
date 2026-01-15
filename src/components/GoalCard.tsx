import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
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
  onSwipeDelete?: (goalId: string) => void; // Called on swipe-to-delete (left-to-right)
  onSwipeComplete?: (goalId: string) => void; // Called on swipe-to-complete (right-to-left)
  onLongPress?: (goalId: string) => void;
  onLongPressEnd?: (goalId: string) => void;
  isToday?: boolean;
}

/**
 * Minimalist Check Ring
 */
const CheckButton = ({ 
  isCompleted, 
  color, 
  outlineColor,
  checkColor,
}: { 
  isCompleted: boolean; 
  color: string; 
  outlineColor: string;
  checkColor: string;
}) => {
  return (
    <View
      style={[
        styles.checkButton,
        {
          borderColor: isCompleted ? color : outlineColor,
          backgroundColor: isCompleted ? color : 'transparent',
          alignItems: 'center', 
          justifyContent: 'center'
        }
      ]}
    >
      {isCompleted && (
        <ThemedIcon name="check" size={14} color={checkColor} />
      )}
    </View>
  );
};

/**
 * Minimalist Priority Dot
 */
const PriorityIndicator = ({ priority, colors }: { priority: Priority; colors: any }) => {
  if (priority === 'medium') return null;
  
  const color = priority === 'high' ? colors.error : colors.tertiary;
  
  return (
    <View style={[styles.priorityDot, { backgroundColor: color }]} />
  );
};

/**
 * GoalCard Component
 * Design Philosophy: "Intentional Minimalism"
 */
export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  category,
  onToggleComplete,
  onPress,
  onDelete,
  onSwipeDelete,
  onSwipeComplete,
  onLongPress,
  onLongPressEnd,
  isToday = true,
}) => {
  const theme = useTheme();
  
  // Reanimated Shared Values
  const translateX = useSharedValue(0);
  const actionOpacity = useSharedValue(0); // Shared opacity for action layers
  const scale = useSharedValue(1);
  const cardOpacity = useSharedValue(goal.isCompleted ? 0.5 : 1);
  const checkboxScale = useSharedValue(1);

  useEffect(() => {
    cardOpacity.value = withTiming(goal.isCompleted ? 0.5 : 1, { duration: 400 });
  }, [goal.isCompleted]);

  // Handle swipe-to-delete (swipe left-to-right)
  const handleSwipeDelete = useCallback(() => {
    if (onSwipeDelete) {
      onSwipeDelete(goal.id);
    } else {
      onDelete(goal.id);
    }
  }, [onSwipeDelete, onDelete, goal.id]);

  // Handle swipe-to-complete (swipe right-to-left)
  const handleSwipeComplete = useCallback(() => {
    if (onSwipeComplete) {
      onSwipeComplete(goal.id);
    } else {
      onToggleComplete(goal.id);
    }
  }, [onSwipeComplete, onToggleComplete, goal.id]);

  // Gesture State Constants
  const STATE_IDLE = 0;
  const STATE_TOUCH_DOWN = 1;
  const STATE_SWIPING = 2;
  const STATE_LONG_PRESSING = 3;

  const gestureState = useSharedValue(STATE_IDLE);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLongPressTimer = () => {
    timerRef.current = setTimeout(() => {
      runOnUI(() => {
        if (gestureState.value === STATE_TOUCH_DOWN) {
          gestureState.value = STATE_LONG_PRESSING;
          runOnJS(triggerLongPressHaptic)();
        }
      })();
    }, 400);
  };

  const cancelLongPressTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const triggerLongPressHaptic = () => {
    onLongPress?.(goal.id);
  };

  const gesture = Gesture.Pan()
    .minDistance(1)
    .onTouchesDown(() => {
      gestureState.value = STATE_TOUCH_DOWN;
      scale.value = withSpring(0.98, { damping: 20, stiffness: 300 });
      runOnJS(startLongPressTimer)();
    })
    .onTouchesUp(() => {
       if (gestureState.value === STATE_LONG_PRESSING) {
         runOnJS(onLongPressEnd!)(goal.id);
       } else if (gestureState.value === STATE_TOUCH_DOWN) {
         runOnJS(onPress)(goal.id);
       }
       runOnJS(cancelLongPressTimer)();
       scale.value = withSpring(1);
       gestureState.value = STATE_IDLE;
    })
    .onUpdate((e) => {
      if (gestureState.value === STATE_LONG_PRESSING) return;

      if (gestureState.value === STATE_TOUCH_DOWN) {
        if (Math.abs(e.translationX) > 10 && Math.abs(e.translationY) < 20) {
          gestureState.value = STATE_SWIPING;
          runOnJS(cancelLongPressTimer)();
        } else if (Math.abs(e.translationY) > 20) {
           runOnJS(cancelLongPressTimer)();
           scale.value = withSpring(1);
           gestureState.value = STATE_IDLE;
        }
      }

      if (gestureState.value === STATE_SWIPING) {
        translateX.value = e.translationX;
        actionOpacity.value = Math.min(Math.abs(e.translationX) / SWIPE_THRESHOLD, 1);
      }
    })
    .onEnd(() => {
      runOnJS(cancelLongPressTimer)();
      scale.value = withSpring(1);

      if (gestureState.value === STATE_SWIPING) {
        // Swipe left-to-right (positive) = Delete
        if (translateX.value > SWIPE_THRESHOLD) {
           translateX.value = withTiming(SCREEN_WIDTH, { duration: 300 }, (finished) => {
             if (finished) runOnJS(handleSwipeDelete)();
           });
        // Swipe right-to-left (negative) = Complete
        } else if (translateX.value < -SWIPE_THRESHOLD) {
           translateX.value = withTiming(-SCREEN_WIDTH, { duration: 300 }, (finished) => {
             if (finished) runOnJS(handleSwipeComplete)();
           });
        } else {
           translateX.value = withSpring(0);
           actionOpacity.value = withTiming(0);
        }
      } else if (gestureState.value === STATE_LONG_PRESSING) {
         runOnJS(onLongPressEnd!)(goal.id);
      }
      
      gestureState.value = STATE_IDLE;
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value }
    ],
    opacity: cardOpacity.value,
  }));

  // Delete layer (left side, revealed when swiping right)
  const deleteLayerStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? actionOpacity.value : 0,
  }));

  // Complete layer (right side, revealed when swiping left)
  const completeLayerStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? actionOpacity.value : 0,
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
      {/* Delete Action Layer (left side - revealed when swiping right) */}
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
          size={24}
        />
      </Animated.View>

      {/* Complete Action Layer (right side - revealed when swiping left) */}
      <Animated.View
        style={[
          styles.completeLayer,
          { backgroundColor: theme.colors.primaryContainer },
          completeLayerStyle,
        ]}
      >
        <IconButton
          icon="check"
          iconColor={theme.colors.primary}
          size={24}
        />
      </Animated.View>

      {/* Main Card Surface */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.cardWrapper, cardStyle]}>
          <Surface
            style={[
              styles.surface,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
            elevation={0}
          >
            <View style={styles.contentRow}>
              {/* Left: Minimal Checkbox */}
              <View style={styles.actionContainer}>
                <TouchableRipple
                  onPress={handleCheckboxPress}
                  borderless
                  style={styles.checkTouch}
                >
                  <Animated.View style={checkboxStyle}>
                    <CheckButton 
                      isCompleted={goal.isCompleted} 
                      color={theme.colors.primary}
                      outlineColor={theme.colors.outlineVariant}
                      checkColor={theme.colors.onPrimary}
                    />
                  </Animated.View>
                </TouchableRipple>
              </View>

              {/* Center: Content */}
              <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                  <Text
                    variant="titleMedium"
                    style={[
                      styles.title,
                      {
                        color: goal.isCompleted ? theme.colors.onSurfaceDisabled : theme.colors.onSurface,
                        textDecorationLine: goal.isCompleted ? 'line-through' : 'none',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {goal.title}
                  </Text>
                  <PriorityIndicator priority={goal.priority} colors={theme.colors} />
                </View>

                {(goal.description || goal.reminderTime || goal.recurrence.type !== 'none' || category) && (
                  <View style={styles.metaRow}>
                    {category && (
                      <CategoryBadge category={category} size="small" />
                    )}
                    
                    {goal.recurrence.type !== 'none' && (
                       <ThemedIcon name="repeat" size={12} color={theme.colors.onSurfaceVariant} />
                    )}

                    {goal.reminderTime && (
                       <View style={styles.metaItem}>
                         <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                           {new Date(goal.reminderTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                         </Text>
                       </View>
                    )}
                  </View>
                )}
              </View>

              {/* Right: Subtle Indicators (only if highly relevant) */}
              {(goal.subgoals && goal.subgoals.length > 0) && (
                 <View style={styles.progressContainer}>
                   <CompactProgressIndicator
                      progress={{
                        completed: goal.subgoals.filter(s => s.isCompleted).length,
                        total: goal.subgoals.length,
                        percentage: Math.round(
                          (goal.subgoals.filter(s => s.isCompleted).length / goal.subgoals.length) * 100
                        ),
                      }}
                   />
                 </View>
              )}
            </View>
          </Surface>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 6,
    position: 'relative',
  },
  deleteLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 20,
  },
  completeLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  cardWrapper: {
    borderRadius: 24,
  },
  surface: {
    borderRadius: 24,
    overflow: 'hidden',
    // Removed shadows for a flat, colored design
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 72,
  },
  actionContainer: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkTouch: {
    borderRadius: 50,
    padding: 2,
  },
  checkButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    opacity: 0.9
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    marginLeft: 12,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default GoalCard;
