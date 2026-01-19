import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, StyleSheet, SectionList, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Text, useTheme, Surface, IconButton, Searchbar, Chip, Menu, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown, Layout, FadeOut } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { goalManager, categoryManager } from '../services';
import type { Goal, Priority } from '../types';
import { ThemedIcon } from '../components/ThemedIcon';
import { Swipeable } from 'react-native-gesture-handler';

/**
 * Helper to get date category similar to FocusHistory
 */
const getDateCategory = (dateStr: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const completionDate = new Date(dateStr);
  completionDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - completionDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'This Week';
  if (diffDays <= 30) return 'This Month';
  return 'Older';
};

/**
 * Type defining the sections for SectionList
 */
interface HistorySection {
  title: string;
  data: Goal[];
}

/**
 * Filter State Interface
 */
interface FilterState {
  priority: Priority | 'all';
  categoryId: string | 'all';
}

/**
 * HistoryScreen - High-fidelity screen to view, search, and manage localized goal history
 */
export function HistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ seriesId?: string; seriesTitle?: string }>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({ priority: 'all', categoryId: 'all' });
  const [showFilters, setShowFilters] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const categories = useMemo(() => categoryManager.getCategories(), []);

  // Load goals
  const loadHistory = useCallback(() => {
    setRefreshing(true);
    // Mimic network/db latency for skeleton if we had one, but synchronous for now
    setTimeout(() => {
      const allGoals = goalManager.getAllGoals();
      
      // 1. Filter for COMPLETED goals
      let history = allGoals.filter(g => g.isCompleted);
      
      // 2. Filter by Series ID if provided (Contextual History)
      if (params.seriesId) {
        history = history.filter(g => 
          g.recurrence.parentGoalId === params.seriesId || g.id === params.seriesId
        );
      }
      
      // Sort by completedAt descending (newest first)
      history.sort((a, b) => {
        const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return timeB - timeA;
      });
      
      setGoals(history);
      setRefreshing(false);
    }, 100);
  }, [params.seriesId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Derived filtered data
  const filteredSections = useMemo(() => {
    let filtered = goals;

    // Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(g => 
        g.title.toLowerCase().includes(query) || 
        (g.description && g.description.toLowerCase().includes(query))
      );
    }

    // Priority Filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(g => g.priority === filters.priority);
    }

    // Category Filter
    if (filters.categoryId !== 'all') {
      filtered = filtered.filter(g => g.categoryId === filters.categoryId);
    }

    // Grouping
    const grouped: Record<string, Goal[]> = {};
    const sectionOrder = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];
    
    filtered.forEach(goal => {
      if (!goal.completedAt) return;
      const category = getDateCategory(goal.completedAt);
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(goal);
    });

    return sectionOrder
      .filter(key => grouped[key] && grouped[key].length > 0)
      .map(key => ({
        title: key,
        data: grouped[key]
      }));
  }, [goals, searchQuery, filters]);

  // Redo Action
  const handleRedo = useCallback(async (goal: Goal) => {
    try {
      // Create new goal based on the old one
      const today = new Date();
      const dueDate = today.toISOString().split('T')[0];
      
      await goalManager.createGoal({
        title: goal.title,
        description: goal.description,
        priority: goal.priority,
        categoryId: goal.categoryId,
        dueDate: dueDate,
        // Don't copy recurrence for simple redo, unless explicitly desired? 
        // Plan said "Redo (Duplicate)", simpler to just make a one-off for today usually.
        recurrence: { type: 'none' }, 
        imageUri: goal.imageUri, // Copy assets? Maybe optional, but safe to include reference
      });
      
      router.push('/'); // Go to home to see it? Or just toast?
      // Better UX: Show toast and stay here
      // But for now let's just reload or show feedback
      // We'll assume a toast/snackbar component exists or we can just navigate 
      // Plan said: "Tap 'Redo' -> Verify it appears on Today's list (Home)."
      // Let's navigate to home to show it's there.
      router.replace('/'); 
    } catch (e) {
      console.error("Failed to redo goal", e);
    }
  }, [router]);

  /**
   * Render Individual History Item
   */
  const renderItem = ({ item, index }: { item: Goal, index: number }) => {
    const category = item.categoryId ? categoryManager.getCategoryById(item.categoryId) : null;
    
    const renderRightActions = (progress: any, dragX: any) => {
      return (
        <TouchableOpacity
          style={styles.redoAction}
          onPress={() => handleRedo(item)}
        >
          <ThemedIcon name="refresh" size={24} color="white" />
          <Text style={styles.redoText}>Redo</Text>
        </TouchableOpacity>
      );
    };

    return (
      <Animated.View entering={FadeInDown.delay(index * 30).springify()}>
        <Swipeable renderRightActions={renderRightActions}>
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <View style={styles.cardContent}>
              {/* Check Icon */}
              <View style={[styles.checkContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                <ThemedIcon name="check" size={16} color={theme.colors.primary} />
              </View>
              
              {/* Text Content */}
              <View style={styles.textContainer}>
                <Text variant="bodyLarge" style={[styles.goalTitle, { 
                  textDecorationLine: 'line-through', 
                  color: theme.colors.onSurfaceVariant 
                }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.metaContainer}>
                   {category && (
                     <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
                       <Text style={{ fontSize: 10, color: category.color, fontWeight: '700' }}>
                         {category.name.toUpperCase()}
                       </Text>
                     </View>
                   )}
                   <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
                     {new Date(item.completedAt!).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                   </Text>
                </View>
              </View>

              {/* Priority Indicator */}
              <View style={[styles.priorityDot, { 
                backgroundColor: 
                  item.priority === 'high' ? theme.colors.error : 
                  item.priority === 'medium' ? theme.colors.secondary : 
                  'transparent' 
              }]} />
            </View>
          </Surface>
        </Swipeable>
      </Animated.View>
    );
  };

  /**
   * Render Header with Search & Filter Toggle
   */
  const renderHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerTop}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="headlineSmall" style={{ fontWeight: 'bold', flex: 1 }}>
          {params.seriesTitle ? 'Series History' : 'History'}
        </Text>
        <IconButton 
          icon={showFilters ? "filter-variant-remove" : "filter-variant"} 
          selected={showFilters}
          iconColor={filters.priority !== 'all' || filters.categoryId !== 'all' ? theme.colors.primary : theme.colors.onSurface}
          onPress={() => setShowFilters(!showFilters)} 
        />
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search past goals..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
          inputStyle={{ minHeight: 0 }} // Fix for some paper versions
          elevation={0}
        />
      </View>
      
      {/* Expandable Filters */}
      {showFilters && (
        <Animated.View entering={FadeInDown} exiting={FadeOut} style={styles.filterSection}>
          <Text variant="labelMedium" style={{ marginLeft: 16, marginBottom: 8, color: theme.colors.outline }}>Priority</Text>
          <View style={styles.chipRow}>
            {['all', 'high', 'medium', 'low'].map((p) => (
              <Chip 
                key={p} 
                selected={filters.priority === p} 
                onPress={() => setFilters(prev => ({ ...prev, priority: p as any }))}
                style={styles.chip}
                showSelectedOverlay
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Chip>
            ))}
          </View>
          
          <Text variant="labelMedium" style={{ marginLeft: 16, marginTop: 12, marginBottom: 8, color: theme.colors.outline }}>Category</Text>
           <View style={styles.chipRow}>
             <Chip 
                selected={filters.categoryId === 'all'} 
                onPress={() => setFilters(prev => ({ ...prev, categoryId: 'all' }))}
                style={styles.chip}
              >
                All
              </Chip>
            {categories.map((c) => (
              <Chip 
                key={c.id} 
                selected={filters.categoryId === c.id} 
                onPress={() => setFilters(prev => ({ ...prev, categoryId: c.id }))}
                style={styles.chip}
                avatar={c.icon ? <ThemedIcon name={c.icon as any} size={16} /> : undefined}
              >
                {c.name}
              </Chip>
            ))}
          </View>
          <Divider style={{ marginTop: 16 }} />
        </Animated.View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <SectionList 
        sections={filteredSections}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
            <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{title}</Text>
          </View>
        )}
        ListHeaderComponent={renderHeader}
        stickySectionHeadersEnabled={true}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
             <ThemedIcon name="history" size={64} color={theme.colors.surfaceVariant} />
             <Text variant="titleMedium" style={{ marginTop: 16, color: theme.colors.outline }}>
               {searchQuery ? 'No matching goals found' : 'No completed goals yet'}
             </Text>
          </View>
        }
        onRefresh={loadHistory}
        refreshing={refreshing}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingBottom: 8,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    height: 48,
    borderRadius: 12,
  },
  filterSection: {
    paddingVertical: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    marginBottom: 4,
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  checkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  goalTitle: {
    fontWeight: '500',
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
  redoAction: {
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    marginBottom: 8,
    marginRight: 16, // to match card margin
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  redoText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    opacity: 0.7,
  },
});
