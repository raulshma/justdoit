import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, useTheme, Surface, ProgressBar } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StatisticsScreenProps } from '../navigation/types';
import type { Statistics } from '../types';
import type { Challenge } from '../types/challenge';
import type { PersonalBest } from '../types/personalBest';
import type { Badge, UnlockedBadge } from '../types/badge';
import type { XPTransaction } from '../types/xp';
import { statisticsService } from '../services';
import { challengeService } from '../services/challengeService';
import { personalBestService } from '../services/personalBestService';
import { achievementService } from '../services/achievementService';
import { xpService } from '../services/xpService';
import { useSettings } from '../context/SettingsContext';
import {
  CompletionChart,
  StreakDisplay,
  StatCard,
  MotivationalBanner,
  InsightsSection,
  PersonalBestCard,
  XPDisplay,
  LevelProgress,
  BadgeCard,
  ThemedIcon,
} from '../components';
import { ChallengeCard } from '../components/ChallengeCard';

/**
 * StatisticsScreen - Displays high-fidelity progress metrics and analytics
 * 
 * Requirements: 6.6, 8.2, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 7.3
 */
export const StatisticsScreen: React.FC<StatisticsScreenProps> = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { settings } = useSettings();
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
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [personalBests, setPersonalBests] = useState<PersonalBest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // XP and Badge state - Requirements: 6.6
  const [totalXP, setTotalXP] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState({ current: 0, required: 100, percentage: 0 });
  const [xpHistory, setXPHistory] = useState<XPTransaction[]>([]);
  const [recentBadges, setRecentBadges] = useState<{ badge: Badge; unlockedInfo: UnlockedBadge }[]>([]);
  const [totalBadges, setTotalBadges] = useState({ unlocked: 0, total: 0 });

  /**
   * Load statistics and challenges
   */
  const loadStatistics = useCallback(() => {
    const calculatedStats = statisticsService.calculateTodayStats();
    setStats(calculatedStats);

    // Load active challenges
    challengeService.expireOldChallenges();
    if (challengeService.shouldGenerateNewChallenges()) {
      challengeService.generateWeeklyChallenges();
    }
    const challenges = challengeService.getActiveChallenges();
    setActiveChallenges(challenges.filter((c) => c.status === 'active'));

    // Load personal bests - Requirements: 8.2
    const bests = personalBestService.getAllPersonalBests();
    setPersonalBests(bests);
    
    // Load XP and level data - Requirements: 6.6
    setTotalXP(xpService.getTotalXP());
    setCurrentLevel(xpService.getCurrentLevel());
    setLevelProgress(xpService.getLevelProgress());
    setXPHistory(xpService.getXPHistory(10)); // Last 10 transactions
    
    // Load badge data - Requirements: 6.6
    const allBadges = achievementService.getAllBadges();
    const unlockedBadges = achievementService.getUnlockedBadges();
    setTotalBadges({ unlocked: unlockedBadges.length, total: allBadges.length });
    
    // Get recently unlocked badges (last 3)
    const sortedUnlocked = [...unlockedBadges].sort(
      (a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
    );
    const recent = sortedUnlocked.slice(0, 3).map((unlocked) => ({
      badge: allBadges.find((b) => b.id === unlocked.badgeId)!,
      unlockedInfo: unlocked,
    })).filter((item) => item.badge);
    setRecentBadges(recent);
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
      
      {/* XP and Level Section - Requirements: 6.6 (only when gamification enabled) */}
      {settings.gamificationEnabled && (
        <Surface style={[styles.xpSection, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
          <View style={styles.xpHeader}>
            <XPDisplay totalXP={totalXP} currentLevel={currentLevel} />
          </View>
          <View style={styles.levelProgressWrapper}>
            <LevelProgress
              currentLevel={currentLevel}
              currentXP={levelProgress.current}
              requiredXP={levelProgress.required}
              percentage={levelProgress.percentage}
              compact
            />
          </View>
        </Surface>
      )}
      
      {/* XP History Section - Requirements: 6.6 (only when gamification enabled) */}
      {settings.gamificationEnabled && xpHistory.length > 0 && (
        <View style={styles.xpHistorySection}>
          <View style={styles.sectionHeader}>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              ⭐ Recent XP
            </Text>
          </View>
          <Surface style={[styles.xpHistoryCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            {xpHistory.slice(0, 5).map((transaction, index) => (
              <View 
                key={transaction.id} 
                style={[
                  styles.xpHistoryItem,
                  index < Math.min(xpHistory.length, 5) - 1 && styles.xpHistoryItemBorder,
                  { borderBottomColor: theme.colors.outlineVariant }
                ]}
              >
                <View style={styles.xpHistoryLeft}>
                  <Text 
                    variant="bodyMedium" 
                    style={[styles.xpHistoryReason, { color: theme.colors.onSurface }]}
                    numberOfLines={1}
                  >
                    {transaction.reason}
                  </Text>
                  <Text 
                    variant="labelSmall" 
                    style={[styles.xpHistoryTime, { color: theme.colors.onSurfaceVariant }]}
                  >
                    {new Date(transaction.timestamp).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                <View style={styles.xpHistoryRight}>
                  <Text 
                    variant="titleMedium" 
                    style={[styles.xpHistoryAmount, { color: theme.colors.primary }]}
                  >
                    +{transaction.amount}
                  </Text>
                  {transaction.multiplier > 1 && (
                    <Text 
                      variant="labelSmall" 
                      style={[styles.xpHistoryMultiplier, { color: theme.colors.secondary }]}
                    >
                      {transaction.multiplier}x
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </Surface>
        </View>
      )}
      
      {/* Badge Showcase Section - Requirements: 6.6 (only when gamification enabled) */}
      {settings.gamificationEnabled && (
        <View style={styles.badgeShowcaseSection}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Achievements')}
            activeOpacity={0.7}
          >
          <View style={styles.sectionHeader}>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              🏅 Badges
            </Text>
            <Text
              variant="labelMedium"
              style={[styles.sectionLink, { color: theme.colors.primary }]}
            >
              {totalBadges.unlocked}/{totalBadges.total} →
            </Text>
          </View>
        </TouchableOpacity>
        
        {recentBadges.length > 0 ? (
          <View style={styles.badgeGrid}>
            {recentBadges.map(({ badge, unlockedInfo }) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                unlockedInfo={unlockedInfo}
                progress={100}
                currentProgress={badge.criteria.threshold}
                onPress={() => navigation.navigate('Achievements')}
              />
            ))}
          </View>
        ) : (
          <Surface style={[styles.emptyBadgeCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
            <ThemedIcon name="trophy-outline" size={32} color={theme.colors.onSurfaceVariant} />
            <Text 
              variant="bodyMedium" 
              style={[styles.emptyBadgeText, { color: theme.colors.onSurfaceVariant }]}
            >
              Complete goals to earn badges!
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Achievements')}>
              <Text 
                variant="labelMedium" 
                style={[styles.viewAllBadges, { color: theme.colors.primary }]}
              >
                View All Badges →
              </Text>
            </TouchableOpacity>
          </Surface>
        )}
        </View>
      )}

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

      {/* Weekly Challenges Section - Requirements: 7.3 (only when gamification enabled) */}
      {settings.gamificationEnabled && activeChallenges.length > 0 && (
        <View style={styles.challengesSection}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Challenges')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <Text
                variant="titleMedium"
                style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
              >
                Weekly Challenges
              </Text>
              <Text
                variant="labelMedium"
                style={[styles.sectionLink, { color: theme.colors.primary }]}
              >
                View All →
              </Text>
            </View>
          </TouchableOpacity>
          {activeChallenges.slice(0, 2).map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onPress={() => navigation.navigate('Challenges')}
            />
          ))}
        </View>
      )}

      {/* Personal Bests Section - Requirements: 8.2, 8.9 (only when gamification enabled) */}
      {settings.gamificationEnabled && personalBests.length > 0 && (
        <View style={styles.personalBestsSection}>
          <View style={styles.sectionHeader}>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              🏆 Personal Bests
            </Text>
          </View>
          {personalBests.map((pb) => (
            <PersonalBestCard key={pb.id} personalBest={pb} />
          ))}
        </View>
      )}

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
    marginBottom: 24,
    alignItems: 'center',
  },
  xpSection: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  xpHeader: {
    marginBottom: 12,
  },
  levelProgressWrapper: {
    marginTop: 8,
  },
  xpHistorySection: {
    marginBottom: 24,
  },
  xpHistoryCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  xpHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  xpHistoryItemBorder: {
    borderBottomWidth: 1,
  },
  xpHistoryLeft: {
    flex: 1,
    marginRight: 12,
  },
  xpHistoryReason: {
    fontWeight: '500',
  },
  xpHistoryTime: {
    marginTop: 2,
    opacity: 0.7,
  },
  xpHistoryRight: {
    alignItems: 'flex-end',
  },
  xpHistoryAmount: {
    fontWeight: '700',
  },
  xpHistoryMultiplier: {
    fontWeight: '600',
    marginTop: 2,
  },
  badgeShowcaseSection: {
    marginBottom: 24,
  },
  badgeGrid: {
    gap: 8,
  },
  emptyBadgeCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyBadgeText: {
    textAlign: 'center',
    opacity: 0.8,
  },
  viewAllBadges: {
    fontWeight: '600',
    marginTop: 8,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  insightsSection: {
    paddingHorizontal: 16,
  },
  challengesSection: {
    marginTop: 24,
    marginBottom: 8,
  },
  personalBestsSection: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  sectionLink: {
    fontWeight: '600',
  },
  footer: {
    marginBottom: 20,
  },
});

export default StatisticsScreen;
