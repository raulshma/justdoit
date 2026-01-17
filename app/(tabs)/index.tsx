import React from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSettings } from '../../src/context/SettingsContext';
import { HomeScreen } from '../../src/screens/HomeScreen';
import { MinimalGoalsScreen } from '../../src/screens/MinimalGoalsScreen';

/**
 * Goals Tab (Index)
 * Acts as a controller to switch between Full and Minimal goals view based on settings.
 * Includes smooth fade transition between views.
 */
export default function GoalsTab() {
  const { settings } = useSettings();

  return (
    <Animated.View 
      style={{ flex: 1 }}
      // Key change triggers re-mount and animation
      key={settings.minimalGoalsView ? 'minimal' : 'full'}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
    >
      {settings.minimalGoalsView ? <MinimalGoalsScreen /> : <HomeScreen />}
    </Animated.View>
  );
}
