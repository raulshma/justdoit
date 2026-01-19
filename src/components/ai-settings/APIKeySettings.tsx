import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Text, useTheme, Button, Portal, Modal } from 'react-native-paper';
import { SettingRow } from '../SettingRow';
import { withAlpha } from '../../utils/colorUtils';

interface APIKeySettingsProps {
  apiKey?: string;
  onSave: (apiKey: string) => Promise<void>;
  containerStyle?: object;
}

export function APIKeySettings({ apiKey, onSave, containerStyle }: APIKeySettingsProps) {
  const theme = useTheme();
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  const handleSaveApiKey = useCallback(async () => {
    setShowApiKeyModal(false);
    if (apiKeyInput.trim()) {
      await onSave(apiKeyInput.trim());
    }
    setApiKeyInput('');
  }, [apiKeyInput, onSave]);

  const handleRemoveApiKey = useCallback(async () => {
    setShowApiKeyModal(false);
    await onSave('');
    setApiKeyInput('');
  }, [onSave]);

  const handleOpenModal = () => {
    setApiKeyInput(apiKey || '');
    setShowApiKeyModal(true);
  };

  return (
    <>
      <SettingRow
        icon="key-outline"
        title="OpenRouter API Key"
        subtitle={apiKey ? "••••••••" + apiKey.slice(-4) : "Not configured"}
        onPress={handleOpenModal}
        right={
          <View
            style={[
              styles.smallBadge,
              {
                backgroundColor: apiKey
                  ? theme.colors.primaryContainer
                  : withAlpha(theme.colors.errorContainer, 0.3),
              },
            ]}
          >
            <Text variant="labelMedium" style={{ color: apiKey ? theme.colors.primary : theme.colors.error }}>
              {apiKey ? "Set" : "Required"}
            </Text>
          </View>
        }
      />

      <Portal>
        <Modal
          visible={showApiKeyModal}
          onDismiss={() => {
            setShowApiKeyModal(false);
            setApiKeyInput('');
          }}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            OpenRouter API Key
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 16 }}>
            Get your API key from openrouter.ai
          </Text>
          <TextInput
            value={apiKeyInput}
            onChangeText={setApiKeyInput}
            placeholder="sk-or-..."
            placeholderTextColor={withAlpha(theme.colors.onSurfaceVariant, 0.5)}
            secureTextEntry
            style={[
              styles.apiKeyInput,
              {
                backgroundColor: withAlpha(theme.colors.surfaceVariant, 0.3),
                color: theme.colors.onSurface,
                borderColor: withAlpha(theme.colors.outline, 0.2),
              }
            ]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.modalButtons}>
            {apiKey && (
              <Button 
                mode="text" 
                onPress={handleRemoveApiKey}
                textColor={theme.colors.error}
                style={{ marginRight: 'auto' }}
              >
                Remove
              </Button>
            )}
            <Button mode="text" onPress={() => {
              setShowApiKeyModal(false);
              setApiKeyInput('');
            }}>
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSaveApiKey}
              disabled={!apiKeyInput.trim()}
            >
              Save
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  smallBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalContainer: {
    margin: 20,
    padding: 24,
    borderRadius: 28,
    maxHeight: '80%',
    elevation: 4,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '700',
  },
  apiKeyInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});
