import React, { useMemo } from 'react';
import { View, StyleSheet, SectionList, SectionListData } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { Goal } from '../types/goal';
import { GoalCard } from './GoalCard';
import { ThemedIcon } from './ThemedIcon';

interface GoalListProps {
  goals: Goal[];
  onToggleComplete: (goalId: string) => void;
  onGoalPress: (goalId: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onSwipeDelete?: (goalId: string) => void; // Swipe left-to-right to delete with undo
  onSwipeComplete?: (goalId: string) => void; // Swipe right-to-left to complete
  onLongPress?: (goalId: string) => void;
  onLongPressEnd?: (goalId: string) => void;
  onMoveToToday?: (goalId: string) => void;
  onReschedule?: (goalId: string) => void;
  scrollEnabled?: boolean;
  itemVariant?: 'default' | 'minimal';
}

import { getDateStatus, formatDateFriendly } from '../utils/dateUtils';
import type { DateStatus } from '../utils/dateUtils';

interface GoalSection {
  title: string;
  data: Goal[];
  isToday: boolean;
  dateStatus: DateStatus;
  rawDate: string;
}


/**
 * Group goals by their due date with status
 */
const groupGoalsByDate = (goals: Goal[]): GoalSection[] => {
  const grouped = new Map<string, Goal[]>();

  // Group goals by dueDate
  goals.forEach((goal) => {
    const existing = grouped.get(goal.dueDate) || [];
    grouped.set(goal.dueDate, [...existing, goal]);
  });

  // Convert to sections and sort by date
  const sections: GoalSection[] = Array.from(grouped.entries())
    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
    .map(([date, dateGoals]) => {
      const dateStatus = getDateStatus(date);
      return {
        title: formatDateFriendly(date),
        data: dateGoals,
        isToday: dateStatus === 'today',
        dateStatus,
        rawDate: date,
      };
    });

  return sections;
};

/**
 * Empty state component with encouraging message
 */
const EmptyState: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <Text
        variant="headlineSmall"
        style={[styles.emptyTitle, { color: theme.colors.outline }]}
      >
        No tasks.
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.emptyMessage, { color: theme.colors.outline, opacity: 0.7 }]}
      >
        Enjoy your day or add a new goal to get started.
      </Text>
    </View>
  );
};

/**
 * Modern Section Header with date status styling
 */
const SectionHeader: React.FC<{ title: string; isToday: boolean; dateStatus: DateStatus }> = ({
  title,
  isToday,
  dateStatus,
}) => {
  const theme = useTheme();

  const getStatusColor = () => {
    switch (dateStatus) {
      case 'overdue':
        return theme.colors.error;
      case 'today':
        return theme.colors.primary;
      case 'tomorrow':
        return theme.colors.secondary;
      default:
        return theme.colors.outline;
    }
  };

  const statusColor = getStatusColor();

  return (
    <View
      style={[
        styles.sectionHeader,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.sectionHeaderRow}>
        {dateStatus === 'overdue' && (
          <ThemedIcon name="alert-circle" size={14} color={statusColor} />
        )}
        <Text
          variant="labelLarge"
          style={[
            styles.sectionTitle,
            {
              color: statusColor,
              fontWeight: isToday || dateStatus === 'overdue' ? '700' : '600',
              marginLeft: dateStatus === 'overdue' ? 6 : 0,
            },
          ]}
        >
          {title.toUpperCase()}
        </Text>
      </View>
    </View>
  );
};

/**
 * GoalList component displays goals grouped by date with section headers.
 * Shows an encouraging empty state when no goals exist.
 */
export const GoalList: React.FC<GoalListProps & { 
  ListHeaderComponent?: React.ReactElement | null;
  ListFooterComponent?: React.ReactElement | null;
  refreshing?: boolean;
  onRefresh?: () => void;
}> = ({
  goals,
  onToggleComplete,
  onGoalPress,
  onDeleteGoal,
  onSwipeDelete,
  onSwipeComplete,
  onLongPress,
  onLongPressEnd,
  onMoveToToday,
  onReschedule,
  ListHeaderComponent,
  ListFooterComponent,
  refreshing,
  onRefresh,
  scrollEnabled = true,
  itemVariant = 'default',
}) => {
  const theme = useTheme();

  // Group goals by date
  const sections = useMemo(() => groupGoalsByDate(goals), [goals]);

  // Show empty state if no goals
  if (goals.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        {ListHeaderComponent}
        <EmptyState />
        {ListFooterComponent}
      </View>
    );
  }

  const renderItem = ({ item, section }: { item: Goal; section: SectionListData<Goal, GoalSection> }) => (
    <GoalCard
      goal={item}
      onToggleComplete={onToggleComplete}
      onPress={onGoalPress}
      onDelete={onDeleteGoal}
      onSwipeDelete={onSwipeDelete}
      onSwipeComplete={onSwipeComplete}
      onLongPress={onLongPress}
      onLongPressEnd={onLongPressEnd}
      isToday={(section as GoalSection).isToday}
      isOverdue={(section as GoalSection).dateStatus === 'overdue'}
      onMoveToToday={onMoveToToday}
      onReschedule={onReschedule}
      variant={itemVariant}
    />
  );

  const renderSectionHeader = ({ section }: { section: SectionListData<Goal, GoalSection> }) => (
    <SectionHeader
      title={(section as GoalSection).title}
      isToday={(section as GoalSection).isToday}
      dateStatus={(section as GoalSection).dateStatus}
    />
  );

  const keyExtractor = (item: Goal) => item.id;

  return (
    <SectionList
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={keyExtractor}
      style={[styles.list, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.listContent}
      stickySectionHeadersEnabled={false} // Cleaner scroll without sticky headers blocking content
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => itemVariant === 'minimal' ? null : <View style={styles.separator} />}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      refreshing={refreshing}
      onRefresh={onRefresh}
      scrollEnabled={scrollEnabled}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100, // Space for FAB
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    letterSpacing: 1.5,
    fontSize: 11,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    height: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 240,
  },
});

export default GoalList;
