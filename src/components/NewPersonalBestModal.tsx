import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Portal, Modal, Text, Button, useTheme } from 'react-native-paper';
import type { PersonalBestType } from '../types/personalBest';
import { PERSONAL_BEST_DISPLAY_NAMES, personalBestService } from '../services/personalBestService';

interface NewPersonalBestModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is dismissed */
  onDismiss: () => void;
  /** The type of personal best that was broken */
  type: PersonalBestType | null;
  /** The old record value */
  oldValue: number;
  /** The new record value */
  newValue: number;
}

/**
 * Get icon for personal best type
 */
const getPersonalBestIcon = (type: PersonalBestType): string => {
  switch (type) {
    case 'most_goals_day':
      return '🎯';
    case 'longest_streak':
      return '🔥';
    case 'most_xp_week':
      return '⚡';
    case 'fastest_completion':
      return '⏱️';
    case 'most_subgoals_day':
      return '✅';
    default:
      return '🏆';
  }
};

/**
 * Get celebration message based on personal best type
 */
const getCelebrationMessage = (type: PersonalBestType): string => {
  switch (type) {
    case 'most_goals_day':
      return "You're crushing it today! What a productive day!";
    case 'longest_streak':
      return 'Consistency is key! Keep the streak alive!';
    case 'most_xp_week':
      return "You're leveling up faster than ever!";
    case 'fastest_completion':
      return 'Speed and efficiency! Nothing can stop you!';
    case 'most_subgoals_day':
      return 'Breaking down goals like a pro!';
    default:
      return 'Amazing achievement!';
  }
};


/**
 * Star particle component for celebration effect
 */
const StarParticle: React.FC<{
  delay: number;
  color: string;
  startX: number;
}> = ({ delay, color, startX }) => {
  const translateY = useRef(new Animated.Value(-30)).current;
  const translateX = useRef(new Animated.Value(startX)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drift = (Math.random() - 0.5) * 80;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 300,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: startX + drift,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.5,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(1000),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [delay, startX, translateY, translateX, scale, opacity]);

  return (
    <Animated.Text
      style={[
        styles.star,
        {
          color,
          transform: [{ translateX }, { translateY }, { scale }],
          opacity,
        },
      ]}
    >
      ⭐
    </Animated.Text>
  );
};

/**
 * NewPersonalBestModal - Displays a celebration when a personal best is broken
 * Requirements: 8.1, 8.9
 */
export const NewPersonalBestModal: React.FC<NewPersonalBestModalProps> = ({
  visible,
  onDismiss,
  type,
  oldValue,
  newValue,
}) => {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible && type) {
      // Reset animations
      scaleAnim.setValue(0);
      pulseAnim.setValue(1);

      // Run entrance animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Pulse animation loop
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      // Glow animation loop
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.7,
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

      return () => {
        pulseLoop.stop();
        glowLoop.stop();
      };
    } else {
      scaleAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible, type, scaleAnim, pulseAnim, glowAnim]);

  if (!type) {
    return null;
  }

  const icon = getPersonalBestIcon(type);
  const displayName = PERSONAL_BEST_DISPLAY_NAMES[type];
  const celebrationMessage = getCelebrationMessage(type);
  const formattedOldValue = personalBestService.formatValue(type, oldValue);
  const formattedNewValue = personalBestService.formatValue(type, newValue);

  const starColors = ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#9B59B6'];

  // Generate star particles
  const stars = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: i * 100,
    color: starColors[i % starColors.length],
    startX: (Math.random() - 0.5) * 250,
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
        {/* Stars */}
        <View style={styles.starsContainer} pointerEvents="none">
          {stars.map((star) => (
            <StarParticle
              key={star.id}
              delay={star.delay}
              color={star.color}
              startX={star.startX}
            />
          ))}
        </View>

        <Animated.View
          style={[
            styles.content,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Trophy Icon with Glow */}
          <View style={styles.trophyContainer}>
            <Animated.View
              style={[
                styles.trophyGlow,
                {
                  backgroundColor: '#FFD700',
                  opacity: glowAnim,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.trophyCircle,
                {
                  backgroundColor: theme.colors.tertiaryContainer,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Text style={styles.trophyIcon}>🏆</Text>
            </Animated.View>
          </View>

          {/* Title */}
          <Text
            variant="headlineMedium"
            style={[styles.title, { color: '#FFD700' }]}
          >
            New Personal Best!
          </Text>

          {/* Record Type */}
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Text style={styles.typeIcon}>{icon}</Text>
            <Text
              variant="titleMedium"
              style={[styles.typeName, { color: theme.colors.onPrimaryContainer }]}
            >
              {displayName}
            </Text>
          </View>

          {/* Old vs New Value */}
          <View style={styles.comparisonContainer}>
            <View style={styles.valueBox}>
              <Text
                variant="labelSmall"
                style={[styles.valueLabel, { color: theme.colors.onSurfaceVariant }]}
              >
                Previous
              </Text>
              <Text
                variant="titleMedium"
                style={[styles.oldValue, { color: theme.colors.onSurfaceVariant }]}
              >
                {oldValue > 0 ? formattedOldValue : '—'}
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
            <View style={styles.valueBox}>
              <Text
                variant="labelSmall"
                style={[styles.valueLabel, { color: theme.colors.primary }]}
              >
                New Record
              </Text>
              <Text
                variant="headlineSmall"
                style={[styles.newValue, { color: theme.colors.primary }]}
              >
                {formattedNewValue}
              </Text>
            </View>
          </View>

          {/* Celebration Message */}
          <Text
            variant="bodyLarge"
            style={[styles.message, { color: theme.colors.onSurface }]}
          >
            {celebrationMessage}
          </Text>

          {/* Dismiss Button */}
          <Button
            mode="contained"
            onPress={onDismiss}
            style={styles.button}
            contentStyle={styles.buttonContent}
            buttonColor="#FFD700"
            textColor="#000"
          >
            Amazing!
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
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    fontSize: 16,
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  trophyContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  trophyGlow: {
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
  trophyCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trophyIcon: {
    fontSize: 48,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 20,
    gap: 8,
  },
  typeIcon: {
    fontSize: 20,
  },
  typeName: {
    fontWeight: '700',
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  valueBox: {
    alignItems: 'center',
    minWidth: 80,
  },
  valueLabel: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  oldValue: {
    fontWeight: '600',
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  newValue: {
    fontWeight: '800',
  },
  arrow: {
    fontSize: 24,
    opacity: 0.5,
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
    opacity: 0.9,
  },
  button: {
    borderRadius: 24,
    minWidth: 150,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default NewPersonalBestModal;
