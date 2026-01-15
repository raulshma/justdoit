import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Animated, Platform } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';
import { ThemedIcon } from './ThemedIcon';

interface VoiceNoteRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
  maxDuration?: number; // seconds, default 60
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  onRecordingComplete,
  onCancel,
  maxDuration = 60,
}) => {
  const theme = useTheme();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [durationMillis, setDurationMillis] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  // Animation for pulsing record button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<any>(null);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      setHasPermission(status.granted);
      
      if (!status.granted) {
        Alert.alert('Permission needed', 'Please grant microphone permission to record voice notes.');
      }
    })();
  }, []);

  // Update audio mode based on recording state
  useEffect(() => {
    const configureAudioMode = async () => {
      try {
        if (recorderState.isRecording) {
          await setAudioModeAsync({
            allowsRecording: true,
            playsInSilentMode: true,
          });
        } else {
          await setAudioModeAsync({
            allowsRecording: false,
            playsInSilentMode: true,
          });
        }
      } catch (error) {
        console.warn('Failed to set audio mode', error);
      }
    };
    
    configureAudioMode();
  }, [recorderState.isRecording]);

  // Handle pulse animation and timer
  useEffect(() => {
    if (recorderState.isRecording) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Timer
      timerRef.current = setInterval(() => {
        setDurationMillis((prev) => {
          const newDuration = prev + 100;
          if (maxDuration && newDuration >= maxDuration * 1000) {
            stopRecording();
          }
          return newDuration;
        });
      }, 100);
    } else {
      pulseAnim.setValue(1);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recorderState.isRecording, maxDuration, pulseAnim]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recorderState.isRecording) {
        audioRecorder.stop();
      }
    };
  }, []);

  async function startRecording() {
    if (!hasPermission) {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission needed', 'Please grant microphone permission to record voice notes.');
        return;
      }
      setHasPermission(true);
    }

    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setDurationMillis(0);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  }

  async function stopRecording() {
    if (!recorderState.isRecording) return;

    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      
      if (uri) {
        // Round to nearest second
        const durationSec = Math.ceil(durationMillis / 1000);
        onRecordingComplete(uri, durationSec);
      } else {
        throw new Error('No recording URI found');
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to save recording');
    }
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.elevation.level1 }]}>
      <View style={styles.header}>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Recording Voice Note
        </Text>
        <TouchableOpacity onPress={onCancel}>
          <ThemedIcon name="close" size={20} themeColor="onSurfaceVariant" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.timerContainer}>
          <Text variant="displayMedium" style={{ color: theme.colors.error, fontWeight: 'bold', fontVariant: ['tabular-nums'] }}>
            {formatTime(durationMillis)}
          </Text>
          {maxDuration && (
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Max {maxDuration}s
            </Text>
          )}
        </View>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            onPress={recorderState.isRecording ? stopRecording : startRecording}
            style={[
              styles.recordButton,
              { 
                backgroundColor: recorderState.isRecording ? theme.colors.error : theme.colors.primary,
                borderColor: theme.colors.surface,
              }
            ]}
          >
            <ThemedIcon 
              name={recorderState.isRecording ? 'stop' : 'microphone'} 
              size={32} 
              color={theme.colors.onPrimary} 
            />
          </TouchableOpacity>
        </Animated.View>

        <Text variant="bodySmall" style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
          {recorderState.isRecording ? 'Tap to stop' : 'Tap to record'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
