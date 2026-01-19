/**
 * LogsScreen - View AI request/response logs with filtering and search
 */
import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  useTheme,
  IconButton,
  Chip,
} from 'react-native-paper';
import { LegendList } from '@legendapp/list';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { ThemedIcon } from '../components/ThemedIcon';
import { LogDetailsSheet } from '../components/LogDetailsSheet';
import { aiLogService } from '../services';
import type { AILogEntry } from '../types';
import { useAlert } from '../context/AlertContext';

type FilterType = 'all' | 'success' | 'error';

/**
 * Format timestamp to readable format
 */
const formatTimestamp = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Format duration to readable format
 */
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

/**
 * Log Entry Component
 */
const LogEntryCard = memo(({
  entry,
  onPress,
}: {
  entry: AILogEntry;
  onPress: () => void;
}) => {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.logCard, { backgroundColor: theme.colors.surface }]}
      >
        {/* Header Row */}
        <View style={styles.logHeader}>
          <View style={styles.logHeaderLeft}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: entry.response.success
                    ? theme.colors.primary
                    : theme.colors.error,
                },
              ]}
            />
            <Text variant="labelLarge" style={{ fontWeight: '600' }}>
              {entry.type === 'goal_analysis' ? 'Goal Analysis' : 'Reminder Suggestion'}
            </Text>
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {formatTimestamp(entry.timestamp)}
          </Text>
        </View>

        {/* Goal Title */}
        {entry.request.goalTitle && (
          <Text
            variant="bodyMedium"
            numberOfLines={1}
            style={{ marginTop: 6, color: theme.colors.onSurfaceVariant }}
          >
            "{entry.request.goalTitle}"
          </Text>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedIcon name="clock-outline" size={14} themeColor="onSurfaceVariant" />
            <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>
              {formatDuration(entry.durationMs)}
            </Text>
          </View>
          {!entry.response.success && entry.response.error && (
            <View style={[styles.errorBadge, { backgroundColor: theme.colors.errorContainer }]}>
              <Text variant="labelSmall" style={{ color: theme.colors.error }}>
                Error
              </Text>
            </View>
          )}
          <ThemedIcon
            name="chevron-right"
            size={18}
            themeColor="onSurfaceVariant"
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

/**
 * LogsScreen Component
 */
export const LogsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const alert = useAlert();
  
  const [logs, setLogs] = useState<AILogEntry[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AILogEntry | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  /**
   * Load logs on focus
   */
  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [])
  );

  /**
   * Load logs from service
   */
  const loadLogs = useCallback(() => {
    const loadedLogs = aiLogService.getLogs();
    setLogs(loadedLogs);
  }, []);

  /**
   * Filtered logs based on search and filter
   */
  const filteredLogs = useMemo(() => {
    let result = logs;

    // Apply status filter
    if (filter === 'success') {
      result = result.filter(log => log.response.success);
    } else if (filter === 'error') {
      result = result.filter(log => !log.response.success);
    }

    // Apply search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        log =>
          log.request.goalTitle?.toLowerCase().includes(searchLower) ||
          log.request.prompt.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [logs, filter, search]);

  /**
   * Handle clear all logs
   */
  const handleClearLogs = useCallback(() => {
    alert.confirm(
      'Clear All Logs',
      'Are you sure you want to delete all AI logs? This cannot be undone.',
      () => {
        aiLogService.clearLogs();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setLogs([]);
      },
      undefined,
      'Clear All',
      'Cancel',
      true
    );
  }, [alert]);

  /**
   * Show log details
   */
  const handleShowDetails = useCallback((log: AILogEntry) => {
    setSelectedLog(log);
    setDetailsVisible(true);
  }, []);

  /**
   * Hide log details
   */
  const handleDismissDetails = useCallback(() => {
    setDetailsVisible(false);
    setSelectedLog(null);
  }, []);

  /**
   * Render log item
   */
  const renderItem = useCallback(({ item }: { item: AILogEntry }) => (
    <LogEntryCard
      entry={item}
      onPress={() => handleShowDetails(item)}
    />
  ), [handleShowDetails]);

  /**
   * Key extractor for list
   */
  const keyExtractor = useCallback((item: AILogEntry) => item.id, []);

  const successCount = logs.filter(l => l.response.success).length;
  const errorCount = logs.filter(l => !l.response.success).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          iconColor={theme.colors.onSurface}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>
          AI Logs
        </Text>
        {logs.length > 0 && (
          <IconButton
            icon="delete-outline"
            size={24}
            onPress={handleClearLogs}
            iconColor={theme.colors.error}
          />
        )}
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceVariant + '50' }]}>
        <ThemedIcon name="magnify" size={20} themeColor="onSurfaceVariant" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search logs..."
          placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
          style={[styles.searchInput, { color: theme.colors.onSurface }]}
        />
        {search.length > 0 && (
          <IconButton
            icon="close"
            size={16}
            onPress={() => setSearch('')}
            iconColor={theme.colors.onSurfaceVariant}
          />
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <Chip
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
          style={styles.filterChip}
          showSelectedCheck={false}
        >
          All ({logs.length})
        </Chip>
        <Chip
          selected={filter === 'success'}
          onPress={() => setFilter('success')}
          style={styles.filterChip}
          showSelectedCheck={false}
        >
          Success ({successCount})
        </Chip>
        <Chip
          selected={filter === 'error'}
          onPress={() => setFilter('error')}
          style={styles.filterChip}
          showSelectedCheck={false}
        >
          Errors ({errorCount})
        </Chip>
      </View>

      {/* Logs List */}
      {filteredLogs.length > 0 ? (
        <LegendList
          data={filteredLogs}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          estimatedItemSize={120}
        />
      ) : (
        <View style={styles.emptyState}>
          <ThemedIcon name="file-document-outline" size={48} themeColor="onSurfaceVariant" />
          <Text variant="titleMedium" style={{ marginTop: 16, opacity: 0.7 }}>
            No Logs Yet
          </Text>
          <Text variant="bodyMedium" style={{ textAlign: 'center', marginTop: 8, opacity: 0.5 }}>
            {search || filter !== 'all'
              ? 'No logs match your search or filter.'
              : 'AI logs will appear here when you use AI Assist.'}
          </Text>
        </View>
      )}

      {/* Details Sheet */}
      <LogDetailsSheet
        visible={detailsVisible}
        onDismiss={handleDismissDetails}
        logEntry={selectedLog}
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
    paddingRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    height: 32,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  logCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
});

export default LogsScreen;
