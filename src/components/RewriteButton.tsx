import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { useTheme, TouchableRipple } from 'react-native-paper';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { ThemedIcon } from './ThemedIcon';
import { aiService } from '../services';

interface RewriteButtonProps {
  text: string;
  type: 'title' | 'description';
  context?: string;
  onRewrite: (newText: string) => void;
  onError?: (error: string) => void;
  size?: number;
  disabled?: boolean;
  style?: ViewStyle;
  isConfigured?: boolean;
}

/**
 * RewriteButton - AI-powered text rewrite button
 * High-fidelity, avant-garde design with micro-interactions.
 */
export const RewriteButton: React.FC<RewriteButtonProps> = ({
  text,
  type,
  context,
  onRewrite,
  onError,
  size = 20,
  disabled = false,
  style,
  isConfigured = false,
}) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  // Visibility logic: Must be configured and have text content
  const hasContent = text.trim().length > 0;
  const isVisible = isConfigured && hasContent;

  const handlePress = useCallback(async () => {
    if (disabled || isLoading) return;

    // Double check configuration (redundant if UI is hidden, but good for safety)
    if (!aiService.isConfigured()) {
      onError?.('Please configure your OpenRouter API key in Settings.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await aiService.rewriteText(text, type, context);
      if (result) {
        onRewrite(result);
      } else {
        onError?.('Failed to rewrite text. Please try again.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [text, type, context, disabled, isLoading, onRewrite, onError]);

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View 
      entering={ZoomIn.duration(300).springify()} 
      exiting={ZoomOut.duration(200)}
    >
      <TouchableRipple
        onPress={handlePress}
        disabled={disabled || isLoading}
        style={[
          styles.button,
          { 
            backgroundColor: theme.colors.elevation.level1,
            borderColor: theme.colors.outlineVariant,
          },
          style
        ]}
        borderless
        rippleColor={theme.colors.primary + '20'}
        accessibilityLabel={`Rewrite ${type} with AI`}
        accessibilityRole="button"
      >
        {isLoading ? (
          <ActivityIndicator size={size - 4} color={theme.colors.primary} />
        ) : (
          <ThemedIcon
            name="creation" 
            size={size}
            color={theme.colors.primary}
            style={styles.icon}
          />
        )}
      </TouchableRipple>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 12, // More modern squircle shape
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    // Subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  icon: {
    opacity: 0.9,
  }
});

export default RewriteButton;
