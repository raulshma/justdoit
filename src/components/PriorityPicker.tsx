import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import type { Priority } from '../types/goal';
import { ThemedIcon } from './ThemedIcon';

interface PriorityPickerProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  label?: string;
}

const PRIORITIES: { value: Priority; label: string; colorKey: string; icon: string }[] = [
  { value: 'low', label: 'Low', colorKey: 'tertiary', icon: 'feather' },
  { value: 'medium', label: 'Medium', colorKey: 'secondary', icon: 'minus' },
  { value: 'high', label: 'High', colorKey: 'error', icon: 'alert-circle-outline' },
];

/**
 * PriorityPicker - High Fidelity
 * Uses animated floating pills instead of segmented buttons.
 * WCAG AA compliant with proper contrast ratios.
 */
export const PriorityPicker: React.FC<PriorityPickerProps> = ({
  value,
  onChange,
  label = 'Priority',
}) => {
  const theme = useTheme();

  // Get appropriate text color for each priority based on background
  const getTextColor = (colorKey: string, isSelected: boolean) => {
    if (!isSelected) return theme.colors.onSurfaceVariant;
    // For error (high priority), use onError for proper contrast
    if (colorKey === 'error') return theme.colors.onError;
    // For tertiary and secondary, use onTertiary/onSecondary
    if (colorKey === 'tertiary') return theme.colors.onTertiary;
    if (colorKey === 'secondary') return theme.colors.onSecondary;
    return theme.colors.onPrimary;
  };

  return (
    <View style={styles.container}>
      <Text
        variant="labelMedium"
        style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
      >
        {label.toUpperCase()}
      </Text>
      
      <View style={styles.row}>
        {PRIORITIES.map((item) => {
          const isSelected = value === item.value;
          // Dynamically get color from theme based on key
          const activeColor = (theme.colors as any)[item.colorKey];
          const textColor = getTextColor(item.colorKey, isSelected);
          
          return (
            <TouchableOpacity
              key={item.value}
              onPress={() => onChange(item.value)}
              activeOpacity={0.7}
              style={styles.touchable}
            >
              <Surface
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected ? activeColor : theme.colors.surface,
                    borderColor: isSelected ? activeColor : theme.colors.outline,
                    borderWidth: isSelected ? 0 : 1,
                    elevation: isSelected ? 4 : 0,
                  },
                ]}
              >
                <ThemedIcon 
                    name={item.icon as any} 
                    size={16} 
                    color={textColor} 
                    style={styles.icon}
                />
                <Text
                  style={[
                    styles.text,
                    {
                      color: textColor,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Surface>
            </TouchableOpacity>
          );
        })}
      </View>
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  touchable: {
    flex: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  text: {
    fontSize: 14,
  },
  icon: {
      marginTop: 2,
  }
});

export default PriorityPicker;
