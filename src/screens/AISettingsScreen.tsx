import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Text,
  useTheme,
  Icon,
  Surface,
  IconButton,
  Chip,
  ProgressBar,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import type { AppSettings, AIFocusArea } from '../types';
import { AI_FOCUS_AREAS, AIUsageStats, AIPersonalityTrait } from '../types/aiSettings';
import { aiLogService, aiStatsService } from '../services';
import { useSettings } from '../context/SettingsContext';
import { SettingRow } from '../components/SettingRow';
import { APIKeySettings } from '../components/ai-settings/APIKeySettings';
import { AIFeaturesSettings } from '../components/ai-settings/AIFeaturesSettings';
import { AIPrivacySettings } from '../components/ai-settings/AIPrivacySettings';
import { AIModelRow } from '../components/ai-settings/AIModelRow';

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
 * AISettingsScreen - Dedicated AI configuration and analytics
 */
export function AISettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [traits, setTraits] = useState<AIPersonalityTrait[]>([]);
  
  // Load stats on mount
  useEffect(() => {
    setStats(aiStatsService.getUsageStats());
    setTraits(aiStatsService.getPersonalityTraits());
  }, []);

  const saveSettings = useCallback(async (updates: Partial<AppSettings>, message: string) => {
    try {
      await updateSettings(updates);
      // Removed local snackbar management as it should ideally be handled by a global toaster or context if needed,
      // but for now relying on the screen structure or if we want to add it back we can.
      // The original code had local snackbar state.
    } catch (error) {
      console.error('Failed to save settings:', error);
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

  const handleSaveApiKey = useCallback(async (apiKey: string) => {
    await saveSettings({ openRouterApiKey: apiKey }, 'API Key saved');
  }, [saveSettings]);

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
            <AIPrivacySettings 
              piiEnabled={settings.aiPiiAnonymizationEnabled !== false}
              onPiiToggle={handlePiiToggle}
              isLast={true}
            />
          </Surface>
        </View>

        {/* AI Configuration */}
        <View style={styles.sectionContainer}>
          <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
            AI CONFIGURATION
          </Text>
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <APIKeySettings 
              apiKey={settings.openRouterApiKey} 
              onSave={handleSaveApiKey} 
            />
            
            {settings.openRouterApiKey && (
              <>
                <AIModelRow 
                  selectedModel={settings.selectedAiModel} 
                  onPress={handleOpenModelSelection} 
                  hasApiKey={true}
                />
                
                <AIFeaturesSettings
                  smartRemindersEnabled={settings.smartRemindersEnabled}
                  onSmartRemindersToggle={handleSmartRemindersToggle}
                  personalityEnabled={settings.aiPersonalityEnabled !== false}
                  onPersonalityToggle={handlePersonalityToggle}
                  hasApiKey={true}
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
  smallBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  footerSpacing: {
    height: 40,
  },
});

export default AISettingsScreen;
