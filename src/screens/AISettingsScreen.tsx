import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
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
  Chip,
  ProgressBar,
  IconButton,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import type { AppSettings, AIFocusArea } from '../types';
import { AI_FOCUS_AREAS, AIUsageStats, AIPersonalityTrait } from '../types/aiSettings';
import { aiLogService, aiStatsService } from '../services';
import { useSettings } from '../context/SettingsContext';
import { piiAnonymizer } from '../utils/piiAnonymizer';

/**
 * Stat Card Component - Displays a single statistic
 */
const StatCard = memo(({
  icon,
  label,
  value,
  subValue,
}: {
  icon: string;
  label: string;
  value: string | number;
  subValue?: string;
}) => {
  const theme = useTheme();
  
  return (
    <Surface style={[styles.statCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
      <Icon source={icon} size={24} color={theme.colors.primary} />
      <Text variant="headlineSmall" style={[styles.statValue, { color: theme.colors.onSurface }]}>
        {value}
      </Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      {subValue && (
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.7 }}>
          {subValue}
        </Text>
      )}
    </Surface>
  );
});

/**
 * Personality Trait Card Component
 */
const TraitCard = memo(({
  trait,
}: {
  trait: AIPersonalityTrait;
}) => {
  const theme = useTheme();
  
  return (
    <Surface style={[styles.traitCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
      <View style={styles.traitHeader}>
        <Icon source={trait.icon} size={20} color={theme.colors.primary} />
        <Text variant="titleSmall" style={{ marginLeft: 8, color: theme.colors.onSurface }}>
          {trait.name}
        </Text>
      </View>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
        {trait.description}
      </Text>
      <View style={styles.traitStrength}>
        <ProgressBar 
          progress={trait.strength / 100} 
          color={theme.colors.primary}
          style={styles.progressBar}
        />
        <Text variant="labelSmall" style={{ color: theme.colors.primary, marginLeft: 8 }}>
          {trait.strength}%
        </Text>
      </View>
    </Surface>
  );
});

/**
 * Setting Row Component - Reused from SettingsScreen
 */
const SettingRow = memo(({
  icon,
  title,
  subtitle,
  right,
  onPress,
  disabled = false,
  isLast = false,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
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
        !isLast && { borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant + '40' }
      ]}
      rippleColor={theme.colors.primaryContainer + '40'}
    >
      <View style={styles.settingRowContent}>
        <Surface style={[styles.iconContainer, { backgroundColor: theme.colors.secondaryContainer + '50' }]} elevation={0}>
          <Icon source={icon} size={24} color={theme.colors.onSecondaryContainer} />
        </Surface>
        <View style={styles.settingTextContainer}>
          <Text variant="titleMedium" style={[styles.settingTitle, { color: theme.colors.onSurface }]}>
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
 * AISettingsScreen - Dedicated AI configuration and analytics
 */
export function AISettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  const insets = useSafeAreaInsets();

  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [traits, setTraits] = useState<AIPersonalityTrait[]>([]);
  const tabBarHeight = settings.showTabBarLabels ? 80 : 64;
  const tabBarBottomPadding = insets.bottom + 12;
  const snackbarBottom = tabBarHeight + tabBarBottomPadding + 8;

  // Load stats on mount
  useEffect(() => {
    setStats(aiStatsService.getUsageStats());
    setTraits(aiStatsService.getPersonalityTraits());
  }, []);

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

  const handleFocusAreaSelect = useCallback(async (focusArea: AIFocusArea) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await saveSettings({ aiFocusArea: focusArea }, `Focus set to ${focusArea}`);
  }, [saveSettings]);

  const handleSmartRemindersToggle = useCallback(async () => {
    const newEnabled = !settings.smartRemindersEnabled;
    await saveSettings({ smartRemindersEnabled: newEnabled }, newEnabled ? 'Smart Reminders ON' : 'Smart Reminders OFF');
  }, [settings, saveSettings]);

  const handlePersonalityToggle = useCallback(async () => {
    const newEnabled = !settings.aiPersonalityEnabled;
    await saveSettings({ aiPersonalityEnabled: newEnabled }, newEnabled ? 'Personality ON' : 'Personality OFF');
  }, [settings, saveSettings]);

  const handlePiiToggle = useCallback(async () => {
    const newEnabled = !settings.aiPiiAnonymizationEnabled;
    await saveSettings({ aiPiiAnonymizationEnabled: newEnabled }, newEnabled ? 'PII Protection ON' : 'PII Protection OFF');
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

  const handleViewLogs = useCallback(() => {
    router.push('/logs');
  }, [router]);

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => router.back()}
              style={styles.backButton}
            />
            <View style={styles.headerText}>
              <Text variant="headlineMedium" style={styles.headerTitle}>
                AI Settings
              </Text>
              <Text variant="bodyLarge" style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Analytics & personalization
              </Text>
            </View>
          </View>
        </View>

        {/* AI Stats Section */}
        {stats && stats.totalRequests > 0 && (
          <View style={styles.sectionContainer}>
            <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
              AI USAGE STATS
            </Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="lightning-bolt"
                label="Requests"
                value={stats.totalRequests}
                subValue={`${aiStatsService.getSuccessRate()}% success`}
              />
              <StatCard
                icon="format-letter-case"
                label="Tokens Used"
                value={formatNumber(stats.inputTokens + stats.outputTokens)}
                subValue={`In: ${formatNumber(stats.inputTokens)}`}
              />
              <StatCard
                icon="clock-outline"
                label="Avg Response"
                value={`${(stats.averageResponseTime / 1000).toFixed(1)}s`}
              />
              <StatCard
                icon="chart-line"
                label="Analysis"
                value={stats.requestsByType.goal_analysis}
                subValue="Goal analyses"
              />
            </View>
          </View>
        )}

        {/* Focus Area Selection */}
        <View style={styles.sectionContainer}>
          <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
            FOCUS AREA
          </Text>
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <View style={styles.focusDescription}>
              <Icon source="target" size={20} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={{ marginLeft: 8, color: theme.colors.onSurfaceVariant, flex: 1 }}>
                AI will prioritize suggestions based on your focus
              </Text>
            </View>
            <View style={styles.chipContainer}>
              {AI_FOCUS_AREAS.map((area) => (
                <Chip
                  key={area.id}
                  icon={area.icon}
                  selected={settings.aiFocusArea === area.id}
                  onPress={() => handleFocusAreaSelect(area.id)}
                  style={[
                    styles.focusChip,
                    settings.aiFocusArea === area.id && { backgroundColor: theme.colors.primaryContainer }
                  ]}
                  textStyle={settings.aiFocusArea === area.id ? { color: theme.colors.onPrimaryContainer } : undefined}
                >
                  {area.name}
                </Chip>
              ))}
            </View>
          </Surface>
        </View>

        {/* Personality Insights */}
        {settings.aiPersonalityEnabled !== false && traits.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
              PERSONALITY INSIGHTS
            </Text>
            <View style={styles.traitsGrid}>
              {traits.map((trait) => (
                <TraitCard key={trait.id} trait={trait} />
              ))}
            </View>
          </View>
        )}

        {/* Privacy & Security */}
        <View style={styles.sectionContainer}>
          <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
            PRIVACY & SECURITY
          </Text>
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <SettingRow
              icon="shield-check-outline"
              title="PII Anonymization"
              subtitle="Remove personal data before AI processing"
              isLast={true}
              right={
                <Switch
                  value={settings.aiPiiAnonymizationEnabled !== false}
                  onValueChange={handlePiiToggle}
                  color={theme.colors.primary}
                />
              }
            />
          </Surface>
        </View>

        {/* AI Configuration */}
        <View style={styles.sectionContainer}>
          <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
            AI CONFIGURATION
          </Text>
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <SettingRow
              icon="key-outline"
              title="OpenRouter API Key"
              subtitle={settings.openRouterApiKey ? "••••••••" + settings.openRouterApiKey.slice(-4) : "Not configured"}
              onPress={() => setShowApiKeyModal(true)}
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
                  right={
                    <Switch
                      value={settings.smartRemindersEnabled}
                      onValueChange={handleSmartRemindersToggle}
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
                      value={settings.aiPersonalityEnabled !== false}
                      onValueChange={handlePersonalityToggle}
                      color={theme.colors.primary}
                    />
                  }
                />
                <SettingRow
                  icon="file-document-outline"
                  title="View AI Logs"
                  subtitle="Debug AI requests & responses"
                  isLast={true}
                  onPress={handleViewLogs}
                  right={
                    <View style={[styles.smallBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        {aiLogService.getLogCount()}
                      </Text>
                    </View>
                  }
                />
              </>
            )}
          </Surface>
        </View>

        <View style={styles.footerSpacing} />
      </ScrollView>

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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginLeft: -8,
    marginRight: 4,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
    fontSize: 28,
  },
  headerSubtitle: {
    opacity: 0.6,
    marginTop: 2,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionHeader: {
    marginBottom: 14,
    marginLeft: 8,
    fontWeight: '700',
    letterSpacing: 2,
    fontSize: 11,
    opacity: 0.6,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontWeight: '700',
    marginTop: 8,
  },
  traitsGrid: {
    gap: 12,
  },
  traitCard: {
    padding: 16,
    borderRadius: 20,
  },
  traitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  traitStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  focusDescription: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  focusChip: {
    marginBottom: 4,
  },
  settingRow: {
    paddingVertical: 16,
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
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  settingTitle: {
    fontWeight: '600',
    fontSize: 15,
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
  footerSpacing: {
    height: 40,
  },
  snackbar: {
    zIndex: 1200,
    elevation: 12,
  },
});

export default AISettingsScreen;
