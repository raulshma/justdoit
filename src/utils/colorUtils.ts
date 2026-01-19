import Color from 'color';

/**
 * Apply an alpha/opacity to a color string.
 *
 * Works with hex and rgb/rgba strings.
 * If parsing fails, returns the original color.
 */
export function withAlpha(color: string, alpha: number): string {
  try {
    return Color(color).alpha(alpha).rgb().string();
  } catch {
    return color;
  }
}
