import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import { View, StyleSheet, ScrollView, TextInput, LayoutAnimation, Platform, UIManager } from 'react-native';

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
import { notificationService, aiLogService, calendarService, backupService, convexSyncService, ambientSoundService } from '../services';
import { colorPaletteInfoList, themeMoods, getPalettesByMood } from '../theme/colors';
import type { ThemeMood } from '../types/settings';
import { useSettings } from '../context/SettingsContext';

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
 * Setting Row Component - Novel Design
 * High fidelity with improved spacing and typography
 * Memoized for performance
 */
const SettingRow = memo(({
  icon,
  title,
  subtitle,
  right,
  switchValue,
  onSwitchValueChange,
  switchDisabled,
  badgeText,
  badgeTone = 'secondary',
  rightText,
  rightTextColor,
  onPress,
  disabled = false,
  danger = false,
  isLast = false,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  switchValue?: boolean;
  onSwitchValueChange?: () => void;
  switchDisabled?: boolean;
  badgeText?: string;
  badgeTone?: 'primary' | 'secondary';
  rightText?: string;
  rightTextColor?: string;
  onPress?: () => void;
  disabled?: boolean;
  danger?: boolean;
  isLast?: boolean;
}) => {
  const theme = useTheme();

  const rightNode = useMemo(() => {
    if (typeof switchValue === 'boolean' && onSwitchValueChange) {
      return (
        <Switch
          value={switchValue}
          onValueChange={onSwitchValueChange}
          color={theme.colors.primary}
          disabled={switchDisabled}
        />
      );
    }

    if (badgeText) {
      const backgroundColor =
        badgeTone === 'primary' ? theme.colors.primaryContainer : theme.colors.secondaryContainer + '50';
      const color = badgeTone === 'primary' ? theme.colors.primary : theme.colors.onSecondaryContainer;
      return (
        <View style={[styles.smallBadge, { backgroundColor }]}>
          <Text variant="labelMedium" style={{ color }}>
            {badgeText}
          </Text>
        </View>
      );
    }

    if (rightText) {
      return (
        <Text variant="labelMedium" style={{ color: rightTextColor || theme.colors.primary }}>
          {rightText}
        </Text>
      );
    }

    return right;
  }, [
    badgeText,
    badgeTone,
    onSwitchValueChange,
    right,
    rightText,
    rightTextColor,
    switchDisabled,
    switchValue,
    theme.colors.onSecondaryContainer,
    theme.colors.primary,
    theme.colors.primaryContainer,
    theme.colors.secondaryContainer,
  ]);
  
  return (
    <TouchableRipple 
      onPress={!disabled && onPress ? onPress : undefined}
      disabled={disabled}
      style={[
        styles.settingRow, 
        disabled && styles.disabledRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant + '40' } // Subtle separator using outline variant
      ]}
      rippleColor={theme.colors.primaryContainer + '40'}
    >
      <View style={styles.settingRowContent}>
        <Surface style={[styles.iconContainer, { backgroundColor: theme.colors.secondaryContainer + '50' }]} elevation={0}>
          <Icon source={icon} size={24} color={theme.colors.onSecondaryContainer} />
        </Surface>
        <View style={styles.settingTextContainer}>
          <Text variant="titleMedium" style={[styles.settingTitle, { color: danger ? theme.colors.error : theme.colors.onSurface }]}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="bodyMedium" style={[styles.settingSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightNode && <View style={styles.settingRight}>{rightNode}</View>}
      </View>
    </TouchableRipple>
  );
});

