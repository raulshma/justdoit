import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Icon,
  IconButton,
  Portal,
  Snackbar,
  Surface,
  Text,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';

import type { AppSettings } from '../types';
import { useSettings } from '../context/SettingsContext';
import { ambientSoundService } from '../services';
import { AdvancedSettingRow } from '../components/settings/AdvancedSettingRow';

const FOCUS_SOUNDS = ['rain', 'forest', 'cafe', 'waves'] as const;
const FOCUS_SOUND_META: Record<(typeof FOCUS_SOUNDS)[number], { name: string; icon: string }> = {
  rain: { name: 'Rain', icon: 'weather-rainy' },
  forest: { name: 'Forest', icon: 'tree' },
  cafe: { name: 'Cafe', icon: 'coffee' },
  waves: { name: 'Waves', icon: 'wave' },
};

/**
 * FocusTimerSettingsScreen
 *
 * Extracted from SettingsScreen. Functionality is preserved.
 */
export function FocusTimerSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const snackbarBottom = insets.bottom + 16;

  const saveSettings = useCallback(
    async (updates: Partial<AppSettings>, message: string) => {
      try {
        await updateSettings(updates);
        setSnackbarMessage(message);
        setSnackbarVisible(true);
      } catch (error) {
        console.error('Failed to save settings:', error);
        setSnackbarMessage('Error saving settings');
        setSnackbarVisible(true);
      }
    },
    [updateSettings]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
            <View style={styles.headerText}>
              <Text variant="headlineMedium" style={styles.headerTitle}>
                Focus Timer
              </Text>
              <Text variant="bodyLarge" style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Session length, breaks, and audio
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
            FOCUS TIMER
          </Text>
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <AdvancedSettingRow
              icon="timer-sand"
              title="Work Duration"
              subtitle={`${settings.focusWorkDuration} minutes per session`}
              right={
                <View style={styles.durationControls}>
                  <TouchableRipple
                    onPress={() =>
                      settings.focusWorkDuration > 15 &&
                      saveSettings({ focusWorkDuration: settings.focusWorkDuration - 5 }, 'Work duration updated')
                    }
                    style={[styles.durationButton, { backgroundColor: theme.colors.surfaceVariant }]}
                    borderless
                  >
                    <Icon source="minus" size={18} color={theme.colors.onSurfaceVariant} />
                  </TouchableRipple>
                  <Text variant="titleMedium" style={{ color: theme.colors.primary, minWidth: 32, textAlign: 'center' }}>
                    {settings.focusWorkDuration}
                  </Text>
                  <TouchableRipple
                    onPress={() =>
                      settings.focusWorkDuration < 60 &&
                      saveSettings({ focusWorkDuration: settings.focusWorkDuration + 5 }, 'Work duration updated')
                    }
                    style={[styles.durationButton, { backgroundColor: theme.colors.surfaceVariant }]}
                    borderless
                  >
                    <Icon source="plus" size={18} color={theme.colors.onSurfaceVariant} />
                  </TouchableRipple>
                </View>
              }
            />

            <AdvancedSettingRow
              icon="coffee-outline"
              title="Short Break"
              subtitle={`${settings.focusShortBreakDuration} minutes`}
              right={
                <View style={styles.durationControls}>
                  <TouchableRipple
                    onPress={() =>
                      settings.focusShortBreakDuration > 3 &&
                      saveSettings(
                        { focusShortBreakDuration: settings.focusShortBreakDuration - 1 },
                        'Break duration updated'
                      )
                    }
                    style={[styles.durationButton, { backgroundColor: theme.colors.surfaceVariant }]}
                    borderless
                  >
                    <Icon source="minus" size={18} color={theme.colors.onSurfaceVariant} />
                  </TouchableRipple>
                  <Text variant="titleMedium" style={{ color: theme.colors.primary, minWidth: 32, textAlign: 'center' }}>
                    {settings.focusShortBreakDuration}
                  </Text>
                  <TouchableRipple
                    onPress={() =>
                      settings.focusShortBreakDuration < 15 &&
                      saveSettings(
                        { focusShortBreakDuration: settings.focusShortBreakDuration + 1 },
                        'Break duration updated'
                      )
                    }
                    style={[styles.durationButton, { backgroundColor: theme.colors.surfaceVariant }]}
                    borderless
                  >
                    <Icon source="plus" size={18} color={theme.colors.onSurfaceVariant} />
                  </TouchableRipple>
                </View>
              }
            />

            <AdvancedSettingRow
              icon="bell-ring-outline"
              title="Break Reminders"
              subtitle="Get notified when breaks end"
              switchValue={settings.focusBreakRemindersEnabled}
              onSwitchValueChange={() =>
                saveSettings(
                  { focusBreakRemindersEnabled: !settings.focusBreakRemindersEnabled },
                  settings.focusBreakRemindersEnabled ? 'Break reminders OFF' : 'Break reminders ON'
                )
              }
            />

            <AdvancedSettingRow
              icon="music-note"
              title="Ambient Sounds"
              subtitle="Background audio during focus"
              switchValue={settings.focusAmbientSoundEnabled}
              onSwitchValueChange={() =>
                saveSettings(
                  { focusAmbientSoundEnabled: !settings.focusAmbientSoundEnabled },
                  settings.focusAmbientSoundEnabled ? 'Ambient sounds OFF' : 'Ambient sounds ON'
                )
              }
            />

            {settings.focusAmbientSoundEnabled && (
              <View style={styles.soundOptionsContainer}>
                {FOCUS_SOUNDS.map((sound) => {
                  const meta = FOCUS_SOUND_META[sound];
                  const isSelected = settings.focusAmbientSound === sound;
                  return (
                    <TouchableRipple
                      key={sound}
                      onPress={() => {
                        saveSettings({ focusAmbientSound: sound }, `Sound: ${meta.name}`);
                        ambientSoundService.playPreview(sound);
                      }}
                      style={[
                        styles.soundOption,
                        {
                          backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                          borderColor: isSelected ? theme.colors.primary : 'transparent',
                          borderWidth: isSelected ? 2 : 0,
                        },
                      ]}
                      borderless
                    >
                      <View style={styles.soundOptionContent}>
                        <Icon
                          source={meta.icon}
                          size={20}
                          color={isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant}
                        />
                        <Text
                          variant="labelMedium"
                          style={{
                            color: isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant,
                            marginTop: 4,
                            fontWeight: isSelected ? '600' : '400',
                          }}
                        >
                          {meta.name}
                        </Text>
                        {isSelected && <Icon source="check" size={12} color={theme.colors.primary} />}
                      </View>
                    </TouchableRipple>
                  );
                })}
              </View>
            )}

            <AdvancedSettingRow
              icon="check-circle-outline"
              title="Auto-Complete Goals"
              subtitle="Complete goals after focus sessions"
              isLast={true}
              switchValue={settings.focusAutoCompleteEnabled}
              onSwitchValueChange={() =>
                saveSettings(
                  { focusAutoCompleteEnabled: !settings.focusAutoCompleteEnabled },
                  settings.focusAutoCompleteEnabled ? 'Auto-complete OFF' : 'Auto-complete ON'
                )
              }
            />
          </Surface>
        </View>

        <View style={styles.footerSpacing} />
      </ScrollView>

      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={2000}
          style={[styles.snackbar, { marginBottom: snackbarBottom }]}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
    fontSize: 28,
  },
  headerSubtitle: {
    opacity: 0.6,
    marginTop: 4,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
    marginLeft: 8,
    fontWeight: '700',
    letterSpacing: 2,
    fontSize: 11,
    opacity: 0.6,
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
  },
  footerSpacing: {
    height: 40,
  },
  snackbar: {
    zIndex: 1200,
    elevation: 12,
  },

  // Duration controls
  durationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sound options
  soundOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  soundOption: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  soundOptionContent: {
    alignItems: 'center',
    gap: 2,
  },
});

export default FocusTimerSettingsScreen;
