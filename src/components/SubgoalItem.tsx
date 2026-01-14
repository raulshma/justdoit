import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TouchableRipple, useTheme, IconButton } from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import type { Subgoal } from '../types';

interface SubgoalItemProps {
  subgoal: Subgoal;
  onToggleComplete: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  showActions?: boolean;
}

/**
 * SubgoalItem - Displays a single subgoal with checkbox and milestone indicator
 * Requirements: 2.1, 2.3, 2.6
 */
export const SubgoalItem: React.FC<SubgoalItemProps> = ({
  subgoal,
  onToggleComplete,
  onDelete,
  onEdit,
  showActions = true,
}) => {
  const theme = useTheme();
  const checkboxScale = useSharedValue(1);

  const handleToggle = useCallback(() => {
    checkboxScale.value = withSequence(
      withTiming(0.8, { duration: 80 }),
      withSpring(1)
    );
    onToggleComplete(subgoal.id);
  }, [onToggleComplete, subgoal.id]);

  const checkboxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkboxScale.value }],
  }));

  return (
    <View style={styles.container}>
      <TouchableRipple
        onPress={handleToggle}
        borderless
        style={styles.checkboxTouchable}
      >
        <Animated.View style={checkboxStyle}>
          <View
            style={[
              styles.checkbox,
              {
                borderColor: subgoal.isCompleted
                  ? theme.colors.primary
                  : theme.colors.outline,
                backgroundColor: subgoal.isCompleted
                  ? theme.colors.primary
                  : 'transparent',
              },
            ]}
          >
            {subgoal.isCompleted && (
              <ThemedIcon
                name="check"
                size={14}
                themeColor="onPrimary"
              />
            )}
          </View>
        </Animated.View>
      </TouchableRipple>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          {subgoal.isMilestone && (
            <ThemedIcon
              name="flag"
              size={14}
              themeColor="tertiary"
              style={styles.milestoneIcon}
            />
          )}
          <Text
            style={[
              styles.title,
              {
                color: subgoal.isCompleted
                  ? theme.colors.outline
                  : theme.colors.onSurface,
                textDecorationLine: subgoal.isCompleted ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={2}
          >
            {subgoal.title}
          </Text>
        </View>
        {subgoal.description && (
          <Text
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={1}
          >
            {subgoal.description}
          </Text>
        )}
      </View>

      {showActions && (
        <View style={styles.actions}>
          {onEdit && (
            <IconButton
              icon="pencil-outline"
              size={18}
              iconColor={theme.colors.onSurfaceVariant}
              onPress={() => onEdit(subgoal.id)}
              style={styles.actionButton}
            />
          )}
          {onDelete && (
            <IconButton
              icon="close"
              size={18}
              iconColor={theme.colors.error}
              onPress={() => onDelete(subgoal.id)}
              style={styles.actionButton}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  checkboxTouchable: {
    borderRadius: 12,
    padding: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneIcon: {
    marginRight: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  description: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    margin: 0,
  },
});

export default SubgoalItem;
