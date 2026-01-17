import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSettings } from '../../src/context/SettingsContext';

/**
 * Tab Layout with Expo Router Tabs
 * Uses standard Tabs component with animations
 * 
 * Features:
 * - MaterialCommunityIcons for consistent cross-platform look
 * - Theme-aware colors
 * - Hidden labels option from settings
 * - Smooth animations
 */
export default function TabLayout() {
  const theme = useTheme();
  const { settings } = useSettings();
  const showLabels = settings.showTabBarLabels;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          borderTopWidth: 0.5,
          paddingTop: 4,
          height: Platform.OS === 'ios' ? 85 : 60,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 8,
        },
        tabBarShowLabel: showLabels,
        // Add animation for tab switching
        animation: 'shift',
        tabBarHideOnKeyboard: true,
      }}
    >
      {/* Goals Tab - Index handles conditional rendering of Full/Minimal view */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? 'bullseye-arrow' : 'bullseye'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />

      {/* Focus Tab */}
      <Tabs.Screen
        name="focus"
        options={{
          title: 'Focus',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? 'timer' : 'timer-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />

      {/* Progress Tab */}
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? 'chart-line' : 'chart-timeline-variant'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />

      {/* Settings Tab */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? 'cog' : 'cog-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      
      {/* Explicitly hide other potential routes in this directory if any exist */}
      <Tabs.Screen
        name="minimal"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
