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
  onLongPress?: (goalId: string) => void;
  onLongPressEnd?: (goalId: string) => void;
  scrollEnabled?: boolean;
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
    return "Today's Goals";
  }
  if (date.getTime() === tomorrow.getTime()) {
    return "Tomorrow's Goals";
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
      <View style={{ marginBottom: 16 }}>
        <ThemedIcon name="star-face" size={64} color={theme.colors.primary} />
      </View>
      <Text
        variant="headlineSmall"
        style={[styles.emptyTitle, { color: theme.colors.primary }]}
      >
        No goals yet!
      </Text>
      <Text
        variant="bodyLarge"
        style={[styles.emptyMessage, { color: theme.colors.onSurfaceVariant }]}
      >
        Start your journey by adding your first goal.{'\n'}
        Every big achievement starts with a single step!
      </Text>
    </View>
  );
};

/**
 * Section header component
 */
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
      <View style={styles.sectionHeaderContent}>
        {isToday && (
          <View style={[styles.indicatorDot, { backgroundColor: theme.colors.primary }]} />
        )}
        <Text
          variant={isToday ? "titleLarge" : "titleMedium"}
          style={[
            styles.sectionTitle,
            {
              color: isToday ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
              opacity: isToday ? 1 : 0.7,
              fontWeight: isToday ? '800' : '600',
              letterSpacing: isToday ? -0.5 : 0,
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
 * 
 * Requirements: 2.1, 9.1, 9.4
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
  onLongPress,
  onLongPressEnd,
  ListHeaderComponent,
  ListFooterComponent,
  refreshing,
  onRefresh,
  scrollEnabled = true,
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
      onLongPress={onLongPress}
      onLongPressEnd={onLongPressEnd}
      isToday={(section as GoalSection).isToday}
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
      stickySectionHeadersEnabled={true}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 24, // More breathing room
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  sectionTitle: {
    // Font weight handled in component
  },
  separator: {
    height: 8, // More space instead of line
    backgroundColor: 'transparent',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default GoalList;
