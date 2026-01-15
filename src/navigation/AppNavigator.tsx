import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import type {
  HomeStackParamList,
  StatisticsStackParamList,
  SettingsStackParamList,
  RootTabParamList,
  RootStackParamList,
} from './types';
import {
  HomeScreen,
  GoalFormScreen,
  StatisticsScreen,
  SettingsScreen,
  ModelSelectionScreen,
  TemplatesScreen,
  AchievementsScreen,
  ChallengesScreen,
  LogsScreen,
  AISettingsScreen,
  OnboardingScreen,
  MinimalGoalsScreen,
} from '../screens';

// Create navigators
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const StatisticsStack = createNativeStackNavigator<StatisticsStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();


/**
 * Home Stack Navigator
 * Contains: Home screen only (GoalForm is now a modal at root level)
 * Requirements: 7.3 - Smooth, subtle animations for transitions
 */
function HomeStackNavigator() {
  const theme = useTheme();

  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
        // Subtle fade/slide animation for screen transitions
        animation: 'fade_from_bottom',
        animationDuration: 250,
      }}
    >
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'My Goals' }}
      />
      <HomeStack.Screen
        name="MinimalGoals"
        component={MinimalGoalsScreen}
        options={{ 
          title: 'Goals',
          animation: 'fade',
          animationDuration: 100,
        }}
      />
    </HomeStack.Navigator>
  );
}

/**
 * Statistics Stack Navigator
 * Contains: Statistics screen
 * Requirements: 7.3 - Smooth, subtle animations for transitions
 */
function StatisticsStackNavigator() {
  const theme = useTheme();

  return (
    <StatisticsStack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
        // Subtle fade animation for screen transitions
        animation: 'fade',
        animationDuration: 200,
      }}
    >
      <StatisticsStack.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{ title: 'Progress' }}
      />
    </StatisticsStack.Navigator>
  );
}

/**
 * Settings Stack Navigator
 * Contains: Settings screen
 * Requirements: 7.3 - Smooth, subtle animations for transitions
 */
function SettingsStackNavigator() {
  const theme = useTheme();

  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
        // Subtle fade animation for screen transitions
        animation: 'fade',
        animationDuration: 200,
      }}
    >
      <SettingsStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </SettingsStack.Navigator>
  );
}


/**
 * Tab bar icon component using MaterialCommunityIcons
 */
function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  const icons: Record<string, React.ComponentProps<typeof Icon>['name']> = {
    home: 'bullseye-arrow',
    stats: 'chart-timeline-variant',
    settings: 'cog-outline',
  };

  return (
    <Icon name={icons[name] || 'circle'} size={size} color={color} />
  );
}

/**
 * Main Tab Navigator
 * Contains Home, Statistics, and Settings tabs
 */
function MainTabNavigator() {
  const theme = useTheme();
  const { settings } = useSettings();
  const showLabels = settings.showTabBarLabels;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          borderTopWidth: 0.325,
          paddingBottom: showLabels ? 16 : 24,
          paddingTop: showLabels ? 12 : 16,
          height: showLabels ? 75 : 70,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarShowLabel: showLabels,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Goals',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home" color={color} size={showLabels ? size : 26} />
          ),
        }}
      />
      <Tab.Screen
        name="StatisticsTab"
        component={StatisticsStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="stats" color={color} size={showLabels ? size : 26} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="settings" color={color} size={showLabels ? size : 26} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Main App Navigator with Root Stack
 * Contains MainTabs and modal screens (GoalForm)
 * GoalForm is presented as a fullscreen modal without tab bar
 * Supports notification response navigation (Requirement 4.3)
 */
export function AppNavigator() {
  const theme = useTheme();
  const { settings, isLoading } = useSettings();

  // Show onboarding for first-time users
  if (!isLoading && !settings.hasCompletedOnboarding) {
    return <OnboardingScreen />;
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <RootStack.Screen
        name="MainTabs"
        component={MainTabNavigator}
      />
      <RootStack.Screen
        name="GoalForm"
        component={GoalFormScreen}
        options={{
          presentation: 'pageSheet',
          animation: 'slide_from_bottom',
          animationDuration: 100,
          headerShown: false,
        }}
      />
      <RootStack.Screen
        name="ModelSelection"
        component={ModelSelectionScreen}
        options={{
          presentation: 'pageSheet',
          animation: 'slide_from_bottom',
          animationDuration: 100,
          headerShown: false,
        }}
      />
      <RootStack.Screen
        name="Templates"
        component={TemplatesScreen}
        options={{
          presentation: 'pageSheet',
          animation: 'slide_from_bottom',
          animationDuration: 100,
          headerShown: false,
        }}
      />
      <RootStack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{
          presentation: 'pageSheet',
          animation: 'slide_from_bottom',
          animationDuration: 100,
          headerShown: false,
        }}
      />
      <RootStack.Screen
        name="Challenges"
        component={ChallengesScreen}
        options={{
          presentation: 'pageSheet',
          animation: 'slide_from_bottom',
          animationDuration: 100,
          headerShown: false,
        }}
      />
      <RootStack.Screen
        name="Logs"
        component={LogsScreen}
        options={{
          presentation: 'pageSheet',
          animation: 'slide_from_bottom',
          animationDuration: 100,
          headerShown: false,
        }}
      />
      <RootStack.Screen
        name="AISettings"
        component={AISettingsScreen}
        options={{
          presentation: 'pageSheet',
          animation: 'slide_from_bottom',
          animationDuration: 100,
          headerShown: false,
        }}
      />
    </RootStack.Navigator>
  );
}



export default AppNavigator;

