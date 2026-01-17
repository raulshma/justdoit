/**
 * GoalBreakdownModal - AI-powered goal breakdown into subgoals
 * Full-screen modal showing suggested subgoals with timeline and actions
 */
import React, { memo, useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Surface,
  Button,
  IconButton,
  Portal,
  Modal,
  ActivityIndicator,
  Checkbox,
  Chip,
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
import { ThemedIcon } from './ThemedIcon';
import { advancedAIService } from '../services/advancedAIService';
import type { Goal, Category } from '../types';
import type { AIGeneratedSubgoal, GoalBreakdown } from '../types/advancedAITypes';

interface GoalBreakdownModalProps {
  visible: boolean;
  goal: Goal | null;
  categories: Category[];
  onDismiss: () => void;
  onApplySubgoals: (subgoals: AIGeneratedSubgoal[]) => void;
}

/**
 * Format duration in minutes to readable string
 */
const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * Single subgoal item in the breakdown
 */
const SubgoalItem = memo(({
  subgoal,
  index,
  isSelected,
  onToggle,
}: {
  subgoal: AIGeneratedSubgoal;
  index: number;
  isSelected: boolean;
  onToggle: () => void;
}) => {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(300)}>
      <Surface
        style={[
          styles.subgoalItem,
          {
            backgroundColor: isSelected
              ? theme.colors.primaryContainer
              : theme.colors.surface,
            borderColor: isSelected
              ? theme.colors.primary
              : theme.colors.outlineVariant,
          },
        ]}
        elevation={isSelected ? 2 : 1}
      >
        <View style={styles.subgoalHeader}>
          <View style={styles.subgoalOrderBadge}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {index + 1}
            </Text>
          </View>
          <View style={styles.subgoalContent}>
            <View style={styles.subgoalTitleRow}>
              <Text
                variant="titleSmall"
                style={{ flex: 1, color: theme.colors.onSurface }}
              >
                {subgoal.title}
              </Text>
              {subgoal.isMilestone && (
                <Chip compact icon="flag" style={styles.milestoneChip}>
                  Milestone
                </Chip>
              )}
            </View>
            {subgoal.description && (
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
              >
                {subgoal.description}
              </Text>
            )}
            <View style={styles.subgoalMeta}>
              {subgoal.estimatedDuration && (
                <View style={styles.metaItem}>
                  <ThemedIcon name="clock-outline" size={14} themeColor="onSurfaceVariant" />
                  <Text variant="labelSmall" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>
                    {formatDuration(subgoal.estimatedDuration)}
                  </Text>
                </View>
              )}
              {subgoal.dueDateOffset !== undefined && (
                <View style={styles.metaItem}>
                  <ThemedIcon name="calendar-outline" size={14} themeColor="onSurfaceVariant" />
                  <Text variant="labelSmall" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>
                    {subgoal.dueDateOffset >= 0 ? '+' : ''}{subgoal.dueDateOffset} days
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Checkbox
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={onToggle}
          />
        </View>
      </Surface>
    </Animated.View>
  );
});

/**
 * Loading state component
 */
const LoadingState = memo(() => {
  const theme = useTheme();
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text variant="bodyMedium" style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
        AI is analyzing your goal...
      </Text>
      <Text variant="bodySmall" style={{ marginTop: 4, color: theme.colors.onSurfaceVariant }}>
        Breaking it down into actionable steps
      </Text>
    </View>
  );
});

/**
 * Error state component
 */
const ErrorState = memo(({ onRetry }: { onRetry: () => void }) => {
  const theme = useTheme();
  return (
    <View style={styles.errorContainer}>
      <ThemedIcon name="alert-circle-outline" size={48} color={theme.colors.error} />
      <Text variant="bodyMedium" style={{ marginTop: 16, color: theme.colors.error }}>
        Unable to generate breakdown
      </Text>
      <Button mode="outlined" onPress={onRetry} style={{ marginTop: 16 }}>
        Try Again
      </Button>
    </View>
  );
});

/**
 * Main GoalBreakdownModal Component
 */
