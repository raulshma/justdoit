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

  /* ChallengeItem Component */
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
            backgroundColor: theme.colors.surface, // Changed to surface for cleaner look
            borderColor: isCompleted ? theme.colors.primary : theme.colors.outlineVariant,
            borderWidth: 0.325,
            marginRight: index === total - 1 ? 20 : 12,
            marginLeft: index === 0 ? 20 : 0
          },
          animatedStyle
        ]}
      >
        <View style={styles.cardHeader}>
            <View style={[
              styles.iconWrapper, 
              { backgroundColor: isCompleted ? theme.colors.primaryContainer : theme.colors.secondaryContainer }
            ]}>
              <ThemedIcon 
                name={iconName as any} 
                size={20} 
                color={isCompleted ? theme.colors.primary : theme.colors.onSecondaryContainer} 
              />
            </View>
            <View style={[styles.percentageBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text variant="labelSmall" style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
                {Math.round(progress)}%
              </Text>
            </View>
        </View>
        
        <View style={styles.textContainer}>
          <Text 
            variant="labelLarge" 
            numberOfLines={2} 
            style={[
                styles.title, 
                { color: theme.colors.onSurface }
            ]}
          >
            {challenge.title}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 6, fontSize: 10 }}>
             {challenge.current}/{challenge.target}
          </Text>
          {/* Minimal Progress Bar */}
          <View style={[styles.progressBarBg, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  backgroundColor: isCompleted ? theme.colors.primary : theme.colors.primary,
                  width: `${progress}%` 
                }
              ]} 
            />
          </View>
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
        <Text variant="titleMedium" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Weekly Challenges</Text>
        <Text variant="labelSmall" style={{ color: theme.colors.primary }}>View All</Text>
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
    marginBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 16,
  },
  scrollContent: {
    paddingRight: 20,
  },
  card: {
    width: 150,
    height: 160,
    padding: 16,
    borderRadius: 24,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    fontWeight: '700',
    fontSize: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 18,
  },
  footer: {
    marginTop: 'auto',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
