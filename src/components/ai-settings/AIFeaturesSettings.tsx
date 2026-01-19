import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Switch, Text } from 'react-native-paper';
import { SettingRow } from '../SettingRow';

interface AIFeaturesSettingsProps {
  smartRemindersEnabled: boolean;
  onSmartRemindersToggle: () => void;
  aiSmartReschedulingEnabled: boolean;
  onSmartReschedulingToggle: () => void;
  aiMotivationalEnabled: boolean;
  onMotivationalToggle: () => void;
  aiPatternDetectionEnabled: boolean;
  onPatternDetectionToggle: () => void;
  aiGoalBreakdownEnabled: boolean;
  onGoalBreakdownToggle: () => void;
  aiGoalCoachEnabled: boolean;
  onGoalCoachToggle: () => void;
  personalityEnabled: boolean;
  onPersonalityToggle: () => void;
  hasApiKey: boolean;
}

export function AIFeaturesSettings({
  smartRemindersEnabled,
  onSmartRemindersToggle,
  aiSmartReschedulingEnabled,
  onSmartReschedulingToggle,
  aiMotivationalEnabled,
  onMotivationalToggle,
  aiPatternDetectionEnabled,
  onPatternDetectionToggle,
  aiGoalBreakdownEnabled,
  onGoalBreakdownToggle,
  aiGoalCoachEnabled,
  onGoalCoachToggle,
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
        icon="calendar-clock"
        title="Smart Rescheduling"
        subtitle="Suggests new dates for overdue goals"
        right={
          <Switch
            value={aiSmartReschedulingEnabled}
            onValueChange={onSmartReschedulingToggle}
            color={theme.colors.primary}
          />
        }
      />
      
      <SettingRow
        icon="message-text-outline"
        title="Motivational Messages"
        subtitle="AI generated motivation on dashboard"
        right={
          <Switch
            value={aiMotivationalEnabled}
            onValueChange={onMotivationalToggle}
            color={theme.colors.primary}
          />
        }
      />
      
      <SettingRow
        icon="chart-timeline-variant"
        title="Pattern Detection"
        subtitle="Analyze habits and suggest improvements"
        right={
          <Switch
            value={aiPatternDetectionEnabled}
            onValueChange={onPatternDetectionToggle}
            color={theme.colors.primary}
          />
        }
      />

      <SettingRow
        icon="format-list-checks"
        title="Goal Breakdown"
        subtitle="Auto-generate subgoals for complex tasks"
        right={
          <Switch
            value={aiGoalBreakdownEnabled}
            onValueChange={onGoalBreakdownToggle}
            color={theme.colors.primary}
          />
        }
      />

      <SettingRow
        icon="account-tie-voice"
        title="AI Goal Coach"
        subtitle="Conversational assistant for goal planning"
        right={
          <Switch
            value={aiGoalCoachEnabled}
            onValueChange={onGoalCoachToggle}
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
