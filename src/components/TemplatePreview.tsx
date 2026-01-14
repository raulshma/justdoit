import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Divider } from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';
import type { GoalTemplate, Category, TemplateSubgoal } from '../types';

interface TemplatePreviewProps {
  template: GoalTemplate;
  category?: Category;
}

/**
 * TemplateSubgoalItem - Displays a single subgoal in the preview
 */
const TemplateSubgoalItem: React.FC<{ subgoal: TemplateSubgoal }> = ({ subgoal }) => {
  const theme = useTheme();

  return (
    <View style={styles.subgoalItem}>
      <View style={[styles.checkbox, { borderColor: theme.colors.outline }]}>
        {/* Empty checkbox to show it's a template */}
      </View>
      <Text
        variant="bodyMedium"
        style={[styles.subgoalTitle, { color: theme.colors.onSurface }]}
        numberOfLines={2}
      >
        {subgoal.title}
      </Text>
      {subgoal.isMilestone && (
        <View style={[styles.milestoneBadge, { backgroundColor: theme.colors.tertiaryContainer }]}>
          <ThemedIcon name="flag" size={12} themeColor="tertiary" />
        </View>
      )}
    </View>
  );
};

/**
 * TemplatePreview - Shows a detailed preview of a template with its subgoals
 * Requirements: 3.1, 3.2
 */
export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  category,
}) => {
  const theme = useTheme();

  const sortedSubgoals = [...template.subgoals].sort((a, b) => a.order - b.order);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text
          variant="headlineSmall"
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          {template.name}
        </Text>
        
        {template.isBuiltIn && (
          <View style={[styles.builtInBadge, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={[styles.builtInText, { color: theme.colors.primary }]}>
              BUILT-IN
            </Text>
          </View>
        )}
      </View>

      {/* Category */}
      {category && (
        <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
          <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
          <Text style={[styles.categoryText, { color: category.color }]}>
            {category.name}
          </Text>
        </View>
      )}

      {/* Description */}
      {template.description && (
        <Text
          variant="bodyMedium"
          style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
        >
          {template.description}
        </Text>
      )}

      <Divider style={[styles.divider, { backgroundColor: theme.colors.outline + '30' }]} />

      {/* Subgoals Section */}
      <View style={styles.subgoalsSection}>
        <View style={styles.subgoalsHeader}>
          <ThemedIcon name="format-list-checks" size={20} themeColor="primary" />
          <Text
            variant="titleSmall"
            style={[styles.subgoalsTitle, { color: theme.colors.onSurface }]}
          >
            Steps ({template.subgoals.length})
          </Text>
        </View>

        <ScrollView 
          style={styles.subgoalsList}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {sortedSubgoals.map((subgoal, index) => (
            <TemplateSubgoalItem key={index} subgoal={subgoal} />
          ))}
        </ScrollView>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statItem, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {template.subgoals.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
            Steps
          </Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text style={[styles.statValue, { color: theme.colors.tertiary }]}>
            {template.subgoals.filter(s => s.isMilestone).length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
            Milestones
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontWeight: '700',
    flex: 1,
  },
  builtInBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  builtInText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    lineHeight: 22,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  subgoalsSection: {
    flex: 1,
  },
  subgoalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  subgoalsTitle: {
    fontWeight: '600',
  },
  subgoalsList: {
    maxHeight: 200,
  },
  subgoalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  subgoalTitle: {
    flex: 1,
  },
  milestoneBadge: {
    padding: 4,
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default TemplatePreview;
