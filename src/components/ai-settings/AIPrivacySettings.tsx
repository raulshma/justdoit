import React from 'react';
import { useTheme, Switch } from 'react-native-paper';
import { SettingRow } from '../SettingRow';

interface AIPrivacySettingsProps {
  piiEnabled: boolean;
  onPiiToggle: () => void;
  isLast?: boolean;
}

export function AIPrivacySettings({ piiEnabled, onPiiToggle, isLast = false }: AIPrivacySettingsProps) {
  const theme = useTheme();

  return (
    <SettingRow
      icon="shield-check-outline"
      title="PII Anonymization"
      subtitle="Remove personal data before AI processing"
      isLast={isLast}
      right={
        <Switch
          value={piiEnabled}
          onValueChange={onPiiToggle}
          color={theme.colors.primary}
        />
      }
    />
  );
}
