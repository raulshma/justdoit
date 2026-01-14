import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';
import type { GoalTemplate, Category } from '../types';

interface TemplateCardProps {
  template: GoalTemplate;
  category?: Category;
  onPress: (templateId: string) => void;
  onLongPress?: (templateId: string) => void;
}

/**
 * TemplateCard - Displays a goal template with its details
 * Requirements: 3.1, 3.2
 */
export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  category,
  onPress,
  onLongPress,
}) => {
  const theme = useTheme();

  const subgoalCount = template.subgoals.length;
  const milestoneCount = template.subgoals.filter(s => s.isMilestone).length;

  return (
    <TouchableOpacity
      onPress={() => onPress(template.id)}
      onLongPress={() => onLongPress?.(template.id)}
      activeOpacity={0.7}
    >
      <Surface
        style={[
          styles.surface,
          { backgroundColor: theme.colors.surface },
        ]}
        elevation={0}
      >
        <View style={styles.content}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text
                variant="titleMedium"
                style={[styles.title, { color: theme.colors.onSurface }]}
                numberOfLines={1}
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
            <ThemedIcon name="chevron-right" size={24} themeColor="onSurfaceVariant" />
          </View>

          {/* Description */}
          {template.description && (
            <Text
              variant="bodySmall"
              style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={2}
            >
              {template.description}
            </Text>
          )}

          {/* Footer Row */}
          <View style={styles.footerRow}>
            {/* Category Badge */}
            {category && (
              <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
                <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                <Text style={[styles.categoryText, { color: category.color }]}>
                  {category.name}
                </Text>
              </View>
            )}

            {/* Subgoal Count */}
            <View style={styles.metaItem}>
              <ThemedIcon name="format-list-checks" size={14} themeColor="onSurfaceVariant" />
              <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                {subgoalCount} step{subgoalCount !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Milestone Count */}
            {milestoneCount > 0 && (
              <View style={styles.metaItem}>
                <ThemedIcon name="flag" size={14} themeColor="tertiary" />
                <Text style={[styles.metaText, { color: theme.colors.tertiary }]}>
                  {milestoneCount} milestone{milestoneCount !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  surface: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  builtInBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  builtInText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  description: {
    lineHeight: 18,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default TemplateCard;
