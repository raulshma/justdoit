import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { 
  Text, 
  useTheme, 
  Portal, 
  Modal, 
  Searchbar,
  Chip,
  IconButton,
  TouchableRipple,
} from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';
import { Goal } from '../types';

interface DependencyPickerProps {
  /** Currently selected dependency goal IDs */
  selectedIds: string[];
  /** Callback when dependencies change */
  onChange: (ids: string[]) => void;
  /** All available goals to choose from */
  availableGoals: Goal[];
  /** Current goal ID (to exclude from selection) */
  currentGoalId?: string;
  /** Whether the picker is disabled (read-only mode) */
  disabled?: boolean;
  /** Label text */
  label?: string;
}

/**
 * DependencyPicker - Component for selecting prerequisite goals
 */
export const DependencyPicker: React.FC<DependencyPickerProps> = ({
  selectedIds,
  onChange,
  availableGoals,
  currentGoalId,
  disabled = false,
  label = 'PREREQUISITES',
}) => {
  const theme = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter out current goal and already selected goals from available list
  const selectableGoals = useMemo(() => {
    return availableGoals.filter(goal => {
      // Exclude current goal
      if (goal.id === currentGoalId) return false;
      // Include in dropdown (even if already selected, for toggle behavior)
      return true;
    });
  }, [availableGoals, currentGoalId]);

  // Filter by search query
  const filteredGoals = useMemo(() => {
    if (!searchQuery.trim()) return selectableGoals;
    const query = searchQuery.toLowerCase();
    return selectableGoals.filter(goal => 
      goal.title.toLowerCase().includes(query)
    );
  }, [selectableGoals, searchQuery]);

  // Get selected goal objects
  const selectedGoals = useMemo(() => {
    return availableGoals.filter(goal => selectedIds.includes(goal.id));
  }, [availableGoals, selectedIds]);

  const handleToggleGoal = useCallback((goalId: string) => {
    if (selectedIds.includes(goalId)) {
      onChange(selectedIds.filter(id => id !== goalId));
    } else {
      onChange([...selectedIds, goalId]);
    }
  }, [selectedIds, onChange]);

  const handleRemove = useCallback((goalId: string) => {
    onChange(selectedIds.filter(id => id !== goalId));
  }, [selectedIds, onChange]);

  const handleOpenModal = useCallback(() => {
    if (!disabled) {
      setSearchQuery('');
      setShowModal(true);
    }
  }, [disabled]);

  // Read-only display
  if (disabled) {
    if (selectedGoals.length === 0) {
      return null; // Don't show section if empty in read-only mode
    }

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View style={styles.headerRow}>
          <ThemedIcon name="link-variant" size={24} themeColor="primary" />
          <View style={styles.headerText}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 2 }}>
              {label}
            </Text>
            <View style={styles.chipContainer}>
              {selectedGoals.map(goal => (
                <Chip
                  key={goal.id}
                  mode="flat"
                  compact
                  style={[styles.chip, { backgroundColor: theme.colors.secondaryContainer }]}
                  textStyle={{ color: theme.colors.onSecondaryContainer, fontSize: 12 }}
                >
                  {goal.isCompleted ? '✓ ' : ''}{goal.title.length > 25 ? goal.title.substring(0, 25) + '...' : goal.title}
                </Chip>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
      <Pressable
        onPress={handleOpenModal}
        style={[styles.container, styles.pressable, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <View style={styles.headerRow}>
          <ThemedIcon name="link-variant" size={24} themeColor="primary" />
          <View style={styles.headerText}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 2 }}>
              {label}
            </Text>
            {selectedGoals.length > 0 ? (
              <View style={styles.chipContainer}>
                {selectedGoals.slice(0, 3).map(goal => (
                  <Chip
                    key={goal.id}
                    mode="flat"
                    compact
                    onClose={() => handleRemove(goal.id)}
                    style={[styles.chip, { backgroundColor: theme.colors.secondaryContainer }]}
                    textStyle={{ color: theme.colors.onSecondaryContainer, fontSize: 12 }}
                    closeIcon="close-circle"
                  >
                    {goal.title.length > 20 ? goal.title.substring(0, 20) + '...' : goal.title}
                  </Chip>
                ))}
                {selectedGoals.length > 3 && (
                  <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                    +{selectedGoals.length - 3} more
                  </Text>
                )}
              </View>
            ) : (
              <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.outline }}>
                None selected
              </Text>
            )}
          </View>
          <ThemedIcon name="chevron-right" size={24} themeColor="onSurfaceVariant" />
        </View>
      </Pressable>

      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
              Select Prerequisites
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setShowModal(false)}
              iconColor={theme.colors.onSurfaceVariant}
            />
          </View>

          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
            Choose goals that must be completed before this one can start.
          </Text>

          <Searchbar
            placeholder="Search goals..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchbar, { backgroundColor: theme.colors.surfaceVariant }]}
            inputStyle={{ fontSize: 14 }}
          />

          <ScrollView style={styles.goalList} showsVerticalScrollIndicator={false}>
            {filteredGoals.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedIcon name="magnify" size={32} themeColor="outlineVariant" />
                <Text variant="bodyMedium" style={{ color: theme.colors.outline, marginTop: 8 }}>
                  {searchQuery ? 'No matching goals' : 'No goals available'}
                </Text>
              </View>
            ) : (
              filteredGoals.map(goal => {
                const isSelected = selectedIds.includes(goal.id);
                return (
                  <TouchableRipple
                    key={goal.id}
                    onPress={() => handleToggleGoal(goal.id)}
                    style={[
                      styles.goalItem,
                      {
                        backgroundColor: isSelected 
                          ? theme.colors.primaryContainer 
                          : theme.colors.surfaceVariant,
                        borderColor: isSelected 
                          ? theme.colors.primary 
                          : 'transparent',
                      }
                    ]}
                  >
                    <View style={styles.goalItemContent}>
                      <View style={styles.goalItemIcon}>
                        <ThemedIcon
                          name={isSelected ? 'checkbox-marked-circle' : (goal.isCompleted ? 'check-circle-outline' : 'circle-outline')}
                          size={24}
                          color={isSelected ? theme.colors.primary : (goal.isCompleted ? theme.colors.outline : theme.colors.onSurfaceVariant)}
                        />
                      </View>
                      <View style={styles.goalItemText}>
                        <Text 
                          variant="bodyLarge" 
                          style={{ 
                            color: goal.isCompleted ? theme.colors.outline : theme.colors.onSurface,
                            textDecorationLine: goal.isCompleted ? 'line-through' : 'none',
                          }}
                          numberOfLines={1}
                        >
                          {goal.title}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Due: {new Date(goal.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {goal.isCompleted && ' • Completed'}
                        </Text>
                      </View>
                    </View>
                  </TouchableRipple>
                );
              })
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {selectedIds.length} selected
            </Text>
          </View>
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  pressable: {
    borderRadius: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  chip: {
    height: 28,
  },
  modal: {
    margin: 16,
    borderRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchbar: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 0,
  },
  goalList: {
    maxHeight: 400,
  },
  goalItem: {
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
    borderWidth: 2,
  },
  goalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalItemIcon: {
    marginRight: 12,
  },
  goalItemText: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  modalFooter: {
    marginTop: 16,
    alignItems: 'center',
  },
});

export default DependencyPicker;
