import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Switch, Text } from 'react-native-paper';
import { SettingRow } from '../SettingRow';

interface AIFeaturesSettingsProps {
  smartRemindersEnabled: boolean;
  onSmartRemindersToggle: () => void;
  personalityEnabled: boolean;
  onPersonalityToggle: () => void;
  hasApiKey: boolean;
}

export function AIFeaturesSettings({
  smartRemindersEnabled,
  onSmartRemindersToggle,
  personalityEnabled,
  onPersonalityToggle,
  hasApiKey
}: AIFeaturesSettingsProps) {
  const theme = useTheme();

  if (!hasApiKey) return null;

  return (
    <>
      <SettingRow
        icon="brain"
        title="Smart Reminders"
        subtitle="AI suggests optimal reminder times"
        right={
          <Switch
            value={smartRemindersEnabled}
            onValueChange={onSmartRemindersToggle}
            color={theme.colors.primary}
          />
        }
      />
      <SettingRow
        icon="account-heart-outline"
        title="Personality Insights"
        subtitle="Track patterns and derive traits"
        right={
          <Switch
            value={personalityEnabled}
            onValueChange={onPersonalityToggle}
            color={theme.colors.primary}
          />
        }
      />
    </>
  );
}
