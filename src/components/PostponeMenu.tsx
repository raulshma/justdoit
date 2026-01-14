import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TextInput, Platform } from 'react-native';
import {
  Menu,
  Divider,
  Text,
  useTheme,
  TouchableRipple,
  Portal,
  Modal,
  Button,
} from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';

/**
 * Quick postpone options
 */
type PostponeOption = 'tomorrow' | 'custom' | 'snooze-1h' | 'snooze-3h';

interface PostponeMenuProps {
  visible: boolean;
  onDismiss: () => void;
  onPostponeToTomorrow: () => void;
  onPostponeToDate: (date: Date) => void;
  onSnooze: (minutes: number) => void;
  anchor: React.ReactNode;
  hasReminder?: boolean;
}

/**
 * PostponeMenu Component
 * Provides quick options for postponing goals
 * Requirements: 4.1, 4.3
 */
export const PostponeMenu: React.FC<PostponeMenuProps> = ({
  visible,
  onDismiss,
  onPostponeToTomorrow,
  onPostponeToDate,
  onSnooze,
  anchor,
  hasReminder = false,
}) => {
  const theme = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [dateError, setDateError] = useState('');

  const handlePostponeToTomorrow = useCallback(() => {
    onPostponeToTomorrow();
    onDismiss();
  }, [onPostponeToTomorrow, onDismiss]);

  const handlePostpone2Days = useCallback(() => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    onPostponeToDate(date);
    onDismiss();
  }, [onPostponeToDate, onDismiss]);

  const handlePostponeNextWeek = useCallback(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    onPostponeToDate(date);
    onDismiss();
  }, [onPostponeToDate, onDismiss]);

  const handleOpenDatePicker = useCallback(() => {
    setDateInput('');
    setDateError('');
    setShowDatePicker(true);
    onDismiss();
  }, [onDismiss]);

  const handleConfirmDate = useCallback(() => {
    // Parse date input (expected format: YYYY-MM-DD or MM/DD/YYYY)
    let parsedDate: Date | null = null;
    
    // Try YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      parsedDate = new Date(dateInput + 'T00:00:00');
    }
    // Try MM/DD/YYYY format
    else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateInput)) {
      const [month, day, year] = dateInput.split('/').map(Number);
      parsedDate = new Date(year, month - 1, day);
    }
    // Try MM-DD-YYYY format
    else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateInput)) {
      const [month, day, year] = dateInput.split('-').map(Number);
      parsedDate = new Date(year, month - 1, day);
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      setDateError('Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (parsedDate < today) {
      setDateError('Cannot postpone to a past date');
      return;
    }

    setShowDatePicker(false);
    onPostponeToDate(parsedDate);
  }, [dateInput, onPostponeToDate]);

  const handleCancelDatePicker = useCallback(() => {
    setShowDatePicker(false);
    setDateInput('');
    setDateError('');
  }, []);

  const handleSnooze1Hour = useCallback(() => {
    onSnooze(60);
    onDismiss();
  }, [onSnooze, onDismiss]);

  const handleSnooze3Hours = useCallback(() => {
    onSnooze(180);
    onDismiss();
  }, [onSnooze, onDismiss]);

  return (
    <>
      <Menu
        visible={visible}
        onDismiss={onDismiss}
        anchor={anchor}
        contentStyle={[styles.menuContent, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.menuHeader}>
          <ThemedIcon
            name="calendar-clock"
            size={20}
            themeColor="primary"
          />
          <Text
            variant="titleSmall"
            style={[styles.menuTitle, { color: theme.colors.onSurface }]}
          >
            Postpone Goal
          </Text>
        </View>
        <Divider style={styles.divider} />

        <Menu.Item
          onPress={handlePostponeToTomorrow}
          title="Tomorrow"
          leadingIcon="calendar-arrow-right"
          titleStyle={{ color: theme.colors.onSurface }}
        />
        <Menu.Item
          onPress={handlePostpone2Days}
          title="In 2 days"
          leadingIcon="calendar-plus"
          titleStyle={{ color: theme.colors.onSurface }}
        />
        <Menu.Item
          onPress={handlePostponeNextWeek}
          title="Next week"
          leadingIcon="calendar-week"
          titleStyle={{ color: theme.colors.onSurface }}
        />
        <Menu.Item
          onPress={handleOpenDatePicker}
          title="Pick a date..."
          leadingIcon="calendar"
          titleStyle={{ color: theme.colors.onSurface }}
        />

        {hasReminder && (
          <>
            <Divider style={styles.divider} />
            <View style={styles.menuHeader}>
              <ThemedIcon
                name="bell-sleep"
                size={20}
                themeColor="tertiary"
              />
              <Text
                variant="titleSmall"
                style={[styles.menuTitle, { color: theme.colors.onSurface }]}
              >
                Snooze Reminder
              </Text>
            </View>
            <Menu.Item
              onPress={handleSnooze1Hour}
              title="Snooze 1 hour"
              leadingIcon="clock-plus-outline"
              titleStyle={{ color: theme.colors.onSurface }}
            />
            <Menu.Item
              onPress={handleSnooze3Hours}
              title="Snooze 3 hours"
              leadingIcon="clock-plus-outline"
              titleStyle={{ color: theme.colors.onSurface }}
            />
          </>
        )}
      </Menu>

      {/* Date Picker Modal */}
      <Portal>
        <Modal
          visible={showDatePicker}
          onDismiss={handleCancelDatePicker}
          contentContainerStyle={[
            styles.datePickerModal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            variant="titleMedium"
            style={[styles.datePickerTitle, { color: theme.colors.onSurface }]}
          >
            Select Date
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.datePickerHint, { color: theme.colors.onSurfaceVariant }]}
          >
            Enter date in YYYY-MM-DD or MM/DD/YYYY format
          </Text>
          <TextInput
            style={[
              styles.dateInput,
              {
                backgroundColor: theme.colors.surfaceVariant,
                color: theme.colors.onSurface,
                borderColor: dateError ? theme.colors.error : theme.colors.outline,
              },
            ]}
            value={dateInput}
            onChangeText={(text) => {
              setDateInput(text);
              setDateError('');
            }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            keyboardType="default"
            autoFocus
          />
          {dateError ? (
            <Text
              variant="bodySmall"
              style={[styles.errorText, { color: theme.colors.error }]}
            >
              {dateError}
            </Text>
          ) : null}
          <View style={styles.datePickerButtons}>
            <Button onPress={handleCancelDatePicker} textColor={theme.colors.onSurfaceVariant}>
              Cancel
            </Button>
            <Button onPress={handleConfirmDate} mode="contained">
              Confirm
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  menuContent: {
    borderRadius: 16,
    paddingVertical: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  menuTitle: {
    fontWeight: '600',
  },
  divider: {
    marginVertical: 4,
  },
  datePickerModal: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  datePickerTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  datePickerHint: {
    textAlign: 'center',
    marginBottom: 16,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
});

export default PostponeMenu;
