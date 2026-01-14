import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';

interface PostponedIndicatorProps {
  postponeCount: number;
  size?: 'small' | 'medium';
}

/**
 * PostponedIndicator Component
 * Shows a visual indicator that a goal was postponed
 * Requirements: 4.7
 */
export const PostponedIndicator: React.FC<PostponedIndicatorProps> = ({
  postponeCount,
  size = 'small',
}) => {
  const theme = useTheme();

  if (postponeCount <= 0) return null;

  const isSmall = size === 'small';
  const iconSize = isSmall ? 12 : 16;
  const fontSize = isSmall ? 10 : 12;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.secondaryContainer,
          paddingHorizontal: isSmall ? 6 : 8,
          paddingVertical: isSmall ? 2 : 4,
          borderRadius: isSmall ? 6 : 8,
        },
      ]}
    >
      <ThemedIcon
        name="calendar-arrow-right"
        size={iconSize}
        themeColor="secondary"
      />
      <Text
        style={[
          styles.text,
          {
            color: theme.colors.secondary,
            fontSize,
            fontWeight: '600',
          },
        ]}
      >
        {postponeCount > 1 ? `${postponeCount}×` : 'Postponed'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    letterSpacing: 0.2,
  },
});

export default PostponedIndicator;
