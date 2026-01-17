import React, { useEffect, useRef, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import BootSplash from 'react-native-bootsplash';
import SplashScreen from './src/screens/SplashScreen';

import { GoalProvider, SettingsProvider, StatisticsProvider, CategoryProvider, GamificationProvider, AlertProvider, useSettings } from './src/context';
import { AppNavigator } from './src/navigation';
import { getTheme } from './src/theme';
import { notificationService, carryForwardService } from './src/services';
import type { RootStackParamList } from './src/navigation/types';

/**
 * Inner app component that has access to settings context
 * Handles theme switching based on dark mode setting
 */
function AppContent() {
  const { settings } = useSettings();
  const theme = getTheme(settings.darkModeEnabled, settings.colorPalette);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const notificationResponseSubscription = useRef<Notifications.EventSubscription | null>(null);

  const [isAppReady, setAppReady] = React.useState(false);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = React.useState(false);

  /**
   * Handle notification response - navigate to goal detail
   * Requirements: 4.3 - Open app and navigate to relevant goal when notification tapped
   */
  const handleNotificationResponse = useCallback((goalId: string) => {
    if (navigationRef.current) {
      // Navigate to the goal form screen in view mode
      navigationRef.current.navigate('GoalForm', {
        goalId,
        mode: 'view',
      });
    }
  }, []);

  /**
   * Initialize notification permissions on first launch
   * Also process carry-forward for incomplete goals
   * Requirements: 5.1 - Request notification permissions from user
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Process carry-forward for incomplete goals from previous days
        const carriedCount = await carryForwardService.processCarryForward();
        if (carriedCount > 0) {
          console.log(`Carried forward ${carriedCount} incomplete goal(s) to today`);
        }
        
        // Initialize notifications
        const hasPermission = await notificationService.requestPermissions();
        if (hasPermission && settings.dailyReminderEnabled && settings.notificationsEnabled) {
          // Schedule daily planning reminder if enabled
          await notificationService.scheduleDailyPlanningReminder(settings.dailyReminderTime);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp().finally(() => {
      // Mark app as ready, but don't hide splash yet (SplashScreen component handles it)
      setAppReady(true);
    });
  }, [settings.dailyReminderEnabled, settings.notificationsEnabled, settings.dailyReminderTime]);

  /**
   * Set up notification response handler
   * Requirements: 4.3 - Handle tap on notification to navigate to goal
   */
  useEffect(() => {
    // Set up the notification response handler
    notificationService.setNotificationResponseHandler(handleNotificationResponse);

    // Also listen for notification responses directly
    notificationResponseSubscription.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        const goalId = data?.goalId as string | undefined;
        
        if (goalId) {
          handleNotificationResponse(goalId);
        }
      }
    );

    // Check if app was opened from a notification
    const checkInitialNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        const data = response.notification.request.content.data;
        const goalId = data?.goalId as string | undefined;
        
        if (goalId) {
          // Small delay to ensure navigation is ready
          setTimeout(() => {
            handleNotificationResponse(goalId);
          }, 500);
        }
      }
    };

    checkInitialNotification();

    return () => {
      if (notificationResponseSubscription.current) {
        notificationResponseSubscription.current.remove();
      }
    };
  }, [handleNotificationResponse]);

  return (
    <PaperProvider theme={theme}>
      <AlertProvider>
        <NavigationContainer ref={navigationRef}>
          <AppNavigator />
        </NavigationContainer>
        <StatusBar style={settings.darkModeEnabled ? 'light' : 'dark'} />
        {!isSplashAnimationComplete && (
          <SplashScreen 
            isAppReady={isAppReady}
            onAnimationComplete={() => setIsSplashAnimationComplete(true)}
          />
        )}
      </AlertProvider>
    </PaperProvider>
  );
}

/**
 * Main App component
 * Sets up all context providers and the app structure
 * 
 * Requirements:
 * - 5.1: Request notification permissions on first launch
 * - 4.3: Handle notification response navigation
 * - 7.1: Apply Material Design 3 theme with warm color palette
 */
export default function App() {
  return (
    <SettingsProvider>
      <GoalProvider>
        <CategoryProvider>
          <GamificationProvider>
            <StatisticsProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <AppContent />
              </GestureHandlerRootView>
            </StatisticsProvider>
          </GamificationProvider>
        </CategoryProvider>
      </GoalProvider>
    </SettingsProvider>
  );
}
