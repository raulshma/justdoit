import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSettings } from '../../src/context/SettingsContext';
import { AnimatedTabBar } from '../../src/components/AnimatedTabBar';

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
  
  // We can choose to use settings here if we want to toggle the custom bar or modify it
  // const { settings } = useSettings();

  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Since we have a floating tab bar, we need to hide the default one completely 
        // effectively handled by passing `tabBar` prop, but good to ensure no background leaks
        tabBarStyle: {
          position: 'absolute', // Required for transparent background extend
        },
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
              size={24} 
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
              size={24} 
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
              size={24} 
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
              size={24} 
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
