import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StatisticsScreenProps } from '../navigation/types';
import type { Statistics } from '../types';
import { statisticsService } from '../services';
import {
  CompletionChart,
  StreakDisplay,
  StatCard,
  MotivationalBanner,
  InsightsSection,
} from '../components';

/**
 * StatisticsScreen - Displays high-fidelity progress metrics and analytics
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */
export const StatisticsScreen: React.FC<StatisticsScreenProps> = () => {
  const theme = useTheme();
  const [stats, setStats] = useState<Statistics>({
    todayCompleted: 0,
    todayTotal: 0,
    weeklyCompletionRate: 0,
    currentStreak: 0,
    longestStreak: 0,
    last7DaysCompletions: [0, 0, 0, 0, 0, 0, 0],
    averagePerDay: 0,
    completionsByHour: new Array(24).fill(0),
    completionsByDayOfWeek: new Array(7).fill(0),
    peakHours: [],
    lowPerformanceDays: [],
  });
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Load statistics
   */
  const loadStatistics = useCallback(() => {
    const calculatedStats = statisticsService.calculateTodayStats();
    setStats(calculatedStats);
  }, []);

  /**
   * Refresh statistics on screen focus
   */
  useFocusEffect(
    useCallback(() => {
      loadStatistics();
    }, [loadStatistics])
  );

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await statisticsService.refreshStatistics();
    loadStatistics();
    setRefreshing(false);
  }, [loadStatistics]);

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
        {/* Header Section */}
      <View style={styles.headerContainer}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Insights
        </Text>
        <Text variant="bodyLarge" style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          Your habit journey
        </Text>
      </View>

      {/* Hero: Streak Display */}
      <View style={styles.heroSection}>
        <StreakDisplay
          currentStreak={stats.currentStreak}
          longestStreak={stats.longestStreak}
        />
      </View>

      {/* Main Stats Grid */}
      <View style={styles.gridSection}>
        <View style={styles.row}>
          <StatCard
            value={stats.todayCompleted}
            label="Completed"
            icon="check-circle-outline"
            variant="primary"
          />
          <StatCard
            value={stats.todayTotal}
            label="Total Goals"
            icon="format-list-checks"
            variant="secondary"
          />
        </View>
        <View style={styles.row}>
          <StatCard
            value={`${stats.weeklyCompletionRate}%`}
            label="Rate"
            subtitle="This week"
            icon="chart-arc"
          />
          <StatCard
            value={stats.averagePerDay}
            label="Avg/Day"
            subtitle="Last 30 days"
            icon="chart-timeline-variant"
          />
        </View>
      </View>

      {/* Chart Section */}
      <View style={[styles.chartSection, { backgroundColor: theme.colors.surface }]}>
        <CompletionChart data={stats.last7DaysCompletions} />
      </View>

      {/* Productivity Insights Section */}
      <View style={styles.insightsSection}>
        <InsightsSection stats={stats} />
      </View>

      {/* Footer Quote */}
      <View style={styles.footer}>
        <MotivationalBanner />
      </View>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  headerContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 12,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    marginTop: 4,
    opacity: 0.8,
  },
  heroSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
    alignItems: 'center',
  },
  gridSection: {
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  chartSection: {
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    // Soft shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  insightsSection: {
    paddingHorizontal: 16,
  },
  footer: {
    marginBottom: 20,
  },
});

export default StatisticsScreen;
