import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Surface, Icon } from 'react-native-paper';
import type { Statistics } from '../types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Format hour to 12-hour format
 */
const formatHour = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

interface InsightsSectionProps {
  stats: Statistics;
}

/**
 * InsightsSection - Displays productivity patterns and AI-powered insights
 */
export const InsightsSection: React.FC<InsightsSectionProps> = ({ stats }) => {
  const theme = useTheme();

  const hasPeakData = stats.peakHours.length > 0;
  const hasLowDays = stats.lowPerformanceDays.length > 0;
  const hasAnyData = hasPeakData || hasLowDays;

  if (!hasAnyData) {
    return null; // Don't show section if no data
  }

  return (
    <View style={styles.container}>
      <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
        PRODUCTIVITY INSIGHTS
      </Text>

      {/* Peak Hours */}
      {hasPeakData && (
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <View style={styles.cardHeader}>
            <Surface style={[styles.iconBg, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
              <Icon source="clock-fast" size={24} color={theme.colors.primary} />
            </Surface>
            <View style={styles.cardTitleContainer}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Peak Productivity Hours
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                You complete the most goals during these times
              </Text>
            </View>
          </View>
          
          <View style={styles.chipsRow}>
            {stats.peakHours.map((hour, index) => (
              <Surface
                key={hour}
                style={[
                  styles.chip,
                  { 
                    backgroundColor: index === 0 
                      ? theme.colors.primaryContainer 
                      : theme.colors.surfaceVariant 
                  }
                ]}
                elevation={0}
              >
                <Icon 
                  source={index === 0 ? 'star' : 'clock-outline'} 
                  size={16} 
                  color={index === 0 ? theme.colors.primary : theme.colors.onSurfaceVariant} 
                />
                <Text 
                  variant="labelLarge" 
                  style={{ 
                    color: index === 0 ? theme.colors.primary : theme.colors.onSurfaceVariant,
                    fontWeight: index === 0 ? '700' : '500',
                    marginLeft: 6,
                  }}
                >
                  {formatHour(hour)}
                </Text>
                {stats.completionsByHour[hour] > 0 && (
                  <Text 
                    variant="labelSmall" 
                    style={{ 
                      color: theme.colors.onSurfaceVariant, 
                      marginLeft: 4,
                      opacity: 0.7,
                    }}
                  >
                    ({stats.completionsByHour[hour]})
                  </Text>
                )}
              </Surface>
            ))}
          </View>
        </Surface>
      )}

      {/* Best Days */}
      {stats.completionsByDayOfWeek.some(c => c > 0) && (
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <View style={styles.cardHeader}>
            <Surface style={[styles.iconBg, { backgroundColor: theme.colors.secondaryContainer }]} elevation={0}>
              <Icon source="calendar-check" size={24} color={theme.colors.secondary} />
            </Surface>
            <View style={styles.cardTitleContainer}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Weekly Pattern
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Your completion distribution by day
              </Text>
            </View>
          </View>
          
          <View style={styles.weekGrid}>
            {stats.completionsByDayOfWeek.map((count, day) => {
              const maxCount = Math.max(...stats.completionsByDayOfWeek, 1);
              const heightPercent = (count / maxCount) * 100;
              const isLowDay = stats.lowPerformanceDays.includes(day);
              
              return (
                <View key={day} style={styles.dayColumn}>
                  <View style={styles.barContainer}>
                    <View 
                      style={[
                        styles.bar, 
                        { 
                          height: `${Math.max(heightPercent, 5)}%`,
                          backgroundColor: isLowDay 
                            ? theme.colors.errorContainer 
                            : theme.colors.primaryContainer,
                        }
                      ]} 
                    />
                  </View>
                  <Text 
                    variant="labelSmall" 
                    style={[
                      styles.dayLabel,
                      { 
                        color: isLowDay 
                          ? theme.colors.error 
                          : theme.colors.onSurfaceVariant 
                      }
                    ]}
                  >
                    {DAY_NAMES[day]}
                  </Text>
                  <Text 
                    variant="labelSmall" 
                    style={{ color: theme.colors.onSurfaceVariant, opacity: 0.6 }}
                  >
                    {count}
                  </Text>
                </View>
              );
            })}
          </View>
        </Surface>
      )}

      {/* Areas for Improvement */}
      {hasLowDays && (
        <Surface style={[styles.tipCard, { backgroundColor: theme.colors.tertiaryContainer }]} elevation={0}>
          <Icon source="lightbulb-outline" size={20} color={theme.colors.tertiary} />
          <Text variant="bodyMedium" style={[styles.tipText, { color: theme.colors.onTertiaryContainer }]}>
            <Text style={{ fontWeight: '700' }}>Tip: </Text>
            You tend to complete fewer goals on{' '}
            {stats.lowPerformanceDays.map((d, i) => (
              <Text key={d} style={{ fontWeight: '600' }}>
                {DAY_NAMES[d]}{i < stats.lowPerformanceDays.length - 1 ? ', ' : ''}
              </Text>
            ))}
            . Try scheduling important tasks on your stronger days!
          </Text>
        </Surface>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    marginLeft: 4,
    fontWeight: '700',
    letterSpacing: 2,
    fontSize: 11,
    opacity: 0.6,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    height: 60,
    width: 24,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  dayLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 12,
  },
  tipText: {
    flex: 1,
    lineHeight: 22,
  },
});

export default InsightsSection;
