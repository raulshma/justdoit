import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  Keyboard,
} from 'react-native';
import { Portal, Text, Button, useTheme, Surface } from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type AlertType = 'info' | 'success' | 'error' | 'warning' | 'confirm';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertConfig {
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
}

interface CustomAlertProps {
  visible: boolean;
  config: AlertConfig | null;
  onDismiss: () => void;
}

const ALERT_ICONS: Record<AlertType, string> = {
  info: 'information',
  success: 'check-circle',
  error: 'alert-circle',
  warning: 'alert',
  confirm: 'help-circle',
};

/**
 * CustomAlert Component
 * 
 * A high-fidelity alert component with glassmorphism design, spring animations,
 * and full theme integration. Replaces the native Alert.alert with a premium
 * look and feel that matches the app's avant-garde design language.
 */
export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  config,
  onDismiss,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      // Dismiss keyboard when alert appears
      Keyboard.dismiss();
      
      // Animate in
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 20,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropOpacity, scaleAnim, opacityAnim, translateY]);

  if (!config) return null;

  const alertType = config.type || 'info';
  const iconName = ALERT_ICONS[alertType];
  
  // Determine icon color based on alert type
  const getIconColor = () => {
    switch (alertType) {
      case 'error':
        return theme.colors.error;
      case 'success':
        return theme.colors.primary;
      case 'warning':
        return theme.colors.tertiary;
      default:
        return theme.colors.primary;
    }
  };

  // Default buttons if none provided
  const buttons = config.buttons || [{ text: 'OK', style: 'default' as const }];

  const handleButtonPress = (button: AlertButton) => {
    onDismiss();
    if (button.onPress) {
      // Small delay to allow dismiss animation
      setTimeout(() => button.onPress?.(), 100);
    }
  };

  const getButtonMode = (button: AlertButton): 'contained' | 'outlined' | 'text' => {
    if (button.style === 'destructive') return 'contained';
    if (button.style === 'cancel') return 'outlined';
    if (buttons.length === 1) return 'contained';
    // For multi-button alerts, make the last button contained
    const buttonIndex = buttons.indexOf(button);
    return buttonIndex === buttons.length - 1 ? 'contained' : 'text';
  };

  const getButtonColor = (button: AlertButton) => {
    if (button.style === 'destructive') {
      return theme.colors.error;
    }
    return theme.colors.primary;
  };

  return (
    <Portal>
      {visible && (
        <View style={styles.container}>
          {/* Backdrop with blur-like effect */}
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View
              style={[
                styles.backdrop,
                {
                  backgroundColor: theme.dark 
                    ? 'rgba(0, 0, 0, 0.7)' 
                    : 'rgba(0, 0, 0, 0.5)',
                  opacity: backdropOpacity,
                },
              ]}
            />
          </TouchableWithoutFeedback>

          {/* Alert Card */}
          <Animated.View
            style={[
              styles.alertWrapper,
              {
                opacity: opacityAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY },
                ],
              },
            ]}
          >
            <Surface
              style={[
                styles.alertCard,
                {
                  backgroundColor: theme.colors.surface,
                  marginBottom: insets.bottom,
                },
              ]}
              elevation={5}
            >
              {/* Decorative top gradient line */}
              <View
                style={[
                  styles.topAccent,
                  { backgroundColor: getIconColor() },
                ]}
              />

              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: alertType === 'error'
                      ? theme.colors.errorContainer
                      : alertType === 'warning'
                      ? theme.colors.tertiaryContainer
                      : theme.colors.primaryContainer,
                  },
                ]}
              >
                <ThemedIcon
                  name={iconName as any}
                  size={32}
                  color={getIconColor()}
                />
              </View>

              {/* Title */}
              <Text
                variant="titleLarge"
                style={[
                  styles.title,
                  { color: theme.colors.onSurface },
                ]}
              >
                {config.title}
              </Text>

              {/* Message */}
              {config.message && (
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.message,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {config.message}
                </Text>
              )}

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                {buttons.map((button, index) => (
                  <Button
                    key={index}
                    mode={getButtonMode(button)}
                    onPress={() => handleButtonPress(button)}
                    style={[
                      styles.button,
                      buttons.length > 1 && { flex: 1 },
                      index > 0 && { marginLeft: 12 },
                    ]}
                    contentStyle={styles.buttonContent}
                    labelStyle={[
                      styles.buttonLabel,
                      { fontSize: 13 }, // Smaller font for longer text
                      button.style === 'destructive' && { color: theme.colors.onError },
                    ]}
                    buttonColor={
                      button.style === 'destructive'
                        ? theme.colors.error
                        : undefined
                    }
                    textColor={
                      button.style === 'cancel'
                        ? theme.colors.onSurfaceVariant
                        : button.style === 'destructive'
                        ? theme.colors.onError
                        : undefined
                    }
                  >
                    {button.text}
                  </Button>
                ))}
              </View>
            </Surface>
          </Animated.View>
        </View>
      )}
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  alertWrapper: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 400,
  },
  alertCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 8,
  },
  button: {
    borderRadius: 16,
    minWidth: 100,
  },
  buttonContent: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  buttonLabel: {
    fontWeight: '600',
    fontSize: 15,
  },
});

export default CustomAlert;
