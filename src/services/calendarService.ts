import * as Calendar from 'expo-calendar';
import { CalendarEvent, CalendarPermissionStatus } from '../types';

/**
 * Calendar Service Interface
 */
export interface ICalendarService {
  requestPermissions(): Promise<CalendarPermissionStatus>;
  getPermissionStatus(): Promise<CalendarPermissionStatus>;
  getEventsForDate(date: string): Promise<CalendarEvent[]>;
  getEventsForDateRange(startDate: string, endDate: string): Promise<CalendarEvent[]>;
}

/**
 * CalendarService - Handles calendar integration using expo-calendar
 */
export class CalendarService implements ICalendarService {
  private calendarsCache: Calendar.Calendar[] | null = null;

  /**
   * Request calendar permissions from the user
   */
  async requestPermissions(): Promise<CalendarPermissionStatus> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      return status as CalendarPermissionStatus;
    } catch (error) {
      console.error('Failed to request calendar permissions:', error);
      return 'denied';
    }
  }

  /**
   * Get current calendar permission status
   */
  async getPermissionStatus(): Promise<CalendarPermissionStatus> {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      return status as CalendarPermissionStatus;
    } catch (error) {
      console.error('Failed to get calendar permission status:', error);
      return 'denied';
    }
  }

  /**
   * Get all available calendars
   */
  private async getCalendars(): Promise<Calendar.Calendar[]> {
    if (this.calendarsCache) {
      return this.calendarsCache;
    }
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      this.calendarsCache = calendars;
      return calendars;
    } catch (error) {
      console.error('Failed to get calendars:', error);
      return [];
    }
  }

  /**
   * Clear calendars cache (call when permissions change)
   */
  clearCache(): void {
    this.calendarsCache = null;
  }

  /**
   * Get events for a specific date (YYYY-MM-DD format)
   */
  async getEventsForDate(date: string): Promise<CalendarEvent[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    return this.getEventsForDateRange(startDate.toISOString(), endDate.toISOString());
  }

  /**
   * Get events for a date range
   */
  async getEventsForDateRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    try {
      const status = await this.getPermissionStatus();
      if (status !== 'granted') {
        return [];
      }

      const calendars = await this.getCalendars();
      if (calendars.length === 0) {
        return [];
      }

      const calendarIds = calendars.map(cal => cal.id);
      const events = await Calendar.getEventsAsync(
        calendarIds,
        new Date(startDate),
        new Date(endDate)
      );

      // Create a map of calendar colors for quick lookup
      const calendarColorMap = new Map<string, string>();
      calendars.forEach(cal => {
        calendarColorMap.set(cal.id, cal.color);
      });

      return events.map(event => ({
        id: event.id,
        title: event.title,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        allDay: event.allDay,
        location: event.location || undefined,
        notes: event.notes || undefined,
        calendarId: event.calendarId,
        calendarColor: calendarColorMap.get(event.calendarId),
      }));
    } catch (error) {
      console.error('Failed to get calendar events:', error);
      return [];
    }
  }
}

// Export singleton instance
export const calendarService = new CalendarService();
