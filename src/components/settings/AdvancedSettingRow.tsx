import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Switch, Icon, Surface, TouchableRipple } from 'react-native-paper';

/**
 * AdvancedSettingRow
 *
 * This is the richer SettingRow used by the Settings screens.
 * It supports switches, badges, right-side text, and fully custom right nodes.
 *
 * NOTE: This component is intentionally kept API-compatible with the inline
 * SettingRow previously defined in `src/screens/SettingsScreen.tsx`.
 */
export const AdvancedSettingRow = memo(({
  icon,
  title,
  subtitle,
  right,
  switchValue,
  onSwitchValueChange,
  switchDisabled,
  badgeText,
  badgeTone = 'secondary',
  rightText,
  rightTextColor,
  onPress,
  disabled = false,
  danger = false,
  isLast = false,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  switchValue?: boolean;
  onSwitchValueChange?: () => void;
  switchDisabled?: boolean;
  badgeText?: string;
  badgeTone?: 'primary' | 'secondary';
  rightText?: string;
  rightTextColor?: string;
  onPress?: () => void;
  disabled?: boolean;
  danger?: boolean;
  isLast?: boolean;
}) => {
  const theme = useTheme();

  const rightNode = useMemo(() => {
    if (typeof switchValue === 'boolean' && onSwitchValueChange) {
      return (
        <Switch
          value={switchValue}
          onValueChange={onSwitchValueChange}
          color={theme.colors.primary}
          disabled={switchDisabled}
        />
      );
    }

    if (badgeText) {
      const backgroundColor =
        badgeTone === 'primary' ? theme.colors.primaryContainer : theme.colors.secondaryContainer + '50';
      const color = badgeTone === 'primary' ? theme.colors.primary : theme.colors.onSecondaryContainer;
      return (
        <View style={[styles.smallBadge, { backgroundColor }]}>
          <Text variant="labelMedium" style={{ color }}>
            {badgeText}
          </Text>
        </View>
      );
    }

    if (rightText) {
      return (
        <Text variant="labelMedium" style={{ color: rightTextColor || theme.colors.primary }}>
          {rightText}
        </Text>
      );
    }

    return right;
  }, [
    badgeText,
    badgeTone,
    onSwitchValueChange,
    right,
    rightText,
    rightTextColor,
    switchDisabled,
    switchValue,
    theme.colors.onSecondaryContainer,
    theme.colors.primary,
    theme.colors.primaryContainer,
    theme.colors.secondaryContainer,
  ]);

  return (
    <TouchableRipple
      onPress={!disabled && onPress ? onPress : undefined}
      disabled={disabled}
      style={[
        styles.settingRow,
        disabled && styles.disabledRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant + '40' },
      ]}
      rippleColor={theme.colors.primaryContainer + '40'}
    >
      <View style={styles.settingRowContent}>
        <Surface style={[styles.iconContainer, { backgroundColor: theme.colors.secondaryContainer + '50' }]} elevation={0}>
          <Icon source={icon} size={24} color={theme.colors.onSecondaryContainer} />
        </Surface>
        <View style={styles.settingTextContainer}>
          <Text
            variant="titleMedium"
            style={[styles.settingTitle, { color: danger ? theme.colors.error : theme.colors.onSurface }]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text variant="bodyMedium" style={[styles.settingSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightNode && <View style={styles.settingRight}>{rightNode}</View>}
      </View>
    </TouchableRipple>
  );
});

const styles = StyleSheet.create({
  settingRow: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  disabledRow: {
    opacity: 0.4,
  },
  settingRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  settingTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  settingTitle: {
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  settingSubtitle: {
    marginTop: 2,
    fontSize: 13,
  },
  settingRight: {
    marginLeft: 12,
  },
  smallBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
