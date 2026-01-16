import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, SectionList } from 'react-native';
import { Text, useTheme, Surface, Icon, IconButton, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { focusTimerService } from '../services';
import type { FocusSession } from '../types';

/**
 * Format duration in seconds to human-readable string
 */
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) {
    return `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
};

/**
 * Format time from ISO string to HH:MM format
 */
const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

/**
 * Get date category for grouping
 */
const getDateCategory = (dateStr: string): string => {
  const today = new Date();
  const sessionDate = new Date(dateStr);
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
  
  // Check for today/yesterday
  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';
  
  // Check for this week (last 7 days)
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (sessionDate >= weekAgo) return 'This Week';
  
  // Check for this month
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);
  if (sessionDate >= monthAgo) return 'This Month';
  
  return 'Older';
};

interface SessionItemProps {
  session: FocusSession;
}

/**
 * Individual session item component
 */
const SessionItem: React.FC<SessionItemProps> = ({ session }) => {
  const theme = useTheme();
  
  const getSessionTypeColor = () => {
    switch (session.type) {
      case 'work': return theme.colors.primary;
      case 'shortBreak': return theme.colors.tertiary;
      case 'longBreak': return theme.colors.secondary;
      default: return theme.colors.primary;
    }
  };
  
  const getSessionTypeLabel = () => {
    switch (session.type) {
      case 'work': return 'Focus';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
      default: return 'Session';
    }
  };

  return (
    <Surface style={[styles.sessionItem, { backgroundColor: theme.colors.surface }]} elevation={0}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionTypeContainer}>
          <View style={[styles.statusDot, { backgroundColor: getSessionTypeColor() }]} />
          <Text variant="labelMedium" style={{ color: getSessionTypeColor(), fontWeight: '700' }}>
            {getSessionTypeLabel()}
          </Text>
        </View>
        
        <View style={styles.sessionMeta}>
          {session.completed ? (
            <Icon source="check-circle" size={18} color={theme.colors.primary} />
          ) : (
            <Icon source="close-circle-outline" size={18} color={theme.colors.outline} />
          )}
        </View>
      </View>
      
      {session.goalTitle && (
        <Text 
          variant="titleMedium" 
          style={{ color: theme.colors.onSurface, fontWeight: '600', marginTop: 8 }}
          numberOfLines={1}
        >
          {session.goalTitle}
        </Text>
      )}
      
      <View style={styles.sessionDetails}>
        <View style={styles.detailItem}>
          <Icon source="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 6 }}>
            {formatDuration(session.duration)}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Icon source="play-circle-outline" size={16} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 6 }}>
            {formatTime(session.startTime)}
          </Text>
        </View>
        
        {session.endTime && (
          <View style={styles.detailItem}>
            <Icon source="stop-circle-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 6 }}>
              {formatTime(session.endTime)}
            </Text>
          </View>
        )}
      </View>
    </Surface>
  );
};

interface SectionData {
  title: string;
  data: FocusSession[];
}

/**
 * FocusHistoryScreen - Display focus session history
 * High-fidelity design with grouped sessions and filtering
 */
export const FocusHistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'work' | 'break'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Get all sessions and group by date
   */
  const sections = useMemo((): SectionData[] => {
    let sessions = focusTimerService.getSessionHistory();
    
    // Apply filter
    if (filter === 'work') {
      sessions = sessions.filter(s => s.type === 'work');
    } else if (filter === 'break') {
      sessions = sessions.filter(s => s.type === 'shortBreak' || s.type === 'longBreak');
    }
    
    // Sort by start time (newest first)
    sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    // Group by date category
    const grouped: Record<string, FocusSession[]> = {};
    const categoryOrder = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];
    
    sessions.forEach(session => {
      const category = getDateCategory(session.date);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(session);
    });
    
    // Convert to sections array in order
    return categoryOrder
      .filter(cat => grouped[cat] && grouped[cat].length > 0)
      .map(cat => ({
        title: cat,
        data: grouped[cat],
      }));
  }, [filter, refreshKey]);

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setRefreshing(false);
  }, []);

  /**
   * Calculate stats summary
   */
  const stats = useMemo(() => {
    const allSessions = focusTimerService.getSessionHistory();
    const workSessions = allSessions.filter(s => s.type === 'work' && s.completed);
    const totalMinutes = Math.round(workSessions.reduce((sum, s) => sum + s.duration, 0) / 60);
    
    return {
      totalSessions: workSessions.length,
      totalMinutes,
      totalHours: Math.floor(totalMinutes / 60),
    };
  }, [refreshKey]);

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
      <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
        {section.title.toUpperCase()}
      </Text>
      <Text variant="labelMedium" style={{ color: theme.colors.outline }}>
        {section.data.length} session{section.data.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  const renderItem = ({ item, index }: { item: FocusSession; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <SessionItem session={item} />
    </Animated.View>
  );

  const isEmpty = sections.length === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          Focus History
        </Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Stats Summary */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Surface style={[styles.statsCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: '800' }}>
              {stats.totalSessions}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Total Sessions
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.outlineVariant }]} />
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={{ color: theme.colors.secondary, fontWeight: '800' }}>
              {stats.totalHours}h
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Total Focus
            </Text>
          </View>
        </Surface>
      </Animated.View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <Chip
          mode={filter === 'all' ? 'flat' : 'outlined'}
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
          style={styles.filterChip}
          textStyle={{ fontWeight: '600' }}
        >
          All
        </Chip>
        <Chip
          mode={filter === 'work' ? 'flat' : 'outlined'}
          selected={filter === 'work'}
          onPress={() => setFilter('work')}
          style={styles.filterChip}
          textStyle={{ fontWeight: '600' }}
        >
          Focus
        </Chip>
        <Chip
          mode={filter === 'break' ? 'flat' : 'outlined'}
          selected={filter === 'break'}
          onPress={() => setFilter('break')}
          style={styles.filterChip}
          textStyle={{ fontWeight: '600' }}
        >
          Breaks
        </Chip>
      </View>

      {/* Sessions List */}
      {isEmpty ? (
        <View style={styles.emptyState}>
          <Icon source="timer-sand-empty" size={64} color={theme.colors.outlineVariant} />
          <Text variant="titleMedium" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
            No Sessions Yet
          </Text>
          <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Start a focus session to see your history here
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  filterChip: {
    borderRadius: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: 1,
    fontSize: 12,
  },
  sessionItem: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default FocusHistoryScreen;
