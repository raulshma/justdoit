import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Category } from '../types';

interface CategoryBadgeProps {
  category: Category;
  size?: 'small' | 'medium';
}

/**
 * CategoryBadge - Displays a color-coded category label
 * Requirements: 1.3
 */
export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'small',
}) => {
  const theme = useTheme();

  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${category.color}20`, // 20% opacity
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
            color: category.color,
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
