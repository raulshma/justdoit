import React, { useState, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { ThemedIcon } from './ThemedIcon';

interface ImageAttachmentPickerProps {
  /** Current image URI (if any) */
  value?: string;
  /** Callback when image changes */
  onChange: (uri: string | undefined) => void;
  /** Whether the picker is disabled (read-only mode) */
  disabled?: boolean;
}

/**
 * ImageAttachmentPicker - Component for attaching images to goals
 * Supports picking from library or taking photos with the camera
 */
export const ImageAttachmentPicker = memo<ImageAttachmentPickerProps>(({
  value,
  onChange,
  disabled = false,
}) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Request camera permissions and take a photo
   */
  const handleTakePhoto = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in your device settings to take photos.',
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

      if (!result.canceled && result.assets[0]) {
        onChange(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [onChange]);

  /**
   * Request media library permissions and pick an image
   */
  const handlePickFromLibrary = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert(
          'Photo Library Permission Required',
          'Please enable photo library access in your device settings to select images.',
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

      if (!result.canceled && result.assets[0]) {
        onChange(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [onChange]);

  /**
   * Remove the attached image
   */
  const handleRemoveImage = useCallback(() => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => onChange(undefined)
        },
      ]
    );
  }, [onChange]);

  /**
   * Show action menu for choosing image source
   */
  const handleAddImage = useCallback(() => {
    Alert.alert(
      'Add Image',
      'Choose how you want to add an image',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Library', onPress: handlePickFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [handleTakePhoto, handlePickFromLibrary]);

  // Read-only mode: just show the image if present
  if (disabled) {
    if (!value) return null;
    
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View style={styles.labelRow}>
          <ThemedIcon name="image-outline" size={24} themeColor="primary" />
          <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            ATTACHED IMAGE
          </Text>
        </View>
        <Image source={{ uri: value }} style={styles.previewImage} resizeMode="cover" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
      <View style={styles.labelRow}>
        <ThemedIcon name="image-outline" size={24} themeColor="primary" />
        <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          IMAGE
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
            Processing...
          </Text>
        </View>
      ) : value ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: value }} style={styles.previewImage} resizeMode="cover" />
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
            onPress={handleRemoveImage}
            activeOpacity={0.7}
          >
            <ThemedIcon name="close" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.changeButton, { backgroundColor: theme.colors.primaryContainer }]}
            onPress={handleAddImage}
            activeOpacity={0.7}
          >
            <ThemedIcon name="pencil" size={14} themeColor="primary" />
            <Text variant="labelSmall" style={{ color: theme.colors.primary, marginLeft: 4 }}>
              Change
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primaryContainer }]}
            onPress={handleTakePhoto}
            activeOpacity={0.7}
          >
            <ThemedIcon name="camera" size={20} themeColor="primary" />
            <Text variant="labelMedium" style={[styles.buttonText, { color: theme.colors.primary }]}>
              Take Photo
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primaryContainer }]}
            onPress={handlePickFromLibrary}
            activeOpacity={0.7}
          >
            <ThemedIcon name="image-multiple" size={20} themeColor="primary" />
            <Text variant="labelMedium" style={[styles.buttonText, { color: theme.colors.primary }]}>
              From Library
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

ImageAttachmentPicker.displayName = 'ImageAttachmentPicker';

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    marginLeft: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
});
