import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme, SegmentedButtons, Surface, IconButton } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Challenge } from '../types/challenge';
import { challengeService } from '../services/challengeService';
import { ChallengeCard } from '../components/ChallengeCard';
import { ChallengeCompleteModal } from '../components/ChallengeCompleteModal';
import { ThemedIcon } from '../components/ThemedIcon';

type FilterOption = 'active' | 'completed' | 'expired';

/**
 * Formats a date range for display
 */
const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
};

/**
 * ChallengesScreen - Displays active and past challenges
 * Requirements: 7.3, 7.6
 */
export const ChallengesScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [challengeHistory, setChallengeHistory] = useState<Challenge[]>([]);
  const [filter, setFilter] = useState<FilterOption>('active');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  /**
   * Load challenge data
   */
  const loadChallenges = useCallback(() => {
    // Expire old challenges first
    challengeService.expireOldChallenges();

    // Check if we need to generate new challenges
    if (challengeService.shouldGenerateNewChallenges()) {
      challengeService.generateWeeklyChallenges();
    }

    const active = challengeService.getActiveChallenges();
    const history = challengeService.getChallengeHistory();

    setActiveChallenges(active);
    setChallengeHistory(history);
  }, []);

  /**
   * Refresh challenges on screen focus
   */
  useFocusEffect(
    useCallback(() => {
      loadChallenges();
    }, [loadChallenges])
  );

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    loadChallenges();
    setRefreshing(false);
  }, [loadChallenges]);

  /**
   * Handle challenge press
   */
  const handleChallengePress = useCallback((challenge: Challenge) => {
    setSelectedChallenge(challenge);
    if (challenge.status === 'completed') {
      setShowCompleteModal(true);
    }
  }, []);

  /**
   * Filter challenges based on selected filter
   */
  const filteredChallenges = useMemo(() => {
    if (filter === 'active') {
      return activeChallenges.filter((c) => c.status === 'active');
    } else if (filter === 'completed') {
      return [
        ...activeChallenges.filter((c) => c.status === 'completed'),
        ...challengeHistory.filter((c) => c.status === 'completed'),
      ];
    } else {
      return challengeHistory.filter((c) => c.status === 'expired');
    }
  }, [activeChallenges, challengeHistory, filter]);

  /**
   * Calculate stats
   */
  const stats = useMemo(() => {
    const allChallenges = [...activeChallenges, ...challengeHistory];
    const completed = allChallenges.filter((c) => c.status === 'completed').length;
    const total = allChallenges.length;
    const activeCount = activeChallenges.filter((c) => c.status === 'active').length;
    const totalXP = allChallenges
      .filter((c) => c.status === 'completed')
      .reduce((sum, c) => sum + c.xpReward, 0);
    return { completed, total, activeCount, totalXP };
  }, [activeChallenges, challengeHistory]);

  /**
   * Get current week date range
   */
  const currentWeekRange = useMemo(() => {
    if (activeChallenges.length > 0) {
      return formatDateRange(activeChallenges[0].startDate, activeChallenges[0].endDate);
    }
    return '';
  }, [activeChallenges]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="close"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        />
        <View style={styles.headerContent}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Weekly Challenges
          </Text>
          {currentWeekRange && (
            <Text
              variant="bodyMedium"
              style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}
            >
              {currentWeekRange}
            </Text>
          )}
        </View>
      </View>

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
        {/* Stats Card */}
        <Surface
          style={[styles.statsCard, { backgroundColor: theme.colors.tertiaryContainer }]}
          elevation={0}
        >
          <View style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text
                variant="displaySmall"
                style={[styles.statValue, { color: theme.colors.onTertiaryContainer }]}
              >
                {stats.activeCount}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.statLabel, { color: theme.colors.onTertiaryContainer }]}
              >
                Active
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text
                variant="displaySmall"
                style={[styles.statValue, { color: theme.colors.onTertiaryContainer }]}
              >
                {stats.completed}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.statLabel, { color: theme.colors.onTertiaryContainer }]}
              >
                Completed
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text
                variant="displaySmall"
                style={[styles.statValue, { color: theme.colors.onTertiaryContainer }]}
              >
                {stats.totalXP}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.statLabel, { color: theme.colors.onTertiaryContainer }]}
              >
                XP Earned
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
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'expired', label: 'Expired' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Challenge List */}
        {filteredChallenges.length > 0 ? (
          <View style={styles.challengeList}>
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onPress={handleChallengePress}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={{ marginBottom: 16 }}>
              <ThemedIcon 
                name={filter === 'active' ? 'target' : filter === 'completed' ? 'trophy' : 'clock-outline'} 
                size={48} 
                color={theme.colors.onSurfaceVariant} 
              />
            </View>
            <Text
              variant="titleMedium"
              style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
            >
              {filter === 'active'
                ? 'No active challenges'
                : filter === 'completed'
                ? 'No completed challenges yet'
                : 'No expired challenges'}
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
            >
              {filter === 'active'
                ? 'New challenges will appear at the start of each week!'
                : filter === 'completed'
                ? 'Complete challenges to earn bonus XP!'
                : 'Expired challenges will appear here.'}
            </Text>
          </View>
        )}

        {/* Info Section */}
        <Surface
          style={[styles.infoCard, { backgroundColor: theme.colors.surfaceVariant }]}
          elevation={0}
        >
          <ThemedIcon 
            name="lightbulb-outline" 
            size={24} 
            color={theme.colors.onSurface} 
            style={{ marginRight: 8 }} 
          />
          <View style={styles.infoContent}>
            <Text
              variant="titleSmall"
              style={[styles.infoTitle, { color: theme.colors.onSurface }]}
            >
              How Challenges Work
            </Text>
            <Text
              variant="bodySmall"
              style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}
            >
              Every Monday, 3 new challenges are generated based on your activity.
              Complete them before the week ends to earn bonus XP!
            </Text>
          </View>
        </Surface>
      </ScrollView>

      {/* Challenge Complete Modal */}
      <ChallengeCompleteModal
        visible={showCompleteModal}
        onDismiss={() => setShowCompleteModal(false)}
        challenge={selectedChallenge}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  closeButton: {
    marginRight: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    marginTop: 2,
    opacity: 0.8,
  },
  content: {
    paddingBottom: 40,
  },
  statsCard: {
    marginHorizontal: 16,
    marginTop: 16,
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
  challengeList: {
    marginBottom: 24,
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
  infoCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  infoText: {
    lineHeight: 18,
  },
});

export default ChallengesScreen;
