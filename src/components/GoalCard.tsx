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
import { BlockedIndicator } from './BlockedIndicator';
import { PredictionBadge } from './PredictionBadge';
import type { CompletionPrediction } from '../types/advancedAITypes';

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
  isOverdue?: boolean;
  onMoveToToday?: (goalId: string) => void;
  onReschedule?: (goalId: string) => void;
  // Dependency props
  isBlocked?: boolean;
  blockingGoal?: Goal | null;
  onBlockingGoalPress?: (goalId: string) => void;
  prediction?: CompletionPrediction;
  variant?: 'default' | 'minimal';
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
  isOverdue = false,
  onMoveToToday,
  onReschedule,
  isBlocked = false,
  blockingGoal,
  onBlockingGoalPress,
  prediction,
  variant = 'default',
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

  const hasImages = !!(
    goal.imageUri || 
    goal.coverImage || 
    (goal.progressPhotos?.length ?? 0) > 0 || 
    (goal.moodBoardImages?.length ?? 0) > 0 || 
    (goal.visionBoardImages?.length ?? 0) > 0
  );
  
  const hasVoice = !!goal.voiceNoteUri;

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
    <View style={[styles.container, variant === 'minimal' && styles.minimalContainer]}>
      {/* Delete Action Layer */}
      <Animated.View
        style={[
          styles.deleteLayer,
          { backgroundColor: theme.colors.errorContainer },
          deleteLayerStyle,
          variant === 'minimal' && styles.minimalActionLayer,
        ]}
      >
        <IconButton
          icon="delete-outline"
          iconColor={theme.colors.error}
          size={24}
        />
      </Animated.View>

      {/* Complete Action Layer */}
      <Animated.View
        style={[
          styles.completeLayer,
          { backgroundColor: theme.colors.primaryContainer },
          completeLayerStyle,
          variant === 'minimal' && styles.minimalActionLayer,
        ]}
      >
        <IconButton
          icon="check"
          iconColor={theme.colors.primary}
          size={24}
        />
      </Animated.View>

      {/* Main Content */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.cardWrapper, cardStyle, variant === 'minimal' && styles.minimalCardWrapper]}>
          <Surface
            style={[
              styles.surface,
              variant === 'default' && { backgroundColor: theme.colors.surfaceVariant },
              variant === 'default' && isOverdue && { 
                backgroundColor: theme.colors.errorContainer,
                borderWidth: 1,
                borderColor: theme.colors.error,
              },
              variant === 'minimal' && styles.minimalSurface,
              variant === 'minimal' && isOverdue && { 
                borderBottomColor: theme.colors.error,
                borderBottomWidth: 2,
              },
            ]}
            elevation={0}
          >
            {/* Overdue indicator for full view */}
            {isOverdue && variant === 'default' && !goal.isCompleted && (
              <View style={[styles.overdueHeader, { backgroundColor: theme.colors.error }]}>
                <ThemedIcon name="alert-circle" size={12} color={theme.colors.onError} />
                <Text style={[styles.overdueText, { color: theme.colors.onError }]}>OVERDUE</Text>
                <View style={styles.overdueActions}>
                  {onMoveToToday && (
                    <TouchableRipple
                      onPress={() => onMoveToToday(goal.id)}
                      style={[styles.overdueActionButton, { backgroundColor: theme.colors.surface }]}
                      borderless
                    >
                      <Text style={[styles.overdueActionText, { color: theme.colors.error }]}>Today</Text>
                    </TouchableRipple>
                  )}
                  {onReschedule && (
                    <TouchableRipple
                      onPress={() => onReschedule(goal.id)}
                      style={[styles.overdueActionButton, { backgroundColor: theme.colors.surface }]}
                      borderless
                    >
                      <ThemedIcon name="calendar" size={14} color={theme.colors.error} />
                    </TouchableRipple>
                  )}
                </View>
              </View>
            )}
            <View style={[styles.contentRow, variant === 'minimal' && styles.minimalContentRow]}>
              {/* Left: Checkbox */}
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
                        color: goal.isCompleted 
                          ? theme.colors.onSurfaceDisabled 
                          : isOverdue && variant === 'minimal' 
                            ? theme.colors.error 
                            : theme.colors.onSurface,
                        textDecorationLine: goal.isCompleted ? 'line-through' : 'none',
                        fontSize: variant === 'minimal' ? 16 : 17,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {goal.title}
                  </Text>
                  <PriorityIndicator priority={goal.priority} colors={theme.colors} />
                  {/* Minimal overdue indicator */}
                  {isOverdue && variant === 'minimal' && !goal.isCompleted && (
                    <View style={styles.minimalOverdueRow}>
                      <Text style={[styles.minimalOverdueLabel, { color: theme.colors.error }]}>Overdue</Text>
                      {onMoveToToday && (
                        <TouchableRipple
                          onPress={() => onMoveToToday(goal.id)}
                          borderless
                          style={styles.minimalTodayButton}
                        >
                          <Text style={[styles.minimalTodayText, { color: theme.colors.primary }]}>→ Today</Text>
                        </TouchableRipple>
                      )}
                    </View>
                  )}
                </View>

                {goal.description && (
                  <Text 
                    variant="bodySmall" 
                    style={{ 
                      color: theme.colors.onSurfaceVariant, 
                      marginTop: 2,
                      opacity: 0.8 
                    }} 
                    numberOfLines={1}
                  >
                    {goal.description}
                  </Text>
                )}

                {(hasImages || hasVoice) && (
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 4, alignItems: 'center' }}>
                    {hasVoice && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <ThemedIcon name="microphone" size={14} color={theme.colors.primary} />
                      </View>
                    )}
                    {hasImages && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <ThemedIcon name="image-outline" size={14} color={theme.colors.secondary} />
                      </View>
                    )}
                  </View>
                )}

                  {/* Meta Row: Detailed info for default view, or critical info for minimal */}
                  {(goal.reminderTime || goal.recurrence.type !== 'none' || category || isBlocked || prediction) && variant !== 'minimal' && (
                  <View style={styles.metaRow}>
                    {/* Blocked indicator - high priority display */}
                    {isBlocked && (
                      <BlockedIndicator
                        blockingGoal={blockingGoal}
                        size="small"
                        onPress={onBlockingGoalPress && blockingGoal ? () => onBlockingGoalPress(blockingGoal.id) : undefined}
                      />
                    )}
                    
                    {category && (
                      <CategoryBadge category={category} size="small" />
                    )}
                    
                    {goal.recurrence.type !== 'none' && (
                       <View style={[styles.metaItem, { backgroundColor: theme.colors.secondaryContainer, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }]}>
                         <ThemedIcon name="repeat" size={10} color={theme.colors.onSecondaryContainer} />
                       </View>
                    )}

                    {goal.reminderTime && (
                       <View style={[styles.metaItem, { backgroundColor: theme.colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }]}>
                         <ThemedIcon name="bell-outline" size={12} color={theme.colors.onSurfaceVariant} />
                         <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                           {new Date(goal.reminderTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                         </Text>
                       </View>
                    )}

                    {prediction && (
                      <View style={styles.metaItem}>
                        <PredictionBadge prediction={prediction} size="small" />
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Right: Subtle Indicators (only if highly relevant) */}
              {(goal.subgoals && goal.subgoals.length > 0) && variant !== 'minimal' && (
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
    paddingHorizontal: 20,
    paddingVertical: 18,
    minHeight: 76,
  },
  actionContainer: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkTouch: {
    borderRadius: 50,
    padding: 4, // Larger touch target
  },
  checkButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    opacity: 1,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11, // Slightly smaller for higher density/contrast with chips
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  progressContainer: {
    marginLeft: 12,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  minimalContainer: {
    marginHorizontal: 0,
    marginVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  minimalSurface: {
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
  minimalCardWrapper: {
    borderRadius: 0,
  },
  minimalContentRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  minimalActionLayer: {
    borderRadius: 0,
  },
  // Overdue styles for full view
  overdueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  overdueText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: 6,
    flex: 1,
  },
  overdueActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overdueActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overdueActionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Overdue styles for minimal view
  minimalOverdueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 8,
  },
  minimalOverdueLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  minimalTodayButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  minimalTodayText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default GoalCard;
