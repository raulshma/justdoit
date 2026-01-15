import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme, FAB, Snackbar, Surface, Icon, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Goal, FocusSession } from '../types';
import { goalManager, focusTimerService } from '../services';
import {
  GoalCard,
  FocusTimer,
  GoalSelectorForFocus,
  FocusSessionStats,
} from '../components';

/**
 * Gets today's date in ISO format (YYYY-MM-DD)
 */
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * FocusModeScreen - Focus timer with goal integration
 * Enhanced Pomodoro-style focus sessions linked to daily goals
 */
export const FocusModeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [goalSelectorVisible, setGoalSelectorVisible] = useState(false);
  const [linkedGoal, setLinkedGoal] = useState<{ id: string; title: string } | null>(null);
  const [showGoals, setShowGoals] = useState(false);

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
        updatedGoal.isCompleted ? 'Goal completed! 🎉' : 'Goal marked incomplete'
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

  /**
   * Handle linking a goal to focus session
   */
  const handleLinkGoal = useCallback((goalId: string, goalTitle: string) => {
    setLinkedGoal({ id: goalId, title: goalTitle });
    focusTimerService.linkToGoal(goalId);
    setGoalSelectorVisible(false);
    setSnackbarMessage(`Linked: ${goalTitle}`);
    setSnackbarVisible(true);
  }, []);

  /**
   * Handle starting focus without goal
   */
  const handleFocusWithoutGoal = useCallback(() => {
    setLinkedGoal(null);
    focusTimerService.unlinkGoal();
    setGoalSelectorVisible(false);
  }, []);

  /**
   * Handle session completion
   */
  const handleSessionComplete = useCallback((session: FocusSession) => {
    if (session.type === 'work') {
      setSnackbarMessage(`Focus session complete! +25 XP 🧠`);
      loadGoals(); // Refresh to show updated focus stats
    } else {
      setSnackbarMessage('Break time is over!');
    }
    setSnackbarVisible(true);
  }, [loadGoals]);

  /**
   * Start focus on a specific goal
   */
  const handleStartFocusOnGoal = useCallback((goal: Goal) => {
    setLinkedGoal({ id: goal.id, title: goal.title });
    focusTimerService.linkToGoal(goal.id);
    focusTimerService.startSession(goal.id);
    setSnackbarMessage(`Focus started: ${goal.title}`);
    setSnackbarVisible(true);
  }, []);

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
          <View style={styles.headerRow}>
            <Text variant="labelMedium" style={[styles.badge, { color: theme.colors.primary }]}>
              FOCUS MODE
            </Text>
            <IconButton
              icon={linkedGoal ? 'link' : 'link-off'}
              iconColor={linkedGoal ? theme.colors.primary : theme.colors.onSurfaceVariant}
              size={20}
              onPress={() => setGoalSelectorVisible(true)}
            />
          </View>
          <Text variant="displaySmall" style={[styles.title, { color: theme.colors.onSurface }]}>
            Deep Work
          </Text>
          {linkedGoal && (
            <Text 
              variant="bodyLarge" 
              style={[styles.subtitle, { color: theme.colors.primary }]}
              numberOfLines={1}
            >
              Working on: {linkedGoal.title}
            </Text>
          )}
        </View>

        {/* Focus Timer */}
        <FocusTimer
          linkedGoalId={linkedGoal?.id}
          linkedGoalTitle={linkedGoal?.title}
          onSessionComplete={handleSessionComplete}
        />

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <FocusSessionStats goalId={linkedGoal?.id} />
        </View>

        {/* Toggle Goals Section */}
        <View style={styles.goalsSection}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
              Today's Priorities
            </Text>
            <IconButton
              icon={showGoals ? 'chevron-up' : 'chevron-down'}
              size={20}
              onPress={() => setShowGoals(!showGoals)}
            />
          </View>

          {showGoals && (
            <>
              {allDone ? (
                <Surface style={[styles.emptyCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
                  <Icon source="check-decagram" size={48} color={theme.colors.primary} />
                  <Text variant="titleMedium" style={[styles.emptyTitle, { color: theme.colors.onPrimaryContainer }]}>
                    All Done!
                  </Text>
                  <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: theme.colors.onPrimaryContainer }]}>
                    You've completed all priority goals for today.
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
                      <IconButton
                        icon="play-circle"
                        iconColor={theme.colors.primary}
                        size={24}
                        style={styles.playButton}
                        onPress={() => handleStartFocusOnGoal(goal)}
                      />
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* Motivational footer */}
        <View style={styles.footer}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', opacity: 0.7 }}>
            "Focus is the art of knowing what to ignore."
          </Text>
        </View>
      </ScrollView>

      {/* Goal Selector Modal */}
      <GoalSelectorForFocus
        visible={goalSelectorVisible}
        onDismiss={() => setGoalSelectorVisible(false)}
        onSelect={handleLinkGoal}
        onSelectNone={handleFocusWithoutGoal}
      />

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
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    letterSpacing: 2,
    fontWeight: '700',
    opacity: 0.9,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    fontWeight: '500',
  },
  statsSection: {
    marginTop: 20,
  },
  goalsSection: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  playButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    opacity: 0.8,
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
