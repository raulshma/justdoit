import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { ThemedIcon } from './ThemedIcon';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useAlert } from '../context/AlertContext';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  lang?: string;
  size?: number;
  disabled?: boolean;
}

// Global ref to track which button instance is currently active
let activeInstanceId: string | null = null;
const MIN_VOLUME = -2;
const MAX_VOLUME = 10;

/**
 * VoiceInputButton - A reusable voice input button component
 * Each instance tracks its own recording state independently
 * Includes an audio visualizer with animated bars using live data
 */
export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  onInterimTranscript,
  onError,
  lang = 'en-US',
  size = 24,
  disabled = false,
}) => {
  const theme = useTheme();
  const alert = useAlert();
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isThisInstanceActive, setIsThisInstanceActive] = useState(false);
  
  // Unique instance ID
  const instanceId = useRef(`voice-btn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`).current;
  
  // Animation refs for visualizer bars (5 bars)
  const barAnims = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]).current;

  // Handle speech recognition events - only respond if this instance is active
  useSpeechRecognitionEvent('start', () => {
    if (activeInstanceId === instanceId) {
      setIsRecognizing(true);
      setIsThisInstanceActive(true);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    if (activeInstanceId === instanceId) {
      setIsRecognizing(false);
      setIsThisInstanceActive(false);
      activeInstanceId = null;
      // Reset visualizer bars
      barAnims.forEach(anim => anim.setValue(0.3));
    }
  });

  useSpeechRecognitionEvent('result', (event) => {
    // Only process if this is the active instance
    if (activeInstanceId !== instanceId) return;
    
    if (event.results && event.results.length > 0) {
      const transcript = event.results[0]?.transcript || '';
      if (transcript) {
        if (event.isFinal) {
          onTranscript(transcript);
        } else {
          onInterimTranscript?.(transcript);
        }
      }
    }
  });

  // Volume change event for realtime visualization
  useSpeechRecognitionEvent('volumechange', (event) => {
    if (activeInstanceId !== instanceId) return;
    
    // Normalize volume from [-2, 10] to [0, 1]
    const normalizedVolume = Math.max(0, Math.min(1, (event.value - MIN_VOLUME) / (MAX_VOLUME - MIN_VOLUME)));
    
    // Update each bar with slightly different values for wave effect
    barAnims.forEach((anim, index) => {
      // Create a wave pattern - bars in the middle are taller (index 2 is center of 5)
      const centerIndex = 2; 
      const distanceFromCenter = Math.abs(index - centerIndex) / centerIndex;
      const waveMultiplier = 1 - (distanceFromCenter * 0.4);
      
      // Add some randomness for natural feel
      const randomVariation = 0.9 + Math.random() * 0.2;
      
      // Base height (0.3) + volume-based height
      const targetHeight = 0.3 + (normalizedVolume * 1.5 * waveMultiplier * randomVariation);
      
      Animated.timing(anim, {
        toValue: targetHeight,
        duration: 80,
        useNativeDriver: true,
      }).start();
    });
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (activeInstanceId === instanceId) {
      setIsRecognizing(false);
      setIsThisInstanceActive(false);
      activeInstanceId = null;
      // Reset bars
      barAnims.forEach(anim => anim.setValue(0.3));
      
      const errorMessage = event.message || 'Speech recognition error';
      console.warn('Speech recognition error:', event.error, errorMessage);
      onError?.(errorMessage);
    }
  });

  const handlePress = useCallback(async () => {
    if (disabled) return;

    if (isThisInstanceActive) {
      // Stop recognition manually
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    // If another instance is active, stop it first
    if (activeInstanceId !== null) {
      ExpoSpeechRecognitionModule.stop();
      // Small delay to let the other instance clean up
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      // Request permissions
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      
      if (!result.granted) {
        alert.warning(
          'Permission Required',
          'Please grant microphone and speech recognition permissions to use voice input.'
        );
        return;
      }

      // Mark this instance as active BEFORE starting
      activeInstanceId = instanceId;
      setIsThisInstanceActive(true);
      setIsRecognizing(true);

      // Start speech recognition
      ExpoSpeechRecognitionModule.start({
        lang,
        interimResults: true,
        continuous: true, // Continuous recording until stopped manually
        maxAlternatives: 1,
        volumeChangeEventOptions: {
          enabled: true,
          intervalMillis: 100, 
        },
      });
    } catch (error) {
      activeInstanceId = null;
      setIsThisInstanceActive(false);
      setIsRecognizing(false);
      console.error('Failed to start speech recognition:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start voice input';
      onError?.(errorMessage);
      alert.error('Voice Input Error', errorMessage);
    }
  }, [disabled, isThisInstanceActive, instanceId, lang, onError, alert]);

  const iconColor = disabled
    ? theme.colors.onSurfaceDisabled
    : isThisInstanceActive
    ? theme.colors.onError
    : theme.colors.primary;

  const buttonBgColor = isThisInstanceActive
    ? theme.colors.error
    : theme.colors.surfaceVariant;

  return (
    <View style={styles.container}>
      {/* Audio Visualizer - shown when recording */}
      {isThisInstanceActive && (
        <View style={styles.visualizer}>
          {barAnims.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.bar,
                {
                  backgroundColor: theme.colors.primary,
                  transform: [{ scaleY: anim }],
                },
              ]}
            />
          ))}
        </View>
      )}
      
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        style={[
          styles.button,
          { backgroundColor: buttonBgColor },
        ]}
        activeOpacity={0.7}
        accessibilityLabel={isThisInstanceActive ? 'Stop voice input' : 'Start voice input'}
        accessibilityRole="button"
      >
        <ThemedIcon
          name={isThisInstanceActive ? 'stop' : 'microphone'}
          size={size}
          color={iconColor}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualizer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 32,
    paddingHorizontal: 8,
  },
  bar: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
});

export default VoiceInputButton;
