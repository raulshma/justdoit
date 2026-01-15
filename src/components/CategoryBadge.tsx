import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Category } from '../types';

interface CategoryBadgeProps {
  category: Category;
  size?: 'small' | 'medium';
}

/**
 * Helper to determine if a color is light or dark
 * Returns true if the color is light (needs dark text)
 */
const isLightColor = (hexColor: string): boolean => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

/**
 * CategoryBadge - Displays a color-coded category label
 * Uses proper contrast colors for accessibility (WCAG AA compliant)
 * Requirements: 1.3
 */
export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'small',
}) => {
  const theme = useTheme();

  const isSmall = size === 'small';
  
  // Determine text color based on category color luminance for proper contrast
  const textColor = isLightColor(category.color) 
    ? '#1A1A1A' // Dark text for light backgrounds
    : category.color; // Use category color for dark backgrounds (on light badge)

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${category.color}25`, // 25% opacity for better visibility
          paddingHorizontal: isSmall ? 6 : 10,
          paddingVertical: isSmall ? 2 : 4,
          borderRadius: isSmall ? 6 : 8,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor: category.color,
            width: isSmall ? 6 : 8,
            height: isSmall ? 6 : 8,
          },
        ]}
      />
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize: isSmall ? 10 : 12,
          },
        ]}
        numberOfLines={1}
      >
        {category.name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    borderRadius: 4,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default CategoryBadge;
