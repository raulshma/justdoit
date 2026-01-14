import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';
import type { CalendarEvent } from '../types';

interface CalendarEventCardProps {
  event: CalendarEvent;
}

/**
 * Format time for display
 */
const formatEventTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * CalendarEventCard - Displays a calendar event in a compact card format
 */
export const CalendarEventCard = memo(function CalendarEventCard({
  event,
}: CalendarEventCardProps) {
  const theme = useTheme();

  const timeDisplay = event.allDay
    ? 'All day'
    : `${formatEventTime(event.startDate)} - ${formatEventTime(event.endDate)}`;

  return (
    <Surface
      style={[
        styles.surface,
        { backgroundColor: theme.colors.surfaceVariant },
      ]}
      elevation={0}
    >
      <View style={styles.contentRow}>
        {/* Color indicator */}
        <View
          style={[
            styles.colorIndicator,
            { backgroundColor: event.calendarColor || theme.colors.primary },
          ]}
        />

        {/* Event content */}
        <View style={styles.textContainer}>
          <Text
            variant="titleSmall"
            style={[styles.title, { color: theme.colors.onSurface }]}
            numberOfLines={1}
          >
            {event.title}
          </Text>

          <View style={styles.metaRow}>
            <ThemedIcon name="clock-outline" size={12} themeColor="onSurfaceVariant" />
            <Text
              variant="bodySmall"
              style={[styles.timeText, { color: theme.colors.onSurfaceVariant }]}
            >
              {timeDisplay}
            </Text>

            {event.location && (
              <>
                <ThemedIcon
                  name="map-marker-outline"
                  size={12}
                  themeColor="onSurfaceVariant"
                  style={styles.locationIcon}
                />
                <Text
                  variant="bodySmall"
                  style={[styles.locationText, { color: theme.colors.onSurfaceVariant }]}
                  numberOfLines={1}
                >
                  {event.location}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Calendar icon */}
        <View style={styles.iconContainer}>
          <ThemedIcon name="calendar" size={18} themeColor="outline" />
        </View>
      </View>
    </Surface>
  );
});

const styles = StyleSheet.create({
  surface: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  colorIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
  },
  locationIcon: {
    marginLeft: 8,
  },
  locationText: {
    fontSize: 11,
    flex: 1,
  },
  iconContainer: {
    marginLeft: 8,
    opacity: 0.5,
  },
});

export default CalendarEventCard;
