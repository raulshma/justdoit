import React, { useMemo } from 'react';
import { View, StyleSheet, SectionList, SectionListData } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { Goal } from '../types/goal';
import { GoalCard } from './GoalCard';

interface GoalListProps {
  goals: Goal[];
  onToggleComplete: (goalId: string) => void;
  onGoalPress: (goalId: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onSwipeDelete?: (goalId: string) => void; // Swipe left-to-right to delete with undo
  onSwipeComplete?: (goalId: string) => void; // Swipe right-to-left to complete
  onLongPress?: (goalId: string) => void;
  onLongPressEnd?: (goalId: string) => void;
  scrollEnabled?: boolean;
  itemVariant?: 'default' | 'minimal';
}

interface GoalSection {
  title: string;
  data: Goal[];
  isToday: boolean;
}

/**
 * Format date for section header display
 */
const formatDateHeader = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Reset time for comparison
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    return "Today";
  }
  if (date.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  }

  // Format as readable date
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Check if a date is today
 */
const isDateToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return date.getTime() === today.getTime();
};

/**
 * Group goals by their due date
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
    .map(([date, dateGoals]) => ({
      title: formatDateHeader(date),
      data: dateGoals,
      isToday: isDateToday(date),
    }));

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
 * Modern Section Header - Minimalist & Bold
 */
const SectionHeader: React.FC<{ title: string; isToday: boolean }> = ({
  title,
  isToday,
}) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.sectionHeader,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Text
        variant="labelLarge"
        style={[
          styles.sectionTitle,
          {
            color: isToday ? theme.colors.primary : theme.colors.outline,
            fontWeight: isToday ? '700' : '600',
          },
        ]}
      >
        {title.toUpperCase()}
      </Text>
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
      variant={itemVariant}
    />
  );

  const renderSectionHeader = ({ section }: { section: SectionListData<Goal, GoalSection> }) => (
    <SectionHeader
      title={(section as GoalSection).title}
      isToday={(section as GoalSection).isToday}
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
