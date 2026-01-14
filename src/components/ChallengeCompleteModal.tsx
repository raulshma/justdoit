import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Portal, Modal, Text, Button, useTheme } from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';
import type { Challenge, ChallengeType } from '../types/challenge';

interface ChallengeCompleteModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is dismissed */
  onDismiss: () => void;
  /** The completed challenge */
  challenge: Challenge | null;
}

/**
 * Icons for each challenge type
 */
const CHALLENGE_ICONS: Record<ChallengeType, string> = {
  completion_count: 'target',
  category_focus: 'folder-outline',
  streak_maintenance: 'fire',
  priority_completion: 'star-outline',
  early_completion: 'weather-sunset-up',
  subgoal_completion: 'checkbox-marked-circle-outline',
};

/**
 * Celebration messages for completing challenges
 */
const CELEBRATION_MESSAGES = [
  'Challenge conquered! 💪',
  'You did it! 🎉',
  'Mission accomplished! 🚀',
  'Incredible work! ⭐',
  'Challenge master! 🏆',
  'Unstoppable! 🔥',
];

/**
 * Get a random celebration message
 */
const getRandomMessage = (): string => {
  return CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
};

/**
 * Confetti particle component
 */
const ConfettiParticle: React.FC<{
  delay: number;
  color: string;
  startX: number;
}> = ({ delay, color, startX }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(startX)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(translateY, {
        toValue: 400,
        duration: 2000,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: startX + (Math.random() - 0.5) * 100,
        duration: 2000,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: Math.random() * 4 - 2,
        duration: 2000,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 2000,
        delay: delay + 1000,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [delay, startX, translateY, translateX, rotate, opacity]);

  const spin = rotate.interpolate({
    inputRange: [-2, 2],
    outputRange: ['-360deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          backgroundColor: color,
          transform: [{ translateY }, { translateX }, { rotate: spin }],
          opacity,
        },
      ]}
    />
  );
};

/**
 * ChallengeCompleteModal - Displays celebration when a challenge is completed
 * Requirements: 7.4, 7.6
 */
export const ChallengeCompleteModal: React.FC<ChallengeCompleteModalProps> = ({
  visible,
  onDismiss,
  challenge,
}) => {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const celebrationMessage = useRef(getRandomMessage()).current;

  useEffect(() => {
    if (visible) {
      // Reset message on new show
      celebrationMessage.valueOf();
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  const confettiColors = [
    theme.colors.primary,
    theme.colors.secondary,
    theme.colors.tertiary,
    '#FFD700', // Gold
    '#FF6B6B', // Coral
    '#4ECDC4', // Teal
  ];

  // Generate confetti particles
  const confettiParticles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    delay: Math.random() * 500,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    startX: Math.random() * 300 - 150,
  }));

  if (!challenge) {
    return null;
  }

  const icon = CHALLENGE_ICONS[challenge.type] || '🎯';

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        {/* Confetti */}
        <View style={styles.confettiContainer} pointerEvents="none">
          {confettiParticles.map((particle) => (
            <ConfettiParticle
              key={particle.id}
              delay={particle.delay}
              color={particle.color}
              startX={particle.startX}
            />
          ))}
        </View>

        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Challenge Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <ThemedIcon 
              name={icon as any} 
              size={48} 
              color={theme.colors.onPrimaryContainer} 
            />
          </View>

          <Text
            variant="headlineMedium"
            style={[styles.title, { color: theme.colors.primary }]}
          >
            Challenge Complete!
          </Text>

          <Text
            variant="titleLarge"
            style={[styles.message, { color: theme.colors.onSurface }]}
          >
            {celebrationMessage}
          </Text>

          <Text
            variant="titleMedium"
            style={[styles.challengeTitle, { color: theme.colors.onSurface }]}
          >
            {challenge.title}
          </Text>

          {/* XP Reward */}
          <View
            style={[
              styles.xpContainer,
              { backgroundColor: theme.colors.tertiaryContainer },
            ]}
          >
            <ThemedIcon 
              name="star-four-points" 
              size={24} 
              color={theme.colors.onTertiaryContainer} 
            />
            <Text
              variant="headlineSmall"
              style={[styles.xpText, { color: theme.colors.onTertiaryContainer }]}
            >
              +{challenge.xpReward} XP
            </Text>
          </View>

          <Text
            variant="bodyMedium"
            style={[styles.encouragement, { color: theme.colors.onSurfaceVariant }]}
          >
            Great job completing this weekly challenge!{'\n'}
            Keep up the momentum! 🌟
          </Text>

          <Button
            mode="contained"
            onPress={onDismiss}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Awesome!
          </Button>
        </Animated.View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  challengeTitle: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 16,
    gap: 8,
  },
  xpIcon: {
    fontSize: 24,
  },
  xpText: {
    fontWeight: '800',
  },
  encouragement: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    borderRadius: 24,
    minWidth: 150,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default ChallengeCompleteModal;