const FOCUS_SOUNDS = ['rain', 'forest', 'cafe', 'waves'] as const;
const FOCUS_SOUND_META: Record<(typeof FOCUS_SOUNDS)[number], { name: string; icon: string }> = {
  rain: { name: 'Rain', icon: 'weather-rainy' },
  forest: { name: 'Forest', icon: 'tree' },
  cafe: { name: 'Cafe', icon: 'coffee' },
  waves: { name: 'Waves', icon: 'wave' },
};

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

  useEffect(() => {
    // Enable LayoutAnimation on Android for smoother accordion transitions
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);
  
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [themeExpanded, setThemeExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showConvexCredentialsModal, setShowConvexCredentialsModal] = useState(false);
  const [convexUrlInput, setConvexUrlInput] = useState('');  
  const [convexTokenInput, setConvexTokenInput] = useState('');
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

  const handleNotificationsToggle = useCallback(async () => {
    const newEnabled = !settings.notificationsEnabled;
    if (newEnabled) {
      const granted = await notificationService.requestPermissions();
      if (!granted) {
        setSnackbarMessage('Permission denied');
        setSnackbarVisible(true);
        return;
      }
      if (settings.dailyReminderEnabled) {
        await notificationService.scheduleDailyPlanningReminder(settings.dailyReminderTime);
      }
    } else {
      await notificationService.cancelAllReminders();
    }
    await saveSettings({ notificationsEnabled: newEnabled }, newEnabled ? 'Notifications ON' : 'Notifications OFF');
  }, [settings, saveSettings]);

  const handleDailyReminderToggle = useCallback(async () => {
    const newEnabled = !settings.dailyReminderEnabled;
    if (newEnabled && settings.notificationsEnabled) {
      await notificationService.scheduleDailyPlanningReminder(settings.dailyReminderTime);
    } else {
      await notificationService.cancelDailyPlanningReminder();
    }
    await saveSettings({ dailyReminderEnabled: newEnabled }, newEnabled ? 'Reminder ON' : 'Reminder OFF');
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

  const handleSmartRemindersToggle = useCallback(async () => {
    const newEnabled = !settings.smartRemindersEnabled;
    await saveSettings({ smartRemindersEnabled: newEnabled }, newEnabled ? 'Smart Reminders ON' : 'Smart Reminders OFF');
  }, [settings, saveSettings]);

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
      // Request calendar permissions
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

  const handleSaveApiKey = useCallback(async () => {
    setShowApiKeyModal(false);
    if (apiKeyInput.trim()) {
      await saveSettings({ openRouterApiKey: apiKeyInput.trim() }, 'API Key saved');
    }
    setApiKeyInput('');
  }, [apiKeyInput, saveSettings]);

  const handleOpenModelSelection = useCallback(() => {
    router.push('/model-selection');
  }, [router]);

  const handleExportData = useCallback(async () => {
    setIsExporting(true);
    try {
      const result = await backupService.exportToFile();
      if (result.success) {
        setSnackbarMessage('Data exported successfully');
      } else {
        setSnackbarMessage(result.error || 'Export failed');
      }
      setSnackbarVisible(true);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleImportData = useCallback(async () => {
    setIsImporting(true);
    try {
      const result = await backupService.importFromFile();
      if (result.success) {
        setSnackbarMessage('Data imported! Restart the app to see changes.');
      } else if (result.error !== 'No file selected') {
        setSnackbarMessage(result.error || 'Import failed');
      }
      setSnackbarVisible(true);
    } finally {
      setIsImporting(false);
    }
  }, []);

  const handleSaveConvexCredentials = useCallback(async () => {
    setShowConvexCredentialsModal(false);
    const updates: { convexUrl?: string; convexToken?: string } = {};
    
    if (convexUrlInput.trim()) {
      updates.convexUrl = convexUrlInput.trim();
    }
    if (convexTokenInput.trim()) {
      updates.convexToken = convexTokenInput.trim();
    }
    
    if (Object.keys(updates).length > 0) {
      await saveSettings(updates, 'Convex credentials saved');
    }
    
    setConvexUrlInput('');
    setConvexTokenInput('');
  }, [convexUrlInput, convexTokenInput, saveSettings]);

  const handleSyncToCloud = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await convexSyncService.syncToCloud();
      if (result.success) {
        setSnackbarMessage('Data synced to cloud!');
      } else {
        setSnackbarMessage(result.error || 'Sync failed');
      }
      setSnackbarVisible(true);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const handleRestoreFromCloud = useCallback(async () => {
    setIsRestoring(true);
    try {
      const result = await convexSyncService.syncFromCloud();
      if (result.success) {
        setSnackbarMessage('Data restored! Restart the app to see changes.');
      } else {
        setSnackbarMessage(result.error || 'Restore failed');
      }
      setSnackbarVisible(true);
    } finally {
      setIsRestoring(false);
    }
  }, []);

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
            <SettingRow
              icon="bell-ring-outline"
              title="Notifications"
              subtitle="Get updates and daily reminders"
              isLast={!settings.notificationsEnabled}
              switchValue={settings.notificationsEnabled}
              onSwitchValueChange={handleNotificationsToggle}
            />
            {settings.notificationsEnabled && (
              <>
                <SettingRow
                  icon="calendar-check-outline"
                  title="Daily Planner"
                  subtitle="Reminder to plan your day"
                  disabled={!settings.notificationsEnabled}
                  switchValue={settings.dailyReminderEnabled}
                  onSwitchValueChange={handleDailyReminderToggle}
                  switchDisabled={!settings.notificationsEnabled}
                />
                {settings.dailyReminderEnabled && (
                  <SettingRow
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
            <SettingRow
              icon="theme-light-dark"
              title="Dark Mode"
              subtitle="Easier on the eyes at night"
              switchValue={settings.darkModeEnabled}
              onSwitchValueChange={handleDarkModeToggle}
            />
            <SettingRow
              icon="format-text"
              title="Tab Bar Labels"
              subtitle="Show text labels below icons"
              switchValue={settings.showTabBarLabels}
              onSwitchValueChange={handleTabBarLabelsToggle}
            />
            <SettingRow
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

        {/* AI Features Group - Links to dedicated AI Settings */}
        <View style={styles.sectionContainer}>
          <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
            AI FEATURES
          </Text>
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <SettingRow
              icon="robot-happy-outline"
              title="AI Settings"
              subtitle={settings.openRouterApiKey ? "Configure AI, view stats & insights" : "Set up AI-powered features"}
              isLast={true}
              onPress={() => router.push('/ai-settings')}
              badgeText={settings.openRouterApiKey ? 'Active' : 'Setup'}
              badgeTone={settings.openRouterApiKey ? 'primary' : 'secondary'}
            />
          </Surface>
        </View>

        {/* Data Backup Group */}
        <View style={styles.sectionContainer}>
          <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
            DATA & BACKUP
          </Text>
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <SettingRow
              icon="export"
              title="Export Data"
              subtitle="Save all your data to a file"
              onPress={handleExportData}
              disabled={isExporting}
              rightText={isExporting ? 'Exporting...' : undefined}
              badgeText={!isExporting ? 'JSON' : undefined}
            />
            <SettingRow
              icon="import"
              title="Import Data"
              subtitle="Restore from a backup file"
              onPress={handleImportData}
              disabled={isImporting}
              rightText={isImporting ? 'Importing...' : undefined}
              badgeText={!isImporting ? 'Restore' : undefined}
            />
            <SettingRow
              icon="cloud-sync-outline"
              title="Convex Credentials"
              subtitle={settings.convexUrl && settings.convexToken ? "Configured" : "Set URL and Token for cloud sync"}
              onPress={() => {
                setConvexUrlInput(settings.convexUrl || '');
                setConvexTokenInput(settings.convexToken || '');
                setShowConvexCredentialsModal(true);
              }}
              badgeText={(settings.convexUrl && settings.convexToken) ? 'Ready' : 'Setup'}
              badgeTone={(settings.convexUrl && settings.convexToken) ? 'primary' : 'secondary'}
            />
            {settings.convexUrl && settings.convexToken && (
              <>
                <SettingRow
                  icon="cloud-upload-outline"
                  title="Sync to Cloud"
                  subtitle="Upload your data to Convex"
                  onPress={handleSyncToCloud}
                  disabled={isSyncing}
                  rightText={isSyncing ? 'Syncing...' : undefined}
                  badgeText={!isSyncing ? 'Sync' : undefined}
                  badgeTone={!isSyncing ? 'primary' : 'secondary'}
                />
                <SettingRow
                  icon="cloud-download-outline"
                  title="Restore from Cloud"
                  subtitle="Download your data from Convex"
                  onPress={handleRestoreFromCloud}
                  disabled={isRestoring}
                  isLast={true}
                  rightText={isRestoring ? 'Restoring...' : undefined}
                  badgeText={!isRestoring ? 'Restore' : undefined}
                />
              </>
            )}
          </Surface>
        </View>

        {/* Smart Features Group */}
        <View style={styles.sectionContainer}>
          <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
            SMART FEATURES
          </Text>
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <SettingRow
              icon="target"
              title="Focus Mode"
              subtitle="Show only top 3 daily priorities"
              switchValue={settings.focusModeEnabled}
              onSwitchValueChange={handleFocusModeToggle}
            />
            <SettingRow
              icon="arrow-right-bold"
              title="Carry Forward"
              subtitle="Auto-move incomplete goals to today"
              switchValue={settings.carryForwardEnabled}
              onSwitchValueChange={handleCarryForwardToggle}
            />
            <SettingRow
              icon="calendar-sync"
              title="Calendar Integration"
              subtitle="Show calendar events on goals page"
              switchValue={settings.calendarIntegrationEnabled}
              onSwitchValueChange={handleCalendarToggle}
            />
            <SettingRow
              icon="trophy-outline"
              title="Gamification"
              subtitle="XP, badges, challenges & personal bests"
              isLast={true}
              switchValue={settings.gamificationEnabled}
              onSwitchValueChange={handleGamificationToggle}
            />
          </Surface>
        </View>

        {/* Focus Timer Group */}
        <View style={styles.sectionContainer}>
          <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
            FOCUS TIMER
          </Text>
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <SettingRow
              icon="timer-sand"
              title="Work Duration"
              subtitle={`${settings.focusWorkDuration} minutes per session`}
              right={
                <View style={styles.durationControls}>
                  <TouchableRipple
                    onPress={() => settings.focusWorkDuration > 15 && saveSettings({ focusWorkDuration: settings.focusWorkDuration - 5 }, 'Work duration updated')}
                    style={[styles.durationButton, { backgroundColor: theme.colors.surfaceVariant }]}
                    borderless
                  >
                    <Icon source="minus" size={18} color={theme.colors.onSurfaceVariant} />
                  </TouchableRipple>
                  <Text variant="titleMedium" style={{ color: theme.colors.primary, minWidth: 32, textAlign: 'center' }}>
                    {settings.focusWorkDuration}
                  </Text>
                  <TouchableRipple
                    onPress={() => settings.focusWorkDuration < 60 && saveSettings({ focusWorkDuration: settings.focusWorkDuration + 5 }, 'Work duration updated')}
                    style={[styles.durationButton, { backgroundColor: theme.colors.surfaceVariant }]}
                    borderless
                  >
                    <Icon source="plus" size={18} color={theme.colors.onSurfaceVariant} />
                  </TouchableRipple>
                </View>
              }
            />
            <SettingRow
              icon="coffee-outline"
              title="Short Break"
              subtitle={`${settings.focusShortBreakDuration} minutes`}
              right={
                <View style={styles.durationControls}>
                  <TouchableRipple
                    onPress={() => settings.focusShortBreakDuration > 3 && saveSettings({ focusShortBreakDuration: settings.focusShortBreakDuration - 1 }, 'Break duration updated')}
                    style={[styles.durationButton, { backgroundColor: theme.colors.surfaceVariant }]}
                    borderless
                  >
                    <Icon source="minus" size={18} color={theme.colors.onSurfaceVariant} />
                  </TouchableRipple>
                  <Text variant="titleMedium" style={{ color: theme.colors.primary, minWidth: 32, textAlign: 'center' }}>
                    {settings.focusShortBreakDuration}
                  </Text>
                  <TouchableRipple
                    onPress={() => settings.focusShortBreakDuration < 15 && saveSettings({ focusShortBreakDuration: settings.focusShortBreakDuration + 1 }, 'Break duration updated')}
                    style={[styles.durationButton, { backgroundColor: theme.colors.surfaceVariant }]}
                    borderless
                  >
                    <Icon source="plus" size={18} color={theme.colors.onSurfaceVariant} />
                  </TouchableRipple>
                </View>
              }
            />
            <SettingRow
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
            <SettingRow
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
                        }
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
                        {isSelected && (
                          <Icon source="check" size={12} color={theme.colors.primary} />
                        )}
                      </View>
                    </TouchableRipple>
                  );
                })}
              </View>
            )}
            <SettingRow
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

        {/* About / Info Section - Redesigned as unique footer */}
        <View style={styles.aboutContainer}>
           <Icon source="code-tags" size={32} color={theme.colors.primary + '80'} />
           <Text variant="titleMedium" style={{ marginTop: 12, opacity: 0.7, fontWeight: '700' }}>
             JustDoIt
           </Text>
           <Text variant="bodySmall" style={{ opacity: 0.5, marginTop: 4 }}>
             Version 1.0.0 (Alpha)
           </Text>
           <Text variant="bodySmall" style={{ opacity: 0.4, marginTop: 2 }}>
             Designed for focus & flow
           </Text>
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

      {/* API Key Modal */}
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
            placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
            secureTextEntry
            style={[
              styles.apiKeyInput,
              {
                backgroundColor: theme.colors.surfaceVariant + '50',
                color: theme.colors.onSurface,
                borderColor: theme.colors.outline + '30',
              }
            ]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.modalButtons}>
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

      {/* Convex Credentials Modal */}
      <Portal>
        <Modal
          visible={showConvexCredentialsModal}
          onDismiss={() => {
            setShowConvexCredentialsModal(false);
            setConvexUrlInput('');
            setConvexTokenInput('');
          }}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Convex Credentials
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 16 }}>
            Enter your Convex deployment URL and auth token
          </Text>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
            Deployment URL
          </Text>
          <TextInput
            value={convexUrlInput}
            onChangeText={setConvexUrlInput}
            placeholder="https://your-project.convex.cloud"
            placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
            style={[
              styles.apiKeyInput,
              {
                backgroundColor: theme.colors.surfaceVariant + '50',
                color: theme.colors.onSurface,
                borderColor: theme.colors.outline + '30',
                marginBottom: 12,
              }
            ]}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
            Auth Token
          </Text>
          <TextInput
            value={convexTokenInput}
            onChangeText={setConvexTokenInput}
            placeholder="Your secure token"
            placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
            secureTextEntry
            style={[
              styles.apiKeyInput,
              {
                backgroundColor: theme.colors.surfaceVariant + '50',
                color: theme.colors.onSurface,
                borderColor: theme.colors.outline + '30',
              }
            ]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.modalButtons}>
            <Button mode="text" onPress={() => {
              setShowConvexCredentialsModal(false);
              setConvexUrlInput('');
              setConvexTokenInput('');
            }}>
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSaveConvexCredentials}
              disabled={!convexUrlInput.trim() && !convexTokenInput.trim()}
            >
              Save
            </Button>
          </View>
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
  settingRow: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  disabledRow: {
    opacity: 0.4,
  },
  settingRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  settingSubtitle: {
    marginTop: 2,
    fontSize: 13,
  },
  settingRight: {
    marginLeft: 12,
  },
  smallBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  modelGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  modelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modelOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 2,
  },
  
  // About
  aboutContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  footerSpacing: {
    height: 80, // Extra space at bottom
  },
  
  // Focus Timer duration controls
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
  snackbar: {
    zIndex: 1200,
    elevation: 12,
  },
});

export default SettingsScreen;
