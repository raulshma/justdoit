import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  FlatList,
  ListRenderItemInfo,
  ViewToken,
} from 'react-native';
import { Text, useTheme, Switch, Surface } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { ThemeMood, ColorPalette, ColorPaletteInfo } from '../types/settings';
import { colorPaletteInfoList } from '../theme/colors';
import { DEFAULT_REMINDER_TIME } from '../constants';
import { APIKeySettings } from '../components/ai-settings/APIKeySettings';
import { AIFeaturesSettings } from '../components/ai-settings/AIFeaturesSettings';
import { AIPrivacySettings } from '../components/ai-settings/AIPrivacySettings';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SlideData {
  id: string;
  type: 'welcome' | 'features' | 'theme' | 'notifications' | 'smartfeatures' | 'focustimer' | 'productivity' | 'ai' | 'complete';
}

const SLIDES: SlideData[] = [
  { id: 'welcome', type: 'welcome' },
  { id: 'features', type: 'features' },
  { id: 'theme', type: 'theme' },
  { id: 'notifications', type: 'notifications' },
  { id: 'smartfeatures', type: 'smartfeatures' },
  { id: 'productivity', type: 'productivity' },
  { id: 'focustimer', type: 'focustimer' },
  { id: 'ai', type: 'ai' },
  { id: 'complete', type: 'complete' },
];

