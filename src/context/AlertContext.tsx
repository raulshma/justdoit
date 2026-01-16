import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CustomAlert, AlertConfig, AlertButton, AlertType } from '../components/CustomAlert';

interface AlertContextType {
  /**
   * Show an alert with full configuration options
   */
  showAlert: (config: AlertConfig) => void;
  
  /**
   * Show a simple info alert with optional message
   */
  info: (title: string, message?: string) => void;
  
  /**
   * Show a success alert with optional message
   */
  success: (title: string, message?: string) => void;
  
  /**
   * Show an error alert with optional message
   */
  error: (title: string, message?: string) => void;
  
  /**
   * Show a warning alert with optional message
   */
  warning: (title: string, message?: string) => void;
  
  /**
   * Show a confirmation alert with custom buttons
   */
  confirm: (
    title: string,
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string,
    destructive?: boolean
  ) => void;
  
  /**
   * Dismiss the current alert
   */
  dismiss: () => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

interface AlertProviderProps {
  children: ReactNode;
}

/**
 * AlertProvider Component
 * 
 * Provides global alert functionality throughout the application.
 * Wrap your app with this provider to use the useAlert hook.
 * 
 * @example
 * ```tsx
 * // In App.tsx
 * <AlertProvider>
 *   <App />
 * </AlertProvider>
 * 
 * // In any component
 * const { showAlert, error, success, confirm } = useAlert();
 * 
 * // Simple alerts
 * success('Done!', 'Your changes have been saved.');
 * error('Error', 'Something went wrong.');
 * 
 * // Confirmation
 * confirm(
 *   'Delete Goal',
 *   'Are you sure you want to delete this?',
 *   () => handleDelete(),
 *   () => {},
 *   'Delete',
 *   'Cancel',
 *   true // destructive
 * );
 * ```
 */
export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const showAlert = useCallback((alertConfig: AlertConfig) => {
    setConfig(alertConfig);
    setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const info = useCallback((title: string, message?: string) => {
    showAlert({
      title,
      message,
      type: 'info',
      buttons: [{ text: 'OK', style: 'default' }],
    });
  }, [showAlert]);

  const success = useCallback((title: string, message?: string) => {
    showAlert({
      title,
      message,
      type: 'success',
      buttons: [{ text: 'OK', style: 'default' }],
    });
  }, [showAlert]);

  const error = useCallback((title: string, message?: string) => {
    showAlert({
      title,
      message,
      type: 'error',
      buttons: [{ text: 'OK', style: 'default' }],
    });
  }, [showAlert]);

  const warning = useCallback((title: string, message?: string) => {
    showAlert({
      title,
      message,
      type: 'warning',
      buttons: [{ text: 'OK', style: 'default' }],
    });
  }, [showAlert]);

  const confirm = useCallback((
    title: string,
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel',
    destructive: boolean = false
  ) => {
    showAlert({
      title,
      message,
      type: 'confirm',
      buttons: [
        {
          text: cancelText,
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: onConfirm,
        },
      ],
    });
  }, [showAlert]);

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        info,
        success,
        error,
        warning,
        confirm,
        dismiss,
      }}
    >
      {children}
      <CustomAlert
        visible={visible}
        config={config}
        onDismiss={dismiss}
      />
    </AlertContext.Provider>
  );
};

/**
 * useAlert Hook
 * 
 * Access the global alert functionality from any component.
 * Must be used within an AlertProvider.
 * 
 * @returns AlertContextType with methods to show various alert types
 * @throws Error if used outside of AlertProvider
 */
export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export default AlertProvider;
