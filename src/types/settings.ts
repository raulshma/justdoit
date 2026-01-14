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
  | 'brutalist' | 'obsidian' | 'midnight' | 'slate';

/**
 * Mood categories for theme grouping
 */
export type ThemeMood = 'calm' | 'energetic' | 'elegant' | 'bold';

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
}
