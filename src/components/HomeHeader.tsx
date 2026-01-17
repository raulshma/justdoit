import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { CalendarEvent, Goal, PatternInsight, MotivationalMessage, RescheduleSuggestion } from '../types';
import {
  MotivationalBanner,
  CategoryFilter,
  XPDisplay,
  LevelProgress,
  ThemedIcon,
  CalendarEventCard,
  PatternInsightCard,
  MotivationalMessageCard,
  RescheduleSuggestionCard,
} from '.';
import { getTodayDate } from '../utils/dateUtils';

interface HomeHeaderProps {
  // Data
  goals: Goal[];
  filteredGoals: Goal[];
  calendarEvents: CalendarEvent[];
  totalXP: number;
  currentLevel: number;
  levelProgress: { current: number; required: number; percentage: number };
  currentStreak: number;
  streakMultiplierText: string | null;
  selectedCategoryId: string | null;
  rescheduleSuggestions: RescheduleSuggestion[];
  patternInsights: PatternInsight[];
  motivationalMessage: MotivationalMessage | null;
  
  // Settings
  gamificationEnabled: boolean;
  calendarIntegrationEnabled: boolean;
  
  // Callbacks
  onSelectCategory: (id: string | null) => void;
  onOpenAchievements: () => void;
  onDismissMotivation: () => void;
  onAcceptReschedule: (suggestion: RescheduleSuggestion) => void;
  onModifyReschedule: (suggestion: RescheduleSuggestion) => void;
  onDismissReschedule: (goalId: string) => void; 
  onDismissPatternInsight: (id: string) => void;
}

/**
 * HomeHeader - Displays the top section of the home screen including:
 * - Greeting and Date
 * - Gamification stats (XP, Level, Streak)
 * - Calendar Events
 * - Category Filter
 * - AI Insights and Suggestions
 */
export const HomeHeader: React.FC<HomeHeaderProps> = ({
  filteredGoals,
  calendarEvents,
  totalXP,
  currentLevel,
  levelProgress,
  currentStreak,
  streakMultiplierText,
  selectedCategoryId,
  rescheduleSuggestions,
  patternInsights,
  motivationalMessage,
  gamificationEnabled,
  calendarIntegrationEnabled,
  onSelectCategory,
  onOpenAchievements,
  onDismissMotivation,
  onAcceptReschedule,
  onModifyReschedule,
  onDismissReschedule,
  onDismissPatternInsight,
}) => {
  const theme = useTheme();

  // Helper to get time greeting
  const getTimeGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning.';
    if (hour < 18) return 'Good Afternoon.';
    return 'Good Evening.';
  };

  return (
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
          {gamificationEnabled && (
            <TouchableOpacity onPress={onOpenAchievements} activeOpacity={0.7}>
              <XPDisplay totalXP={totalXP} currentLevel={currentLevel} compact />
            </TouchableOpacity>
          )}
        </View>

        <Text variant="displayMedium" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {getTimeGreeting()}
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
        {gamificationEnabled && currentStreak > 0 && (
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
        {gamificationEnabled && (
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
      {calendarIntegrationEnabled && calendarEvents.length > 0 && (
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
        onSelectCategory={onSelectCategory}
        showAllOption
      />

      <MotivationalBanner />

      {/* AI Motivational Message */}
      {motivationalMessage && (
        <View style={styles.insightContainer}>
          <MotivationalMessageCard message={motivationalMessage} onDismiss={onDismissMotivation} />
        </View>
      )}

      {/* AI Reschedule Suggestions */}
      {rescheduleSuggestions.length > 0 && (
        <View style={styles.insightContainer}>
          {rescheduleSuggestions.map((suggestion) => (
            <RescheduleSuggestionCard
              key={suggestion.goalId}
              suggestion={suggestion}
              onAccept={onAcceptReschedule}
              onModify={onModifyReschedule}
              onDismiss={onDismissReschedule}
            />
          ))}
        </View>
      )}

      {/* AI Pattern Insights */}
      {patternInsights.length > 0 && (
        <View style={styles.insightContainer}>
          {patternInsights.map((insight) => (
            <PatternInsightCard key={insight.id} insight={insight} onDismiss={onDismissPatternInsight} />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontWeight: '700',
    letterSpacing: 1.5,
    fontSize: 12,
  },
  headerTitle: {
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    marginBottom: 16,
    opacity: 0.7,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  streakText: {
    fontWeight: '700',
  },
  multiplierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  multiplierText: {
    fontWeight: '700',
    fontSize: 10,
  },
  levelProgressContainer: {
    marginTop: 4,
  },
  calendarSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarTitle: {
    fontWeight: '700',
    letterSpacing: 1.5,
    fontSize: 11,
    opacity: 0.6,
  },
  insightContainer: {
    marginHorizontal: 24,
    marginBottom: 12,
  },
});
