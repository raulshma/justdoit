import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { FAB, useTheme, Snackbar, Text, Portal } from 'react-native-paper';
import { useFocusEffect, useRouter, useSegments } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Goal } from '../types';
import { goalManager, carryForwardService } from '../services';
import {
  GoalList,
  ThemedIcon,
  GoalQuickView,
  ActionToast,
  VoiceGoalCreator,
} from '../components';
import { useSettings } from '../context/SettingsContext';

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
export function MinimalGoalsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const { settings, updateSettings } = useSettings();
  const insets = useSafeAreaInsets();
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // FAB state
  const [fabOpen, setFabOpen] = useState(false);
  const [showVoiceCreator, setShowVoiceCreator] = useState(false);

  // Only show the FAB on *top-level* routes within the (tabs) group.
  // Note: some router states omit the explicit 'index' segment, so we allow length 1 as well.
  const showNavbarFab = useMemo(() => {
    if (segments[0] !== '(tabs)') return false;
    return segments.length <= 2;
  }, [segments]);

  useEffect(() => {
    if (!showNavbarFab) {
      setFabOpen(false);
      setShowVoiceCreator(false);
    }
  }, [showNavbarFab]);
  
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

    // Show all incomplete goals, sorted by date then priority
    const incompleteGoals = allGoals.filter((goal) => !goal.isCompleted);
    
    // Sort by date first (oldest first = overdue at top), then by priority
    const sortedGoals = [...incompleteGoals].sort((a, b) => {
      const dateCompare = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (dateCompare !== 0) return dateCompare;
      // Same date, sort by priority
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Focus mode: show only top 3 priorities for today
    const focusModeGoals = settings.focusModeEnabled
      ? sortedGoals
          .filter((goal) => goal.dueDate === today)
          .sort((a, b) => {
            const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          })
          .slice(0, 3)
      : sortedGoals;
    
    setGoals(focusModeGoals);
  }, [settings.focusModeEnabled]);

  /**
   * Refresh goals on screen focus
   */
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const refresh = async () => {
        await carryForwardService.processCarryForward();
        if (!isActive) return;
        loadGoals();
      };

      refresh();

      return () => {
        isActive = false;
      };
    }, [loadGoals])
  );

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await carryForwardService.processCarryForward();
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
    router.push({ pathname: '/goal/[id]', params: { id: goalId, mode: 'view' } });
  }, [router]);

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
   * Handle move overdue goal to today
   */
  const handleMoveToToday = useCallback(async (goalId: string) => {
    try {
      const today = getTodayDate();
      await goalManager.updateGoal(goalId, { dueDate: today });
      loadGoals();
      setSnackbarMessage('Goal moved to today');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Failed to move goal:', error);
      setSnackbarMessage('Failed to move goal');
      setSnackbarVisible(true);
    }
  }, [loadGoals]);

  /**
   * Handle FAB press - navigate to add goal screen
   */
  const handleAddGoal = useCallback(() => {
    setFabOpen(false);
    router.push('/goal/new');
  }, [router]);

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
   * Switch back to full goals view - also updates setting
   */
  const handleSwitchToFullView = useCallback(async () => {
    // Turn off minimal view setting so it persists
    // Context update will trigger parent to re-render HomeScreen
    await updateSettings({ minimalGoalsView: false });
  }, [updateSettings]);

  /**
   * Handle template press
   */
  const handleOpenTemplates = useCallback(() => {
    setFabOpen(false);
    router.push('/templates');
  }, [router]);

  /**
   * Handle challenges press
   */
  const handleOpenChallenges = useCallback(() => {
    setFabOpen(false);
    router.push('/challenges');
  }, [router]);
  
  /**
   * Handle voice goal creation
   */
  const handleVoiceCreate = useCallback(async (goalData: any) => {
    try {
      await goalManager.createGoal(goalData);
      loadGoals();
      setSnackbarMessage('Goal created!');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Failed to create voice goal:', error);
      setSnackbarMessage('Failed to create goal');
      setSnackbarVisible(true);
    }
  }, [loadGoals]);

  // Count remaining goals
  const today = getTodayDate();
  const todayGoals = goals.filter(g => g.dueDate === today);
  const remaining = todayGoals.filter(g => !g.isCompleted).length;
  const tabBarHeight = settings.showTabBarLabels ? 80 : 64;
  const tabBarBottomPadding = insets.bottom + 12;
  const floatingBottom = tabBarHeight + tabBarBottomPadding + 16;
  const snackbarBottom = tabBarHeight + tabBarBottomPadding + 8;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Goal List with Minimal Header */}
      <GoalList
        itemVariant="minimal"
        goals={goals}
        onToggleComplete={handleToggleComplete}
        onGoalPress={handleGoalPress}
        onDeleteGoal={handleDeleteGoal}
        onSwipeDelete={handleSwipeDelete}
        onSwipeComplete={handleSwipeComplete}
        onLongPress={handleLongPress}
        onLongPressEnd={handleLongPressEnd}
        onMoveToToday={handleMoveToToday}
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

      {/* FAB Group for adding goals */}
      {showNavbarFab && (
        <Portal>
          <FAB.Group
            open={fabOpen}
            visible
            icon={fabOpen ? 'close' : 'plus'}
            actions={[
              ...(settings.gamificationEnabled
                ? [
                    {
                      icon: 'trophy-outline',
                      label: 'Challenges',
                      onPress: handleOpenChallenges,
                    },
                  ]
                : []),
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
              {
                icon: 'microphone-outline',
                label: 'Voice Goal',
                onPress: () => {
                  setFabOpen(false);
                  setShowVoiceCreator(true);
                },
              },
            ]}
            onStateChange={({ open }) => setFabOpen(open)}
            fabStyle={[styles.fab, { backgroundColor: theme.colors.primary }]}
            color={theme.colors.onPrimary}
            style={[styles.fabGroup, { bottom: floatingBottom }]}
          />
        </Portal>
      )}

      {/* Feedback Snackbar */}
      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={handleDismissSnackbar}
          duration={2000}
          style={[styles.snackbar, { marginBottom: snackbarBottom }]}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>

      {/* Quick View Overlay */}
      <GoalQuickView
        goal={quickViewGoal}
        visible={quickViewVisible}
        onDismiss={handleLongPressEnd}
      />
      
      <ActionToast
        visible={deleteToastVisible}
        actionType="delete"
        goalTitle={pendingDeleteGoal?.title || ''}
        onUndo={handleUndoDelete}
        onDismiss={handleDeleteToastDismiss}
      />

      <VoiceGoalCreator
        visible={showVoiceCreator}
        onDismiss={() => setShowVoiceCreator(false)}
        onGoalCreated={handleVoiceCreate}
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
    borderRadius: 20,
  },
  fabGroup: {
    position: 'absolute',
    right: 16,
    zIndex: 1100,
    elevation: 12,
  },
  snackbar: {
    zIndex: 1200,
    elevation: 12,
  },
});

export default MinimalGoalsScreen;
