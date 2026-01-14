import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  BackHandler,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Text, useTheme, Surface } from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';
import type { Challenge, ChallengeType } from '../types/challenge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChallengeQuickViewProps {
  challenge: Challenge | null;
  visible: boolean;
  onDismiss: () => void;
}

// Icons for each challenge type (mirrored from widget)
const CHALLENGE_ICONS: Record<ChallengeType, string> = {
  completion_count: 'target',
  category_focus: 'folder-outline',
  streak_maintenance: 'fire',
  priority_completion: 'star-outline',
  early_completion: 'clock-outline',
  subgoal_completion: 'checkbox-marked-circle-outline',
};

/**
 * ChallengeQuickView Component
 * High-fidelity glassmorphic quick view for challenges on long press.
 */
export const ChallengeQuickView: React.FC<ChallengeQuickViewProps> = ({
  challenge,
  visible,
  onDismiss,
}) => {
  const theme = useTheme();
  
  // Animation values
  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);
  const shadowOpacity = useSharedValue(0);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS === 'android' && visible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        onDismiss();
        return true;
      });
      return () => backHandler.remove();
    }
  }, [visible, onDismiss]);

  // Animate in/out
  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
      cardScale.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
      cardOpacity.value = withTiming(1, { duration: 150 });
      shadowOpacity.value = withDelay(200, withTiming(1, { duration: 150 }));
    } else {
      shadowOpacity.value = withTiming(0, { duration: 100 });
      backdropOpacity.value = withTiming(0, { duration: 150 });
      cardScale.value = withTiming(0.8, { duration: 150 });
      cardOpacity.value = withTiming(0, { duration: 100 });
    }
  }, [visible]);

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
    shadowOpacity: shadowOpacity.value * 0.15,
    shadowRadius: shadowOpacity.value * 12,
    shadowOffset: { width: 0, height: shadowOpacity.value * 4 },
    shadowColor: '#000',
    elevation: shadowOpacity.value * 3,
  }));

  if (!visible || !challenge) return null;

  const progress = Math.min((challenge.current / challenge.target) * 100, 100);
  const iconName = CHALLENGE_ICONS[challenge.type] || 'trophy-outline';
  const isCompleted = challenge.status === 'completed';

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Glassmorphic Blur Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle, { backgroundColor: 'transparent' }]}>
        <BlurView
          intensity={15}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}
        />
      </Animated.View>

      {/* Quick View Card */}
      <Animated.View
        style={[styles.cardContainer, cardStyle]}
        pointerEvents="none"
      >
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: isCompleted ? theme.colors.primaryContainer : theme.colors.tertiaryContainer }
            ]}>
              <ThemedIcon
                name={iconName as any}
                size={24}
                color={isCompleted ? theme.colors.onPrimaryContainer : theme.colors.onTertiaryContainer}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>
                    Weekly Challenge
                </Text>
                <Text
                variant="headlineSmall"
                style={[
                    styles.title,
                    { color: theme.colors.onSurface }
                ]}
                numberOfLines={2}
                >
                {challenge.title}
                </Text>
            </View>
          </View>

          {/* Description */}
          <Text
            variant="bodyMedium"
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
          >
            {challenge.description}
          </Text>

          {/* Progress Section */}
          <View style={[styles.progressSection, { backgroundColor: theme.colors.surfaceVariant }]}>
             <View style={styles.progressRow}>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Progress</Text>
                <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                    {Math.round(progress)}%
                </Text>
             </View>
             
             <View style={[styles.progressBarBg, { backgroundColor: theme.colors.surfaceDisabled }]}>
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
            <Text variant="bodySmall" style={{ textAlign: 'center', marginTop: 8, opacity: 0.7 }}>
                {challenge.current} / {challenge.target} completed
            </Text>
          </View>

          {/* XP Reward */}
          <View style={[styles.rewardRow, { backgroundColor: theme.colors.secondaryContainer }]}>
             <ThemedIcon name="star-four-points" size={16} color={theme.colors.onSecondaryContainer} />
             <Text style={[styles.rewardText, { color: theme.colors.onSecondaryContainer }]}>
                REWARD: +{challenge.xpReward} XP
             </Text>
          </View>

          {/* Hint */}
          <Text style={[styles.hintText, { color: theme.colors.onSurfaceVariant }]}>
            Release to close
          </Text>
        </Surface>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  cardContainer: {
    width: '85%',
    maxWidth: 360,
  },
  card: {
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  description: {
    lineHeight: 22,
    marginBottom: 24,
    opacity: 0.9,
  },
  progressSection: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  rewardText: {
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  hintText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.6,
  },
});

export default ChallengeQuickView;
