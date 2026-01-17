import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Button, useTheme, Surface } from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';

/**
 * Undo window duration in milliseconds (5 seconds)
 */
const UNDO_WINDOW_MS = 5000;

interface PostponeToastProps {
  visible: boolean;
  goalTitle: string;
  newDate: string;
  onUndo: () => void;
  onDismiss: () => void;
}

/**
 * PostponeToast Component
 * Shows a confirmation toast with undo option after postponing a goal
 * Requirements: 4.5
 */
export const PostponeToast: React.FC<PostponeToastProps> = ({
  visible,
  goalTitle,
  newDate,
  onUndo,
  onDismiss,
}) => {
  const theme = useTheme();
  const [progress, setProgress] = useState(1);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Format the date for display
  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if it's tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'tomorrow';
    }

    // Otherwise show the date
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Handle visibility animation
  useEffect(() => {
    if (visible) {
      setProgress(1);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  // Progress countdown
  useEffect(() => {
    if (!visible) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 1 - elapsed / UNDO_WINDOW_MS);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [visible, onDismiss]);

  const handleUndo = useCallback(() => {
    onUndo();
    onDismiss();
  }, [onUndo, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Surface
        style={[
          styles.toast,
          { backgroundColor: theme.colors.inverseSurface || theme.colors.surfaceVariant },
        ]}
        elevation={4}
      >
        {/* Progress bar */}
        <View
          style={[
            styles.progressBar,
            {
              backgroundColor: theme.colors.primary,
              width: `${progress * 100}%`,
            },
          ]}
        />

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <ThemedIcon
              name="calendar-check"
              size={24}
              color={theme.colors.inverseOnSurface || theme.colors.onSurfaceVariant}
            />
          </View>

          <View style={styles.textContainer}>
            <Text
              variant="bodyMedium"
              style={[
                styles.title,
                { color: theme.colors.inverseOnSurface || theme.colors.onSurfaceVariant },
              ]}
              numberOfLines={1}
            >
              Postponed to {formatDate(newDate)}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.subtitle,
                { color: theme.colors.inverseOnSurface || theme.colors.onSurfaceVariant },
              ]}
              numberOfLines={1}
            >
              {goalTitle}
            </Text>
          </View>

          <Button
            mode="text"
            onPress={handleUndo}
            textColor={theme.colors.primary}
            compact
            style={styles.undoButton}
          >
            UNDO
          </Button>
        </View>
      </Surface>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toast: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: 3,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingTop: 15,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
  },
  subtitle: {
    opacity: 0.8,
    marginTop: 2,
  },
  undoButton: {
    marginLeft: 8,
  },
});

export default PostponeToast;
