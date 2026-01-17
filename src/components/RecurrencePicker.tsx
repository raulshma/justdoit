import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Text,
  useTheme,
  Surface,
} from 'react-native-paper';
import type { RecurrencePattern, RecurrenceType } from '../types/goal';
import { ThemedIcon } from './ThemedIcon';

interface RecurrencePickerProps {
  value: RecurrencePattern;
  onChange: (recurrence: RecurrencePattern) => void;
  label?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'S' },
  { value: 1, label: 'M' },
  { value: 2, label: 'T' },
  { value: 3, label: 'W' },
  { value: 4, label: 'T' },
  { value: 5, label: 'F' },
  { value: 6, label: 'S' },
];

const RECURRENCE_TYPES: { value: RecurrenceType; label: string; icon: string }[] = [
  { value: 'none', label: 'None', icon: 'cancel' },
  { value: 'daily', label: 'Daily', icon: 'calendar-sync' },
  { value: 'weekly', label: 'Weekly', icon: 'calendar-week' },
  { value: 'custom', label: 'Custom', icon: 'calendar-cursor' },
];

/**
 * RecurrencePicker - High Fidelity
 * Modern circular day toggles and card-based type selection.
 */
export const RecurrencePicker: React.FC<RecurrencePickerProps> = ({
  value,
  onChange,
  label = 'Repeat',
}) => {
  const theme = useTheme();
  const [selectedDays, setSelectedDays] = useState<number[]>(value.daysOfWeek || []);

  const handleTypeChange = (newType: RecurrenceType) => {
    let daysOfWeek: number[] | undefined;

    if (newType === 'weekly') {
      const today = new Date().getDay();
      daysOfWeek = [today];
      setSelectedDays([today]);
    } else if (newType === 'custom') {
      daysOfWeek = selectedDays.length > 0 ? selectedDays : [new Date().getDay()];
      if (selectedDays.length === 0) {
        setSelectedDays([new Date().getDay()]);
      }
    } else {
      daysOfWeek = undefined;
      setSelectedDays([]);
    }

    onChange({
      type: newType,
      daysOfWeek,
      parentGoalId: value.parentGoalId,
    });
  };

  const handleDayToggle = (day: number) => {
    let newDays: number[];
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) return; // Prevent empty selection
      newDays = selectedDays.filter((d) => d !== day);
    } else {
      newDays = [...selectedDays, day].sort((a, b) => a - b);
    }
    setSelectedDays(newDays);
    onChange({
      type: value.type,
      daysOfWeek: newDays,
      parentGoalId: value.parentGoalId,
    });
  };

  const showDayPicker = value.type === 'weekly' || value.type === 'custom';

  return (
    <View style={styles.container}>
      <Text
        variant="labelMedium"
        style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
      >
        {label.toUpperCase()}
      </Text>

      {/* Type Selection - Horizontal Scroll / Grid */}
      <View style={styles.grid}>
        {RECURRENCE_TYPES.map((type) => {
          const isSelected = value.type === type.value;
          return (
            <TouchableOpacity
              key={type.value}
              onPress={() => handleTypeChange(type.value)}
              style={styles.typeButtonWrapper}
              activeOpacity={0.8}
            >
              <Surface
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.outline,
                  }
                ]}
                elevation={isSelected ? 1 : 0}
              >
                  <ThemedIcon 
                    name={type.icon as any} 
                    size={20} 
                    color={isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant} 
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={[
                        styles.typeLabel,
                        { color: isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant }
                    ]}
                  >
                      {type.label}
                  </Text>
              </Surface>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day Picker - Circular Toggles */}
      {showDayPicker && (
        <View style={[styles.daysContainer, { backgroundColor: theme.colors.surfaceVariant + '40' }]}>
          <Text
            variant="labelSmall"
            style={[styles.daysLabel, { color: theme.colors.onSurfaceVariant }]}
          >
            Select Days:
          </Text>
          <View style={styles.daysRow}>
            {DAYS_OF_WEEK.map((day) => {
              const isActive = selectedDays.includes(day.value);
              return (
                <TouchableOpacity
                  key={day.value}
                  onPress={() => handleDayToggle(day.value)}
                  activeOpacity={0.6}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      {
                        backgroundColor: isActive
                          ? theme.colors.primary
                          : theme.colors.surfaceVariant,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: isActive
                            ? theme.colors.onPrimary
                            : theme.colors.onSurfaceVariant,
                          fontWeight: isActive ? '700' : '400',
                        },
                      ]}
                    >
                      {day.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButtonWrapper: {
      flex: 1,
      minWidth: '45%',
  },
  typeButton: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'solid',
  },
  typeLabel: {
      fontSize: 13,
      fontWeight: '500',
  },
  daysContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
  daysLabel: {
    marginBottom: 12,
    opacity: 0.8,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
  },
});

export default RecurrencePicker;
