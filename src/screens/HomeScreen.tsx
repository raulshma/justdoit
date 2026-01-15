import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { FAB, useTheme, Snackbar, Text, Surface } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { HomeScreenProps } from '../navigation/types';
import type { Goal, Challenge, CalendarEvent } from '../types';
import { goalManager, calendarService } from '../services';
import { useCategories } from '../context/CategoryContext';
import { useGamification } from '../context/GamificationContext';
import { useStatistics } from '../context/StatisticsContext';
import { useSettings } from '../context/SettingsContext';
import {
  GoalList,
  MotivationalBanner,
  CelebrationModal,
  GoalQuickView,
  CategoryFilter,
  XPDisplay,
  LevelProgress,
  ThemedIcon,
  CalendarEventCard,
  WeeklyChallengesWidget,
  ChallengeQuickView,
  ActionToast,
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
 * Includes category filter, XP/level display, challenges preview, and streak indicator
 * 
 * Requirements: 1.4, 2.1, 6.1, 6.6, 7.3, 3.4, 9.4
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { categories } = useCategories();
  const { settings } = useSettings();
  const { 
    getTotalXP, 
    getCurrentLevel, 
    getLevelProgress, 
    getActiveChallenges,
    getStreakMultiplier,
  } = useGamification();
  const { statistics, calculateStreak } = useStatistics();
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<Goal[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [todayCompletedCount, setTodayCompletedCount] = useState(0);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Quick View state
  const [quickViewGoal, setQuickViewGoal] = useState<Goal | null>(null);
  const [quickViewVisible, setQuickViewVisible] = useState(false);
  
  // Challenge Quick View state
  const [quickViewChallenge, setQuickViewChallenge] = useState<Challenge | null>(null);
  const [challengeQuickViewVisible, setChallengeQuickViewVisible] = useState(false);
  
  // FAB state
  const [fabOpen, setFabOpen] = useState(false);
  
  // Gamification state
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  
  // Calendar state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  
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

    // Check for all-complete celebration
    const todayGoals = allGoals.filter((goal) => goal.dueDate === today);
    const completedToday = todayGoals.filter((goal) => goal.isCompleted).length;
    setTodayCompletedCount(completedToday);
    
    // Load gamification data
    setActiveChallenges(getActiveChallenges());
    setCurrentStreak(calculateStreak());
  }, [getActiveChallenges, calculateStreak]);

  /**
   * Load calendar events for today
   */
  const loadCalendarEvents = useCallback(async () => {
    if (!settings.calendarIntegrationEnabled) {
      setCalendarEvents([]);
      return;
    }
    
    try {
      const today = getTodayDate();
      const events = await calendarService.getEventsForDate(today);
      // Sort events by start time
      const sortedEvents = events.sort((a, b) => 
        a.startDate.getTime() - b.startDate.getTime()
      );
      setCalendarEvents(sortedEvents);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
      setCalendarEvents([]);
    }
  }, [settings.calendarIntegrationEnabled]);
  
  /**
   * Filter goals by selected category
   * Requirements: 1.4
   */
  useEffect(() => {
    if (selectedCategoryId === null) {
      setFilteredGoals(goals);
    } else {
      setFilteredGoals(goals.filter(goal => goal.categoryId === selectedCategoryId));
    }
  }, [goals, selectedCategoryId]);
  
  /**
   * Handle category filter selection
   * Requirements: 1.4
   */
  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  }, []);

  /**
   * Refresh goals on screen focus
   */
  useFocusEffect(
    useCallback(() => {
      loadGoals();
      loadCalendarEvents();
    }, [loadGoals, loadCalendarEvents])
  );

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    loadGoals();
    await loadCalendarEvents();
    setRefreshing(false);
  }, [loadGoals, loadCalendarEvents]);

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
   * Handle goal deletion (immediate, no undo)
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
   * Handle swipe-to-delete (left-to-right swipe)
   * Shows undo toast for 6 seconds before permanently deleting
   */
  const handleSwipeDelete = useCallback((goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      // Store the goal for potential undo
      setPendingDeleteGoal(goal);
      // Optimistically remove from UI
      setGoals(prev => prev.filter(g => g.id !== goalId));
      setFilteredGoals(prev => prev.filter(g => g.id !== goalId));
      // Show undo toast
      setDeleteToastVisible(true);
    }
  }, [goals]);

  /**
   * Handle undo of swipe-to-delete
   * Restores the goal to the list
   */
  const handleUndoDelete = useCallback(() => {
    if (pendingDeleteGoal) {
      // Restore the goal to the list
      loadGoals();
      setPendingDeleteGoal(null);
    }
  }, [pendingDeleteGoal, loadGoals]);

  /**
   * Handle dismiss of delete toast (confirms deletion)
   * Actually deletes the goal from storage
   */
  const handleDeleteToastDismiss = useCallback(async () => {
    setDeleteToastVisible(false);
    if (pendingDeleteGoal) {
      try {
        await goalManager.deleteGoal(pendingDeleteGoal.id);
      } catch (error) {
        console.error('Failed to delete goal:', error);
        // Restore on error
        loadGoals();
      }
      setPendingDeleteGoal(null);
    }
  }, [pendingDeleteGoal, loadGoals]);

  /**
   * Handle swipe-to-complete (right-to-left swipe)
   * Immediately toggles completion status
   */
  const handleSwipeComplete = useCallback(async (goalId: string) => {
    try {
      const updatedGoal = await goalManager.toggleComplete(goalId);
      loadGoals();

      // Check if all today's goals are now complete
      const today = getTodayDate();
      if (updatedGoal.isCompleted && goalManager.allGoalsCompleted(today)) {
        setShowCelebration(true);
      }
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
   * Handle challenges press - navigate to challenges screen
   * Requirements: 7.3
   */
  const handleOpenChallenges = useCallback(() => {
    setFabOpen(false);
    navigation.navigate('Challenges');
  }, [navigation]);
  
  /**
   * Handle achievements press - navigate to achievements screen
   * Requirements: 5.2
   */
  const handleOpenAchievements = useCallback(() => {
    navigation.navigate('Achievements');
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

  /**
   * Handle challenge long press
   */
  const handleChallengeLongPress = useCallback((challenge: Challenge) => {
    setQuickViewChallenge(challenge);
    setChallengeQuickViewVisible(true);
  }, []);

  const handleChallengeLongPressEnd = useCallback(() => {
    setChallengeQuickViewVisible(false);
    setTimeout(() => setQuickViewChallenge(null), 200);
  }, []);

  /**
   * Get streak multiplier text
   */
  const getStreakMultiplierText = useCallback(() => {
    const multiplier = getStreakMultiplier(currentStreak);
    if (multiplier > 1) {
      return `${multiplier}x XP`;
    }
    return null;
  }, [currentStreak, getStreakMultiplier]);

  // Get gamification data
  const totalXP = getTotalXP();
  const currentLevel = getCurrentLevel();
  const levelProgress = getLevelProgress();
  const streakMultiplierText = getStreakMultiplierText();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Goal List with Header - Requirements: 1.4, 2.1, 6.6, 7.3, 9.4 */}
      <GoalList
        goals={filteredGoals}
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
          <View>
            {/* Header Section - Minimalist & Bold */}
            <View style={styles.headerContainer}>
              <View style={styles.topBar}>
                <Text variant="labelLarge" style={[styles.dateLabel, { color: theme.colors.primary }]}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' }).toUpperCase()}
                </Text>
                
                {/* XP Display - Compact */}
                {settings.gamificationEnabled && (
                  <TouchableOpacity onPress={handleOpenAchievements} activeOpacity={0.7}>
                    <XPDisplay totalXP={totalXP} currentLevel={currentLevel} compact />
                  </TouchableOpacity>
                )}
              </View>

              <Text variant="displayMedium" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return 'Good Morning.';
                  if (hour < 18) return 'Good Afternoon.';
                  return 'Good Evening.';
                })()}
              </Text>
              
              <Text variant="headlineSmall" style={[styles.headerSubtitle, { color: theme.colors.outline }]}>
                {(() => {
                  const today = getTodayDate();
                  const todayGoals = filteredGoals.filter(g => g.dueDate === today);
                  const remaining = todayGoals.filter(g => !g.isCompleted).length;
                  
                  if (todayGoals.length === 0) return "No tasks scheduled.";
                  if (remaining === 0) return "All clear.";
                  return `${remaining} remaining.`;
                })()}
              </Text>

              {/* Minimal Streak Display */}
              {settings.gamificationEnabled && currentStreak > 0 && (
                <View style={styles.streakContainer}>
                  <ThemedIcon name="fire" size={20} color={theme.colors.error} />
                  <Text variant="titleMedium" style={[styles.streakText, { color: theme.colors.onSurface }]}>
                    {currentStreak} day streak
                  </Text>
                  {streakMultiplierText && (
                    <View style={[styles.multiplierBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                      <Text variant="labelSmall" style={[styles.multiplierText, { color: theme.colors.primary }]}>
                        {streakMultiplierText}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Level Progress (Subtle) */}
              {settings.gamificationEnabled && (
                <View style={styles.levelProgressContainer}>
                  <LevelProgress
                    currentLevel={currentLevel}
                    currentXP={levelProgress.current}
                    requiredXP={levelProgress.required}
                    percentage={levelProgress.percentage}
                    compact
                  />
                </View>
              )}
            </View>
            
            {/* Calendar Events Section */}
            {settings.calendarIntegrationEnabled && calendarEvents.length > 0 && (
              <View style={styles.calendarSection}>
                <View style={styles.calendarHeader}>
                  <Text variant="labelLarge" style={[styles.calendarTitle, { color: theme.colors.onSurface }]}>
                    SCHEDULE
                  </Text>
                </View>
                {calendarEvents.slice(0, 3).map((event) => (
                  <CalendarEventCard key={event.id} event={event} />
                ))}
              </View>
            )}
            
            {/* Category Filter Chips */}
            <CategoryFilter
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleCategorySelect}
              showAllOption
            />
            
            <MotivationalBanner />
          </View>
        }
        ListFooterComponent={
          /* Active Challenges - Moved to Bottom (only when gamification enabled) */
          settings.gamificationEnabled ? (
            <View style={{ marginTop: 24, marginBottom: 80 }}>
              <WeeklyChallengesWidget 
              challenges={activeChallenges}
              onPress={handleOpenChallenges}
              onLongPress={handleChallengeLongPress}
              onLongPressEnd={handleChallengeLongPressEnd}
            />
          </View>
          ) : <View style={{ marginBottom: 80 }} />
        }
        scrollEnabled={!quickViewVisible && !challengeQuickViewVisible}
      />

      {/* FAB Group for adding goals - Requirements: 3.1, 7.3 */}
      <FAB.Group
        open={fabOpen}
        visible
        icon={fabOpen ? 'close' : 'plus'}
        actions={[
          ...(settings.gamificationEnabled ? [{
            icon: 'trophy-outline',
            label: 'Challenges',
            onPress: handleOpenChallenges,
          }] : []),
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
      
      <ChallengeQuickView
        challenge={quickViewChallenge}
        visible={challengeQuickViewVisible}
        onDismiss={handleChallengeLongPressEnd}
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
    marginTop: 16,
    marginBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateLabel: {
    letterSpacing: 2,
    fontWeight: '700',
    fontSize: 10,
    opacity: 0.8,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -1.5,
    marginBottom: 4,
    fontSize: 32,
    lineHeight: 40,
  },
  headerSubtitle: {
    fontWeight: '400',
    opacity: 0.6,
    fontSize: 16,
  },
  levelProgressContainer: {
    marginTop: 24,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  streakText: {
    fontWeight: '600',
    fontSize: 14,
  },
  multiplierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  multiplierText: {
    fontWeight: '700',
    fontSize: 10,
  },
  calendarSection: {
    marginBottom: 24,
  },
  calendarHeader: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  calendarTitle: {
    fontWeight: '700',
    letterSpacing: 1,
    fontSize: 11,
    opacity: 0.5,
  },
  fab: {
    position: 'relative',
    right: 8,
    bottom: 8,
    borderRadius: 20,
  },
  snackbar: {
    marginBottom: 80,
  },
});

export default HomeScreen;
