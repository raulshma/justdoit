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
import { Text, useTheme, Switch } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { ThemeMood, ColorPalette, ColorPaletteInfo } from '../types/settings';
import { colorPaletteInfoList } from '../theme/colors';
import { DEFAULT_REMINDER_TIME } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SlideData {
  id: string;
  type: 'welcome' | 'features' | 'theme' | 'notifications' | 'smartfeatures' | 'ai' | 'complete';
}

const SLIDES: SlideData[] = [
  { id: 'welcome', type: 'welcome' },
  { id: 'features', type: 'features' },
  { id: 'theme', type: 'theme' },
  { id: 'notifications', type: 'notifications' },
  { id: 'smartfeatures', type: 'smartfeatures' },
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

const MOODS: ThemeMood[] = ['calm', 'energetic', 'elegant', 'bold'];

const MOOD_LABELS: Record<ThemeMood, string> = {
  calm: 'Calm',
  energetic: 'Energetic',
  elegant: 'Elegant',
  bold: 'Bold',
};

const MOOD_ICONS: Record<ThemeMood, React.ComponentProps<typeof Icon>['name']> = {
  calm: 'water-outline',
  energetic: 'lightning-bolt',
  elegant: 'diamond-stone',
  bold: 'cube-outline',
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
  const [gamificationEnabled, setGamificationEnabled] = useState(true);
  const [focusModeEnabled, setFocusModeEnabled] = useState(false);
  const [carryForwardEnabled, setCarryForwardEnabled] = useState(true);

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
    });
    await completeOnboarding();
  }, [notificationsEnabled, selectedTime, gamificationEnabled, focusModeEnabled, carryForwardEnabled, updateSettings, completeOnboarding]);

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
      { icon: 'target', label: 'Smart Goal Tracking', desc: 'Set, manage, and complete daily goals' },
      { icon: 'chart-line', label: 'Progress Insights', desc: 'Visualize your productivity trends' },
      { icon: 'trophy', label: 'Gamification', desc: 'Earn XP, badges, and complete challenges' },
      { icon: 'brain', label: 'AI Assistant', desc: 'Get smart suggestions and insights' },
    ];
    return (
      <View style={styles.slideContent}>
        <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Powerful Features
        </Text>
        <View style={styles.featuresGrid}>
          {features.map((f, idx) => (
            <View 
              key={idx} 
              style={[styles.featureCard, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              <Icon name={f.icon as any} size={32} color={theme.colors.primary} />
              <Text variant="titleSmall" style={{ color: theme.colors.onSurface, marginTop: 8 }}>
                {f.label}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
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
      <View style={[styles.toggleRow, { backgroundColor: theme.colors.surfaceVariant, marginTop: 32 }]}>
        <View style={styles.toggleLabel}>
          <Icon name="star-four-points-outline" size={24} color={theme.colors.onSurface} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, marginLeft: 12 }}>
            Enable AI Features
          </Text>
        </View>
        <Switch value={aiEnabled} onValueChange={setAiEnabled} />
      </View>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12, textAlign: 'center' }}>
        You can configure your AI provider in Settings later.
      </Text>
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
        {item.type === 'ai' && renderAiSlide()}
        {item.type === 'complete' && renderCompleteSlide()}
      </View>
    );
  }, [settings, selectedMood, notificationsEnabled, selectedTime, gamificationEnabled, focusModeEnabled, carryForwardEnabled, aiEnabled, palettesForMood, theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
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
});

export default OnboardingScreen;
