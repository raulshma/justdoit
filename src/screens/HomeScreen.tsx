import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { FAB, useTheme, Snackbar, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { HomeScreenProps } from '../navigation/types';
import type { Goal } from '../types';
import { goalManager } from '../services';
import {
  GoalList,
  MotivationalBanner,
  CelebrationModal,
  GoalQuickView,
} from '../components';

/**
 * Gets today's date in ISO format (YYYY-MM-DD)
 */
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Gets tomorrow's date in ISO format (YYYY-MM-DD)
 */
const getTomorrowDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

/**
 * HomeScreen - Main screen displaying today's and tomorrow's goals
 * Shows motivational banner, goal list, and celebration modal
 * 
 * Requirements: 2.1, 6.1, 3.4, 9.4
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [todayCompletedCount, setTodayCompletedCount] = useState(0);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Quick View state
  const [quickViewGoal, setQuickViewGoal] = useState<Goal | null>(null);
  const [quickViewVisible, setQuickViewVisible] = useState(false);
  
  // FAB state
  const [fabOpen, setFabOpen] = useState(false);

  /**
   * Load goals from storage
   */
  const loadGoals = useCallback(() => {
    const allGoals = goalManager.getAllGoals();
    const today = getTodayDate();
    const tomorrow = getTomorrowDate();

    // Filter to show only today's and tomorrow's goals
    const relevantGoals = allGoals.filter(
      (goal) => goal.dueDate === today || goal.dueDate === tomorrow
    );

    // Sort goals by priority within each date group
    const sortedGoals = goalManager.sortGoalsByPriority(relevantGoals);
    setGoals(sortedGoals);

    // Check for all-complete celebration
    const todayGoals = allGoals.filter((goal) => goal.dueDate === today);
    const completedToday = todayGoals.filter((goal) => goal.isCompleted).length;
    setTodayCompletedCount(completedToday);
  }, []);

  /**
   * Refresh goals on screen focus
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
   * Handle goal completion toggle
   * Requirements: 2.5, 3.1, 3.4
   */
  const handleToggleComplete = useCallback(async (goalId: string) => {
    try {
      const updatedGoal = await goalManager.toggleComplete(goalId);
      loadGoals();

      // Check if all today's goals are now complete
      const today = getTodayDate();
      if (updatedGoal.isCompleted && goalManager.allGoalsCompleted(today)) {
        setShowCelebration(true);
      }

      // Show feedback
      setSnackbarMessage(
        updatedGoal.isCompleted ? 'Goal completed! 🎉' : 'Goal marked incomplete'
      );
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Failed to toggle goal completion:', error);
      setSnackbarMessage('Failed to update goal');
      setSnackbarVisible(true);
    }
  }, [loadGoals]);

  /**
   * Handle goal press - navigate to detail screen
   * Requirements: 2.2
   */
  const handleGoalPress = useCallback((goalId: string) => {
    navigation.navigate('GoalForm', { goalId, mode: 'view' });
  }, [navigation]);

  /**
   * Handle goal deletion
   * Requirements: 2.4
   */
  const handleDeleteGoal = useCallback(async (goalId: string) => {
    try {
      await goalManager.deleteGoal(goalId);
      loadGoals();
      setSnackbarMessage('Goal deleted');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Failed to delete goal:', error);
      setSnackbarMessage('Failed to delete goal');
      setSnackbarVisible(true);
    }
  }, [loadGoals]);

  /**
   * Handle FAB press - navigate to add goal screen
   */
  const handleAddGoal = useCallback(() => {
    setFabOpen(false);
    navigation.navigate('GoalForm', { mode: 'add' });
  }, [navigation]);

  /**
   * Handle template press - navigate to templates screen
   * Requirements: 3.1
   */
  const handleOpenTemplates = useCallback(() => {
    setFabOpen(false);
    navigation.navigate('Templates');
  }, [navigation]);

  /**
   * Dismiss celebration modal
   */
  const handleDismissCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);

  /**
   * Dismiss snackbar
   */
  const handleDismissSnackbar = useCallback(() => {
    setSnackbarVisible(false);
  }, []);

  /**
   * Handle long press - show quick view
   */
  const handleLongPress = useCallback((goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      setQuickViewGoal(goal);
      setQuickViewVisible(true);
    }
  }, [goals]);

  /**
   * Handle long press release - hide quick view
   */
  const handleLongPressEnd = useCallback(() => {
    setQuickViewVisible(false);
    // Delay clearing goal to allow exit animation
    setTimeout(() => setQuickViewGoal(null), 200);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Goal List with Header - Requirements: 2.1, 9.4 */}
      <GoalList
        goals={goals}
        onToggleComplete={handleToggleComplete}
        onGoalPress={handleGoalPress}
        onDeleteGoal={handleDeleteGoal}
        onLongPress={handleLongPress}
        onLongPressEnd={handleLongPressEnd}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <View>
            <View style={styles.headerContainer}>
              <Text variant="labelMedium" style={[styles.dateLabel, { color: theme.colors.primary }]}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
              </Text>
              <Text variant="displaySmall" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return 'Good Morning,';
                  if (hour < 18) return 'Good Afternoon,';
                  return 'Good Evening,';
                })()}
              </Text>
              <Text variant="headlineMedium" style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                {(() => {
                  const today = getTodayDate();
                  const todayGoals = goals.filter(g => g.dueDate === today);
                  const remaining = todayGoals.filter(g => !g.isCompleted).length;
                  
                  if (todayGoals.length === 0) return "Ready to start?";
                  if (remaining === 0) return "All done for today! 🎉";
                  return `You have ${remaining} goals left.`;
                })()}
              </Text>
            </View>
            <MotivationalBanner />
          </View>
        }
        scrollEnabled={!quickViewVisible}
      />

      {/* FAB Group for adding goals - Requirements: 3.1 */}
      <FAB.Group
        open={fabOpen}
        visible
        icon={fabOpen ? 'close' : 'plus'}
        actions={[
          {
            icon: 'file-document-outline',
            label: 'From Template',
            onPress: handleOpenTemplates,
          },
          {
            icon: 'pencil-outline',
            label: 'New Goal',
            onPress: handleAddGoal,
          },
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
        fabStyle={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
      />

      {/* Celebration Modal - Requirements: 3.4, 6.2, 6.3 */}
      <CelebrationModal
        visible={showCelebration}
        onDismiss={handleDismissCelebration}
        completedCount={todayCompletedCount}
      />

      {/* Feedback Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={handleDismissSnackbar}
        duration={2000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>

      {/* Quick View Overlay */}
      <GoalQuickView
        goal={quickViewGoal}
        visible={quickViewVisible}
        onDismiss={handleLongPressEnd}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20, // Increased padding
    marginTop: 24, // More top margin
    marginBottom: 16,
  },
  dateLabel: {
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 8,
    opacity: 0.9,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontWeight: '400',
    opacity: 0.8,
    fontSize: 24, // Larger subtitle
    lineHeight: 32,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
  snackbar: {
    marginBottom: 80, // Above FAB
  },
});

export default HomeScreen;
