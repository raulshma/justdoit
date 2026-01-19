import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, StyleSheet, ScrollView, LayoutAnimation } from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Text,
  useTheme,
  Switch,
  Button,
  Portal,
  Modal,
  Snackbar,
  Icon,
  Surface,
  TouchableRipple,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import type { AppSettings, ColorPalette } from '../types';
import { notificationService } from '../services';
import { colorPaletteInfoList, themeMoods, getPalettesByMood } from '../theme/colors';
import type { ThemeMood } from '../types/settings';
import { useSettings } from '../context/SettingsContext';
import { AdvancedSettingRow } from '../components/settings/AdvancedSettingRow';

/**
 * Generate time options for daily reminder
 */
const generateTimeOptions = (): { value: string; label: string }[] => {
  const options: { value: string; label: string }[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (const minute of [0, 30]) {
      const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const date = new Date();
      date.setHours(hour, minute, 0, 0);
      const label = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      options.push({ value, label });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

/**
 * Format time for display
 */
const formatTimeDisplay = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Color Palette Item Component - Novel Design
 * Floating card with focused state
 * Memoized for performance
 */
const ColorPaletteItem = memo(function ColorPaletteItem({
  paletteId,
  colors,
  isSelected,
  onSelect,
  name,
}: {
  paletteId: string;
  colors: string[];
  isSelected: boolean;
  onSelect: (paletteId: string) => void;
  name: string;
}) {
  const theme = useTheme();
  const handlePress = useCallback(() => onSelect(paletteId), [onSelect, paletteId]);

  return (
    <TouchableRipple
      onPress={handlePress}
      style={[
        styles.paletteItem,
        {
          borderColor: isSelected ? theme.colors.primary : 'transparent',
          backgroundColor: isSelected ? theme.colors.primaryContainer + '30' : theme.colors.surfaceVariant,
          borderWidth: isSelected ? 2 : 0,
        }
      ]}
      borderless
    >
      <View style={styles.paletteContent}>
        <View style={styles.paletteHeader}>
          <Text
            variant="labelLarge"
            style={[
              { color: isSelected ? theme.colors.primary : theme.colors.onSurface },
              isSelected && styles.selectedLabel
            ]}
          >
            {name}
          </Text>
          {isSelected && (
            <Surface style={{ borderRadius: 10, padding: 2, backgroundColor: theme.colors.primary }} elevation={0}>
              <Icon source="check" size={12} color={theme.colors.onPrimary} />
            </Surface>
          )}
        </View>
        
        <View style={styles.colorSwatchesContainer}>
          {colors.slice(0, 4).map((color, index) => (
            <View
              key={index}
              style={[
                styles.colorSwatch,
                { backgroundColor: color, zIndex: 10 - index },
                index > 0 && { marginLeft: -10 } // Tighter overlap
              ]}
            />
          ))}
        </View>
      </View>
    </TouchableRipple>
  );
});

/**
 * Custom spring animation config for smooth expand/collapse
 */
const springAnimation = {
  duration: 300,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.spring,
    springDamping: 0.85,
  },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

/**
 * SettingsScreen - High Fidelity Novel Design
 */
export function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings, updateSettings, setDailyReminderTime } = useSettings();
  const insets = useSafeAreaInsets();
  
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [themeExpanded, setThemeExpanded] = useState(false);
  const tabBarHeight = settings.showTabBarLabels ? 80 : 64;
  const tabBarBottomPadding = insets.bottom + 12;
  const snackbarBottom = tabBarHeight + tabBarBottomPadding + 8;

  // Toggle theme section with smooth animation
  const toggleThemeSection = useCallback(() => {
    LayoutAnimation.configureNext(springAnimation);
    setThemeExpanded(prev => !prev);
  }, []);

  // Memoize the current palette info for display
  const currentPaletteInfo = useMemo(() => {
    return colorPaletteInfoList.find(p => p.id === settings.colorPalette);
  }, [settings.colorPalette]);

  const palettesByMood = useMemo(() => {
    // Avoid recomputing palette grouping on every render when theme accordion is open
    return themeMoods.map((mood) => ({
      mood,
      palettes: getPalettesByMood(mood.id),
    }));
  }, []);

  // -- Actions --

  const saveSettings = useCallback(async (updates: Partial<AppSettings>, message: string) => {
    try {
      await updateSettings(updates);
      setSnackbarMessage(message);
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSnackbarMessage('Error saving settings');
      setSnackbarVisible(true);
    }
  }, [updateSettings]);

  const handleNotificationsToggle = useCallback(async (value?: boolean) => {
    const newEnabled = typeof value === 'boolean' ? value : !settings.notificationsEnabled;

    if (newEnabled) {
      const granted = await notificationService.requestPermissions();
      if (!granted) {
        setSnackbarMessage('Permission denied');
        setSnackbarVisible(true);
        return;
      }
    }

    // Persist the user choice even if scheduling fails on a specific device/config.
    await saveSettings(
      { notificationsEnabled: newEnabled },
      newEnabled ? 'Notifications ON' : 'Notifications OFF'
    );

    try {
      if (!newEnabled) {
        await notificationService.cancelAllReminders();
      } else if (settings.dailyReminderEnabled) {
        await notificationService.scheduleDailyPlanningReminder(settings.dailyReminderTime);
      }
    } catch (error) {
      console.warn('Notification scheduling update failed:', error);
      setSnackbarMessage('Saved, but scheduling failed on this device');
      setSnackbarVisible(true);
    }
  }, [settings, saveSettings]);

  const handleDailyReminderToggle = useCallback(async (value?: boolean) => {
    const newEnabled = typeof value === 'boolean' ? value : !settings.dailyReminderEnabled;

    // Persist first so the UI reliably reflects the user's intent.
    await saveSettings({ dailyReminderEnabled: newEnabled }, newEnabled ? 'Reminder ON' : 'Reminder OFF');

    try {
      if (newEnabled && settings.notificationsEnabled) {
        await notificationService.scheduleDailyPlanningReminder(settings.dailyReminderTime);
      } else {
        await notificationService.cancelDailyPlanningReminder();
      }
    } catch (error) {
      console.warn('Daily reminder scheduling update failed:', error);
      setSnackbarMessage('Reminder saved, but scheduling failed');
      setSnackbarVisible(true);
    }
  }, [settings, saveSettings]);

  const handleTimeSelect = useCallback(async (time: string) => {
    setShowTimePicker(false);
    try {
      await setDailyReminderTime(time);
      setSnackbarMessage(`Time set to ${formatTimeDisplay(time)}`);
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Failed to set time:', error);
      // Even if scheduling failed, the setting might have been saved.
      // We'll show a generic error but the UI should update via context
      setSnackbarMessage('Note: Reminder saved but scheduling failed');
      setSnackbarVisible(true);
    }
  }, [setDailyReminderTime]);

  const handleDarkModeToggle = useCallback(async () => {
    const newEnabled = !settings.darkModeEnabled;
    await saveSettings({ darkModeEnabled: newEnabled }, newEnabled ? 'Dark Mode ON' : 'Light Mode ON');
  }, [settings, saveSettings]);

  const handleTabBarLabelsToggle = useCallback(async () => {
    const newEnabled = !settings.showTabBarLabels;
    await saveSettings({ showTabBarLabels: newEnabled }, newEnabled ? 'Tab Labels ON' : 'Tab Labels OFF');
  }, [settings, saveSettings]);

  const handleMinimalGoalsToggle = useCallback(async () => {
    const newEnabled = !settings.minimalGoalsView;
    await saveSettings({ minimalGoalsView: newEnabled }, newEnabled ? 'Minimal View ON' : 'Minimal View OFF');
  }, [settings, saveSettings]);

  const handleColorPaletteChange = useCallback(async (palette: ColorPalette) => {
    await saveSettings({ colorPalette: palette }, 'Theme Updated');
  }, [saveSettings]);

  const handleSelectPalette = useCallback((paletteId: string) => {
    // keep ColorPaletteItem props stable
    void handleColorPaletteChange(paletteId as ColorPalette);
  }, [handleColorPaletteChange]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Settings
          </Text>
          <Text variant="bodyLarge" style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Customize your experience
          </Text>
        </View>

        {/* Notifications Group */}
        <View style={styles.sectionContainer}>
          <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
            NOTIFICATIONS
          </Text>
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <AdvancedSettingRow
              icon="bell-ring-outline"
              title="Notifications"
              subtitle="Get updates and daily reminders"
              isLast={!settings.notificationsEnabled}
              switchValue={settings.notificationsEnabled}
              onSwitchValueChange={handleNotificationsToggle}
            />
            {settings.notificationsEnabled && (
              <>
                <AdvancedSettingRow
                  icon="calendar-check-outline"
                  title="Daily Planner"
                  subtitle="Reminder to plan your day"
                  disabled={!settings.notificationsEnabled}
                  switchValue={settings.dailyReminderEnabled}
                  onSwitchValueChange={handleDailyReminderToggle}
                  switchDisabled={!settings.notificationsEnabled}
                />
                {settings.dailyReminderEnabled && (
                  <AdvancedSettingRow
                    icon="clock-time-four-outline"
                    title="Reminder Time"
                    subtitle={formatTimeDisplay(settings.dailyReminderTime)}
                    disabled={!settings.notificationsEnabled}
                    onPress={() => setShowTimePicker(true)}
                    isLast={true}
                    badgeText="Edit"
                  />
                )}
              </>
            )}
          </Surface>
        </View>

        {/* Appearance Group */}
        <View style={styles.sectionContainer}>
          <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
            APPEARANCE
          </Text>
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <AdvancedSettingRow
              icon="theme-light-dark"
              title="Dark Mode"
              subtitle="Easier on the eyes at night"
              switchValue={settings.darkModeEnabled}
              onSwitchValueChange={handleDarkModeToggle}
            />
            <AdvancedSettingRow
              icon="format-text"
              title="Tab Bar Labels"
              subtitle="Show text labels below icons"
              switchValue={settings.showTabBarLabels}
              onSwitchValueChange={handleTabBarLabelsToggle}
            />
            <AdvancedSettingRow
              icon="view-agenda-outline"
              title="Minimal Goals View"
              subtitle="Use simplified goals page"
              switchValue={settings.minimalGoalsView}
              onSwitchValueChange={handleMinimalGoalsToggle}
            />
            
            {/* Theme Accordion Header */}
            <TouchableRipple
              onPress={toggleThemeSection}
              style={[styles.themeAccordionHeader, { borderTopColor: theme.colors.outlineVariant + '40' }]}
              rippleColor={theme.colors.primaryContainer + '40'}
            >
              <View style={styles.themeAccordionContent}>
                <Surface style={[styles.iconContainer, { backgroundColor: theme.colors.secondaryContainer + '50' }]} elevation={0}>
                  <Icon source="palette-swatch-outline" size={24} color={theme.colors.onSecondaryContainer} />
                </Surface>
                <View style={styles.settingTextContainer}>
                  <Text variant="titleMedium" style={styles.settingTitle}>
                    Theme
                  </Text>
                  <View style={styles.themePreviewRow}>
                    {currentPaletteInfo && (
                      <>
                        <View style={styles.themePreviewSwatches}>
                          {currentPaletteInfo.colors.slice(0, 3).map((color, index) => (
                            <View
                              key={index}
                              style={[
                                styles.miniSwatch,
                                { backgroundColor: color, zIndex: 10 - index },
                                index > 0 && { marginLeft: -6 }
                              ]}
                            />
                          ))}
                        </View>
                        <Text variant="bodyMedium" style={[styles.currentThemeName, { color: theme.colors.onSurfaceVariant }]}>
                          {currentPaletteInfo.name}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
                <View style={[styles.expandIconContainer, { backgroundColor: theme.colors.surfaceVariant + '50' }]}>
                  <Icon 
                    source={themeExpanded ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={theme.colors.onSurfaceVariant} 
                  />
                </View>
              </View>
            </TouchableRipple>
            
            {/* Theme Accordion Body - Collapsed by Default */}
            {themeExpanded && (
              <View style={styles.themeAccordionBody}>
                {palettesByMood.map(({ mood, palettes }) => (
                  <View key={mood.id} style={styles.moodSection}>
                    <View style={styles.moodHeader}>
                      <Text variant="labelLarge" style={[styles.moodTitle, { color: theme.colors.primary }]}>
                        {mood.name}
                      </Text>
                      <Text variant="bodySmall" style={[styles.moodDescription, { color: theme.colors.onSurfaceVariant }]}>
                        {mood.description}
                      </Text>
                    </View>
                    <View style={styles.paletteGrid}>
                      {palettes.map((palette) => (
                        <ColorPaletteItem
                          key={palette.id}
                          paletteId={palette.id}
                          colors={palette.colors}
                          name={palette.name}
                          isSelected={settings.colorPalette === palette.id}
                          onSelect={handleSelectPalette}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Surface>
        </View>

        {/* Other Settings - moved to dedicated pages/modals */}
        <View style={styles.sectionContainer}>
          <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
            MORE
          </Text>
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <AdvancedSettingRow
              icon="robot-happy-outline"
              title="AI Settings"
              subtitle={settings.openRouterApiKey ? 'Configure AI, view stats & insights' : 'Set up AI-powered features'}
              onPress={() => router.push('/ai-settings')}
              badgeText={settings.openRouterApiKey ? 'Active' : 'Setup'}
              badgeTone={settings.openRouterApiKey ? 'primary' : 'secondary'}
            />
            <AdvancedSettingRow
              icon="trophy-outline"
              title="Smart Features"
              subtitle="Focus mode, carry-forward, calendar & gamification"
              onPress={() => router.push('/smart-features-settings')}
            />
            <AdvancedSettingRow
              icon="timer-sand"
              title="Focus Timer"
              subtitle="Work sessions, breaks, reminders & sounds"
              onPress={() => router.push('/focus-timer-settings')}
            />
            <AdvancedSettingRow
              icon="cloud-sync-outline"
              title="Data & Backup"
              subtitle="Export, import, and cloud sync"
              onPress={() => router.push('/data-backup-settings')}
              badgeText={settings.convexUrl && settings.convexToken ? 'Ready' : undefined}
              badgeTone="primary"
            />
            <AdvancedSettingRow
              icon="information-outline"
              title="About"
              subtitle="Version and app info"
              onPress={() => router.push('/about')}
              isLast={true}
            />
          </Surface>
        </View>
        
        <View style={styles.footerSpacing} />

      </ScrollView>

      {/* Time Picker Modal */}
      <Portal>
        <Modal
          visible={showTimePicker}
          onDismiss={() => setShowTimePicker(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Set Reminder Time
          </Text>
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {TIME_OPTIONS.map((option) => (
              <TouchableRipple
                key={option.value}
                onPress={() => handleTimeSelect(option.value)}
                style={[
                  styles.timeOption,
                  settings.dailyReminderTime === option.value && { backgroundColor: theme.colors.secondaryContainer }
                ]}
              >
                <Text
                  variant="bodyLarge"
                  style={{
                    color: settings.dailyReminderTime === option.value ? theme.colors.onSecondaryContainer : theme.colors.onSurface,
                    fontWeight: settings.dailyReminderTime === option.value ? '700' : '400'
                  }}
                >
                  {option.label}
                </Text>
              </TouchableRipple>
            ))}
          </ScrollView>
          <Button mode="text" onPress={() => setShowTimePicker(false)} style={styles.modalCancel}>
            Cancel
          </Button>
        </Modal>
      </Portal>

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
};

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
    marginTop: 12,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
    fontSize: 32, 
  },
  headerSubtitle: {
    opacity: 0.6,
    marginTop: 4,
    fontSize: 16,
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
    // Soft shadow for "novel" feel
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  settingTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  settingTitle: {
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  
  // Palette Section
  paletteSection: {
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  paletteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
  },
  moodSection: {
    marginBottom: 24,
  },
  moodHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  moodTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
    fontSize: 13,
    marginBottom: 2,
  },
  moodDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  paletteItem: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 4,
  },
  paletteContent: {
    alignItems: 'flex-start',
  },
  paletteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
    alignItems: 'center',
  },
  selectedLabel: {
    fontWeight: '700',
  },
  colorSwatchesContainer: {
    flexDirection: 'row',
    height: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
  },

  // Theme Accordion
  themeAccordionHeader: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  themeAccordionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  themePreviewSwatches: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'white',
  },
  currentThemeName: {
    fontSize: 13,
    opacity: 0.7,
    marginLeft: 4,
  },
  expandIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  themeAccordionBody: {
    paddingBottom: 24,
    paddingTop: 8,
  },

  // Modal
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
  modalScroll: {
    maxHeight: 300,
  },
  timeOption: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 4,
  },
  modalCancel: {
    marginTop: 16,
  },
  footerSpacing: {
    height: 80, // Extra space at bottom
  },
  snackbar: {
    zIndex: 1200,
    elevation: 12,
  },
});

export default SettingsScreen;
