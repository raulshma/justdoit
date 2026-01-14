import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, IconButton, useTheme, Checkbox, Text } from 'react-native-paper';

interface AddSubgoalInputProps {
  onAdd: (title: string, isMilestone: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * AddSubgoalInput - Input component for adding new subgoals
 * Requirements: 2.1
 */
export const AddSubgoalInput: React.FC<AddSubgoalInputProps> = ({
  onAdd,
  placeholder = 'Add a step...',
  disabled = false,
}) => {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [isMilestone, setIsMilestone] = useState(false);

  const handleAdd = useCallback(() => {
    const trimmedTitle = title.trim();
    if (trimmedTitle) {
      onAdd(trimmedTitle, isMilestone);
      setTitle('');
      setIsMilestone(false);
    }
  }, [title, isMilestone, onAdd]);

  const handleSubmitEditing = useCallback(() => {
    handleAdd();
  }, [handleAdd]);

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          mode="outlined"
          value={title}
          onChangeText={setTitle}
          placeholder={placeholder}
          style={styles.input}
          outlineStyle={styles.inputOutline}
          dense
          disabled={disabled}
          onSubmitEditing={handleSubmitEditing}
          returnKeyType="done"
          maxLength={200}
        />
        <IconButton
          icon="plus"
          mode="contained"
          size={20}
          onPress={handleAdd}
          disabled={disabled || !title.trim()}
          style={[
            styles.addButton,
            { backgroundColor: theme.colors.primary },
          ]}
          iconColor={theme.colors.onPrimary}
        />
      </View>
      <View style={styles.optionsRow}>
        <Checkbox.Item
          label="Mark as milestone"
          status={isMilestone ? 'checked' : 'unchecked'}
          onPress={() => setIsMilestone(!isMilestone)}
          style={styles.checkbox}
          labelStyle={[styles.checkboxLabel, { color: theme.colors.onSurfaceVariant }]}
          disabled={disabled}
          mode="android"
          position="leading"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  inputOutline: {
    borderRadius: 12,
  },
  addButton: {
    margin: 0,
    borderRadius: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  checkbox: {
    paddingLeft: 0,
    paddingVertical: 0,
  },
  checkboxLabel: {
    fontSize: 12,
  },
});

export default AddSubgoalInput;
