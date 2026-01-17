import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, Surface, Icon } from 'react-native-paper';
import type { AmbientSound } from '../types';

interface AmbientSoundPickerProps {
  selectedSound: AmbientSound;
  onSoundChange: (sound: AmbientSound) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  disabled?: boolean;
}

interface SoundOption {
  id: AmbientSound;
  label: string;
  icon: string;
  description: string;
}

const SOUND_OPTIONS: SoundOption[] = [
  { id: 'none', label: 'Silence', icon: 'volume-off', description: 'No sound' },
  { id: 'rain', label: 'Rain', icon: 'weather-rainy', description: 'Gentle rainfall' },
  { id: 'forest', label: 'Forest', icon: 'forest', description: 'Nature sounds' },
  { id: 'cafe', label: 'Café', icon: 'coffee', description: 'Coffee shop' },
  { id: 'waves', label: 'Waves', icon: 'waves', description: 'Ocean sounds' },
];

/**
 * AmbientSoundPicker Component
 * Allows selection of ambient sounds for focus sessions
 */
export const AmbientSoundPicker: React.FC<AmbientSoundPickerProps> = ({
  selectedSound,
  onSoundChange,
  volume,
  onVolumeChange,
  disabled = false,
}) => {
  const theme = useTheme();

  const renderSoundCard = (option: SoundOption) => {
    const isSelected = selectedSound === option.id;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.soundCard,
          {
            backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
            borderColor: isSelected ? theme.colors.primary : 'transparent',
            opacity: disabled && option.id !== 'none' ? 0.5 : 1,
          },
        ]}
        onPress={() => !disabled && onSoundChange(option.id)}
        activeOpacity={0.7}
        disabled={disabled && option.id !== 'none'}
      >
        <Icon
          source={option.icon}
          size={28}
          color={isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant}
        />
        <Text
          variant="labelMedium"
          style={{
            color: isSelected ? theme.colors.primary : theme.colors.onSurface,
            fontWeight: isSelected ? '700' : '500',
            marginTop: 8,
          }}
        >
          {option.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={0}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
          Ambient Sounds
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Background audio while focusing
        </Text>
      </View>

      <View style={styles.soundGrid}>
        {SOUND_OPTIONS.map(renderSoundCard)}
      </View>

      {selectedSound !== 'none' && (
        <View style={styles.volumeContainer}>
          <View style={styles.volumeHeader}>
            <Icon source="volume-medium" size={20} color={theme.colors.onSurfaceVariant} />
            <Text
              variant="labelMedium"
              style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}
            >
              Volume
            </Text>
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.primary, marginLeft: 'auto' }}
            >
              {Math.round(volume * 100)}%
            </Text>
          </View>
          <View style={styles.volumeRow}>
            {[0.25, 0.5, 0.75, 1].map((v) => (
              <TouchableOpacity
                key={v}
                style={[
                  styles.volumeButton,
                  {
                    backgroundColor:
                      volume >= v ? theme.colors.primary : theme.colors.surfaceVariant,
                  },
                ]}
                onPress={() => onVolumeChange(v)}
              />
            ))}
          </View>
        </View>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  soundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  soundCard: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    minWidth: 60,
    flex: 1,
    maxWidth: 80,
  },
  volumeContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  volumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  volumeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  volumeButton: {
    flex: 1,
    height: 24,
    borderRadius: 12,
  },
});

export default AmbientSoundPicker;
