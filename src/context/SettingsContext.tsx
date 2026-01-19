import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { AppSettings, ColorPalette } from '../types';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { DEFAULT_SETTINGS } from '../constants';

/**
 * Settings state interface
 */
interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
}

/**
 * Settings action types
 */
type SettingsAction =
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

/**
 * Settings context value interface
 */
interface SettingsContextValue extends SettingsState {
  // Settings operations
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  setDarkMode: (enabled: boolean) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setDailyReminderEnabled: (enabled: boolean) => Promise<void>;
  setDailyReminderTime: (time: string) => Promise<void>;
  setColorPalette: (palette: ColorPalette) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  // Refresh
  refreshSettings: () => void;
}

/**
 * Initial state
 */
const initialState: SettingsState = {
  settings: storageService.getSettings(),
  isLoading: false,
  error: null,
};

/**
 * Settings reducer
 */
function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

/**
 * Create context with undefined default
 */
const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

/**
 * SettingsProvider props
 */
interface SettingsProviderProps {
  children: ReactNode;
}

/**
 * SettingsProvider - Provides settings state management throughout the app
 * Requirements: 5.2 - Display options for daily reminder time configuration
 */
export function SettingsProvider({ children }: SettingsProviderProps) {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  /**
   * Load settings from storage on mount
   */
  const refreshSettings = useCallback(() => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const settings = storageService.getSettings();
      dispatch({ type: 'SET_SETTINGS', payload: settings });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Failed to load settings:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load settings' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  /**
   * Update settings with partial updates
   */
  const updateSettings = useCallback(async (updates: Partial<AppSettings>): Promise<void> => {
    try {
      const currentSettings = storageService.getSettings();
      const newSettings: AppSettings = { ...currentSettings, ...updates };
      
      storageService.saveSettings(newSettings);
      dispatch({ type: 'SET_SETTINGS', payload: newSettings });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Failed to update settings:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update settings' });
      throw error;
    }
  }, []);

  /**
   * Set dark mode preference
   */
  const setDarkMode = useCallback(async (enabled: boolean): Promise<void> => {
    await updateSettings({ darkModeEnabled: enabled });
  }, [updateSettings]);

  /**
   * Set notifications enabled/disabled
   * Requirements: 5.4 - Cancel all notifications when disabled
   */
  const setNotificationsEnabled = useCallback(async (enabled: boolean): Promise<void> => {
    await updateSettings({ notificationsEnabled: enabled });
    
    if (!enabled) {
      // Cancel all notifications when disabled
      await notificationService.cancelAllReminders();
    }
  }, [updateSettings]);

  /**
   * Set daily reminder enabled/disabled
   * Requirements: 5.4 - Cancel daily reminder when disabled
   */
  const setDailyReminderEnabled = useCallback(async (enabled: boolean): Promise<void> => {
    const currentSettings = storageService.getSettings();
    await updateSettings({ dailyReminderEnabled: enabled });
    
    if (enabled && currentSettings.notificationsEnabled) {
      // Schedule daily reminder
      await notificationService.scheduleDailyPlanningReminder(currentSettings.dailyReminderTime);
    } else {
      // Cancel daily reminder
      await notificationService.cancelDailyPlanningReminder();
    }
  }, [updateSettings]);

  /**
   * Set daily reminder time
   * Requirements: 5.3 - Reschedule daily planning notification when time changes
   */
  const setDailyReminderTime = useCallback(async (time: string): Promise<void> => {
    const currentSettings = storageService.getSettings();
    await updateSettings({ dailyReminderTime: time });
    
    // Reschedule if daily reminder is enabled
    if (currentSettings.dailyReminderEnabled && currentSettings.notificationsEnabled) {
      await notificationService.scheduleDailyPlanningReminder(time);
    }
  }, [updateSettings]);

  /**
   * Set color palette preference
   */
  const setColorPalette = useCallback(async (palette: ColorPalette): Promise<void> => {
    await updateSettings({ colorPalette: palette });
  }, [updateSettings]);

  /**
   * Complete onboarding and set flag in settings
   */
  const completeOnboarding = useCallback(async (): Promise<void> => {
    await updateSettings({ hasCompletedOnboarding: true });
  }, [updateSettings]);

  const value: SettingsContextValue = {
    ...state,
    updateSettings,
    setDarkMode,
    setNotificationsEnabled,
    setDailyReminderEnabled,
    setDailyReminderTime,
    setColorPalette,
    completeOnboarding,
    refreshSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

/**
 * Hook to use settings context
 * @throws Error if used outside of SettingsProvider
 */
export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export default SettingsContext;
