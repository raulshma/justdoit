import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import {
  Portal,
  Modal,
  Text,
  Button,
  useTheme,
} from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';
import type { Badge } from '../types/badge';

interface BadgeUnlockModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is dismissed */
  onDismiss: () => void;
  /** The badge that was unlocked */
  badge: Badge | null;
}

/**
 * Get celebration message based on badge category
 */
const getCelebrationMessage = (badge: Badge): string => {
  switch (badge.category) {
    case 'streak':
      return "You're on fire! Keep the momentum going!";
    case 'completion':
      return 'Every goal completed is a step forward!';
    case 'behavior':
      return 'Great habits lead to great results!';
    case 'category':
      return "You're becoming a specialist!";
    default:
      return 'Amazing achievement!';
  }
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
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drift = (Math.random() - 0.5) * 100;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 400,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: startX + drift,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(1200),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [delay, startX, translateY, translateX, rotate, opacity]);

  const spin = rotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          backgroundColor: color,
          transform: [{ translateX }, { translateY }, { rotate: spin }],
          opacity,
        },
      ]}
    />
  );
};

/**
 * BadgeUnlockModal - Displays a celebration when a badge is unlocked
 * Requirements: 5.1, 5.3
 */
export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({
  visible,
  onDismiss,
  badge,
}) => {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible && badge) {
      // Reset animations
      scaleAnim.setValue(0);
      bounceAnim.setValue(0);

      // Run entrance animation
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Glow animation loop
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.8,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      glowLoop.start();

      return () => glowLoop.stop();
    } else {
      scaleAnim.setValue(0);
      bounceAnim.setValue(0);
    }
  }, [visible, badge, scaleAnim, bounceAnim, glowAnim]);

  if (!badge) {
    return null;
  }

  const confettiColors = [
    theme.colors.primary,
    theme.colors.secondary,
    theme.colors.tertiary,
    '#FFD700',
    '#FF6B6B',
    '#4ECDC4',
  ];

  // Generate confetti particles
  const confetti = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: i * 80,
    color: confettiColors[i % confettiColors.length],
    startX: (Math.random() - 0.5) * 300,
  }));

  const celebrationMessage = getCelebrationMessage(badge);

  const bounceScale = bounceAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1],
  });

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
          {confetti.map((particle) => (
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
          {/* Badge Icon with Glow */}
          <View style={styles.badgeContainer}>
            <Animated.View
              style={[
                styles.badgeGlow,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: glowAnim,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.badgeCircle,
                {
                  backgroundColor: theme.colors.primaryContainer,
                  transform: [{ scale: bounceScale }],
                },
              ]}
            >
              <ThemedIcon 
                name={badge.icon as any} 
                size={48} 
                color={theme.colors.onPrimaryContainer} 
              />
            </Animated.View>
          </View>

          {/* Title */}
          <Text
            variant="headlineMedium"
            style={[styles.title, { color: theme.colors.primary }]}
          >
            Badge Unlocked!
          </Text>

          {/* Badge Name */}
          <View
            style={[
              styles.nameBadge,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Text
              variant="titleLarge"
              style={[styles.badgeName, { color: theme.colors.onPrimaryContainer }]}
            >
              {badge.name}
            </Text>
          </View>

          {/* Description */}
          <Text
            variant="bodyMedium"
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
          >
            {badge.description}
          </Text>

          {/* Celebration Message */}
          <Text
            variant="bodyLarge"
            style={[styles.message, { color: theme.colors.onSurface }]}
          >
            {celebrationMessage}
          </Text>

          {/* XP Reward */}
          <View
            style={[
              styles.xpReward,
              { backgroundColor: theme.colors.tertiaryContainer },
            ]}
          >
            <Text
              variant="titleMedium"
              style={[styles.xpText, { color: theme.colors.onTertiaryContainer }]}
            >
              +{badge.xpReward} XP Earned!
            </Text>
          </View>

          {/* Dismiss Button */}
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
  badgeContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  badgeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIcon: {
    fontSize: 48,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  nameBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 12,
  },
  badgeName: {
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.8,
  },
  message: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  xpReward: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 20,
  },
  xpText: {
    fontWeight: '700',
  },
  button: {
    borderRadius: 24,
    minWidth: 150,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default BadgeUnlockModal;
