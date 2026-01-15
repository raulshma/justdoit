import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Text, useTheme, FAB, Snackbar, Surface, Icon, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
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
 * High Fidelity "Avant-Garde" Design
 */
export const FocusModeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [goalSelectorVisible, setGoalSelectorVisible] = useState(false);
  const [linkedGoal, setLinkedGoal] = useState<{ id: string; title: string } | null>(null);
  const [showGoals, setShowGoals] = useState(true);

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
        {/* Header - Minimal and Clean */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
            <View>
              <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                Focus
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, letterSpacing: 0.5 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
            </View>
            <IconButton
              icon={linkedGoal ? 'link-variant' : 'link-variant-off'}
              mode="contained-tonal"
              iconColor={linkedGoal ? theme.colors.primary : theme.colors.onSurfaceVariant}
              containerColor={linkedGoal ? theme.colors.primaryContainer : theme.colors.surfaceVariant}
              size={24}
              onPress={() => setGoalSelectorVisible(true)}
            />
        </Animated.View>

        {/* Focus Timer - Centerpiece */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <FocusTimer
            linkedGoalId={linkedGoal?.id}
            linkedGoalTitle={linkedGoal?.title}
            onSessionComplete={handleSessionComplete}
          />
        </Animated.View>

        {/* Stats Section - Quick Dashboard */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.statsSection}>
          <FocusSessionStats goalId={linkedGoal?.id} />
        </Animated.View>

        {/* Today's Priorities Section */}
        <View style={styles.goalsSection}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700', letterSpacing: 0.5 }}>
              PRIORITIES
            </Text>
            <IconButton
              icon={showGoals ? 'chevron-up' : 'chevron-down'}
              size={20}
              onPress={() => setShowGoals(!showGoals)}
              style={{ margin: 0 }}
            />
          </View>

          {showGoals && (
            <Animated.View layout={Layout.springify()}>
              {allDone ? (
                <Surface style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
                  <Icon source="check-decagram" size={48} color={theme.colors.primary} />
                  <Text variant="titleMedium" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                    All Clear!
                  </Text>
                  <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    You've crushed your top priorities for today.
                  </Text>
                </Surface>
              ) : (
                <View style={styles.goalsList}>
                  {goals.map((goal, index) => (
                    <Animated.View 
                      key={goal.id} 
                      entering={FadeInDown.delay(400 + index * 100).duration(500)}
                      layout={Layout.springify()}
                      style={styles.goalWrapper}
                    >
                      <View style={[styles.rankBadge, { backgroundColor: theme.colors.secondaryContainer }]}>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSecondaryContainer, fontWeight: 'bold' }}>
                          {index + 1}
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
                        size={28}
                        style={styles.playButton}
                        onPress={() => handleStartFocusOnGoal(goal)}
                      />
                    </Animated.View>
                  ))}
                </View>
              )}
            </Animated.View>
          )}
        </View>

        {/* Quote Footer - Subtle */}
        <View style={styles.footer}>
          <Text variant="bodySmall" style={{ color: theme.colors.outline, textAlign: 'center', fontStyle: 'italic' }}>
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

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={{ marginBottom: 80 }} // Above FAB
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
    paddingHorizontal: 24,
    paddingBottom: 100,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statsSection: {
    marginBottom: 32,
  },
  goalsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  goalsList: {
    gap: 16,
  },
  goalWrapper: {
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    zIndex: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    borderWidth: 2,
    borderColor: 'white', // Should ideally match background
  },
  playButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.8)', // slight backdrop for contrast
    borderRadius: 20,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: 'rgba(120,120,120,0.2)',
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
    marginTop: 24,
    paddingHorizontal: 20,
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 28,
  },
});

export default FocusModeScreen;
