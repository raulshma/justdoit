import React, { useState, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { ThemedIcon } from './ThemedIcon';
import { goalImageService } from '../services/goalImageService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GoalCoverImageProps {
  value?: string;
  onChange: (uri: string | undefined) => void;
  goalId: string;
  disabled?: boolean;
  compact?: boolean;  // For card thumbnail display
}

/**
 * GoalCoverImage - Hero image component for goals
 * Large cover image with gradient overlay for goal details
 */
export const GoalCoverImage = memo<GoalCoverImageProps>(({
  value,
  onChange,
  goalId,
  disabled = false,
  compact = false,
}) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Pick cover image from camera
   */
  const handleTakePhoto = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert(
          'Permission Needed',
          'Please grant camera access to take cover photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        const savedImage = await goalImageService.saveGoalImage(
          result.assets[0].uri,
          goalId,
          'cover'
        );
        onChange(savedImage.uri);
      }
    } catch (error) {
      console.error('Failed to take cover photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [goalId, onChange]);

  /**
   * Pick cover image from library
   */
  const handlePickFromLibrary = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert(
          'Permission Needed',
          'Please grant photo library access to select a cover image.',
          [{ text: 'OK' }]
        );
        return;
      }

      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        // Delete old cover image if exists
        if (value) {
          await goalImageService.deleteCoverImage(value);
        }
        
        const savedImage = await goalImageService.saveGoalImage(
          result.assets[0].uri,
          goalId,
          'cover'
        );
        onChange(savedImage.uri);
      }
    } catch (error) {
      console.error('Failed to pick cover image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [goalId, onChange, value]);

  /**
   * Remove cover image
   */
  const handleRemove = useCallback(() => {
    Alert.alert(
      'Remove Cover Image',
      'Are you sure you want to remove the cover image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (value) {
              await goalImageService.deleteCoverImage(value);
            }
            onChange(undefined);
          },
        },
      ]
    );
  }, [value, onChange]);

  /**
   * Show action menu
   */
  const handleAddImage = useCallback(() => {
    Alert.alert(
      'Cover Image',
      'Choose how to add a cover image',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'From Library', onPress: handlePickFromLibrary },
      ]
    );
  }, [handleTakePhoto, handlePickFromLibrary]);

  // Compact mode for card thumbnails
  if (compact) {
    if (!value) return null;
    return (
      <Image source={{ uri: value }} style={styles.compactImage} resizeMode="cover" />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <ThemedIcon name="image-outline" size={24} themeColor="primary" />
          <Text variant="titleSmall" style={{ marginLeft: 12, fontWeight: '600', color: theme.colors.onSurface }}>
            COVER IMAGE
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            Processing...
          </Text>
        </View>
      ) : value ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: value }} style={styles.coverImage} resizeMode="cover" />
          {!disabled && (
            <View style={styles.imageActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
                onPress={handleAddImage}
              >
                <ThemedIcon name="pencil" size={16} themeColor="primary" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.errorContainer }]}
                onPress={handleRemove}
              >
                <ThemedIcon name="delete-outline" size={16} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primaryContainer }]}
            onPress={handleTakePhoto}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <ThemedIcon name="camera" size={24} themeColor="primary" />
            <Text variant="labelMedium" style={{ color: theme.colors.primary, marginTop: 4 }}>
              Camera
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primaryContainer }]}
            onPress={handlePickFromLibrary}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <ThemedIcon name="image-multiple" size={24} themeColor="primary" />
            <Text variant="labelMedium" style={{ color: theme.colors.primary, marginTop: 4 }}>
              Library
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

GoalCoverImage.displayName = 'GoalCoverImage';

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  compactImage: {
    width: '100%',
    height: 80,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  imageActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
