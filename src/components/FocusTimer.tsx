import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Text, useTheme, IconButton, Surface } from 'react-native-paper';
import { useKeepAwake } from 'expo-keep-awake';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  withDelay,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import { focusTimerService } from '../services/focusTimerService';
import { CustomDurationPicker } from './CustomDurationPicker';
import type { FocusTimerState, FocusSession } from '../types';

const { width } = Dimensions.get('window');
const TIMER_SIZE = width * 0.75;

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
 * High-fidelity Pomodoro-style timer with pulsing animations
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
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  
  // Animation values
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const progressValue = useSharedValue(0);
  
  // Entry animation values - staggered: content first, then shadow
  const contentOpacity = useSharedValue(0);
  const shadowOpacity = useSharedValue(0);

  // Keep screen awake during active timer
  useKeepAwake();
  
  // Trigger entry animation on mount
  useEffect(() => {
    // Content fades in first
    contentOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    // Shadow fades in after content with a delay
    shadowOpacity.value = withDelay(300, withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }));
  }, []);

  // Animation styles
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: glowOpacity.value,
  }));
  
  // Staggered entry style for timer content - content fades in first
  const timerContentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));
  
  // Shadow layer fades in after content
  const shadowLayerStyle = useAnimatedStyle(() => ({
    opacity: shadowOpacity.value,
  }));

  const startPulse = useCallback(() => {
    // Calculate scale needed to reach screen edges
    const maxScale = width / TIMER_SIZE;
    
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(maxScale, { duration: 3000, easing: Easing.inOut(Easing.ease) }), // Slower, deeper breath
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 3000 }), // Slightly more visible at peak
        withTiming(0.05, { duration: 3000 })
      ),
      -1,
      true
    );
  }, []);

  const stopPulse = useCallback(() => {
    pulseScale.value = withTiming(1);
    glowOpacity.value = withTiming(0);
  }, []);

  // Update animations based on state
  useEffect(() => {
    if (timerState === 'running' || timerState === 'break') {
      startPulse();
    } else {
      stopPulse();
    }
  }, [timerState]);

  // Set up timer callbacks
  useEffect(() => {
    focusTimerService.onTick((remaining, state) => {
      setTimeRemaining(remaining);
      setTimerState(state);
      
      // Update progress animation
      if (totalDuration > 0) {
        progressValue.value = withTiming(1 - remaining / totalDuration, { duration: 1000 });
      }
    });

    focusTimerService.onStateChange((state) => {
      setTimerState(state);
      if (state === 'idle') {
        setTimeRemaining(0);
        setTotalDuration(0);
        setSessionType(null);
        progressValue.value = 0;
      }
    });

    focusTimerService.onSessionComplete((session) => {
      if (onSessionComplete) {
        onSessionComplete(session);
      }
    });

    // Cleanup
    return () => {
    };
  }, [onSessionComplete, totalDuration]);

  // Handle start session - show duration picker
  const handleStartPress = useCallback(() => {
    setShowDurationPicker(true);
  }, []);

  // Handle duration select and start session
  const handleDurationSelect = useCallback((durationMinutes: number) => {
    setShowDurationPicker(false);
    const duration = durationMinutes * 60;
    setTotalDuration(duration);
    setTimeRemaining(duration);
    setSessionType('work');
    
    if (linkedGoalId) {
      focusTimerService.linkToGoal(linkedGoalId);
    }
    focusTimerService.startSession(linkedGoalId, durationMinutes);
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

  const getSessionColor = () => {
    switch (sessionType) {
      case 'work': return theme.colors.primary;
      case 'shortBreak': return theme.colors.tertiary; // More distinct for breaks
      case 'longBreak': return theme.colors.secondary;
      default: return theme.colors.primary;
    }
  };

  const getSessionLabel = () => {
    switch (sessionType) {
      case 'work': return 'DEEP WORK';
      case 'shortBreak': return 'SHORT BREAK';
      case 'longBreak': return 'LONG BREAK';
      default: return 'READY TO FOCUS';
    }
  };

  if (compact) {
    return (
      <Surface style={[styles.compactContainer, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
        <View style={styles.compactContent}>
          <View style={styles.compactLeft}>
            <Text variant="labelSmall" style={{ color: getSessionColor(), fontWeight: '700', letterSpacing: 1 }}>
              {getSessionLabel()}
            </Text>
            <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
              {formatTime(timeRemaining)}
            </Text>
          </View>
          <View style={styles.compactControls}>
            {timerState === 'idle' ? (
              <IconButton icon="play" iconColor={theme.colors.primary} size={32} onPress={handleStartPress} />
            ) : timerState === 'running' || timerState === 'break' ? (
              <IconButton icon="pause" iconColor={theme.colors.onSurface} size={28} onPress={handlePause} />
            ) : (
              <IconButton icon="play" iconColor={theme.colors.primary} size={28} onPress={handleResume} />
            )}
          </View>
        </View>
      </Surface>
    );
  }

  return (
    <View style={styles.container}>
      {/* Timer Circle Container */}
      <View style={[styles.timerCircleContainer, { height: TIMER_SIZE, width: TIMER_SIZE }]}>
        {/* Pulsing Background */}
        <Animated.View 
          style={[
            StyleSheet.absoluteFill, 
            { 
              backgroundColor: getSessionColor(),
              borderRadius: TIMER_SIZE / 2,
            },
            pulseStyle
          ]} 
        />
        
        {/* Shadow Layer - fades in after content */}
        <Animated.View 
          style={[
            styles.timerShadow, 
            { backgroundColor: theme.colors.background },
            shadowLayerStyle
          ]} 
        />
        
        {/* Timer Content - fades in first */}
        <Animated.View style={[styles.timerContent, { backgroundColor: theme.colors.background }, timerContentAnimatedStyle]}>
          <Text variant="labelMedium" style={[styles.sessionLabel, { color: getSessionColor() }]}>
            {getSessionLabel()}
          </Text>
          
          <Text 
            variant="displayLarge" 
            style={[
              styles.timerText, 
              { color: theme.colors.onBackground }
            ]}
          >
            {formatTime(timeRemaining)}
          </Text>

          {linkedGoalTitle && (
            <View style={styles.linkedGoalBadge}>
              <Text 
                variant="labelSmall" 
                style={{ color: theme.colors.onSurfaceVariant }} 
                numberOfLines={1}
              >
                {linkedGoalTitle}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {timerState === 'idle' && (
          <View style={styles.idleControls}>
            <TouchableOpacity 
              style={[styles.mainButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleStartPress}
              activeOpacity={0.8}
            >
              <Text variant="titleMedium" style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>
                START FOCUS
              </Text>
            </TouchableOpacity>

            <View style={styles.breakOptions}>
               <TouchableOpacity 
                 onPress={() => handleStartBreak(false)}
                 style={[styles.breakChip, { borderColor: theme.colors.outline }]}
               >
                 <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Short Break</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 onPress={() => handleStartBreak(true)}
                 style={[styles.breakChip, { borderColor: theme.colors.outline }]}
               >
                 <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Long Break</Text>
               </TouchableOpacity>
            </View>
          </View>
        )}

        {(timerState === 'running' || timerState === 'break') && (
          <View style={styles.activeControls}>
            <IconButton
              icon="pause"
              mode="contained-tonal"
              size={44}
              iconColor={theme.colors.onPrimaryContainer}
              containerColor={theme.colors.primaryContainer}
              onPress={handlePause}
              style={styles.controlBtn}
            />
            {timerState === 'break' && (
              <IconButton
                icon="skip-forward"
                mode="outlined"
                size={32}
                iconColor={theme.colors.onSurface}
                onPress={handleSkipBreak}
                style={styles.controlBtn}
              />
            )}
            <IconButton
              icon="stop"
              mode="outlined"
              size={32}
              iconColor={theme.colors.error}
              onPress={handleStop}
              style={[styles.controlBtn, { borderColor: theme.colors.error }]}
            />
          </View>
        )}

        {timerState === 'paused' && (
          <View style={styles.activeControls}>
            <IconButton
              icon="play"
              mode="contained"
              size={44}
              iconColor={theme.colors.onPrimary}
              containerColor={theme.colors.primary}
              onPress={handleResume}
              style={styles.controlBtn}
            />
            <IconButton
              icon="stop"
              mode="outlined"
              size={32}
              iconColor={theme.colors.error}
              onPress={handleStop}
              style={styles.controlBtn}
            />
          </View>
        )}
      </View>

      {/* Duration Picker Modal */}
      <CustomDurationPicker
        visible={showDurationPicker}
        onDismiss={() => setShowDurationPicker(false)}
        onSelect={handleDurationSelect}
        defaultDuration={25}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  timerCircleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  timerContent: {
    width: '92%',
    height: '92%',
    borderRadius: 999, // circle
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timerShadow: {
    position: 'absolute',
    width: '92%',
    height: '92%',
    borderRadius: 999,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    zIndex: 1,
  },
  sessionLabel: {
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
    opacity: 0.8,
  },
  timerText: {
    fontWeight: '800',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    fontSize: 64, // smaller than 72 to fit nicely
  },
  linkedGoalBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    maxWidth: '80%',
  },
  controlsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  idleControls: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  mainButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 32,
    elevation: 2,
  },
  breakOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  breakChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  controlBtn: {
    margin: 0,
  },
  compactContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  compactContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactLeft: {
    gap: 4,
  },
  compactControls: {
    flexDirection: 'row',
  },
});

export default FocusTimer;
