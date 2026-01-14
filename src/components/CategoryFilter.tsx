import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';
import { Category } from '../types';
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
    >
      {/* "All" option */}
      {showAllOption && (
        <TouchableOpacity
          onPress={() => onSelectCategory(null)}
          activeOpacity={0.7}
        >
          <Surface
            style={[
              styles.chip,
              {
                backgroundColor: isAllSelected
                  ? theme.colors.primary
                  : theme.colors.surface,
                borderColor: isAllSelected
                  ? theme.colors.primary
                  : theme.colors.outline,
                borderWidth: isAllSelected ? 0 : 1,
                elevation: isAllSelected ? 2 : 0,
              },
            ]}
          >
            <ThemedIcon
              name="view-grid-outline"
              size={14}
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
                  fontWeight: isAllSelected ? '700' : '500',
                },
              ]}
            >
              All
            </Text>
          </Surface>
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
          >
            <Surface
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? category.color
                    : theme.colors.surface,
                  borderColor: isSelected ? category.color : theme.colors.outline,
                  borderWidth: isSelected ? 0 : 1,
                  elevation: isSelected ? 2 : 0,
                },
              ]}
            >
              <View
                style={[
                  styles.colorDot,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.surface
                      : category.color,
                  },
                ]}
              />
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected
                      ? theme.colors.surface
                      : theme.colors.onSurfaceVariant,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {category.name}
              </Text>
            </Surface>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
});

export default CategoryFilter;
