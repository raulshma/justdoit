import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconButton, Portal, Snackbar, Surface, Text, useTheme } from 'react-native-paper';

import type { AppSettings } from '../types';
import { useSettings } from '../context/SettingsContext';
import { calendarService } from '../services';
import { AdvancedSettingRow } from '../components/settings/AdvancedSettingRow';

/**
 * SmartFeaturesSettingsScreen
 *
 * Extracted from SettingsScreen. Functionality is preserved.
 */
export function SmartFeaturesSettingsScreen() {
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

  const handleFocusModeToggle = useCallback(async () => {
    const newEnabled = !settings.focusModeEnabled;
    await saveSettings({ focusModeEnabled: newEnabled }, newEnabled ? 'Focus Mode ON' : 'Focus Mode OFF');
  }, [settings, saveSettings]);

  const handleCarryForwardToggle = useCallback(async () => {
    const newEnabled = !settings.carryForwardEnabled;
    await saveSettings({ carryForwardEnabled: newEnabled }, newEnabled ? 'Carry Forward ON' : 'Carry Forward OFF');
  }, [settings, saveSettings]);

  const handleCalendarToggle = useCallback(async () => {
    const newEnabled = !settings.calendarIntegrationEnabled;

    if (newEnabled) {
      const status = await calendarService.requestPermissions();
      if (status !== 'granted') {
        setSnackbarMessage('Calendar permission denied');
        setSnackbarVisible(true);
        return;
      }
      calendarService.clearCache();
    }

    await saveSettings({ calendarIntegrationEnabled: newEnabled }, newEnabled ? 'Calendar ON' : 'Calendar OFF');
  }, [settings, saveSettings]);

  const handleGamificationToggle = useCallback(async () => {
    const newEnabled = !settings.gamificationEnabled;
    await saveSettings({ gamificationEnabled: newEnabled }, newEnabled ? 'Gamification ON' : 'Gamification OFF');
  }, [settings, saveSettings]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
            <View style={styles.headerText}>
              <Text variant="headlineMedium" style={styles.headerTitle}>
                Smart Features
              </Text>
              <Text variant="bodyLarge" style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Productivity helpers and integrations
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
            SMART FEATURES
          </Text>
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <AdvancedSettingRow
              icon="target"
              title="Focus Mode"
              subtitle="Show only top 3 daily priorities"
              switchValue={settings.focusModeEnabled}
              onSwitchValueChange={handleFocusModeToggle}
            />
            <AdvancedSettingRow
              icon="arrow-right-bold"
              title="Carry Forward"
              subtitle="Auto-move incomplete goals to today"
              switchValue={settings.carryForwardEnabled}
              onSwitchValueChange={handleCarryForwardToggle}
            />
            <AdvancedSettingRow
              icon="calendar-sync"
              title="Calendar Integration"
              subtitle="Show calendar events on goals page"
              switchValue={settings.calendarIntegrationEnabled}
              onSwitchValueChange={handleCalendarToggle}
            />
            <AdvancedSettingRow
              icon="trophy-outline"
              title="Gamification"
              subtitle="XP, badges, challenges & personal bests"
              isLast={true}
              switchValue={settings.gamificationEnabled}
              onSwitchValueChange={handleGamificationToggle}
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
});

export default SmartFeaturesSettingsScreen;
