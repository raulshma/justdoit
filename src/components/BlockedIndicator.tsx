import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { ThemedIcon } from './ThemedIcon';
import { Goal } from '../types';

interface BlockedIndicatorProps {
  /** The goal that is blocking (prerequisite that's incomplete) */
  blockingGoal?: Goal | null;
  /** Number of incomplete prerequisites total */
  incompleteCount?: number;
  /** Size variant */
  size?: 'small' | 'medium';
  /** Callback when tapped (e.g., navigate to blocking goal) */
  onPress?: () => void;
}

/**
 * BlockedIndicator Component
 * Visual indicator showing a goal is blocked by incomplete prerequisites
 */
export const BlockedIndicator: React.FC<BlockedIndicatorProps> = ({
  blockingGoal,
  incompleteCount = 1,
  size = 'small',
  onPress,
}) => {
  const theme = useTheme();
  
  // Subtle pulse animation for attention
  const opacity = useSharedValue(1);
  
  React.useEffect(() => {
    opacity.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1, // Infinite repeat
        true
      )
    );
  }, [opacity]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const isSmall = size === 'small';
  const iconSize = isSmall ? 12 : 16;
  const fontSize = isSmall ? 10 : 12;

  const content = (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        {
          backgroundColor: theme.colors.errorContainer,
          paddingHorizontal: isSmall ? 6 : 8,
          paddingVertical: isSmall ? 2 : 4,
          borderRadius: isSmall ? 6 : 8,
        },
      ]}
    >
      <ThemedIcon
        name="lock"
        size={iconSize}
        color={theme.colors.error}
      />
      <Text
        style={[
          styles.text,
          {
            color: theme.colors.error,
            fontSize,
            fontWeight: '600',
          },
        ]}
        numberOfLines={1}
      >
        {blockingGoal 
          ? blockingGoal.title.length > 15 
            ? `${blockingGoal.title.substring(0, 15)}...` 
            : blockingGoal.title
          : incompleteCount > 1 
            ? `${incompleteCount} blocked` 
            : 'Blocked'
        }
      </Text>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={8}>
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    letterSpacing: 0.2,
  },
});

export default BlockedIndicator;
