import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme, SegmentedButtons, Surface } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Badge, BadgeCategory, UnlockedBadge } from '../types/badge';
import { achievementService, BadgeProgress as BadgeProgressType } from '../services/achievementService';
import { BadgeCard, BadgeUnlockModal } from '../components';

type FilterOption = 'all' | 'unlocked' | 'locked';

/**
 * Category display names and order
 */
const CATEGORY_ORDER: BadgeCategory[] = ['streak', 'completion', 'behavior', 'category'];
const CATEGORY_NAMES: Record<BadgeCategory, string> = {
  streak: '🔥 Streak',
  completion: '🎯 Completion',
  behavior: '⏰ Behavior',
  category: '📁 Category',
};

/**
 * AchievementsScreen - Displays all badges with locked/unlocked status
 * Requirements: 5.2, 5.3, 5.4
 */
export const AchievementsScreen: React.FC = () => {
  const theme = useTheme();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<UnlockedBadge[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<Record<string, BadgeProgressType>>({});
  const [filter, setFilter] = useState<FilterOption>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  /**
   * Load badge data
   */
  const loadBadges = useCallback(() => {
    const badges = achievementService.getAllBadges();
    const unlocked = achievementService.getUnlockedBadges();
    
    // Load progress for all badges
    const progress: Record<string, BadgeProgressType> = {};
    badges.forEach((badge) => {
      progress[badge.id] = achievementService.getBadgeProgress(badge.id);
    });

    setAllBadges(badges);
    setUnlockedBadges(unlocked);
    setBadgeProgress(progress);
  }, []);

  /**
   * Refresh badges on screen focus
   */
  useFocusEffect(
    useCallback(() => {
      loadBadges();
    }, [loadBadges])
  );

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    loadBadges();
    setRefreshing(false);
  }, [loadBadges]);

  /**
   * Handle badge press
   */
  const handleBadgePress = useCallback((badge: Badge) => {
    setSelectedBadge(badge);
    setShowBadgeModal(true);
  }, []);

  /**
   * Get unlocked badge info by badge ID
   */
  const getUnlockedInfo = useCallback(
    (badgeId: string): UnlockedBadge | undefined => {
      return unlockedBadges.find((b) => b.badgeId === badgeId);
    },
    [unlockedBadges]
  );

  /**
   * Filter and group badges by category
   */
  const groupedBadges = useMemo(() => {
    const unlockedIds = new Set(unlockedBadges.map((b) => b.badgeId));

    // Filter badges based on selected filter
    let filteredBadges = allBadges;
    if (filter === 'unlocked') {
      filteredBadges = allBadges.filter((b) => unlockedIds.has(b.id));
    } else if (filter === 'locked') {
      filteredBadges = allBadges.filter((b) => !unlockedIds.has(b.id));
    }

    // Group by category
    const grouped: Record<BadgeCategory, Badge[]> = {
      streak: [],
      completion: [],
      behavior: [],
      category: [],
    };

    filteredBadges.forEach((badge) => {
      grouped[badge.category].push(badge);
    });

    return grouped;
  }, [allBadges, unlockedBadges, filter]);

  /**
   * Calculate stats
   */
  const stats = useMemo(() => {
    const total = allBadges.length;
    const unlocked = unlockedBadges.length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    return { total, unlocked, percentage };
  }, [allBadges, unlockedBadges]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
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
        <View style={styles.headerContainer}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Achievements
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Your badge collection
          </Text>
        </View>

        {/* Stats Card */}
        <Surface
          style={[styles.statsCard, { backgroundColor: theme.colors.primaryContainer }]}
          elevation={0}
        >
          <View style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text
                variant="displaySmall"
                style={[styles.statValue, { color: theme.colors.onPrimaryContainer }]}
              >
                {stats.unlocked}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.statLabel, { color: theme.colors.onPrimaryContainer }]}
              >
                Unlocked
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text
                variant="displaySmall"
                style={[styles.statValue, { color: theme.colors.onPrimaryContainer }]}
              >
                {stats.total}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.statLabel, { color: theme.colors.onPrimaryContainer }]}
              >
                Total
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text
                variant="displaySmall"
                style={[styles.statValue, { color: theme.colors.onPrimaryContainer }]}
              >
                {stats.percentage}%
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.statLabel, { color: theme.colors.onPrimaryContainer }]}
              >
                Complete
              </Text>
            </View>
          </View>
        </Surface>

        {/* Filter */}
        <View style={styles.filterContainer}>
          <SegmentedButtons
            value={filter}
            onValueChange={(value) => setFilter(value as FilterOption)}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'unlocked', label: 'Unlocked' },
              { value: 'locked', label: 'Locked' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Badge Categories */}
        {CATEGORY_ORDER.map((category) => {
          const badges = groupedBadges[category];
          if (badges.length === 0) return null;

          return (
            <View key={category} style={styles.categorySection}>
              <Text
                variant="titleMedium"
                style={[styles.categoryTitle, { color: theme.colors.onSurface }]}
              >
                {CATEGORY_NAMES[category]}
              </Text>
              {badges.map((badge) => {
                const unlockedInfo = getUnlockedInfo(badge.id);
                const progress = badgeProgress[badge.id];
                return (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    unlockedInfo={unlockedInfo}
                    progress={progress?.percentage ?? 0}
                    currentProgress={progress?.current ?? 0}
                    onPress={handleBadgePress}
                  />
                );
              })}
            </View>
          );
        })}

        {/* Empty State */}
        {filter !== 'all' &&
          Object.values(groupedBadges).every((badges) => badges.length === 0) && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>
                {filter === 'unlocked' ? '🔒' : '🏆'}
              </Text>
              <Text
                variant="titleMedium"
                style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
              >
                {filter === 'unlocked'
                  ? 'No badges unlocked yet'
                  : 'All badges unlocked!'}
              </Text>
              <Text
                variant="bodyMedium"
                style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
              >
                {filter === 'unlocked'
                  ? 'Complete goals to earn your first badge!'
                  : "Congratulations! You've collected them all!"}
              </Text>
            </View>
          )}
      </ScrollView>

      {/* Badge Detail Modal */}
      <BadgeUnlockModal
        visible={showBadgeModal}
        onDismiss={() => setShowBadgeModal(false)}
        badge={selectedBadge}
      />
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
    marginBottom: 16,
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
  statsCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 4,
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  segmentedButtons: {
    borderRadius: 12,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default AchievementsScreen;
