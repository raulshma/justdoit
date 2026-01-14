import React, { memo, useMemo } from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

/**
 * Common theme color keys available for icons
 */
type ThemeColorKey =
  | 'primary'
  | 'onPrimary'
  | 'primaryContainer'
  | 'onPrimaryContainer'
  | 'secondary'
  | 'onSecondary'
  | 'secondaryContainer'
  | 'onSecondaryContainer'
  | 'tertiary'
  | 'onTertiary'
  | 'tertiaryContainer'
  | 'onTertiaryContainer'
  | 'error'
  | 'onError'
  | 'errorContainer'
  | 'onErrorContainer'
  | 'surface'
  | 'onSurface'
  | 'surfaceVariant'
  | 'onSurfaceVariant'
  | 'outline'
  | 'outlineVariant'
  | 'background'
  | 'onBackground';

export interface ThemedIconProps {
  /** MaterialCommunityIcons name */
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  /** Icon size (default: 24) */
  size?: number;
  /** 
   * Direct color override. Takes precedence over themeColor.
   * Use this for custom/dynamic colors.
   */
  color?: string;
  /** 
   * Theme color key (e.g., 'primary', 'onSurface', 'error').
   * Automatically resolves from current theme.
   */
  themeColor?: ThemeColorKey;
  /** Optional style for the icon */
  style?: StyleProp<TextStyle>;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Comparison function for React.memo
 * Only re-render if actual props that affect appearance change
 */
const arePropsEqual = (
  prevProps: ThemedIconProps,
  nextProps: ThemedIconProps
): boolean => {
  return (
    prevProps.name === nextProps.name &&
    prevProps.size === nextProps.size &&
    prevProps.color === nextProps.color &&
    prevProps.themeColor === nextProps.themeColor
    // Style comparison is expensive, skip for perf (assume stable refs)
  );
};

/**
 * ThemedIcon - A memoized, theme-aware icon component
 * 
 * Performance optimizations:
 * - Uses React.memo with custom comparison to prevent unnecessary re-renders
 * - Resolves theme colors efficiently
 * - Single source: @expo/vector-icons (MaterialCommunityIcons)
 * 
 * @example
 * // Using theme color
 * <ThemedIcon name="check" themeColor="primary" />
 * 
 * // Using custom color
 * <ThemedIcon name="bell" color="#FF5722" />
 * 
 * // With size override
 * <ThemedIcon name="home" size={32} themeColor="onSurface" />
 */
const ThemedIconComponent: React.FC<ThemedIconProps> = ({
  name,
  size = 24,
  color,
  themeColor = 'onSurface',
  style,
  testID,
}) => {
  const theme = useTheme();

  // Resolve the final color - direct color takes precedence
  const resolvedColor = useMemo(() => {
    if (color) return color;
    return theme.colors[themeColor] || theme.colors.onSurface;
  }, [color, themeColor, theme.colors]);

  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={resolvedColor}
      style={style}
      testID={testID}
    />
  );
};

export const ThemedIcon = memo(ThemedIconComponent, arePropsEqual);

export default ThemedIcon;
