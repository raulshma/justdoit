import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { ThemedIcon } from './ThemedIcon';

interface VoiceNotePlayerProps {
  uri: string;
  duration?: number; // Duration in seconds
  onDelete?: () => void;
  compact?: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  uri,
  duration = 0,
  onDelete,
  compact = false,
}) => {
  const theme = useTheme();
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  
  // Derive state from player status
  const isPlaying = status.playing;
  const position = status.currentTime * 1000; // Convert to milliseconds
  const soundDuration = (status.duration || duration) * 1000; // Convert to milliseconds
  
  // Format time mm:ss
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle playback finished - reset to beginning
  useEffect(() => {
    if (status.didJustFinish) {
      player.seekTo(0);
    }
  }, [status.didJustFinish, player]);

  const handlePlayPause = async () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const progress = soundDuration > 0 ? position / soundDuration : 0;

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.colors.elevation.level2,
        borderRadius: 12,
        padding: compact ? 8 : 12
      }
    ]}>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={handlePlayPause}
          style={[
            styles.playButton,
            { backgroundColor: theme.colors.primaryContainer }
          ]}
        >
          <ThemedIcon 
            name={isPlaying ? 'pause' : 'play'} 
            size={compact ? 20 : 24} 
            themeColor="primary" 
          />
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          {!compact && (
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
              Voice Note
            </Text>
          )}
          <ProgressBar 
            progress={progress} 
            color={theme.colors.primary} 
            style={styles.progressBar}
          />
          <View style={styles.timeRow}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {formatTime(position)}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {formatTime(soundDuration)}
            </Text>
          </View>
        </View>

        {onDelete && (
          <TouchableOpacity
            onPress={onDelete}
            style={styles.deleteButton}
          >
            <ThemedIcon 
              name="delete-outline" 
              size={20} 
              themeColor="error" 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteButton: {
    padding: 8,
  },
});
