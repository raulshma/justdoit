import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { FAB, useTheme, Snackbar, Text } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import type { Goal } from '../types';
import { goalManager } from '../services';
import {
  GoalList,
  ThemedIcon,
  GoalQuickView,
  ActionToast,
} from '../components';

type MinimalGoalsScreenProps = NativeStackScreenProps<HomeStackParamList, 'MinimalGoals'>;

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
 * MinimalGoalsScreen - Ultra-minimal goals view
 * Pure focus on goals, no gamification, no calendar, no extra elements
 */
export const MinimalGoalsScreen: React.FC<MinimalGoalsScreenProps> = ({ navigation: stackNavigation }) => {
  const theme = useTheme();
  const rootNavigation = useNavigation();
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Quick View state
  const [quickViewGoal, setQuickViewGoal] = useState<Goal | null>(null);
  const [quickViewVisible, setQuickViewVisible] = useState(false);
  
  // Pending delete state for undo functionality
  const [pendingDeleteGoal, setPendingDeleteGoal] = useState<Goal | null>(null);
  const [deleteToastVisible, setDeleteToastVisible] = useState(false);

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
      console.error('Failed to toggle goal completion:', error);
      setSnackbarMessage('Failed to update goal');
      setSnackbarVisible(true);
    }
  }, [loadGoals]);

  /**
   * Handle goal press - navigate to detail screen
   */
  const handleGoalPress = useCallback((goalId: string) => {
    rootNavigation.navigate('GoalForm', { goalId, mode: 'view' });
  }, [rootNavigation]);

  /**
   * Handle goal deletion (immediate, no undo)
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
   * Handle swipe-to-delete
   */
  const handleSwipeDelete = useCallback((goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      setPendingDeleteGoal(goal);
      setGoals(prev => prev.filter(g => g.id !== goalId));
      setDeleteToastVisible(true);
    }
  }, [goals]);

  /**
   * Handle undo of swipe-to-delete
   */
  const handleUndoDelete = useCallback(() => {
    if (pendingDeleteGoal) {
      loadGoals();
      setPendingDeleteGoal(null);
    }
  }, [pendingDeleteGoal, loadGoals]);

  /**
   * Handle dismiss of delete toast
   */
  const handleDeleteToastDismiss = useCallback(async () => {
    setDeleteToastVisible(false);
    if (pendingDeleteGoal) {
      try {
        await goalManager.deleteGoal(pendingDeleteGoal.id);
      } catch (error) {
        console.error('Failed to delete goal:', error);
        loadGoals();
      }
      setPendingDeleteGoal(null);
    }
  }, [pendingDeleteGoal, loadGoals]);

  /**
   * Handle swipe-to-complete
   */
  const handleSwipeComplete = useCallback(async (goalId: string) => {
    try {
      await goalManager.toggleComplete(goalId);
      loadGoals();
    } catch (error) {
      console.error('Failed to complete goal:', error);
      setSnackbarMessage('Failed to complete goal');
      setSnackbarVisible(true);
    }
  }, [loadGoals]);

  /**
   * Handle FAB press - navigate to add goal screen
   */
  const handleAddGoal = useCallback(() => {
    rootNavigation.navigate('GoalForm', { mode: 'add' });
  }, [rootNavigation]);

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
    setTimeout(() => setQuickViewGoal(null), 200);
  }, []);

  /**
   * Switch back to full goals view
   */
  const handleSwitchToFullView = useCallback(() => {
    stackNavigation.replace('Home', { ignoreMinimalRedirect: true });
  }, [stackNavigation]);

  // Count remaining goals
  const today = getTodayDate();
  const todayGoals = goals.filter(g => g.dueDate === today);
  const remaining = todayGoals.filter(g => !g.isCompleted).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Goal List with Minimal Header */}
      <GoalList
        goals={goals}
        onToggleComplete={handleToggleComplete}
        onGoalPress={handleGoalPress}
        onDeleteGoal={handleDeleteGoal}
        onSwipeDelete={handleSwipeDelete}
        onSwipeComplete={handleSwipeComplete}
        onLongPress={handleLongPress}
        onLongPressEnd={handleLongPressEnd}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <View style={styles.topBar}>
              <View style={styles.leftHeader}>
                <Text variant="displaySmall" style={[styles.remainingCount, { color: theme.colors.onSurface }]}>
                  {remaining}
                </Text>
                <Text variant="bodyLarge" style={[styles.remainingLabel, { color: theme.colors.onSurfaceVariant }]}>
                  {remaining === 1 ? 'task left' : 'tasks left'}
                </Text>
              </View>
              
              {/* Switch to Full View Button */}
              <TouchableOpacity
                onPress={handleSwitchToFullView}
                style={[styles.switchButton, { backgroundColor: theme.colors.surfaceVariant }]}
                activeOpacity={0.7}
              >
                <ThemedIcon 
                  name="view-dashboard" 
                  size={20} 
                  color={theme.colors.onSurfaceVariant} 
                />
              </TouchableOpacity>
            </View>
          </View>
        }
        ListFooterComponent={<View style={{ marginBottom: 100 }} />}
        scrollEnabled={!quickViewVisible}
      />

      {/* Simple FAB */}
      <FAB
        icon="plus"
        onPress={handleAddGoal}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
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
      
      {/* Delete Undo Toast */}
      <ActionToast
        visible={deleteToastVisible}
        actionType="delete"
        goalTitle={pendingDeleteGoal?.title || ''}
        onUndo={handleUndoDelete}
        onDismiss={handleDeleteToastDismiss}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  remainingCount: {
    fontWeight: '800',
    letterSpacing: -1,
    fontSize: 48,
  },
  remainingLabel: {
    fontWeight: '400',
    opacity: 0.7,
  },
  switchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    borderRadius: 20,
  },
  snackbar: {
    marginBottom: 80,
  },
});

export default MinimalGoalsScreen;
