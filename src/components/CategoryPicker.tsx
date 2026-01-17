import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';
import { Category } from '../types';
import { useCategories } from '../context/CategoryContext';

interface CategoryPickerProps {
  value?: string;
  onChange: (categoryId: string) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * CategoryPicker - Allows selecting a category for a goal
 * Requirements: 1.1, 1.2
 */
export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  value,
  onChange,
  label = 'Category',
  disabled = false,
}) => {
  const theme = useTheme();
  const { categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text
          variant="labelMedium"
          style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
        >
          {label.toUpperCase()}
        </Text>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text
        variant="labelMedium"
        style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
      >
        {label.toUpperCase()}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => {
          const isSelected = value === category.id;

          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => onChange(category.id)}
              activeOpacity={0.7}
              disabled={disabled}
            >
              <Surface
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected
                      ? category.color
                      : theme.colors.surface,
                    borderColor: isSelected
                      ? category.color
                      : theme.colors.outline,
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
                    styles.text,
                    {
                      color: isSelected
                        ? theme.colors.surface
                        : theme.colors.onSurfaceVariant,
                      fontWeight: isSelected ? '700' : '400',
                    },
                  ]}
                >
                  {category.name}
                </Text>
                {isSelected && (
                  <ThemedIcon
                    name="check"
                    size={14}
                    themeColor="surface"
                    style={styles.checkIcon}
                  />
                )}
              </Surface>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1.5,
    fontWeight: '700',
    fontSize: 10,
  },
  scrollContent: {
    gap: 10,
    paddingRight: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    gap: 8,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  text: {
    fontSize: 13,
  },
  checkIcon: {
    marginLeft: 2,
  },
});

export default CategoryPicker;
