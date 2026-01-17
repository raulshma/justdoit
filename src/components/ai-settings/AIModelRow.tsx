import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import { SettingRow } from '../SettingRow';

interface AIModelRowProps {
  selectedModel?: string;
  onPress: () => void;
  hasApiKey: boolean;
}

export function AIModelRow({ selectedModel, onPress, hasApiKey }: AIModelRowProps) {
  const theme = useTheme();

  if (!hasApiKey) return null;

  return (
    <SettingRow
      icon="robot-outline"
      title="AI Model"
      subtitle={selectedModel || "Default (Llama 3.3)"}
      onPress={onPress}
      right={
        <View style={[styles.smallBadge, { backgroundColor: theme.colors.secondaryContainer + '50' }]}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSecondaryContainer }}>
            Select
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  smallBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
