import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { Text, useTheme, IconButton, Surface, ProgressBar } from 'react-native-paper';
import { useKeepAwake } from 'expo-keep-awake';
import { focusTimerService } from '../services/focusTimerService';
import type { FocusTimerState, FocusSession } from '../types';

interface FocusTimerProps {
  linkedGoalId?: string;
  linkedGoalTitle?: string;
  onSessionComplete?: (session: FocusSession) => void;
  compact?: boolean;
}

/**
 * Format seconds to MM:SS display
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * FocusTimer Component
 * Displays a Pomodoro-style timer with controls
 */
export const FocusTimer: React.FC<FocusTimerProps> = ({
  linkedGoalId,
  linkedGoalTitle,
  onSessionComplete,
  compact = false,
}) => {
  const theme = useTheme();
  const [timerState, setTimerState] = useState<FocusTimerState>('idle');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [sessionType, setSessionType] = useState<'work' | 'shortBreak' | 'longBreak' | null>(null);
  
  // Keep screen awake during active timer
  useKeepAwake();

  // Calculate progress percentage
  const progress = totalDuration > 0 ? 1 - (timeRemaining / totalDuration) : 0;

  // Set up timer callbacks
  useEffect(() => {
    focusTimerService.onTick((remaining, state) => {
      setTimeRemaining(remaining);
      setTimerState(state);
    });

    focusTimerService.onStateChange((state) => {
      setTimerState(state);
      if (state === 'idle') {
        setTimeRemaining(0);
        setTotalDuration(0);
        setSessionType(null);
      }
    });

    focusTimerService.onSessionComplete((session) => {
      if (onSessionComplete) {
        onSessionComplete(session);
      }
    });

    // Cleanup on unmount
    return () => {
      // Don't stop timer on unmount - let it run in background
    };
  }, [onSessionComplete]);

  // Handle start session
  const handleStart = useCallback(() => {
    // Get duration from settings
    const settings = require('../constants').DEFAULT_SETTINGS;
    const duration = settings.focusWorkDuration * 60;
    setTotalDuration(duration);
    setTimeRemaining(duration);
    setSessionType('work');
    
    if (linkedGoalId) {
      focusTimerService.linkToGoal(linkedGoalId);
    }
    focusTimerService.startSession(linkedGoalId);
  }, [linkedGoalId]);

  // Handle pause
  const handlePause = useCallback(() => {
    focusTimerService.pause();
  }, []);

  // Handle resume
  const handleResume = useCallback(() => {
    focusTimerService.resume();
  }, []);

  // Handle stop
  const handleStop = useCallback(() => {
    focusTimerService.stop();
    setTimeRemaining(0);
    setTotalDuration(0);
    setSessionType(null);
  }, []);

  // Handle start break
  const handleStartBreak = useCallback((isLong: boolean) => {
    const settings = require('../constants').DEFAULT_SETTINGS;
    const duration = isLong
      ? settings.focusLongBreakDuration * 60
      : settings.focusShortBreakDuration * 60;
    setTotalDuration(duration);
    setTimeRemaining(duration);
    setSessionType(isLong ? 'longBreak' : 'shortBreak');
    focusTimerService.startBreak(isLong);
  }, []);

  // Handle skip break
  const handleSkipBreak = useCallback(() => {
    focusTimerService.skipBreak();
  }, []);

  // Colors based on session type
  const getSessionColor = () => {
    switch (sessionType) {
      case 'work':
        return theme.colors.primary;
      case 'shortBreak':
        return theme.colors.secondary;
      case 'longBreak':
        return theme.colors.tertiary;
      default:
        return theme.colors.primary;
    }
  };

  const getSessionLabel = () => {
    switch (sessionType) {
      case 'work':
        return 'Focus Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Ready to Focus';
    }
  };

  if (compact) {
    return (
      <Surface style={[styles.compactContainer, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
        <View style={styles.compactContent}>
          <View style={styles.compactLeft}>
            <Text variant="labelMedium" style={{ color: getSessionColor() }}>
              {getSessionLabel()}
            </Text>
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
              {formatTime(timeRemaining)}
            </Text>
          </View>
          <View style={styles.compactControls}>
            {timerState === 'idle' ? (
              <IconButton
                icon="play-circle"
                iconColor={theme.colors.primary}
                size={40}
                onPress={handleStart}
              />
            ) : timerState === 'running' || timerState === 'break' ? (
              <>
                <IconButton
                  icon="pause"
                  iconColor={theme.colors.onSurfaceVariant}
                  size={28}
                  onPress={handlePause}
                />
                <IconButton
                  icon="stop"
                  iconColor={theme.colors.error}
                  size={28}
                  onPress={handleStop}
                />
              </>
            ) : (
              <IconButton
                icon="play"
                iconColor={theme.colors.primary}
                size={28}
                onPress={handleResume}
              />
            )}
          </View>
        </View>
        {timerState !== 'idle' && (
          <ProgressBar
            progress={progress}
            color={getSessionColor()}
            style={styles.compactProgress}
          />
        )}
      </Surface>
    );
  }

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={1}>
      {/* Session Type Label */}
      <View style={[styles.labelContainer, { backgroundColor: getSessionColor() + '20' }]}>
        <Text variant="labelMedium" style={{ color: getSessionColor(), fontWeight: '700' }}>
          {getSessionLabel()}
        </Text>
      </View>

      {/* Linked Goal Display */}
      {linkedGoalTitle && (
        <View style={styles.goalContainer}>
          <Text 
            variant="bodyMedium" 
            style={{ color: theme.colors.onSurfaceVariant }}
            numberOfLines={1}
          >
            Working on: {linkedGoalTitle}
          </Text>
        </View>
      )}

      {/* Timer Display */}
      <View style={styles.timerDisplay}>
        <Text 
          variant="displayLarge" 
          style={[styles.timerText, { color: theme.colors.onSurface }]}
        >
          {formatTime(timeRemaining)}
        </Text>
        
        {/* Progress Ring (simplified as bar for now) */}
        {timerState !== 'idle' && (
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={progress}
              color={getSessionColor()}
              style={styles.progressBar}
            />
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {timerState === 'idle' && (
          <>
            <IconButton
              icon="play-circle"
              iconColor={theme.colors.onPrimary}
              containerColor={theme.colors.primary}
              size={48}
              onPress={handleStart}
              mode="contained"
            />
            {sessionType === null && (
              <View style={styles.breakButtons}>
                <TouchableOpacity
                  style={[styles.breakButton, { borderColor: theme.colors.secondary }]}
                  onPress={() => handleStartBreak(false)}
                >
                  <Text variant="labelSmall" style={{ color: theme.colors.secondary }}>
                    Short Break
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.breakButton, { borderColor: theme.colors.tertiary }]}
                  onPress={() => handleStartBreak(true)}
                >
                  <Text variant="labelSmall" style={{ color: theme.colors.tertiary }}>
                    Long Break
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {timerState === 'running' && (
          <>
            <IconButton
              icon="pause"
              iconColor={theme.colors.onSecondaryContainer}
              containerColor={theme.colors.secondaryContainer}
              size={40}
              onPress={handlePause}
              mode="contained"
            />
            <IconButton
              icon="stop"
              iconColor={theme.colors.onErrorContainer}
              containerColor={theme.colors.errorContainer}
              size={40}
              onPress={handleStop}
              mode="contained"
            />
          </>
        )}

        {timerState === 'paused' && (
          <>
            <IconButton
              icon="play"
              iconColor={theme.colors.onPrimary}
              containerColor={theme.colors.primary}
              size={48}
              onPress={handleResume}
              mode="contained"
            />
            <IconButton
              icon="stop"
              iconColor={theme.colors.onErrorContainer}
              containerColor={theme.colors.errorContainer}
              size={40}
              onPress={handleStop}
              mode="contained"
            />
          </>
        )}

        {timerState === 'break' && (
          <>
            <IconButton
              icon="pause"
              iconColor={theme.colors.onSecondaryContainer}
              containerColor={theme.colors.secondaryContainer}
              size={40}
              onPress={handlePause}
              mode="contained"
            />
            <IconButton
              icon="skip-forward"
              iconColor={theme.colors.onSurfaceVariant}
              size={40}
              onPress={handleSkipBreak}
            />
          </>
        )}
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  labelContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  goalContainer: {
    marginBottom: 12,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontWeight: '200',
    letterSpacing: -2,
    fontSize: 72,
  },
  progressContainer: {
    width: '80%',
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  breakButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  breakButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  compactContainer: {
    borderRadius: 16,
    padding: 12,
    overflow: 'hidden',
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactLeft: {
    flex: 1,
  },
  compactControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactProgress: {
    height: 4,
    marginTop: 8,
    borderRadius: 2,
  },
});

export default FocusTimer;
