/**
 * Available color palettes for theming
 */
export type ColorPalette = 
  // Calm & Relaxing
  | 'default' | 'ocean' | 'forest' | 'zen' | 'misty'
  // Energetic & Vibrant
  | 'sunset' | 'neon' | 'tropical' | 'fiesta'
  // Elegant & Sophisticated
  | 'lavender' | 'orchid' | 'rosegold' | 'champagne'
  // Bold & Modern
  | 'brutalist' | 'obsidian' | 'midnight' | 'slate'
  // App Inspired
  | 'spotify' | 'discord' | 'airbnb' | 'notion' | 'linear';

/**
 * Mood categories for theme grouping
 */
export type ThemeMood = 'calm' | 'energetic' | 'elegant' | 'bold' | 'inspired';

/**
 * Color palette display information
 */
export interface ColorPaletteInfo {
  id: ColorPalette;
  name: string;
  colors: string[]; // Preview colors for the palette
  mood: ThemeMood;
}

/**
 * Theme mood display information
 */
export interface ThemeMoodInfo {
  id: ThemeMood;
  name: string;
  description: string;
}

/**
 * User's selected focus area for AI personalization
 */
export type AIFocusArea = 
  | 'productivity'
  | 'health'
  | 'learning'
  | 'wellness'
  | 'creativity'
  | 'finance';

/**
 * Application settings for user preferences
 */
export interface AppSettings {
  /** Whether daily planning reminder is enabled */
  dailyReminderEnabled: boolean;
  /** Time for daily reminder in HH:mm format */
  dailyReminderTime: string;
  /** Whether notifications are enabled globally */
  notificationsEnabled: boolean;
  /** Whether dark mode is enabled */
  darkModeEnabled: boolean;
  /** Selected color palette */
  colorPalette: ColorPalette;
  /** OpenRouter API key for AI features */
  openRouterApiKey?: string;
  /** Selected AI model ID */
  selectedAiModel?: string;
  /** Enable smart reminder suggestions */
  smartRemindersEnabled: boolean;
  /** Enable focus mode */
  focusModeEnabled: boolean;
  /** Enable auto carry-forward of incomplete goals */
  carryForwardEnabled: boolean;
  /** Enable calendar integration to show calendar events on goals page */
  calendarIntegrationEnabled: boolean;
  /** Enable gamification features (XP, badges, challenges, personal bests) */
  gamificationEnabled: boolean;
  /** Show labels on the bottom navigation tab bar */
  showTabBarLabels: boolean;
  /** User's selected AI focus area for personalized suggestions */
  aiFocusArea?: AIFocusArea;
  /** Enable AI personality insights tracking */
  aiPersonalityEnabled?: boolean;
  /** Enable PII anonymization before sending data to AI */
  aiPiiAnonymizationEnabled?: boolean;
  /** Whether user has completed the onboarding flow */
  hasCompletedOnboarding: boolean;
  /** Convex deployment URL for cloud backup */
  convexUrl?: string;
  /** Convex authentication token for cloud backup */
  convexToken?: string;
  /** Whether to use minimal goals view by default */
  minimalGoalsView: boolean;
}

