import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, StyleSheet, ScrollView, TextInput, LayoutAnimation, Platform, UIManager } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
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
import { useNavigation } from '@react-navigation/native';
import type { SettingsScreenProps } from '../navigation/types';
import type { AppSettings, ColorPalette } from '../types';
import { notificationService } from '../services';
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
  colors,
  isSelected,
  onPress,
  name,
}: {
  colors: string[];
  isSelected: boolean;
  onPress: () => void;
  name: string;
}) {
  const theme = useTheme();

  return (
    <TouchableRipple
      onPress={onPress}
      style={[
        styles.paletteItem,
        {
          borderColor: isSelected ? theme.colors.primary : 'transparent',
          backgroundColor: isSelected ? theme.colors.primaryContainer + '30' : theme.colors.elevation.level1,
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
  onPress,
  disabled = false,
  danger = false,
  isLast = false,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  danger?: boolean;
  isLast?: boolean;
}) => {
  const theme = useTheme();
  
  return (
    <TouchableRipple 
      onPress={!disabled && onPress ? onPress : undefined}
      disabled={disabled}
      style={[
        styles.settingRow, 
        disabled && styles.disabledRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceVariant + '15' } // Ultra subtle separator
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
        {right && <View style={styles.settingRight}>{right}</View>}
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
export const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { settings, updateSettings } = useSettings();
  
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [themeExpanded, setThemeExpanded] = useState(false);

  // Toggle theme section with smooth animation
  const toggleThemeSection = useCallback(() => {
    LayoutAnimation.configureNext(springAnimation);
    setThemeExpanded(prev => !prev);
  }, []);

  // Memoize the current palette info for display
  const currentPaletteInfo = useMemo(() => {
    return colorPaletteInfoList.find(p => p.id === settings.colorPalette);
  }, [settings.colorPalette]);

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
    if (settings.dailyReminderEnabled && settings.notificationsEnabled) {
      await notificationService.scheduleDailyPlanningReminder(time);
    }
    await saveSettings({ dailyReminderTime: time }, `Time set to ${formatTimeDisplay(time)}`);
  }, [settings, saveSettings]);

  const handleDarkModeToggle = useCallback(async () => {
    const newEnabled = !settings.darkModeEnabled;
    await saveSettings({ darkModeEnabled: newEnabled }, newEnabled ? 'Dark Mode ON' : 'Light Mode ON');
  }, [settings, saveSettings]);

  const handleColorPaletteChange = useCallback(async (palette: ColorPalette) => {
    await saveSettings({ colorPalette: palette }, 'Theme Updated');
  }, [saveSettings]);

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

  const handleSaveApiKey = useCallback(async () => {
    setShowApiKeyModal(false);
    if (apiKeyInput.trim()) {
      await saveSettings({ openRouterApiKey: apiKeyInput.trim() }, 'API Key saved');
    }
    setApiKeyInput('');
  }, [apiKeyInput, saveSettings]);

  const handleOpenModelSelection = useCallback(() => {
    navigation.navigate('ModelSelection');
  }, [navigation]);

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
              right={
                <Switch
                  value={settings.notificationsEnabled}
                  onValueChange={handleNotificationsToggle}
                  color={theme.colors.primary}
                />
              }
            />
            {settings.notificationsEnabled && (
              <>
                <SettingRow
                  icon="calendar-check-outline"
                  title="Daily Planner"
                  subtitle="Reminder to plan your day"
                  disabled={!settings.notificationsEnabled}
                  right={
                    <Switch
                      value={settings.dailyReminderEnabled}
                      onValueChange={handleDailyReminderToggle}
                      color={theme.colors.primary}
                      disabled={!settings.notificationsEnabled}
                    />
                  }
                />
                {settings.dailyReminderEnabled && (
                  <SettingRow
                    icon="clock-time-four-outline"
                    title="Reminder Time"
                    subtitle={formatTimeDisplay(settings.dailyReminderTime)}
                    disabled={!settings.notificationsEnabled}
                    onPress={() => setShowTimePicker(true)}
                    isLast={true}
                    right={
                      <View style={[styles.smallBadge, { backgroundColor: theme.colors.secondaryContainer + '50' }]}>
                         <Text variant="labelMedium" style={{ color: theme.colors.onSecondaryContainer }}>
                           Edit
                         </Text>
                      </View>
                    }
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
              right={
                <Switch
                  value={settings.darkModeEnabled}
                  onValueChange={handleDarkModeToggle}
                  color={theme.colors.primary}
                />
              }
            />
            
            {/* Theme Accordion Header */}
            <TouchableRipple
              onPress={toggleThemeSection}
              style={[styles.themeAccordionHeader, { borderTopColor: theme.colors.outline + '15' }]}
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
                {themeMoods.map((mood) => (
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
                      {getPalettesByMood(mood.id).map((palette) => (
                        <ColorPaletteItem
                          key={palette.id}
                          colors={palette.colors}
                          name={palette.name}
                          isSelected={settings.colorPalette === palette.id}
                          onPress={() => handleColorPaletteChange(palette.id)}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Surface>
        </View>

        {/* AI Features Group */}
        <View style={styles.sectionContainer}>
          <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
            AI FEATURES
          </Text>
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <SettingRow
              icon="key-outline"
              title="OpenRouter API Key"
              subtitle={settings.openRouterApiKey ? "••••••••" + settings.openRouterApiKey.slice(-4) : "Not configured"}
              onPress={() => setShowApiKeyModal(true)}
              isLast={!settings.openRouterApiKey}
              right={
                <View style={[styles.smallBadge, { backgroundColor: settings.openRouterApiKey ? theme.colors.primaryContainer : theme.colors.errorContainer + '50' }]}>
                  <Text variant="labelMedium" style={{ color: settings.openRouterApiKey ? theme.colors.primary : theme.colors.error }}>
                    {settings.openRouterApiKey ? "Set" : "Required"}
                  </Text>
                </View>
              }
            />
            {settings.openRouterApiKey && (
              <>
                <SettingRow
                  icon="robot-outline"
                  title="AI Model"
                  subtitle={settings.selectedAiModel || "Default (Llama 3.3)"}
                  onPress={handleOpenModelSelection}
                  right={
                    <View style={[styles.smallBadge, { backgroundColor: theme.colors.secondaryContainer + '50' }]}>
                      <Text variant="labelMedium" style={{ color: theme.colors.onSecondaryContainer }}>
                        Select
                      </Text>
                    </View>
                  }
                />
                <SettingRow
                  icon="brain"
                  title="Smart Reminders"
                  subtitle="AI suggests optimal reminder times"
                  isLast={true}
                  right={
                    <Switch
                      value={settings.smartRemindersEnabled}
                      onValueChange={handleSmartRemindersToggle}
                      color={theme.colors.primary}
                    />
                  }
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
              right={
                <Switch
                  value={settings.focusModeEnabled}
                  onValueChange={handleFocusModeToggle}
                  color={theme.colors.primary}
                />
              }
            />
            <SettingRow
              icon="arrow-right-bold"
              title="Carry Forward"
              subtitle="Auto-move incomplete goals to today"
              isLast={true}
              right={
                <Switch
                  value={settings.carryForwardEnabled}
                  onValueChange={handleCarryForwardToggle}
                  color={theme.colors.primary}
                />
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

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
      >
        {snackbarMessage}
      </Snackbar>
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
});

export default SettingsScreen;
