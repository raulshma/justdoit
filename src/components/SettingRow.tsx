import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Surface, TouchableRipple, Icon } from 'react-native-paper';
import { withAlpha } from '../utils/colorUtils';

/**
 * Setting Row Component - High fidelity with improved spacing and typography
 */
export const SettingRow = memo(({
  icon,
  title,
  subtitle,
  right,
  onPress,
  disabled = false,
  danger = false,
  isLast = false,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  danger?: boolean;
  isLast?: boolean;
}) => {
  const theme = useTheme();
  
  return (
    <TouchableRipple 
      onPress={!disabled && onPress ? onPress : undefined}
      disabled={disabled}
      style={[
        styles.settingRow, 
        disabled && styles.disabledRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: withAlpha(theme.colors.outlineVariant, 0.25) }
      ]}
      rippleColor={withAlpha(theme.colors.primaryContainer, 0.25)}
    >
      <View style={styles.settingRowContent}>
        <Surface style={[styles.iconContainer, { backgroundColor: withAlpha(theme.colors.secondaryContainer, 0.3) }]} elevation={0}>
          <Icon source={icon} size={24} color={theme.colors.onSecondaryContainer} />
        </Surface>
        <View style={styles.settingTextContainer}>
          <Text variant="titleMedium" style={[styles.settingTitle, { color: danger ? theme.colors.error : theme.colors.onSurface }]}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="bodyMedium" style={[styles.settingSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {subtitle}
            </Text>
          )}
        </View>
        {right && <View style={styles.settingRight}>{right}</View>}
      </View>
    </TouchableRipple>
  );
});

const styles = StyleSheet.create({
  settingRow: {
    paddingVertical: 16,
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
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  settingTitle: {
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  settingSubtitle: {
    marginTop: 2,
    fontSize: 13,
  },
  settingRight: {
    marginLeft: 12,
  },
});
