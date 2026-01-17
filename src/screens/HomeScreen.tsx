import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { FAB, useTheme, Snackbar, Text } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Goal, Challenge, CalendarEvent, PatternInsight, MotivationalMessage, RescheduleSuggestion } from '../types';
import { goalManager, calendarService, advancedAIService } from '../services';
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
  VoiceGoalCreator,
  PatternInsightCard,
  MotivationalMessageCard,
  RescheduleSuggestionCard,
} from '../components';

/**
 * Gets today's date in ISO format (YYYY-MM-DD)
 */
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * HomeScreen - Main screen displaying today's and tomorrow's goals
 * Shows motivational banner, goal list, and celebration modal
 * Includes category filter, XP/level display, challenges preview, and streak indicator
 *
 * Requirements: 1.4, 2.1, 6.1, 6.6, 7.3, 3.4, 9.4
 */
export function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
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
  const [showVoiceCreator, setShowVoiceCreator] = useState(false);

  // Gamification state
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Calendar state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // Pending delete state for undo functionality
  const [pendingDeleteGoal, setPendingDeleteGoal] = useState<Goal | null>(null);
  const [deleteToastVisible, setDeleteToastVisible] = useState(false);

  // AI Insights state
  const [patternInsights, setPatternInsights] = useState<PatternInsight[]>([]);
  const [motivationalMessage, setMotivationalMessage] = useState<MotivationalMessage | null>(null);
  const [rescheduleSuggestions, setRescheduleSuggestions] = useState<RescheduleSuggestion[]>([]);

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
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      // @ts-ignore
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

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
      const sortedEvents = events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      setCalendarEvents(sortedEvents);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
      setCalendarEvents([]);
    }
  }, [settings.calendarIntegrationEnabled]);

  /**
   * Load AI insights (patterns, motivation, reschedule suggestions)
   */
  const loadAIInsights = useCallback(async () => {
    if (!settings.openRouterApiKey) return;

    try {
      // Load pattern insights if enabled
      if (settings.aiPatternDetectionEnabled && patternInsights.length === 0) {
        const insights = await advancedAIService.detectPatterns();
        setPatternInsights(insights.slice(0, 3)); // Limit to 3 insights
      }

      // Load motivational message if enabled
      if (settings.aiMotivationalEnabled && !motivationalMessage) {
        const context = advancedAIService.buildMotivationContext();
        const message = await advancedAIService.generateMotivation(context);
        if (message) setMotivationalMessage(message);
      }

      // Check for overdue goals and get reschedule suggestions
      if (settings.aiSmartReschedulingEnabled) {
        const allGoals = goalManager.getAllGoals();
        const today = getTodayDate();
        const overdueGoals = allGoals.filter((g) => !g.isCompleted && g.dueDate < today);
        if (overdueGoals.length > 0 && rescheduleSuggestions.length === 0) {
          const suggestions = await advancedAIService.suggestReschedules(overdueGoals.slice(0, 3));
          setRescheduleSuggestions(suggestions);
        }
      }
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    }
  }, [settings, patternInsights.length, motivationalMessage, rescheduleSuggestions.length]);

  /**
   * Filter goals by selected category
   * Requirements: 1.4
   */
  useEffect(() => {
    if (selectedCategoryId === null) {
      setFilteredGoals(goals);
    } else {
      setFilteredGoals(goals.filter((goal) => goal.categoryId === selectedCategoryId));
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
      loadAIInsights();
    }, [loadGoals, loadCalendarEvents, loadAIInsights])
  );

  /**
   * Handle AI insight dismissals
   */
  const handleDismissPatternInsight = useCallback((insightId: string) => {
    setPatternInsights((prev) => prev.filter((i) => i.id !== insightId));
  }, []);

  const handleDismissMotivation = useCallback(() => {
    setMotivationalMessage(null);
  }, []);

  const handleAcceptReschedule = useCallback(
    async (suggestion: RescheduleSuggestion) => {
      try {
        await goalManager.updateGoal(suggestion.goalId, {
          dueDate: suggestion.suggestedDueDate,
        });
        setRescheduleSuggestions((prev) => prev.filter((s) => s.goalId !== suggestion.goalId));
        loadGoals();
        setSnackbarMessage('Goal rescheduled!');
        setSnackbarVisible(true);
      } catch (error) {
        console.error('Failed to reschedule:', error);
      }
    },
    [loadGoals]
  );

  const handleDismissReschedule = useCallback((goalId: string) => {
    setRescheduleSuggestions((prev) => prev.filter((s) => s.goalId !== goalId));
  }, []);

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
  const handleToggleComplete = useCallback(
    async (goalId: string) => {
      try {
        const updatedGoal = await goalManager.toggleComplete(goalId);
        loadGoals();

        // Check if all today's goals are now complete
        const today = getTodayDate();
        if (updatedGoal.isCompleted && goalManager.allGoalsCompleted(today)) {
          setShowCelebration(true);
        }

        // Show feedback
        setSnackbarMessage(updatedGoal.isCompleted ? 'Goal completed!' : 'Goal marked incomplete');
        setSnackbarVisible(true);
      } catch (error) {
        console.error('Failed to toggle goal completion:', error);
        setSnackbarMessage('Failed to update goal');
        setSnackbarVisible(true);
      }
    },
    [loadGoals]
  );

  /**
   * Handle goal press - navigate to detail screen
   * Requirements: 2.2
   */
  const handleGoalPress = useCallback(
    (goalId: string) => {
      router.push({ pathname: '/goal/[id]', params: { id: goalId, mode: 'view' } });
    },
    [router]
  );

  /**
   * Handle goal deletion (immediate, no undo)
   * Requirements: 2.4
   */
  const handleDeleteGoal = useCallback(
    async (goalId: string) => {
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
    },
    [loadGoals]
  );

  /**
   * Handle swipe-to-delete (left-to-right swipe)
   * Shows undo toast for 6 seconds before permanently deleting
   */
  const handleSwipeDelete = useCallback(
    (goalId: string) => {
      const goal = goals.find((g) => g.id === goalId);
      if (goal) {
        // Store the goal for potential undo
        setPendingDeleteGoal(goal);
        // Optimistically remove from UI
        setGoals((prev) => prev.filter((g) => g.id !== goalId));
        setFilteredGoals((prev) => prev.filter((g) => g.id !== goalId));
        // Show undo toast
        setDeleteToastVisible(true);
      }
    },
    [goals]
  );

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
  const handleSwipeComplete = useCallback(
    async (goalId: string) => {
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
    },
    [loadGoals]
  );

  /**
   * Handle move overdue goal to today
   */
  const handleMoveToToday = useCallback(
    async (goalId: string) => {
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
    },
    [loadGoals]
  );

  /**
   * Handle reschedule - navigate to goal form for date change
   */
  const handleReschedule = useCallback(
    (goalId: string) => {
      router.push({ pathname: '/goal/[id]', params: { id: goalId, mode: 'edit' } });
    },
    [router]
  );

  /**
   * Handle FAB press - navigate to add goal screen
   */
  const handleAddGoal = useCallback(() => {
    setFabOpen(false);
    router.push('/goal/new');
  }, [router]);

  /**
   * Handle template press - navigate to templates screen
   * Requirements: 3.1
   */
  const handleOpenTemplates = useCallback(() => {
    setFabOpen(false);
    router.push('/templates');
  }, [router]);

  /**
   * Handle challenges press - navigate to challenges screen
   * Requirements: 7.3
   */
  const handleOpenChallenges = useCallback(() => {
    setFabOpen(false);
    router.push('/challenges');
  }, [router]);

  /**
   * Handle voice goal creation
   */
  const handleVoiceCreate = useCallback(
    async (goalData: Partial<Goal>) => {
      try {
        await goalManager.createGoal(goalData as Parameters<typeof goalManager.createGoal>[0]);
        loadGoals();
        setSnackbarMessage('Goal created!');
        setSnackbarVisible(true);
      } catch (error) {
        console.error('Failed to create voice goal:', error);
        setSnackbarMessage('Failed to create goal');
        setSnackbarVisible(true);
      }
    },
    [loadGoals]
  );

  /**
   * Handle achievements press - navigate to achievements screen
   * Requirements: 5.2
   */
  const handleOpenAchievements = useCallback(() => {
    router.push('/achievements');
  }, [router]);

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
  const handleLongPress = useCallback(
    (goalId: string) => {
      const goal = goals.find((g) => g.id === goalId);
      if (goal) {
        setQuickViewGoal(goal);
        setQuickViewVisible(true);
      }
    },
    [goals]
  );

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
        onMoveToToday={handleMoveToToday}
        onReschedule={handleReschedule}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <View>
            {/* Header Section - Minimalist & Bold */}
            <View style={styles.headerContainer}>
              <View style={styles.topBar}>
                <Text variant="labelLarge" style={[styles.dateLabel, { color: theme.colors.primary }]}>
                  {new Date()
                    .toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' })
                    .toUpperCase()}
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
                  const todayGoals = filteredGoals.filter((g) => g.dueDate === today);
                  const remaining = todayGoals.filter((g) => !g.isCompleted).length;

                  if (todayGoals.length === 0) return 'No tasks scheduled.';
                  if (remaining === 0) return 'All clear.';
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

              {/* Level Progress */}
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

            {/* AI Motivational Message */}
            {motivationalMessage && (
              <View style={{ marginHorizontal: 24, marginBottom: 12 }}>
                <MotivationalMessageCard message={motivationalMessage} onDismiss={handleDismissMotivation} />
              </View>
            )}

            {/* AI Reschedule Suggestions */}
            {rescheduleSuggestions.length > 0 && (
              <View style={{ marginHorizontal: 24, marginBottom: 12 }}>
                {rescheduleSuggestions.map((suggestion) => (
                  <RescheduleSuggestionCard
                    key={suggestion.goalId}
                    suggestion={suggestion}
                    onAccept={handleAcceptReschedule}
                    onModify={(s) => router.push({ pathname: '/goal/[id]', params: { id: s.goalId, mode: 'edit' } })}
                    onDismiss={handleDismissReschedule}
                  />
                ))}
              </View>
            )}

            {/* AI Pattern Insights */}
            {patternInsights.length > 0 && (
              <View style={{ marginHorizontal: 24, marginBottom: 12 }}>
                {patternInsights.map((insight) => (
                  <PatternInsightCard key={insight.id} insight={insight} onDismiss={handleDismissPatternInsight} />
                ))}
              </View>
            )}
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
          ) : (
            <View style={{ marginBottom: 80 }} />
          )
        }
        scrollEnabled={!quickViewVisible && !challengeQuickViewVisible}
      />

      {/* FAB Group for adding goals - Requirements: 3.1, 7.3 */}
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
      />

      {/* Celebration Modal - Requirements: 3.4, 6.2, 6.3 */}
      <CelebrationModal visible={showCelebration} onDismiss={handleDismissCelebration} completedCount={todayCompletedCount} />

      {/* Feedback Snackbar */}
      <Snackbar visible={snackbarVisible} onDismiss={handleDismissSnackbar} duration={2000} style={styles.snackbar}>
        {snackbarMessage}
      </Snackbar>

      {/* Quick View Overlay */}
      <GoalQuickView goal={quickViewGoal} visible={quickViewVisible} onDismiss={handleLongPressEnd} />

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

      <VoiceGoalCreator
        visible={showVoiceCreator}
        onDismiss={() => setShowVoiceCreator(false)}
        onGoalCreated={handleVoiceCreate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateLabel: {
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  headerTitle: {
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontWeight: '400',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  streakText: {
    fontWeight: '600',
  },
  multiplierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  multiplierText: {
    fontWeight: '700',
  },
  levelProgressContainer: {
    marginTop: 16,
  },
  calendarSection: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  calendarHeader: {
    marginBottom: 8,
  },
  calendarTitle: {
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  fab: {
    marginBottom: 8,
  },
  snackbar: {
    marginBottom: 80,
  },
});
