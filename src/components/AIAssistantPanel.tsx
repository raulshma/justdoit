/**
 * AIAssistantPanel - Displays AI-powered goal analysis suggestions
 * Shows subgoals, clarity improvements, category suggestions, and related goals
 */
import React, { memo, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {
  Text,
  useTheme,
  Surface,
  ActivityIndicator,
  Chip,
  IconButton,
  Button,
} from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { ThemedIcon } from './ThemedIcon';
import type {
  AIGoalAnalysis,
  SuggestedSubgoal,
  ClarifiedGoal,
  CategorySuggestion,
  RelatedGoal,
} from '../types';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AIAssistantPanelProps {
  /** Whether the panel is visible */
  visible: boolean;
  /** Loading state */
  loading: boolean;
  /** AI analysis result */
  analysis: AIGoalAnalysis | null;
  /** Error message if analysis failed */
  error: string | null;
  /** Called when user taps a subgoal to add it */
  onAddSubgoal: (subgoal: SuggestedSubgoal) => void;
  /** Called when user applies the clarified goal */
  onApplyClarifiedGoal: (clarified: ClarifiedGoal) => void;
  /** Called when user applies the suggested category */
  onApplyCategory: (category: CategorySuggestion) => void;
  /** Called when user taps a related goal */
  onViewRelatedGoal: (goalId: string) => void;
  /** Called to dismiss the panel */
  onDismiss: () => void;
  /** Subgoals already added (to disable chips) */
  addedSubgoals?: Set<string>;
}

/**
 * Confidence badge colors
 */
const getConfidenceColor = (confidence: 'high' | 'medium' | 'low', theme: any) => {
  switch (confidence) {
    case 'high':
      return { bg: theme.colors.primaryContainer, text: theme.colors.primary };
    case 'medium':
      return { bg: theme.colors.secondaryContainer, text: theme.colors.secondary };
    case 'low':
      return { bg: theme.colors.surfaceVariant, text: theme.colors.onSurfaceVariant };
  }
};

/**
 * Relationship badge colors
 */
const getRelationshipIcon = (relationship: 'duplicate' | 'dependency' | 'related') => {
  switch (relationship) {
    case 'duplicate':
      return 'content-copy';
    case 'dependency':
      return 'arrow-right-bold';
    case 'related':
      return 'link-variant';
  }
};

/**
 * Subgoal Chips Section
 */
const SubgoalChips = memo(({
  subgoals,
  onAdd,
  addedSubgoals,
}: {
  subgoals: SuggestedSubgoal[];
  onAdd: (s: SuggestedSubgoal) => void;
  addedSubgoals?: Set<string>;
}) => {
  const theme = useTheme();

  if (subgoals.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedIcon name="format-list-checks" size={18} themeColor="primary" />
        <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Suggested Steps
        </Text>
      </View>
      <View style={styles.chipContainer}>
        {subgoals.map((subgoal, index) => {
          const isAdded = addedSubgoals?.has(subgoal.title);
          return (
            <Chip
              key={index}
              mode="outlined"
              icon={subgoal.isMilestone ? 'flag' : 'plus'}
              selected={isAdded}
              disabled={isAdded}
              onPress={() => onAdd(subgoal)}
              style={[
                styles.chip,
                isAdded && { backgroundColor: theme.colors.primaryContainer },
              ]}
              textStyle={isAdded ? { color: theme.colors.primary } : undefined}
            >
              {subgoal.title}
            </Chip>
          );
        })}
      </View>
    </View>
  );
});

/**
 * Clarified Goal Card
 */
const ClarifiedGoalCard = memo(({
  clarified,
  onApply,
}: {
  clarified: ClarifiedGoal;
  onApply: () => void;
}) => {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedIcon name="lightbulb-outline" size={18} themeColor="primary" />
        <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Clearer Goal
        </Text>
      </View>
      <Surface style={[styles.clarityCard, { backgroundColor: theme.colors.primaryContainer + '40' }]} elevation={0}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
          {clarified.title}
        </Text>
        {clarified.description && (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            {clarified.description}
          </Text>
        )}
        <Text variant="bodySmall" style={{ color: theme.colors.primary, marginTop: 8, fontStyle: 'italic' }}>
          {clarified.rationale}
        </Text>
        <Button
          mode="contained-tonal"
          onPress={onApply}
          style={styles.applyButton}
          compact
        >
          Apply Suggestion
        </Button>
      </Surface>
    </View>
  );
});

/**
 * Category Suggestion Card
 */