export const GoalBreakdownModal: React.FC<GoalBreakdownModalProps> = memo(({
  visible,
  goal,
  categories,
  onDismiss,
  onApplySubgoals,
}) => {
  const theme = useTheme();
  const [breakdown, setBreakdown] = useState<GoalBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Load breakdown when modal opens
  useEffect(() => {
    if (visible && goal && !breakdown) {
      loadBreakdown();
    }
  }, [visible, goal]);

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      setBreakdown(null);
      setError(false);
      setSelectedIndices(new Set());
    }
  }, [visible]);

  // Select all by default when breakdown loads
  useEffect(() => {
    if (breakdown) {
      setSelectedIndices(new Set(breakdown.subgoals.map((_, i) => i)));
    }
  }, [breakdown]);

  const loadBreakdown = async () => {
    if (!goal) return;
    
    setIsLoading(true);
    setError(false);
    
    const result = await advancedAIService.breakdownGoal(goal, categories);
    
    if (result) {
      setBreakdown(result);
    } else {
      setError(true);
    }
    
    setIsLoading(false);
  };

  const toggleSubgoal = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (breakdown) {
      setSelectedIndices(new Set(breakdown.subgoals.map((_, i) => i)));
    }
  }, [breakdown]);

  const deselectAll = useCallback(() => {
    setSelectedIndices(new Set());
  }, []);

  const handleApply = useCallback(() => {
    if (!breakdown) return;
    
    const selectedSubgoals = breakdown.subgoals.filter((_, i) => selectedIndices.has(i));
    onApplySubgoals(selectedSubgoals);
    onDismiss();
  }, [breakdown, selectedIndices, onApplySubgoals, onDismiss]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.background }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
          <View style={styles.headerLeft}>
            <ThemedIcon name="puzzle-outline" size={24} themeColor="primary" />
            <View style={{ marginLeft: 12 }}>
              <Text variant="titleMedium">AI Goal Breakdown</Text>
              {goal && (
                <Text
                  variant="bodySmall"
                  numberOfLines={1}
                  style={{ color: theme.colors.onSurfaceVariant, maxWidth: 250 }}
                >
                  {goal.title}
                </Text>
              )}
            </View>
          </View>
          <IconButton icon="close" onPress={onDismiss} size={20} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {isLoading && <LoadingState />}
          
          {error && <ErrorState onRetry={loadBreakdown} />}
          
          {breakdown && !isLoading && !error && (
            <Animated.View entering={FadeIn.duration(300)}>
              {/* Explanation */}
              <Surface
                style={[styles.explanationCard, { backgroundColor: theme.colors.surfaceVariant }]}
                elevation={0}
              >
                <ThemedIcon name="lightbulb-outline" size={20} themeColor="primary" />
                <Text
                  variant="bodySmall"
                  style={[styles.explanationText, { color: theme.colors.onSurfaceVariant }]}
                >
                  {breakdown.explanation}
                </Text>
              </Surface>

              {/* Summary stats */}
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                    {breakdown.subgoals.length}
                  </Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Steps
                  </Text>
                </View>
                {breakdown.totalEstimatedDuration && (
                  <View style={styles.summaryItem}>
                    <Text variant="headlineSmall" style={{ color: theme.colors.tertiary }}>
                      {formatDuration(breakdown.totalEstimatedDuration)}
                    </Text>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Total Time
                    </Text>
                  </View>
                )}
                <View style={styles.summaryItem}>
                  <Text variant="headlineSmall" style={{ color: theme.colors.secondary }}>
                    {breakdown.subgoals.filter((s) => s.isMilestone).length}
                  </Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Milestones
                  </Text>
                </View>
              </View>

              {/* Selection controls */}
              <View style={styles.selectionControls}>
                <Text variant="titleSmall">
                  {selectedIndices.size} of {breakdown.subgoals.length} selected
                </Text>
                <View style={styles.selectionButtons}>
                  <Button compact onPress={selectAll}>Select All</Button>
                  <Button compact onPress={deselectAll}>Clear</Button>
                </View>
              </View>

              {/* Subgoals list */}
              <View style={styles.subgoalsList}>
                {breakdown.subgoals.map((subgoal, index) => (
                  <SubgoalItem
                    key={index}
                    subgoal={subgoal}
                    index={index}
                    isSelected={selectedIndices.has(index)}
                    onToggle={() => toggleSubgoal(index)}
                  />
                ))}
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Actions */}
        {breakdown && !isLoading && !error && (
          <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant }]}>
            <Button mode="outlined" onPress={onDismiss} style={styles.footerButton}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleApply}
              style={styles.footerButton}
              disabled={selectedIndices.size === 0}
              icon="check"
            >
              Add {selectedIndices.size} Subgoal{selectedIndices.size !== 1 ? 's' : ''}
            </Button>
          </View>
        )}
      </Modal>
    </Portal>
  );
});

const styles = StyleSheet.create({
  modalContainer: {
    margin: 16,
    borderRadius: 16,
    height: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  explanationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  explanationText: {
    flex: 1,
    marginLeft: 12,
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  selectionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectionButtons: {
    flexDirection: 'row',
  },
  subgoalsList: {
    gap: 12,
  },
  subgoalItem: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  subgoalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  subgoalOrderBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subgoalContent: {
    flex: 1,
  },
  subgoalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneChip: {
    marginLeft: 8,
  },
  subgoalMeta: {
    flexDirection: 'row',
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default GoalBreakdownModal;
