import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme, FAB, Snackbar, Surface, Icon } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Goal } from '../types';
import { goalManager } from '../services';
import { GoalCard } from '../components';

/**
 * Gets today's date in ISO format (YYYY-MM-DD)
 */
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * FocusModeScreen - Shows only the top 3 most important goals for today
 * Clean, distraction-free view to help users focus on what matters most
 */
export const FocusModeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  /**
   * Load and filter top 3 priority goals for today
   */
  const loadGoals = useCallback(() => {
    const allGoals = goalManager.getAllGoals();
    const today = getTodayDate();

    // Filter to today's incomplete goals only
    const todayGoals = allGoals.filter(
      (goal) => goal.dueDate === today && !goal.isCompleted
    );

    // Sort by priority (high > medium > low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sorted = [...todayGoals].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    // Take top 3
    setGoals(sorted.slice(0, 3));
  }, []);

  /**
   * Refresh on screen focus
   */
  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [loadGoals])
  );

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    loadGoals();
    setRefreshing(false);
  }, [loadGoals]);

  /**
   * Handle goal completion
   */
  const handleToggleComplete = useCallback(async (goalId: string) => {
    try {
      const updatedGoal = await goalManager.toggleComplete(goalId);
      loadGoals();
      setSnackbarMessage(
        updatedGoal.isCompleted ? 'Goal completed!' : 'Goal marked incomplete'
      );
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Failed to toggle goal:', error);
      setSnackbarMessage('Failed to update goal');
      setSnackbarVisible(true);
    }
  }, [loadGoals]);

  /**
   * Handle goal press
   */
  const handleGoalPress = useCallback((goalId: string) => {
    navigation.navigate('GoalForm', { goalId, mode: 'view' });
  }, [navigation]);

  /**
   * Handle goal delete
   */
  const handleDeleteGoal = useCallback(async (goalId: string) => {
    try {
      await goalManager.deleteGoal(goalId);
      loadGoals();
      setSnackbarMessage('Goal deleted');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  }, [loadGoals]);

  const allDone = goals.length === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="labelMedium" style={[styles.badge, { color: theme.colors.primary }]}>
            FOCUS MODE
          </Text>
          <Text variant="displaySmall" style={[styles.title, { color: theme.colors.onSurface }]}>
            Your Top Priorities
          </Text>
          <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            {allDone 
              ? "All done! You've conquered your priorities."
              : `${goals.length} goal${goals.length !== 1 ? 's' : ''} to focus on`
            }
          </Text>
        </View>

        {/* Goals or Empty State */}
        {allDone ? (
          <Surface style={[styles.emptyCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
            <Icon source="check-decagram" size={64} color={theme.colors.primary} />
            <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.onPrimaryContainer }]}>
              Fantastic Work!
            </Text>
            <Text variant="bodyLarge" style={[styles.emptySubtitle, { color: theme.colors.onPrimaryContainer }]}>
              You've completed all your priority goals for today. 
              Take a well-deserved break or add new goals.
            </Text>
          </Surface>
        ) : (
          <View style={styles.goalsList}>
            {goals.map((goal, index) => (
              <View key={goal.id} style={styles.goalWrapper}>
                <View style={[styles.priorityBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                    #{index + 1}
                  </Text>
                </View>
                <GoalCard
                  goal={goal}
                  onToggleComplete={handleToggleComplete}
                  onPress={handleGoalPress}
                  onDelete={handleDeleteGoal}
                />
              </View>
            ))}
          </View>
        )}

        {/* Motivational footer */}
        <View style={styles.footer}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', opacity: 0.7 }}>
            "Focus is the art of knowing what to ignore."
          </Text>
        </View>
      </ScrollView>

      {/* Add Goal FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => navigation.navigate('GoalForm', { mode: 'add' })}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    marginTop: 24,
    marginBottom: 32,
  },
  badge: {
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 8,
    opacity: 0.9,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.8,
  },
  goalsList: {
    gap: 20,
  },
  goalWrapper: {
    position: 'relative',
  },
  priorityBadge: {
    position: 'absolute',
    top: -8,
    left: 12,
    zIndex: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
  },
  footer: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
});

export default FocusModeScreen;
