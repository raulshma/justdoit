import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import {
  Portal,
  Modal,
  Text,
  Button,
  useTheme,
} from 'react-native-paper';

interface CelebrationModalProps {
  visible: boolean;
  onDismiss: () => void;
  completedCount: number;
}

/**
 * Celebration messages for completing all goals
 */
const CELEBRATION_MESSAGES = [
  "You're on fire! 🔥",
  "Amazing work today! ⭐",
  "You crushed it! 💪",
  "Goal getter! 🎯",
  "Unstoppable! 🚀",
  "Champion! 🏆",
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
          transform: [
            { translateY },
            { translateX },
            { rotate: spin },
          ],
          opacity,
        },
      ]}
    />
  );
};

/**
 * CelebrationModal component displays a celebratory message and confetti
 * when the user completes all their goals for the day.
 * 
 * Requirements: 6.2, 6.3
 */
export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  visible,
  onDismiss,
  completedCount,
}) => {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const celebrationMessage = useRef(getRandomMessage()).current;

  useEffect(() => {
    if (visible) {
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
  const confettiParticles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 500,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    startX: Math.random() * 300 - 150,
  }));

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
          <Text style={styles.emoji}>🎉</Text>
          
          <Text
            variant="headlineMedium"
            style={[styles.title, { color: theme.colors.primary }]}
          >
            All Goals Complete!
          </Text>

          <Text
            variant="titleLarge"
            style={[styles.message, { color: theme.colors.onSurface }]}
          >
            {celebrationMessage}
          </Text>

          <Text
            variant="bodyLarge"
            style={[styles.stats, { color: theme.colors.onSurfaceVariant }]}
          >
            You completed {completedCount} goal{completedCount !== 1 ? 's' : ''} today!
          </Text>

          <Text
            variant="bodyMedium"
            style={[styles.encouragement, { color: theme.colors.onSurfaceVariant }]}
          >
            Take a moment to celebrate your accomplishment.{'\n'}
            You've earned it! 🌟
          </Text>

          <Button
            mode="contained"
            onPress={onDismiss}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Keep Going!
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
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  stats: {
    textAlign: 'center',
    marginBottom: 12,
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

export default CelebrationModal;
