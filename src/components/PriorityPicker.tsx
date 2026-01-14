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
 */
export const PriorityPicker: React.FC<PriorityPickerProps> = ({
  value,
  onChange,
  label = 'Priority',
}) => {
  const theme = useTheme();

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
                    color={isSelected ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} 
                    style={styles.icon}
                />
                <Text
                  style={[
                    styles.text,
                    {
                      color: isSelected ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
                      fontWeight: isSelected ? '700' : '400',
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
