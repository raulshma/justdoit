import React, { useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS 
} from 'react-native-reanimated';
import { ThemedIcon } from './ThemedIcon';
import type { Challenge, ChallengeType } from '../types/challenge';

interface WeeklyChallengesWidgetProps {
  challenges: Challenge[];
  onPress: () => void;
  onLongPress?: (challenge: Challenge) => void;
  onLongPressEnd?: () => void;
}

// Valid MaterialCommunityIcons names
const CHALLENGE_ICONS: Record<ChallengeType, string> = {
  completion_count: 'target',
  category_focus: 'folder-outline',
  streak_maintenance: 'fire',
  priority_completion: 'star-outline',
  early_completion: 'weather-sunset-up',
  subgoal_completion: 'checkbox-marked-circle-outline',
};

interface ChallengeItemProps {
  challenge: Challenge;
  index: number;
  total: number;
  onPress: () => void;
  onLongPress?: (challenge: Challenge) => void;
  onLongPressEnd?: () => void;
}

const ChallengeItem: React.FC<ChallengeItemProps> = ({
  challenge,
  index,
  total,
  onPress,
  onLongPress,
  onLongPressEnd,
}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);

  // Constants
  const LONG_PRESS_DURATION = 500;
  const STATE_IDLE = 0;
  const STATE_TOUCH_DOWN = 1;
  const STATE_LONG_PRESSING = 2;
  const gestureState = useSharedValue(STATE_IDLE); // 0: Idle, 1: TouchDown, 2: LongPressActive

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLongPressTimer = () => {
    timerRef.current = setTimeout(() => {
        gestureState.value = STATE_LONG_PRESSING; // Mark as long press active
        scale.value = withSpring(0.95);
        if (onLongPress) onLongPress(challenge);
    }, LONG_PRESS_DURATION);
  };

  const cancelLongPressTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const gesture = Gesture.Pan()
    .minDistance(0) // Start immediately
    .onTouchesDown(() => {
       gestureState.value = STATE_TOUCH_DOWN;
       scale.value = withSpring(0.97);
       runOnJS(startLongPressTimer)();
    })
    .onTouchesUp(() => {
        runOnJS(cancelLongPressTimer)();
        scale.value = withSpring(1);
        
        if (gestureState.value === STATE_LONG_PRESSING) {
            // Dismiss quick view
            if (onLongPressEnd) runOnJS(onLongPressEnd)();
        } else if (gestureState.value === STATE_TOUCH_DOWN) {
            // It was a tap
            runOnJS(onPress)();
        }
        gestureState.value = STATE_IDLE;
    })
    .onEnd(() => {
        // Handle gestures that end without touchesUp (e.g. cancelled)
        // Ensure cleanup if not handled in TouchesUp
        runOnJS(cancelLongPressTimer)();
        scale.value = withSpring(1);
        if (gestureState.value === STATE_LONG_PRESSING) {
             if (onLongPressEnd) runOnJS(onLongPressEnd)();
        }
        gestureState.value = STATE_IDLE;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const progress = Math.min((challenge.current / challenge.target) * 100, 100);
  const iconName = CHALLENGE_ICONS[challenge.type] || 'trophy-outline';
  const isCompleted = challenge.status === 'completed';

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.card,
          { 
            backgroundColor: theme.colors.surfaceVariant,
            marginRight: index === total - 1 ? 20 : 10,
            marginLeft: index === 0 ? 20 : 0
          },
          animatedStyle
        ]}
      >
        <View style={styles.cardHeader}>
            <ThemedIcon 
              name={iconName as any} 
              size={18} 
              color={isCompleted ? theme.colors.primary : theme.colors.onSurfaceVariant} 
            />
            <Text variant="labelSmall" style={[styles.progressText, { color: theme.colors.primary }]}>
              {Math.round(progress)}%
            </Text>
        </View>
        
        <Text 
          variant="labelMedium" 
          numberOfLines={1} 
          style={[
              styles.title, 
              { color: theme.colors.onSurface }
          ]}
        >
          {challenge.title}
        </Text>

        {/* Minimal Progress Bar */}
        <View style={[styles.progressBarBg, { backgroundColor: theme.colors.surfaceDisabled }]}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                backgroundColor: theme.colors.primary,
                width: `${progress}%` 
              }
            ]} 
          />
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

export const WeeklyChallengesWidget: React.FC<WeeklyChallengesWidgetProps> = ({
  challenges,
  onPress,
  onLongPress,
  onLongPressEnd,
}) => {
  const theme = useTheme();

  if (!challenges || challenges.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleSmall" style={[styles.headerTitle, { color: theme.colors.onSurfaceVariant }]}>WEEKLY CHALLENGES</Text>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {challenges.map((challenge, index) => (
          <ChallengeItem
            key={challenge.id}
            challenge={challenge}
            index={index}
            total={challenges.length}
            onPress={onPress}
            onLongPress={onLongPress}
            onLongPressEnd={onLongPressEnd}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1,
    opacity: 0.8,
  },
  scrollContent: {
    paddingRight: 20,
  },
  card: {
    width: 130,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontWeight: '700',
    fontSize: 10,
  },
  title: {
    fontWeight: '600',
    fontSize: 12,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 'auto',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
