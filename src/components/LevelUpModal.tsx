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

interface LevelUpModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is dismissed */
  onDismiss: () => void;
  /** The new level reached */
  newLevel: number;
  /** Rewards unlocked at this level */
  rewards?: string[];
}

/**
 * Level up messages based on level milestones
 */
const getLevelMessage = (level: number): string => {
  if (level >= 20) return "You've reached legendary status!";
  if (level >= 15) return "You're becoming a master!";
  if (level >= 10) return "Double digits! Incredible!";
  if (level >= 5) return "You're making great progress!";
  if (level >= 3) return "Keep up the momentum!";
  return "Great start on your journey!";
};

/**
 * Get reward display name from reward ID
 */
const getRewardDisplayName = (rewardId: string): string => {
  const rewardNames: Record<string, string> = {
    'theme-sunset': 'Sunset Theme',
    'theme-ocean': 'Ocean Theme',
    'theme-forest': 'Forest Theme',
    'theme-galaxy': 'Galaxy Theme',
  };
  return rewardNames[rewardId] || rewardId;
};

/**
 * Sparkle particle component for celebration effect
 */
const SparkleParticle: React.FC<{
  delay: number;
  color: string;
  angle: number;
}> = ({ delay, color, angle }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const distance = 80 + Math.random() * 40;
    const radians = (angle * Math.PI) / 180;
    const targetX = Math.cos(radians) * distance;
    const targetY = Math.sin(radians) * distance;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: targetX,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: targetY,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(scale, {
              toValue: 1,
              tension: 200,
              friction: 10,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(300),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [delay, angle, translateX, translateY, opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.sparkle,
        {
          backgroundColor: color,
          transform: [{ translateX }, { translateY }, { scale }],
          opacity,
        },
      ]}
    />
  );
};

/**
 * LevelUpModal component displays a celebration when the user levels up
 * 
 * Requirements: 6.5, 6.6
 */
export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  visible,
  onDismiss,
  newLevel,
  rewards = [],
}) => {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);

      // Run entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start();

      // Glow animation loop
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      glowLoop.start();

      return () => glowLoop.stop();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim, rotateAnim, glowAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sparkleColors = [
    theme.colors.primary,
    theme.colors.secondary,
    theme.colors.tertiary,
    '#FFD700',
    '#FF6B6B',
  ];

  // Generate sparkle particles in a circle
  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 50,
    color: sparkleColors[i % sparkleColors.length],
    angle: i * 30,
  }));

  const levelMessage = getLevelMessage(newLevel);
  const hasRewards = rewards.length > 0;

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
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Sparkle effects */}
          <View style={styles.sparkleContainer} pointerEvents="none">
            {sparkles.map((sparkle) => (
              <SparkleParticle
                key={sparkle.id}
                delay={sparkle.delay}
                color={sparkle.color}
                angle={sparkle.angle}
              />
            ))}
          </View>

          {/* Level badge with glow */}
          <View style={styles.levelBadgeContainer}>
            <Animated.View
              style={[
                styles.levelGlow,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: glowAnim,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.levelBadge,
                {
                  backgroundColor: theme.colors.primaryContainer,
                  transform: [{ rotate: spin }],
                },
              ]}
            >
              <ThemedIcon name="star" size={32} color={theme.colors.primary} />
            </Animated.View>
          </View>

          <Text
            variant="headlineLarge"
            style={[styles.title, { color: theme.colors.primary }]}
          >
            Level Up!
          </Text>

          <View style={[styles.newLevelBadge, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text
              variant="displaySmall"
              style={[styles.newLevelText, { color: theme.colors.onPrimaryContainer }]}
            >
              Level {newLevel}
            </Text>
          </View>

          <Text
            variant="bodyLarge"
            style={[styles.message, { color: theme.colors.onSurface }]}
          >
            {levelMessage}
          </Text>

          {hasRewards && (
            <View style={styles.rewardsContainer}>
              <Text
                variant="titleMedium"
                style={[styles.rewardsTitle, { color: theme.colors.onSurface }]}
              >
                Rewards Unlocked!
              </Text>
              {rewards.map((reward, index) => (
                <View
                  key={index}
                  style={[styles.rewardItem, { backgroundColor: theme.colors.surfaceVariant }]}
                >
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {getRewardDisplayName(reward)}
                  </Text>
                </View>
              ))}
            </View>
          )}

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
  content: {
    padding: 32,
    alignItems: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  sparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelBadgeContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  levelBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  newLevelBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 16,
  },
  newLevelText: {
    fontWeight: '800',
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  rewardsContainer: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  rewardsTitle: {
    fontWeight: '700',
    marginBottom: 12,
  },
  rewardItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  button: {
    borderRadius: 24,
    minWidth: 150,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default LevelUpModal;
