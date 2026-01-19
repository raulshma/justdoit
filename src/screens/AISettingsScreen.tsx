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
import { AIFeatureInfoModal, AIFeatureInfo } from '../components/AIFeatureInfoModal';

/**
 * AI Feature Information Definitions
 */
const AI_FEATURE_INFO: Record<string, AIFeatureInfo> = {
  smartReminders: {
    id: 'smartReminders',
    title: 'Smart Reminders',
    description: 'AI analyzes your productivity patterns to suggest the optimal times for task reminders.',
    howItWorks: 'The system looks at when you complete tasks and identifying your peak productivity hours. It then suggests reminder times that align with these peak periods.',
    privacy: 'Task completion timestamps are analyzed locally. No personal content is sent to the cloud for this feature unless "Cloud Analysis" is explicitly enabled.',
    executionDetails: 'Runs daily at 9:00 AM or when you complete 5+ tasks to refine suggestions.',
    icon: 'brain',
  },
  aiSmartRescheduling: {
    id: 'aiSmartRescheduling',
    title: 'Smart Rescheduling',
    description: 'Automatically suggests new dates for overdue tasks based on your schedule and priorities.',
    howItWorks: 'When a task becomes overdue, AI evaluates its priority and your upcoming schedule to recommend a realistic new due date.',
    privacy: 'Schedule availability is processed. Task titles are used to determine context only if "Privacy Preserving Mode" is disabled.',
    executionDetails: 'Triggered automatically when a task becomes overdue by more than 24 hours.',
    icon: 'calendar-clock',
  },
  aiMotivational: {
    id: 'aiMotivational',
    title: 'Motivational Messages',
    description: 'Receive personalized motivational quotes and messages on your dashboard to keep you inspired.',
    howItWorks: 'AI selects quotes and drafts short encouragement messages based on your current progress and streak status.',
    privacy: 'Aggregated progress data (e.g., "5 day streak") is used to tailor messages. No specific task data is shared.',
    executionDetails: 'Updates on app launch and when milestones (streaks, levels) are reached.',
    icon: 'message-text-outline',
  },
  aiPatternDetection: {
    id: 'aiPatternDetection',
    title: 'Pattern Detection',
    description: 'Identifies recurring habits and potential improvement areas in your workflow.',
    howItWorks: 'Analyzes long-term usage history to find trends, such as "You often miss deadlines on Mondays" or "You are most productive in the morning".',
    privacy: 'Usage metadata is analyzed. Specific task contents are anonymized before pattern analysis.',
    executionDetails: 'Analyzes weekly usage every Sunday night to provide insights for the week ahead.',
    icon: 'chart-timeline-variant',
  },
  aiGoalBreakdown: {
    id: 'aiGoalBreakdown',
    title: 'Goal Breakdown',
    description: 'Intelligently breaks down complex goals into smaller, manageable subgoals.',
    howItWorks: 'When you create a broad goal like "Learn Spanish", AI suggests concrete steps like "Download app", "Practice 15 mins daily", etc.',
    privacy: 'The specific goal title you request to break down is sent to the AI provider. Enabling PII protection is recommended.',
    executionDetails: 'Triggered manually when you tap "Break down this goal" on a goal detail screen.',
    icon: 'format-list-checks',
  },
  aiGoalCoach: {
    id: 'aiGoalCoach',
    title: 'AI Goal Coach',
    description: 'An interactive assistant to help you plan, refine, and reflect on your goals.',
    howItWorks: 'Chat with the AI to brainstorm ideas, clarify objectives, or get advice on overcoming obstacles.',
    privacy: 'Chat history is processed by the AI provider to maintain context. Detailed logs can be reviewed in settings.',
    executionDetails: 'Active whenever you open the Goal Coach chat interface.',
    icon: 'account-tie-voice',
  },
  aiPersonality: {
    id: 'aiPersonality',
    title: 'Personality Insights',
    description: 'Derives a "Productivity Personality" profile from your usage style.',
    howItWorks: 'Assigns traits like "Early Bird", "Marathoner", or "Planner" based on how you interact with the app.',
    privacy: 'Derived solely from behavioral metrics (time of use, completion rates). No content analysis required.',
    executionDetails: 'Recalculated weekly based on your activity patterns.',
    icon: 'account-heart-outline',
  },
};

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
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<AIFeatureInfo | null>(null);
  const [modalMode, setModalMode] = useState<'confirm' | 'info'>('confirm');
  const [pendingFeatureKey, setPendingFeatureKey] = useState<keyof AppSettings | null>(null);
  const [pendingFeatureName, setPendingFeatureName] = useState<string>('');

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

  const handleFeatureToggle = useCallback(async (
    key: keyof AppSettings, 
    currentValue: boolean, 
    featureId: string,
    name: string
  ) => {
    // If currently enabled, disable immediately
    if (currentValue) {
      await saveSettings({ [key]: false }, `${name} OFF`);
      return;
    }

    // If currently disabled, show confirmation modal
    const featureInfo = AI_FEATURE_INFO[featureId];
    if (featureInfo) {
      setSelectedFeature(featureInfo);
      setPendingFeatureKey(key);
      setPendingFeatureName(name);
      setModalMode('confirm');
      setModalVisible(true);
    } else {
      // Fallback if no info found (shouldn't happen if config is complete)
      await saveSettings({ [key]: true }, `${name} ON`);
    }
  }, [saveSettings]);

  const handleShowFeatureInfo = useCallback((featureId: string) => {
    const featureInfo = AI_FEATURE_INFO[featureId];
    if (featureInfo) {
      setSelectedFeature(featureInfo);
      setModalMode('info');
      setModalVisible(true);
    }
  }, []);

  const handleConfirmEnable = useCallback(async () => {
    if (pendingFeatureKey) {
      await saveSettings({ [pendingFeatureKey]: true }, `${pendingFeatureName} ON`);
    }
    setModalVisible(false);
    setSelectedFeature(null);
    setPendingFeatureKey(null);
  }, [pendingFeatureKey, pendingFeatureName, saveSettings]);

  const handleDismissModal = useCallback(() => {
    setModalVisible(false);
    setSelectedFeature(null);
    setPendingFeatureKey(null);
  }, []);

  const handleSmartRemindersToggle = useCallback(() => {
    handleFeatureToggle('smartRemindersEnabled', settings.smartRemindersEnabled, 'smartReminders', 'Smart Reminders');
  }, [settings.smartRemindersEnabled, handleFeatureToggle]);

  const handlePersonalityToggle = useCallback(() => {
    handleFeatureToggle('aiPersonalityEnabled', settings.aiPersonalityEnabled !== false, 'aiPersonality', 'Personality');
  }, [settings.aiPersonalityEnabled, handleFeatureToggle]);

  const handleSmartReschedulingToggle = useCallback(() => {
    handleFeatureToggle('aiSmartReschedulingEnabled', settings.aiSmartReschedulingEnabled !== false, 'aiSmartRescheduling', 'Smart Rescheduling');
  }, [settings.aiSmartReschedulingEnabled, handleFeatureToggle]);

  const handleMotivationalToggle = useCallback(() => {
    handleFeatureToggle('aiMotivationalEnabled', settings.aiMotivationalEnabled !== false, 'aiMotivational', 'Motivation');
  }, [settings.aiMotivationalEnabled, handleFeatureToggle]);

  const handlePatternDetectionToggle = useCallback(() => {
    handleFeatureToggle('aiPatternDetectionEnabled', settings.aiPatternDetectionEnabled !== false, 'aiPatternDetection', 'Pattern Detection');
  }, [settings.aiPatternDetectionEnabled, handleFeatureToggle]);

  const handleGoalBreakdownToggle = useCallback(() => {
    handleFeatureToggle('aiGoalBreakdownEnabled', settings.aiGoalBreakdownEnabled !== false, 'aiGoalBreakdown', 'Goal Breakdown');
  }, [settings.aiGoalBreakdownEnabled, handleFeatureToggle]);

  const handleGoalCoachToggle = useCallback(() => {
    handleFeatureToggle('aiGoalCoachEnabled', settings.aiGoalCoachEnabled !== false, 'aiGoalCoach', 'Goal Coach');
  }, [settings.aiGoalCoachEnabled, handleFeatureToggle]);

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
                  aiSmartReschedulingEnabled={settings.aiSmartReschedulingEnabled !== false}
                  onSmartReschedulingToggle={handleSmartReschedulingToggle}
                  aiMotivationalEnabled={settings.aiMotivationalEnabled !== false}
                  onMotivationalToggle={handleMotivationalToggle}
                  aiPatternDetectionEnabled={settings.aiPatternDetectionEnabled !== false}
                  onPatternDetectionToggle={handlePatternDetectionToggle}
                  aiGoalBreakdownEnabled={settings.aiGoalBreakdownEnabled !== false}
                  onGoalBreakdownToggle={handleGoalBreakdownToggle}
                  aiGoalCoachEnabled={settings.aiGoalCoachEnabled !== false}
                  onGoalCoachToggle={handleGoalCoachToggle}
                  personalityEnabled={settings.aiPersonalityEnabled !== false}
                  onPersonalityToggle={handlePersonalityToggle}
                  hasApiKey={true}
                  onShowFeatureInfo={handleShowFeatureInfo}
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

      <AIFeatureInfoModal
        visible={modalVisible}
        featureInfo={selectedFeature}
        onDismiss={handleDismissModal}
        onConfirm={handleConfirmEnable}
        mode={modalMode}
      />
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
