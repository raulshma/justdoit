import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, Divider, Portal, Dialog, Button, TextInput } from 'react-native-paper';
import { SubgoalItem } from './SubgoalItem';
import { AddSubgoalInput } from './AddSubgoalInput';
import { ProgressIndicator } from './ProgressIndicator';
import type { Subgoal, SubgoalProgress } from '../types';

interface SubgoalListProps {
  subgoals: Subgoal[];
  progress: SubgoalProgress;
  onToggleComplete: (id: string) => void;
  onAdd: (title: string, isMilestone: boolean) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string, title: string, isMilestone: boolean) => void;
  disabled?: boolean;
  showAddInput?: boolean;
  maxSubgoals?: number;
}

/**
 * SubgoalList - Displays a list of subgoals with progress and add functionality
 * Requirements: 2.1, 2.3, 2.6
 */
export const SubgoalList: React.FC<SubgoalListProps> = ({
  subgoals,
  progress,
  onToggleComplete,
  onAdd,
  onDelete,
  onEdit,
  disabled = false,
  showAddInput = true,
  maxSubgoals = 20,
}) => {
  const theme = useTheme();
  const [editingSubgoal, setEditingSubgoal] = useState<Subgoal | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editIsMilestone, setEditIsMilestone] = useState(false);

  const canAddMore = subgoals.length < maxSubgoals;

  const handleEdit = useCallback((id: string) => {
    const subgoal = subgoals.find(s => s.id === id);
    if (subgoal) {
      setEditingSubgoal(subgoal);
      setEditTitle(subgoal.title);
      setEditIsMilestone(subgoal.isMilestone);
    }
  }, [subgoals]);

  const handleSaveEdit = useCallback(() => {
    if (editingSubgoal && onEdit && editTitle.trim()) {
      onEdit(editingSubgoal.id, editTitle.trim(), editIsMilestone);
      setEditingSubgoal(null);
      setEditTitle('');
      setEditIsMilestone(false);
    }
  }, [editingSubgoal, editTitle, editIsMilestone, onEdit]);

  const handleCancelEdit = useCallback(() => {
    setEditingSubgoal(null);
    setEditTitle('');
    setEditIsMilestone(false);
  }, []);

  const renderSubgoal = useCallback(({ item }: { item: Subgoal }) => (
    <SubgoalItem
      subgoal={item}
      onToggleComplete={onToggleComplete}
      onDelete={onDelete}
      onEdit={onEdit ? handleEdit : undefined}
      showActions={!disabled}
    />
  ), [onToggleComplete, onDelete, onEdit, handleEdit, disabled]);

  const keyExtractor = useCallback((item: Subgoal) => item.id, []);

  const ListHeader = useCallback(() => (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
        Steps
      </Text>
      {subgoals.length > 0 && (
        <ProgressIndicator progress={progress} size="small" showLabel={false} />
      )}
    </View>
  ), [theme.colors.onSurface, subgoals.length, progress]);


  const ListEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
        No steps added yet
      </Text>
    </View>
  ), [theme.colors.onSurfaceVariant]);

  const ListFooter = useCallback(() => {
    if (!showAddInput) return null;
    
    return (
      <View style={styles.footer}>
        {canAddMore ? (
          <AddSubgoalInput onAdd={onAdd} disabled={disabled} />
        ) : (
          <Text style={[styles.limitText, { color: theme.colors.onSurfaceVariant }]}>
            Maximum {maxSubgoals} steps reached
          </Text>
        )}
      </View>
    );
  }, [showAddInput, canAddMore, onAdd, disabled, maxSubgoals, theme.colors.onSurfaceVariant]);

  return (
    <View style={styles.container}>
      <ListHeader />
      
      {subgoals.length > 0 && (
        <View style={[styles.progressContainer, { marginBottom: 12 }]}>
          <ProgressIndicator progress={progress} size="medium" showPercentage />
        </View>
      )}

      <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />

      {subgoals.length === 0 ? (
        <ListEmpty />
      ) : (
        <View style={styles.listContainer}>
          {subgoals.map((item) => (
            <View key={item.id}>
              {renderSubgoal({ item })}
              <Divider style={{ backgroundColor: theme.colors.outlineVariant, marginLeft: 38 }} />
            </View>
          ))}
        </View>
      )}

      <ListFooter />

      {/* Edit Dialog */}
      <Portal>
        <Dialog visible={!!editingSubgoal} onDismiss={handleCancelEdit}>
          <Dialog.Title>Edit Step</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Step title"
              maxLength={200}
              style={styles.editInput}
            />
            <View style={styles.editCheckboxRow}>
              <Button
                mode={editIsMilestone ? 'contained' : 'outlined'}
                onPress={() => setEditIsMilestone(!editIsMilestone)}
                icon={editIsMilestone ? 'flag' : 'flag-outline'}
                compact
              >
                Milestone
              </Button>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCancelEdit}>Cancel</Button>
            <Button onPress={handleSaveEdit} disabled={!editTitle.trim()}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 8,
  },
  listContainer: {
    marginTop: 8,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 12,
  },
  limitText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  editInput: {
    marginBottom: 12,
  },
  editCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default SubgoalList;
