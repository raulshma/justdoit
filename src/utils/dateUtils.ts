/**
 * Date utility functions for consistent date handling across the app.
 */

// Format options
export type DateStatus = 'overdue' | 'today' | 'tomorrow' | 'upcoming';

/**
 * Gets today's date in ISO format (YYYY-MM-DD)
 * @returns Date string YYYY-MM-DD
 */
export const getTodayDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Checks if a date string is today
 */
export const isToday = (dateString: string): boolean => {
  return dateString === getTodayDate();
};

/**
 * Get date status for a given date string relative to today
 */
export const getDateStatus = (dateString: string): DateStatus => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Reset time for comparison
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() < today.getTime()) {
    return 'overdue';
  }
  if (date.getTime() === today.getTime()) {
    return 'today';
  }
  if (date.getTime() === tomorrow.getTime()) {
    return 'tomorrow';
  }
  return 'upcoming';
};

/**
 * Format date for header display (e.g., "Yesterday", "Today", "Tomorrow", "Mon, Oct 12")
 */
export const formatDateFriendly = (dateString: string): string => {
  const status = getDateStatus(dateString);
  
  if (status === 'overdue') {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days overdue`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  if (status === 'today') return 'Today';
  if (status === 'tomorrow') return 'Tomorrow';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get current greeting based on time of day
 */
export const getTimeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning.';
  if (hour < 18) return 'Good Afternoon.';
  return 'Good Evening.';
};

/**
 * Get current date formatted for display (e.g., "FRIDAY, JAN 17")
 */
export const getCurrentDateDisplay = (): string => {
  return new Date()
    .toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' })
    .toUpperCase();
};

/**
 * Format time to 12-hour format (e.g. "02:30 PM")
 */
export const formatTime12Hour = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
