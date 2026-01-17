import * as Notifications from 'expo-notifications';
import { storageService } from './storageService';
import { goalManager } from './goalManager';
import { ambientSoundService } from './ambientSoundService';
import { xpService } from './xpService';
import { STORAGE_KEYS } from '../constants';
import type {
  FocusSession,
  FocusTimerState,
  FocusSessionType,
  FocusStats,
  Goal,
  AppSettings,
} from '../types';

/**
 * Generates a UUID v4
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Focus Timer Service
 * Manages Pomodoro/Focus timer state, sessions, and integration with goals
 */
class FocusTimerService {
  private state: FocusTimerState = 'idle';
  private currentSession: Partial<FocusSession> | null = null;
  private linkedGoalId: string | null = null;
  private linkedGoalTitle: string | null = null;
  private timeRemaining: number = 0; // in seconds
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private sessionsCompletedToday: number = 0;
  private onTickCallback: ((timeRemaining: number, state: FocusTimerState) => void) | null = null;
  private onSessionCompleteCallback: ((session: FocusSession) => void) | null = null;
  private onStateChangeCallback: ((state: FocusTimerState) => void) | null = null;

  /**
   * Get current timer state
   */
  getState(): FocusTimerState {
    return this.state;
  }

  /**
   * Get time remaining in seconds
   */
  getTimeRemaining(): number {
    return this.timeRemaining;
  }

  /**
   * Get linked goal info
   */
  getLinkedGoal(): { id: string; title: string } | null {
    if (this.linkedGoalId && this.linkedGoalTitle) {
      return { id: this.linkedGoalId, title: this.linkedGoalTitle };
    }
    return null;
  }

  /**
   * Get current session type
   */
  getSessionType(): FocusSessionType | null {
    return this.currentSession?.type ?? null;
  }

  /**
   * Set callback for timer tick updates
   */
  onTick(callback: (timeRemaining: number, state: FocusTimerState) => void): void {
    this.onTickCallback = callback;
  }

  /**
   * Set callback for session completion
   */
  onSessionComplete(callback: (session: FocusSession) => void): void {
    this.onSessionCompleteCallback = callback;
  }

  /**
   * Set callback for state changes
   */
  onStateChange(callback: (state: FocusTimerState) => void): void {
    this.onStateChangeCallback = callback;
  }

  /**
   * Link timer to a goal
   */
  linkToGoal(goalId: string): void {
    const goal = goalManager.getGoal(goalId);
    if (goal) {
      this.linkedGoalId = goalId;
      this.linkedGoalTitle = goal.title;
    }
  }

  /**
   * Unlink timer from goal
   */
  unlinkGoal(): void {
    this.linkedGoalId = null;
    this.linkedGoalTitle = null;
  }

  /**
   * Start a work session
   * @param goalId - Optional goal ID to link the session to
   * @param customDurationMinutes - Optional custom duration in minutes (overrides settings)
   */
  startSession(goalId?: string, customDurationMinutes?: number): void {
    if (this.state !== 'idle') {
      console.warn('Cannot start session: timer is not idle');
      return;
    }

    const settings = storageService.getSettings();
    // Use custom duration if provided, otherwise use settings
    const duration = customDurationMinutes 
      ? customDurationMinutes * 60 
      : settings.focusWorkDuration * 60; // convert to seconds

    // Link goal if provided
    if (goalId) {
      this.linkToGoal(goalId);
    }

    // Start ambient sound if enabled
    if (settings.focusAmbientSoundEnabled && settings.focusAmbientSound !== 'none') {
      ambientSoundService.play(settings.focusAmbientSound);
    }

    // Initialize session
    this.currentSession = {
      id: generateId(),
      goalId: this.linkedGoalId ?? undefined,
      goalTitle: this.linkedGoalTitle ?? undefined,
      startTime: new Date().toISOString(),
      plannedDuration: duration,
      duration: 0,
      completed: false,
      type: 'work',
      date: new Date().toISOString().split('T')[0],
    };

    this.timeRemaining = duration;
    this.setState('running');
    this.startTimer();
  }

