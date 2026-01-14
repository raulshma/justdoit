import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { ThemedIcon, ThemedIconProps } from './ThemedIcon';

interface StatCardProps {
  /** The main value to display */
  value: string | number;
  /** Label describing the statistic */
  label: string;
  /** Icon name from MaterialCommunityIcons */
  icon?: ThemedIconProps['name'];
  /** Optional subtitle or additional info */
  subtitle?: string;
  /** Card variant for different styling */
  variant?: 'default' | 'primary' | 'secondary' | 'tertiary';
}

/**
 * StatCard component displays a single metric with label and optional icon.
 * enhanced for High Fidelity aesthetics.
 * 
 * Requirements: 11.1, 11.2, 11.6
 */
export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon,
  subtitle,
  variant = 'default',
}) => {
  const theme = useTheme();

  const getThemeColors = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: theme.colors.primaryContainer,
          fg: theme.colors.onPrimaryContainer,
          icon: theme.colors.primary,
        };
      case 'secondary':
        return {
          bg: theme.colors.secondaryContainer,
          fg: theme.colors.onSecondaryContainer,
          icon: theme.colors.secondary,
        };
      case 'tertiary':
        return {
          bg: theme.colors.tertiaryContainer,
          fg: theme.colors.onTertiaryContainer,
          icon: theme.colors.tertiary,
        };
      default:
        return {
          bg: theme.colors.surfaceVariant,
          fg: theme.colors.onSurfaceVariant,
          icon: theme.colors.onSurfaceVariant,
        };
    }
  };

  const colors = getThemeColors();

  return (
    <Card
      style={[styles.card, { backgroundColor: colors.bg }]}
      mode="contained"
    >
      <View style={styles.content}>
        <View style={styles.header}>
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.surface }]}>
              <ThemedIcon name={icon} size={20} color={colors.icon} />
            </View>
          )}
        </View>
        
        <View style={styles.valueContainer}>
          <Text
            variant="headlineMedium"
            style={[styles.value, { color: colors.fg }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Text>
          
          <Text
            variant="bodySmall"
            style={[styles.label, { color: colors.fg, opacity: 0.8 }]}
          >
            {label}
          </Text>

          {subtitle && (
            <Text
              variant="labelSmall"
              style={[styles.subtitle, { color: colors.fg, opacity: 0.6 }]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    flex: 1,
    minHeight: 160,
    elevation: 0,
    // Soft shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  content: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
  },
  valueContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  value: {
    fontWeight: '800',
    fontSize: 28,
    marginBottom: 4,
  },
  label: {
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 2,
  },
});

export default StatCard;