const TIME_PRESETS = [
  { value: '07:00', label: '7:00 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
];

const MOODS: ThemeMood[] = ['calm', 'energetic', 'elegant', 'bold', 'inspired'];

const MOOD_LABELS: Record<ThemeMood, string> = {
  calm: 'Calm',
  energetic: 'Energetic',
  elegant: 'Elegant',
  bold: 'Bold',
  inspired: 'Inspired',
};

const MOOD_ICONS: Record<ThemeMood, React.ComponentProps<typeof Icon>['name']> = {
  calm: 'water-outline',
  energetic: 'lightning-bolt',
  elegant: 'diamond-stone',
  bold: 'cube-outline',
  inspired: 'lightbulb-on-outline',
};

export function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, setDarkMode, completeOnboarding } = useSettings();
  const flatListRef = useRef<FlatList<SlideData>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const [selectedMood, setSelectedMood] = useState<ThemeMood>('calm');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedTime, setSelectedTime] = useState(DEFAULT_REMINDER_TIME);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [smartRemindersEnabled, setSmartRemindersEnabled] = useState(false);
  const [personalityEnabled, setPersonalityEnabled] = useState(false);
  const [aiSmartReschedulingEnabled, setAiSmartReschedulingEnabled] = useState(false);
  const [aiMotivationalEnabled, setAiMotivationalEnabled] = useState(false);
  const [aiPatternDetectionEnabled, setAiPatternDetectionEnabled] = useState(false);
  const [aiGoalBreakdownEnabled, setAiGoalBreakdownEnabled] = useState(false);
  const [aiGoalCoachEnabled, setAiGoalCoachEnabled] = useState(false);
  const [piiEnabled, setPiiEnabled] = useState(true);

  const [gamificationEnabled, setGamificationEnabled] = useState(true);
  const [focusModeEnabled, setFocusModeEnabled] = useState(false);
  const [carryForwardEnabled, setCarryForwardEnabled] = useState(true);
  const [calendarEnabled, setCalendarEnabled] = useState(false);
  const [minimalGoalsView, setMinimalGoalsView] = useState(false);
  const [focusWorkDuration, setFocusWorkDuration] = useState(25);
  const [focusAmbientEnabled, setFocusAmbientEnabled] = useState(false);
  const [selectedAmbientSound, setSelectedAmbientSound] = useState<'rain' | 'forest' | 'cafe' | 'waves' | 'none'>('rain');

  const palettesForMood = useMemo(() => 
    colorPaletteInfoList.filter((p: ColorPaletteInfo) => p.mood === selectedMood), 
    [selectedMood]
  );

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const goToNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  }, [currentIndex]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
    }
  }, [currentIndex]);

  const handleComplete = useCallback(async () => {
    await updateSettings({
      notificationsEnabled,
      dailyReminderEnabled: notificationsEnabled,
      dailyReminderTime: selectedTime,
      gamificationEnabled,
      focusModeEnabled,
      carryForwardEnabled,
      calendarIntegrationEnabled: calendarEnabled,
      minimalGoalsView,
      focusWorkDuration,
      focusAmbientSoundEnabled: focusAmbientEnabled,
      focusAmbientSound: selectedAmbientSound,
      
      // AI Features configuration
      openRouterApiKey: apiKey,
      smartRemindersEnabled: aiEnabled && smartRemindersEnabled,
      aiPersonalityEnabled: aiEnabled && personalityEnabled,
      aiPiiAnonymizationEnabled: piiEnabled,
      
      // Default enabled features if AI is on
      aiGoalCoachEnabled: aiEnabled && aiGoalCoachEnabled,
      aiSmartReschedulingEnabled: aiEnabled && aiSmartReschedulingEnabled,
      aiPatternDetectionEnabled: aiEnabled && aiPatternDetectionEnabled,
      aiGoalBreakdownEnabled: aiEnabled && aiGoalBreakdownEnabled,
      aiMotivationalEnabled: aiEnabled && aiMotivationalEnabled,
      // Predictive enabled if any other AI feature is enabled
      aiPredictiveEnabled: aiEnabled,
    });
    await completeOnboarding();
  }, [
    notificationsEnabled,
    selectedTime,
    gamificationEnabled,
    focusModeEnabled,
    carryForwardEnabled,
    calendarEnabled,
    minimalGoalsView,
    focusWorkDuration,
    focusAmbientEnabled,
    selectedAmbientSound,
    aiEnabled,
    apiKey,
    smartRemindersEnabled,
    personalityEnabled,
    aiSmartReschedulingEnabled,
    aiMotivationalEnabled,
    aiPatternDetectionEnabled,
    aiGoalBreakdownEnabled,
    aiGoalCoachEnabled,
    piiEnabled,
    updateSettings,
    completeOnboarding,
  ]);

  const handleSelectPalette = useCallback(async (paletteId: ColorPalette) => {
    await updateSettings({ colorPalette: paletteId });
  }, [updateSettings]);

  const handleToggleDarkMode = useCallback(async (value: boolean) => {
    await setDarkMode(value);
  }, [setDarkMode]);

  const renderWelcomeSlide = () => (
    <View style={styles.slideContent}>
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
        <Icon name="rocket-launch" size={64} color={theme.colors.primary} />
      </View>
      <Text variant="displaySmall" style={[styles.title, { color: theme.colors.onSurface }]}>
        Welcome to JustDoIt
      </Text>
      <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Your personal goal tracker designed to help you stay focused and achieve more.
      </Text>
    </View>
  );

  const renderFeaturesSlide = () => {
    const features = [
      { icon: 'target', label: 'Smart Goals', desc: 'Daily goals with due dates & priorities' },
      { icon: 'microphone', label: 'Voice Input', desc: 'Create goals hands-free' },
      { icon: 'image-multiple', label: 'Vision Boards', desc: 'Attach images & mood boards' },
      { icon: 'timer-sand', label: 'Focus Timer', desc: 'Pomodoro with ambient sounds' },
      { icon: 'trophy', label: 'Gamification', desc: 'XP, badges & challenges' },
      { icon: 'brain', label: 'AI Assistant', desc: 'Smart suggestions & insights' },
    ];
    return (
      <View style={styles.slideContent}>
        <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Powerful Features
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant, marginBottom: 16 }]}>
          Everything you need to achieve your goals
        </Text>
        <View style={styles.featuresGrid}>
          {features.map((f, idx) => (
            <View 
              key={idx} 
              style={[styles.featureCard, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              <Icon name={f.icon as any} size={28} color={theme.colors.primary} />
              <Text variant="labelLarge" style={{ color: theme.colors.onSurface, marginTop: 6, fontWeight: '600' }}>
                {f.label}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 2 }} numberOfLines={2}>
                {f.desc}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderThemeSlide = () => (
    <View style={styles.slideContent}>
      <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        Choose Your Vibe
      </Text>
      
      {/* Dark Mode Toggle */}
      <View style={[styles.toggleRow, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View style={styles.toggleLabel}>
          <Icon name="weather-night" size={24} color={theme.colors.onSurface} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, marginLeft: 12 }}>
            Dark Mode
          </Text>
        </View>
        <Switch value={settings.darkModeEnabled} onValueChange={handleToggleDarkMode} />
      </View>

      {/* Mood Selector */}
      <Text variant="labelLarge" style={[styles.subLabel, { color: theme.colors.onSurfaceVariant }]}>
        Theme Mood
      </Text>
      <View style={styles.moodRow}>
        {MOODS.map(mood => (
          <TouchableOpacity
            key={mood}
            onPress={() => setSelectedMood(mood)}
            style={[
              styles.moodButton,
              { 
                backgroundColor: selectedMood === mood ? theme.colors.primary : theme.colors.surfaceVariant,
                borderColor: selectedMood === mood ? theme.colors.primary : theme.colors.outline,
              }
            ]}
          >
            <Icon 
              name={MOOD_ICONS[mood]} 
              size={20} 
              color={selectedMood === mood ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} 
            />
            <Text 
              variant="labelSmall" 
              style={{ color: selectedMood === mood ? theme.colors.onPrimary : theme.colors.onSurfaceVariant, marginTop: 4 }}
            >
              {MOOD_LABELS[mood]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Palette Preview */}
      <Text variant="labelLarge" style={[styles.subLabel, { color: theme.colors.onSurfaceVariant }]}>
        Color Palette
      </Text>
      <View style={styles.paletteRow}>
        {palettesForMood.slice(0, 4).map(palette => (
          <TouchableOpacity
            key={palette.id}
            onPress={() => handleSelectPalette(palette.id)}
            style={[
              styles.paletteCard,
              { 
                borderColor: settings.colorPalette === palette.id ? theme.colors.primary : 'transparent',
                borderWidth: 2,
              }
            ]}
          >
            <View style={[styles.paletteGradient, { backgroundColor: palette.colors[0] }]}>
              <View style={[styles.paletteStripe, { backgroundColor: palette.colors[1] }]} />
              <View style={[styles.paletteStripe, { backgroundColor: palette.colors[2] || palette.colors[0] }]} />
            </View>
            <Text 
              variant="labelSmall" 
              style={{ 
                color: theme.colors.onSurface, 
                marginTop: 4,
                height: 32,
                textAlign: 'center'
              }}
              numberOfLines={2}
            >
              {palette.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderNotificationsSlide = () => (
    <View style={styles.slideContent}>
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.tertiaryContainer }]}>
        <Icon name="bell-ring" size={56} color={theme.colors.tertiary} />
      </View>
      <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        Stay on Track
      </Text>
      <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Enable daily reminders to plan your goals and never miss a task.
      </Text>
      <View style={[styles.toggleRow, { backgroundColor: theme.colors.surfaceVariant, marginTop: 24 }]}>
        <View style={styles.toggleLabel}>
          <Icon name="bell-outline" size={24} color={theme.colors.onSurface} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, marginLeft: 12 }}>
            Enable Notifications
          </Text>
        </View>
        <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
      </View>
      
      {notificationsEnabled && (
        <>
          <Text variant="labelLarge" style={[styles.subLabel, { color: theme.colors.onSurfaceVariant }]}>
            Reminder Time
          </Text>
          <View style={styles.timePickerRow}>
            {TIME_PRESETS.map(time => (
              <TouchableOpacity
                key={time.value}
                onPress={() => setSelectedTime(time.value)}
                style={[
                  styles.timeChip,
                  { 
                    backgroundColor: selectedTime === time.value ? theme.colors.primary : theme.colors.surfaceVariant,
                    borderColor: selectedTime === time.value ? theme.colors.primary : theme.colors.outline,
                  }
                ]}
              >
                <Text 
                  variant="labelMedium" 
                  style={{ color: selectedTime === time.value ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}
                >
                  {time.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );

  const renderSmartFeaturesSlide = () => (
    <View style={styles.slideContent}>
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
        <Icon name="lightning-bolt" size={56} color={theme.colors.primary} />
      </View>
      <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        Smart Features
      </Text>
      <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Customize how the app helps you stay productive.
      </Text>

      <View style={[styles.toggleRow, { backgroundColor: theme.colors.surfaceVariant, marginTop: 24 }]}>
        <View style={styles.toggleLabel}>
          <Icon name="trophy-outline" size={24} color={theme.colors.onSurface} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
              Gamification
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              XP, badges & challenges
            </Text>
          </View>
        </View>
        <Switch value={gamificationEnabled} onValueChange={setGamificationEnabled} />
      </View>

      <View style={[styles.toggleRow, { backgroundColor: theme.colors.surfaceVariant, marginTop: 12 }]}>
        <View style={styles.toggleLabel}>
          <Icon name="target" size={24} color={theme.colors.onSurface} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
              Focus Mode
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Show top 3 priorities only
            </Text>
          </View>
        </View>
        <Switch value={focusModeEnabled} onValueChange={setFocusModeEnabled} />
      </View>

      <View style={[styles.toggleRow, { backgroundColor: theme.colors.surfaceVariant, marginTop: 12 }]}>
        <View style={styles.toggleLabel}>
          <Icon name="arrow-right-bold" size={24} color={theme.colors.onSurface} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
              Carry Forward
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Auto-move incomplete goals
            </Text>
          </View>
        </View>
        <Switch value={carryForwardEnabled} onValueChange={setCarryForwardEnabled} />
      </View>
    </View>
  );

  const renderProductivitySlide = () => (
    <View style={styles.slideContent}>
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.tertiaryContainer }]}>
        <Icon name="calendar-sync" size={56} color={theme.colors.tertiary} />
      </View>
      <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        Productivity Tools
      </Text>
      <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Customize your workflow and display preferences.
      </Text>

      <View style={[styles.toggleRow, { backgroundColor: theme.colors.surfaceVariant, marginTop: 24 }]}>
        <View style={styles.toggleLabel}>
          <Icon name="calendar-check" size={24} color={theme.colors.onSurface} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
              Calendar Integration
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Show calendar events on goals page
            </Text>
          </View>
        </View>
        <Switch value={calendarEnabled} onValueChange={setCalendarEnabled} />
      </View>

      <View style={[styles.toggleRow, { backgroundColor: theme.colors.surfaceVariant, marginTop: 12 }]}>
        <View style={styles.toggleLabel}>
          <Icon name="view-agenda-outline" size={24} color={theme.colors.onSurface} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
              Minimal Goals View
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Simplified, distraction-free layout
            </Text>
          </View>
        </View>
        <Switch value={minimalGoalsView} onValueChange={setMinimalGoalsView} />
      </View>
    </View>
  );

  const renderFocusTimerSlide = () => {
    const DURATION_OPTIONS = [15, 20, 25, 30, 45, 60];
    const AMBIENT_SOUNDS = [
      { id: 'rain' as const, label: 'Rain', icon: 'weather-rainy' },
      { id: 'forest' as const, label: 'Forest', icon: 'tree' },
      { id: 'cafe' as const, label: 'Cafe', icon: 'coffee' },
      { id: 'waves' as const, label: 'Waves', icon: 'wave' },
    ];

    return (
      <View style={styles.slideContent}>
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
          <Icon name="timer-sand" size={56} color={theme.colors.primary} />
        </View>
        <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Focus Timer
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Pomodoro-style focus sessions to boost productivity.
        </Text>

        <Text variant="labelLarge" style={[styles.subLabel, { color: theme.colors.onSurfaceVariant }]}>
          Work Duration (minutes)
        </Text>
        <View style={styles.durationRow}>
          {DURATION_OPTIONS.map(duration => (
            <TouchableOpacity
              key={duration}
              onPress={() => setFocusWorkDuration(duration)}
              style={[
                styles.durationChip,
                { 
                  backgroundColor: focusWorkDuration === duration ? theme.colors.primary : theme.colors.surfaceVariant,
                  borderColor: focusWorkDuration === duration ? theme.colors.primary : theme.colors.outline,
                }
              ]}
            >
              <Text 
                variant="labelMedium" 
                style={{ color: focusWorkDuration === duration ? theme.colors.onPrimary : theme.colors.onSurfaceVariant, fontWeight: focusWorkDuration === duration ? '600' : '400' }}
              >
                {duration}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.toggleRow, { backgroundColor: theme.colors.surfaceVariant, marginTop: 20 }]}>
          <View style={styles.toggleLabel}>
            <Icon name="music-note" size={24} color={theme.colors.onSurface} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                Ambient Sounds
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Background audio during focus
              </Text>
            </View>
          </View>
          <Switch value={focusAmbientEnabled} onValueChange={setFocusAmbientEnabled} />
        </View>

        {focusAmbientEnabled && (
          <View style={styles.ambientSoundsRow}>
            {AMBIENT_SOUNDS.map(sound => (
              <TouchableOpacity
                key={sound.id}
                onPress={() => setSelectedAmbientSound(sound.id)}
                style={[
                  styles.ambientChip,
                  { 
                    backgroundColor: selectedAmbientSound === sound.id ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                    borderColor: selectedAmbientSound === sound.id ? theme.colors.primary : 'transparent',
                    borderWidth: selectedAmbientSound === sound.id ? 2 : 0,
                  }
                ]}
              >
                <Icon name={sound.icon as any} size={20} color={selectedAmbientSound === sound.id ? theme.colors.primary : theme.colors.onSurfaceVariant} />
                <Text 
                  variant="labelSmall" 
                  style={{ color: selectedAmbientSound === sound.id ? theme.colors.primary : theme.colors.onSurfaceVariant, marginTop: 4 }}
                >
                  {sound.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderAiSlide = () => (
    <View style={styles.slideContent}>
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.secondaryContainer }]}>
        <Icon name="robot-happy" size={56} color={theme.colors.secondary} />
      </View>
      <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        AI-Powered Insights
      </Text>
      <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Get smart suggestions, optimal reminder times, and personalized productivity tips.
      </Text>
      
      <View style={[styles.toggleRow, { backgroundColor: theme.colors.surfaceVariant, marginTop: 24, marginBottom: 16 }]}>
        <View style={styles.toggleLabel}>
          <Icon name="star-four-points-outline" size={24} color={theme.colors.onSurface} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, marginLeft: 12 }}>
            Enable AI Features
          </Text>
        </View>
        <Switch value={aiEnabled} onValueChange={setAiEnabled} />
      </View>

      {aiEnabled && (
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <APIKeySettings 
            apiKey={apiKey} 
            onSave={async (key) => setApiKey(key)} 
          />
          
          {apiKey ? (
            <>
              <AIFeaturesSettings
                smartRemindersEnabled={smartRemindersEnabled}
                onSmartRemindersToggle={() => setSmartRemindersEnabled(!smartRemindersEnabled)}
                aiSmartReschedulingEnabled={aiSmartReschedulingEnabled}
                onSmartReschedulingToggle={() => setAiSmartReschedulingEnabled(!aiSmartReschedulingEnabled)}
                aiMotivationalEnabled={aiMotivationalEnabled}
                onMotivationalToggle={() => setAiMotivationalEnabled(!aiMotivationalEnabled)}
                aiPatternDetectionEnabled={aiPatternDetectionEnabled}
                onPatternDetectionToggle={() => setAiPatternDetectionEnabled(!aiPatternDetectionEnabled)}
                aiGoalBreakdownEnabled={aiGoalBreakdownEnabled}
                onGoalBreakdownToggle={() => setAiGoalBreakdownEnabled(!aiGoalBreakdownEnabled)}
                aiGoalCoachEnabled={aiGoalCoachEnabled}
                onGoalCoachToggle={() => setAiGoalCoachEnabled(!aiGoalCoachEnabled)}
                personalityEnabled={personalityEnabled}
                onPersonalityToggle={() => setPersonalityEnabled(!personalityEnabled)}
                hasApiKey={!!apiKey}
              />
              <AIPrivacySettings 
                piiEnabled={piiEnabled}
                onPiiToggle={() => setPiiEnabled(!piiEnabled)}
                isLast={true}
              />
            </>
          ) : (
             <View style={{ padding: 16, alignItems: 'center' }}>
                <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                   Please set your OpenRouter API Key to continue
                </Text>
             </View>
          )}
        </Surface>
      )}
    </View>
  );

  const renderCompleteSlide = () => (
    <View style={styles.slideContent}>
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
        <Icon name="check-decagram" size={64} color={theme.colors.primary} />
      </View>
      <Text variant="displaySmall" style={[styles.title, { color: theme.colors.onSurface }]}>
        You're All Set!
      </Text>
      <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Start achieving your goals today.
      </Text>
      <TouchableOpacity
        onPress={handleComplete}
        style={[styles.getStartedButton, { backgroundColor: theme.colors.primary }]}
        activeOpacity={0.8}
      >
        <Text variant="titleMedium" style={{ color: theme.colors.onPrimary, fontWeight: '600' }}>
          Get Started
        </Text>
        <Icon name="arrow-right" size={20} color={theme.colors.onPrimary} style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    </View>
  );

  const renderSlide = useCallback(({ item }: ListRenderItemInfo<SlideData>) => {
    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        {item.type === 'welcome' && renderWelcomeSlide()}
        {item.type === 'features' && renderFeaturesSlide()}
        {item.type === 'theme' && renderThemeSlide()}
        {item.type === 'notifications' && renderNotificationsSlide()}
        {item.type === 'smartfeatures' && renderSmartFeaturesSlide()}
        {item.type === 'productivity' && renderProductivitySlide()}
        {item.type === 'focustimer' && renderFocusTimerSlide()}
        {item.type === 'ai' && renderAiSlide()}
        {item.type === 'complete' && renderCompleteSlide()}
      </View>
    );
  }, [
    settings, 
    selectedMood, 
    notificationsEnabled, 
    selectedTime, 
    gamificationEnabled, 
    focusModeEnabled, 
    carryForwardEnabled, 
    calendarEnabled, 
    minimalGoalsView, 
    focusWorkDuration, 
    focusAmbientEnabled, 
    selectedAmbientSound, 
    aiEnabled, 
    palettesForMood, 
    theme,
    // Add missing AI dependencies
    apiKey,
    smartRemindersEnabled,
    personalityEnabled,
    aiSmartReschedulingEnabled,
    aiMotivationalEnabled,
    aiPatternDetectionEnabled,
    aiGoalBreakdownEnabled,
    aiGoalCoachEnabled,
    piiEnabled
  ]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        extraData={{
          settings,
          apiKey,
          aiEnabled,
          notificationsEnabled,
          selectedTime,
          currentIndex,
          selectedMood
        }}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        bounces={false}
      />

      {/* Pagination & Navigation */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {/* Dots */}
        <View style={styles.pagination}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                { 
                  backgroundColor: idx === currentIndex ? theme.colors.primary : theme.colors.outline,
                  width: idx === currentIndex ? 24 : 8,
                }
              ]}
            />
          ))}
        </View>

        {/* Nav Buttons */}
        <View style={styles.navRow}>
          {currentIndex > 0 ? (
            <TouchableOpacity
              onPress={goToPrev}
              style={[styles.navButton, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              <Icon name="chevron-left" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          ) : (
            <View style={styles.navButtonPlaceholder} />
          )}

          {currentIndex < SLIDES.length - 1 && (
            <TouchableOpacity
              onPress={goToNext}
              style={[styles.navButton, { backgroundColor: theme.colors.primary }]}
            >
              <Icon name="chevron-right" size={24} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  slideContent: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  subLabel: {
    alignSelf: 'flex-start',
    marginTop: 24,
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  featureCard: {
    width: (SCREEN_WIDTH - 80) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 16,
    borderRadius: 16,
  },
  toggleLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  moodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  paletteCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  paletteGradient: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    flexDirection: 'row',
  },
  paletteStripe: {
    flex: 1,
    height: '100%',
  },
  timePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
  },
  timeChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  footer: {
    paddingHorizontal: 32,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonPlaceholder: {
    width: 56,
    height: 56,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    marginTop: 32,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
  },
  durationChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 48,
    alignItems: 'center',
  },
  ambientSoundsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
    gap: 8,
  },
  ambientChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
});

export default OnboardingScreen;
