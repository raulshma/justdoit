import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';

interface XPDisplayProps {
  /** Current total XP */
  totalXP: number;
  /** Current level */
  currentLevel: number;
  /** Whether to show compact version */
  compact?: boolean;
}

/**
 * XPDisplay component shows the current XP and level
 * 
 * Requirements: 6.5, 6.6
 */
export const XPDisplay: React.FC<XPDisplayProps> = ({
  totalXP,
  currentLevel,
  compact = false,
}) => {
  const theme = useTheme();

  /**
   * Format XP number with K suffix for large values
   */
  const formatXP = (xp: number): string => {
    if (xp >= 10000) {
      return `${(xp / 1000).toFixed(1)}K`;
    }
    if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K`;
    }
    return xp.toString();
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.levelBadge, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text
            variant="labelMedium"
            style={[styles.levelText, { color: theme.colors.onPrimaryContainer }]}
          >
            Lv.{currentLevel}
          </Text>
        </View>
        <View style={styles.xpCompact}>
          <ThemedIcon name="star" size={14} color={theme.colors.primary} />
          <Text
            variant="labelMedium"
            style={[styles.xpTextCompact, { color: theme.colors.onSurface }]}
          >
            {formatXP(totalXP)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.levelContainer}>
        <View style={[styles.levelCircle, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text
            variant="headlineMedium"
            style={[styles.levelNumber, { color: theme.colors.onPrimaryContainer }]}
          >
            {currentLevel}
          </Text>
        </View>
        <Text
          variant="labelMedium"
          style={[styles.levelLabel, { color: theme.colors.onSurfaceVariant }]}
        >
          Level
        </Text>
      </View>

      <View style={styles.xpContainer}>
        <View style={styles.xpRow}>
          <ThemedIcon name="star" size={24} color={theme.colors.primary} />
          <Text
            variant="headlineSmall"
            style={[styles.xpValue, { color: theme.colors.onSurface }]}
          >
            {formatXP(totalXP)}
          </Text>
        </View>
        <Text
          variant="labelSmall"
          style={[styles.xpLabel, { color: theme.colors.onSurfaceVariant }]}
        >
          Total XP
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelContainer: {
    alignItems: 'center',
  },
  levelCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    fontWeight: '800',
  },
  levelLabel: {
    marginTop: 4,
    fontWeight: '500',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontWeight: '700',
  },
  xpContainer: {
    alignItems: 'flex-start',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xpValue: {
    fontWeight: '700',
  },
  xpLabel: {
    marginTop: 2,
  },
  xpCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpTextCompact: {
    fontWeight: '600',
  },
});

export default XPDisplay;