const CategoryCard = memo(({
  category,
  onApply,
}: {
  category: CategorySuggestion;
  onApply: () => void;
}) => {
  const theme = useTheme();
  const colors = getConfidenceColor(category.confidence, theme);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedIcon name="folder-outline" size={18} themeColor="primary" />
        <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Category
        </Text>
      </View>
      <TouchableOpacity
        onPress={onApply}
        activeOpacity={0.7}
        style={[styles.categoryRow, { backgroundColor: theme.colors.surfaceVariant + '40' }]}
      >
        <View style={styles.categoryInfo}>
          <Text variant="titleMedium" style={{ fontWeight: '600' }}>
            {category.categoryName}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {category.reason}
          </Text>
        </View>
        <View style={[styles.confidenceBadge, { backgroundColor: colors.bg }]}>
          <Text variant="labelSmall" style={{ color: colors.text, fontWeight: '600' }}>
            {category.confidence.toUpperCase()}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
});

/**
 * Related Goals Section
 */
const RelatedGoalsSection = memo(({
  relatedGoals,
  onView,
}: {
  relatedGoals: RelatedGoal[];
  onView: (goalId: string) => void;
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  if (relatedGoals.length === 0) return null;

  return (
    <View style={styles.section}>
      <TouchableOpacity
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExpanded(!expanded);
        }}
        style={styles.sectionHeader}
        activeOpacity={0.7}
      >
        <ThemedIcon name="link-variant" size={18} themeColor="secondary" />
        <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.secondary }]}>
          Related Goals ({relatedGoals.length})
        </Text>
        <ThemedIcon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          themeColor="onSurfaceVariant"
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.relatedList}>
          {relatedGoals.map((goal) => (
            <TouchableOpacity
              key={goal.goalId}
              onPress={() => onView(goal.goalId)}
              style={[styles.relatedItem, { backgroundColor: theme.colors.surfaceVariant + '30' }]}
              activeOpacity={0.7}
            >
              <ThemedIcon
                name={getRelationshipIcon(goal.relationship)}
                size={16}
                themeColor="onSurfaceVariant"
              />
              <View style={styles.relatedInfo}>
                <Text variant="bodyMedium" numberOfLines={1} style={{ fontWeight: '500' }}>
                  {goal.goalTitle}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {goal.reason}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
});

/**
 * Main AIAssistantPanel Component
 */
export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = memo(({
  visible,
  loading,
  analysis,
  error,
  onAddSubgoal,
  onApplyClarifiedGoal,
  onApplyCategory,
  onViewRelatedGoal,
  onDismiss,
  addedSubgoals,
}) => {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedIcon name="auto-fix" size={20} themeColor="primary" />
          <Text variant="titleMedium" style={[styles.headerTitle, { color: theme.colors.primary }]}>
            AI Assistant
          </Text>
        </View>
        <IconButton
          icon="close"
          size={20}
          onPress={onDismiss}
          iconColor={theme.colors.onSurfaceVariant}
        />
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text variant="bodyMedium" style={{ marginLeft: 12, color: theme.colors.onSurfaceVariant }}>
            Analyzing your goal...
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorContainer + '40' }]}>
          <ThemedIcon name="alert-circle-outline" size={20} themeColor="error" />
          <Text variant="bodyMedium" style={{ marginLeft: 8, color: theme.colors.error, flex: 1 }}>
            {error}
          </Text>
        </View>
      )}

      {/* Analysis Results */}
      {analysis && !loading && (
        <View style={styles.content}>
          {/* Subgoals */}
          <SubgoalChips
            subgoals={analysis.suggestedSubgoals}
            onAdd={onAddSubgoal}
            addedSubgoals={addedSubgoals}
          />

          {/* Clarified Goal */}
          {analysis.clarifiedGoal && (
            <ClarifiedGoalCard
              clarified={analysis.clarifiedGoal}
              onApply={() => onApplyClarifiedGoal(analysis.clarifiedGoal!)}
            />
          )}

          {/* Category Suggestion */}
          {analysis.suggestedCategory && (
            <CategoryCard
              category={analysis.suggestedCategory}
              onApply={() => onApplyCategory(analysis.suggestedCategory!)}
            />
          )}

          {/* Related Goals */}
          <RelatedGoalsSection
            relatedGoals={analysis.relatedGoals}
            onView={onViewRelatedGoal}
          />
        </View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    marginTop: 16,
    marginHorizontal: -4,
    overflow: 'hidden',
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 4,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    marginLeft: 8,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  section: {
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    marginLeft: 6,
    fontWeight: '600',
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 4,
  },
  clarityCard: {
    padding: 16,
    borderRadius: 16,
  },
  applyButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
  },
  categoryInfo: {
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 12,
  },
  relatedList: {
    gap: 8,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  relatedInfo: {
    flex: 1,
    marginLeft: 10,
  },
});

export default AIAssistantPanel;
