import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { getColorsForPalette } from './colors';
import type { ColorPalette } from '../types/settings';

/**
 * Create a custom theme based on palette and dark mode setting
 * Updated for High Fidelity: Rounded corners, polished metrics
 */
const createTheme = (isDarkMode: boolean, palette: ColorPalette) => {
  const baseTheme = isDarkMode ? MD3DarkTheme : MD3LightTheme;
  const colors = getColorsForPalette(palette, isDarkMode);

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      primaryContainer: colors.primaryContainer,
      onPrimary: colors.onPrimary,
      onPrimaryContainer: colors.onPrimaryContainer,
      secondary: colors.secondary,
      secondaryContainer: colors.secondaryContainer,
      onSecondary: colors.onSecondary,
      onSecondaryContainer: colors.onSecondaryContainer,
      tertiary: colors.tertiary,
      tertiaryContainer: colors.tertiaryContainer,
      onTertiary: colors.onTertiary,
      onTertiaryContainer: colors.onTertiaryContainer,
      surface: colors.surface,
      surfaceVariant: colors.surfaceVariant,
      onSurface: colors.onSurface,
      onSurfaceVariant: colors.onSurfaceVariant,
      background: colors.background,
      onBackground: colors.onBackground,
      error: colors.error,
      errorContainer: colors.errorContainer,
      onError: colors.onError,
      onErrorContainer: colors.onErrorContainer,
      outline: colors.outline,
      outlineVariant: colors.outlineVariant,
    },
    // High-Fidelity Roundness (24 is the new 16)
    roundness: 24, 
  };
};

/**
 * Get the appropriate theme based on dark mode preference and color palette
 * @param isDarkMode Whether dark mode is enabled
 * @param palette Selected color palette (defaults to 'default')
 */
export const getTheme = (isDarkMode: boolean, palette: ColorPalette = 'default') => {
  return createTheme(isDarkMode, palette);
};

// Pre-built theme exports for backward compatibility
export const customLightTheme = createTheme(false, 'default');
export const customDarkTheme = createTheme(true, 'default');
