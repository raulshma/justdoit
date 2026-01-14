import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_PADDING = 24;
const CHART_WIDTH = SCREEN_WIDTH - CHART_PADDING * 2;

interface CompletionChartProps {
  /** Array of 7 numbers representing completions for each day (oldest to newest) */
  data: number[];
  /** Labels for each day (e.g., ['Mon', 'Tue', ...]) */
  labels?: string[];
}

/**
 * Get day labels for the past 7 days
 */
const getDefaultLabels = (): string[] => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const labels: string[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    labels.push(days[date.getDay()]);
  }

  return labels;
};

/**
 * CompletionChart component displays a 7-day bar chart of goal completions.
 * High-fidelity redesign with bar tracks and rounded corners.
 * 
 * Requirements: 11.4
 */
export const CompletionChart: React.FC<CompletionChartProps> = ({
  data,
  labels = getDefaultLabels(),
}) => {
  const theme = useTheme();

  // Ensure we have exactly 7 data points
  const chartData = data.length === 7 ? data : Array(7).fill(0);
  // Dynamic max value but with a minimum floor to keep proportion
  const maxValue = Math.max(...chartData, 5); 

  const barWidth = (CHART_WIDTH - 48) / 7; // Account for gaps
  const maxBarHeight = 140;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
          variant="titleMedium"
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          Activity Trend
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Last 7 Days
        </Text>
      </View>

      <View style={styles.chartContainer}>
        {/* Bars */}
        <View style={styles.barsContainer}>
          {chartData.map((value, index) => {
            const barHeight = (value / maxValue) * maxBarHeight;
            const isToday = index === 6;
            
            // Calculate a color opacity or shade based on value if desired, 
            // but keeping it simple and clean is better.
            const barColor = isToday ? theme.colors.primary : theme.colors.primary;
            const trackColor = theme.colors.surfaceVariant;

            return (
              <View key={index} style={styles.columnWrapper}>
                {/* Bar Track + Bar */}
                <View 
                  style={[
                    styles.barTrack, 
                    { 
                      height: maxBarHeight, 
                      width: barWidth - 12, // Thinner bars for elegance
                      backgroundColor: trackColor,
                      borderRadius: 20,
                    }
                  ]}
                >
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(barHeight, 12), // Minimum height for visibility (circle)
                        width: '100%',
                        backgroundColor: barColor,
                        borderRadius: 20,
                        opacity: isToday ? 1 : 0.7,
                      },
                    ]}
                  />
                </View>
                
                {/* Day label */}
                <Text
                  variant="labelSmall"
                  style={[
                    styles.dayLabel,
                    {
                      color: isToday
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant,
                      fontWeight: isToday ? '700' : '400',
                    },
                  ]}
                >
                  {labels[index]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  title: {
    fontWeight: '700',
  },
  chartContainer: {
    flexDirection: 'row',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180, // Total container height including labels
  },
  columnWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    height: '100%',
  },
  barTrack: {
    justifyContent: 'flex-end', // Fill from bottom
    alignItems: 'center',
    overflow: 'hidden',
  },
  bar: {
    minHeight: 12,
  },
  dayLabel: {
    marginTop: 12,
    fontSize: 12,
  },
});

export default CompletionChart;
