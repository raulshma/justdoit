/**
 * MotivationalMessageCard - Displays AI-generated motivational messages
 * Animated card with emoji, message, and dismiss action
 */
import React, { memo, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import type { MotivationalMessage, MotivationalMessageType } from '../types/advancedAITypes';

interface MotivationalMessageCardProps {
  message: MotivationalMessage;
  onDismiss: (messageId: string) => void;
  onTap?: () => void;
  compact?: boolean;
}

/**
 * Get background color based on message type
 */
const getTypeStyle = (
  type: MotivationalMessageType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  theme: any
): { bgColor: string; borderColor: string } => {
  switch (type) {
    case 'celebration':
    case 'milestone':
      return {
        bgColor: theme.colors.primaryContainer,
        borderColor: theme.colors.primary,
      };
    case 'streak':
      return {
        bgColor: theme.colors.tertiaryContainer,
        borderColor: theme.colors.tertiary,
      };
    case 'comeback':
      return {
        bgColor: theme.colors.secondaryContainer,
        borderColor: theme.colors.secondary,
      };
    case 'encouragement':
    case 'morning':
    case 'evening':
    default:
      return {
        bgColor: theme.colors.surfaceVariant,
        borderColor: theme.colors.outline,
      };
  }
};

/**
 * Animated Emoji Component
 */
const AnimatedEmoji = memo(({ emoji, type }: { emoji: string; type: MotivationalMessageType }) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Different animations based on type
    if (type === 'celebration' || type === 'milestone') {
      // Bounce animation
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        3,
        false
      );
    } else if (type === 'streak') {
      // Pulse animation
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else if (type === 'comeback') {
      // Gentle wave
      rotation.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 200 }),
          withTiming(-10, { duration: 200 }),
          withTiming(0, { duration: 200 })
        ),
        2,
        false
      );
    }
  }, [type, scale, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.Text style={[styles.emoji, animatedStyle]}>
      {emoji}
    </Animated.Text>
  );
});

/**
 * Main MotivationalMessageCard Component
 */
export const MotivationalMessageCard: React.FC<MotivationalMessageCardProps> = memo(({
  message,
  onDismiss,
  onTap,
  compact = false,
}) => {
  const theme = useTheme();
  const { bgColor, borderColor } = getTypeStyle(message.type, theme);

  const handleDismiss = useCallback(() => {
    onDismiss(message.id);
  }, [message.id, onDismiss]);

  if (compact) {
    return (
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
        <TouchableOpacity
          style={[styles.compactContainer, { backgroundColor: bgColor, borderColor }]}
          onPress={onTap}
          activeOpacity={0.8}
        >
          <Text style={styles.compactEmoji}>{message.emoji}</Text>
          <Text
            variant="bodySmall"
            numberOfLines={1}
            style={[styles.compactText, { color: theme.colors.onSurfaceVariant }]}
          >
            {message.message}
          </Text>
          <IconButton
            icon="close"
            size={16}
            onPress={handleDismiss}
            style={styles.compactDismiss}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)}>
      <Surface
        style={[
          styles.container,
          { backgroundColor: bgColor, borderColor, borderWidth: 1 },
        ]}
        elevation={1}
      >
        <View style={styles.content}>
          <AnimatedEmoji emoji={message.emoji} type={message.type} />
          <View style={styles.textContainer}>
            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.onSurface, fontWeight: '500' }}
            >
              {message.message}
            </Text>
          </View>
          <IconButton
            icon="close"
            size={20}
            onPress={handleDismiss}
            style={styles.dismissButton}
          />
        </View>
      </Surface>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  dismissButton: {
    margin: -8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 8,
  },
  compactEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  compactText: {
    flex: 1,
  },
  compactDismiss: {
    margin: -4,
    marginLeft: 4,
  },
});

export default MotivationalMessageCard;
