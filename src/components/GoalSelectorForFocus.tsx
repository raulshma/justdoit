import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, useTheme, Modal, Portal, Surface, IconButton, Searchbar } from 'react-native-paper';
import { goalManager } from '../services';
import type { Goal } from '../types';

interface GoalSelectorForFocusProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (goalId: string, goalTitle: string) => void;
  onSelectNone: () => void;
}

/**
 * Gets today's date in ISO format (YYYY-MM-DD)
 */
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * GoalSelectorForFocus Component
 * Modal for selecting a goal to link with focus session
 */
export const GoalSelectorForFocus: React.FC<GoalSelectorForFocusProps> = ({
  visible,
  onDismiss,
  onSelect,
  onSelectNone,
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Get today's incomplete goals
  const todayGoals = useMemo(() => {
    const allGoals = goalManager.getAllGoals();
    const today = getTodayDate();
    return allGoals
      .filter((goal) => goal.dueDate === today && !goal.isCompleted)
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }, [visible]);

  // Filter goals by search query
  const filteredGoals = useMemo(() => {
    if (!searchQuery.trim()) {
      return todayGoals;
    }
    const query = searchQuery.toLowerCase();
    return todayGoals.filter((goal) =>
      goal.title.toLowerCase().includes(query)
    );
  }, [todayGoals, searchQuery]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.tertiary;
      case 'low':
        return theme.colors.secondary;
      default:
        return theme.colors.outline;
    }
  };

  const renderGoalItem = ({ item }: { item: Goal }) => (
    <TouchableOpacity
      style={[styles.goalItem, { borderColor: theme.colors.outlineVariant }]}
      onPress={() => onSelect(item.id, item.title)}
      activeOpacity={0.7}
    >
      <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item.priority) }]} />
      <View style={styles.goalContent}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }} numberOfLines={2}>
          {item.title}
        </Text>
        {item.focusSessionsCompleted && item.focusSessionsCompleted > 0 && (
          <View style={styles.statsRow}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {item.focusSessionsCompleted} sessions • {item.totalFocusMinutes ?? 0} min
            </Text>
          </View>
        )}
      </View>
      <IconButton icon="timer-outline" size={20} iconColor={theme.colors.primary} />
    </TouchableOpacity>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
            Focus on a Goal
          </Text>
          <IconButton icon="close" size={24} onPress={onDismiss} />
        </View>

        <Searchbar
          placeholder="Search goals..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
          inputStyle={{ fontSize: 14 }}
        />

        <View style={styles.content}>
          {/* No Goal Option */}
          <TouchableOpacity
            style={[styles.noGoalButton, { backgroundColor: theme.colors.surfaceVariant }]}
            onPress={onSelectNone}
            activeOpacity={0.7}
          >
            <IconButton icon="timer-sand" size={24} iconColor={theme.colors.primary} />
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
              Focus without a goal
            </Text>
          </TouchableOpacity>

          {/* Goals List */}
          {filteredGoals.length > 0 ? (
            <FlatList
              data={filteredGoals}
              keyExtractor={(item) => item.id}
              renderItem={renderGoalItem}
              showsVerticalScrollIndicator={false}
              style={styles.list}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                {searchQuery ? 'No goals match your search' : "No incomplete goals for today"}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    borderRadius: 24,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 0,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    maxHeight: 400,
  },
  noGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingLeft: 8,
    borderRadius: 16,
    marginBottom: 16,
  },
  list: {
    maxHeight: 300,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  priorityIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  goalContent: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
});

export default GoalSelectorForFocus;
