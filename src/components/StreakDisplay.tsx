import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';

interface StreakDisplayProps {
  /** Current streak count in days */
  currentStreak: number;
  /** Longest streak achieved */
  longestStreak?: number;
  /** Whether to show the flame animation */
  animated?: boolean;
}

/**
 * Get streak milestone message
 */
const getStreakMessage = (streak: number): string => {
  if (streak === 0) return "Start your streak today!";
  if (streak === 1) return "Great start! Keep it going!";
  if (streak < 7) return "Building momentum!";
  if (streak < 14) return "One week strong! 💪";
  if (streak < 30) return "You're on fire!";
  if (streak < 60) return "Incredible dedication!";
  if (streak < 100) return "Unstoppable force!";
  return "Legendary streak! 🏆";
};

/**
 * StreakDisplay component shows the current streak with a flame icon
 * and motivational messaging with high-fidelity animations.
 * 
 * Requirements: 11.3
 */
export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  currentStreak,
  longestStreak,
  animated = true,
}) => {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (animated && currentStreak > 0) {
      // Pulse animation for the flame
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );

      // Glow animation
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();
      glowAnimation.start();

      return () => {
        pulseAnimation.stop();
        glowAnimation.stop();
      };
    }
  }, [animated, currentStreak, scaleAnim, glowAnim]);

  const streakMessage = getStreakMessage(currentStreak);
  const isActive = currentStreak > 0;

  // Determine flame color based on streak length
  const getFlameColor = () => {
    if (currentStreak >= 30) return '#FF4500'; // Orange-red for long streaks
    if (currentStreak >= 7) return theme.colors.primary;
    return theme.colors.secondary;
  };
  
  const flameColor = getFlameColor();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.streakRow}>
          {/* Flame icon with animation */}
          <Animated.View
            style={[
              styles.flameContainer,
              {
                transform: [{ scale: isActive ? scaleAnim : 1 }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.flameGlow,
                {
                  backgroundColor: flameColor,
                  opacity: isActive ? glowAnim : 0,
                },
              ]}
            />
            <ThemedIcon 
              name="fire" 
              size={64} 
              color={isActive ? flameColor : theme.colors.outline} 
            />
          </Animated.View>

          {/* Streak count */}
          <View style={styles.countContainer}>
            <Text
              variant="displayMedium"
              style={[
                styles.count,
                { color: isActive ? theme.colors.onSurface : theme.colors.onSurfaceVariant },
              ]}
            >
              {currentStreak}
            </Text>
            <Text
              variant="titleMedium"
              style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            >
              day{currentStreak !== 1 ? 's' : ''} streak
            </Text>
          </View>
        </View>

        {/* Streak message */}
        <Text
          variant="bodyLarge"
          style={[styles.message, { color: theme.colors.onSurface, opacity: 0.9 }]}
        >
          {streakMessage}
        </Text>

        {/* Longest streak */}
        {longestStreak !== undefined && longestStreak > currentStreak && (
          <View style={[styles.badge, { backgroundColor: theme.colors.surfaceVariant }]}>
             <ThemedIcon name="trophy" size={14} themeColor="onSurfaceVariant" style={{ marginRight: 4 }} />
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Best: {longestStreak} days
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  content: {
    alignItems: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  flameContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  flameGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    // We can simulate glow with shadow
    shadowColor: "#FF4500",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  countContainer: {
    alignItems: 'flex-start',
  },
  count: {
    fontWeight: '800',
    lineHeight: 56,
  },
  label: {
    marginTop: -4,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  message: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
});

export default StreakDisplay;
