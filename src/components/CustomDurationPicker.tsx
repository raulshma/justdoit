import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal as RNModal,
  TouchableWithoutFeedback,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { Text, useTheme, IconButton, Surface } from 'react-native-paper';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CustomDurationPickerProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (durationMinutes: number) => void;
  defaultDuration?: number;
}

const PRESET_DURATIONS = [15, 25, 30, 45, 60, 90];

/**
 * CustomDurationPicker Component
 * High-fidelity modal for selecting focus session duration
 */
export const CustomDurationPicker: React.FC<CustomDurationPickerProps> = ({
  visible,
  onDismiss,
  onSelect,
  defaultDuration = 25,
}) => {
  const theme = useTheme();
  const [selectedDuration, setSelectedDuration] = useState(defaultDuration);
  const [customValue, setCustomValue] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handlePresetSelect = (duration: number) => {
    setSelectedDuration(duration);
    setShowCustomInput(false);
    setCustomValue('');
  };

  const handleCustomToggle = () => {
    setShowCustomInput(true);
    setCustomValue(selectedDuration.toString());
  };

  const handleCustomChange = (text: string) => {
    // Only allow numeric input
    const numericText = text.replace(/[^0-9]/g, '');
    setCustomValue(numericText);
    const value = parseInt(numericText, 10);
    if (!isNaN(value) && value > 0 && value <= 180) {
      setSelectedDuration(value);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedDuration);
  };

  const handleDismiss = () => {
    setShowCustomInput(false);
    setCustomValue('');
    onDismiss();
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.modalContainer, { backgroundColor: theme.colors.elevation.level2 }]}>
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: '800' }}>
              Set Duration
            </Text>
            <IconButton icon="close" size={24} onPress={handleDismiss} />
          </View>

          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Choose how long you want to focus
          </Text>

          {/* Preset Durations Grid */}
          <View style={styles.presetsGrid}>
            {PRESET_DURATIONS.map((duration) => {
              const isSelected = selectedDuration === duration && !showCustomInput;
              return (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primaryContainer
                        : theme.colors.surface,
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.outlineVariant,
                    },
                  ]}
                  onPress={() => handlePresetSelect(duration)}
                  activeOpacity={0.7}
                >
                  <Text
                    variant="titleMedium"
                    style={{
                      color: isSelected ? theme.colors.primary : theme.colors.onSurface,
                      fontWeight: '700',
                    }}
                  >
                    {duration}
                  </Text>
                  <Text
                    variant="labelSmall"
                    style={{
                      color: isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant,
                    }}
                  >
                    min
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Input Section */}
          <View style={styles.customSection}>
            {showCustomInput ? (
              <View style={[styles.customInputContainer, { borderColor: theme.colors.primary }]}>
                <TextInput
                  value={customValue}
                  onChangeText={handleCustomChange}
                  keyboardType="number-pad"
                  placeholder="Enter minutes"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  style={[styles.customInput, { color: theme.colors.onSurface }]}
                  autoFocus
                  maxLength={3}
                />
                <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  min
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.customButton, { borderColor: theme.colors.outlineVariant }]}
                onPress={handleCustomToggle}
                activeOpacity={0.7}
              >
                <IconButton
                  icon="pencil"
                  size={18}
                  iconColor={theme.colors.primary}
                  style={{ margin: 0 }}
                />
                <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
                  Custom Duration
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Selected Duration Display */}
          <Surface style={[styles.selectedDisplay, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Session will be
            </Text>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: '800', marginTop: 4 }}>
              {selectedDuration} minutes
            </Text>
          </Surface>

          {/* Confirm Button */}
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Text variant="titleMedium" style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>
              Start Focus
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(120, 120, 120, 0.4)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  presetChip: {
    width: '30%',
    aspectRatio: 1.3,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  customSection: {
    marginBottom: 20,
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    gap: 8,
  },
  customInput: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 80,
  },
  selectedDisplay: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    elevation: 2,
  },
});

export default CustomDurationPicker;