  /**
   * Start a break session
   */
  startBreak(isLongBreak: boolean = false): void {
    if (this.state !== 'idle') {
      return;
    }

    const settings = storageService.getSettings();
    const duration = isLongBreak
      ? settings.focusLongBreakDuration * 60
      : settings.focusShortBreakDuration * 60;

    this.currentSession = {
      id: generateId(),
      startTime: new Date().toISOString(),
      plannedDuration: duration,
      duration: 0,
      completed: false,
      type: isLongBreak ? 'longBreak' : 'shortBreak',
      date: new Date().toISOString().split('T')[0],
    };

    // Stop ambient sound during breaks
    ambientSoundService.pause();

    this.timeRemaining = duration;
    this.setState('break');
    this.startTimer();
  }

  /**
   * Pause the current session
   */
  pause(): void {
    if (this.state !== 'running' && this.state !== 'break') {
      return;
    }

    this.stopTimer();
    this.setState('paused');
    ambientSoundService.pause();
  }

  /**
   * Resume a paused session
   */
  resume(): void {
    if (this.state !== 'paused') {
      return;
    }

    const previousState = this.currentSession?.type === 'work' ? 'running' : 'break';
    this.setState(previousState);
    this.startTimer();

    // Resume ambient sound for work sessions
    const settings = storageService.getSettings();
    if (
      previousState === 'running' &&
      settings.focusAmbientSoundEnabled &&
      settings.focusAmbientSound !== 'none'
    ) {
      ambientSoundService.resume();
    }
  }

  /**
   * Stop and reset the current session
   */
  stop(): void {
    if (this.state === 'idle') {
      return;
    }

    this.stopTimer();
    ambientSoundService.stop();

    // Save partial session if it had meaningful duration (> 1 min)
    if (this.currentSession) {
      const elapsedSeconds = this.currentSession.plannedDuration! - this.timeRemaining;
      if (elapsedSeconds >= 15) {
        this.currentSession.duration = elapsedSeconds;
        this.currentSession.endTime = new Date().toISOString();
        this.currentSession.completed = false;
        this.saveSession(this.currentSession as FocusSession);
      }
    }

    this.reset();
  }

  /**
   * Skip current break
   */
  skipBreak(): void {
    if (this.state !== 'break') {
      return;
    }

    this.stopTimer();
    this.reset();
  }

  /**
   * Get session history
   */
  getSessionHistory(goalId?: string): FocusSession[] {
    try {
      const sessionsJson = (storageService as any).storage.getString(STORAGE_KEYS.FOCUS_SESSIONS);
      if (!sessionsJson) {
        return [];
      }
      const sessions: FocusSession[] = JSON.parse(sessionsJson);
      
      if (goalId) {
        return sessions.filter((s) => s.goalId === goalId);
      }
      return sessions;
    } catch (error) {
      console.error('Failed to get session history:', error);
      return [];
    }
  }

  /**
   * Get focus statistics
   */
  getStats(): FocusStats {
    const sessions = this.getSessionHistory();
    const today = new Date().toISOString().split('T')[0];
    const workSessions = sessions.filter((s) => s.type === 'work' && s.completed);
    const todaySessions = workSessions.filter((s) => s.date === today);

    // Calculate streak (consecutive days with sessions)
    const streak = this.calculateStreak(sessions);

    return {
      totalSessions: workSessions.length,
      totalMinutes: Math.round(workSessions.reduce((sum, s) => sum + s.duration, 0) / 60),
      todaySessions: todaySessions.length,
      todayMinutes: Math.round(todaySessions.reduce((sum, s) => sum + s.duration, 0) / 60),
      currentStreak: streak,
    };
  }

  /**
   * Get sessions for a specific goal
   */
  getGoalStats(goalId: string): { sessions: number; minutes: number } {
    const sessions = this.getSessionHistory(goalId);
    const workSessions = sessions.filter((s) => s.completed && s.type === 'work');
    return {
      sessions: workSessions.length,
      minutes: Math.round(workSessions.reduce((sum, s) => sum + s.duration, 0) / 60),
    };
  }

  // Private methods

  private setState(state: FocusTimerState): void {
    this.state = state;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(state);
    }
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
        
