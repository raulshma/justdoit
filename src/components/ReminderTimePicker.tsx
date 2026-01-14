import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  Text,
  useTheme,
  Switch,
  Portal,
  Modal,
  Button,
  Surface,
} from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';
import { aiService, completionPatternService, storageService } from '../services';

interface ReminderTimePickerProps {
  value: string | undefined;
  onChange: (reminderTime: string | undefined) => void;
  label?: string;
  goalDueDate?: string;
  goalTitle?: string;
  goalDescription?: string;
}

const generateTimeOptions = (): { value: string; label: string }[] => {
  const options: { value: string; label: string }[] = [];
  for (let hour = 6; hour <= 23; hour++) {
    for (const minute of [0, 30]) {
      const date = new Date();
      date.setHours(hour, minute, 0, 0);
      const label = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      options.push({ value: `${hour}:${minute.toString().padStart(2, '0')}`, label });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

/**
 * ReminderTimePicker - High Fidelity
 * Inline toggle row with sophisticated time display and AI suggestion.
 */
export const ReminderTimePicker: React.FC<ReminderTimePickerProps> = ({
  value,
  onChange,
  label = 'Reminder',
  goalDueDate,
  goalTitle,
  goalDescription,
}) => {
  const theme = useTheme();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState<{ time: string; rationale: string } | null>(null);

  const isEnabled = !!value;
  const settings = storageService.getSettings();
  const canSuggest = settings.smartRemindersEnabled && aiService.isConfigured() && goalTitle;

  // Format existing value for display
  const displayTime = value ? new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) : '9:00 AM';

  const handleToggle = (newValue: boolean) => {
    if (newValue) {
      const dueDate = goalDueDate ? new Date(goalDueDate) : new Date();
      dueDate.setDate(dueDate.getDate() + 1); // Default tomorrow
      dueDate.setHours(9, 0, 0, 0);
      onChange(dueDate.toISOString());
    } else {
      onChange(undefined);
      setSuggestion(null);
    }
  };

  const handleTimeSelect = (timeValue: string) => {
    const [hours, minutes] = timeValue.split(':').map(Number);
    const dueDate = goalDueDate ? new Date(goalDueDate) : new Date();
    if (!goalDueDate) {
      dueDate.setDate(dueDate.getDate() + 1);
    }
    dueDate.setHours(hours, minutes, 0, 0);
    
    onChange(dueDate.toISOString());
    setShowTimePicker(false);
    setSuggestion(null);
  };

  const handleSuggestTime = useCallback(async () => {
    if (!goalTitle) return;
    
    setIsLoadingSuggestion(true);
    try {
      const patterns = completionPatternService.formatPatternsForAI();
      const result = await aiService.suggestOptimalReminderTime(
        goalTitle,
        goalDescription,
        patterns
      );
      
      if (result) {
        setSuggestion({ time: result.suggestedTime, rationale: result.rationale });
        // Auto-apply the suggestion
        handleTimeSelect(result.suggestedTime);
      }
    } catch (error) {
      console.error('Failed to get AI suggestion:', error);
    } finally {
      setIsLoadingSuggestion(false);
    }
  }, [goalTitle, goalDescription]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant + '40' }]}>
     
      {/* Main Row */}
      <View style={styles.row}>
        <View style={styles.labelContainer}>
            <ThemedIcon name="bell-outline" size={20} themeColor="onSurfaceVariant" />
            <Text
                variant="bodyLarge"
                style={[styles.mainLabel, { color: theme.colors.onSurface }]}
            >
                {label}
            </Text>
        </View>
        <Switch
            value={isEnabled}
            onValueChange={handleToggle}
            color={theme.colors.primary}
            style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
        />
      </View>

      {/* Expanded Time Selection */}
      {isEnabled && (
        <View>
          <TouchableOpacity 
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.timeDisplay, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[styles.timeText, { color: theme.colors.primary }]}>
                    {displayTime}
                </Text>
                <ThemedIcon name="chevron-down" size={20} themeColor="onSurfaceVariant" />
            </View>
          </TouchableOpacity>

          {/* AI Suggestion Button */}
          {canSuggest && (
            <TouchableOpacity
              onPress={handleSuggestTime}
              disabled={isLoadingSuggestion}
              activeOpacity={0.7}
              style={[styles.suggestButton, { borderColor: theme.colors.tertiary + '50' }]}
            >
              {isLoadingSuggestion ? (
                <ActivityIndicator size="small" color={theme.colors.tertiary} />
              ) : (
                <ThemedIcon name="brain" size={18} themeColor="tertiary" />
              )}
              <Text style={[styles.suggestText, { color: theme.colors.tertiary }]}>
                {isLoadingSuggestion ? 'Analyzing...' : 'Suggest Optimal Time'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Show suggestion rationale */}
          {suggestion && (
            <Surface style={[styles.suggestionCard, { backgroundColor: theme.colors.tertiaryContainer + '60' }]} elevation={0}>
              <ThemedIcon name="lightbulb-outline" size={16} themeColor="tertiary" />
              <Text style={[styles.suggestionText, { color: theme.colors.onTertiaryContainer }]}>
                {suggestion.rationale}
              </Text>
            </Surface>
          )}
        </View>
      )}

      <Portal>
        <Modal
          visible={showTimePicker}
          onDismiss={() => setShowTimePicker(false)}
          contentContainerStyle={[
            styles.modalContent,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Select Time
          </Text>
          <View style={styles.grid}>
            {TIME_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleTimeSelect(option.value)}
                style={[
                    styles.timeButton, 
                    { 
                        backgroundColor: displayTime === option.label ? theme.colors.primaryContainer : theme.colors.surface,
                        borderColor: displayTime === option.label ? theme.colors.primary : theme.colors.outline 
                    }
                ]}
              >
                  <Text style={{ color: displayTime === option.label ? theme.colors.primary : theme.colors.onSurface }}>
                    {option.label}
                  </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Button mode="text" onPress={() => setShowTimePicker(false)} style={{ marginTop: 20 }}>
            Cancel
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    borderRadius: 16,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  mainLabel: {
      fontWeight: '500',
  },
  timeDisplay: {
      marginTop: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
  },
  timeText: {
      fontSize: 16,
      fontWeight: '600',
  },
  suggestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  suggestText: {
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  modalContent: {
    margin: 20,
    padding: 24,
    borderRadius: 24,
    maxHeight: '80%',
  },
  modalTitle: {
      textAlign: 'center',
      marginBottom: 24,
      fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  timeButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      minWidth: 80,
      alignItems: 'center',
  }
});

export default ReminderTimePicker;

