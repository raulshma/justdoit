import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Button, useTheme, Surface, Portal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedIcon } from './ThemedIcon';
import { useSettings } from '../context/SettingsContext';

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
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const surfaceColor = theme.colors.surface;
  const textColor = theme.colors.onSurface;
  const accentColor = theme.colors.primary;
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

  const tabBarHeight = settings.showTabBarLabels ? 80 : 64;
  const tabBarBottomPadding = insets.bottom + 12;
  const bottomOffset = tabBarHeight + tabBarBottomPadding + 16;

  return (
    <Portal>
      <Animated.View
        style={[
          styles.container,
          {
            bottom: bottomOffset,
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
            {
              backgroundColor: surfaceColor,
              borderColor: theme.colors.outlineVariant + '80',
            },
          ]}
          elevation={5}
        >
          {/* Progress bar */}
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor: accentColor,
                width: `${progress * 100}%`,
              },
            ]}
          />

          {/* Accent bar */}
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

          <View style={styles.content}>
            <View style={styles.leftColumn}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: accentColor + '1F' },
                ]}
              >
                <ThemedIcon
                  name="calendar-check"
                  size={22}
                  color={accentColor}
                />
              </View>
            </View>

            <View style={styles.textContainer}>
              <Text
                variant="titleSmall"
                style={[
                  styles.title,
                  { color: textColor },
                ]}
                numberOfLines={1}
              >
                Postponed to {formatDate(newDate)}
              </Text>
              <Text
                variant="bodySmall"
                style={[
                  styles.subtitle,
                  { color: textColor },
                ]}
                numberOfLines={1}
              >
                {goalTitle}
              </Text>
            </View>

            <Button
              mode="text"
              onPress={handleUndo}
              textColor={accentColor}
              compact
              style={styles.undoButton}
            >
              UNDO
            </Button>
          </View>
        </Surface>
      </Animated.View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 12,
  },
  toast: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
  },
  progressBar: {
    height: 2,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  leftColumn: {
    paddingLeft: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 2,
  },
  undoButton: {
    marginLeft: 8,
  },
});

export default PostponeToast;