        if (this.onTickCallback) {
          this.onTickCallback(this.timeRemaining, this.state);
        }
      } else {
        this.completeSession();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private async completeSession(): Promise<void> {
    this.stopTimer();
    ambientSoundService.stop();

    if (!this.currentSession) {
      this.reset();
      return;
    }

    // Complete the session
    this.currentSession.duration = this.currentSession.plannedDuration!;
    this.currentSession.endTime = new Date().toISOString();
    this.currentSession.completed = true;

    const completedSession = this.currentSession as FocusSession;
    this.saveSession(completedSession);

    // Update goal if linked and was a work session
    if (completedSession.type === 'work' && completedSession.goalId) {
      await this.updateGoalFocusStats(completedSession.goalId, completedSession.duration);
    }

    // Award XP for completed work sessions (25 XP base for focus session)
    if (completedSession.type === 'work') {
      xpService.awardXP(25, 'Focus session completed', 0);
      this.sessionsCompletedToday++;
    }

    // Notify callback
    if (this.onSessionCompleteCallback) {
      this.onSessionCompleteCallback(completedSession);
    }

    // Schedule break reminder if enabled
    const settings = storageService.getSettings();
    if (completedSession.type === 'work' && settings.focusBreakRemindersEnabled) {
      this.scheduleBreakReminder(settings);
    }

    this.reset();
  }

  private async updateGoalFocusStats(goalId: string, durationSeconds: number): Promise<void> {
    const goal = goalManager.getGoal(goalId);
    if (!goal) return;

    const updatedGoal: Goal = {
      ...goal,
      focusSessionsCompleted: (goal.focusSessionsCompleted ?? 0) + 1,
      totalFocusMinutes: (goal.totalFocusMinutes ?? 0) + Math.round(durationSeconds / 60),
    };

    // Check auto-completion
    const settings = storageService.getSettings();
    if (
      settings.focusAutoCompleteEnabled &&
      goal.focusSessionsToComplete &&
      updatedGoal.focusSessionsCompleted! >= goal.focusSessionsToComplete &&
      !goal.isCompleted
    ) {
      await goalManager.toggleComplete(goalId);
    } else {
      storageService.saveGoal(updatedGoal);
    }
  }

  private saveSession(session: FocusSession): void {
    try {
      const sessions = this.getSessionHistory();
      sessions.push(session);
      // Keep last 500 sessions
      const trimmedSessions = sessions.slice(-500);
      (storageService as any).storage.set(
        STORAGE_KEYS.FOCUS_SESSIONS,
        JSON.stringify(trimmedSessions)
      );
    } catch (error) {
      console.error('Failed to save focus session:', error);
    }
  }

  private async scheduleBreakReminder(settings: AppSettings): Promise<void> {
    const isLongBreak =
      this.sessionsCompletedToday % settings.focusSessionsUntilLongBreak === 0;
    const breakDuration = isLongBreak
      ? settings.focusLongBreakDuration
      : settings.focusShortBreakDuration;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Break Time!',
          body: isLongBreak
            ? `Great work! Take a ${breakDuration} minute break.`
            : `Take a ${breakDuration} minute break.`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
        },
      });
    } catch (error) {
      console.error('Failed to schedule break reminder:', error);
    }
  }

  private calculateStreak(sessions: FocusSession[]): number {
    const workSessions = sessions.filter((s) => s.type === 'work' && s.completed);
    if (workSessions.length === 0) return 0;

    const dates = [...new Set(workSessions.map((s) => s.date))].sort().reverse();
    const today = new Date().toISOString().split('T')[0];

    // Check if there's a session today or yesterday
    if (dates[0] !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (dates[0] !== yesterdayStr) {
        return 0;
      }
    }

    let streak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const current = new Date(dates[i]);
      const prev = new Date(dates[i + 1]);
      const diffDays = (current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private reset(): void {
    this.currentSession = null;
    this.timeRemaining = 0;
    this.setState('idle');
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopTimer();
    ambientSoundService.stop();
    this.reset();
  }
}

// Export singleton instance
export const focusTimerService = new FocusTimerService();
