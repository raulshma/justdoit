import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';
import { useCategories } from '../context/CategoryContext';

interface CategoryFilterProps {
  selectedCategoryId?: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  showAllOption?: boolean;
}

/**
 * CategoryFilter - Filter chips for filtering goals by category
 * Requirements: 1.4
 */
export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategoryId,
  onSelectCategory,
  showAllOption = true,
}) => {
  const theme = useTheme();
  const { categories, isLoading } = useCategories();

  if (isLoading) {
    return null;
  }

  const isAllSelected = selectedCategoryId === null || selectedCategoryId === undefined;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* "All" option */}
        {showAllOption && (
          <TouchableOpacity
            onPress={() => onSelectCategory(null)}
            activeOpacity={0.7}
            style={[
              styles.chip,
              {
                backgroundColor: isAllSelected
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
              },
            ]}
          >
            <ThemedIcon
              name="view-grid-outline"
              size={18}
              color={
                isAllSelected
                  ? theme.colors.onPrimary
                  : theme.colors.onSurfaceVariant
              }
            />
            <Text
              style={[
                styles.chipText,
                {
                  color: isAllSelected
                    ? theme.colors.onPrimary
                    : theme.colors.onSurfaceVariant,
                  fontWeight: '600',
                },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
        )}

        {/* Category chips */}
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          
          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => onSelectCategory(category.id)}
              activeOpacity={0.7}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? category.color
                    : theme.colors.surfaceVariant,
                },
              ]}
            >
              {!isSelected && (
                <View
                  style={[
                    styles.colorDot,
                    {
                      backgroundColor: category.color,
                    },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected
                      ? '#FFFFFF' // Assuming category colors are dark/vibrant enough for white text, or should use contrast calculation
                      : theme.colors.onSurfaceVariant,
                    fontWeight: '600',
                  },
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8, // Tighter gap
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6, // Compact
    paddingHorizontal: 12,
    borderRadius: 16, // Smaller radius
    gap: 6,
  },
  colorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 12, // Smaller text
    letterSpacing: 0.2,
  },
});

export default CategoryFilter;
