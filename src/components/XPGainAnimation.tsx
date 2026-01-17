import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';

interface XPGainAnimationProps {
  /** XP amount gained */
  amount: number;
  /** Whether the animation is visible */
  visible: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Position from top (optional) */
  topOffset?: number;
  /** Multiplier applied (for display) */
  multiplier?: number;
}

/**
 * XPGainAnimation component shows an animated XP gain notification
 * that floats up and fades out.
 * 
 * Requirements: 6.5, 6.6
 */
export const XPGainAnimation: React.FC<XPGainAnimationProps> = ({
  amount,
  visible,
  onComplete,
  topOffset = 100,
  multiplier = 1,
}) => {
  const theme = useTheme();
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      // Reset values
      translateY.setValue(0);
      opacity.setValue(0);
      scale.setValue(0.5);

      // Run animation sequence
      Animated.parallel([
        // Float up
        Animated.timing(translateY, {
          toValue: -80,
          duration: 1500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Fade in then out
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(800),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        // Scale up
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onComplete?.();
      });
    }
  }, [visible, translateY, opacity, scale, onComplete]);

  if (!visible) {
    return null;
  }

  const showMultiplier = multiplier > 1;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: topOffset,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.badge, { backgroundColor: theme.colors.primaryContainer }]}>
        <ThemedIcon name="star" size={20} color={theme.colors.primary} />
        <Text
          variant="titleMedium"
          style={[styles.amount, { color: theme.colors.onPrimaryContainer }]}
        >
          +{amount} XP
        </Text>
        {showMultiplier && (
          <View style={[styles.multiplierBadge, { backgroundColor: theme.colors.tertiary }]}>
            <Text
              variant="labelSmall"
              style={[styles.multiplierText, { color: theme.colors.onTertiary }]}
            >
              x{multiplier}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

/**
 * Hook to manage XP gain animation state
 */
export const useXPGainAnimation = () => {
  const [animationState, setAnimationState] = React.useState<{
    visible: boolean;
    amount: number;
    multiplier: number;
  }>({
    visible: false,
    amount: 0,
    multiplier: 1,
  });

  const showXPGain = (amount: number, multiplier: number = 1) => {
    setAnimationState({
      visible: true,
      amount,
      multiplier,
    });
  };

  const hideXPGain = () => {
    setAnimationState((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  return {
    ...animationState,
    showXPGain,
    hideXPGain,
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  amount: {
    fontWeight: '800',
  },
  multiplierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  multiplierText: {
    fontWeight: '700',
  },
});

export default XPGainAnimation;
