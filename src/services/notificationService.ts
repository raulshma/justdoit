import * as Notifications from 'expo-notifications';
import { Goal } from '../types';

/**
 * Notification Service Interface
 * Requirements: 4.1, 4.2, 4.4, 4.5, 5.1, 5.3, 5.4
 */
export interface INotificationService {
  requestPermissions(): Promise<boolean>;
  scheduleGoalReminder(goal: Goal): Promise<string | null>;
  cancelReminder(reminderId: string): Promise<void>;
  scheduleDailyPlanningReminder(time: string): Promise<string>;
  cancelAllReminders(): Promise<void>;
  handleNotificationResponse(goalId: string): void;
}

/**
 * Daily planning reminder identifier
 */
const DAILY_PLANNING_REMINDER_ID = 'daily-planning-reminder';

/**
 * Configure notification handler for foreground notifications
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * NotificationService - Handles all notification-related functionality
 * Uses Expo Notifications for local push notifications
 * Requirements: 4.1, 4.2, 4.4, 4.5, 5.1, 5.3, 5.4
 */
export class NotificationService implements INotificationService {
  private notificationResponseListener: Notifications.EventSubscription | null = null;
  private onNotificationResponse: ((goalId: string) => void) | null = null;

  constructor() {
    this.setupNotificationResponseListener();
  }

  /**
   * Sets up the notification response listener
   */
  private setupNotificationResponseListener(): void {
    this.notificationResponseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const goalId = response.notification.request.content.data?.goalId as string | undefined;
        if (goalId && this.onNotificationResponse) {
          this.onNotificationResponse(goalId);
        }
      }
    );
  }


  /**
   * Requests notification permissions from the user
   * @returns true if permissions granted, false otherwise
   * Requirements: 5.1
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus === 'granted') {
        return true;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedules a reminder notification for a goal
   * @param goal - The goal to schedule a reminder for
   * @returns The notification identifier, or null if scheduling failed
   * Requirements: 4.1, 4.2
   */
  async scheduleGoalReminder(goal: Goal): Promise<string | null> {
    if (!goal.reminderTime) {
      return null;
    }

    try {
      const reminderDate = new Date(goal.reminderTime);
      
      // Don't schedule if the reminder time is in the past
      if (reminderDate <= new Date()) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎯 Goal Reminder',
          body: goal.title,
          data: { goalId: goal.id },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule goal reminder:', error);
      return null;
    }
  }

  /**
   * Cancels a scheduled reminder notification
   * @param reminderId - The notification identifier to cancel
   * Requirements: 4.4, 4.5
   */
  async cancelReminder(reminderId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(reminderId);
    } catch (error) {
      // Silently ignore cancellation errors (notification may already be cancelled)
      console.warn('Failed to cancel reminder:', error);
    }
  }


  /**
   * Schedules a daily planning reminder notification
   * @param time - The time in HH:mm format
   * @returns The notification identifier
   * Requirements: 5.3, 4.6
   */
  async scheduleDailyPlanningReminder(time: string): Promise<string> {
    try {
      // Cancel existing daily planning reminder first
      await this.cancelDailyPlanningReminder();

      const [hours, minutes] = time.split(':').map(Number);

      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier: DAILY_PLANNING_REMINDER_ID,
        content: {
          title: '📝 Plan Your Day',
          body: "It's time to set your goals for tomorrow!",
          data: { type: 'daily-planning' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule daily planning reminder:', error);
      throw new Error('Failed to schedule daily planning reminder');
    }
  }

  /**
   * Cancels the daily planning reminder
   * Requirements: 5.4
   */
  async cancelDailyPlanningReminder(): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(DAILY_PLANNING_REMINDER_ID);
    } catch (error) {
      // Silently ignore if notification doesn't exist
      console.warn('Failed to cancel daily planning reminder:', error);
    }
  }

  /**
   * Cancels all scheduled notifications
   * Requirements: 5.4
   */
  async cancelAllReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all reminders:', error);
      throw new Error('Failed to cancel all reminders');
    }
  }

  /**
   * Sets the callback for handling notification responses
   * @param callback - Function to call when a notification is tapped
   * Requirements: 4.3
   */
  setNotificationResponseHandler(callback: (goalId: string) => void): void {
    this.onNotificationResponse = callback;
  }

  /**
   * Handles notification response (when user taps on notification)
   * @param goalId - The goal ID from the notification
   * Requirements: 4.3
   */
  handleNotificationResponse(goalId: string): void {
    if (this.onNotificationResponse) {
      this.onNotificationResponse(goalId);
    }
  }

  /**
   * Gets all scheduled notifications (useful for debugging)
   * @returns Array of scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Cleanup method to remove listeners
   */
  cleanup(): void {
    if (this.notificationResponseListener) {
      this.notificationResponseListener.remove();
      this.notificationResponseListener = null;
    }
  }
}

// Export singleton instance for app-wide use
export const notificationService = new NotificationService();
