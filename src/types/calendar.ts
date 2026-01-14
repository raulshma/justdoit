/**
 * Calendar event type for display in the app
 */
export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  location?: string;
  notes?: string;
  calendarId: string;
  calendarColor?: string;
}

/**
 * Calendar permission status
 */
export type CalendarPermissionStatus = 'granted' | 'denied' | 'undetermined';
